"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { api } from "@/lib/api";
import { formatDateTime, formatLongDate, greeting } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { ROLE_LABELS, type AuthUser, type UserRole } from "@/types/auth";
import type { EventSummary } from "@/types/event";
import { HomeHeader, SectionTitle, StatCard } from "./parts";

/** Quản trị viên: tình trạng hệ thống, người dùng theo vai trò, người dùng mới và các chức năng quản trị. */
export function AdminHome() {
  const { user } = useAuth();
  const users = useApi((signal) => api.get<AuthUser[]>("/auth/users", { signal }));
  const events = useApi((signal) => api.get<EventSummary[]>("/events", { signal }));
  const health = useApi((signal) => api.get<unknown>("/health", { auth: false, signal }));

  const count = (role: UserRole) => (users.data ?? []).filter((u) => u.role === role).length;
  const newest = [...(users.data ?? [])].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 5);
  const published = (events.data ?? []).filter((e) => e.status === "PUBLISHED").length;
  const apiOk = !health.loading && !health.error;

  return (
    <div className="home">
      <HomeHeader
        title={`${greeting()}, ${user?.fullName ?? ""}`}
        subtitle={formatLongDate()}
        actions={<Link className="button" href="/admin/users">Quản lý người dùng</Link>}
      />

      <div className="system-status" role="status">
        <span className={apiOk ? "status-dot ok" : health.loading ? "status-dot" : "status-dot bad"} aria-hidden="true" />
        {health.loading ? "Đang kiểm tra máy chủ API…" : apiOk ? "Máy chủ API hoạt động bình thường" : `Không kết nối được API: ${health.error}`}
      </div>

      <div className="stats-grid">
        <StatCard label="Tổng người dùng" value={users.loading ? "…" : users.data?.length ?? 0} href="/admin/users" />
        <StatCard label={ROLE_LABELS.ORGANIZER} value={users.loading ? "…" : count("ORGANIZER")} href="/admin/users" />
        <StatCard label={ROLE_LABELS.ATTENDEE} value={users.loading ? "…" : count("ATTENDEE")} href="/admin/users" />
        <StatCard label="Sự kiện đang mở" value={events.loading ? "…" : `${published}/${events.data?.length ?? 0}`} hint="đang mở / tổng" href="/events" />
      </div>

      <div className="two-col">
        <section>
          <SectionTitle title="Người dùng mới" link={{ href: "/admin/users", label: "Phân quyền" }} />
          {users.error && <p className="form-error" role="alert">{users.error}</p>}
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Ngày tạo</th></tr></thead>
              <tbody>
                {newest.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td className="muted">{u.email}</td>
                    <td><span className={`role-badge role-${u.role.toLowerCase()}`}>{ROLE_LABELS[u.role]}</span></td>
                    <td className="muted">{u.createdAt ? formatDateTime(u.createdAt) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <SectionTitle title="Chức năng quản trị" />
          <div className="shortcut-grid single">
            <Link className="shortcut" href="/admin/users"><strong>Người dùng & phân quyền</strong><span>Đổi vai trò Quản trị / Ban tổ chức / Người tham dự</span></Link>
            <Link className="shortcut" href="/events"><strong>Toàn bộ sự kiện</strong><span>Theo dõi trạng thái mọi sự kiện trên hệ thống</span></Link>
            <Link className="shortcut" href="/dashboard"><strong>Dashboard hệ thống</strong><span>Đăng ký, check-in, ngân sách tổng hợp</span></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
