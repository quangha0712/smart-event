import { PagePlaceholder } from "@/components/PagePlaceholder";
import { RequireAuth } from "@/features/auth/RequireAuth";

export default function Page() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <PagePlaceholder
        eyebrow="NGUỒN LỰC"
        title="Nguồn lực"
        description="Nhân sự, nhà cung cấp, nhà tài trợ, dự toán và thực chi."
        feature="resources"
      />
    </RequireAuth>
  );
}
