import { PagePlaceholder } from "@/components/PagePlaceholder";
import { RequireAuth } from "@/features/auth/RequireAuth";

export default function Page() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <PagePlaceholder
        title="Check-in vé"
        description="Quét QR / NFC tại cổng, ghi nhận tham dự một lần và theo dõi lượt quét."
      />
    </RequireAuth>
  );
}
