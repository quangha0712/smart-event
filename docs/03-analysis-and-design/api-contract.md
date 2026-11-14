# API contract

Base URL cục bộ: `http://localhost:3001/api`.

| Method | Endpoint dự kiến | Mục đích |
|---|---|---|
| GET | `/health` | Kiểm tra API hoạt động |
| POST/GET/PATCH | `/events` | Quản lý sự kiện |
| GET/POST | `/events/:id/schedules` | Quản lý lịch trình |
| POST | `/events/:id/registrations` | Đăng ký tham dự |
| GET | `/tickets/:code` | Tra cứu vé |
| POST | `/check-in` | Check-in vé |
| POST | `/events/:id/feedback` | Gửi đánh giá |
| POST | `/ai/project-summary` | Tóm tắt tiến độ/rủi ro từ dữ liệu PM cung cấp |
| POST | `/ai/requirements-draft` | Tạo bản nháp yêu cầu/use case cho BA rà soát |
| POST | `/ai/budget-estimate` | Gợi ý dự toán sơ bộ sự kiện |
| POST | `/ai/check-in-analysis` | Phân tích số liệu check-in tổng hợp |
| POST | `/ai/events/:eventId/feedback-insights` | Tổng hợp phản hồi đã lưu của sự kiện |

Các endpoint nghiệp vụ là hợp đồng dự kiến; cập nhật DTO, mã lỗi và quyền truy cập trước khi frontend tích hợp.

Các endpoint AI yêu cầu cấu hình `AI_API_KEY`, `AI_API_BASE_URL`, `AI_MODEL`. Kết quả có `requiresHumanReview: true`; đầu ra dự toán được tính lại tổng từ số lượng và đơn giá do AI trả về. Bảo vệ endpoint bằng xác thực/phân quyền trước khi triển khai ra môi trường dùng thật.
