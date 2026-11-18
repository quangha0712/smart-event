"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { useEventAccess } from "./EventAccessProvider";

/** Nút "+ Tạo sự kiện" cho Ban tổ chức / ADMIN; Nhân viên check-in thuần và người khác không thấy. */
export function CreateEventButton() {
  const { hasRole } = useAuth();
  const access = useEventAccess();
  if (!hasRole("ORGANIZER") || access.isCheckInOnly) return null;
  return (
    <Link className="button" href="/events/new">
      + Tạo sự kiện
    </Link>
  );
}
