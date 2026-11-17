# API contract

Base URL cục bộ: `http://localhost:3001/api`.

| Method | Endpoint dự kiến | Mục đích |
|---|---|---|
| GET | `/health` | Kiểm tra API hoạt động |
| POST/GET/PATCH | `/events` | Quản lý sự kiện |
| GET/POST | `/events/:id/schedules` | Quản lý lịch trình |
| POST | `/events/:eventId/registrations` | Đăng ký tham dự, tạo vé QR |
| GET | `/events/:eventId/registrations/:registrationId` | Xem trạng thái đăng ký/vé |
| DELETE | `/events/:eventId/registrations/:registrationId` | Hủy đăng ký |
| GET | `/tickets/:qrCode` | Tra cứu vé bằng payload QR |
| POST | `/events/:eventId/check-in` | Check-in bằng payload QR |
| GET | `/events/:eventId/check-ins/summary?from=&to=` | Tổng hợp lượt check-in theo thời gian |
| GET | `/audit-logs?eventId=&from=&to=&page=&pageSize=` | Tra cứu audit log theo sự kiện/thời gian |
| POST | `/events/:id/feedback` | Gửi đánh giá |
| POST | `/ai/project-summary` | Tóm tắt tiến độ/rủi ro từ dữ liệu PM cung cấp |
| POST | `/ai/requirements-draft` | Tạo bản nháp yêu cầu/use case cho BA rà soát |
| POST | `/ai/budget-estimate` | Gợi ý dự toán sơ bộ sự kiện |
| POST | `/ai/check-in-analysis` | Phân tích số liệu check-in lấy từ log database |
| POST | `/ai/events/:eventId/feedback-insights` | Tổng hợp phản hồi đã lưu của sự kiện |

Các endpoint nghiệp vụ là hợp đồng dự kiến; cập nhật DTO, mã lỗi và quyền truy cập trước khi frontend tích hợp.

Các endpoint AI yêu cầu cấu hình `AI_API_KEY`, `AI_API_BASE_URL`, `AI_MODEL`. Kết quả có `requiresHumanReview: true`; đầu ra dự toán được tính lại tổng từ số lượng và đơn giá do AI trả về. Bảo vệ endpoint bằng xác thực/phân quyền trước khi triển khai ra môi trường dùng thật.

### Phân tích tín hiệu rủi ro check-in

`POST /api/ai/check-in-analysis` nhận `eventId`, `from` và `to` theo ISO 8601. Backend lấy thống kê và chuỗi lần quét theo từng vé trong đúng khoảng thời gian này, gửi cùng prompt/rule cho LLM đánh giá, sau đó hậu kiểm verdict/confidence/evidence với bốn rule.

```json
{
  "eventId": "<event-id-thực-tế>",
  "from": "2026-11-15T08:00:00.000Z",
  "to": "2026-11-15T09:00:00.000Z"
}
```

Frontend chỉ gửi `eventId`, `from`, `to`; không gửi hoặc lựa chọn rule. Backend từ chối thời điểm không hợp lệ, `from > to` hoặc khoảng dài hơn 30 ngày. Backend tự lấy log trong khoảng đã chọn và chạy bốn rule cố định: lặp dồn dập, lặp kéo dài, nhiều cụm tách biệt và nhiều lượt `ACCEPTED` gần đồng thời trên các máy khác nhau. Seed tạo tám tình huống dương tính (hai cho mỗi rule) và ba tình huống đối chứng; `prisma/seed.ts` in ra khoảng `from`/`to` để gọi API với đúng dữ liệu seed.

LLM trả verdict/confidence/evidence cho từng vé; backend chỉ trả `isFraud: true` khi LLM trả `fraud_suspected` với ngưỡng/evidence phù hợp và chuỗi log khớp ít nhất một trong bốn rule. Prompt yêu cầu đánh giá độc lập mọi ticketRef và không bỏ qua rule match chỉ vì có giả thuyết thay thế. `isFraud: true` ở đây nghĩa là **mẫu đáng nghi cần rà soát**, không phải bằng chứng xác nhận ý định gian lận. Thiết bị lấy từ quan hệ `Device` trong DB; production vẫn cần xác thực/quản lý thiết bị. Khi không khớp rule, backend chỉ trả `false` nếu LLM đưa nhận xét không nghi ngờ đủ tin cậy và log vé sạch; nếu không đủ dữ liệu trả `null`. API không tự chặn vé.

Đăng ký nhận `userId` trong body do hệ thống hiện chưa có auth hoàn chỉnh. Khi auth được triển khai, API phải lấy userId từ phiên/token thay vì tin giá trị client gửi lên. Check-in nhận body `{ "qrCode": "...", "deviceId": "scanner-north" }`. Client máy quét phải giữ nguyên `deviceId` cho các lần quét trên cùng máy, không tạo ID mới cho từng request.

## Ví dụ luồng Backend 2

Tạo đăng ký và nhận payload QR:

```http
POST /api/events/demo-smart-event/registrations
Content-Type: application/json

{"userId":"demo-attendee"}
```

Check-in payload nhận được từ đăng ký/seed:

```http
POST /api/events/demo-smart-event/check-in
Content-Type: application/json

{"qrCode":"DEMO-QR-DO-NOT-USE-IN-PRODUCTION","deviceId":"scanner-north"}
```

Kết quả check-in gồm `result` (`ACCEPTED`, `ALREADY_USED` hoặc `INVALID`), `deviceId`, `scannedAt` và thời điểm check-in nếu hợp lệ. Mã QR demo cố định chỉ dùng môi trường phát triển.
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

## Ban tổ chức theo sự kiện

Ban tổ chức (ORGANIZER) chỉ thao tác được trên sự kiện mình là thành viên; ADMIN được phép ở mọi sự kiện. Kiểm tra bằng `EventMemberGuard` (`apps/api/src/auth/event-access.ts`), sai vai trò trả 403.

| Method | Endpoint | Vai trò trong sự kiện | Mục đích |
|---|---|---|---|
| GET | `/me/event-memberships` | (ORGANIZER) | Sự kiện mình là thành viên kèm vai trò |
| PATCH | `/events/:id` | OWNER, CO_ORGANIZER | Sửa thông tin (không sửa sự kiện đã huỷ / kết thúc; sức chứa ≥ số đăng ký; `null` = xoá mô tả / địa điểm / bỏ giới hạn sức chứa) |
| PATCH | `/events/:id/status` `{ status }` | OWNER, CO_ORGANIZER (huỷ: chỉ OWNER) | DRAFT→PUBLISHED (chưa kết thúc), PUBLISHED→DRAFT (chưa có đăng ký), PUBLISHED→COMPLETED (sau giờ kết thúc), DRAFT/PUBLISHED→CANCELLED |
| GET | `/events/:eventId/members` | OWNER, CO_ORGANIZER, CHECKIN_STAFF | Danh sách ban tổ chức |
| POST | `/events/:eventId/members` `{ email, role }` | OWNER | Thêm thành viên (tài khoản phải có quyền ORGANIZER; chỉ ADMIN gán OWNER) |
| PATCH | `/events/:eventId/members/:userId` `{ role }` | OWNER | Đổi vai trò (không đổi OWNER, trừ ADMIN) |
| DELETE | `/events/:eventId/members/:userId` | OWNER | Gỡ thành viên (sự kiện luôn còn ít nhất một OWNER) |

Áp dụng cho API có sẵn:

| API | Vai trò được phép |
|---|---|
| `POST /check-in`, `GET /check-in/events/:eventId/stats` | OWNER, CO_ORGANIZER, CHECKIN_STAFF |
| `/resources/sponsors`, `staff-assignments`, `budget-items`, `expenses`, `budget-summary` | OWNER, CO_ORGANIZER |
| AI theo sự kiện (`check-in-analysis`, `events/:eventId/feedback-insights`) | OWNER, CO_ORGANIZER |
| `GET /audit-logs?eventId=` | OWNER, CO_ORGANIZER |
| Xem / huỷ đăng ký của người khác | OWNER, CO_ORGANIZER (người tham dự chỉ xem / huỷ đăng ký của mình) |

`GET /events` đọc token nếu có: ADMIN nhận mọi sự kiện, ORGANIZER chỉ nhận sự kiện mình thuộc (kèm `myRole`), khách và người tham dự không thấy bản nháp. `POST /events` đặt người tạo làm OWNER. `/resources/staff` và `/resources/vendors` là danh bạ dùng chung, chỉ cần quyền ORGANIZER.
