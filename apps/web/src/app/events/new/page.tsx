import { RequireAuth } from "@/features/auth/RequireAuth";
import { CreateEventForm } from "@/features/events/CreateEventForm";

/** Mọi tài khoản Ban tổ chức (và ADMIN) đều tạo được sự kiện; người tạo tự thành Chủ sự kiện. */
export default function NewEventPage() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <CreateEventForm />
    </RequireAuth>
  );
}
