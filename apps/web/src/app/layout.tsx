import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { EventAccessProvider } from "@/features/events/EventAccessProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Event",
  description: "Quản lý sự kiện thông minh",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <EventAccessProvider>
            <AppShell>{children}</AppShell>
          </EventAccessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
