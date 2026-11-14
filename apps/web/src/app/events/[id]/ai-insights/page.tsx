import { FeedbackInsightsPanel } from "@/features/ai/FeedbackInsightsPanel";

export default function EventAiInsightsPage({ params }: { params: { id: string } }) {
  return (
    <main className="page">
      <span className="eyebrow">EVENT INSIGHTS</span>
      <h1>Phân tích phản hồi</h1>
      <FeedbackInsightsPanel eventId={params.id} />
    </main>
  );
}
