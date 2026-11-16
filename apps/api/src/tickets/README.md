# Tickets module

Vé được cấp ngay khi đăng ký thành công. `qrPayload` là token ngẫu nhiên, duy nhất và là nội dung để frontend mã hóa thành hình QR.

- `GET /api/tickets/:qrCode` — trả tình trạng vé tối thiểu và thông tin sự kiện.
- Payload mẫu demo được tạo bởi seed; không dùng token demo trên môi trường thật.
Phụ trách phát hành và tra cứu vé QR duy nhất.

- `ticket-code.ts`: `signTicketCode(ticketId)` tạo mã `SE1.<ticketId>.<HMAC>`; `verifyTicketCode(code)` kiểm tra chữ ký (so sánh thời gian hằng).
- Khi phát hành vé: tạo id trước, lưu `qrCode = signTicketCode(id)`. Cần `TICKET_QR_SECRET` trong `.env`; đổi khoá làm mọi QR cũ mất hiệu lực.
