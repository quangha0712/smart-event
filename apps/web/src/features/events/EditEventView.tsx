"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { EventDetail } from "@/types/event";
import { CreateEventForm } from "./CreateEventForm";

/** Tải sự kiện rồi mở form ở chế độ sửa. Sự kiện đã huỷ / kết thúc không sửa được (API cũng chặn). */
export function EditEventView({ eventId }: { eventId: string }) {
  const detail = useApi((signal) => api.get<EventDetail>(`/events/${encodeURIComponent(eventId)}`, { signal }), [eventId]);
  const back = `/events/${encodeURIComponent(eventId)}`;

  if (detail.loading) return <div className="skeleton-hero" aria-busy="true" />;
  if (detail.error || !detail.data) {
    return (
      <section className="state state-error" role="alert">
        <h1>Không tìm thấy sự kiện</h1>
        <p>{detail.error}</p>
        <Link className="button" href="/events">
          Về danh sách sự kiện
        </Link>
      </section>
    );
  }
  if (detail.data.status === "CANCELLED" || detail.data.status === "COMPLETED") {
    return (
      <section className="state state-error" role="alert">
        <h1>Không thể sửa sự kiện này</h1>
        <p>Sự kiện đã {detail.data.status === "CANCELLED" ? "bị huỷ" : "kết thúc"}.</p>
        <Link className="button" href={back}>
          Về trang sự kiện
        </Link>
      </section>
    );
  }
  // key: tải lại dữ liệu mới thì form khởi tạo lại giá trị.
  return <CreateEventForm key={detail.data.updatedAt ?? detail.data.id} event={detail.data} />;
}
