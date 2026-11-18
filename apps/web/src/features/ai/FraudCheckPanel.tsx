"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { toLocalInput } from "@/lib/format";

type TicketConclusion = {
  ticketRef: string;
  isFraud?: boolean;
  evidenceDetails?: string[];
  decisionReason?: string;
};

type CheckInAnalysisResponse = {
  result?: {
    ticketFraudConclusions?: TicketConclusion[];
    recommendations?: string[];
  };
  generatedBy?: string;
  requiresHumanReview?: boolean;
};

const DAY = 24 * 60 * 60_000;

export function FraudCheckPanel({ eventId }: { eventId: string }) {
  const [from, setFrom] = useState(() => toLocalInput(new Date(Date.now() - 7 * DAY).toISOString()));
  const [to, setTo] = useState(() => toLocalInput(new Date().toISOString()));
  const [data, setData] = useState<CheckInAnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.valueOf()) || Number.isNaN(toDate.valueOf())) {
      setError("Hãy chọn đủ thời điểm bắt đầu và kết thúc.");
      return;
    }
    if (fromDate > toDate) {
      setError("Thời điểm bắt đầu không được sau thời điểm kết thúc.");
      return;
    }
    if (toDate.valueOf() - fromDate.valueOf() > 30 * DAY) {
      setError("Khoảng kiểm tra tối đa là 30 ngày.");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);
    try {
      setData(
        await api.post<CheckInAnalysisResponse>("/ai/check-in-analysis", {
          eventId,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        }),
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Không kiểm tra được vé. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const frauds = (data?.result?.ticketFraudConclusions ?? []).filter((t) => t.isFraud === true);
  const recommendations = data?.result?.recommendations ?? [];

  return (
    <div className="fraud-check">
      <form className="form form-card fraud-form" onSubmit={analyze} noValidate>
        <div className="form-row">
          <label className="field">
            Từ lúc
            <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label className="field">
            Đến lúc
            <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} required />
          </label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Đang kiểm tra…" : "Kiểm tra vé"}
          </button>
        </div>
      </form>

      {loading && <div className="state" role="status">Đang phân tích nhật ký check-in…</div>}

      {data && !loading && (
        <section className="fraud-result" aria-labelledby="fraud-result-title">
          <h2 id="fraud-result-title">Vé nghi gian lận ({frauds.length})</h2>
          <p className="muted">Kết quả do AI hỗ trợ, chỉ để tham khảo. Ban tổ chức cần rà soát trước khi xử lý.</p>
          {frauds.length === 0 ? (
            <div className="state" role="status">Không phát hiện vé nghi gian lận trong khoảng thời gian này.</div>
          ) : (
            <div className="table-wrap">
              <table className="table fraud-table">
                <thead>
                  <tr>
                    <th scope="col">Mã vé</th>
                    <th scope="col">Bằng chứng</th>
                    <th scope="col">Lý do kết luận</th>
                    <th scope="col">Khuyến nghị</th>
                  </tr>
                </thead>
                <tbody>
                  {frauds.map((ticket, index) => (
                    <tr key={ticket.ticketRef}>
                      <td><code>{ticket.ticketRef}</code></td>
                      <td>
                        <ul>
                          {(ticket.evidenceDetails ?? []).map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                      </td>
                      <td>{ticket.decisionReason}</td>
                      {index === 0 && (
                        <td rowSpan={frauds.length}>
                          {recommendations.length === 0 ? (
                            "Chưa có khuyến nghị."
                          ) : (
                            <ul>{recommendations.map((line, i) => <li key={i}>{line}</li>)}</ul>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
