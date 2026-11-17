"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { visibleNavItems } from "@/lib/navigation";
import { UserMenu } from "./UserMenu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const pathname = usePathname();

  const items = visibleNavItems(user);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true">SE</span>
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
              <UserMenu />
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
