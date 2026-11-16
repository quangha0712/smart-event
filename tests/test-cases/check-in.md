# Test cases: check-in

| ID | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| CIN-001 | Gửi QR hợp lệ cùng `deviceId` máy quét | Trả `ACCEPTED`; lưu `ticketId`, `deviceId`, trạng thái và thời điểm | Chưa chạy |
| CIN-002 | Quét lại vé đã dùng từ cùng/khác `deviceId` | Trả `ALREADY_USED`; không cập nhật lần check-in thành công | Chưa chạy |
| CIN-003 | Dùng vé của sự kiện khác | Trả `INVALID`; vẫn lưu lượt quét và `deviceId` | Chưa chạy |
| CIN-004 | Gửi QR không tồn tại cùng `deviceId` | Trả `INVALID`; log không gắn `ticketId` | Chưa chạy |
| CIN-005 | Gửi request không có `deviceId` | API trả `400 Bad Request` | Chưa chạy |
