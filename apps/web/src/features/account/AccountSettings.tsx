"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, initials } from "@/lib/format";
import { ROLE_LABELS, type AuthUser } from "@/types/auth";

/** Thông tin tài khoản: sửa họ tên và đổi mật khẩu. */
export function AccountSettings() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => setFullName(user?.fullName ?? ""), [user?.fullName]);
  if (!user) return null;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    try {
      const updated = await api.patch<AuthUser>("/auth/me", { fullName: fullName.trim() });
      updateUser(updated);
      setProfileMsg({ ok: true, text: "Đã lưu thông tin." });
    } catch (err) {
      setProfileMsg({ ok: false, text: err instanceof ApiError ? err.message : "Không lưu được thông tin." });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 8) return setPwMsg({ ok: false, text: "Mật khẩu mới tối thiểu 8 ký tự." });
    if (next !== confirm) return setPwMsg({ ok: false, text: "Xác nhận mật khẩu không khớp." });
    setChanging(true);
    try {
      await api.patch("/auth/me/password", { currentPassword: current, newPassword: next });
      setCurrent(""); setNext(""); setConfirm("");
      setPwMsg({ ok: true, text: "Đã đổi mật khẩu. Lần đăng nhập sau dùng mật khẩu mới." });
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof ApiError ? err.message : "Không đổi được mật khẩu." });
    } finally {
      setChanging(false);
    }
  }

  const unchanged = fullName.trim() === user.fullName || !fullName.trim();

  return (
    <section className="page-section account-page">
      <h1 className="page-title">Thông tin tài khoản</h1>
      <div className="account-summary">
        <span className="avatar avatar-lg" aria-hidden="true">{initials(user.fullName)}</span>
        <div>
          <strong>{user.fullName}</strong>
          <span className="muted small">{user.email}</span>
          <span className={`role-badge role-${user.role.toLowerCase()}`}>{ROLE_LABELS[user.role]}</span>
        </div>
      </div>

      <form className="panel form" onSubmit={saveProfile}>
        <h2>Thông tin cá nhân</h2>
        <label className="field">
          <span>Họ và tên</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={191} required autoComplete="name" />
        </label>
        <label className="field">
          <span>Email đăng nhập</span>
          <input value={user.email} disabled />
          <small className="muted">Email dùng để đăng nhập nên không đổi được. Liên hệ quản trị viên nếu cần.</small>
        </label>
        {user.createdAt && <p className="muted small">Tạo tài khoản: {formatDateTime(user.createdAt)}</p>}
        {profileMsg && <p className={profileMsg.ok ? "notice-ok" : "form-error"} role="status">{profileMsg.text}</p>}
        <div><button className="button" disabled={saving || unchanged}>{saving ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
      </form>

      <form className="panel form" id="doi-mat-khau" onSubmit={changePassword}>
        <h2>Đổi mật khẩu</h2>
        <label className="field">
          <span>Mật khẩu hiện tại</span>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </label>
        <label className="field">
          <span>Mật khẩu mới</span>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} maxLength={72} required />
          <small className="muted">Tối thiểu 8 ký tự.</small>
        </label>
        <label className="field">
          <span>Nhập lại mật khẩu mới</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </label>
        {pwMsg && <p className={pwMsg.ok ? "notice-ok" : "form-error"} role="status">{pwMsg.text}</p>}
        <div><button className="button" disabled={changing || !current || !next || !confirm}>{changing ? "Đang đổi…" : "Đổi mật khẩu"}</button></div>
      </form>
    </section>
  );
}
