# Registrations module

- `POST /api/events/:eventId/registrations` — đăng ký; kiểm tra sự kiện đã công bố, thời gian, sức chứa và đăng ký trùng; cấp vé trong cùng transaction.
- `GET /api/events/:eventId/registrations/:registrationId` — xem trạng thái đăng ký và payload vé.
- `DELETE /api/events/:eventId/registrations/:registrationId` — hủy đăng ký chưa check-in và giải phóng sức chứa.

Hiện `userId` được nhận trong body vì auth chưa hoàn thiện. Chỉ dùng local/dev; khi có auth cần lấy userId từ token.
