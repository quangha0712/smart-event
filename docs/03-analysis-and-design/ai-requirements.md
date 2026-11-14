# Yêu cầu và phân công tính năng AI

## Phạm vi AI

AI hỗ trợ tạo bản nháp và tổng hợp cho năm quy trình. Tất cả kết quả phải được người phụ trách rà soát. Dự toán AI là ước lượng tham khảo, không phải báo giá; phân tích check-in chỉ chỉ ra tín hiệu cần kiểm tra, không kết luận gian lận; phản hồi gửi cho AI được ẩn danh.

## Phân công theo thành viên

| Thành viên | Tính năng AI cụ thể | File/folder sở hữu trong `smart-event/` | Bàn giao |
|---|---|---|---|
| 1 – PM | Tóm tắt tiến độ, việc còn tồn, rủi ro và hành động tiếp theo từ nhật ký PM nhập | `apps/api/src/integrations/ai/prompts/project-summary.prompt.ts`; endpoint `project-summary` trong `ai.controller.ts`; báo cáo `reports/section-VII-monitoring-control.md` | Định nghĩa dữ liệu vào/ra, prompt, bản tóm tắt được PM rà soát và minh chứng |
| 2 – BA | Tạo bản nháp yêu cầu chức năng/phi chức năng, use case và câu hỏi cần làm rõ | `apps/api/src/integrations/ai/prompts/requirements-draft.prompt.ts`; endpoint `requirements-draft`; `docs/02-scope-and-requirements.md` | Prompt/tiêu chí BA, đầu ra mẫu đã rà soát, giả định và câu hỏi cần xác nhận |
| 3 – Backend 1 | Gợi ý dự toán sự kiện theo quy mô, thời lượng, địa điểm và ràng buộc | `apps/api/src/integrations/ai/prompts/budget-estimate.prompt.ts`; endpoint `budget-estimate`; provider và tính toán tổng trong `ai.service.ts`; `reports/section-IV-project-cost.md` | API, kiểm tra dữ liệu đầu ra, chi phí provider AI và giới hạn dự toán |
| 4 – Backend 2 | Phân tích số lượt check-in hợp lệ, quét lặp và mã không hợp lệ theo thời gian | `apps/api/src/integrations/ai/prompts/checkin-analysis.prompt.ts`; endpoint `check-in-analysis`; `docs/04-project-management/quality-plan.md` | API, cấu trúc cảnh báo có giới hạn và minh chứng chạy thử |
| 5 – Frontend/Tester | Giao diện tổng hợp chủ đề phản hồi sự kiện và gợi ý cải thiện | `apps/web/src/features/ai/`; `apps/web/src/app/events/[id]/ai-insights/page.tsx`; `apps/api/src/integrations/ai/prompts/feedback-insights.prompt.ts`; `tests/` khi triển khai kiểm thử | UI, tích hợp endpoint, kịch bản kiểm thử, bug report và ảnh/video demo |

## API đầu vào

- `POST /api/ai/project-summary`: kỳ báo cáo, việc hoàn thành, việc còn lại, rủi ro.
- `POST /api/ai/requirements-draft`: mô tả vấn đề và nhóm người dùng mục tiêu.
- `POST /api/ai/budget-estimate`: loại sự kiện, số người, số ngày, địa điểm, ràng buộc, tiền tệ.
- `POST /api/ai/check-in-analysis`: mã sự kiện, tổng lượt quét, lượt hợp lệ/lặp/mã sai, khoảng thời gian.
- `POST /api/ai/events/:eventId/feedback-insights`: lấy đánh giá đã lưu và bỏ thông tin định danh trước khi gửi AI.

## Cấu hình và giới hạn

- Dùng API tương thích OpenAI Chat Completions. Cấu hình trong `.env`: `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
- Không commit API key. Thiếu key thì API trả `503 Service Unavailable`.
- Nội dung AI có thể sai/thiên lệch; bắt buộc PM/BA/người tổ chức duyệt kết quả.
- Skeleton hiện chưa có auth guard/rate limiting cho API AI; chỉ dùng local/dev đến khi xác thực và kiểm soát chi phí được hoàn thiện.
