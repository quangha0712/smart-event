"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";

/* ---------- Kiểu dữ liệu: khớp POST /ai/check-in-analysis (apps/api/src/integrations/ai/ai.service.ts) ---------- */

type ScanStatus = "ACCEPTED" | "ALREADY_USED" | "INVALID" | "NOT_ELIGIBLE";
type ScanAttempt = { status: ScanStatus; scannedAt: string; deviceId: string };
type Decision = "FRAUD_BY_PROJECT_POLICY" | "NO_FRAUD_SIGNAL" | "INCONCLUSIVE";

type TicketConclusion = {
  ticketRef: string;
  llmAssessment: {
    verdict?: string;
    confidence?: number;
    evidence?: string[];
    alternativeExplanations?: string[];
  } | null;
  matchedRules: string[];
  /** Câu mô tả từng lượt quét do API dựng từ log (giờ Việt Nam). */
  evidenceDetails?: string[];
  scanEvidence: {
    counts: { accepted: number; alreadyUsed: number; invalid: number; notEligible: number };
    acceptedAttempts: ScanAttempt[];
    repeatedAttempts: ScanAttempt[];
    invalidAttempts: ScanAttempt[];
  };
  decision: Decision;
  decisionReason: string;
};

type Anomaly = { signal?: string; severity?: string; explanation?: string; evidence?: string };

export type FraudCheckResponse = {
  result: {
    summary?: string;
    riskLevel?: string;
    anomalies?: Anomaly[];
    recommendations?: string[];
    ticketFraudConclusions?: TicketConclusion[];
    organizerDecisionSupport?: { status: string; message: string };
  };
  generatedBy: string;
  requiresHumanReview: boolean;
};

/* ---------- Nhãn tiếng Việt ---------- */

const RULE_LABELS: Record<string, string> = {
  R1_RAPID_DUPLICATE_USE: "R1 · Quét lặp nhanh trên nhiều máy",
  R2_PERSISTENT_DUPLICATE_USE: "R2 · Quét lặp kéo dài",
  R3_SEPARATE_REPEAT_BURSTS: "R3 · Quét lặp theo từng đợt",
  R4_MULTIPLE_ACCEPTED_DIFFERENT_DEVICES: "R4 · Được chấp nhận đồng thời trên nhiều máy",
};

const DECISION: Record<Decision, { label: string; tone: "bad" | "warn" | "ok"; reason?: string }> = {
  FRAUD_BY_PROJECT_POLICY: { label: "Nghi gian lận", tone: "bad" },
  INCONCLUSIVE: {
    label: "Cần xem lại",
    tone: "warn",
    // API trả câu tiếng Anh cho trường hợp này – thay bằng câu dễ hiểu.
    reason: "Có quét lặp nhưng chưa khớp quy tắc gian lận nào; nên xem lại lịch sử quét nếu thấy cần.",
  },
  NO_FRAUD_SIGNAL: { label: "Bình thường", tone: "ok" },
};

const RISK: Record<string, { label: string; tone: "bad" | "warn" | "ok" }> = {
  high: { label: "Rủi ro cao", tone: "bad" },
  review: { label: "Cần rà soát", tone: "warn" },
  low: { label: "Rủi ro thấp", tone: "ok" },
};

const PAGE_SIZE = 5;
/** Số dòng bằng chứng hiện sẵn trong ô; phần còn lại nằm trong "Xem thêm". */
const EVIDENCE_PREVIEW = 3;

const DECISION_ORDER: Decision[] = ["FRAUD_BY_PROJECT_POLICY", "INCONCLUSIVE", "NO_FRAUD_SIGNAL"];

const RANGES = [
  { value: "60", label: "1 giờ qua" },
  { value: "180", label: "3 giờ qua" },
  { value: "all", label: "Toàn bộ giờ check-in" },
] as const;
type Range = (typeof RANGES)[number]["value"];

/** Giờ hiển thị luôn lấy từ scannedAt (ISO) theo múi giờ máy người xem, không dùng chuỗi giờ trong văn bản AI. */
const timeFmt = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Bật để luôn dùng dữ liệu mẫu (không gọi AI): NEXT_PUBLIC_CHECKIN_AI_MOCK=1 */
const FORCE_MOCK = process.env.NEXT_PUBLIC_CHECKIN_AI_MOCK === "1";

async function loadMock() {
  const mod = await import("./fraudCheckMock.json");
  return mod.default as unknown as FraudCheckResponse;
}

type Props = {
  eventId: string;
  /** Giờ mở cổng check-in và giờ kết thúc sự kiện – dùng cho lựa chọn "Toàn bộ giờ check-in". */
  opensAt: Date | null;
  closesAt: Date | null;
  onClose: () => void;
};

/**
 * Kiểm tra gian lận check-in: gửi khoảng thời gian cho AI phân tích log quét,
 * hiện mức rủi ro, các mẫu bất thường và kết luận theo từng vé (đã áp quy tắc R1–R4 phía API).
 * Kết quả chỉ để ban tổ chức rà soát, không tự chặn vé.
 */
export function FraudCheckPanel({ eventId, opensAt, closesAt, onClose }: Props) {
  const [range, setRange] = useState<Range>("60");
  const [data, setData] = useState<FraudCheckResponse | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canUseMock, setCanUseMock] = useState(false);
  const [filter, setFilter] = useState<Decision | "ALL">("ALL");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  async function run(useMock = FORCE_MOCK) {
    setLoading(true);
    setError("");
    setCanUseMock(false);
    try {
      if (useMock) {
        setData(await loadMock());
        setIsMock(true);
      } else {
        const to = new Date(Math.min(Date.now(), closesAt?.getTime() ?? Date.now()));
        const from =
          range === "all" && opensAt
            ? new Date(Math.min(to.getTime(), Math.max(opensAt.getTime(), to.getTime() - 30 * 24 * 60 * 60_000)))
            : new Date(to.getTime() - Number(range === "all" ? 60 : range) * 60_000);
        setData(
          await api.post<FraudCheckResponse>("/ai/check-in-analysis", {
            eventId,
            from: from.toISOString(),
            to: to.toISOString(),
          }),
        );
        setIsMock(false);
      }
      setFilter("ALL");
      setCheckedAt(new Date());
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Không gọi được dịch vụ phân tích.");
      // AI chưa cấu hình / lỗi dịch vụ AI → cho xem bản demo (ghi rõ là dữ liệu mẫu).
      setCanUseMock(cause instanceof ApiError && (cause.status === 503 || cause.status === 502));
    } finally {
      setLoading(false);
    }
  }

  const tickets = useMemo(() => {
    const list = data?.result.ticketFraudConclusions ?? [];
    return [...list].sort(
      (a, b) =>
        DECISION_ORDER.indexOf(a.decision) - DECISION_ORDER.indexOf(b.decision) ||
        (b.llmAssessment?.confidence ?? 0) - (a.llmAssessment?.confidence ?? 0),
    );
  }, [data]);

  const counts = useMemo(() => {
    const c: Record<Decision, number> = { FRAUD_BY_PROJECT_POLICY: 0, INCONCLUSIVE: 0, NO_FRAUD_SIGNAL: 0 };
    for (const t of tickets) c[t.decision] = (c[t.decision] ?? 0) + 1;
    return c;
  }, [tickets]);

  const visible = filter === "ALL" ? tickets : tickets.filter((t) => t.decision === filter);
  const [page, setPage] = useState(1);
  // Đổi bộ lọc / có kết quả mới thì về trang 1.
  useEffect(() => setPage(1), [filter, data]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const risk = RISK[data?.result.riskLevel ?? ""];

  return (
    <section className="fraud-panel" aria-labelledby="fraud-title">
      <div className="fraud-head">
        <div>
          <h2 id="fraud-title">Kiểm tra gian lận check-in</h2>
          <p className="muted small">
            AI đọc log quét (thời điểm, máy quét, kết quả) để tìm vé bị dùng lặp hoặc được chấp nhận trùng trên nhiều máy.
          </p>
        </div>
        <button type="button" className="button button-ghost" onClick={onClose} aria-label="Đóng kiểm tra gian lận">
          Đóng
        </button>
      </div>

      <div className="fraud-run">
        {!FORCE_MOCK && (
          <div className="segmented" role="radiogroup" aria-label="Khoảng thời gian phân tích">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={range === r.value}
                className={range === r.value ? "active" : ""}
                onClick={() => setRange(r.value)}
                disabled={loading || (r.value === "all" && !opensAt)}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="button" onClick={() => run()} disabled={loading || !eventId}>
          {loading ? "Đang phân tích…" : data ? "Phân tích lại" : "Bắt đầu kiểm tra"}
        </button>
      </div>

      {error && (
        <div className="form-error fraud-error" role="alert">
          <span>{error}</span>
          {canUseMock && (
            <button type="button" className="button button-ghost" onClick={() => run(true)} disabled={loading}>
              Xem bản demo với dữ liệu mẫu
            </button>
          )}
        </div>
      )}

      {loading && <div className="skeleton-list" aria-busy="true" />}

      {data && !loading && (
        <div className="fraud-body" aria-live="polite">
          {isMock && (
            <p className="notice-warn">
              Đây là <strong>dữ liệu mẫu</strong> để minh hoạ, không phải log quét của sự kiện đang chọn.
            </p>
          )}

          <div className={`fraud-verdict scan-${risk?.tone ?? "warn"}`}>
            <div className="fraud-verdict-top">
              {risk && <span className={`pill scan-pill-${risk.tone}`}>{risk.label}</span>}
              <strong>{data.result.organizerDecisionSupport?.message ?? "Kết quả phân tích"}</strong>
            </div>
            {data.result.summary && <p>{data.result.summary}</p>}
            <p className="small fraud-meta">
              Tạo bởi {data.generatedBy}
              {checkedAt && ` · lúc ${timeFmt.format(checkedAt)}`} · Kết quả AI chỉ để tham khảo, ban tổ chức cần tự đối chiếu trước khi
              xử lý người tham dự.
            </p>
          </div>

          <div className="fraud-kpis" role="group" aria-label="Lọc theo kết luận">
            <button type="button" className={filter === "ALL" ? "active" : ""} onClick={() => setFilter("ALL")}>
              <span className="fraud-kpi-value">{tickets.length}</span>
              <span>Vé được phân tích</span>
            </button>
            {DECISION_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                className={`fraud-kpi-${DECISION[d].tone} ${filter === d ? "active" : ""}`}
                onClick={() => setFilter(filter === d ? "ALL" : d)}
                aria-pressed={filter === d}
              >
                <span className="fraud-kpi-value">{counts[d]}</span>
                <span>{DECISION[d].label}</span>
              </button>
            ))}
          </div>

          <div>
            <h3 className="fraud-h3">Kết luận theo vé {filter !== "ALL" && `· ${DECISION[filter].label}`}</h3>
            {visible.length === 0 ? (
              <p className="muted small">Không có vé nào trong nhóm này.</p>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="table fraud-table">
                    <thead>
                      <tr>
                        <th scope="col">Mã vé (ticketRef)</th>
                        <th scope="col">Chi tiết bằng chứng</th>
                        <th scope="col">Lý do kết luận</th>
                        <th scope="col">Khuyến nghị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((t) => (
                        <TicketRow key={t.ticketRef} ticket={t} recommendations={data.result.recommendations ?? []} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={safePage} pageCount={pageCount} total={visible.length} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** Mã quy tắc ngắn (R1…R4) của một vé, để ghép với khuyến nghị có nhắc tới quy tắc đó. */
function ruleCodes(rules: string[]) {
  return new Set(rules.map((r) => r.match(/^R\d+/)?.[0]).filter((c): c is string => Boolean(c)));
}

/**
 * Khuyến nghị của AI là cho cả đợt phân tích, không theo từng vé.
 * Mỗi vé lấy các khuyến nghị nhắc tới quy tắc mà vé đó khớp; vé nghi gian lận không có khuyến nghị riêng thì lấy khuyến nghị chung.
 */
function recommendationsFor(ticket: TicketConclusion, all: string[]): string[] {
  if (ticket.decision === "NO_FRAUD_SIGNAL") return ["Không cần xử lý."];
  if (ticket.decision === "INCONCLUSIVE") {
    return ["Xem lại lịch sử quét của vé; nếu đúng là một khách quét nhiều lần tại cùng cổng thì không cần xử lý."];
  }
  const codes = ruleCodes(ticket.matchedRules);
  const mentions = (r: string) => r.match(/\bR\d+\b/g) ?? [];
  const matched = all.filter((r) => mentions(r).some((c) => codes.has(c)));
  if (matched.length > 0) return matched;
  const general = all.filter((r) => mentions(r).length === 0);
  return general.length > 0 ? general : ["Rà soát lịch sử check-in của vé này."];
}

function TicketRow({ ticket, recommendations }: { ticket: TicketConclusion; recommendations: string[] }) {
  const d = DECISION[ticket.decision] ?? DECISION.INCONCLUSIVE;
  const details = ticket.evidenceDetails ?? [];
  const shown = details.slice(0, EVIDENCE_PREVIEW);
  const rest = details.slice(EVIDENCE_PREVIEW);
  const recos = recommendationsFor(ticket, recommendations);

  return (
    <tr className={`fraud-row-${d.tone}`}>
      <td>
        <code className="fraud-ref">{ticket.ticketRef}</code>
        {ticket.matchedRules.length > 0 && (
          <div className="fraud-rules">
            {ticket.matchedRules.map((r) => (
              <span key={r} className="pill">
                {RULE_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        )}
      </td>
      <td>
        {details.length === 0 ? (
          <span className="muted">—</span>
        ) : (
          <>
            <ul className="fraud-cell-list">
              {shown.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
            {rest.length > 0 && (
              <details className="fraud-details">
                <summary>Xem thêm {rest.length} lượt quét</summary>
                <ul className="fraud-cell-list">
                  {rest.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </td>
      <td>
        <span className={`pill scan-pill-${d.tone}`}>{d.label}</span>
        <p className="fraud-cell-text">{d.reason ?? ticket.decisionReason}</p>
      </td>
      <td>
        <ul className="fraud-cell-list">
          {recos.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

function Pager({ page, pageCount, total, onChange }: { page: number; pageCount: number; total: number; onChange: (p: number) => void }) {
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <nav className="pager" aria-label="Phân trang kết luận theo vé">
      <span className="muted small">
        {from}–{to} / {total} vé
      </span>
      {pageCount > 1 && (
        <div className="pager-buttons">
          <button type="button" className="button button-ghost" onClick={() => onChange(page - 1)} disabled={page <= 1}>
            ‹ Trước
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={p === page ? "button" : "button button-ghost"}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
          <button type="button" className="button button-ghost" onClick={() => onChange(page + 1)} disabled={page >= pageCount}>
            Sau ›
          </button>
        </div>
      )}
    </nav>
  );
}
