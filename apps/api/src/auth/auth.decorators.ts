import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { UserRole } from "@prisma/client";

export const IS_PUBLIC_KEY = "auth:isPublic";
export const ROLES_KEY = "auth:roles";

/** Route không cần đăng nhập. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Giới hạn route cho các quyền được liệt kê. ADMIN luôn được phép. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export type AuthUser = { id: string; email: string; fullName: string; role: UserRole };

/** Lấy người dùng đã đăng nhập (do AuthGuard gắn vào request). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
