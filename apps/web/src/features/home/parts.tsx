"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { dateParts, EVENT_STATUS_LABELS, relativeToNow, timeRange } from "@/lib/format";
import type { EventSummary } from "@/types/event";

/** Dòng chào gọn trên đầu trang chủ (thay cho khối hero lớn). */
export function HomeHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="home-header">
      <div>
        <h1 className="home-title">{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="home-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </>
  );
  return href ? (
    <Link href={href} className="stat-card stat-card-link">{body}</Link>
  ) : (
    <div className="stat-card">{body}</div>
  );
}

export function DateBadge({ iso }: { iso: string }) {
  const { day, month } = dateParts(iso);
  return (
    <div className="date-badge" aria-hidden="true">
      <span className="date-badge-day">{day}</span>
      <span className="date-badge-month">{month}</span>
    </div>
  );
}

export function StatusPill({ status }: { status: EventSummary["status"] }) {
  return <span className={`pill pill-${status.toLowerCase()}`}>{EVENT_STATUS_LABELS[status]}</span>;
}

export function TimePill({ startsAt, endsAt }: { startsAt: string; endsAt: string }) {
  const r = relativeToNow(startsAt, endsAt);
  return <span className={`pill pill-time-${r.tone}`}>{r.label}</span>;
}

export function CapacityBar({ count, capacity }: { count: number; capacity: number | null }) {
  if (!capacity) return <span className="muted small">{count} người đã đăng ký</span>;
  const pct = Math.min(100, Math.round((count / capacity) * 100));
  return (
    <div className="capacity">
      <div className="capacity-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tỷ lệ lấp đầy">
        <div className={pct >= 90 ? "capacity-fill full" : "capacity-fill"} style={{ width: `${pct}%` }} />
      </div>
      <span className="muted small">{count}/{capacity} chỗ · {pct}%</span>
    </div>
  );
}

/** Một dòng sự kiện dạng thẻ ngang: ô ngày, tên, thời gian/địa điểm, trạng thái và nút hành động. */
export function EventRow({ event, actions, showStatus = false }: { event: EventSummary; actions?: React.ReactNode; showStatus?: boolean }) {
  return (
    <article className="event-row">
      <DateBadge iso={event.startsAt} />
      <div className="event-row-main">
        <div className="event-row-title">
          <h3>{event.name}</h3>
          <TimePill startsAt={event.startsAt} endsAt={event.endsAt} />
          {showStatus && <StatusPill status={event.status} />}
        </div>
        <p className="muted small">
          {timeRange(event.startsAt, event.endsAt)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <CapacityBar count={event._count.registrations} capacity={event.capacity} />
      </div>
      {actions && <div className="event-row-actions">{actions}</div>}
    </article>
  );
}

export function TicketQr({ value, size = 160 }: { value: string; size?: number }) {
  return (
    <div className="ticket-qr">
      <QRCodeSVG value={value} size={size} level="M" marginSize={2} title="Mã QR vé" />
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function SectionTitle({ title, link }: { title: string; link?: { href: string; label: string } }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {link && <Link href={link.href}>{link.label} →</Link>}
    </div>
  );
}
