# Sổ đăng ký rủi ro

| ID | Rủi ro | Xác suất | Ảnh hưởng | Phương án ứng phó | Chủ sở hữu | Trạng thái |
|---|---|---|---|---|---|---|
| R-01 | Tích hợp API trễ | Trung bình | Cao | Chốt API contract sớm, tích hợp theo sprint | PM/Backend | Mở |
| R-02 | Mất dữ liệu hoặc migration lỗi | Thấp | Cao | Backup dữ liệu demo, kiểm tra migration | Backend | Mở |
| R-03 | QR bị check-in trùng | Trung bình | Cao | Ràng buộc cập nhật nguyên tử và kiểm thử đồng thời | Backend | Mở |
| R-04 | Phạm vi quá lớn so với thời gian | Trung bình | Cao | Ưu tiên luồng cốt lõi, quản lý change log | PM | Mở |
| R-05 | AI tạo số liệu/nhận định thiếu chính xác hoặc phát sinh chi phí API | Trung bình | Cao | Gắn nhãn AI, người phụ trách xác minh, giới hạn đầu vào/sử dụng và ghi chi phí | PM/Backend | Mở |
| R-06 | Dữ liệu cá nhân bị gửi tới nhà cung cấp AI | Thấp | Cao | Chỉ gửi dữ liệu cần thiết, ẩn danh phản hồi, không gửi bí mật hoặc PII | BA/Frontend | Mở |
