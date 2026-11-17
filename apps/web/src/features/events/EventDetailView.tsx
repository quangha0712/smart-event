"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { CapacityBar, DateBadge, StatusPill, TimePill } from "@/features/home/parts";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTime, initials, timeRange } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { EventDetail, MyRegistration, ScheduleItem, Speaker } from "@/types/event";
import { EVENT_MEMBER_ROLE_LABELS } from "@/types/eventMember";
import { useEventAccess } from "./EventAccessProvider";
import { EventStatusControls } from "./EventStatusControls";

/** Gom các phiên theo ngày (giờ địa phương), giữ thứ tự thời gian. */
function groupByDay(items: ScheduleItem[]) {
  const groups = new Map<string, ScheduleItem[]>();
  for (const item of [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const key = new Date(item.startsAt).toDateString();
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()];
}

function speakerLine(s: Speaker) {
  return [s.title, s.organization].filter(Boolean).join(" · ");
}

function SpeakerAvatar({ speaker, size = 48 }: { speaker: Speaker; size?: number }) {
  if (speaker.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="speaker-photo" src={speaker.avatarUrl} alt="" width={size} height={size} />;
  }
  return (
    <span className="avatar speaker-initials" style={{ width: size, height: size }} aria-hidden="true">
      {initials(speaker.fullName)}
    </span>
  );
}

/** Khung bên phải: đăng ký (khách, người tham dự) hoặc lối vào quản lý (ban tổ chức). */
function ActionPanel({ event, reloadEvent }: { event: EventDetail; reloadEvent: () => void }) {
  const { user, hasRole } = useAuth();
  const access = useEventAccess();
  const isAttendee = user?.role === "ATTENDEE";
  const mine = useApi(isAttendee ? (signal) => api.get<MyRegistration[]>("/me/registrations", { signal }) : null, [isAttendee]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const now = Date.now();
  const started = new Date(event.startsAt).getTime() <= now;
  const ended = new Date(event.endsAt).getTime() < now;
  const full = event.capacity !== null && event._count.registrations >= event.capacity;
  const registration = (mine.data ?? []).find((r) => r.event.id === event.id && r.status === "CONFIRMED");
  const id = encodeURIComponent(event.id);

  async function register() {
    setBusy(true);
    setMessage(null);
    try {
      await api.post(`/events/${id}/registrations`, {});
      setMessage({ ok: true, text: "Đăng ký thành công. Vé QR đã có trong mục Vé của tôi." });
      mine.reload();
      reloadEvent();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Không đăng ký được, vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  }

  // Ban tổ chức / ADMIN: lối vào quản lý theo vai trò trong sự kiện.
  if (hasRole("ORGANIZER")) {
    const role = access.roleOf(event.id);
    const editable = event.status === "DRAFT" || event.status === "PUBLISHED";
    const links = [
      { show: editable && access.can(event.id, "manageContent"), href: `/events/${id}/edit`, label: "Sửa thông tin sự kiện" },
      { show: access.can(event.id, "viewMembers"), href: `/events/${id}/members`, label: "Thành viên ban tổ chức" },
      { show: access.can(event.id, "viewDashboard"), href: `/dashboard?eventId=${id}`, label: "Số liệu" },
      { show: access.can(event.id, "manageResources"), href: `/resources?eventId=${id}`, label: "Nguồn lực & ngân sách" },
      { show: access.can(event.id, "checkIn"), href: `/check-in?eventId=${id}`, label: "Check-in" },
      { show: access.can(event.id, "useAi"), href: `/events/${id}/ai-insights`, label: "Phân tích AI" },
    ].filter((l) => l.show);
    return (
      <aside className="detail-panel" aria-label="Quản lý sự kiện">
        <h2>Quản lý</h2>
        {role && access.supported ? (
          <p className="muted small">
            Vai trò của bạn: <span className="pill">{EVENT_MEMBER_ROLE_LABELS[role]}</span>
          </p>
        ) : (
          user?.role === "ADMIN" && <p className="muted small">Bạn xem với quyền Quản trị viên.</p>
        )}
        {links.length > 0 ? (
          <nav className="detail-links">
            {links.map((l) => (
              <Link key={l.href} className="button button-ghost" href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        ) : (
          <p className="muted small">Bạn không thuộc ban tổ chức sự kiện này.</p>
        )}
        <EventStatusControls
          event={event}
          onChanged={() => {
            reloadEvent();
            access.reload();
          }}
        />
      </aside>
    );
  }

  // Khách & người tham dự: đăng ký.
  let body: React.ReactNode;
  if (event.status === "CANCELLED") body = <p className="muted">Sự kiện đã bị huỷ.</p>;
  else if (ended) body = <p className="muted">Sự kiện đã kết thúc.</p>;
  else if (registration)
    body = (
      <>
        <p className="notice-ok">Bạn đã đăng ký sự kiện này.</p>
        <Link className="button button-block" href={`/my-tickets#${registration.id}`}>
          Xem vé QR
        </Link>
      </>
    );
  else if (started) body = <p className="muted">Sự kiện đã bắt đầu, không nhận đăng ký mới.</p>;
  else if (!user)
    body = (
      <Link className="button button-block" href={`/login?next=${encodeURIComponent(`/events/${event.id}`)}`}>
        Đăng nhập để đăng ký
      </Link>
    );
  else if (isAttendee)
    body = (
      <button type="button" className="button button-block" disabled={full || busy || mine.loading} onClick={register}>
        {full ? "Đã đủ chỗ" : busy ? "Đang đăng ký…" : "Đăng ký tham dự"}
      </button>
    );

  return (
    <aside className="detail-panel" aria-label="Đăng ký tham dự">
      <h2>Tham dự</h2>
      <CapacityBar count={event._count.registrations} capacity={event.capacity} />
      {body}
      {message && (
        <p className={message.ok ? "notice-ok" : "form-error"} role="status">
          {message.text}
        </p>
      )}
    </aside>
  );
}

/** Trang chi tiết sự kiện: mô tả, lịch trình, diễn giả, đăng ký / lối vào quản lý. */
export function EventDetailView({ eventId, justUpdated = false }: { eventId: string; justUpdated?: boolean }) {
  const { user, hasRole } = useAuth();
  // Gửi kèm token để thành viên ban tổ chức xem được cả bản nháp.
  const detail = useApi((signal) => api.get<EventDetail>(`/events/${encodeURIComponent(eventId)}`, { auth: Boolean(user), signal }), [
    eventId,
    user?.id,
  ]);

  if (detail.loading && !detail.data) return <div className="skeleton-hero" aria-busy="true" />;
  if (detail.error || !detail.data) {
    return (
      <section className="state state-error" role="alert">
        <h1>Không tìm thấy sự kiện</h1>
        <p>{detail.error || "Sự kiện không tồn tại hoặc chưa được công bố."}</p>
        <Link className="button" href="/events">
          Về danh sách sự kiện
        </Link>
      </section>
    );
  }

  const event = detail.data;
  const days = groupByDay(event.schedules);
  const multiDay = days.length > 1;

  return (
    <article className="event-detail">
      <Link className="back-link" href="/events">
        ← Sự kiện
      </Link>

      <header className="detail-header">
        <DateBadge iso={event.startsAt} />
        <div className="detail-heading">
          <div className="event-row-title">
            <h1 className="page-title">{event.name}</h1>
          </div>
          <div className="detail-pills">
            <TimePill startsAt={event.startsAt} endsAt={event.endsAt} />
            {(hasRole("ORGANIZER") || event.status !== "PUBLISHED") && <StatusPill status={event.status} />}
          </div>
          <p className="muted">
            {timeRange(event.startsAt, event.endsAt)}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
      </header>

      {justUpdated && (
        <p className="notice-ok" role="status">
          Đã lưu thay đổi.
        </p>
      )}
      {event.status === "DRAFT" && (
        <p className="notice-warn" role="status">
          Bản nháp – chỉ ban tổ chức và Quản trị viên thấy. Người tham dự chưa xem hoặc đăng ký được.
        </p>
      )}

      <div className="detail-layout">
        <div className="detail-main">
          <section aria-labelledby="about-title">
            <h2 id="about-title">Giới thiệu</h2>
            {event.description ? <p className="detail-description">{event.description}</p> : <p className="muted">Chưa có mô tả.</p>}
          </section>

          <section aria-labelledby="schedule-title">
            <h2 id="schedule-title">Lịch trình</h2>
            {days.length === 0 && <p className="muted">Chưa có lịch trình.</p>}
            {days.map((items) => (
              <div key={items[0].startsAt} className="schedule-day">
                {multiDay && <h3 className="schedule-day-title">{formatDate(items[0].startsAt)}</h3>}
                <ol className="schedule-list">
                  {items.map((item) => (
                    <li key={item.id} className="schedule-item">
                      <div className="schedule-time">
                        {formatTime(item.startsAt)}
                        <span className="muted small">{formatTime(item.endsAt)}</span>
                      </div>
                      <div className="schedule-body">
                        <strong>{item.title}</strong>
                        {item.room && <span className="muted small">{item.room}</span>}
                        {item.description && <p className="muted small">{item.description}</p>}
                        {item.speakers.length > 0 && (
                          <span className="schedule-speakers small">
                            {item.speakers.map((s) => s.fullName).join(", ")}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>

          <section aria-labelledby="speakers-title">
            <h2 id="speakers-title">Diễn giả</h2>
            {event.speakers.length === 0 && <p className="muted">Chưa có diễn giả.</p>}
            <div className="speaker-grid">
              {event.speakers.map((s) => (
                <div key={s.id} className="speaker-card">
                  <SpeakerAvatar speaker={s} />
                  <div>
                    <strong>{s.fullName}</strong>
                    {speakerLine(s) && <span className="muted small">{speakerLine(s)}</span>}
                    {s.bio && <p className="muted small">{s.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <ActionPanel event={event} reloadEvent={detail.reload} />
      </div>
    </article>
  );
}
