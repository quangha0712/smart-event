import { Injectable } from "@nestjs/common";
import { CheckInMethod, CheckInResult, RegistrationStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";
import { verifyTicketCode } from "../tickets/ticket-code";
import { CheckInDto } from "./check-in.dto";

const MESSAGES: Record<CheckInResult, string> = {
  ACCEPTED: "Check-in thành công",
  DUPLICATE: "Vé này đã check-in trước đó",
  INVALID_CODE: "Mã vé không hợp lệ",
  WRONG_EVENT: "Vé không thuộc sự kiện này",
  NOT_ELIGIBLE: "Đăng ký chưa được xác nhận hoặc đã huỷ",
  OUT_OF_HOURS: "Ngoài giờ check-in",
};

/** Cổng check-in mở trước giờ bắt đầu sự kiện bấy nhiêu phút (đổi bằng CHECKIN_OPEN_BEFORE_MINUTES). */
export const CHECKIN_OPEN_BEFORE_MINUTES = Number(process.env.CHECKIN_OPEN_BEFORE_MINUTES ?? 120);

const vnTime = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

/** Khoảng được phép check-in: từ (bắt đầu − N phút) đến khi sự kiện kết thúc. */
export function checkInWindow(event: { startsAt: Date; endsAt: Date }) {
  return { opensAt: new Date(event.startsAt.getTime() - CHECKIN_OPEN_BEFORE_MINUTES * 60_000), closesAt: event.endsAt };
}

@Injectable()
export class CheckInService {
  constructor(private readonly prisma: PrismaService) {}

  /** Xử lý một lượt quét và luôn ghi lại CheckInAttempt, kể cả lượt bị từ chối. */
  async checkIn(dto: CheckInDto, operatorId: string) {
    const event = await this.prisma.event.findUniqueOrThrow({ where: { id: dto.eventId }, select: { startsAt: true, endsAt: true } });
    const window = checkInWindow(event);
    const method = dto.method ?? CheckInMethod.QR;
    const code = dto.code.trim();

    const device = dto.deviceCode
      ? await this.prisma.device.findUnique({ where: { code: dto.deviceCode }, select: { id: true } })
      : null;

    const ticket = await this.findTicket(method, code);
    let result: CheckInResult;
    let checkedInAt: Date | null = ticket?.checkedInAt ?? null;
    let message: string | null = null;
    const now = new Date();

    if (!ticket) {
      result = CheckInResult.INVALID_CODE;
    } else if (ticket.registration.eventId !== dto.eventId) {
      result = CheckInResult.WRONG_EVENT;
    } else if (ticket.registration.status !== RegistrationStatus.CONFIRMED) {
      result = CheckInResult.NOT_ELIGIBLE;
    } else if (ticket.checkedInAt) {
      // Đã check-in thì báo trùng (hữu ích hơn "ngoài giờ"), kể cả khi quét ngoài giờ.
      result = CheckInResult.DUPLICATE;
    } else if (now < window.opensAt || now > window.closesAt) {
      // Ngoài giờ: không đánh dấu vé, chỉ ghi lại lượt quét.
      result = CheckInResult.OUT_OF_HOURS;
      message =
        now < window.opensAt
          ? `Chưa tới giờ check-in – cổng mở lúc ${vnTime.format(window.opensAt)}`
          : `Sự kiện đã kết thúc lúc ${vnTime.format(window.closesAt)}`;
    } else {
      // Cập nhật có điều kiện để hai máy quét cùng lúc không thể cùng check-in một vé.
      const { count } = await this.prisma.ticket.updateMany({
        where: { id: ticket.id, checkedInAt: null },
        data: { checkedInAt: now },
      });
      result = count === 1 ? CheckInResult.ACCEPTED : CheckInResult.DUPLICATE;
      if (count === 1) checkedInAt = now;
      else checkedInAt = (await this.prisma.ticket.findUnique({ where: { id: ticket.id } }))?.checkedInAt ?? null;
    }

    await this.prisma.checkInAttempt.create({
      data: {
        eventId: dto.eventId,
        ticketId: ticket?.id,
        deviceId: device?.id,
        operatorId,
        scannedCode: code.slice(0, 191),
        method,
        result,
        note: dto.deviceCode && !device ? `Thiết bị không xác định: ${dto.deviceCode}`.slice(0, 255) : undefined,
      },
    });

    return {
      result,
      accepted: result === CheckInResult.ACCEPTED,
      message: message ?? MESSAGES[result],
      checkedInAt,
      checkInWindow: window,
      attendee: ticket && result !== CheckInResult.INVALID_CODE ? { fullName: ticket.registration.user.fullName } : null,
    };
  }

  /** Số liệu tổng hợp từ CheckInAttempt, dùng cho dashboard và AI check-in-analysis. */
  async stats(eventId: string, windowMinutes?: number) {
    await this.prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { id: true } });
    const since = windowMinutes ? new Date(Date.now() - windowMinutes * 60_000) : undefined;
    const where = { eventId, createdAt: since ? { gte: since } : undefined };

    const [groups, range] = await Promise.all([
      this.prisma.checkInAttempt.groupBy({ by: ["result"], where, _count: { _all: true } }),
      this.prisma.checkInAttempt.aggregate({ where, _min: { createdAt: true }, _max: { createdAt: true } }),
    ]);
    const count = (r: CheckInResult) => groups.find((g) => g.result === r)?._count._all ?? 0;

    const spanMinutes =
      range._min.createdAt && range._max.createdAt
        ? Math.max(1, Math.ceil((range._max.createdAt.getTime() - range._min.createdAt.getTime()) / 60_000))
        : 0;

    return {
      eventId,
      totalAttempts: groups.reduce((sum, g) => sum + g._count._all, 0),
      accepted: count(CheckInResult.ACCEPTED),
      repeatedScans: count(CheckInResult.DUPLICATE),
      invalidCodes: count(CheckInResult.INVALID_CODE) + count(CheckInResult.WRONG_EVENT),
      notEligible: count(CheckInResult.NOT_ELIGIBLE) + count(CheckInResult.OUT_OF_HOURS),
      windowMinutes: windowMinutes ?? spanMinutes,
    };
  }

  /** Lấy số liệu phân tích theo khoảng thời gian tuyệt đối, dùng log của schema hiện tại. */
  async getAnalysisSummary(eventId: string, from: Date, to: Date) {
    await this.prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { id: true } });
    const attempts = await this.prisma.checkInAttempt.findMany({
      where: { eventId, createdAt: { gte: from, lte: to } },
      select: { ticketId: true, result: true },
      take: 10_000,
    });
    const accepted = attempts.filter((attempt) => attempt.result === CheckInResult.ACCEPTED).length;
    const repeatedScans = attempts.filter((attempt) => attempt.result === CheckInResult.DUPLICATE).length;
    const invalidCodes = attempts.filter((attempt) =>
      attempt.result === CheckInResult.INVALID_CODE || attempt.result === CheckInResult.WRONG_EVENT,
    ).length;
    const duplicatesByTicket = new Map<string, number>();
    for (const attempt of attempts) {
      if (attempt.ticketId && attempt.result === CheckInResult.DUPLICATE) {
        duplicatesByTicket.set(attempt.ticketId, (duplicatesByTicket.get(attempt.ticketId) ?? 0) + 1);
      }
    }
    return {
      totalAttempts: attempts.length,
      accepted,
      repeatedScans,
      invalidCodes,
      ticketsWithRepeatedScans: [...duplicatesByTicket.values()].filter((count) => count > 0).length,
      ticketsWithHighRepeatCount: [...duplicatesByTicket.values()].filter((count) => count >= 3).length,
    };
  }

  /** Trả lịch sử từng vé cho LLM, chuyển trạng thái DB sang thuật ngữ phân tích của TV4. */
  async getTicketAnalysisPatterns(eventId: string, from: Date, to: Date) {
    const attempts = await this.prisma.checkInAttempt.findMany({
      where: { eventId, ticketId: { not: null }, createdAt: { gte: from, lte: to } },
      select: {
        ticketId: true,
        result: true,
        device: { select: { code: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
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

    return ticketIds.map((ticketId) => {
      const ticketAttempts = attempts.filter((attempt) => attempt.ticketId === ticketId);
      const acceptedAt = checkedInAtByTicketId.get(ticketId);
      const hasAcceptedInRange = ticketAttempts.some((attempt) => attempt.result === CheckInResult.ACCEPTED);
      const normalizedAttempts = [
        ...(!hasAcceptedInRange && acceptedAt && acceptedAt < from
          ? [{ scannedAt: acceptedAt.toISOString(), status: "ACCEPTED" as const, deviceId: "legacy-unknown" }]
          : []),
        ...ticketAttempts.map((attempt) => ({
          scannedAt: attempt.createdAt.toISOString(),
          status: attempt.result === CheckInResult.ACCEPTED
            ? "ACCEPTED" as const
            : attempt.result === CheckInResult.DUPLICATE
              ? "ALREADY_USED" as const
              : attempt.result === CheckInResult.NOT_ELIGIBLE || attempt.result === CheckInResult.OUT_OF_HOURS
                ? "NOT_ELIGIBLE" as const
                : "INVALID" as const,
          deviceId: attempt.device?.code ?? "legacy-unknown",
        })),
      ];
      return { ticketRef: ticketId, attempts: normalizedAttempts };
    }).filter((pattern) => pattern.attempts.length > 0);
  }

  private findTicket(method: CheckInMethod, code: string) {
    const include = { registration: { select: { eventId: true, status: true, user: { select: { fullName: true } } } } };
    if (method === CheckInMethod.NFC) {
      return this.prisma.ticket.findUnique({ where: { nfcUid: code.slice(0, 64) }, include });
    }
    const ticketId = verifyTicketCode(code);
    if (!ticketId) return Promise.resolve(null);
    // So khớp cả qrCode để mã cũ bị thu hồi / cấp lại không dùng được nữa.
    return this.prisma.ticket.findFirst({ where: { id: ticketId, qrCode: code }, include });
  }
}
