import { AccountSettings } from "@/features/account/AccountSettings";
import { RequireAuth } from "@/features/auth/RequireAuth";

export default function Page() {
  return (
    <RequireAuth>
      <AccountSettings />
    </RequireAuth>
  );
}
