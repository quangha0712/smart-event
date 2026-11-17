"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/types/auth";

/** Nút tên người dùng trên header; bấm để mở menu: Thông tin tài khoản, Đổi mật khẩu, Đăng xuất. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Đóng khi bấm ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  function handleLogout() {
    setOpen(false);
    logout();
    router.push("/login");
  }

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar" aria-hidden="true">{initials(user.fullName)}</span>
        <span className="user-menu-text">
          <span className="user-menu-name">{user.fullName}</span>
          <span className="user-menu-role">{ROLE_LABELS[user.role]}</span>
        </span>
        <svg className="chevron" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-header">
            <strong>{user.fullName}</strong>
            <span className="muted small">{user.email}</span>
          </div>
          <Link role="menuitem" href="/account" className="user-menu-item" onClick={() => setOpen(false)}>
            Thông tin tài khoản
          </Link>
          <Link role="menuitem" href="/account#doi-mat-khau" className="user-menu-item" onClick={() => setOpen(false)}>
            Đổi mật khẩu
          </Link>
          <button role="menuitem" type="button" className="user-menu-item danger" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
