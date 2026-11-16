# Yêu cầu và phân công tính năng AI

## Phạm vi AI

AI hỗ trợ tạo bản nháp và tổng hợp cho năm quy trình. Tất cả kết quả phải được người phụ trách rà soát. Dự toán AI là ước lượng tham khảo, không phải báo giá; kết luận check-in là phân loại tự động theo chính sách demo, cần được người tổ chức xem xét; phản hồi gửi cho AI được ẩn danh.

## Phân công theo thành viên

| Thành viên | Tính năng AI cụ thể | File/folder sở hữu trong `smart-event/` | Bàn giao |
|---|---|---|---|
| 1 – PM | Tóm tắt tiến độ, việc còn tồn, rủi ro và hành động tiếp theo từ nhật ký PM nhập | `apps/api/src/integrations/ai/prompts/project-summary.prompt.ts`; endpoint `project-summary` trong `ai.controller.ts`; báo cáo `reports/section-VII-monitoring-control.md` | Định nghĩa dữ liệu vào/ra, prompt, bản tóm tắt được PM rà soát và minh chứng |
| 2 – BA | Tạo bản nháp yêu cầu chức năng/phi chức năng, use case và câu hỏi cần làm rõ | `apps/api/src/integrations/ai/prompts/requirements-draft.prompt.ts`; endpoint `requirements-draft`; `docs/02-scope-and-requirements.md` | Prompt/tiêu chí BA, đầu ra mẫu đã rà soát, giả định và câu hỏi cần xác nhận |
| 3 – Backend 1 | Gợi ý dự toán sự kiện theo quy mô, thời lượng, địa điểm và ràng buộc | `apps/api/src/integrations/ai/prompts/budget-estimate.prompt.ts`; endpoint `budget-estimate`; provider và tính toán tổng trong `ai.service.ts`; `reports/section-IV-project-cost.md` | API, kiểm tra dữ liệu đầu ra, chi phí provider AI và giới hạn dự toán |
| 4 – Backend 2 | LLM đánh giá chuỗi quét theo từng vé; backend áp dụng chính sách demo để trả kết luận `isFraud` | `apps/api/src/integrations/ai/prompts/checkin-analysis.prompt.ts`; endpoint `check-in-analysis`; `docs/04-project-management/quality-plan.md` | API, kết luận kèm căn cứ/giới hạn và minh chứng chạy thử |
| 5 – Frontend/Tester | Giao diện tổng hợp chủ đề phản hồi sự kiện và gợi ý cải thiện | `apps/web/src/features/ai/`; `apps/web/src/app/events/[id]/ai-insights/page.tsx`; `apps/api/src/integrations/ai/prompts/feedback-insights.prompt.ts`; `tests/` khi triển khai kiểm thử | UI, tích hợp endpoint, kịch bản kiểm thử, bug report và ảnh/video demo |

## API đầu vào

- `POST /api/ai/project-summary`: kỳ báo cáo, việc hoàn thành, việc còn lại, rủi ro.
- `POST /api/ai/requirements-draft`: mô tả vấn đề và nhóm người dùng mục tiêu.
- `POST /api/ai/budget-estimate`: loại sự kiện, số người, số ngày, địa điểm, ràng buộc, tiền tệ.
- `POST /api/ai/check-in-analysis`: frontend chỉ gửi `eventId`, `from`, `to` (ISO 8601). Backend truy vấn log theo vé trong khoảng này rồi gửi prompt, ruleWindows và lịch sử mỗi vé cho LLM. LLM phải đánh giá mọi vé độc lập theo bốn rule: (1) >=3 `ALREADY_USED` trong 5 phút sau `ACCEPTED` trên >=2 thiết bị; (2) >=5 lượt lặp trải dài >=10 phút từ >=2 thiết bị; (3) hai cụm quét lặp (mỗi cụm >=2 lượt trong 5 phút, cách nhau >=30 phút), tổng >=2 thiết bị và một cụm có >=2 thiết bị; (4) >=2 `ACCEPTED` trên >=2 thiết bị cách nhau <=10 giây. Backend chỉ trả `isFraud: true` khi LLM trả `fraud_suspected`, confidence/evidence đạt ngưỡng và log khớp ít nhất một rule. Seed có tám mẫu dương tính (hai cho mỗi rule) và ba mẫu đối chứng với thời điểm động; seed in khoảng `from`/`to` cần dùng để lấy đủ mẫu. LLM có tính không xác định nên seed/prompt không thể bảo đảm tuyệt đối một response giống nhau mỗi lần. Đây là cờ mẫu nghi ngờ theo chính sách demo, cần người tổ chức rà soát; mã thiết bị trong DB không tự chứng minh danh tính người dùng hay ý định gian lận, và API không tự chặn vé.
- `POST /api/ai/events/:eventId/feedback-insights`: lấy đánh giá đã lưu và bỏ thông tin định danh trước khi gửi AI.

## Cấu hình và giới hạn

- Dùng API tương thích OpenAI Chat Completions. Cấu hình trong `.env`: `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
- Không commit API key. Thiếu key thì API trả `503 Service Unavailable`.
- Nội dung AI có thể sai/thiên lệch; bắt buộc PM/BA/người tổ chức duyệt kết quả.
- Skeleton hiện chưa có auth guard/rate limiting cho API AI; chỉ dùng local/dev đến khi xác thực và kiểm soát chi phí được hoàn thiện.
