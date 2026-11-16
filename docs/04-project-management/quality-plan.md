# Kế hoạch chất lượng

- Quy ước code, review thay đổi và kiểm tra build trước khi merge.
- Unit/integration test cho quy tắc nghiệp vụ; API/E2E cho luồng chính.
- Backend test dùng `npm run test --workspace apps/api`; hiện có unit test cho đăng ký trùng/sức chứa, QR không tồn tại, check-in hợp lệ/lặp/QR lỗi, audit filtering và bốn rule AI.
- Không đánh dấu test đạt hoặc thêm minh chứng cho đến khi lệnh test được chạy; lưu log thật trong `tests/test-evidence/`.
- Tiêu chí nghiệm thu từng tính năng gồm mã nguồn, tích hợp, kiểm thử đạt và minh chứng.
- Theo dõi lỗi theo mức độ nghiêm trọng, người xử lý và trạng thái.
- Với AI, rà soát đầu ra, kiểm tra số liệu, ghi rõ giả định và không dùng dự toán hoặc cảnh báo AI làm quyết định tự động.
