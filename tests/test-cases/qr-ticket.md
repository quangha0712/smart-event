# Test cases: vé QR

| ID | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TKT-001 | Mở vé sau khi đăng ký thành công | QR đại diện cho vé duy nhất | Chưa chạy |
| TKT-002 | Gửi mã QR không tồn tại tới API tra cứu | Trả `404 Not Found` | Chưa chạy |
| TKT-003 | Tra cứu vé thuộc đăng ký đã hủy | `valid: false`; không trả `qrPayload` | Chưa chạy |
