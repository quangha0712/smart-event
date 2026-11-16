"use client";

import { useState } from "react";

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
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      // Endpoint AI yêu cầu đăng nhập quyền ORGANIZER/ADMIN; token lưu sau khi gọi POST /auth/login.
      let token: string | null = null;
      try {
        token = window.localStorage.getItem("smart-event.accessToken");
      } catch {
        token = null;
      }
      const response = await fetch(`${apiBase}/ai/events/${encodeURIComponent(eventId)}/feedback-insights`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.status === 401 || response.status === 403) {
        throw new Error("Cần đăng nhập bằng tài khoản ban tổ chức để dùng tính năng AI.");
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Không thể tạo phân tích AI.");
      setData(payload as InsightsResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Đã xảy ra lỗi khi gọi AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="ai-insights-title" className="ai-panel">
      <h2 id="ai-insights-title">AI tổng hợp đánh giá sự kiện</h2>
      <p>AI nhóm các chủ đề phản hồi để hỗ trợ ban tổ chức xem xét cải thiện.</p>
      <button type="button" onClick={generateInsights} disabled={loading}>
        {loading ? "Đang phân tích…" : "Tạo tổng hợp AI"}
      </button>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <p className="ai-notice">Bản phân tích do AI tạo; cần người tổ chức rà soát trước khi sử dụng.</p>
          <pre>{JSON.stringify(data.result, null, 2)}</pre>
        </>
      )}
    </section>
  );
}
