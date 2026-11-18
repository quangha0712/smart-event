import { randomBytes } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";
import { AuditLogService } from "../audit-log/audit-log.service";
import { signTicketCode } from "../tickets/ticket-code";

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  async create(eventId: string, userId: string | undefined) {
    if (!eventId || !userId?.trim()) throw new BadRequestException("eventId và userId là bắt buộc.");
    userId = userId.trim();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({ where: { id: eventId } });
        if (!event) throw new NotFoundException("Không tìm thấy sự kiện.");
        if (event.status !== "PUBLISHED") throw new ConflictException("Sự kiện chưa mở đăng ký.");
        if (event.startsAt <= new Date()) throw new ConflictException("Sự kiện đã bắt đầu, không thể đăng ký.");

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException("Không tìm thấy người dùng.");

        const existing = await tx.registration.findUnique({
          where: { userId_eventId: { userId, eventId } },
        });
        if (existing && existing.status !== "CANCELLED") {
          throw new ConflictException("Người dùng đã đăng ký sự kiện này.");
        }

        const confirmedCount = await tx.registration.count({ where: { eventId, status: "CONFIRMED" } });
        if (event.capacity !== null && confirmedCount >= event.capacity) {
          throw new ConflictException("Sự kiện đã đủ sức chứa.");
        }

        const registration = existing
          ? await tx.registration.update({
              where: { id: existing.id },
              data: { status: "CONFIRMED", createdAt: new Date() },
            })
          : await tx.registration.create({
              data: { userId, eventId, status: "CONFIRMED" },
            });

        const existingTicket = await tx.ticket.findUnique({
          where: { registrationId: registration.id },
          select: { id: true },
        });
        const ticketId = existingTicket?.id ?? randomBytes(18).toString("hex");
        const qrCode = signTicketCode(ticketId);
        const ticket = await tx.ticket.upsert({
          where: { registrationId: registration.id },
          update: { qrCode, checkedInAt: null, createdAt: new Date() },
          create: { id: ticketId, registrationId: registration.id, qrCode },
        });

        await this.auditLog.record(tx, {
          actorId: userId,
          action: existing ? "REGISTRATION_REACTIVATED" : "REGISTRATION_CREATED",
          entityType: "Registration",
          entityId: registration.id,
          details: { eventId },
        });

        return {
          id: registration.id,
          eventId,
          status: registration.status,
          createdAt: registration.createdAt,
          ticket: { id: ticket.id, qrPayload: ticket.qrCode, createdAt: ticket.createdAt },
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2034") throw new ConflictException("Có đăng ký đồng thời. Vui lòng thử lại.");
        if (error.code === "P2002") throw new ConflictException("Người dùng đã đăng ký sự kiện này.");
      }
      throw error;
    }
  }

  async listForUser(userId: string) {
    const rows = await this.prisma.registration.findMany({
      where: { userId },
      orderBy: { event: { startsAt: "asc" } },
      include: {
        ticket: true,
        event: { select: { id: true, name: true, startsAt: true, endsAt: true, location: true, status: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      event: r.event,
      ticket: r.ticket
        ? { id: r.ticket.id, qrPayload: r.status === "CONFIRMED" ? r.ticket.qrCode : null, checkedInAt: r.ticket.checkedInAt }
        : null,
    }));
  }

  async getOne(eventId: string, registrationId: string) {
    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, eventId },
      include: { ticket: true, event: { select: { name: true, startsAt: true, endsAt: true, location: true } } },
    });
    if (!registration) throw new NotFoundException("Không tìm thấy đăng ký.");
    return {
      id: registration.id,
      status: registration.status,
      createdAt: registration.createdAt,
      event: registration.event,
      ticket: registration.ticket
        ? {
            id: registration.ticket.id,
            qrPayload: registration.status === "CONFIRMED" ? registration.ticket.qrCode : null,
            checkedInAt: registration.ticket.checkedInAt,
          }
        : null,
    };
  }

  async cancel(eventId: string, registrationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findFirst({
        where: { id: registrationId, eventId },
        include: { ticket: true },
      });
      if (!registration) throw new NotFoundException("Không tìm thấy đăng ký.");
      if (registration.status === "CANCELLED") throw new ConflictException("Đăng ký đã được hủy.");
      if (registration.ticket?.checkedInAt) throw new ConflictException("Không thể hủy đăng ký đã check-in.");

      const updated = await tx.registration.updateMany({
        where: { id: registration.id, status: "CONFIRMED" },
        data: { status: "CANCELLED" },
      });
      if (updated.count !== 1) throw new ConflictException("Đăng ký đã thay đổi; hãy tải lại trước khi hủy.");
      await this.auditLog.record(tx, {
        action: "REGISTRATION_CANCELLED",
        entityType: "Registration",
        entityId: registration.id,
        details: { eventId },
      });
      return { id: registration.id, eventId, status: "CANCELLED" };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
