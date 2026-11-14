# Test cases: xác thực và phân quyền

| ID | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| AUTH-001 | Có tài khoản hợp lệ | Đăng nhập bằng thông tin đúng | Đăng nhập thành công, nhận phiên/token hợp lệ | Chưa chạy |
| AUTH-002 | Có tài khoản hợp lệ | Nhập sai mật khẩu | Báo lỗi phù hợp, không tạo phiên | Chưa chạy |
| AUTH-003 | Đã đăng nhập vai trò attendee | Gọi API chỉ dành cho organizer | Trả về 403 | Chưa chạy |
