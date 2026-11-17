import { RequireAuth } from "@/features/auth/RequireAuth";
import { UserRoleTable } from "@/features/auth/UserRoleTable";

export default function AdminUsersPage() {
  return (
    <RequireAuth roles={["ADMIN"]}>
      <section className="page-section">
        <h1 className="page-title">Người dùng & phân quyền</h1>
        <p className="muted">Đổi quyền giữa Quản trị viên, Ban tổ chức và Người tham dự.</p>
        <UserRoleTable />
      </section>
    </RequireAuth>
  );
}
