# Smart Event

Codebase quản lý sự kiện theo kiến trúc monorepo: Next.js, NestJS, MySQL và Prisma.

## Yêu cầu

- Node.js 20 trở lên, npm 10 trở lên
- MySQL: **Docker Desktop** (`npm run db:up`) **hoặc** MySQL Server 8.x đã cài trên Windows (`npm run db:local`, không cần Docker hay mật khẩu root)

## Chạy lần đầu

1. Sao chép `.env.example` thành `.env`.
2. Điền `AI_API_KEY` và chọn `AI_MODEL` nếu muốn gọi các tính năng AI; không commit `.env`.
3. Cài dependencies: `npm install`.
4. Khởi động MySQL: `npm run db:up` (Docker) hoặc `npm run db:local` (không Docker, xem mục dưới).
5. Tạo Prisma Client: `npm run db:generate`.
6. Áp dụng migration: `npm run db:migrate`.
7. Nạp dữ liệu mẫu: `npm run db:seed`.
8. Chạy web và API: `npm run dev`.

Web: http://localhost:3000 · API health: http://localhost:3001/api/health

Trang tổng hợp phản hồi AI: `/events/{eventId}/ai-insights`. Các endpoint AI còn lại được liệt kê trong `docs/03-analysis-and-design/api-contract.md`.

`prisma/schema.prisma` là định nghĩa database; `prisma/migrations/` lưu lịch sử thay đổi schema; `prisma/seed.ts` tạo dữ liệu mẫu. MySQL được chạy bằng Docker Compose tại `infra/docker-compose.yml`.

## Chạy MySQL không cần Docker (Windows)

Dùng khi máy không cài được Docker hoặc không nhớ mật khẩu root của MySQL đã cài.
Script `infra/local-mysql/start.ps1` chạy một MySQL riêng bằng chính MySQL Server 8.x có sẵn trên máy, dữ liệu lưu ở `%LOCALAPPDATA%\smart-event\mysql-data`, không đụng tới MySQL đang chạy.

1. Trong `.env`, nếu cổng 3306 đã bị MySQL khác dùng thì đổi cổng của `DATABASE_URL` sang cổng còn trống, ví dụ `mysql://smart_event:smart_event_dev@localhost:3307/smart_event`.
2. Chạy `npm run db:local` và giữ cửa sổ mở. Lần đầu script tự khởi tạo dữ liệu, tạo database và tài khoản theo `DATABASE_URL`.
3. Ở terminal khác: `npm run db:migrate`, `npm run db:seed`, `npm run dev`.
4. Tắt: Ctrl+C hoặc `npm run db:local:stop`.

MySQL không nằm ở `C:\Program Files\MySQL`? Đặt biến môi trường `MYSQL_BIN` trỏ tới thư mục `bin` chứa `mysqld.exe`.
Root của MySQL riêng này không có mật khẩu và chỉ nghe `127.0.0.1`, chỉ dùng cho máy phát triển.

## Scripts hữu ích

- `npm run db:up` / `npm run db:down`: bật/tắt MySQL bằng Docker.
- `npm run db:local` / `npm run db:local:stop`: bật/tắt MySQL riêng của dự án không cần Docker.
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
