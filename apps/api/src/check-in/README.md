# Check-in module

- `POST /api/events/:eventId/check-in` với body `{ "qrCode": "...", "deviceId": "scanner-north" }` — kiểm tra vé, ghi nhận kết quả và không cho check-in thành công hai lần.
- `GET /api/events/:eventId/check-ins/summary?from=&to=` — tổng hợp lượt thành công, quét lặp và mã sai theo thời gian.
- Mỗi lần quét ghi `eventId`, `ticketId` nếu xác định được, `deviceId`, trạng thái và thời điểm vào `CheckInAttempt`; thao tác quan trọng được ghi vào `AuditLog`.
- Máy quét cần gửi lại cùng `deviceId` ở mọi lần quét; ID này hiện do client cung cấp, chưa được xác thực qua đăng ký thiết bị.
- `POST /api/ai/check-in-analysis` dùng chính các log này để tạo phân tích tham khảo.
