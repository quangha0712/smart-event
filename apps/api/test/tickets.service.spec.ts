import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.module";
import { TicketsService } from "../src/tickets/tickets.service";

describe("TicketsService", () => {
  it("reports an unknown QR payload as not found", async () => {
    const prisma = { ticket: { findUnique: jest.fn().mockResolvedValue(null) } };
    const service = new TicketsService(prisma as unknown as PrismaService);

    await expect(service.getByQrCode("missing-qr")).rejects.toBeInstanceOf(NotFoundException);
  });
});
