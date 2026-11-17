import { RequireAuth } from "@/features/auth/RequireAuth";
import { MyTickets } from "@/features/tickets/MyTickets";

export default function Page() {
  return (
    <RequireAuth>
      <MyTickets />
    </RequireAuth>
  );
}
