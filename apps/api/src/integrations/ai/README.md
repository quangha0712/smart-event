# AI integration

## Tính năng và chủ sở hữu

- TV1: `POST /api/ai/project-summary`, prompt `prompts/project-summary.prompt.ts`.
- TV2: `POST /api/ai/requirements-draft`, prompt `prompts/requirements-draft.prompt.ts`.
- TV3: `POST /api/ai/budget-estimate`, prompt `prompts/budget-estimate.prompt.ts` và provider dùng chung.
- TV4: `POST /api/ai/check-in-analysis`, prompt `prompts/checkin-analysis.prompt.ts`.
- TV5: `POST /api/ai/events/:eventId/feedback-insights`, prompt `prompts/feedback-insights.prompt.ts`, UI trong `apps/web/src/features/ai/`.

## Cấu hình

Thiết lập `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL` trong `.env`. Không commit API key. Mặc định URL là OpenAI API. Kết quả luôn có `requiresHumanReview: true`.

Budget estimate được tính lại `totalCost` theo số lượng × đơn giá và tổng dự toán được backend tính lại từ các dòng; các con số vẫn chỉ là gợi ý cần xác minh.

Chưa có auth guard/rate limiting trên các endpoint này. Chỉ dùng local/dev đến khi xác thực và giới hạn sử dụng được hoàn thiện.
