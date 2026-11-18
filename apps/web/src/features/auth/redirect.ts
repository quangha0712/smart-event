import { canAccess } from "@/lib/navigation";
import type { AuthUser } from "@/types/auth";
import { homePathFor } from "./AuthProvider";

/**
 * Chỉ cho phép quay về đường dẫn nội bộ, tránh open redirect kiểu ?next=https://... hoặc //evil.com,
 * và không quay về chính trang đăng nhập / đăng ký.
 */
export function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.startsWith("/login") || next.startsWith("/register")) return null;
  return next;
}

/** Trang đích sau đăng nhập / đăng ký: về `next` nếu tài khoản có quyền mở trang đó, ngược lại về trang chủ. */
export function destinationFor(user: AuthUser, next: string | null) {
  return next && canAccess(user, next) ? next : homePathFor(user);
}

/** Thêm ?next= vào link đăng nhập / đăng ký để chuyển qua lại mà không mất trang đích. */
export function withNext(path: string, next: string | null) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
