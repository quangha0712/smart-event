import type { AuthUser } from "@/types/auth";
import type { EventMemberRole } from "@/types/eventMember";

/** Những việc có thể làm trong một sự kiện. */
export type EventCapability =
  | "viewMembers" // xem danh sách thành viên ban tổ chức
  | "manageMembers" // mời / đổi vai trò / gỡ thành viên ban tổ chức
  | "manageContent" // sửa thông tin, lịch trình, diễn giả
  | "manageResources" // nhân sự, nhà cung cấp, tài trợ, dự toán – thực chi
  | "viewDashboard"
  | "useAi"
  | "viewAudit"
  | "checkIn";

/**
 * Ma trận quyền theo vai trò trong sự kiện. Phải khớp với EventMemberGuard phía API
 * (apps/api/src/auth/event-access.ts). Frontend chỉ dùng để ẩn/hiện; API mới là nơi chặn thật.
 */
export const EVENT_ROLE_CAPABILITIES: Record<EventMemberRole, readonly EventCapability[]> = {
  OWNER: ["viewMembers", "manageMembers", "manageContent", "manageResources", "viewDashboard", "useAi", "viewAudit", "checkIn"],
  CO_ORGANIZER: ["viewMembers", "manageContent", "manageResources", "viewDashboard", "useAi", "viewAudit", "checkIn"],
  CHECKIN_STAFF: ["viewMembers", "checkIn"],
};

/** ADMIN làm được mọi việc ở mọi sự kiện; người khác cần là thành viên có vai trò phù hợp. */
export function canDo(user: AuthUser | null, role: EventMemberRole | undefined, capability: EventCapability) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return role ? EVENT_ROLE_CAPABILITIES[role].includes(capability) : false;
}
