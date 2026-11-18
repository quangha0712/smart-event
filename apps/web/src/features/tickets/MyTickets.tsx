"use client";

import Link from "next/link";
import { useState } from "react";
import { DateBadge, Empty, TicketQr, TimePill } from "@/features/home/parts";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, timeRange } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { MyRegistration } from "@/types/event";

/** Danh sách vé của người tham dự: vé sắp tới hiển thị QR to để quét tại cổng; có thể huỷ đăng ký. */
export function MyTickets() {
  const { data, error, loading, reload } = useApi((signal) => api.get<MyRegistration[]>("/me/registrations", { signal }));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const now = Date.now();
  const upcoming = (data ?? []).filter((r) => r.status === "CONFIRMED" && new Date(r.event.endsAt).getTime() > now);
  const history = (data ?? []).filter((r) => !upcoming.includes(r));

  async function cancel(r: MyRegistration) {
    if (!window.confirm(`Huỷ đăng ký "${r.event.name}"? Vé QR sẽ không còn dùng được.`)) return;
    setBusy(r.id);
    setMessage("");
    try {
      await api.delete(`/events/${encodeURIComponent(r.event.id)}/registrations/${encodeURIComponent(r.id)}`);
      reload();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Không huỷ được đăng ký.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="page-section">
      <h1 className="page-title">Vé của tôi</h1>
      <p className="muted">Đưa mã QR cho nhân viên tại cổng để check-in. Tăng độ sáng màn hình nếu quét chậm.</p>
      {message && <p className="form-error" role="alert">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading && <div className="skeleton-hero" aria-busy="true" />}
      {!loading && !error && upcoming.length === 0 && (
        <Empty title="Bạn chưa có vé cho sự kiện sắp tới.">
          <Link className="button" href="/events">Tìm sự kiện để đăng ký</Link>
        </Empty>
      )}
      <div className="ticket-list">
        {upcoming.map((r) => (
          <article key={r.id} id={r.id} className="ticket">
            <div className="ticket-info">
              <div className="event-row-title">
                <h2>{r.event.name}</h2>
                <TimePill startsAt={r.event.startsAt} endsAt={r.event.endsAt} />
              </div>
              <dl className="meta-list">
                <div><dt>Thời gian</dt><dd>{timeRange(r.event.startsAt, r.event.endsAt)}</dd></div>
                <div><dt>Địa điểm</dt><dd>{r.event.location ?? "Đang cập nhật"}</dd></div>
                <div><dt>Mã vé</dt><dd className="mono">{r.ticket?.id.slice(0, 12) ?? "–"}</dd></div>
                <div><dt>Trạng thái</dt><dd>{r.ticket?.checkedInAt ? `Đã check-in lúc ${formatDateTime(r.ticket.checkedInAt)}` : "Chưa check-in"}</dd></div>
              </dl>
              {!r.ticket?.checkedInAt && (
                <button type="button" className="link-button danger-text" disabled={busy === r.id} onClick={() => cancel(r)}>
                  {busy === r.id ? "Đang huỷ…" : "Huỷ đăng ký"}
                </button>
              )}
            </div>
            <div className={r.ticket?.checkedInAt ? "ticket-qr-wrap used" : "ticket-qr-wrap"}>
              {r.ticket?.qrPayload ? <TicketQr value={r.ticket.qrPayload} size={220} /> : <span className="muted">Chưa có mã QR</span>}
              {r.ticket?.checkedInAt && <span className="stamp">ĐÃ DÙNG</span>}
            </div>
          </article>
        ))}
      </div>
      {history.length > 0 && (
        <>
          <h2 className="subhead">Lịch sử</h2>
          <div className="compact-list">
            {history.map((r) => (
              <div key={r.id} className="compact-item">
                <DateBadge iso={r.event.startsAt} />
                <div>
                  <strong>{r.event.name}</strong>
                  <span className="muted small">{r.status === "CANCELLED" ? "Đã huỷ đăng ký" : r.ticket?.checkedInAt ? "Đã tham dự" : "Đã kết thúc"}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
