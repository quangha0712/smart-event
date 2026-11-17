import { Suspense } from "react";
import { BackToEventFromQuery } from "@/components/BackToEvent";
import { PagePlaceholder } from "@/components/PagePlaceholder";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

export default function Page() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      {/* Khi làm nội dung: chỉ hiện sự kiện có quyền viewDashboard (useEventAccess().filterEvents + can). */}
      <RequireEventAccess capability="viewDashboard">
      <Suspense fallback={null}>
        <BackToEventFromQuery />
      </Suspense>
      <PagePlaceholder
        eyebrow="DASHBOARD"
        title="Dashboard sự kiện"
        description="Chỉ số đăng ký, check-in, sức chứa và ngân sách theo sự kiện."
        feature="dashboard"
      />
      </RequireEventAccess>
    </RequireAuth>
  );
}
