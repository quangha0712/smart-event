import type { EventCapability } from "@/lib/eventPermissions";
import type { AuthUser, UserRole } from "@/types/auth";

export type NavItem = {
  href: string;
  label: string;
  /** undefined = ai cũng thấy (kể cả chưa đăng nhập); [] = mọi người đã đăng nhập; ADMIN thấy tất cả. */
  roles?: UserRole[];
  /** Chỉ đúng các vai trò này mới thấy (không áp dụng quy tắc ADMIN thấy tất cả). */
  only?: UserRole[];
  /** Ban tổ chức cần có quyền này ở ít nhất một sự kiện mình thuộc. ADMIN luôn thấy. */
  capability?: EventCapability;
  /** Ẩn với Nhân viên check-in thuần (chỉ thấy màn quét vé). */
  hideForCheckInOnly?: boolean;
};

/** Menu chính. Thêm trang mới ở đây và bọc trang bằng <RequireAuth roles={...}> cùng quyền. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", hideForCheckInOnly: true },
  { href: "/events", label: "Sự kiện", hideForCheckInOnly: true },
  { href: "/my-tickets", label: "Vé của tôi", roles: [], only: ["ATTENDEE"] },
  { href: "/dashboard", label: "Dashboard", roles: ["ORGANIZER"], capability: "viewDashboard" },
  { href: "/check-in", label: "Check-in", roles: ["ORGANIZER"], capability: "checkIn" },
  { href: "/resources", label: "Nguồn lực", roles: ["ORGANIZER"], capability: "manageResources" },
  { href: "/admin/users", label: "Người dùng", roles: ["ADMIN"] },
];

/** Trang cần quyền nhưng không nằm trên menu. Giữ khớp với <RequireAuth> của từng trang. */
const EXTRA_PROTECTED: Array<{ pattern: RegExp; roles: UserRole[] }> = [
  { pattern: /^\/admin(\/|$)/, roles: ["ADMIN"] },
  { pattern: /^\/account(\/|$)/, roles: [] },
  { pattern: /^\/events\/[^/]+\/ai-insights(\/|$)/, roles: ["ORGANIZER"] },
  { pattern: /^\/events\/[^/]+\/members(\/|$)/, roles: ["ORGANIZER"] },
];

type EventAccessLike = { canAny: (capability: EventCapability) => boolean; isCheckInOnly: boolean };

/** Mục menu hiển thị cho người dùng hiện tại; truyền `access` để lọc thêm theo vai trò trong sự kiện. */
export function visibleNavItems(user: AuthUser | null, access?: EventAccessLike) {
  return NAV_ITEMS.filter((item) => {
    if (access?.isCheckInOnly && item.hideForCheckInOnly) return false;
    if (item.capability && access && user?.role === "ORGANIZER" && !access.canAny(item.capability)) return false;
    if (item.only) return Boolean(user && item.only.includes(user.role));
    if (item.roles === undefined) return true;
    if (!user) return false;
    return item.roles.length === 0 || user.role === "ADMIN" || item.roles.includes(user.role);
  });
}

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
