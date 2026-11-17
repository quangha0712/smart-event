import type { EventStatus } from "@/types/event";

const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "short" });
const date = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
const longDate = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** "Th 6, 20/11/2026 · 10:03" */
export const formatDate = (iso: string) => `${weekday.format(new Date(iso))}, ${date.format(new Date(iso))}`;
export const formatDateTime = (iso: string) => `${formatDate(iso)} · ${time.format(new Date(iso))}`;
export const formatTime = (iso: string) => time.format(new Date(iso));
export const formatLongDate = (d: Date = new Date()) => longDate.format(d);
/** Phần ngày/tháng cho ô lịch nhỏ bên trái thẻ sự kiện. */
export const dateParts = (iso: string) => {
  const d = new Date(iso);
  return { day: String(d.getDate()).padStart(2, "0"), month: `T${d.getMonth() + 1}` };
};

export function timeRange(startsAt: string, endsAt: string) {
  const s = new Date(startsAt), e = new Date(endsAt);
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay ? `${formatDateTime(startsAt)}–${formatTime(endsAt)}` : `${formatDateTime(startsAt)} → ${formatDateTime(endsAt)}`;
}

/** "Đang diễn ra", "Còn 3 giờ", "Còn 5 ngày", "Đã kết thúc". */
export function relativeToNow(startsAt: string, endsAt: string, now = Date.now()) {
  const s = new Date(startsAt).getTime(), e = new Date(endsAt).getTime();
  if (now >= s && now <= e) return { label: "Đang diễn ra", tone: "live" as const };
  if (now > e) return { label: "Đã kết thúc", tone: "past" as const };
  const minutes = Math.round((s - now) / 60_000);
  if (minutes < 60) return { label: `Bắt đầu sau ${minutes} phút`, tone: "soon" as const };
  const hours = Math.round(minutes / 60);
  if (hours < 24) return { label: `Còn ${hours} giờ`, tone: "soon" as const };
  const days = Math.round(hours / 24);
  return { label: `Còn ${days} ngày`, tone: days <= 7 ? ("soon" as const) : ("later" as const) };
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đang mở đăng ký",
  CANCELLED: "Đã huỷ",
  COMPLETED: "Đã hoàn thành",
};

export function greeting(d: Date = new Date()) {
  const h = d.getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Chữ cái đầu của tên (tối đa 2) cho avatar. */
export function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const last = parts[parts.length - 1][0] ?? "";
  const first = parts.length > 1 ? parts[0][0] ?? "" : "";
  return (first + last).toUpperCase();
}

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
/** API trả Decimal dạng chuỗi ("20000000") – định dạng thành "20.000.000 ₫". */
export function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? money.format(n) : String(value);
}

/** ISO → giá trị cho <input type="datetime-local"> theo giờ máy (yyyy-MM-ddTHH:mm). */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
