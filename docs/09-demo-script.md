# Kịch bản demo – Smart Event

Tài khoản seed (mật khẩu `SEED_DEMO_PASSWORD`, mặc định `SmartEvent@2026`):
`admin@example.com` · `organizer@example.com` · `attendee@example.com`.
Mở 2 cửa sổ trình duyệt (1 thường, 1 ẩn danh) để vừa đóng vai ban tổ chức, vừa đóng vai người tham dự.

## Các màn hình demo chính

| # | Màn hình | Vai trò | Đường dẫn | Điểm cần nói khi demo | Trạng thái |
|---|---|---|---|---|---|
| 1 | Trang chủ khách | Chưa đăng nhập | `/` | Giới thiệu 1 dòng, sự kiện sắp diễn ra, nút đăng nhập | Có |
| 2 | Đăng nhập | Tất cả | `/login` | Đăng nhập JWT, chuyển về trang chủ đúng vai trò | Có |
| 3 | Trang chủ người tham dự | ATTENDEE | `/` | Sự kiện sắp tới của tôi + vé QR + đếm ngược, sự kiện đang mở đăng ký | Có |
| 4 | Danh sách sự kiện + đăng ký | ATTENDEE | `/events` | Lọc sắp diễn ra/đã kết thúc, tìm kiếm, đăng ký 1 chạm, thanh lấp đầy chỗ | Có |
| 5 | Vé của tôi | ATTENDEE | `/my-tickets` | QR lớn để quét, mã vé, trạng thái check-in, huỷ đăng ký, lịch sử | Có |
| 6 | Menu tài khoản + thông tin tài khoản | Tất cả | header, `/account` | Bấm tên → Thông tin tài khoản / Đổi mật khẩu / Đăng xuất | Có |
| 7 | Trang chủ ban tổ chức | ORGANIZER | `/` | Chỉ số 30 ngày, sự kiện ĐANG DIỄN RA với số liệu check-in trực tiếp, sự kiện sắp tới, lối tắt | Có |
| 8 | Check-in QR/NFC | ORGANIZER | `/check-in` | Quét vé hợp lệ → quét lại (trùng) → mã giả (không hợp lệ) | Cần làm (TV4/TV5) |
| 9 | Dashboard sự kiện | ORGANIZER | `/dashboard` | Check-in theo giờ, mật độ khu vực IoT, dự toán – thực chi, điểm hài lòng | Cần làm (TV5) |
| 10 | Nguồn lực & ngân sách | ORGANIZER | `/resources` | Nhân sự/phân ca, nhà cung cấp, tài trợ, dự toán – thực chi | Cần làm (TV3/TV5) |
| 11 | Phân tích AI | ORGANIZER | `/events/:id/ai-insights` | Tổng hợp phản hồi, nhãn "cần người rà soát" | Có khung |
| 12 | Trang chủ quản trị | ADMIN | `/` | Tình trạng API, người dùng theo vai trò, người dùng mới, chức năng quản trị | Có |
| 13 | Người dùng & phân quyền | ADMIN | `/admin/users` | Đổi vai trò, không tự hạ quyền chính mình | Có |

## Trình tự demo (6–8 phút)

1. **Khách** mở `/`: thấy sự kiện sắp diễn ra → bấm Đăng nhập.
2. **Người tham dự** đăng nhập → trang chủ hiện ngay sự kiện sắp tới và vé QR. Vào `/events`, đăng ký thêm một sự kiện → mở `/my-tickets` để xem vé mới.
3. Bấm tên ở góc phải → **Thông tin tài khoản**: sửa họ tên, đổi mật khẩu → tên trên header đổi ngay.
4. **Ban tổ chức** (cửa sổ ẩn danh) đăng nhập → trang chủ hiện sự kiện đang diễn ra kèm số liệu check-in; bấm **Mở màn hình check-in**.
5. Quét QR vé của người tham dự → hợp lệ; quét lại → báo vé đã dùng; nhập mã giả → không hợp lệ. Quay lại trang chủ: số liệu check-in tăng (tự làm mới 30 giây).
6. Mở **Nguồn lực** (ngân sách dự toán – thực chi) và **Phân tích AI**.
7. **Quản trị viên** đăng nhập → trang chủ quản trị → đổi vai trò một người dùng ở `/admin/users`.
