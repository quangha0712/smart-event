import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Event",
  description: "Quản lý sự kiện thông minh",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
