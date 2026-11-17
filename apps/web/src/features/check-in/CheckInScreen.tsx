"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BackToEvent } from "@/components/BackToEvent";
import { useAuth } from "@/features/auth/AuthProvider";
import { EventAccessNotice, useEventAccess } from "@/features/events/EventAccessProvider";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { EventSummary } from "@/types/event";
import { EVENT_MEMBER_ROLE_LABELS } from "@/types/eventMember";
import { CameraScanner } from "./CameraScanner";

type CheckInResult = "ACCEPTED" | "DUPLICATE" | "INVALID_CODE" | "WRONG_EVENT" | "NOT_ELIGIBLE";
type Method = "QR" | "NFC";

/** Phản hồi của POST /check-in (luôn 200, xem `result`). */
type CheckInResponse = {
  result: CheckInResult;
  accepted: boolean;
  message: string;
  checkedInAt: string | null;
  attendee: { fullName: string } | null;
};

type ScanLog = CheckInResponse & { id: number; at: Date; method: Method };

const TONE: Record<CheckInResult, "ok" | "warn" | "bad"> = {
  ACCEPTED: "ok",
  DUPLICATE: "warn",
  NOT_ELIGIBLE: "warn",
  INVALID_CODE: "bad",
  WRONG_EVENT: "bad",
};

const timeFormat = new Intl.DateTimeFormat("vi-VN", { timeStyle: "medium" });

/**
 * Màn quét vé: chọn sự kiện → quét / nhập mã → hiện kết quả to, rõ.
 * Máy quét QR/NFC dạng bàn phím gõ mã rồi Enter, nên ô nhập luôn được focus lại sau mỗi lượt.
 * API chỉ chấp nhận lượt quét từ thành viên ban tổ chức của đúng sự kiện (EventMemberGuard).
 */
export function CheckInScreen() {
  const { user } = useAuth();
  const access = useEventAccess();
  const params = useSearchParams();
  const events = useApi((signal) => api.get<EventSummary[]>("/events", { signal }), [user?.id]);

  // Chỉ những sự kiện mình được check-in, chưa kết thúc quá 1 ngày; đang diễn ra lên đầu.
  const options = useMemo(() => {
    const now = Date.now();
    return access
      .filterEvents(events.data ?? [])
      .filter((e) => access.can(e.id, "checkIn") && e.status !== "CANCELLED")
      .filter((e) => new Date(e.endsAt).getTime() >= now - 24 * 60 * 60 * 1000)
      .sort((a, b) => {
        const live = (e: EventSummary) => new Date(e.startsAt).getTime() <= now && new Date(e.endsAt).getTime() >= now;
        return Number(live(b)) - Number(live(a)) || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      });
  }, [events.data, access]);

  const [eventId, setEventId] = useState("");
  useEffect(() => {
    if (eventId && options.some((e) => e.id === eventId)) return;
    const wanted = params.get("eventId");
    setEventId(options.find((e) => e.id === wanted)?.id ?? options[0]?.id ?? "");
  }, [options, params, eventId]);

  const [method, setMethod] = useState<Method>("QR");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  /** Ref song song với busy để camera (gọi từ vòng lặp đọc khung hình) không gửi chồng lượt quét. */
  const busyRef = useRef(false);
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<ScanLog[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    // Đang dùng camera thì không giành focus (trên điện thoại sẽ bật bàn phím che camera).
    if (!camera) inputRef.current?.focus();
  }, [eventId, method, camera]);

  // Camera chỉ dùng cho mã QR.
  useEffect(() => {
    if (method !== "QR") setCamera(false);
  }, [method]);

  /** Gửi một lượt quét – dùng chung cho ô nhập / máy quét bàn phím và camera. */
  async function submitCode(raw: string, scanMethod: Method) {
    const value = raw.trim();
    if (!value || !eventId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await api.post<CheckInResponse>("/check-in", { eventId, code: value, method: scanMethod });
      seq.current += 1;
      setLog((items) => [{ ...res, id: seq.current, at: new Date(), method: scanMethod }, ...items].slice(0, 10));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không gửi được lượt quét.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitCode(code, method);
    setCode("");
    if (!camera) inputRef.current?.focus();
  }

  const latest = log[0];
  const selected = options.find((e) => e.id === eventId);
  const myRole = selected ? access.roleOf(selected.id) : undefined;

  return (
    <section className="page-section checkin">
      {params.get("eventId") && selected && <BackToEvent eventId={selected.id} name={selected.name} />}
      <h1 className="page-title">Quét vé</h1>
      <EventAccessNotice />

      {events.error && <p className="form-error" role="alert">{events.error}</p>}
      {events.loading && <div className="skeleton-list" aria-busy="true" />}
      {!events.loading && !events.error && options.length === 0 && (
        <div className="placeholder">
          Bạn chưa được phân công check-in ở sự kiện nào đang diễn ra hoặc sắp diễn ra. Nhờ Chủ sự kiện thêm bạn với vai trò Nhân
          viên check-in.
        </div>
      )}

      {options.length > 0 && (
        <>
          <div className="checkin-controls">
            <label className="field">
              <span>Sự kiện</span>
              <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {options.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Cách quét</span>
              <div className="segmented" role="radiogroup" aria-label="Cách quét">
                {(["QR", "NFC"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={method === m}
                    className={method === m ? "active" : ""}
                    onClick={() => setMethod(m)}
                  >
                    {m === "QR" ? "Mã QR" : "Thẻ NFC"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {myRole && access.supported && (
            <p className="muted small">
              Vai trò của bạn ở sự kiện này: <strong>{EVENT_MEMBER_ROLE_LABELS[myRole]}</strong>
            </p>
          )}

          {method === "QR" && (
            <div className="camera-toggle">
              <button type="button" className={camera ? "button button-ghost" : "button"} onClick={() => setCamera((v) => !v)}>
                {camera ? "Tắt camera" : "Quét bằng camera"}
              </button>
            </div>
          )}
          {camera && method === "QR" && <CameraScanner paused={busy} onDetect={(value) => submitCode(value, "QR")} />}

          <form className="scan-form" onSubmit={handleSubmit}>
            <label className="field scan-field">
              <span>{method === "QR" ? (camera ? "Hoặc nhập / dán mã vé" : "Quét QR hoặc dán mã vé") : "Chạm thẻ NFC hoặc nhập UID"}</span>
              <input
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={method === "QR" ? "SE1.xxxx.xxxx" : "04A1B2C3D4E5F6"}
                aria-describedby="scan-hint"
              />
            </label>
            <button type="submit" className="button" disabled={busy || !code.trim() || !eventId}>
              {busy ? "Đang kiểm tra…" : "Check-in"}
            </button>
          </form>
          <p id="scan-hint" className="muted small">
            Máy quét dạng bàn phím tự gửi sau khi đọc mã (phím Enter).
          </p>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div aria-live="assertive" aria-atomic="true">
            {latest && (
              <div className={`scan-result scan-${TONE[latest.result]}`}>
                <strong className="scan-message">{latest.message}</strong>
                {latest.attendee && <span className="scan-name">{latest.attendee.fullName}</span>}
                {latest.result === "DUPLICATE" && latest.checkedInAt && (
                  <span className="small">Đã check-in lúc {timeFormat.format(new Date(latest.checkedInAt))}</span>
                )}
              </div>
            )}
          </div>

          {log.length > 1 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Giờ</th>
                    <th>Kết quả</th>
                    <th>Người tham dự</th>
                    <th>Cách quét</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((item) => (
                    <tr key={item.id}>
                      <td>{timeFormat.format(item.at)}</td>
                      <td>
                        <span className={`pill scan-pill-${TONE[item.result]}`}>{item.message}</span>
                      </td>
                      <td>{item.attendee?.fullName ?? "—"}</td>
                      <td>{item.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
