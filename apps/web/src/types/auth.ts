export type UserRole = "ADMIN" | "ORGANIZER" | "ATTENDEE";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  user: AuthUser;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  ORGANIZER: "Ban tổ chức",
  ATTENDEE: "Người tham dự",
};
