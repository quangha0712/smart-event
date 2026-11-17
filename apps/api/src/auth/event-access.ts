import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EventMemberRole, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";
import type { AuthUser } from "./auth.decorators";

/*
 * Phân quyền theo thành viên sự kiện (EventMember).
 * Ma trận (giữ khớp với apps/web/src/lib/eventPermissions.ts):
 *   check-in, xem thành viên            : OWNER, CO_ORGANIZER, CHECKIN_STAFF
 *   nguồn lực, ngân sách, AI, audit log : OWNER, CO_ORGANIZER
 *   mời / đổi vai trò / gỡ thành viên   : OWNER
 * ADMIN luôn được phép ở mọi sự kiện.
 */
export const EVENT_ROLES = {
  ALL: [EventMemberRole.OWNER, EventMemberRole.CO_ORGANIZER, EventMemberRole.CHECKIN_STAFF],
  MANAGERS: [EventMemberRole.OWNER, EventMemberRole.CO_ORGANIZER],
  OWNER: [EventMemberRole.OWNER],
} as const;

/** Bảng có cột eventId, dùng để tra sự kiện từ :id của bản ghi. */
export type EventScopedModel = "budgetItem" | "expense" | "sponsor" | "staffAssignment";

export type EventRolesOptions = {
  /** Route theo :id bản ghi (PATCH/DELETE/GET /:id): tra eventId của bản ghi ở bảng này. */
  resolveFrom?: EventScopedModel;
  /** Cho phép không có eventId (danh sách): controller tự lọc bằng EventAccessService.eventFilter. */
  optional?: boolean;
};

export const EVENT_ROLES_KEY = "auth:eventRoles";
type EventRolesMeta = { roles: readonly EventMemberRole[] } & EventRolesOptions;

/**
 * Chỉ thành viên sự kiện có vai trò thuộc `roles` mới gọi được route. ADMIN luôn qua.
 * eventId lấy từ :eventId, ?eventId, body.eventId và (nếu có resolveFrom) từ bản ghi :id – kiểm tra TẤT CẢ giá trị tìm được,
 * nên không thể sửa một bản ghi của sự kiện mình thuộc để chuyển sang sự kiện khác.
 */
export const EventRoles = (roles: readonly EventMemberRole[], options: EventRolesOptions = {}) =>
  SetMetadata(EVENT_ROLES_KEY, { roles, ...options } satisfies EventRolesMeta);

@Injectable()
export class EventAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async roleOf(eventId: string, userId: string): Promise<EventMemberRole | null> {
    const member = await this.prisma.eventMember.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { role: true },
    });
    return member?.role ?? null;
  }

  /** Ném 403 nếu người dùng không phải thành viên với vai trò phù hợp. ADMIN trả về null (không cần vai trò). */
  async assert(user: AuthUser, eventId: string, roles: readonly EventMemberRole[]): Promise<EventMemberRole | null> {
    if (user.role === UserRole.ADMIN) return null;
    const role = await this.roleOf(eventId, user.id);
    if (!role) throw new ForbiddenException("Bạn không thuộc ban tổ chức sự kiện này");
    if (!roles.includes(role)) throw new ForbiddenException("Vai trò của bạn trong sự kiện này không được phép thực hiện thao tác này");
    return role;
  }

  /** Có phải thành viên với vai trò phù hợp không (không ném lỗi). */
  async allows(user: AuthUser, eventId: string, roles: readonly EventMemberRole[]) {
    if (user.role === UserRole.ADMIN) return true;
    const role = await this.roleOf(eventId, user.id);
    return Boolean(role && roles.includes(role));
  }

  /**
   * Điều kiện Prisma cho cột eventId khi liệt kê:
   * có eventId (đã qua guard) → đúng sự kiện đó; ADMIN không truyền → không lọc; còn lại → các sự kiện mình có vai trò phù hợp.
   */
  async eventFilter(user: AuthUser, eventId: string | undefined, roles: readonly EventMemberRole[]) {
    if (eventId) return eventId;
    if (user.role === UserRole.ADMIN) return undefined;
    const rows = await this.prisma.eventMember.findMany({
      where: { userId: user.id, role: { in: [...roles] } },
      select: { eventId: true },
    });
    return { in: rows.map((r) => r.eventId) };
  }
}

/** Guard toàn cục, chạy sau AuthGuard; chỉ có tác dụng trên route gắn @EventRoles. */
@Injectable()
export class EventMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly access: EventAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<EventRolesMeta | undefined>(EVENT_ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!meta) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user) throw new ForbiddenException("Cần đăng nhập");
    if (user.role === UserRole.ADMIN) return true;

    const candidates = [req.params?.eventId, req.query?.eventId, req.body?.eventId];
    if (meta.resolveFrom && typeof req.params?.id === "string") {
      const delegate = (this.prisma as unknown as Record<string, { findUnique: (a: unknown) => Promise<{ eventId: string } | null> }>)[
        meta.resolveFrom
      ];
      const row = await delegate.findUnique({ where: { id: req.params.id }, select: { eventId: true } });
      // Không tìm thấy bản ghi: để controller trả 404 như bình thường.
      if (!row) return true;
      candidates.push(row.eventId);
    }

    if (candidates.some((v) => v !== undefined && (typeof v !== "string" || !v.trim()))) {
      throw new BadRequestException("eventId không hợp lệ");
    }
    const eventIds = [...new Set(candidates.filter((v): v is string => typeof v === "string"))];
    if (eventIds.length === 0) {
      if (meta.optional) return true;
      throw new BadRequestException("Thiếu eventId");
    }
    for (const eventId of eventIds) await this.access.assert(user, eventId, meta.roles);
    return true;
  }
}
