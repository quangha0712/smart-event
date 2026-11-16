# API contract

Base URL cục bộ: `http://localhost:3001/api`.

Mọi endpoint cần header `Authorization: Bearer <accessToken>` (lấy từ `POST /auth/login`), trừ các dòng ghi **Công khai**. Cột Quyền: ADMIN luôn được phép.

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| GET | `/health` | Công khai | Kiểm tra API hoạt động |
| POST | `/auth/register` | Công khai | Đăng ký tài khoản (luôn là ATTENDEE) |
| POST | `/auth/login` | Công khai | Đăng nhập, trả `accessToken` (JWT, mặc định 8h) |
| GET | `/auth/me` | Đã đăng nhập | Thông tin tài khoản hiện tại |
| GET | `/auth/users` | ADMIN | Danh sách tài khoản |
| PATCH | `/auth/users/:id/role` | ADMIN | Đổi quyền ADMIN / ORGANIZER / ATTENDEE |
| GET | `/events`, `/events/:id` | Công khai | Xem sự kiện (kèm lịch trình, diễn giả) |
| POST | `/events` | ORGANIZER | Tạo sự kiện |
| GET/POST | `/events/:id/schedules` | ORGANIZER | Quản lý lịch trình (dự kiến) |
| POST | `/events/:id/registrations` | Đã đăng nhập | Đăng ký tham dự (dự kiến) |
| GET | `/tickets/:code` | Đã đăng nhập | Tra cứu vé (dự kiến) |
| POST | `/check-in` | ORGANIZER | Quét vé: `{ eventId, code, method?: QR|NFC|MANUAL, deviceCode? }`; luôn trả 200 kèm `result` |
| GET | `/check-in/events/:eventId/stats?windowMinutes=` | ORGANIZER | Số liệu tổng hợp từ `CheckInAttempt` |
| POST | `/events/:id/feedback` | Đã đăng nhập | Gửi đánh giá (dự kiến) |
| GET/POST/PATCH/DELETE | `/resources/staff`, `/resources/staff-assignments` | ORGANIZER | Nhân sự và phân công theo sự kiện |
| GET/POST/PATCH/DELETE | `/resources/vendors` | ORGANIZER | Nhà cung cấp |
| GET/POST/PATCH/DELETE | `/resources/sponsors` | ORGANIZER | Nhà tài trợ (gắn sự kiện, có hạng và giá trị tài trợ) |
| GET/POST/PATCH/DELETE | `/resources/budget-items`, `/resources/expenses` | ORGANIZER | Dự toán và thực chi |
| GET | `/resources/budget-summary/:eventId` | ORGANIZER | So sánh dự toán – thực chi |
| POST | `/ai/project-summary` | ORGANIZER | Tóm tắt tiến độ/rủi ro từ dữ liệu PM cung cấp |
| POST | `/ai/requirements-draft` | ORGANIZER | Tạo bản nháp yêu cầu/use case cho BA rà soát |
| POST | `/ai/budget-estimate` | ORGANIZER | Gợi ý dự toán sơ bộ sự kiện |
| POST | `/ai/check-in-analysis` | ORGANIZER | Phân tích với số liệu nhập tay (thử kịch bản) |
| POST | `/ai/events/:eventId/check-in-analysis?windowMinutes=` | ORGANIZER | Phân tích check-in từ dữ liệu thật trong `CheckInAttempt` |
| POST | `/ai/events/:eventId/feedback-insights` | ORGANIZER | Tổng hợp phản hồi đã lưu của sự kiện |

Các endpoint nghiệp vụ là hợp đồng dự kiến; cập nhật DTO, mã lỗi và quyền truy cập trước khi frontend tích hợp.

Các endpoint AI yêu cầu cấu hình `AI_API_KEY`, `AI_API_BASE_URL`, `AI_MODEL`. Kết quả có `requiresHumanReview: true`; đầu ra dự toán được tính lại tổng từ số lượng và đơn giá do AI trả về. Endpoint AI chỉ dành cho ORGANIZER/ADMIN để tránh người ngoài gọi làm tốn phí provider.

Mã lỗi chung: 400 dữ liệu sai / tham chiếu không tồn tại, 401 chưa đăng nhập hoặc token hết hạn, 403 không đủ quyền, 404 không tìm thấy, 409 trùng dữ liệu.

## Mã QR vé

`Ticket.qrCode` có dạng `SE1.<ticketId>.<HMAC-SHA256>` ký bằng `TICKET_QR_SECRET` (`apps/api/src/tickets/ticket-code.ts`). Mã giả hoặc bị sửa trả `INVALID_CODE`; check-in dùng cập nhật có điều kiện nên một vé chỉ được chấp nhận một lần kể cả khi nhiều máy quét cùng lúc. Mọi lượt quét (kể cả bị từ chối) được ghi vào `CheckInAttempt`.
