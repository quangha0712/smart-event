"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, greeting, relativeToNow, timeRange } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { EventSummary, MyRegistration } from "@/types/event";
import { DateBadge, Empty, EventRow, HomeHeader, SectionTitle, TicketQr, TimePill } from "./parts";

/** Người tham dự: thấy ngay sự kiện sắp tới của mình kèm vé QR, các vé khác và sự kiện có thể đăng ký. */
export function AttendeeHome() {
  const { user } = useAuth();
  const mine = useApi((signal) => api.get<MyRegistration[]>("/me/registrations", { signal }));
  const events = useApi((signal) => api.get<EventSummary[]>("/events", { auth: false, signal }));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const now = Date.now();
  const active = (mine.data ?? []).filter((r) => r.status === "CONFIRMED" && new Date(r.event.endsAt).getTime() > now);
  const next = active[0];
  const others = active.slice(1);
  const registeredIds = new Set((mine.data ?? []).filter((r) => r.status === "CONFIRMED").map((r) => r.event.id));
  const open = (events.data ?? [])
    .filter((e) => e.status === "PUBLISHED" && new Date(e.startsAt).getTime() > now && !registeredIds.has(e.id))
    .slice(0, 4);

  async function register(event: EventSummary) {
    setBusy(event.id);
    setMessage(null);
    try {
      await api.post(`/events/${encodeURIComponent(event.id)}/registrations`, {});
      setMessage({ type: "ok", text: `Đã đăng ký "${event.name}". Vé QR của bạn đã sẵn sàng.` });
      mine.reload();
      events.reload();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof ApiError ? e.message : "Không đăng ký được, vui lòng thử lại." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="home">
      <HomeHeader title={`${greeting()}, ${user?.fullName ?? ""}`} subtitle={next ? "Đây là sự kiện sắp tới của bạn." : "Bạn chưa có sự kiện nào sắp tới."} />

      {message && <p className={message.type === "ok" ? "notice-ok" : "form-error"} role="status">{message.text}</p>}
      {mine.error && <p className="form-error" role="alert">{mine.error}</p>}
      {mine.loading && <div className="skeleton-hero" aria-busy="true" />}

      {next && (
        <section className="next-event" aria-label="Sự kiện sắp tới của bạn">
          <div className="next-event-info">
            <span className="eyebrow">Sự kiện sắp tới của bạn</span>
            <h2>{next.event.name}</h2>
            <div className="next-event-meta">
              <TimePill startsAt={next.event.startsAt} endsAt={next.event.endsAt} />
              {next.ticket?.checkedInAt && <span className="pill pill-checked">Đã check-in lúc {formatDateTime(next.ticket.checkedInAt)}</span>}
            </div>
            <dl className="meta-list">
              <div><dt>Thời gian</dt><dd>{timeRange(next.event.startsAt, next.event.endsAt)}</dd></div>
              <div><dt>Địa điểm</dt><dd>{next.event.location ?? "Đang cập nhật"}</dd></div>
            </dl>
            <p className="muted small">Đưa mã QR cho nhân viên tại cổng để check-in. Mỗi vé chỉ dùng được một lần.</p>
            <div className="home-actions">
              <Link className="button" href={`/my-tickets#${next.id}`}>Mở vé toàn màn hình</Link>
              <Link className="button button-ghost" href="/my-tickets">Tất cả vé của tôi</Link>
            </div>
          </div>
          {next.ticket?.qrPayload && <TicketQr value={next.ticket.qrPayload} size={180} />}
        </section>
      )}

      {!mine.loading && !next && !mine.error && (
        <Empty title="Bạn chưa đăng ký sự kiện nào sắp diễn ra.">
          <span className="muted">Chọn một sự kiện bên dưới để đăng ký và nhận vé QR ngay.</span>
        </Empty>
      )}

      {others.length > 0 && (
        <>
          <SectionTitle title="Các sự kiện khác bạn đã đăng ký" link={{ href: "/my-tickets", label: "Xem vé" }} />
          <div className="compact-list">
            {others.map((r) => (
              <Link key={r.id} href={`/my-tickets#${r.id}`} className="compact-item">
                <DateBadge iso={r.event.startsAt} />
                <div>
                  <strong>{r.event.name}</strong>
                  <span className="muted small">{timeRange(r.event.startsAt, r.event.endsAt)}{r.event.location ? ` · ${r.event.location}` : ""}</span>
                </div>
                <span className={`pill pill-time-${relativeToNow(r.event.startsAt, r.event.endsAt).tone}`}>{relativeToNow(r.event.startsAt, r.event.endsAt).label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <SectionTitle title="Sự kiện đang mở đăng ký" link={{ href: "/events", label: "Xem tất cả" }} />
      {events.loading && <div className="skeleton-list" aria-busy="true" />}
      {!events.loading && open.length === 0 && <Empty title="Hiện chưa có sự kiện mới để đăng ký." />}
      <div className="event-list">
        {open.map((e) => (
          <EventRow
            key={e.id}
            event={e}
            actions={
              <button type="button" className="button" disabled={busy === e.id || (e.capacity !== null && e._count.registrations >= e.capacity)} onClick={() => register(e)}>
                {e.capacity !== null && e._count.registrations >= e.capacity ? "Đã đủ chỗ" : busy === e.id ? "Đang đăng ký…" : "Đăng ký"}
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}
