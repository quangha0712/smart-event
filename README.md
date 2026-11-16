# Smart Event

Codebase quản lý sự kiện theo kiến trúc monorepo: Next.js, NestJS, MySQL và Prisma.

## Yêu cầu

- Node.js 20 trở lên, npm 10 trở lên
- Docker Desktop (để chạy MySQL)

## Chạy lần đầu

1. Sao chép `.env.example` thành `.env`.
2. Điền `AI_API_KEY` và chọn `AI_MODEL` nếu muốn gọi các tính năng AI; không commit `.env`.
3. Cài dependencies: `npm install`.
4. Chạy `npm run dev`. Script API tự khởi động MySQL bằng Docker Compose, đợi database sẵn sàng, tạo Prisma Client, áp dụng migration và seed dữ liệu demo trước khi chạy NestJS.

Seed tạo ba vé khớp rule và ba vé đối chứng để kiểm tra check-in AI. Thời điểm được tạo tương đối với lúc chạy seed:

- `DEMO-QR-RAPID-REPEAT`: 5 lần quét lặp trong 2 phút, luân phiên qua nhiều máy quét để tạo tín hiệu R1 rõ hơn.
- `DEMO-QR-PERSISTENT-REPEAT`: 5 lần quét lặp trải dài 18 phút, trên nhiều máy quét.
- `DEMO-QR-SEPARATE-BURSTS`: hai cụm, mỗi cụm có 2 lượt trong 1 phút; hai cụm cách nhau 42 phút, có nhiều máy quét.
- `DEMO-QR-SAME-DEVICE-CONTROL`: 3 lượt lặp nhanh nhưng chỉ từ một máy quét.
- `DEMO-QR-TWO-REPEATS-CONTROL`: chỉ có 2 lượt lặp dù dùng hai máy quét.
- `DEMO-QR-NORMAL-CONTROL`: một lượt check-in thành công, không quét lặp.

Log mẫu có `deviceId` của máy quét; chạy seed lại sẽ đặt lại log của riêng sáu vé tình huống này, còn dữ liệu nghiệp vụ khác được giữ nguyên. Seed in ra `from` và `to` để gọi API với đúng khoảng chứa dữ liệu. Frontend gửi `eventId`, `from`, `to`, ví dụ `POST /api/ai/check-in-analysis` với `{"eventId":"demo-smart-event","from":"<seed-from-ISO>","to":"<seed-to-ISO>"}`. Backend tự chạy cả ba rule; endpoint cần cấu hình AI key để trả phần nhận xét LLM.

Web: http://localhost:3000 · API health: http://localhost:3001/api/health · Swagger UI: http://localhost:3001/docs · OpenAPI JSON: http://localhost:3001/docs-json

Swagger được cấu hình một lần ở `apps/api/src/main.ts` và quét tất cả controller đã đăng ký trong `AppModule`. Khi thành viên thêm module/controller mới vào ứng dụng, endpoint sẽ được đưa vào OpenAPI; dùng `@ApiTags("Tên module")` để nhóm API. DTO nên khai báo `@ApiProperty()` để Swagger hiển thị rõ schema request/response.

Trang tổng hợp phản hồi AI: `/events/{eventId}/ai-insights`. Các endpoint AI còn lại được liệt kê trong `docs/03-analysis-and-design/api-contract.md`.

`prisma/schema.prisma` là định nghĩa database; `prisma/migrations/` lưu lịch sử thay đổi schema; `prisma/seed.ts` tạo dữ liệu mẫu. MySQL được chạy bằng Docker Compose tại `infra/docker-compose.yml`.

## Scripts hữu ích

- `npm run db:up` / `npm run db:down`: bật/tắt MySQL.
- `npm run db:seed`: nạp lại ba tình huống log check-in demo.
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
