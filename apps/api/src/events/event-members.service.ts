import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventMemberRole, Prisma, UserRole } from "@prisma/client";
import type { AuthUser } from "../auth/auth.decorators";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PrismaService } from "../prisma/prisma.module";

const memberSelect = {
  eventId: true,
  userId: true,
  role: true,
  createdAt: true,
  user: { select: { id: true, fullName: true, email: true } },
} as const;

/**
 * Quản lý thành viên ban tổ chức. Quyền gọi đã được EventMemberGuard kiểm tra (OWNER của sự kiện hoặc ADMIN);
 * service chỉ giữ các quy tắc nghiệp vụ:
 *  - Người được thêm phải có tài khoản quyền ORGANIZER.
 *  - Chỉ ADMIN được gán / đổi / gỡ vai trò OWNER, và sự kiện luôn còn ít nhất một OWNER.
 */
@Injectable()
export class EventMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(eventId: string) {
    // MySQL sắp ENUM theo thứ tự khai báo: OWNER → CO_ORGANIZER → CHECKIN_STAFF.
    return this.prisma.eventMember.findMany({
      where: { eventId },
      select: memberSelect,
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
  }

  /** Sự kiện mình là thành viên – dùng cho GET /me/event-memberships. */
  async listForUser(userId: string) {
    const rows = await this.prisma.eventMember.findMany({
      where: { userId },
      select: { eventId: true, role: true, event: { include: { _count: { select: { registrations: true } } } } },
      orderBy: { event: { startsAt: "asc" } },
    });
    return rows.map((r) => ({ eventId: r.eventId, role: r.role, event: { ...r.event, myRole: r.role } }));
  }

  async add(actor: AuthUser, eventId: string, email: string, role: EventMemberRole) {
    if (role === EventMemberRole.OWNER && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Chỉ Quản trị viên được gán Chủ sự kiện");
    }
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    const target = await this.prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!target) throw new NotFoundException("Không tìm thấy tài khoản với email này");
    if (target.role !== UserRole.ORGANIZER) {
      throw new BadRequestException("Người được thêm cần có quyền Ban tổ chức. Nhờ Quản trị viên đổi quyền ở mục Người dùng.");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const member = await tx.eventMember.create({
          data: { eventId, userId: target.id, role, invitedById: actor.id },
          select: memberSelect,
        });
        await this.auditLog.record(tx, {
          actorId: actor.id,
          action: "EVENT_MEMBER_ADDED",
          entityType: "EventMember",
          entityId: `${eventId}:${target.id}`,
          details: { eventId, userId: target.id, role },
        });
        return member;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Người này đã là thành viên ban tổ chức của sự kiện");
      }
      throw e;
    }
  }

  async updateRole(actor: AuthUser, eventId: string, userId: string, role: EventMemberRole) {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.findMember(tx, eventId, userId);
      if (current.role === role) return tx.eventMember.findUniqueOrThrow({ where: { eventId_userId: { eventId, userId } }, select: memberSelect });
      if (current.role === EventMemberRole.OWNER || role === EventMemberRole.OWNER) {
        if (actor.role !== UserRole.ADMIN) throw new BadRequestException("Không thể đổi hoặc gỡ Chủ sự kiện");
        if (current.role === EventMemberRole.OWNER) await this.ensureAnotherOwner(tx, eventId, userId);
      }
      const member = await tx.eventMember.update({
        where: { eventId_userId: { eventId, userId } },
        data: { role },
        select: memberSelect,
      });
      await this.auditLog.record(tx, {
        actorId: actor.id,
        action: "EVENT_MEMBER_ROLE_CHANGED",
        entityType: "EventMember",
        entityId: `${eventId}:${userId}`,
        details: { eventId, userId, from: current.role, to: role },
      });
      return member;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async remove(actor: AuthUser, eventId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const current = await this.findMember(tx, eventId, userId);
      if (current.role === EventMemberRole.OWNER) {
        if (actor.role !== UserRole.ADMIN) throw new BadRequestException("Không thể đổi hoặc gỡ Chủ sự kiện");
        await this.ensureAnotherOwner(tx, eventId, userId);
      }
      await tx.eventMember.delete({ where: { eventId_userId: { eventId, userId } } });
      await this.auditLog.record(tx, {
        actorId: actor.id,
        action: "EVENT_MEMBER_REMOVED",
        entityType: "EventMember",
        entityId: `${eventId}:${userId}`,
        details: { eventId, userId, role: current.role },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async findMember(tx: Prisma.TransactionClient, eventId: string, userId: string) {
    const member = await tx.eventMember.findUnique({ where: { eventId_userId: { eventId, userId } }, select: { role: true } });
    if (!member) throw new NotFoundException("Người này không thuộc ban tổ chức sự kiện");
    return member;
  }

  private async ensureAnotherOwner(tx: Prisma.TransactionClient, eventId: string, exceptUserId: string) {
    const others = await tx.eventMember.count({
      where: { eventId, role: EventMemberRole.OWNER, userId: { not: exceptUserId } },
    });
    if (others === 0) throw new BadRequestException("Sự kiện phải luôn còn ít nhất một Chủ sự kiện");
  }
}
