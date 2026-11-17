import { BackToEvent } from "@/components/BackToEvent";
import { FeedbackInsightsPanel } from "@/features/ai/FeedbackInsightsPanel";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

export default function EventAiInsightsPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="useAi" eventId={params.id}>
      <section className="page-section">
        <BackToEvent eventId={params.id} />
        <h1 className="page-title">Phân tích phản hồi</h1>
        <FeedbackInsightsPanel eventId={params.id} />
      </section>
      </RequireEventAccess>
    </RequireAuth>
  );
}
