import type { AuthUser, UserRole } from "@/types/auth";

export type NavItem = {
  href: string;
  label: string;
  /** undefined = ai cũng thấy (kể cả chưa đăng nhập); [] = mọi người đã đăng nhập; ADMIN thấy tất cả. */
  roles?: UserRole[];
};

/** Menu chính. Thêm trang mới ở đây và bọc trang bằng <RequireAuth roles={...}> cùng quyền. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/events", label: "Sự kiện" },
  { href: "/dashboard", label: "Dashboard", roles: ["ORGANIZER"] },
  { href: "/check-in", label: "Check-in", roles: ["ORGANIZER"] },
  { href: "/resources", label: "Nguồn lực", roles: ["ORGANIZER"] },
  { href: "/admin/users", label: "Người dùng", roles: ["ADMIN"] },
];

/** Trang cần quyền nhưng không nằm trên menu. Giữ khớp với <RequireAuth> của từng trang. */
const EXTRA_PROTECTED: Array<{ pattern: RegExp; roles: UserRole[] }> = [
  { pattern: /^\/admin(\/|$)/, roles: ["ADMIN"] },
  { pattern: /^\/events\/[^/]+\/ai-insights(\/|$)/, roles: ["ORGANIZER"] },
];

/** Trang mặc định sau khi đăng nhập. */
export const HOME_PATH = "/";

/** Quyền cần có để mở một đường dẫn; undefined = trang công khai. */
export function requiredRoles(path: string): UserRole[] | undefined {
  const pathname = path.split(/[?#]/)[0];
  const extra = EXTRA_PROTECTED.find((r) => r.pattern.test(pathname));
  if (extra) return extra.roles;
  const nav = NAV_ITEMS.find((item) => item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
  return nav?.roles;
}

/** ADMIN vào được mọi trang; trang công khai ai cũng vào được. */
export function canAccess(user: AuthUser | null, path: string) {
  const roles = requiredRoles(path);
  if (roles === undefined) return true;
  if (!user) return false;
  return roles.length === 0 || user.role === "ADMIN" || roles.includes(user.role);
}
