"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import { AdminHome } from "@/features/home/AdminHome";
import { AttendeeHome } from "@/features/home/AttendeeHome";
import { GuestHome } from "@/features/home/GuestHome";
import { OrganizerHome } from "@/features/home/OrganizerHome";

/** Trang chủ hiển thị theo vai trò người dùng. */
export default function HomePage() {
  const { user, status } = useAuth();
  if (status === "loading") return <div className="skeleton-hero" aria-busy="true" />;
  if (!user) return <GuestHome />;
  if (user.role === "ADMIN") return <AdminHome />;
  if (user.role === "ORGANIZER") return <OrganizerHome />;
  return <AttendeeHome />;
}
