import { EventDetailView } from "@/features/events/EventDetailView";

/** Trang công khai; bản nháp chỉ hiện với ban tổ chức của sự kiện và ADMIN (API kiểm tra). */
export default function EventDetailPage({ params }: { params: { id: string } }) {
  return <EventDetailView eventId={params.id} />;
}
