"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { api, ApiError } from "@/lib/api";

type EventSummary = {
  id: string;
  name: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  capacity: number | null;
  _count: { registrations: number };
};

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

/** Danh sách sự kiện – endpoint công khai nên gọi không kèm token. */
export function EventList() {
  const { hasRole } = useAuth();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<EventSummary[]>("/events", { auth: false, signal: controller.signal })
      .then(setEvents)
      .catch((e) => {
        if (!(e instanceof DOMException)) setError(e instanceof ApiError ? e.message : "Không tải được sự kiện.");
      });
    return () => controller.abort();
  }, []);

  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!events) return <div className="state" role="status">Đang tải…</div>;
  if (events.length === 0) return <div className="placeholder">Chưa có sự kiện nào.</div>;

  return (
    <div className="cards">
      {events.map((event) => (
        <article key={event.id}>
          <h2>{event.name}</h2>
          <p className="muted">
            {dateFormat.format(new Date(event.startsAt))}
            {event.location ? ` · ${event.location}` : ""}
          </p>
          <p className="muted">
            Đã đăng ký: {event._count.registrations}
            {event.capacity ? ` / ${event.capacity}` : ""}
          </p>
          {hasRole("ORGANIZER") && (
            <Link href={`/events/${encodeURIComponent(event.id)}/ai-insights`}>Phân tích phản hồi (AI)</Link>
          )}
        </article>
      ))}
    </div>
  );
}
