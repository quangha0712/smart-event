import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByQrCode(qrCode: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        registration: {
          include: { event: { select: { id: true, name: true, startsAt: true, endsAt: true, location: true } } },
        },
      },
    });
    if (!ticket) throw new NotFoundException("Không tìm thấy vé.");
    return {
      id: ticket.id,
      valid: ticket.registration.status === "CONFIRMED",
      qrPayload: ticket.registration.status === "CONFIRMED" ? ticket.qrCode : null,
      checkedInAt: ticket.checkedInAt,
      event: ticket.registration.event,
    };
  }
}
