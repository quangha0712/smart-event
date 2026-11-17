import { FeedbackInsightsPanel } from "@/features/ai/FeedbackInsightsPanel";
import { RequireAuth } from "@/features/auth/RequireAuth";

export default function EventAiInsightsPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <section className="page-section">
        <h1 className="page-title">Phân tích phản hồi</h1>
        <FeedbackInsightsPanel eventId={params.id} />
      </section>
    </RequireAuth>
  );
}
