# Tickets module

Phụ trách phát hành và tra cứu vé QR duy nhất.

- `ticket-code.ts`: `signTicketCode(ticketId)` tạo mã `SE1.<ticketId>.<HMAC>`; `verifyTicketCode(code)` kiểm tra chữ ký (so sánh thời gian hằng).
- Khi phát hành vé: tạo id trước, lưu `qrCode = signTicketCode(id)`. Cần `TICKET_QR_SECRET` trong `.env`; đổi khoá làm mọi QR cũ mất hiệu lực.
