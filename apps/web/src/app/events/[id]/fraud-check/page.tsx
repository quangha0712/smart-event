import { BackToEvent } from "@/components/BackToEvent";
import { FraudCheckPanel } from "@/features/ai/FraudCheckPanel";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

export default function EventFraudCheckPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="useAi" eventId={params.id}>
        <section className="page-section">
          <BackToEvent eventId={params.id} />
          <h1 className="page-title">Kiểm tra gian lận vé</h1>
          <FraudCheckPanel eventId={params.id} />
        </section>
      </RequireEventAccess>
    </RequireAuth>
  );
}
