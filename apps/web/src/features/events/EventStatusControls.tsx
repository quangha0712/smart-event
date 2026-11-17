"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { EVENT_STATUS_LABELS } from "@/lib/format";
import type { EventDetail, EventStatus } from "@/types/event";
import { useEventAccess } from "./EventAccessProvider";

type Action = { to: EventStatus; label: string; confirm?: string; danger?: boolean; hint?: string };

/**
 * Nút đổi trạng thái theo PATCH /events/:id/status. Hiển thị theo trạng thái hiện tại và vai trò:
 * công bố / chuyển về nháp / kết thúc cho Chủ sự kiện & Đồng tổ chức; huỷ chỉ Chủ sự kiện.
 * API vẫn kiểm tra lại (vd không chuyển về nháp khi đã có người đăng ký).
 */
export function EventStatusControls({ event, onChanged }: { event: EventDetail; onChanged: () => void }) {
  const access = useEventAccess();
  const [busy, setBusy] = useState<EventStatus | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const canManage = access.can(event.id, "manageContent");
  const canCancel = access.can(event.id, "cancelEvent");
  const ended = new Date(event.endsAt).getTime() <= Date.now();

  const actions: Action[] = [];
  if (event.status === "DRAFT" && canManage && !ended) {
    actions.push({ to: "PUBLISHED", label: "Công bố sự kiện", hint: "Người tham dự sẽ thấy và đăng ký được." });
  }
  if (event.status === "PUBLISHED" && canManage) {
    if (ended) actions.push({ to: "COMPLETED", label: "Đánh dấu đã kết thúc" });
    else actions.push({ to: "DRAFT", label: "Chuyển về bản nháp", hint: "Chỉ được khi chưa có ai đăng ký." });
  }
  if ((event.status === "DRAFT" || event.status === "PUBLISHED") && canCancel) {
    actions.push({
      to: "CANCELLED",
      label: "Huỷ sự kiện",
      danger: true,
      confirm: `Huỷ sự kiện "${event.name}"? Thao tác này không hoàn tác được.`,
    });
  }
  if (actions.length === 0) return null;

  async function change(action: Action) {
    if (action.confirm && !window.confirm(action.confirm)) return;
    setBusy(action.to);
    setMessage(null);
    try {
      await api.patch(`/events/${encodeURIComponent(event.id)}/status`, { status: action.to });
      setMessage({ ok: true, text: `Đã chuyển sang “${EVENT_STATUS_LABELS[action.to]}”.` });
      onChanged();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Không đổi được trạng thái." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="status-controls">
      <p className="muted small status-hint">
        Trạng thái: <strong>{EVENT_STATUS_LABELS[event.status]}</strong>
      </p>
      {actions.map((a) => (
        <div key={a.to} className="status-action">
          <button
            type="button"
            className={a.danger ? "button button-danger" : a.to === "PUBLISHED" ? "button" : "button button-ghost"}
            disabled={busy !== null}
            onClick={() => change(a)}
          >
            {busy === a.to ? "Đang xử lý…" : a.label}
          </button>
          {a.hint && <p className="muted small status-hint">{a.hint}</p>}
        </div>
      ))}
      {message && (
        <p className={message.ok ? "notice-ok" : "form-error"} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
