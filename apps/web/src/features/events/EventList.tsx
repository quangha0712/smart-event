"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { OrganizerEventActions } from "@/features/home/OrganizerHome";
import { EventRow, Empty } from "@/features/home/parts";
import { EventAccessNotice, useEventAccess } from "./EventAccessProvider";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { EventSummary, MyRegistration } from "@/types/event";

type Filter = "upcoming" | "past" | "all";

/** Danh sách sự kiện: người tham dự đăng ký ngay tại đây; ban tổ chức thấy cả bản nháp và lối vào số liệu/AI. */
export function EventList() {
  const { user, hasRole } = useAuth();
  const isOrganizer = hasRole("ORGANIZER");
  const isAttendee = user?.role === "ATTENDEE";
  const access = useEventAccess();
  // Gửi kèm token khi đã đăng nhập để API lọc theo người gọi.
  // TODO(BE): GET /events đang @Public – cần đọc token nếu có: Ban tổ chức chỉ nhận sự kiện mình là thành viên (kèm myRole),
  // ADMIN nhận tất cả, khách/người tham dự chỉ nhận sự kiện PUBLISHED.
  const events = useApi((signal) => api.get<EventSummary[]>("/events", { auth: Boolean(user), signal }), [user?.id]);
  const mine = useApi(isAttendee ? (signal) => api.get<MyRegistration[]>("/me/registrations", { signal }) : null, [isAttendee]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const now = Date.now();
  const registered = new Map((mine.data ?? []).filter((r) => r.status === "CONFIRMED").map((r) => [r.event.id, r]));
  const list = access.filterEvents(events.data ?? [])
    .filter((e) => isOrganizer || e.status !== "DRAFT")
    .filter((e) => (filter === "all" ? true : filter === "upcoming" ? new Date(e.endsAt).getTime() >= now : new Date(e.endsAt).getTime() < now))
    .filter((e) => !query.trim() || `${e.name} ${e.location ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  async function register(e: EventSummary) {
    setBusy(e.id);
    setMessage(null);
    try {
      await api.post(`/events/${encodeURIComponent(e.id)}/registrations`, {});
      setMessage({ ok: true, text: `Đã đăng ký "${e.name}". Xem vé QR trong mục Vé của tôi.` });
      mine.reload();
      events.reload();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : "Không đăng ký được." });
    } finally {
      setBusy(null);
    }
  }

  function actions(e: EventSummary) {
    if (isOrganizer) {
      return (
        <>
          <OrganizerEventActions eventId={e.id} />
          {access.can(e.id, "useAi") && (
            <Link className="button button-ghost" href={`/events/${encodeURIComponent(e.id)}/ai-insights`}>Phân tích AI</Link>
          )}
        </>
      );
    }
    const started = new Date(e.startsAt).getTime() <= now;
    if (!user) return started ? null : <Link className="button button-ghost" href="/login?next=/events">Đăng nhập để đăng ký</Link>;
    if (!isAttendee) return null;
    const reg = registered.get(e.id);
    if (reg) return <Link className="button button-ghost" href={`/my-tickets#${reg.id}`}>Xem vé</Link>;
    if (started || e.status !== "PUBLISHED") return null;
    const full = e.capacity !== null && e._count.registrations >= e.capacity;
    return (
      <button type="button" className="button" disabled={full || busy === e.id} onClick={() => register(e)}>
        {full ? "Đã đủ chỗ" : busy === e.id ? "Đang đăng ký…" : "Đăng ký"}
      </button>
    );
  }

  return (
    <>
      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Lọc sự kiện">
          {([["upcoming", "Sắp diễn ra"], ["past", "Đã kết thúc"], ["all", "Tất cả"]] as const).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={filter === key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <input className="search" type="search" placeholder="Tìm theo tên hoặc địa điểm…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Tìm sự kiện" />
      </div>
      {isOrganizer && <EventAccessNotice />}
      {message && <p className={message.ok ? "notice-ok" : "form-error"} role="status">{message.text}</p>}
      {events.error && <p className="form-error" role="alert">{events.error}</p>}
      {events.loading && <div className="skeleton-list" aria-busy="true" />}
      {!events.loading && !events.error && list.length === 0 && (
        <Empty title={isOrganizer && access.supported && user?.role === "ORGANIZER" ? "Bạn chưa thuộc sự kiện nào phù hợp." : "Không có sự kiện phù hợp."} />
      )}
      <div className="event-list">
        {list.map((e) => (
          <EventRow key={e.id} event={e} showStatus={isOrganizer} actions={actions(e)} />
        ))}
      </div>
    </>
  );
}
