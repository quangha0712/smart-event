import { PagePlaceholder } from "@/components/PagePlaceholder";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

export default function Page() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      {/* Khi làm nội dung: chỉ hiện sự kiện có quyền manageResources (useEventAccess().filterEvents + can). */}
      <RequireEventAccess capability="manageResources">
      <PagePlaceholder
        eyebrow="NGUỒN LỰC"
        title="Nguồn lực"
        description="Nhân sự, nhà cung cấp, nhà tài trợ, dự toán và thực chi."
        feature="resources"
      />
      </RequireEventAccess>
    </RequireAuth>
  );
}
