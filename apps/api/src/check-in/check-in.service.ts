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
};

@Injectable()
export class CheckInService {
  constructor(private readonly prisma: PrismaService) {}

  /** Xử lý một lượt quét và luôn ghi lại CheckInAttempt, kể cả lượt bị từ chối. */
  async checkIn(dto: CheckInDto, operatorId: string) {
    await this.prisma.event.findUniqueOrThrow({ where: { id: dto.eventId }, select: { id: true } });
    const method = dto.method ?? CheckInMethod.QR;
    const code = dto.code.trim();

    const device = dto.deviceCode
      ? await this.prisma.device.findUnique({ where: { code: dto.deviceCode }, select: { id: true } })
      : null;

    const ticket = await this.findTicket(method, code);
    let result: CheckInResult;
    let checkedInAt: Date | null = ticket?.checkedInAt ?? null;

    if (!ticket) {
      result = CheckInResult.INVALID_CODE;
    } else if (ticket.registration.eventId !== dto.eventId) {
      result = CheckInResult.WRONG_EVENT;
    } else if (ticket.registration.status !== RegistrationStatus.CONFIRMED) {
      result = CheckInResult.NOT_ELIGIBLE;
    } else {
      // Cập nhật có điều kiện để hai máy quét cùng lúc không thể cùng check-in một vé.
      const now = new Date();
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
      message: MESSAGES[result],
      checkedInAt,
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
      notEligible: count(CheckInResult.NOT_ELIGIBLE),
      windowMinutes: windowMinutes ?? spanMinutes,
    };
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
