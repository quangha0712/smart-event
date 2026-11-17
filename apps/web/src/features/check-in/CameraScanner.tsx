"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";

/** Khai báo tối thiểu cho BarcodeDetector (chưa có trong lib DOM của TypeScript). */
type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> };
type BarcodeDetectorCtor = {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

const SCAN_INTERVAL_MS = 200;
/** Thời gian hiện kết quả check-in đè lên camera. */
const FEEDBACK_MS = 2500;

/** Kết quả lượt quét gần nhất để hiện đè lên camera. `id` đổi = lượt mới (kể cả cùng nội dung). */
export type CameraFeedback = {
  id: number;
  tone: "ok" | "warn" | "bad";
  title: string;
  detail?: string;
};

const FEEDBACK_ICON: Record<CameraFeedback["tone"], string> = { ok: "✓", warn: "!", bad: "✕" };
/** Cùng một mã đọc lại trong khoảng này thì bỏ qua (camera thường đọc 1 vé nhiều lần liên tiếp). */
const SAME_CODE_COOLDOWN_MS = 3000;
/** Thu nhỏ khung hình trước khi giải mã bằng jsQR cho nhanh. */
const MAX_DECODE_WIDTH = 640;

function cameraError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Bạn đã chặn quyền dùng camera. Bấm biểu tượng ổ khoá trên thanh địa chỉ để cho phép, rồi bật lại.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Không tìm thấy camera trên thiết bị này.";
  if (name === "NotReadableError") return "Camera đang được ứng dụng khác sử dụng.";
  return "Không mở được camera.";
}

async function createDetector(): Promise<BarcodeDetectorLike | null> {
  const Ctor = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const formats = (await Ctor.getSupportedFormats?.()) ?? ["qr_code"];
    return formats.includes("qr_code") ? new Ctor({ formats: ["qr_code"] }) : null;
  } catch {
    return null;
  }
}

/**
 * Quét QR bằng camera. Dùng BarcodeDetector khi trình duyệt hỗ trợ (Chrome/Android), ngược lại giải mã bằng jsQR.
 * `paused` = đang gửi lượt quét trước → tạm ngừng đọc. Camera chỉ dùng được trên HTTPS hoặc localhost.
 */
export function CameraScanner({
  onDetect,
  paused = false,
  feedback = null,
}: {
  onDetect: (code: string) => void;
  paused?: boolean;
  /** Kết quả check-in vừa xong – hiện đè lên camera ~2,5 giây. */
  feedback?: CameraFeedback | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const lastRef = useRef<{ code: string; at: number } | null>(null);
  const onDetectRef = useRef(onDetect);
  const pausedRef = useRef(paused);
  onDetectRef.current = onDetect;
  pausedRef.current = paused;

  const [status, setStatus] = useState<"starting" | "running" | "error">("starting");
  const [error, setError] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [flash, setFlash] = useState(false);
  const [shown, setShown] = useState<CameraFeedback | null>(null);

  // Mỗi kết quả mới hiện đè lên camera một lúc rồi tự ẩn để quét người tiếp theo.
  useEffect(() => {
    if (!feedback) return;
    setShown(feedback);
    navigator.vibrate?.(feedback.tone === "ok" ? 120 : [80, 60, 80, 60, 80]);
    const t = window.setTimeout(() => setShown((cur) => (cur?.id === feedback.id ? null : cur)), FEEDBACK_MS);
    return () => window.clearTimeout(t);
  }, [feedback]);
  /** Tăng lên để mở lại camera (nút Thử lại). */
  const [attempt, setAttempt] = useState(0);

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const decodeFrame = useCallback(async (video: HTMLVideoElement): Promise<string | null> => {
    if (detectorRef.current) {
      const codes = await detectorRef.current.detect(video);
      return codes[0]?.rawValue ?? null;
    }
    const scale = Math.min(1, MAX_DECODE_WIDTH / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    if (!w || !h) return null;
    const canvas = (canvasRef.current ??= document.createElement("canvas"));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const result = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
    return result?.data ?? null;
  }, []);

  const tick = useCallback(async () => {
    const video = videoRef.current;
    if (video && !pausedRef.current && video.readyState >= 2) {
      try {
        const value = (await decodeFrame(video))?.trim();
        const last = lastRef.current;
        if (value && !(last && last.code === value && Date.now() - last.at < SAME_CODE_COOLDOWN_MS)) {
          lastRef.current = { code: value, at: Date.now() };
          navigator.vibrate?.(80);
          setFlash(true);
          window.setTimeout(() => setFlash(false), 300);
          onDetectRef.current(value);
        }
      } catch {
        // Khung hình lỗi (vd video chưa sẵn sàng) – bỏ qua, đọc khung tiếp theo.
      }
    }
    if (streamRef.current) timerRef.current = window.setTimeout(tick, SCAN_INTERVAL_MS);
  }, [decodeFrame]);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      stop();
      setStatus("starting");
      setError("");
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("Camera chỉ dùng được khi mở trang bằng HTTPS hoặc localhost.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        detectorRef.current ??= await createDetector();
        // Sau khi được cấp quyền mới đọc được tên camera.
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(all.filter((d) => d.kind === "videoinput"));
        if (!cancelled) {
          setStatus("running");
          timerRef.current = window.setTimeout(tick, SCAN_INTERVAL_MS);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(cameraError(e));
        }
      }
    }
    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [deviceId, attempt, stop, tick]);

  function switchCamera() {
    if (devices.length < 2) return;
    const currentId = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId ?? deviceId;
    const index = devices.findIndex((d) => d.deviceId === currentId);
    setDeviceId(devices[(index + 1) % devices.length].deviceId);
  }

  return (
    <div className="camera">
      <div className={flash ? "camera-view camera-flash" : "camera-view"}>
        <video ref={videoRef} playsInline muted aria-label="Hình ảnh camera để quét mã QR" />
        {status === "running" && !shown && <div className="camera-frame" aria-hidden="true" />}
        {status === "starting" && <div className="camera-overlay">Đang mở camera…</div>}
        {status === "running" && paused && !shown && <div className="camera-overlay">Đang kiểm tra vé…</div>}
        {status === "running" && shown && (
          <div key={shown.id} className={`camera-result camera-result-${shown.tone}`} role="status" aria-live="assertive">
            <span className="camera-result-icon" aria-hidden="true">
              {FEEDBACK_ICON[shown.tone]}
            </span>
            <strong className="camera-result-title">{shown.title}</strong>
            {shown.detail && <span className="camera-result-detail">{shown.detail}</span>}
          </div>
        )}
        {status === "error" && <div className="camera-overlay camera-overlay-error">{error}</div>}
      </div>
      <div className="camera-actions">
        <span className="muted small">
          {status === "running" ? "Đưa mã QR vào khung, hệ thống tự check-in khi đọc được." : " "}
        </span>
        {devices.length > 1 && (
          <button type="button" className="button button-ghost" onClick={switchCamera}>
            Đổi camera
          </button>
        )}
        {status === "error" && (
          <button type="button" className="button button-ghost" onClick={() => setAttempt((n) => n + 1)}>
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}
