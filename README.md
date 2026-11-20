# Smart Event

Codebase quản lý sự kiện theo kiến trúc monorepo: Next.js, NestJS, MySQL và Prisma.

## Yêu cầu

- Node.js 20 trở lên, npm 10 trở lên
- MySQL: **Docker Desktop** (`npm run db:up`) **hoặc** MySQL Server 8.x đã cài trên Windows (`npm run db:local`, không cần Docker hay mật khẩu root)

## Chạy lần đầu

1. Sao chép `.env.example` thành `.env`.
2. Điền `AI_API_KEY` và chọn `AI_MODEL` nếu muốn gọi các tính năng AI; không commit `.env`.
3. Cài dependencies: `npm install`.
4. Chạy `npm run dev`. Script API tự khởi động MySQL bằng Docker Compose, đợi database sẵn sàng, tạo Prisma Client, áp dụng migration và seed dữ liệu demo trước khi chạy NestJS.
4. Khởi động MySQL: `npm run db:up` (Docker) hoặc `npm run db:local` (không Docker, xem mục dưới).
5. Tạo Prisma Client: `npm run db:generate`.
6. Áp dụng migration: `npm run db:migrate`.
7. Nạp dữ liệu mẫu: `npm run db:seed`.
8. Chạy web và API: `npm run dev`.

Seed tạo ba vé khớp rule và ba vé đối chứng để kiểm tra check-in AI. Thời điểm được tạo tương đối với lúc chạy seed:

- `DEMO-QR-RAPID-REPEAT`: 5 lần quét lặp trong 2 phút, luân phiên qua nhiều máy quét để tạo tín hiệu R1 rõ hơn.
- `DEMO-QR-PERSISTENT-REPEAT`: 5 lần quét lặp trải dài 18 phút, trên nhiều máy quét.
- `DEMO-QR-SEPARATE-BURSTS`: hai cụm, mỗi cụm có 2 lượt trong 1 phút; hai cụm cách nhau 42 phút, có nhiều máy quét.
- `DEMO-QR-SAME-DEVICE-CONTROL`: 3 lượt lặp nhanh nhưng chỉ từ một máy quét.
- `DEMO-QR-TWO-REPEATS-CONTROL`: chỉ có 2 lượt lặp dù dùng hai máy quét.
- `DEMO-QR-NORMAL-CONTROL`: một lượt check-in thành công, không quét lặp.

Log mẫu gắn với máy quét; chạy seed tạo tám mẫu dương tính (hai cho mỗi rule) và ba mẫu đối chứng. Seed in ra `from` và `to` để gọi API với đúng khoảng chứa dữ liệu. Frontend gửi `eventId`, `from`, `to`, ví dụ `POST /api/ai/check-in-analysis` với `{"eventId":"demo-smart-event","from":"<seed-from-ISO>","to":"<seed-to-ISO>"}`. Backend gửi log và prompt/rule cho LLM tự đánh giá; trên luồng bình thường, backend hậu kiểm verdict/confidence/evidence với log. Endpoint này chờ LLM tối đa 10 giây; nếu quá thời gian hoặc provider trả HTTP 503, API trả response mẫu hardcode trong `apps/api/src/integrations/ai/check-in-analysis.timeout-fallback.ts` (gắn `generatedBy: "timeout-fallback-static"`). Response tĩnh chứa ticket ID, thời gian và kết luận demo cũ, không phản ánh dữ liệu của request hiện tại; chỉ dùng để demo giao diện. Các endpoint AI khác vẫn chờ tối đa 5 phút.

Web: http://localhost:3000 · API health: http://localhost:3001/api/health · Swagger UI: http://localhost:3001/docs · OpenAPI JSON: http://localhost:3001/docs-json

Swagger được cấu hình một lần ở `apps/api/src/main.ts` và quét tất cả controller đã đăng ký trong `AppModule`. Khi thành viên thêm module/controller mới vào ứng dụng, endpoint sẽ được đưa vào OpenAPI; dùng `@ApiTags("Tên module")` để nhóm API. DTO nên khai báo `@ApiProperty()` để Swagger hiển thị rõ schema request/response.

Trang tổng hợp phản hồi AI: `/events/{eventId}/ai-insights`. Các endpoint AI còn lại được liệt kê trong `docs/03-analysis-and-design/api-contract.md`.

`prisma/schema.prisma` là định nghĩa database; `prisma/migrations/` lưu lịch sử thay đổi schema; `prisma/seed.ts` tạo dữ liệu mẫu. MySQL được chạy bằng Docker Compose tại `infra/docker-compose.yml`.

## Chạy MySQL không cần Docker (Windows)

Dùng khi máy không cài được Docker hoặc không nhớ mật khẩu root của MySQL đã cài.
Script `infra/local-mysql/start.ps1` chạy một MySQL riêng bằng chính MySQL Server 8.x có sẵn trên máy, dữ liệu lưu ở `%LOCALAPPDATA%\smart-event\mysql-data`, không đụng tới MySQL đang chạy.

1. Trong `.env`, nếu cổng 3306 đã bị MySQL khác dùng thì đổi cổng của `DATABASE_URL` sang cổng còn trống, ví dụ `mysql://smart_event:smart_event_dev@localhost:3307/smart_event`.
2. Chạy `npm run db:local` và giữ cửa sổ mở. Lần đầu script tự khởi tạo dữ liệu, tạo database và tài khoản theo `DATABASE_URL`.
3. Ở terminal khác: `npm run db:migrate`, `npm run db:seed`, `npm run dev`.
4. Tắt: Ctrl+C hoặc `npm run db:local:stop`.

Gộp thành một lệnh: `npm run dev:local` – tự bật MySQL local, đợi sẵn sàng, migrate + seed rồi chạy API và web; Ctrl+C tắt cả ba (MySQL chỉ bị tắt nếu do lệnh này bật).

MySQL không nằm ở `C:\Program Files\MySQL`? Đặt biến môi trường `MYSQL_BIN` trỏ tới thư mục `bin` chứa `mysqld.exe`.
Root của MySQL riêng này không có mật khẩu và chỉ nghe `127.0.0.1`, chỉ dùng cho máy phát triển.

## Scripts hữu ích

- `npm run db:up` / `npm run db:down`: bật/tắt MySQL.
- `npm run db:seed`: nạp lại ba tình huống log check-in demo.
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

## Đăng nhập và tài khoản demo

API dùng JWT; mọi endpoint cần `Authorization: Bearer <token>` trừ `/health`, `/auth/login`, `/auth/register` và xem sự kiện. `.env` phải có `JWT_SECRET` và `TICKET_QR_SECRET` (chuỗi ngẫu nhiên >= 32 ký tự), nếu thiếu API sẽ dừng khi khởi động. Tạo secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`npm run db:seed` tạo 3 tài khoản (mật khẩu `SEED_DEMO_PASSWORD`, mặc định `SmartEvent@2026`, chỉ dùng cho dev):

| Email | Quyền |
|---|---|
| admin@example.com | ADMIN – toàn quyền, đổi quyền người dùng |
| organizer@example.com | ORGANIZER – quản lý sự kiện, nguồn lực, check-in, AI |
| cohost@example.com | ORGANIZER – Đồng tổ chức sự kiện demo, Chủ sự kiện của một bản nháp riêng |
| checkin@example.com | ORGANIZER – Nhân viên check-in sự kiện demo (đăng nhập vào thẳng màn quét vé) |
| attendee@example.com | ATTENDEE – có sẵn một vé QR (mã in ra khi seed) |

Ban tổ chức chỉ thấy và thao tác trên sự kiện mình là thành viên (bảng `EventMember`): Chủ sự kiện (người tạo, mời thêm người), Đồng tổ chức (nội dung, nguồn lực, ngân sách, check-in, AI, audit log), Nhân viên check-in (chỉ quét vé). Quản trị viên thấy tất cả. `organizer@example.com` là Chủ sự kiện demo.

Các endpoint AI cần API key của nhà cung cấp tương thích OpenAI và có thể phát sinh chi phí theo mức sử dụng. Kết quả AI chỉ là bản nháp/ước lượng, cần con người rà soát. Không gửi dữ liệu cá nhân nhạy cảm.
