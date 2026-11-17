"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { destinationFor, safeNext, withNext } from "./redirect";

type Fields = { fullName: string; email: string; password: string; confirm: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Kiểm tra giống RegisterDto phía API (API vẫn kiểm tra lại). */
function validate(f: Fields): Errors {
  const errors: Errors = {};
  if (!f.fullName.trim()) errors.fullName = "Cần nhập họ tên";
  else if (f.fullName.trim().length > 191) errors.fullName = "Họ tên tối đa 191 ký tự";
  if (!EMAIL_RE.test(f.email.trim())) errors.email = "Email không hợp lệ";
  if (f.password.length < 8) errors.password = "Mật khẩu tối thiểu 8 ký tự";
  else if (f.password.length > 72) errors.password = "Mật khẩu tối đa 72 ký tự";
  if (f.confirm !== f.password) errors.confirm = "Mật khẩu nhập lại không khớp";
  return errors;
}

/**
 * Đăng ký tài khoản Người tham dự (POST /auth/register). Đăng ký xong đăng nhập luôn và quay về trang
 * đang xem (?next=, vd trang sự kiện muốn đăng ký tham dự). Tài khoản Ban tổ chức do Quản trị viên cấp quyền.
 */
export function RegisterForm() {
  const { user, status, register } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [fields, setFields] = useState<Fields>({ fullName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Đã đăng nhập thì không ở lại trang đăng ký.
  useEffect(() => {
    if (status === "authenticated" && user && !submitting) router.replace(destinationFor(user, next));
  }, [status, user, next, router, submitting]);

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`register-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const created = await register({
        fullName: fields.fullName.trim(),
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
      });
      router.replace(destinationFor(created, next));
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : "Không đăng ký được, vui lòng thử lại.";
      // Email trùng: báo ngay dưới ô email.
      if (cause instanceof ApiError && cause.status === 409) {
        setErrors((prev) => ({ ...prev, email: message }));
        document.getElementById("register-email")?.focus();
      } else {
        setServerError(message);
      }
      setSubmitting(false);
    }
  }

  const fieldError = (key: keyof Fields) =>
    errors[key] ? (
      <span className="field-error" id={`register-${key}-error`}>
        {errors[key]}
      </span>
    ) : null;
  const a11y = (key: keyof Fields) => ({
    id: `register-${key}`,
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `register-${key}-error` : undefined,
  });

  return (
    <section className="auth-card" aria-labelledby="register-title">
      <h1 id="register-title">Đăng ký</h1>
      <p className="muted">Tạo tài khoản để đăng ký tham dự sự kiện và nhận vé QR.</p>

      <form onSubmit={handleSubmit} className="form" noValidate>
        <label className="field">
          <span>Họ tên</span>
          <input {...a11y("fullName")} autoComplete="name" maxLength={191} value={fields.fullName} onChange={set("fullName")} />
          {fieldError("fullName")}
        </label>
        <label className="field">
          <span>Email</span>
          <input {...a11y("email")} type="email" autoComplete="email" maxLength={191} value={fields.email} onChange={set("email")} />
          {fieldError("email")}
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            {...a11y("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            maxLength={72}
            value={fields.password}
            onChange={set("password")}
          />
          {fieldError("password") ?? <span className="muted small">Tối thiểu 8 ký tự.</span>}
        </label>
        <label className="field">
          <span>Nhập lại mật khẩu</span>
          <input
            {...a11y("confirm")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            maxLength={72}
            value={fields.confirm}
            onChange={set("confirm")}
          />
          {fieldError("confirm")}
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
          <span>Hiện mật khẩu</span>
        </label>

        {serverError && (
          <p className="form-error" role="alert">
            {serverError}
          </p>
        )}

        <button type="submit" className="button button-block" disabled={submitting}>
          {submitting ? "Đang tạo tài khoản…" : "Đăng ký"}
        </button>
      </form>

      <p className="auth-switch">
        Đã có tài khoản? <Link href={withNext("/login", next)}>Đăng nhập</Link>
      </p>
    </section>
  );
}
