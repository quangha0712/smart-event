# Test cases: AI check-in analysis

Các test logic rule được mock LLM trong `apps/api/src/integrations/ai/ai.service.spec.ts`. Kiểm thử tích hợp AI thật cần API key và không nên dùng làm tiêu chí ổn định vì verdict LLM có thể thay đổi.

| ID | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| ACI-001 | Gửi `eventId`, `from`, `to` bao phủ seed positive cases | Backend truy vấn log trong khoảng và trả tổng hợp cùng kết luận theo từng vé | Chưa chạy |
| ACI-002 | Chọn khoảng thời gian không chứa log seed | Kết quả báo không có/không đủ dữ liệu; không dùng log ngoài khoảng | Chưa chạy |
| ACI-003 | Gửi `from` sau `to` hoặc thời gian sai định dạng | API trả `400 Bad Request` | Chưa chạy |
| ACI-004 | Phân tích vé R1/R2/R3 với verdict LLM `fraud_suspected`, confidence và evidence đủ điều kiện | Backend trả `isFraud: true` theo rule tương ứng, yêu cầu ban tổ chức rà soát | Chưa chạy |
| ACI-005 | Phân tích control cùng máy quét hoặc chỉ hai lượt lặp | Không khớp rule yêu cầu nhiều thiết bị/số lượt tối thiểu | Chưa chạy |
