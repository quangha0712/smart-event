# Smart Event

Codebase quản lý sự kiện theo kiến trúc monorepo: Next.js, NestJS, MySQL và Prisma.

## Yêu cầu

- Node.js 20 trở lên, npm 10 trở lên
- Docker Desktop (để chạy MySQL)

## Chạy lần đầu

1. Sao chép `.env.example` thành `.env`.
2. Điền `AI_API_KEY` và chọn `AI_MODEL` nếu muốn gọi các tính năng AI; không commit `.env`.
3. Cài dependencies: `npm install`.
4. Khởi động MySQL: `npm run db:up`.
5. Tạo Prisma Client: `npm run db:generate`.
6. Áp dụng migration: `npm run db:migrate`.
7. Nạp dữ liệu mẫu: `npm run db:seed`.
8. Chạy web và API: `npm run dev`.

Web: http://localhost:3000 · API health: http://localhost:3001/api/health

Trang tổng hợp phản hồi AI: `/events/{eventId}/ai-insights`. Các endpoint AI còn lại được liệt kê trong `docs/03-analysis-and-design/api-contract.md`.

`prisma/schema.prisma` là định nghĩa database; `prisma/migrations/` lưu lịch sử thay đổi schema; `prisma/seed.ts` tạo dữ liệu mẫu. MySQL được chạy bằng Docker Compose tại `infra/docker-compose.yml`.

## Scripts hữu ích

- `npm run db:up` / `npm run db:down`: bật/tắt MySQL.
- `npm run db:migrate`: tạo và áp dụng migration khi phát triển.
- `npm run db:studio`: mở Prisma Studio.
- `npm run build`: build API và frontend.

## Cấu trúc

- `apps/web`: giao diện Next.js.
- `apps/api`: REST API NestJS, prefix `/api`.
- `apps/api/src/integrations/ai`: tóm tắt tiến độ PM, bản nháp BA, dự toán sự kiện, phân tích check-in và tổng hợp phản hồi.
- `prisma`: schema, migrations và seed cho MySQL.
- `tests`: test plan, test case, dữ liệu, bug report, API/E2E test và minh chứng tester.
- `docs`, `reports`, `slides`, `demo`: tài liệu quản lý dự án và sản phẩm bàn giao.

Tài khoản seed chỉ là dữ liệu minh họa, chưa dùng để đăng nhập; cần triển khai hash mật khẩu và module xác thực trước khi dùng chức năng auth.

Các endpoint AI cần API key của nhà cung cấp tương thích OpenAI và có thể phát sinh chi phí theo mức sử dụng. Kết quả AI chỉ là bản nháp/ước lượng, cần con người rà soát. Không gửi dữ liệu cá nhân nhạy cảm.
