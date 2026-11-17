"use client";

import Link from "next/link";
import type { EventCapability } from "@/lib/eventPermissions";
import { useEventAccess } from "./EventAccessProvider";

const CAPABILITY_LABELS: Record<EventCapability, string> = {
  viewMembers: "xem thành viên ban tổ chức",
  manageMembers: "quản lý thành viên ban tổ chức",
  manageContent: "quản lý nội dung sự kiện",
  cancelEvent: "huỷ sự kiện",
  manageResources: "quản lý nguồn lực và ngân sách",
  viewDashboard: "xem số liệu sự kiện",
  useAi: "dùng phân tích AI",
  viewAudit: "xem nhật ký thao tác",
  checkIn: "check-in",
};

/**
 * Đặt bên trong <RequireAuth>. Có `eventId` → cần quyền ở đúng sự kiện đó; không có → cần quyền ở ít nhất một sự kiện.
 * Chỉ để điều hướng giao diện; API (EventMemberGuard) mới chặn thật.
 */
export function RequireEventAccess({
  capability,
  eventId,
  children,
}: {
  capability: EventCapability;
  eventId?: string;
  children: React.ReactNode;
}) {
  const access = useEventAccess();

  if (access.status === "loading") {
    return (
      <div className="state" role="status">
        Đang kiểm tra quyền trong sự kiện…
      </div>
    );
  }

  const allowed = eventId ? access.can(eventId, capability) : access.canAny(capability);
  if (!allowed) {
    return (
      <section className="state state-error" role="alert">
        <h1>Không có quyền truy cập</h1>
        <p>
          Bạn cần là thành viên ban tổ chức {eventId ? "của sự kiện này" : "của ít nhất một sự kiện"} với quyền{" "}
          {CAPABILITY_LABELS[capability]}. Hãy nhờ Chủ sự kiện thêm bạn vào mục “Thành viên ban tổ chức”.
        </p>
        <Link className="button" href={access.isCheckInOnly ? "/check-in" : "/"}>
          {access.isCheckInOnly ? "Về màn quét vé" : "Về trang chủ"}
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
