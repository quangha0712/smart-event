import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";
import { ResourcesView } from "@/features/resources/ResourcesView";

/** Chủ sự kiện / Đồng tổ chức (và ADMIN): nhân sự, nhà cung cấp, tài trợ, dự toán – thực chi. */
export default function ResourcesPage() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="manageResources">
        {/* ResourcesView đọc ?eventId=&tab= bằng useSearchParams nên cần Suspense. */}
        <Suspense fallback={<div className="state">Đang tải…</div>}>
          <ResourcesView />
        </Suspense>
      </RequireEventAccess>
    </RequireAuth>
  );
}
