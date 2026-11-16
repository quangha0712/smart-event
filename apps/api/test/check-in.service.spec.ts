import { CheckInAttemptStatus } from "@prisma/client";
import { PrismaService } from "../src/prisma/prisma.module";
import { AuditLogService } from "../src/audit-log/audit-log.service";
import { CheckInService } from "../src/check-in/check-in.service";

describe("CheckInService", () => {
  const event = { id: "event-1" };
  const makeService = (ticket: Record<string, any> | null) => {
    const tx = {
      ticket: {
        findUnique: jest.fn().mockResolvedValue(ticket),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      checkInAttempt: { create: jest.fn().mockImplementation(({ data }) => ({ id: "attempt-1", ...data, scannedAt: new Date() })) },
    };
    const prisma = {
      event: { findUnique: jest.fn().mockResolvedValue(event) },
      $transaction: jest.fn((callback: (transaction: unknown) => unknown) => callback(tx)),
    };
    const auditLog = { record: jest.fn() };
    return { service: new CheckInService(prisma as unknown as PrismaService, auditLog as unknown as AuditLogService), tx };
  };

  it("accepts a valid ticket once and records the scanner device", async () => {
    const { service, tx } = makeService({
      id: "ticket-1",
      checkedInAt: null,
      registration: { eventId: "event-1", status: "CONFIRMED" },
    });

    const result = await service.process("event-1", "qr-1", "scanner-north");

    expect(result.result).toBe(CheckInAttemptStatus.ACCEPTED);
    expect(tx.checkInAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ticketId: "ticket-1", deviceId: "scanner-north", status: "ACCEPTED" }),
    });
  });

  it("records a repeated scan as ALREADY_USED without checking in again", async () => {
    const { service, tx } = makeService({
      id: "ticket-1",
      checkedInAt: new Date("2026-11-15T08:00:00.000Z"),
      registration: { eventId: "event-1", status: "CONFIRMED" },
    });

    const result = await service.process("event-1", "qr-1", "scanner-east");

    expect(result.result).toBe(CheckInAttemptStatus.ALREADY_USED);
    expect(tx.ticket.updateMany).not.toHaveBeenCalled();
  });

  it("records unknown QR payloads as INVALID", async () => {
    const { service, tx } = makeService(null);

    const result = await service.process("event-1", "missing-qr", "scanner-east");

    expect(result.result).toBe(CheckInAttemptStatus.INVALID);
    expect(tx.checkInAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ticketId: null, deviceId: "scanner-east", status: "INVALID" }),
    });
  });
});
