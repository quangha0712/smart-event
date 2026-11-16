import { ConflictException } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.module";
import { AuditLogService } from "../src/audit-log/audit-log.service";
import { RegistrationsService } from "../src/registrations/registrations.service";

describe("RegistrationsService", () => {
  const event = {
    id: "event-1",
    status: "PUBLISHED",
    startsAt: new Date(Date.now() + 60 * 60_000),
    capacity: 1,
    registeredCount: 1,
  };
  const makeService = (tx: Record<string, any>) => {
    const prisma = { $transaction: jest.fn((callback: (transaction: unknown) => unknown) => callback(tx)) };
    const auditLog = { record: jest.fn() };
    return new RegistrationsService(prisma as unknown as PrismaService, auditLog as unknown as AuditLogService);
  };

  it("rejects a duplicate active registration", async () => {
    const tx = {
      event: { findUnique: jest.fn().mockResolvedValue(event) },
      user: { findUnique: jest.fn().mockResolvedValue({ id: "user-1" }) },
      registration: { findUnique: jest.fn().mockResolvedValue({ id: "registration-1", status: "CONFIRMED" }) },
    };
    const service = makeService(tx);

    await expect(service.create("event-1", "user-1")).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects registration when capacity is full", async () => {
    const tx = {
      event: { findUnique: jest.fn().mockResolvedValue(event), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      user: { findUnique: jest.fn().mockResolvedValue({ id: "user-1" }) },
      registration: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = makeService(tx);

    await expect(service.create("event-1", "user-1")).rejects.toBeInstanceOf(ConflictException);
  });
});
