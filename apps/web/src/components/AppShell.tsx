"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { hasRole, useAuth } from "@/features/auth/AuthProvider";
import { NAV_ITEMS } from "@/lib/navigation";
import { ROLE_LABELS } from "@/types/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const items = NAV_ITEMS.filter((item) => item.roles === undefined || hasRole(user, item.roles));
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            Smart Event
          </Link>
          <nav aria-label="Menu chính" className="nav">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "nav-link active" : "nav-link"}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="account">
            {status === "loading" ? null : user ? (
              <>
                <span className="account-name" title={user.email}>
                  {user.fullName}
                  <span className="role-badge">{ROLE_LABELS[user.role]}</span>
                </span>
                <button type="button" className="button button-ghost" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              pathname !== "/login" && (
                <Link className="button" href={`/login?next=${encodeURIComponent(pathname)}`}>
                  Đăng nhập
                </Link>
              )
            )}
          </div>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
