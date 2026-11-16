import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CheckInAttemptStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";
import { AuditLogService } from "../audit-log/audit-log.service";

@Injectable()
export class CheckInService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  async process(eventId: string, qrCode: string, deviceId: string) {
    if (!eventId) throw new BadRequestException("eventId là bắt buộc.");
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện.");

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { qrCode },
        include: { registration: { select: { eventId: true, status: true } } },
      });

      let status: CheckInAttemptStatus;
      let checkedInAt: Date | null = null;
      const ticketBelongsToEvent = ticket?.registration.eventId === eventId;

      if (!ticket || !ticketBelongsToEvent || ticket.registration.status !== "CONFIRMED") {
        status = CheckInAttemptStatus.INVALID;
      } else if (ticket.checkedInAt) {
        status = CheckInAttemptStatus.ALREADY_USED;
        checkedInAt = ticket.checkedInAt;
      } else {
        const now = new Date();
        const updated = await tx.ticket.updateMany({
          where: { id: ticket.id, checkedInAt: null },
          data: { checkedInAt: now },
        });
        if (updated.count === 1) {
          status = CheckInAttemptStatus.ACCEPTED;
          checkedInAt = now;
        } else {
          status = CheckInAttemptStatus.ALREADY_USED;
          const latest = await tx.ticket.findUnique({ where: { id: ticket.id }, select: { checkedInAt: true } });
          checkedInAt = latest?.checkedInAt ?? null;
        }
      }

      const attempt = await tx.checkInAttempt.create({
        data: {
          eventId,
          ticketId: ticketBelongsToEvent ? ticket?.id : null,
          deviceId,
          status,
        },
      });
      await this.auditLog.record(tx, {
        action: `CHECK_IN_${status}`,
        entityType: "CheckInAttempt",
        entityId: attempt.id,
        details: { eventId, status, deviceId },
      });

      return { attemptId: attempt.id, eventId, deviceId, result: status, checkedInAt, scannedAt: attempt.scannedAt };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async getSummary(eventId: string, from: Date, to: Date) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện.");

    const groups = await this.prisma.checkInAttempt.groupBy({
      by: ["status"],
      where: { eventId, scannedAt: { gte: from, lte: to } },
      _count: { _all: true },
    });
    const counts = new Map(groups.map((group) => [group.status, group._count._all]));
    const accepted = counts.get(CheckInAttemptStatus.ACCEPTED) ?? 0;
    const repeatedScans = counts.get(CheckInAttemptStatus.ALREADY_USED) ?? 0;
    const invalidCodes = counts.get(CheckInAttemptStatus.INVALID) ?? 0;

    const repeatedTicketGroups = await this.prisma.checkInAttempt.groupBy({
      by: ["ticketId"],
      where: {
        eventId,
        ticketId: { not: null },
        status: CheckInAttemptStatus.ALREADY_USED,
        scannedAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    });
    const ticketsWithRepeatedScans = repeatedTicketGroups.filter((group) => group._count._all >= 2).length;
    const ticketsWithHighRepeatCount = repeatedTicketGroups.filter((group) => group._count._all >= 3).length;

    return {
      eventId,
      from,
      to,
      totalAttempts: accepted + repeatedScans + invalidCodes,
      accepted,
      repeatedScans,
      invalidCodes,
      ticketsWithRepeatedScans,
      ticketsWithHighRepeatCount,
      windowMinutes: Math.max(1, Math.ceil((to.valueOf() - from.valueOf()) / 60_000)),
    };
  }

  async getTicketAnalysisPatterns(eventId: string, from: Date, to: Date) {
    const attempts = await this.prisma.checkInAttempt.findMany({
      where: { eventId, ticketId: { not: null }, scannedAt: { gte: from, lte: to } },
      select: { ticketId: true, deviceId: true, status: true, scannedAt: true },
      orderBy: { scannedAt: "asc" },
      take: 10_000,
    });
    const ticketIds = [...new Set(attempts.flatMap((attempt) => attempt.ticketId ? [attempt.ticketId] : []))];
    const tickets = ticketIds.length
      ? await this.prisma.ticket.findMany({
          where: { id: { in: ticketIds } },
          select: { id: true, checkedInAt: true },
        })
      : [];
    const checkedInAtByTicketId = new Map(tickets.map((ticket) => [ticket.id, ticket.checkedInAt]));
    const ticketPatterns = ticketIds.map((ticketId) => {
      const ticketAttempts = attempts.filter((attempt) => attempt.ticketId === ticketId);
      const acceptedAt = checkedInAtByTicketId.get(ticketId);
      const hasAcceptedAttemptInWindow = ticketAttempts.some((attempt) => attempt.status === CheckInAttemptStatus.ACCEPTED);
      const chronologicalAttempts = [
        ...(!hasAcceptedAttemptInWindow && acceptedAt && acceptedAt < from
          ? [{ scannedAt: acceptedAt.toISOString(), status: CheckInAttemptStatus.ACCEPTED, deviceId: "legacy-unknown" }]
          : []),
        ...ticketAttempts.map((attempt) => ({
          scannedAt: attempt.scannedAt.toISOString(),
          status: attempt.status,
          deviceId: attempt.deviceId,
        })),
      ];
      return {
        // Ticket IDs are opaque CUIDs and contain no attendee name, email, or QR payload.
        ticketRef: ticketId,
        attempts: chronologicalAttempts,
      };
    }).filter((pattern) => pattern.attempts.length > 0);

    return ticketPatterns;
  }
}
