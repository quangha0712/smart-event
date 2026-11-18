"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { EventAccessNotice, useEventAccess } from "@/features/events/EventAccessProvider";
import { EVENT_MEMBER_ROLE_LABELS } from "@/types/eventMember";
import { api } from "@/lib/api";
import { formatLongDate, greeting } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { CheckInStats, EventSummary } from "@/types/event";
import { Empty, EventRow, HomeHeader, SectionTitle, StatCard } from "./parts";

const DAY = 24 * 60 * 60 * 1000;

/** Số liệu check-in của sự kiện đang diễn ra – cập nhật mỗi 30 giây. */
function LiveCheckIn({ event }: { event: EventSummary }) {
  const stats = useApi((signal) => api.get<CheckInStats>(`/check-in/events/${encodeURIComponent(event.id)}/stats`, { signal }), [event.id]);
  const { reload } = stats;
  // Tự làm mới định kỳ để ban tổ chức theo dõi luồng khách vào cổng.
  useIntervalReload(reload, 30_000);
  const s = stats.data;
  const pct = s && event._count.registrations ? Math.round((s.accepted / event._count.registrations) * 100) : 0;
  return (
    <section className="live-card" aria-label={`Check-in trực tiếp: ${event.name}`}>
      <div className="live-head">
        <span className="live-dot" aria-hidden="true" /> <span className="eyebrow">ĐANG DIỄN RA</span>
        <h2>{event.name}</h2>
        <Link className="button" href={`/check-in?eventId=${encodeURIComponent(event.id)}`}>Mở màn hình check-in</Link>
      </div>
      {stats.error ? (
        <p className="muted small">Chưa lấy được số liệu check-in: {stats.error}</p>
      ) : (
        <div className="stats-grid">
          <StatCard label="Đã check-in" value={s ? `${s.accepted}/${event._count.registrations}` : "…"} hint={s ? `${pct}% người đăng ký` : undefined} />
          <StatCard label="Quét trùng" value={s?.repeatedScans ?? "…"} hint="Vé đã dùng bị quét lại" />
          <StatCard label="Mã không hợp lệ" value={s?.invalidCodes ?? "…"} hint="QR giả hoặc sai sự kiện" />
          <StatCard label="Tổng lượt quét" value={s?.totalAttempts ?? "…"} />
        </div>
      )}
    </section>
  );
}

function useIntervalReload(reload: () => void, ms: number) {
  useEffect(() => {
    const id = window.setInterval(reload, ms);
    return () => window.clearInterval(id);
  }, [reload, ms]);
}

/** Ban tổ chức: việc cần làm hôm nay, sự kiện sắp diễn ra và lối tắt – chỉ trong các sự kiện mình là thành viên. */
export function OrganizerHome() {
  const { user } = useAuth();
  const access = useEventAccess();
  // API đã chỉ trả sự kiện mình là thành viên; FE lọc thêm theo /me/event-memberships cho chắc.
  const { data, error, loading } = useApi((signal) => api.get<EventSummary[]>("/events", { signal }));
  const now = Date.now();
  const events = access.filterEvents(data ?? []);
  const live = events.filter((e) => e.status === "PUBLISHED" && new Date(e.startsAt).getTime() <= now && new Date(e.endsAt).getTime() >= now);
  const upcoming = events.filter((e) => e.status !== "CANCELLED" && new Date(e.startsAt).getTime() > now);
  const next30 = upcoming.filter((e) => new Date(e.startsAt).getTime() - now <= 30 * DAY);
  const drafts = upcoming.filter((e) => e.status === "DRAFT");
  const regs = next30.reduce((sum, e) => sum + e._count.registrations, 0);

  return (
    <div className="home">
      <HomeHeader
        title={`${greeting()}, ${user?.fullName ?? ""}`}
        subtitle={formatLongDate()}
        actions={
          <>
            <Link className="button" href="/events/new">+ Tạo sự kiện</Link>
            {access.canAny("checkIn") && <Link className="button button-ghost" href="/check-in">Check-in</Link>}
          </>
        }
      />

      <EventAccessNotice />
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="stats-grid">
        <StatCard label="Đang diễn ra" value={loading ? "…" : live.length} href="/check-in" />
        <StatCard label="Sắp diễn ra (30 ngày)" value={loading ? "…" : next30.length} href="/events" />
        <StatCard label="Lượt đăng ký (30 ngày)" value={loading ? "…" : regs} href="/dashboard" />
        <StatCard label="Bản nháp chưa công bố" value={loading ? "…" : drafts.length} hint={drafts.length ? "Cần hoàn thiện và công bố" : undefined} href="/events" />
      </div>

      {live.filter((e) => access.can(e.id, "checkIn")).map((e) => <LiveCheckIn key={e.id} event={e} />)}

      <SectionTitle title="Sự kiện sắp diễn ra" link={{ href: "/events", label: "Quản lý sự kiện" }} />
      {loading && <div className="skeleton-list" aria-busy="true" />}
      {!loading && upcoming.length === 0 && (
        <Empty title={access.supported ? "Bạn chưa thuộc sự kiện sắp tới nào." : "Chưa có sự kiện sắp tới."}>
          <span className="muted small">Tạo sự kiện mới (bạn sẽ là Chủ sự kiện) hoặc nhờ Chủ sự kiện thêm bạn vào ban tổ chức.</span>
          <Link className="button" href="/events/new">Tạo sự kiện</Link>
        </Empty>
      )}
      <div className="event-list">
        {upcoming.slice(0, 6).map((e) => (
          <EventRow
            key={e.id}
            event={e}
            showStatus
            actions={<OrganizerEventActions eventId={e.id} />}
          />
        ))}
      </div>

      <SectionTitle title="Lối tắt" />
      <div className="shortcut-grid">
        {access.canAny("checkIn") && <Link className="shortcut" href="/check-in"><strong>Check-in QR/NFC</strong><span>Quét vé tại cổng, phát hiện vé trùng/giả</span></Link>}
        {access.canAny("manageResources") && <Link className="shortcut" href="/resources"><strong>Nguồn lực & ngân sách</strong><span>Nhân sự, nhà cung cấp, tài trợ, dự toán – thực chi</span></Link>}
        {access.canAny("viewDashboard") && <Link className="shortcut" href="/dashboard"><strong>Dashboard</strong><span>Đăng ký, check-in, mật độ khu vực, ngân sách</span></Link>}
        {upcoming[0] && access.can(upcoming[0].id, "useAi") && (
          <Link className="shortcut" href={`/events/${encodeURIComponent(upcoming[0].id)}/ai-insights`}><strong>Phân tích AI</strong><span>Tổng hợp phản hồi, gợi ý cải thiện</span></Link>
        )}
      </div>
    </div>
  );
}

/** Nút theo vai trò của mình trong từng sự kiện. */
export function OrganizerEventActions({ eventId }: { eventId: string }) {
  const access = useEventAccess();
  const role = access.roleOf(eventId);
  const id = encodeURIComponent(eventId);
  return (
    <>
      {role && access.supported && <span className="pill">{EVENT_MEMBER_ROLE_LABELS[role]}</span>}
      {access.can(eventId, "manageContent") && <Link className="button button-ghost" href={`/events/${id}/edit`}>Sửa</Link>}
      {access.can(eventId, "viewDashboard") && <Link className="button button-ghost" href={`/dashboard?eventId=${id}`}>Số liệu</Link>}
      {access.can(eventId, "manageResources") && <Link className="button button-ghost" href={`/resources?eventId=${id}&tab=budget`}>Ngân sách</Link>}
      {access.can(eventId, "checkIn") && <Link className="button button-ghost" href={`/check-in?eventId=${id}`}>Check-in</Link>}
      {access.can(eventId, "viewMembers") && <Link className="button button-ghost" href={`/events/${id}/members`}>Thành viên</Link>}
    </>
  );
}
