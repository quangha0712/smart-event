import { Suspense } from "react";
import { CheckInScreen } from "@/features/check-in/CheckInScreen";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

export default function CheckInPage() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="checkIn">
        {/* CheckInScreen đọc ?eventId= bằng useSearchParams nên cần Suspense. */}
        <Suspense fallback={<div className="state">Đang tải…</div>}>
          <CheckInScreen />
        </Suspense>
      </RequireEventAccess>
    </RequireAuth>
  );
}
