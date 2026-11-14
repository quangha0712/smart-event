# Phạm vi và yêu cầu

## Người dùng

- Quản trị viên: quản lý tài khoản và cấu hình.
- Ban tổ chức: quản lý sự kiện, lịch trình, nguồn lực và check-in.
- Người tham dự: xem sự kiện, đăng ký, nhận vé và đánh giá.

## Yêu cầu chức năng

- FR-01: đăng nhập và phân quyền.
- FR-02: tạo, cập nhật, công bố và quản lý sự kiện.
- FR-03: quản lý lịch trình sự kiện.
- FR-04: đăng ký tham dự và kiểm soát sức chứa.
- FR-05: cấp vé QR duy nhất.
- FR-06: check-in và ngăn sử dụng vé trùng.
- FR-07: dashboard thống kê.
- FR-08: đánh giá sự kiện.
- FR-09: quản lý nhân sự, nhà cung cấp, tài trợ và ngân sách theo phạm vi nhóm chốt.
- FR-10: AI tạo bản nháp tiến độ/rủi ro từ thông tin PM nhập; PM duyệt trước khi đưa vào báo cáo.
- FR-11: AI chuyển mô tả bài toán thành bản nháp yêu cầu/use case để BA rà soát.
- FR-12: AI gợi ý dự toán sơ bộ theo loại sự kiện, số người, thời lượng và địa điểm; ban tổ chức xác nhận số liệu.
- FR-13: AI phân tích số liệu check-in tổng hợp để nêu tín hiệu cần kiểm tra; không tự kết luận gian lận hoặc chặn người tham dự.
- FR-14: AI nhóm chủ đề đánh giá sự kiện và gợi ý hành động cải thiện cho ban tổ chức.

## Yêu cầu phi chức năng

- API có validation và phân quyền.
- Dữ liệu quan trọng có ràng buộc và migration.
- Có nhật ký thao tác phù hợp cho hoạt động quản trị.
- Cung cấp Docker Compose để dựng MySQL cục bộ.
- Kết quả AI phải được gắn nhãn nội dung do AI tạo và cần con người rà soát; không dùng AI làm căn cứ duy nhất cho quyết định tài chính hoặc từ chối check-in.

Các yêu cầu cần được BA xác nhận và liên kết tới test case trong `tests/requirements-traceability.md`.
