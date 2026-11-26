# Khảo sát và phân tích bên liên quan

> Người phụ trách: TV2 – BA. Đầu vào cho Phần II (người dùng, bên liên quan) và Phần VI.1 (khảo sát) của báo cáo.

## 1. Kế hoạch khảo sát

| Hạng mục | Nội dung |
|---|---|
| Mục tiêu | Xác định ai dùng hệ thống, họ đang làm thế nào, vướng ở đâu, cần gì nhất cho bản demo |
| Phương pháp | (1) Nghiên cứu tài liệu: đề tài môn học, giải pháp đang có trên thị trường; (2) Phiếu hỏi trực tuyến cho người từng tham dự sự kiện; (3) Phỏng vấn bán cấu trúc người từng tổ chức sự kiện; (4) Workshop nội bộ nhóm để chốt phạm vi |
| Đối tượng | Người tham dự (sinh viên, người đi làm); người tổ chức hội thảo/CLB/sự kiện công ty; nhân viên trực cổng |
| Công cụ | Google Forms, Google Meet/Zalo, bảng tổng hợp |
| Sản phẩm | Bảng tổng hợp nhu cầu (mục 4), danh sách yêu cầu trong [SRS](../02-scope-and-requirements.md) |

## 2. Khảo sát tài liệu: các giải pháp hiện có

Các nền tảng phổ biến đã giải quyết tốt phần đăng ký – vé – check-in; đây là chuẩn tối thiểu mà sản phẩm cần đạt:

| Giải pháp | Điểm đáng học (theo tài liệu công khai của nhà cung cấp) | Điều nhóm rút ra |
|---|---|---|
| Ticketbox Event Manager (Việt Nam) | Ứng dụng cho ban tổ chức quét QR/mã vạch bằng camera, có chế độ quét offline, check-in thủ công bằng mã vé, theo dõi số check-in theo loại vé | Cần cả quét camera và nhập mã thủ công (đã có); offline để ngoài phạm vi |
| Eventbrite Organizer | Quét QR, tra tên khách để check-in tay; đồng bộ dữ liệu giữa nhiều thiết bị ở nhiều cổng để không bị trùng vé; theo dõi số người đã vào theo thời gian thực; phân vai trò check-in trong nhóm | Bắt buộc chống trùng vé khi nhiều cổng cùng quét (FR-06.3), dashboard thời gian thực (FR-07), vai trò Nhân viên check-in (FR-15) |
| Luma | Mỗi khách nhận một QR khi đăng ký; check-in bằng QR hoặc tìm theo tên/email; thêm đồng tổ chức (cohost) cùng quản lý và check-in | Mô hình Chủ sự kiện – Đồng tổ chức (FR-15) |

Khoảng trống nhóm khai thác: các công cụ trên mạnh về bán vé nhưng ít hỗ trợ **phân tích bất thường khi check-in**, **dự toán – thực chi trong cùng hệ thống** và **AI hỗ trợ soạn thảo/tổng hợp có người duyệt** – đây là điểm khác biệt của đề tài "thông minh".

Nguồn: [Ticketbox Event Manager – App Store](https://apps.apple.com/us/app/ticketbox-event-manager/id986830728) · [Eventbrite Organizer – App Store](https://apps.apple.com/app/id368260521) · [Eventbrite – Check in attendees](https://www.eventbrite.co.uk/help/en-gb/articles/741083/) · [Luma – Check In Guests](https://help.luma.com/p/check-in-guests-for-in-person-events)

## 3. Bộ công cụ khảo sát

### 3.1 Phiếu hỏi người tham dự (Google Forms, ~5 phút)

1. Trong 12 tháng qua bạn tham dự bao nhiêu sự kiện có đăng ký trước? (0 / 1–2 / 3–5 / >5)
2. Bạn thường đăng ký qua đâu? (Google Form / nền tảng bán vé / nhắn tin ban tổ chức / khác)
3. Khi đến cổng, bạn chờ check-in bao lâu? (<2 phút / 2–5 / 5–15 / >15)
4. Bạn đã từng gặp vấn đề nào? (không tìm thấy tên / mất email vé / xếp hàng lâu / không biết lịch phiên / khác)
5. Bạn muốn nhận vé dưới dạng nào? (QR trong ứng dụng web / email / ví điện thoại / in giấy)
6. Mức độ quan trọng (1–5): xem lịch trình theo phiên; huỷ đăng ký dễ dàng; check-in nhanh; gửi đánh giá sau sự kiện.
7. Bạn có sẵn lòng để ban tổ chức dùng AI tổng hợp đánh giá **đã ẩn danh** của bạn không? (Có / Không / Tuỳ)
8. Góp ý khác.

### 3.2 Kịch bản phỏng vấn người tổ chức (20–30 phút)

1. Anh/chị tổ chức loại sự kiện nào, quy mô bao nhiêu người, bao nhiêu cổng?
2. Mô tả các bước từ lúc lên ý tưởng đến khi tổng kết. Bước nào tốn thời gian nhất?
3. Hiện quản lý danh sách đăng ký và check-in bằng công cụ gì? Đã gặp chuyện một vé dùng nhiều lần chưa? Xử lý thế nào?
4. Ai trong ban tổ chức được sửa thông tin sự kiện, ai chỉ được quét vé?
5. Lập dự toán và theo dõi chi tiêu như thế nào? Khi nào biết là vượt?
6. Trong ngày sự kiện, anh/chị cần nhìn thấy số liệu gì ngay lập tức?
7. Thu phản hồi sau sự kiện ra sao? Có đọc hết không?
8. Anh/chị tin AI ở mức nào: gợi ý dự toán? cảnh báo vé đáng ngờ? tổng hợp phản hồi? Điều gì AI **không** được tự quyết?

### 3.3 Bảng tổng hợp kết quả

> Điền số liệu thật sau khi thu phiếu/phỏng vấn. Không điền số ước đoán.

| Chỉ số | Kết quả | Ghi chú |
|---|---|---|
| Số phiếu thu về | … | |
| Số buổi phỏng vấn người tổ chức | … | |
| % người từng chờ check-in > 5 phút | … % | |
| Vấn đề gặp nhiều nhất | … | |
| Tính năng được chấm quan trọng nhất | … | |
| % đồng ý cho AI tổng hợp đánh giá ẩn danh | … % | |

## 4. Nhu cầu đã xác định và yêu cầu tương ứng

Các nhu cầu dưới đây tổng hợp từ đề tài, khảo sát tài liệu và workshop nhóm; BA cập nhật cột "Bằng chứng" khi có kết quả phiếu/phỏng vấn.

| Mã | Nhu cầu | Bên liên quan | Ưu tiên | Yêu cầu đáp ứng |
|---|---|---|---|---|
| N-01 | Đăng ký nhanh, không phải điền lại thông tin mỗi lần | Người tham dự | Cao | FR-01, FR-04 |
| N-02 | Vé không bị làm giả hay dùng lại | Ban tổ chức | Cao | FR-05, FR-06.3 |
| N-03 | Check-in nhanh, nhiều cổng cùng lúc, kể cả khi không quét được QR | Nhân viên check-in | Cao | FR-06 |
| N-04 | Phân quyền rõ: ai sửa nội dung, ai chỉ quét vé | Chủ sự kiện | Cao | FR-15 |
| N-05 | Thấy số người đã vào, cổng nào đông, chi tiêu hiện tại ngay trong ngày | Chủ sự kiện, Đồng tổ chức | Cao | FR-07, FR-17 |
| N-06 | Không vượt sức chứa địa điểm | Ban tổ chức | Cao | FR-04.1 |
| N-07 | Theo dõi dự toán – thực chi, nhà cung cấp, tài trợ ở một nơi | Đồng tổ chức | Trung bình | FR-09 |
| N-08 | Phát hiện vé bị chia sẻ/quét lặp bất thường để kiểm tra lại | Ban tổ chức | Trung bình | FR-13 |
| N-09 | Biết người tham dự đánh giá thế nào mà không phải đọc từng dòng | Ban tổ chức | Trung bình | FR-08, FR-14 |
| N-10 | Dữ liệu cá nhân không bị gửi ra ngoài tuỳ tiện | Người tham dự | Cao | NFR-PRI-01 |
| N-11 | Sản phẩm, tài liệu, báo cáo đúng yêu cầu môn học | Giảng viên | Cao | Toàn bộ |
| N-12 | Rút ngắn thời gian viết tài liệu yêu cầu, tiến độ | Thành viên dự án | Thấp | FR-10, FR-11 |

## 5. Danh sách bên liên quan

| Mã | Bên liên quan | Vai trò với dự án | Mong đợi chính | Mối lo ngại | Quyền lực | Quan tâm |
|---|---|---|---|---|---|---|
| S-01 | Giảng viên hướng dẫn | Nhà tài trợ/người nghiệm thu | Sản phẩm chạy được, báo cáo 10 phần, đúng hạn, có minh chứng | Nhóm làm không đều, thiếu minh chứng | Cao | Cao |
| S-02 | Nhóm trưởng (TV1 – PM) | Quản lý dự án | Tiến độ, phạm vi kiểm soát được | Phạm vi phình to | Cao | Cao |
| S-03 | Thành viên phát triển (TV2–TV5) | Thực hiện | Yêu cầu rõ, API thống nhất, phân công công bằng | Yêu cầu đổi muộn, xung đột code | Trung bình | Cao |
| S-04 | Ban tổ chức sự kiện (Chủ sự kiện, Đồng tổ chức) | Người dùng chính | Quản lý tập trung, số liệu tức thời, phân quyền | Khó dùng, sai số liệu | Trung bình | Cao |
| S-05 | Nhân viên check-in | Người dùng tại cổng | Quét nhanh, kết quả dễ nhìn | Mạng yếu, camera không đọc được | Thấp | Cao |
| S-06 | Người tham dự | Người dùng cuối | Đăng ký dễ, vé luôn sẵn trên điện thoại | Lộ thông tin cá nhân | Thấp | Trung bình |
| S-07 | Quản trị viên hệ thống | Vận hành | Quản lý tài khoản, xử lý sự cố | Lạm dụng quyền | Trung bình | Thấp |
| S-08 | Nhà cung cấp AI | Hệ thống ngoài | API key hợp lệ, dùng đúng điều khoản | – | Thấp | Thấp |
| S-09 | Nhà tài trợ, nhà cung cấp dịch vụ sự kiện | Bên ngoài được quản lý dữ liệu | Thông tin hợp đồng, thanh toán chính xác | Sai số tiền | Thấp | Thấp |

## 6. Ma trận quyền lực – quan tâm và chiến lược phối hợp

| Quyền lực \ Quan tâm | **Quan tâm thấp** | **Quan tâm cao** |
|---|---|---|
| **Quyền lực cao** | *Giữ hài lòng*: S-07 Quản trị viên | *Quản lý chặt*: S-01 Giảng viên, S-02 PM |
| **Quyền lực thấp / trung bình** | *Theo dõi*: S-08 Nhà cung cấp AI, S-09 NCC & nhà tài trợ | *Thông tin đầy đủ*: S-03 Nhóm phát triển, S-04 Ban tổ chức, S-05 Nhân viên check-in, S-06 Người tham dự |

| Nhóm | Bên liên quan | Cách phối hợp | Tần suất | Người phụ trách |
|---|---|---|---|---|
| Quản lý chặt | S-01, S-02 | Báo cáo tiến độ, demo từng mốc, xin ý kiến khi đổi phạm vi | Theo mốc / hằng tuần | TV1 |
| Thông tin đầy đủ | S-03, S-04, S-05, S-06 | Họp nhóm, chốt API contract, cho dùng thử prototype, phiếu hỏi | Hằng tuần / theo sprint | TV2 (nghiệp vụ), TV5 (dùng thử) |
| Giữ hài lòng | S-07 | Hướng dẫn quản trị trong user guide | Khi bàn giao | TV5 |
| Theo dõi | S-08, S-09 | Theo dõi chi phí API, điều khoản dịch vụ | Khi cấu hình | TV3 |
