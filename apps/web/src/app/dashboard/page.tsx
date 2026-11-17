import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

/** Dashboard sự kiện: Chủ sự kiện / Đồng tổ chức (và ADMIN). */
export default function DashboardPage() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="viewDashboard">
        {/* DashboardView đọc ?eventId= bằng useSearchParams nên cần Suspense. */}
        <Suspense fallback={<div className="state">Đang tải…</div>}>
          <DashboardView />
        </Suspense>
      </RequireEventAccess>
    </RequireAuth>
  );
}
