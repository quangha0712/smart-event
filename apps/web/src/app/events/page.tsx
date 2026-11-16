import { EventList } from "@/features/events/EventList";

export default function EventsPage() {
  return (
    <section className="page-section">
      <span className="eyebrow">SỰ KIỆN</span>
      <h1 className="page-title">Sự kiện</h1>
      <EventList />
    </section>
  );
}
