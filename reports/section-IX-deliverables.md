# IX. Sản phẩm nộp

Liệt kê báo cáo, slide, kế hoạch, tài liệu thiết kế, mã nguồn, kiểm thử, hướng dẫn, ảnh và video demo.

Nếu hoàn thành hạng mục AI, liệt kê prompt/API, UI liên quan, cấu hình hướng dẫn không chứa secret, kết quả rà soát và minh chứng demo.

## Tiểu mục bàn giao TV4 – Backend 2

- Prisma schema/migration/seed MySQL: `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`.
- API đăng ký, vé QR, check-in, audit log: `apps/api/src/registrations/`, `tickets/`, `check-in/`, `audit-log/`.
- API AI check-in, prompt và policy: `apps/api/src/integrations/ai/`.
- Khởi chạy một lệnh: `npm run dev`; hướng dẫn tại `README.md` và `docs/06-deployment/deployment-plan.md`.
- Unit test tại `apps/api/test/`; test case thủ công tại `tests/test-cases/`. Test chưa chạy nên chưa có minh chứng đạt; chỉ bổ sung evidence sau khi thực thi thật.
