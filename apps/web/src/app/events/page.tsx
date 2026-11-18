import { CreateEventButton } from "@/features/events/CreateEventButton";
import { EventList } from "@/features/events/EventList";

export default function EventsPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <h1 className="page-title">Sự kiện</h1>
        <CreateEventButton />
      </div>
      <EventList />
    </section>
  );
}
