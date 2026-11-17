"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { EventSummary } from "@/types/event";
import { useEventAccess } from "./EventAccessProvider";

type Fields = {
  name: string;
  description: string;
  location: string;
  startsAt: string; // giá trị của <input type="datetime-local">, giờ địa phương
  endsAt: string;
  capacity: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: "", description: "", location: "", startsAt: "", endsAt: "", capacity: "" };

/** Giá trị nhỏ nhất cho ô ngày giờ: thời điểm hiện tại theo giờ máy (định dạng yyyy-MM-ddTHH:mm). */
function nowLocalInput() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Kiểm tra giống CreateEventDto phía API để báo lỗi ngay trên form (API vẫn kiểm tra lại). */
function validate(f: Fields): Errors {
  const errors: Errors = {};
  if (!f.name.trim()) errors.name = "Cần nhập tên sự kiện";
  else if (f.name.trim().length > 191) errors.name = "Tên sự kiện tối đa 191 ký tự";
  if (f.location.trim().length > 255) errors.location = "Địa điểm tối đa 255 ký tự";

  const starts = f.startsAt ? new Date(f.startsAt) : null;
  const ends = f.endsAt ? new Date(f.endsAt) : null;
  if (!starts || isNaN(starts.valueOf())) errors.startsAt = "Cần chọn thời gian bắt đầu";
  else if (starts.getTime() < Date.now() - 60_000) errors.startsAt = "Thời gian bắt đầu không được ở quá khứ";
  if (!ends || isNaN(ends.valueOf())) errors.endsAt = "Cần chọn thời gian kết thúc";
  else if (starts && !isNaN(starts.valueOf()) && ends <= starts) errors.endsAt = "Thời gian kết thúc phải sau thời gian bắt đầu";

  if (f.capacity.trim()) {
    const n = Number(f.capacity);
    if (!Number.isInteger(n) || n < 1) errors.capacity = "Sức chứa phải là số nguyên dương";
  }
  return errors;
}

/**
 * Form tạo sự kiện (POST /events). Sự kiện mới ở trạng thái Bản nháp và người tạo tự thành Chủ sự kiện;
 * tạo xong chuyển sang mục Thành viên ban tổ chức để mời thêm người.
 */
export function CreateEventForm() {
  const router = useRouter();
  const access = useEventAccess();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Đưa con trỏ tới ô lỗi đầu tiên.
      const first = Object.keys(found)[0];
      document.getElementById(`event-${first}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.post<EventSummary>("/events", {
        name: fields.name.trim(),
        description: fields.description.trim() || undefined,
        location: fields.location.trim() || undefined,
        startsAt: new Date(fields.startsAt).toISOString(),
        endsAt: new Date(fields.endsAt).toISOString(),
        capacity: fields.capacity.trim() ? Number(fields.capacity) : undefined,
      });
      // Người tạo là Chủ sự kiện: ghi nhận ngay để trang Thành viên mở được luôn, không chờ tải lại.
      access.remember({ eventId: created.id, role: "OWNER", event: created });
      router.push(`/events/${encodeURIComponent(created.id)}/members?created=1`);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Không tạo được sự kiện, vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  const minDate = nowLocalInput();
  const fieldError = (key: keyof Fields) =>
    errors[key] ? (
      <span className="field-error" id={`event-${key}-error`}>
        {errors[key]}
      </span>
    ) : null;
  const describedBy = (key: keyof Fields) => (errors[key] ? `event-${key}-error` : undefined);

  return (
    <section className="page-section">
      <span className="eyebrow">SỰ KIỆN</span>
      <h1 className="page-title">Tạo sự kiện</h1>
      <p className="muted">
        Sự kiện mới ở trạng thái <strong>Bản nháp</strong> (chỉ ban tổ chức thấy) và bạn sẽ là <strong>Chủ sự kiện</strong>.
      </p>

      <form className="form form-card" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>
            Tên sự kiện <span className="required" aria-hidden="true">*</span>
          </span>
          <input
            id="event-name"
            value={fields.name}
            onChange={set("name")}
            maxLength={191}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            placeholder="Ví dụ: Ngày hội Công nghệ PTIT 2027"
          />
          {fieldError("name")}
        </label>

        <label className="field">
          <span>Mô tả</span>
          <textarea
            id="event-description"
            rows={4}
            value={fields.description}
            onChange={set("description")}
            placeholder="Nội dung, đối tượng tham dự, chương trình chính…"
          />
        </label>

        <label className="field">
          <span>Địa điểm</span>
          <input
            id="event-location"
            value={fields.location}
            onChange={set("location")}
            maxLength={255}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={describedBy("location")}
            placeholder="Ví dụ: Hội trường A, PTIT Hà Đông"
          />
          {fieldError("location")}
        </label>

        <div className="form-row">
          <label className="field">
            <span>
              Bắt đầu <span className="required" aria-hidden="true">*</span>
            </span>
            <input
              id="event-startsAt"
              type="datetime-local"
              min={minDate}
              value={fields.startsAt}
              onChange={set("startsAt")}
              required
              aria-invalid={Boolean(errors.startsAt)}
              aria-describedby={describedBy("startsAt")}
            />
            {fieldError("startsAt")}
          </label>
          <label className="field">
            <span>
              Kết thúc <span className="required" aria-hidden="true">*</span>
            </span>
            <input
              id="event-endsAt"
              type="datetime-local"
              min={fields.startsAt || minDate}
              value={fields.endsAt}
              onChange={set("endsAt")}
              required
              aria-invalid={Boolean(errors.endsAt)}
              aria-describedby={describedBy("endsAt")}
            />
            {fieldError("endsAt")}
          </label>
        </div>

        <label className="field field-narrow">
          <span>Sức chứa (người)</span>
          <input
            id="event-capacity"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={fields.capacity}
            onChange={set("capacity")}
            aria-invalid={Boolean(errors.capacity)}
            aria-describedby={describedBy("capacity")}
            placeholder="Bỏ trống nếu không giới hạn"
          />
          {fieldError("capacity")}
        </label>

        {serverError && (
          <p className="form-error" role="alert">
            {serverError}
          </p>
        )}

        <div className="form-actions">
          <Link className="button button-ghost" href="/events">
            Huỷ
          </Link>
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Đang tạo…" : "Tạo sự kiện"}
          </button>
        </div>
      </form>
    </section>
  );
}
