# Yêu cầu và phân công tính năng AI

## Phạm vi AI

AI hỗ trợ tạo bản nháp và tổng hợp cho năm quy trình. Tất cả kết quả phải được người phụ trách rà soát. Dự toán AI là ước lượng tham khảo, không phải báo giá; kết luận check-in là phân loại tự động theo chính sách demo, cần được người tổ chức xem xét; phản hồi gửi cho AI được ẩn danh.

## Phân công theo thành viên

| Thành viên | Tính năng AI cụ thể | File/folder sở hữu trong `smart-event/` | Bàn giao |
|---|---|---|---|
| 1 – PM | Tóm tắt tiến độ, việc còn tồn, rủi ro và hành động tiếp theo từ nhật ký PM nhập | `apps/api/src/integrations/ai/prompts/project-summary.prompt.ts`; endpoint `project-summary` trong `ai.controller.ts`; báo cáo `reports/section-VII-monitoring-control.md` | Định nghĩa dữ liệu vào/ra, prompt, bản tóm tắt được PM rà soát và minh chứng |
| 2 – BA | Tạo bản nháp FR/NFR/use case; che dữ liệu cá nhân, phát hiện trùng SRS, chấm chất lượng, truy vết, câu hỏi làm rõ | `prompts/requirements-draft.prompt.ts`, `requirements-draft.policy.ts`, `requirements-draft.review.ts`, `requirements-baseline.ts`; method `requirementsDraft`; `apps/api/test/requirements-draft.spec.ts`; `docs/02-scope-and-requirements.md` | Prompt, chính sách rà soát, unit test, đầu ra mẫu ([ai-requirements-draft-sample.md](ai-requirements-draft-sample.md)), checklist BA |
| 3 – Backend 1 | Gợi ý dự toán sự kiện theo quy mô, thời lượng, địa điểm và ràng buộc | `apps/api/src/integrations/ai/prompts/budget-estimate.prompt.ts`; endpoint `budget-estimate`; provider và tính toán tổng trong `ai.service.ts`; `reports/section-IV-project-cost.md` | API, kiểm tra dữ liệu đầu ra, chi phí provider AI và giới hạn dự toán |
| 4 – Backend 2 | LLM đánh giá chuỗi quét theo từng vé; backend áp dụng chính sách demo để trả kết luận `isFraud` | `apps/api/src/integrations/ai/prompts/checkin-analysis.prompt.ts`; endpoint `check-in-analysis`; `docs/04-project-management/quality-plan.md` | API, kết luận kèm căn cứ/giới hạn và minh chứng chạy thử |
| 5 – Frontend/Tester | Giao diện tổng hợp chủ đề phản hồi sự kiện và gợi ý cải thiện | `apps/web/src/features/ai/`; `apps/web/src/app/events/[id]/ai-insights/page.tsx`; `apps/api/src/integrations/ai/prompts/feedback-insights.prompt.ts`; `tests/` khi triển khai kiểm thử | UI, tích hợp endpoint, kịch bản kiểm thử, bug report và ảnh/video demo |

## API đầu vào

- `POST /api/ai/project-summary`: kỳ báo cáo, việc hoàn thành, việc còn lại, rủi ro.
- `POST /api/ai/requirements-draft`: mô tả vấn đề, nhóm người dùng mục tiêu; tuỳ chọn module, mục tiêu, ràng buộc, số yêu cầu tối đa (3–20). Chi tiết ở mục FR-11 bên dưới.
- `POST /api/ai/budget-estimate`: loại sự kiện, số người, số ngày, địa điểm, ràng buộc, tiền tệ.
- `POST /api/ai/check-in-analysis`: frontend chỉ gửi `eventId`, `from`, `to` (ISO 8601). Backend truy vấn log theo vé trong khoảng này rồi gửi prompt, ruleWindows và lịch sử mỗi vé cho LLM. LLM phải đánh giá mọi vé độc lập theo bốn rule: (1) >=3 `ALREADY_USED` trong 5 phút sau `ACCEPTED` trên >=2 thiết bị; (2) >=5 lượt lặp trải dài >=10 phút từ >=2 thiết bị; (3) hai cụm quét lặp (mỗi cụm >=2 lượt trong 5 phút, cách nhau >=30 phút), tổng >=2 thiết bị và một cụm có >=2 thiết bị; (4) >=2 `ACCEPTED` trên >=2 thiết bị cách nhau <=10 giây. Backend chỉ trả `isFraud: true` khi LLM trả `fraud_suspected`, confidence/evidence đạt ngưỡng và log khớp ít nhất một rule. Seed có tám mẫu dương tính (hai cho mỗi rule) và ba mẫu đối chứng với thời điểm động; seed in khoảng `from`/`to` cần dùng để lấy đủ mẫu. LLM có tính không xác định nên seed/prompt không thể bảo đảm tuyệt đối một response giống nhau mỗi lần. Đây là cờ mẫu nghi ngờ theo chính sách demo, cần người tổ chức rà soát; mã thiết bị trong DB không tự chứng minh danh tính người dùng hay ý định gian lận, và API không tự chặn vé.
- `POST /api/ai/events/:eventId/feedback-insights`: lấy đánh giá đã lưu và bỏ thông tin định danh trước khi gửi AI.

## Cấu hình và giới hạn

- Dùng API tương thích OpenAI Chat Completions. Cấu hình trong `.env`: `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
- Không commit API key. Thiếu key thì API trả `503 Service Unavailable`.
- Nội dung AI có thể sai/thiên lệch; bắt buộc PM/BA/người tổ chức duyệt kết quả.
- Skeleton hiện chưa có auth guard/rate limiting cho API AI; chỉ dùng local/dev đến khi xác thực và kiểm soát chi phí được hoàn thiện.

## FR-11 – AI bản nháp yêu cầu (TV2)

### Mục tiêu và giới hạn

Rút ngắn bước chuyển ghi chép khảo sát thành yêu cầu có cấu trúc. AI **chỉ đề xuất**; BA quyết định. Kết quả không tự ghi vào SRS, luôn có `status: "DRAFT_PENDING_BA_REVIEW"` và `requiresHumanReview: true`.

### Luồng xử lý

1. **Che dữ liệu cá nhân** trong mọi trường văn bản trước khi gửi AI: email → `[EMAIL]`, số điện thoại Việt Nam (0xxxxxxxxx, +84…) → `[SỐ ĐIỆN THOẠI]`, CMND 9 số / CCCD 12 số → `[SỐ GIẤY TỜ]`. Số lượng đã che trả về trong `redactions`.
2. **Gửi AI** prompt + đầu vào đã che + danh mục yêu cầu đã chốt (`requirements-baseline.ts`, đồng bộ SRS FR-01…FR-17) để AI liên kết thay vì viết lại.
3. **Hậu kiểm** bằng code thuần (`requirements-draft.review.ts`, không gọi mạng/DB nên test được):
   - Cấp mã nháp `DRAFT-FR-xx`, `DRAFT-NFR-xx`, `DRAFT-UC-xx`; đổi tham chiếu trong use case/câu hỏi sang mã nháp.
   - Bỏ phần tử hỏng, cắt theo `maxRequirements`, chuẩn hoá ưu tiên MoSCoW và nhóm NFR.
   - Chạy các luật chất lượng (bảng dưới), dựng ma trận truy vết FR ↔ UC ↔ SRS.
   - Chấm điểm: 100 − 15 × số lỗi − 5 × số cảnh báo (sàn 0). `READY_FOR_BA_REVIEW` khi không còn lỗi và điểm ≥ 60; ngược lại `NEEDS_REWORK`.
   - Xuất `srsMarkdown` có nhãn "BẢN NHÁP DO AI TẠO – CHƯA ĐƯỢC BA DUYỆT".

### Luật hậu kiểm

| Mã | Mức | Khi nào |
|---|---|---|
| `FR_MISSING_ACCEPTANCE_CRITERIA` | error | Yêu cầu chức năng không có tiêu chí chấp nhận |
| `AI_REQUIREMENT_WITHOUT_HUMAN_REVIEW` | error | Yêu cầu nhắc tới AI nhưng không quy định người rà soát/duyệt (trái NFR-AI-01, BR-10) |
| `UC_MISSING_MAIN_FLOW` | error | Use case không có luồng chính |
| `NO_FUNCTIONAL_REQUIREMENTS` | error | Không có yêu cầu chức năng hợp lệ nào |
| `AMBIGUOUS_TERM` | warning | Có từ mơ hồ: nhanh, dễ dùng, thân thiện, tối ưu, hiệu quả, linh hoạt, phù hợp, hợp lý, một số, v.v. (so khớp nguyên cụm, có dấu) |
| `POSSIBLE_DUPLICATE_OF_BASELINE` | warning | ≥ 2 cụm từ đặc trưng và ≥ 50% cụm của một yêu cầu SRS xuất hiện trong bản nháp |
| `DUPLICATE_WITHIN_DRAFT` | warning | Hai yêu cầu trong bản nháp giống nhau (Jaccard ≥ 0,8) |
| `NFR_NOT_MEASURABLE` | warning | NFR không có con số đo được |
| `UC_UNKNOWN_REQUIREMENT` | warning | Use case tham chiếu yêu cầu không tồn tại (đã gỡ tham chiếu) |
| `DROPPED_INVALID_ITEM` | warning | Phần tử thiếu mô tả/tên bị bỏ |
| `PII_REDACTED`, `TRUNCATED_TO_LIMIT`, `INVALID_PRIORITY`, `INVALID_NFR_CATEGORY`, `UNKNOWN_BASELINE_REFERENCE`, `FR_NOT_COVERED_BY_USE_CASE`, `NO_CLARIFICATION_QUESTIONS` | info | Thông tin để BA biết hệ thống đã tự điều chỉnh gì |

Ngưỡng và danh sách từ nằm trong `requirements-draft.policy.ts`, cố định phía server.

### Tiêu chí nghiệm thu

- Đầu vào chứa email/SĐT/CCCD → nội dung gửi nhà cung cấp AI không còn giá trị gốc (unit test kiểm tra body request).
- AI trả JSON thiếu/sai cấu trúc → API vẫn trả bản nháp với phát hiện tương ứng, không lỗi 500.
- Mọi kết quả có `status = DRAFT_PENDING_BA_REVIEW`, `requiresHumanReview = true`, có checklist rà soát.
- `npm run test --workspace apps/api -- requirements-draft` đạt.

### Giới hạn đã biết

- Phát hiện trùng dựa trên cụm từ khoá, có thể bỏ sót yêu cầu trùng nghĩa nhưng khác chữ, hoặc báo nhầm khi chỉ nhắc tới tính năng cũ; vì vậy chỉ ở mức cảnh báo.
- Bộ lọc dữ liệu cá nhân không nhận diện được họ tên hay địa chỉ; BA không đưa thông tin này vào mô tả.
- Chưa có giao diện; dùng Swagger `/docs`. Cần `AI_API_KEY` để chạy thật; đầu ra mẫu hiện tại dùng phản hồi AI giả lập.

