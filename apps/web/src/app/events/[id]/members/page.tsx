import { RequireAuth } from "@/features/auth/RequireAuth";
import { EventMembersPanel } from "@/features/events/EventMembersPanel";
import { RequireEventAccess } from "@/features/events/RequireEventAccess";

export default function EventMembersPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <RequireEventAccess capability="viewMembers" eventId={params.id}>
        <EventMembersPanel eventId={params.id} justCreated={searchParams.created === "1"} />
      </RequireEventAccess>
    </RequireAuth>
  );
}
