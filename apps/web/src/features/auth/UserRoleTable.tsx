"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, type AuthUser, type UserRole } from "@/types/auth";
import { useAuth } from "./AuthProvider";

const ROLES: UserRole[] = ["ADMIN", "ORGANIZER", "ATTENDEE"];

/** ADMIN xem danh sách tài khoản và đổi quyền (PATCH /auth/users/:id/role). */
export function UserRoleTable() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<AuthUser[]>("/auth/users", { signal: controller.signal })
      .then(setUsers)
      .catch((e) => {
        if (!(e instanceof DOMException)) setError(e instanceof ApiError ? e.message : "Không tải được danh sách.");
      });
    return () => controller.abort();
  }, []);

  async function changeRole(id: string, role: UserRole) {
    setError("");
    setSavingId(id);
    try {
      const updated = await api.patch<AuthUser>(`/auth/users/${encodeURIComponent(id)}/role`, { role });
      setUsers((list) => list?.map((u) => (u.id === id ? updated : u)) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không đổi được quyền.");
    } finally {
      setSavingId(null);
    }
  }

  if (!users && !error) return <div className="state" role="status">Đang tải…</div>;

  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {users && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Quyền</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      aria-label={`Quyền của ${u.fullName}`}
                      value={u.role}
                      disabled={savingId === u.id || u.id === me?.id}
                      title={u.id === me?.id ? "Không thể tự đổi quyền của chính mình" : undefined}
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
