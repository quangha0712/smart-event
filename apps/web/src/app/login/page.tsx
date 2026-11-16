import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "Đăng nhập · Smart Event" };

export default function LoginPage() {
  // LoginForm đọc ?next= bằng useSearchParams nên cần Suspense để Next build tĩnh được trang.
  return (
    <Suspense fallback={<div className="state">Đang tải…</div>}>
      <LoginForm />
    </Suspense>
  );
}
