# II. Tổng quan dự án

Điền tên, mục tiêu, phạm vi, quy mô, người dùng và các bên liên quan.

## Tiểu mục TV2 – Khảo sát, người dùng, nhu cầu và các đơn vị liên quan

### Khảo sát hiện trạng

Nhóm khảo sát theo ba nguồn: nghiên cứu đề tài môn học và các nền tảng quản lý sự kiện đang phổ biến (Ticketbox Event Manager, Eventbrite Organizer, Luma); phiếu hỏi người từng tham dự sự kiện; phỏng vấn người từng tổ chức sự kiện (bộ câu hỏi tại `docs/03-analysis-and-design/stakeholder-analysis.md` mục 3).

Cách làm phổ biến hiện nay là dùng nhiều công cụ rời rạc: form trực tuyến để đăng ký, bảng tính để giữ danh sách, nhóm chat để phân công và dò tên thủ công tại cổng. Hệ quả là đăng ký trùng hoặc vượt sức chứa, vé dễ bị dùng lại, xếp hàng lâu khi check-in, ban tổ chức không có số liệu trong lúc sự kiện diễn ra và chỉ biết vượt chi sau khi tổng hợp hoá đơn. Các nền tảng thương mại đã giải quyết tốt phần vé và check-in (quét QR, tra tên, đồng bộ nhiều cổng, phân vai trò check-in) nhưng ít hỗ trợ phân tích bất thường khi quét vé, dự toán – thực chi trong cùng hệ thống và AI hỗ trợ có người duyệt. Đây là khoảng trống dự án hướng tới.

*(Bổ sung số liệu phiếu hỏi/phỏng vấn thật vào bảng 3.3 của tài liệu khảo sát trước khi nộp.)*

### Người sử dụng hệ thống

| Nhóm người dùng | Mục tiêu chính |
|---|---|
| Khách vãng lai | Xem các sự kiện đã công bố |
| Người tham dự | Đăng ký, nhận và giữ vé QR, huỷ đăng ký, check-in, đánh giá |
| Chủ sự kiện | Toàn quyền một sự kiện: nội dung, ban tổ chức, công bố, huỷ |
| Đồng tổ chức | Lịch trình, nguồn lực, ngân sách, dashboard, công cụ AI |
| Nhân viên check-in | Quét vé tại cổng |
| Quản trị viên | Quản lý tài khoản và quyền hệ thống |

### Nhu cầu chính

Mười hai nhu cầu (N-01…N-12) được ánh xạ tới yêu cầu trong SRS. Nhóm ưu tiên cao gồm: đăng ký nhanh, vé không giả mạo hay dùng lại được, check-in nhanh ở nhiều cổng kể cả khi không quét được QR, phân quyền rõ người sửa nội dung và người chỉ quét vé, số liệu tức thời trong ngày sự kiện, không vượt sức chứa và bảo vệ dữ liệu cá nhân.

### Các đơn vị, bên liên quan

| Bên liên quan | Vai trò | Mức quyền lực / quan tâm | Cách phối hợp |
|---|---|---|---|
| Giảng viên hướng dẫn | Giao đề tài, nghiệm thu | Cao / Cao | Báo cáo theo mốc, demo |
| Nhóm trưởng (PM) | Quản lý dự án | Cao / Cao | Họp tuần, quyết định phạm vi |
| Thành viên phát triển | Thực hiện | Trung bình / Cao | API contract, review code |
| Ban tổ chức sự kiện | Người dùng chính | Trung bình / Cao | Dùng thử prototype |
| Nhân viên check-in, người tham dự | Người dùng cuối | Thấp / Cao | Phiếu hỏi, kiểm thử giao diện |
| Quản trị viên | Vận hành | Trung bình / Thấp | Hướng dẫn sử dụng |
| Nhà cung cấp AI, nhà cung cấp dịch vụ và nhà tài trợ sự kiện | Bên ngoài | Thấp / Thấp | Theo dõi chi phí, dữ liệu hợp đồng |

Chi tiết: `docs/03-analysis-and-design/stakeholder-analysis.md`.
