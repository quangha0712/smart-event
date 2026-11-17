"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { EventSummary } from "@/types/event";
import {
  EVENT_MEMBER_ROLE_HINTS,
  EVENT_MEMBER_ROLE_LABELS,
  type EventMember,
  type EventMemberRole,
} from "@/types/eventMember";
import { useEventAccess } from "./EventAccessProvider";

/** Vai trò Chủ sự kiện có thể mời. Chủ sự kiện có được khi tạo sự kiện; riêng Quản trị viên gán thêm được (vd sự kiện cũ chưa có chủ). */
const INVITABLE_ROLES: EventMemberRole[] = ["CO_ORGANIZER", "CHECKIN_STAFF"];
const ADMIN_ROLES: EventMemberRole[] = ["OWNER", ...INVITABLE_ROLES];

/**
 * Mục “Thành viên ban tổ chức” của một sự kiện.
 * Mọi thành viên xem được danh sách; chỉ Chủ sự kiện (và ADMIN) thêm / đổi vai trò / gỡ.
 * API (apps/api/src/events/events.controller.ts – EventMembersController):
 *   GET    /events/:eventId/members
 *   POST   /events/:eventId/members           { email, role }
 *   PATCH  /events/:eventId/members/:userId   { role }
 *   DELETE /events/:eventId/members/:userId
 */
export function EventMembersPanel({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const access = useEventAccess();
  const canManage = access.can(eventId, "manageMembers");
  const addableRoles = user?.role === "ADMIN" ? ADMIN_ROLES : INVITABLE_ROLES;
  const path = `/events/${encodeURIComponent(eventId)}/members`;

  const event = useApi((signal) => api.get<EventSummary>(`/events/${encodeURIComponent(eventId)}`, { signal }), [eventId]);
  const [notReady, setNotReady] = useState(false);
  const members = useApi(
    (signal) =>
      api.get<EventMember[]>(path, { signal }).catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotReady(true);
        throw e;
      }),
    [path],
  );

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EventMemberRole>("CO_ORGANIZER");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(key: string, action: () => Promise<unknown>, success: string): Promise<boolean> {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: success });
      members.reload();
      access.reload();
      return true;
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Thao tác không thành công." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    run("add", () => api.post(path, { email: value, role }), `Đã thêm ${value} với vai trò ${EVENT_MEMBER_ROLE_LABELS[role]}.`).then((ok) => {
      if (ok) setEmail("");
    });
  }

  const list = members.data ?? [];
  const ownerCount = list.filter((m) => m.role === "OWNER").length;

  return (
    <section className="page-section">
      <span className="eyebrow">BAN TỔ CHỨC</span>
      <h1 className="page-title">Thành viên ban tổ chức</h1>
      <p className="muted">{event.data ? event.data.name : event.loading ? "Đang tải sự kiện…" : ""}</p>

      <ul className="role-legend">
        {(Object.keys(EVENT_MEMBER_ROLE_LABELS) as EventMemberRole[]).map((r) => (
          <li key={r}>
            <strong>{EVENT_MEMBER_ROLE_LABELS[r]}</strong> – {EVENT_MEMBER_ROLE_HINTS[r]}
          </li>
        ))}
      </ul>

      {canManage && (
        <form className="member-form" onSubmit={handleAdd}>
          <label className="field">
            <span>Email tài khoản Ban tổ chức</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@example.com" />
          </label>
          <label className="field">
            <span>Vai trò</span>
            <select value={role} onChange={(e) => setRole(e.target.value as EventMemberRole)}>
              {addableRoles.map((r) => (
                <option key={r} value={r}>
                  {EVENT_MEMBER_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button" disabled={busy === "add" || !email.trim() || notReady}>
            {busy === "add" ? "Đang thêm…" : "Thêm thành viên"}
          </button>
        </form>
      )}
      {canManage && (
        <p className="muted small">
          Người được thêm cần có sẵn tài khoản với quyền Ban tổ chức. Nếu chưa có, nhờ Quản trị viên đổi quyền ở mục Người dùng.
        </p>
      )}

      {message && (
        <p className={message.ok ? "notice-ok" : "form-error"} role="status">
          {message.text}
        </p>
      )}
      {notReady ? (
        <p className="notice-warn" role="status">
          API đang chạy chưa có <code>{`GET /events/:eventId/members`}</code> – cần cập nhật API và chạy migration mới.
        </p>
      ) : (
        members.error && (
          <p className="form-error" role="alert">
            {members.error}
          </p>
        )
      )}
      {members.loading && <div className="skeleton-list" aria-busy="true" />}

      {!members.loading && !members.error && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                {canManage && <th aria-label="Thao tác" />}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="muted">
                    Chưa có thành viên.
                  </td>
                </tr>
              )}
              {list.map((m) => {
                const isSelf = m.userId === user?.id;
                // Không đổi/gỡ Chủ sự kiện cuối cùng để sự kiện luôn có người chịu trách nhiệm.
                const locked = m.role === "OWNER" && ownerCount <= 1;
                return (
                  <tr key={m.userId}>
                    <td>
                      {m.user.fullName}
                      {isSelf && <span className="muted small"> (bạn)</span>}
                    </td>
                    <td>{m.user.email}</td>
                    <td>
                      {canManage && !locked && m.role !== "OWNER" ? (
                        <select
                          aria-label={`Vai trò của ${m.user.fullName}`}
                          value={m.role}
                          disabled={busy === m.userId}
                          onChange={(e) => {
                            const next = e.target.value as EventMemberRole;
                            run(
                              m.userId,
                              () => api.patch(`${path}/${encodeURIComponent(m.userId)}`, { role: next }),
                              `Đã đổi vai trò của ${m.user.fullName} thành ${EVENT_MEMBER_ROLE_LABELS[next]}.`,
                            );
                          }}
                        >
                          {INVITABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {EVENT_MEMBER_ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="pill">{EVENT_MEMBER_ROLE_LABELS[m.role]}</span>
                      )}
                    </td>
                    {canManage && (
                      <td>
                        {!locked && m.role !== "OWNER" && (
                          <button
                            type="button"
                            className="button button-ghost"
                            disabled={busy === m.userId}
                            onClick={() => {
                              if (!window.confirm(`Gỡ ${m.user.fullName} khỏi ban tổ chức sự kiện này?`)) return;
                              run(
                                m.userId,
                                () => api.delete(`${path}/${encodeURIComponent(m.userId)}`),
                                `Đã gỡ ${m.user.fullName} khỏi ban tổ chức.`,
                              );
                            }}
                          >
                            Gỡ
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
