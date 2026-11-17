import { EventList } from "@/features/events/EventList";

export default function EventsPage() {
  return (
    <section className="page-section">
      <h1 className="page-title">Sự kiện</h1>
      <p className="muted">Khám phá những sự kiện trên Smart Event.</p>
      <EventList />
    </section>
  );
}
