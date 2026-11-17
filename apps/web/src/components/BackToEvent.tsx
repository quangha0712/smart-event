"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { EventSummary } from "@/types/event";

/**
 * Link "← Tên sự kiện" ở đầu các trang mở từ trang chi tiết sự kiện (thành viên, nguồn lực, check-in, AI…).
 * Truyền `name` nếu đã có để khỏi gọi API; không có thì tự lấy tên sự kiện.
 */
export function BackToEvent({ eventId, name }: { eventId: string; name?: string }) {
  const { user } = useAuth();
  const event = useApi(
    name ? null : (signal) => api.get<EventSummary>(`/events/${encodeURIComponent(eventId)}`, { auth: Boolean(user), signal }),
    [eventId, name, user?.id],
  );
  const label = name ?? event.data?.name ?? "Quay lại sự kiện";
  return (
    <Link className="back-link" href={`/events/${encodeURIComponent(eventId)}`}>
      ← {label}
    </Link>
  );
}

/** Như BackToEvent nhưng lấy eventId từ ?eventId= (trang dùng chung cho nhiều sự kiện). Cần nằm trong <Suspense>. */
export function BackToEventFromQuery() {
  const eventId = useSearchParams().get("eventId");
  return eventId ? <BackToEvent eventId={eventId} /> : null;
}
