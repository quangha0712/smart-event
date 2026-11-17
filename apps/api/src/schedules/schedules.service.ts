import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EventStatus, Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/auth.decorators";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PrismaService } from "../prisma/prisma.module";
import { CreateScheduleItemDto, CreateSpeakerDto, UpdateScheduleItemDto, UpdateSpeakerDto } from "./schedules.dto";

/** Thông tin diễn giả công khai (không có email). Dùng chung với GET /events/:id. */
export const PUBLIC_SPEAKER_SELECT = {
  id: true,
  fullName: true,
  title: true,
  organization: true,
  bio: true,
  avatarUrl: true,
} as const;

const scheduleInclude = { speakers: { select: PUBLIC_SPEAKER_SELECT, orderBy: { fullName: "asc" } } } as const;

const timeFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

/**
 * Lịch trình (ScheduleItem) và diễn giả (Speaker) của một sự kiện.
 * Quyền (Chủ sự kiện / Đồng tổ chức) đã được EventMemberGuard kiểm tra theo :eventId; mọi truy vấn theo :id
 * đều kèm eventId để không sửa được bản ghi của sự kiện khác bằng cách đổi đường dẫn.
 */
@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ---------- Lịch trình ----------

  listSchedules(eventId: string) {
    return this.prisma.scheduleItem.findMany({ where: { eventId }, orderBy: { startsAt: "asc" }, include: scheduleInclude });
  }

  async createSchedule(eventId: string, dto: CreateScheduleItemDto, user: AuthUser) {
    const event = await this.editableEvent(eventId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.assertWithinEvent(event, startsAt, endsAt);
    const speakerIds = await this.validSpeakerIds(eventId, dto.speakerIds);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.scheduleItem.create({
        data: {
          eventId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          room: dto.room?.trim() || null,
          startsAt,
          endsAt,
          speakers: speakerIds.length ? { connect: speakerIds.map((id) => ({ id })) } : undefined,
        },
        include: scheduleInclude,
      });
      await this.audit(tx, user, "SCHEDULE_CREATED", item.id, eventId);
      return item;
    });
  }

  async updateSchedule(eventId: string, id: string, dto: UpdateScheduleItemDto, user: AuthUser) {
    const event = await this.editableEvent(eventId);
    const current = await this.prisma.scheduleItem.findFirst({ where: { id, eventId } });
    if (!current) throw new NotFoundException("Không tìm thấy phiên trong lịch trình");
    if (dto.title !== undefined && !dto.title?.trim()) throw new BadRequestException("Cần nhập tên phiên");

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
    this.assertWithinEvent(event, startsAt, endsAt);
    const speakerIds = dto.speakerIds === undefined ? undefined : await this.validSpeakerIds(eventId, dto.speakerIds);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.scheduleItem.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          // null hoặc chuỗi rỗng = xoá; không gửi = giữ nguyên.
          description: dto.description === undefined ? undefined : dto.description?.trim() || null,
          room: dto.room === undefined ? undefined : dto.room?.trim() || null,
          startsAt: dto.startsAt ? startsAt : undefined,
          endsAt: dto.endsAt ? endsAt : undefined,
          speakers: speakerIds === undefined ? undefined : { set: speakerIds.map((sid) => ({ id: sid })) },
        },
        include: scheduleInclude,
      });
      await this.audit(tx, user, "SCHEDULE_UPDATED", id, eventId);
      return item;
    });
  }

  async deleteSchedule(eventId: string, id: string, user: AuthUser) {
    await this.editableEvent(eventId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.scheduleItem.deleteMany({ where: { id, eventId } });
      if (count === 0) throw new NotFoundException("Không tìm thấy phiên trong lịch trình");
      await this.audit(tx, user, "SCHEDULE_DELETED", id, eventId);
    });
  }

  // ---------- Diễn giả ----------

  /** Ban tổ chức thấy cả email; kèm số phiên để biết diễn giả đang được dùng ở đâu. */
  listSpeakers(eventId: string) {
    return this.prisma.speaker.findMany({
      where: { eventId },
      orderBy: { fullName: "asc" },
      include: { sessions: { select: { id: true, title: true }, orderBy: { startsAt: "asc" } } },
    });
  }

  async createSpeaker(eventId: string, dto: CreateSpeakerDto, user: AuthUser) {
    await this.editableEvent(eventId);
    return this.prisma.$transaction(async (tx) => {
      const speaker = await tx.speaker.create({
        data: { eventId, ...this.speakerData(dto), fullName: dto.fullName.trim() },
        include: { sessions: { select: { id: true, title: true } } },
      });
      await this.audit(tx, user, "SPEAKER_CREATED", speaker.id, eventId);
      return speaker;
    });
  }

  async updateSpeaker(eventId: string, id: string, dto: UpdateSpeakerDto, user: AuthUser) {
    await this.editableEvent(eventId);
    const current = await this.prisma.speaker.findFirst({ where: { id, eventId }, select: { id: true } });
    if (!current) throw new NotFoundException("Không tìm thấy diễn giả");
    if (dto.fullName !== undefined && !dto.fullName?.trim()) throw new BadRequestException("Cần nhập họ tên diễn giả");
    return this.prisma.$transaction(async (tx) => {
      const speaker = await tx.speaker.update({
        where: { id },
        data: { ...this.speakerData(dto), fullName: dto.fullName?.trim() },
        include: { sessions: { select: { id: true, title: true } } },
      });
      await this.audit(tx, user, "SPEAKER_UPDATED", id, eventId);
      return speaker;
    });
  }

  /** Xoá diễn giả; các phiên vẫn giữ, chỉ bỏ diễn giả này khỏi phiên. */
  async deleteSpeaker(eventId: string, id: string, user: AuthUser) {
    await this.editableEvent(eventId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.speaker.deleteMany({ where: { id, eventId } });
      if (count === 0) throw new NotFoundException("Không tìm thấy diễn giả");
      await this.audit(tx, user, "SPEAKER_DELETED", id, eventId);
    });
  }

  // ---------- Nội bộ ----------

  /** Sự kiện phải tồn tại và chưa huỷ / kết thúc. */
  private async editableEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { startsAt: true, endsAt: true, status: true } });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      throw new ConflictException("Sự kiện đã huỷ hoặc đã kết thúc, không thể sửa lịch trình");
    }
    return event;
  }

  private assertWithinEvent(event: { startsAt: Date; endsAt: Date }, startsAt: Date, endsAt: Date) {
    if (isNaN(startsAt.valueOf()) || isNaN(endsAt.valueOf())) throw new BadRequestException("Thời gian không hợp lệ");
    if (endsAt <= startsAt) throw new BadRequestException("Giờ kết thúc phiên phải sau giờ bắt đầu");
    if (startsAt < event.startsAt || endsAt > event.endsAt) {
      throw new BadRequestException(
        `Phiên phải nằm trong thời gian sự kiện (${timeFmt.format(event.startsAt)} – ${timeFmt.format(event.endsAt)})`,
      );
    }
  }

  /** Bỏ trùng và kiểm tra mọi diễn giả đều thuộc sự kiện này. */
  private async validSpeakerIds(eventId: string, ids: string[] | undefined) {
    const unique = [...new Set(ids ?? [])];
    if (unique.length === 0) return [];
    const found = await this.prisma.speaker.count({ where: { eventId, id: { in: unique } } });
    if (found !== unique.length) throw new BadRequestException("Có diễn giả không thuộc sự kiện này");
    return unique;
  }

  /** null hoặc chuỗi rỗng = xoá; không gửi = giữ nguyên. */
  private speakerData(dto: UpdateSpeakerDto) {
    const clean = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() || null);
    return {
      title: clean(dto.title),
      organization: clean(dto.organization),
      bio: clean(dto.bio),
      email: dto.email === undefined ? undefined : dto.email?.trim().toLowerCase() || null,
      avatarUrl: clean(dto.avatarUrl),
    };
  }

  private audit(tx: Prisma.TransactionClient, user: AuthUser, action: string, entityId: string, eventId: string) {
    return this.auditLog.record(tx, {
      actorId: user.id,
      action,
      entityType: action.startsWith("SPEAKER") ? "Speaker" : "ScheduleItem",
      entityId,
      details: { eventId },
    });
  }
}
