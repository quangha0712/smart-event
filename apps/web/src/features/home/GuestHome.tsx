"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { EventSummary } from "@/types/event";
import { Empty, EventRow, HomeHeader, SectionTitle } from "./parts";

/** Khách chưa đăng nhập: giới thiệu một dòng + sự kiện sắp diễn ra (đăng nhập qua nút trên thanh menu). */
export function GuestHome() {
  const { data, error, loading } = useApi((signal) => api.get<EventSummary[]>("/events", { auth: false, signal }));
  const upcoming = (data ?? [])
    .filter((e) => e.status === "PUBLISHED" && new Date(e.endsAt) > new Date())
    .slice(0, 5);

  return (
    <div className="home">
      <HomeHeader
        title="Smart Event – quản lý sự kiện thông minh"
        subtitle="Đăng ký tham dự, nhận vé QR và check-in chỉ trong vài giây."
      />
      <SectionTitle title="Sự kiện sắp diễn ra" link={{ href: "/events", label: "Xem tất cả" }} />
      {loading && <div className="skeleton-list" aria-busy="true" />}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && !error && upcoming.length === 0 && <Empty title="Chưa có sự kiện nào đang mở đăng ký." />}
      <div className="event-list">
        {upcoming.map((e) => (
          <EventRow
            key={e.id}
            event={e}
            actions={new Date(e.startsAt) > new Date() ? <Link className="button button-ghost" href="/login?next=/events">Đăng nhập để đăng ký</Link> : undefined}
          />
        ))}
      </div>
    </div>
  );
}
