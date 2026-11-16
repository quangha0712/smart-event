"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROLE_LABELS, type UserRole } from "@/types/auth";
import { hasRole, homePathFor, useAuth } from "./AuthProvider";

/**
 * Bọc nội dung trang cần đăng nhập. Chưa đăng nhập → chuyển tới /login?next=<trang hiện tại>.
 * Sai quyền → hiện thông báo 403. Đây chỉ là chặn ở giao diện; API vẫn tự kiểm tra quyền.
 */
export function RequireAuth({ roles = [], children }: { roles?: UserRole[]; children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status === "loading" || (status === "anonymous" && !user)) {
    return (
      <div className="state" role="status">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (!hasRole(user, roles)) {
    return (
      <section className="state state-error" role="alert">
        <h1>Không có quyền truy cập</h1>
        <p>
          Trang này dành cho: {roles.map((r) => ROLE_LABELS[r]).join(", ")}. Tài khoản của bạn là{" "}
          <strong>{user ? ROLE_LABELS[user.role] : "khách"}</strong>.
        </p>
        {user && (
          <Link className="button" href={homePathFor(user)}>
            Về trang của tôi
          </Link>
        )}
      </section>
    );
  }

  return <>{children}</>;
}
