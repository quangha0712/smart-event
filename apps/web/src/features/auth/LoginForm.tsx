"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { destinationFor, safeNext, withNext } from "./redirect";

const DEMO_ACCOUNTS = [
  "admin@example.com",
  "organizer@example.com",
  "cohost@example.com",
  "checkin@example.com",
  "attendee@example.com",
];

export function LoginForm() {
  const { user, status, login } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Đã đăng nhập thì không ở lại trang login.
  useEffect(() => {
    if (status === "authenticated" && user) router.replace(destinationFor(user, next));
  }, [status, user, next, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(email.trim(), password);
      router.replace(destinationFor(loggedIn, next));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Không thể đăng nhập, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <h1 id="login-title">Đăng nhập</h1>
      <p className="muted">Dùng tài khoản ban tổ chức để quản lý sự kiện, check-in và nguồn lực.</p>

      <form onSubmit={handleSubmit} className="form" noValidate>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button button-block" disabled={submitting || !email || !password}>
          {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>

      <p className="auth-switch">
        Chưa có tài khoản? <Link href={withNext("/register", next)}>Đăng ký</Link>
      </p>

      {process.env.NODE_ENV !== "production" && (
        <details className="demo-accounts">
          <summary>Tài khoản demo (môi trường dev)</summary>
          <p className="muted">
            Mật khẩu mặc định: <code>SmartEvent@2026</code> (biến <code>SEED_DEMO_PASSWORD</code> khi seed).
          </p>
          <ul>
            {DEMO_ACCOUNTS.map((demo) => (
              <li key={demo}>
                <button type="button" className="link-button" onClick={() => setEmail(demo)}>
                  {demo}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
