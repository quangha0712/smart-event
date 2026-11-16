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

`POST /api/ai/check-in-analysis` nhận `eventId`, `from` và `to` theo ISO 8601. Backend lấy thống kê và chuỗi lần quét theo từng vé trong đúng khoảng thời gian này, gửi cho LLM đánh giá, sau đó áp dụng cả ba chính sách hậu xử lý cố định.

```json
{
  "eventId": "<event-id-thực-tế>",
  "from": "2026-11-15T08:00:00.000Z",
  "to": "2026-11-15T09:00:00.000Z"
}
```

Frontend chỉ gửi `eventId`, `from`, `to`; không gửi hoặc lựa chọn rule. Backend từ chối thời điểm không hợp lệ, `from > to` hoặc khoảng dài hơn 30 ngày. Backend tự lấy log trong khoảng đã chọn và chạy cả ba rule với ngưỡng nội bộ cố định: 5 phút, 10 phút, cụm 5 phút và khoảng cách cụm 30 phút. Seed tạo đủ ba tình huống khớp rule và ba tình huống đối chứng; `prisma/seed.ts` in ra khoảng `from`/`to` để gọi API với đúng dữ liệu seed.

Backend trả `isFraud: true` theo chính sách demo nếu LLM trả `fraud_suspected`, có evidence và khớp ít nhất một trong ba rule cố định: (1) confidence >=0.85, `ACCEPTED` rồi >=3 `ALREADY_USED` trong 5 phút trên >=2 thiết bị; (2) confidence >=0.90, >=5 lượt lặp sau `ACCEPTED`, kéo dài >=10 phút, từ >=2 thiết bị; (3) confidence >=0.90, >=2 cụm lặp (mỗi cụm >=2 lượt trong 5 phút, bắt đầu cách nhau >=30 phút), tổng >=2 thiết bị và ít nhất một cụm được quét từ >=2 thiết bị. `isFraud: true` ở đây nghĩa là **mẫu đáng nghi cần rà soát**, không phải bằng chứng xác nhận ý định gian lận. `deviceId` do client gửi; môi trường production cần đăng ký/xác thực máy quét để chống giả mạo ID. Trả `false` khi LLM trả `not_suspected` với confidence >=0.85 và log vé không có lượt lặp/mã sai; trường hợp khác trả `null`. API không tự chặn vé.

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
