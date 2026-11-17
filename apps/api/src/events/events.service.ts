import { BadRequestException, Injectable } from "@nestjs/common";
import { EventMemberRole, EventStatus, UserRole } from "@prisma/client";
import type { AuthUser } from "../auth/auth.decorators";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PrismaService } from "../prisma/prisma.module";
import { CreateEventDto } from "./dto/create-event.dto";

const summaryInclude = { _count: { select: { registrations: true } } } as const;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * ADMIN: mọi sự kiện. ORGANIZER: chỉ sự kiện mình là thành viên, kèm `myRole`.
   * Khách / người tham dự: mọi sự kiện trừ bản nháp (DRAFT).
   */
  async list(user?: AuthUser) {
    if (user?.role === UserRole.ADMIN) {
      return this.prisma.event.findMany({ orderBy: { startsAt: "asc" }, include: summaryInclude });
    }
    if (user?.role === UserRole.ORGANIZER) {
      const rows = await this.prisma.event.findMany({
        where: { members: { some: { userId: user.id } } },
        orderBy: { startsAt: "asc" },
        include: { ...summaryInclude, members: { where: { userId: user.id }, select: { role: true } } },
      });
      return rows.map(({ members, ...event }) => ({ ...event, myRole: members[0]?.role ?? null }));
    }
    return this.prisma.event.findMany({
      where: { status: { not: EventStatus.DRAFT } },
      orderBy: { startsAt: "asc" },
      include: summaryInclude,
    });
  }

  /** Bản nháp chỉ trả cho ADMIN và thành viên ban tổ chức của sự kiện; người khác nhận null (→ 404). */
  async getById(id: string, user?: AuthUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        schedules: { orderBy: { startsAt: "asc" }, include: { speakers: true } },
        speakers: { orderBy: { fullName: "asc" } },
        ...summaryInclude,
      },
    });
    if (!event || event.status !== EventStatus.DRAFT || user?.role === UserRole.ADMIN) return event;
    if (!user) return null;
    const member = await this.prisma.eventMember.findUnique({
      where: { eventId_userId: { eventId: id, userId: user.id } },
      select: { role: true },
    });
    return member ? event : null;
  }

  /** Tạo sự kiện; người tạo tự thành Chủ sự kiện (OWNER) trong cùng một transaction. */
  async create(input: CreateEventDto, user: AuthUser) {
    const startsAt = input.startsAt ? new Date(input.startsAt) : undefined;
    const endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
    if (!input.name?.trim() || !startsAt || !endsAt || isNaN(startsAt.valueOf()) || isNaN(endsAt.valueOf())) {
      throw new BadRequestException("Cần cung cấp tên sự kiện và thời gian bắt đầu/kết thúc hợp lệ");
    }
    if (endsAt <= startsAt) throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
    if (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1)) {
      throw new BadRequestException("Sức chứa phải là số nguyên dương");
    }

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name: input.name.trim(),
          description: input.description,
          location: input.location,
          startsAt,
          endsAt,
          capacity: input.capacity,
          status: EventStatus.DRAFT,
          createdById: user.id,
          members: { create: { userId: user.id, role: EventMemberRole.OWNER } },
        },
      });
      await this.auditLog.record(tx, {
        actorId: user.id,
        action: "EVENT_CREATED",
        entityType: "Event",
        entityId: event.id,
        details: { eventId: event.id, ownerId: user.id },
      });
      return { ...event, myRole: EventMemberRole.OWNER };
    });
  }
}
