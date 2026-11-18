import { RequireAuth } from "@/features/auth/RequireAuth";
import { EditEventView } from "@/features/events/EditEventView";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

/** Chủ sự kiện / Đồng tổ chức (và ADMIN) sửa thông tin sự kiện. */
export default function EditEventPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="manageContent" eventId={params.id}>
        <EditEventView eventId={params.id} />
      </RequireEventAccess>
    </RequireAuth>
  );
}
