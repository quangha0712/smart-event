import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";
import { ScheduleEditor } from "@/features/events/ScheduleEditor";

/** Chủ sự kiện / Đồng tổ chức (và ADMIN) chỉnh lịch trình & diễn giả. */
export default function EventSchedulePage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="manageContent" eventId={params.id}>
        <ScheduleEditor eventId={params.id} />
      </RequireEventAccess>
    </RequireAuth>
  );
}
