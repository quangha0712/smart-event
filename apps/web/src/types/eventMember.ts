import type { EventSummary } from "./event";

/** Vai trò của một người trong MỘT sự kiện (khác với quyền hệ thống UserRole). */
export type EventMemberRole = "OWNER" | "CO_ORGANIZER" | "CHECKIN_STAFF";

export const EVENT_MEMBER_ROLE_LABELS: Record<EventMemberRole, string> = {
  OWNER: "Chủ sự kiện",
  CO_ORGANIZER: "Đồng tổ chức",
  CHECKIN_STAFF: "Nhân viên check-in",
};

export const EVENT_MEMBER_ROLE_HINTS: Record<EventMemberRole, string> = {
  OWNER: "Người tạo sự kiện, toàn quyền và mời thêm thành viên",
  CO_ORGANIZER: "Quản lý nội dung, nguồn lực, ngân sách, check-in và AI",
  CHECKIN_STAFF: "Chỉ quét vé tại cổng",
};

/**
 * Phần tử của GET /me/event-memberships (BE chưa làm – xem ghi chú trong apps/api/src/events/events.controller.ts).
 * `event` dùng cùng dạng với GET /events.
 */
export type MyEventMembership = {
  eventId: string;
  role: EventMemberRole;
  event: EventSummary;
};

/** Phần tử của GET /events/:eventId/members. */
export type EventMember = {
  eventId: string;
  userId: string;
  role: EventMemberRole;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
};
