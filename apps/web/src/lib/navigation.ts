import type { UserRole } from "@/types/auth";

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
