import { PrismaService } from "../src/prisma/prisma.module";
import { AuditLogService } from "../src/audit-log/audit-log.service";

describe("AuditLogService.listByEvent", () => {
  it("filters audit entries by event and time and paginates", async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: "audit-1" }]);
    const count = jest.fn().mockResolvedValue(1);
    const prisma = { auditLog: { findMany, count } };
    const service = new AuditLogService(prisma as unknown as PrismaService);
    const from = new Date("2026-11-15T08:00:00.000Z");
    const to = new Date("2026-11-15T09:00:00.000Z");

    const result = await service.listByEvent("event-1", from, to, 2, 25);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        createdAt: { gte: from, lte: to },
        details: { path: "$.eventId", equals: "event-1" },
      },
      skip: 25,
      take: 25,
    }));
    expect(result).toMatchObject({ eventId: "event-1", page: 2, pageSize: 25, total: 1 });
  });
});
