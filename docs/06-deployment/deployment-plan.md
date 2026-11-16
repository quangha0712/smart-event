# Kế hoạch triển khai

## Môi trường phát triển

- MySQL 8.4 chạy bằng Docker Compose tại `infra/docker-compose.yml`.
- API NestJS chạy ở cổng 3001, prefix `/api`.
- Web Next.js chạy ở cổng 3000.

## Quy trình

1. Cài Node.js 20+, npm 10+ và khởi động Docker Desktop.
2. Sao chép `.env.example` thành `.env`; điền cấu hình AI nếu cần gọi AI.
3. Chạy `npm install` tại thư mục gốc.
4. Chạy duy nhất `npm run dev` để khởi động web và API. Script API tự bật MySQL, đợi healthcheck, chạy Prisma generate/migration/seed rồi mới khởi động NestJS; web Next.js chạy đồng thời.
5. Mở web tại `http://localhost:3000`, kiểm tra API tại `http://localhost:3001/api/health`.
6. Seed in khoảng `from`/`to` của dữ liệu check-in mẫu để dùng khi gọi `POST /api/ai/check-in-analysis`.
7. Chạy test bằng `npm run test --workspace apps/api`; chỉ ghi kết quả vào `tests/test-evidence/` sau khi thực sự chạy.

Để chỉ chạy riêng API, dùng `npm run dev:api`; API cũng tự bật MySQL/migration/seed. Các lệnh này yêu cầu Docker hoạt động, `.env` có `DATABASE_URL` hợp lệ và dependencies đã cài.
