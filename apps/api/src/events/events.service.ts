import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventMemberRole, EventStatus, Prisma, UserRole } from "@prisma/client";
import type { AuthUser } from "../auth/auth.decorators";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PrismaService } from "../prisma/prisma.module";
import { PUBLIC_SPEAKER_SELECT } from "../schedules/schedules.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

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
        // Trang công khai: không trả email diễn giả.
        schedules: { orderBy: { startsAt: "asc" }, include: { speakers: { select: PUBLIC_SPEAKER_SELECT } } },
        speakers: { orderBy: { fullName: "asc" }, select: PUBLIC_SPEAKER_SELECT },
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

  /**
   * Sửa thông tin sự kiện (quyền: Chủ sự kiện / Đồng tổ chức – đã kiểm tra ở EventMemberGuard).
   * Không sửa sự kiện đã huỷ / đã kết thúc; sức chứa không được nhỏ hơn số đăng ký đã xác nhận.
   */
  async update(id: string, input: UpdateEventDto, user: AuthUser) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.event.findUnique({ where: { id } });
      if (!current) throw new NotFoundException("Không tìm thấy sự kiện");
      if (current.status === EventStatus.CANCELLED || current.status === EventStatus.COMPLETED) {
        throw new ConflictException("Sự kiện đã huỷ hoặc đã kết thúc, không thể sửa");
      }

      if (input.name !== undefined && !input.name?.trim()) throw new BadRequestException("Cần cung cấp tên sự kiện");
      const startsAt = input.startsAt ? new Date(input.startsAt) : current.startsAt;
      const endsAt = input.endsAt ? new Date(input.endsAt) : current.endsAt;
      if (isNaN(startsAt.valueOf()) || isNaN(endsAt.valueOf())) throw new BadRequestException("Thời gian không hợp lệ");
      if (endsAt <= startsAt) throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");

      if (input.capacity !== undefined && input.capacity !== null) {
        const confirmed = await tx.registration.count({ where: { eventId: id, status: "CONFIRMED" } });
        if (input.capacity < confirmed) {
          throw new BadRequestException(`Sức chứa không được nhỏ hơn số người đã đăng ký (${confirmed})`);
        }
      }

      const data: Prisma.EventUpdateInput = {
        name: input.name?.trim(),
        // null hoặc chuỗi rỗng = xoá nội dung; không gửi = giữ nguyên.
        description: input.description === undefined ? undefined : input.description?.trim() || null,
        location: input.location === undefined ? undefined : input.location?.trim() || null,
        startsAt: input.startsAt ? startsAt : undefined,
        endsAt: input.endsAt ? endsAt : undefined,
        // null = không giới hạn sức chứa.
        capacity: input.capacity,
      };
      const updated = await tx.event.update({ where: { id }, data, include: summaryInclude });
      await this.auditLog.record(tx, {
        actorId: user.id,
        action: "EVENT_UPDATED",
        entityType: "Event",
        entityId: id,
        details: { eventId: id, fields: Object.keys(input) },
      });
      return updated;
    });
  }

  /**
   * Đổi trạng thái. Cho phép:
   *   DRAFT → PUBLISHED         (Chủ / Đồng tổ chức; sự kiện chưa kết thúc)
   *   PUBLISHED → DRAFT         (Chủ / Đồng tổ chức; chưa có đăng ký nào được xác nhận)
   *   PUBLISHED → COMPLETED     (Chủ / Đồng tổ chức; sau giờ kết thúc)
   *   DRAFT | PUBLISHED → CANCELLED (chỉ Chủ sự kiện hoặc ADMIN)
   * Đã huỷ / đã kết thúc là trạng thái cuối.
   */
  async changeStatus(id: string, next: EventStatus, user: AuthUser, myRole: EventMemberRole | null) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.event.findUnique({ where: { id } });
      if (!current) throw new NotFoundException("Không tìm thấy sự kiện");
      const from = current.status;
      if (from === next) return tx.event.findUniqueOrThrow({ where: { id }, include: summaryInclude });

      const now = new Date();
      const allowed =
        (from === EventStatus.DRAFT && (next === EventStatus.PUBLISHED || next === EventStatus.CANCELLED)) ||
        (from === EventStatus.PUBLISHED &&
          (next === EventStatus.DRAFT || next === EventStatus.COMPLETED || next === EventStatus.CANCELLED));
      if (!allowed) throw new BadRequestException("Không thể chuyển sự kiện sang trạng thái này");

      if (next === EventStatus.CANCELLED && user.role !== UserRole.ADMIN && myRole !== EventMemberRole.OWNER) {
        throw new ForbiddenException("Chỉ Chủ sự kiện được huỷ sự kiện");
      }
      if (next === EventStatus.PUBLISHED && current.endsAt <= now) {
        throw new BadRequestException("Sự kiện đã qua thời gian kết thúc, không thể công bố");
      }
      if (next === EventStatus.COMPLETED && current.endsAt > now) {
        throw new BadRequestException("Sự kiện chưa tới giờ kết thúc");
      }
      if (next === EventStatus.DRAFT) {
        const confirmed = await tx.registration.count({ where: { eventId: id, status: "CONFIRMED" } });
        if (confirmed > 0) {
          throw new ConflictException(`Đã có ${confirmed} người đăng ký, không chuyển về bản nháp được. Hãy huỷ sự kiện nếu không tổ chức nữa.`);
        }
      }

      const updated = await tx.event.update({ where: { id }, data: { status: next }, include: summaryInclude });
      await this.auditLog.record(tx, {
        actorId: user.id,
        action: "EVENT_STATUS_CHANGED",
        entityType: "Event",
        entityId: id,
        details: { eventId: id, from, to: next },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
