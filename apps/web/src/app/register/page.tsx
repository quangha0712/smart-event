import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const metadata: Metadata = { title: "Đăng ký · Smart Event" };

export default function RegisterPage() {
  // RegisterForm đọc ?next= bằng useSearchParams nên cần Suspense.
  return (
    <Suspense fallback={<div className="state">Đang tải…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
