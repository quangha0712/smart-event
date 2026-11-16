import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    tx: Prisma.TransactionClient,
    entry: {
      actorId?: string;
      action: string;
      entityType: string;
      entityId?: string;
      details?: Prisma.InputJsonValue;
    },
  ) {
    return tx.auditLog.create({ data: entry });
  }

  async listByEvent(eventId: string, from: Date, to: Date, page: number, pageSize: number) {
    const where: Prisma.AuditLogWhereInput = {
      createdAt: { gte: from, lte: to },
      details: { path: "$.eventId", equals: eventId },
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, actorId: true, action: true, entityType: true, entityId: true, details: true, createdAt: true },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { eventId, from, to, page, pageSize, total, items };
  }
}
