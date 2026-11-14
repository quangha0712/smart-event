# Kế hoạch kiểm thử

## Mục tiêu

Xác nhận các luồng chính của Smart Event đáp ứng yêu cầu chức năng, dữ liệu được lưu đúng và lỗi được ghi nhận có thể tái hiện.

## Phạm vi ưu tiên

1. Đăng nhập và phân quyền.
2. Tạo/cập nhật sự kiện và lịch trình.
3. Đăng ký tham dự và giới hạn sức chứa.
4. Phát hành QR, quét check-in hợp lệ và từ chối vé đã dùng.
5. Dashboard và đánh giá sự kiện.

## Phân loại

- Unit/integration: `apps/api/test/` và test cạnh module.
- API: `tests/api/`.
- E2E giao diện: `tests/e2e/`.
- Kiểm thử thủ công: các test case Markdown trong `tests/test-cases/`.

Tester cập nhật trạng thái Pass/Fail/Blocked, phiên bản build, người chạy, ngày chạy, bug ID và minh chứng cho mỗi lượt kiểm thử.
