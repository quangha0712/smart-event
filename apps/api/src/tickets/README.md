# Tickets module

Vé được cấp ngay khi đăng ký thành công. `qrPayload` là token ngẫu nhiên, duy nhất và là nội dung để frontend mã hóa thành hình QR.

- `GET /api/tickets/:qrCode` — trả tình trạng vé tối thiểu và thông tin sự kiện.
- Payload mẫu demo được tạo bởi seed; không dùng token demo trên môi trường thật.
