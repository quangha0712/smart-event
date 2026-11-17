import { PagePlaceholder } from "@/components/PagePlaceholder";
import { RequireAuth } from "@/features/auth/RequireAuth";

export default function Page() {
  return (
    <RequireAuth roles={["ORGANIZER"]}>
      <PagePlaceholder
        title="Dashboard sự kiện"
        description="Chỉ số đăng ký, check-in, sức chứa và ngân sách theo sự kiện."
      />
    </RequireAuth>
  );
}
