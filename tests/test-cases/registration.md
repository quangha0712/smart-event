# Test cases: đăng ký tham dự

| ID | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| REG-001 | Người dùng đăng ký sự kiện đang mở | Tạo đăng ký và vé tương ứng | Chưa chạy |
| REG-002 | Người dùng đăng ký cùng sự kiện lần hai | Không tạo đăng ký trùng | Chưa chạy |
| REG-003 | Đăng ký khi sự kiện đã đủ sức chứa | Từ chối đăng ký; không tăng `registeredCount` | Chưa chạy |
| REG-004 | Hủy đăng ký chưa check-in | Chuyển sang `CANCELLED`, giải phóng một chỗ | Chưa chạy |
| REG-005 | Hủy đăng ký đã check-in | Từ chối hủy; giữ trạng thái hiện tại | Chưa chạy |
