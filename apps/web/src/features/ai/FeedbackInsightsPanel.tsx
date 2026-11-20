"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";

type InsightsResponse = {
  result: Record<string, unknown>;
  generatedBy: string;
  requiresHumanReview: boolean;
};

export function FeedbackInsightsPanel({ eventId }: { eventId: string }) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateInsights() {
    setLoading(true);
    setError("");
    setData(null);
    try {
      // api tự gắn token; endpoint AI chỉ dành cho ORGANIZER/ADMIN.
      setData(await api.post<InsightsResponse>(`/ai/events/${encodeURIComponent(eventId)}/feedback-insights`));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Đã xảy ra lỗi khi gọi AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="ai-insights-title" className="ai-panel">
      <h2 id="ai-insights-title">AI tổng hợp đánh giá sự kiện</h2>
      <p>AI nhóm các chủ đề phản hồi để hỗ trợ ban tổ chức xem xét cải thiện.</p>
      <button className="button" type="button" onClick={generateInsights} disabled={loading}>
        {loading ? "Đang phân tích…" : "Tạo tổng hợp AI"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
      {data && (
        <>
          <p className="ai-notice">Bản phân tích do AI tạo; cần người tổ chức rà soát trước khi sử dụng.</p>
          <pre>{JSON.stringify(data.result, null, 2)}</pre>
        </>
      )}
    </section>
  );
}
