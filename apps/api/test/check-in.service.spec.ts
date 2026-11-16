import { CheckInMethod, CheckInResult, RegistrationStatus } from "@prisma/client";
import { PrismaService } from "../src/prisma/prisma.module";
import { CheckInService } from "../src/check-in/check-in.service";
import { signTicketCode } from "../src/tickets/ticket-code";

describe("CheckInService", () => {
  const previousSecret = process.env.TICKET_QR_SECRET;
  let qrCode: string;

  beforeAll(() => {
    process.env.TICKET_QR_SECRET = "test-only-secret-that-is-long-enough-for-hmac-signing";
    qrCode = signTicketCode("ticket-1");
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.TICKET_QR_SECRET;
    else process.env.TICKET_QR_SECRET = previousSecret;
  });

  const makeService = (options: { ticket: Record<string, any> | null; updateCount?: number }) => {
    const ticket = {
      findFirst: jest.fn().mockResolvedValue(options.ticket),
      updateMany: jest.fn().mockResolvedValue({ count: options.updateCount ?? 1 }),
      findUnique: jest.fn().mockResolvedValue(options.ticket),
    };
    const prisma = {
      event: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "event-1" }) },
      device: { findUnique: jest.fn().mockResolvedValue({ id: "device-north" }) },
      ticket,
      checkInAttempt: { create: jest.fn().mockImplementation(({ data }) => ({ id: "attempt-1", ...data })) },
    };
    return {
      service: new CheckInService(prisma as unknown as PrismaService),
      prisma,
    };
  };

  it("accepts a valid signed ticket once and records the scanner device", async () => {
    const { service, prisma } = makeService({
      ticket: {
        id: "ticket-1",
        checkedInAt: null,
        registration: { eventId: "event-1", status: RegistrationStatus.CONFIRMED, user: { fullName: "Attendee" } },
      },
    });

    const result = await service.checkIn({ eventId: "event-1", code: qrCode, method: CheckInMethod.QR, deviceCode: "scanner-north" }, "operator-1");

    expect(result.result).toBe(CheckInResult.ACCEPTED);
    expect(prisma.checkInAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ticketId: "ticket-1", deviceId: "device-north", result: CheckInResult.ACCEPTED }),
    });
  });

  it("records a repeated scan as DUPLICATE and does not mark the ticket accepted again", async () => {
    const { service, prisma } = makeService({
      ticket: {
        id: "ticket-1",
        checkedInAt: new Date("2026-11-15T08:00:00.000Z"),
        registration: { eventId: "event-1", status: RegistrationStatus.CONFIRMED, user: { fullName: "Attendee" } },
      },
      updateCount: 0,
    });

    const result = await service.checkIn({ eventId: "event-1", code: qrCode, method: CheckInMethod.QR }, "operator-1");

    expect(result.result).toBe(CheckInResult.DUPLICATE);
    expect(prisma.ticket.updateMany).toHaveBeenCalled();
    expect(prisma.checkInAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ result: CheckInResult.DUPLICATE }),
    });
  });

  it("records an invalid signed QR payload as INVALID_CODE", async () => {
    const { service, prisma } = makeService({ ticket: null });

    const result = await service.checkIn({ eventId: "event-1", code: "not-a-signed-qr", deviceCode: "scanner-north" }, "operator-1");

    expect(result.result).toBe(CheckInResult.INVALID_CODE);
    expect(prisma.checkInAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ticketId: undefined, deviceId: "device-north", result: CheckInResult.INVALID_CODE }),
    });
  });
});
