# VI. Triển khai và thực thi dự án

Tổng hợp khảo sát, phân tích, thiết kế, lập trình, kiểm thử và triển khai.

## Hạng mục AI

- TV1: tóm tắt tiến độ và rủi ro từ dữ liệu PM nhập.
- TV2: tạo bản nháp yêu cầu/use case và rà soát đầu ra.
- TV3: AI hỗ trợ dự toán ngân sách sự kiện.
- TV4: AI phân tích số liệu check-in tổng hợp.
- TV5: giao diện AI tổng hợp phản hồi và chuẩn bị kiểm thử/demo.

Mỗi thành viên ghi tiến độ, kết quả thực tế và minh chứng riêng cho hạng mục mình phụ trách.

## Tiểu mục TV4 – Backend 2

- **Database:** MySQL qua Prisma. `CheckInAttempt` lưu sự kiện, vé nếu xác định được, `deviceId`, trạng thái `ACCEPTED`/`ALREADY_USED`/`INVALID` và thời điểm; migration đưa `legacy-unknown` vào log cũ.
- **Đăng ký và vé:** `POST/GET/DELETE /api/events/:eventId/registrations` xử lý đăng ký/xem/hủy; đăng ký hợp lệ phát hành QR payload ngẫu nhiên. `GET /api/tickets/:qrCode` tra cứu vé.
- **Check-in:** `POST /api/events/:eventId/check-in` nhận QR và `deviceId`; transaction cập nhật một lần check-in thành công và lưu mọi attempt. `GET /api/events/:eventId/check-ins/summary` tổng hợp theo thời gian.
- **Audit:** thao tác đăng ký, hủy và check-in được ghi trong transaction; `GET /api/audit-logs` lọc theo event/thời gian.
- **AI check-in:** `POST /api/ai/check-in-analysis` nhận `eventId`, `from`, `to`; backend tự lấy thống kê/log, gửi prompt và dữ liệu JSON cho LLM, rồi hậu xử lý ba rule backend. Kết quả được gắn cờ rà soát; không tự chặn check-in.
- **Chạy demo:** `npm run dev` khởi động Next.js và NestJS đồng thời; tiến trình API tự bật MySQL, migration và seed. Seed có ba mẫu dương tính và ba mẫu đối chứng; cần dùng khoảng `from`/`to` seed in ra.
- **Trạng thái minh chứng:** mã và unit test đã được bổ sung; test/runtime chưa được xác nhận chạy. TV4 cập nhật kết quả sau khi thực thi.
