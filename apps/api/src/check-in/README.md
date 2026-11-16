# Check-in module

Xác thực vé và ghi nhận check-in một lần, tránh check-in trùng.

- `POST /check-in`: QR/MANUAL kiểm tra chữ ký HMAC của mã vé; NFC tra theo `Ticket.nfcUid`.
- Kết quả: ACCEPTED / DUPLICATE / INVALID_CODE / WRONG_EVENT / NOT_ELIGIBLE, mọi lượt đều ghi vào `CheckInAttempt`.
- `GET /check-in/events/:eventId/stats` tổng hợp số liệu; `POST /ai/events/:eventId/check-in-analysis` dùng chính số liệu này.
