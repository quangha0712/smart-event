import { FeedbackInsightsPanel } from "@/features/ai/FeedbackInsightsPanel";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

export default function EventAiInsightsPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="useAi" eventId={params.id}>
      <section className="page-section">
        <span className="eyebrow">EVENT INSIGHTS</span>
        <h1 className="page-title">Phân tích phản hồi</h1>
        <FeedbackInsightsPanel eventId={params.id} />
      </section>
      </RequireEventAccess>
    </RequireAuth>
  );
}
