"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useEventAccess } from "@/features/events/EventAccessProvider";
import { AdminHome } from "@/features/home/AdminHome";
import { AttendeeHome } from "@/features/home/AttendeeHome";
import { GuestHome } from "@/features/home/GuestHome";
import { OrganizerHome } from "@/features/home/OrganizerHome";

/** Trang chủ hiển thị theo vai trò người dùng. */
export default function HomePage() {
  const { user, status } = useAuth();
  const access = useEventAccess();
  const router = useRouter();

  // Nhân viên check-in thuần không cần trang chủ: vào thẳng màn quét vé.
  useEffect(() => {
    if (access.status === "ready" && access.isCheckInOnly) router.replace("/check-in");
  }, [access.status, access.isCheckInOnly, router]);

  if (status === "loading") return <div className="skeleton-hero" aria-busy="true" />;
  if (!user) return <GuestHome />;
  if (user.role === "ADMIN") return <AdminHome />;
  if (user.role === "ORGANIZER") {
    if (access.status === "loading" || access.isCheckInOnly) return <div className="skeleton-hero" aria-busy="true" />;
    return <OrganizerHome />;
  }
  return <AttendeeHome />;
}
