# AI integration

## Tính năng và chủ sở hữu

- TV1: `POST /api/ai/project-summary`, prompt `prompts/project-summary.prompt.ts`.
- TV2: `POST /api/ai/requirements-draft`, prompt `prompts/requirements-draft.prompt.ts`; che dữ liệu cá nhân và hậu kiểm trong `requirements-draft.review.ts` (chính sách `requirements-draft.policy.ts`, danh mục SRS `requirements-baseline.ts`). Khi sửa SRS phải cập nhật `requirements-baseline.ts`. Test: `test/requirements-draft.spec.ts`.
- TV3: `POST /api/ai/budget-estimate`, prompt `prompts/budget-estimate.prompt.ts` và provider dùng chung.
- TV4: `POST /api/ai/check-in-analysis`, prompt `prompts/checkin-analysis.prompt.ts`.
- TV5: `POST /api/ai/events/:eventId/feedback-insights`, prompt `prompts/feedback-insights.prompt.ts`, UI trong `apps/web/src/features/ai/`.

## Cấu hình

Thiết lập `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL` trong `.env`. Không commit API key. Mặc định URL là OpenAI API. Kết quả luôn có `requiresHumanReview: true`.

Budget estimate được tính lại `totalCost` theo số lượng × đơn giá và tổng dự toán được backend tính lại từ các dòng; các con số vẫn chỉ là gợi ý cần xác minh.

### Check-in risk analysis

`POST /api/ai/check-in-analysis` lấy số liệu và chuỗi log từng vé từ `CheckInAttempt` trong MySQL. LLM trả đánh giá theo từng `ticketRef`; backend hậu xử lý theo bốn quy tắc:

1. **Quét lặp dồn dập:** Sau `ACCEPTED`, có ít nhất 3 `ALREADY_USED` trong 5 phút; chuỗi quét liên quan có ít nhất 2 `deviceId`.
2. **Quét lặp kéo dài:** Sau `ACCEPTED`, có ít nhất 5 `ALREADY_USED` trải dài ít nhất 10 phút; lượt lặp đến từ ít nhất 2 `deviceId`.
3. **Nhiều đợt quét lặp tách biệt:** Có ít nhất 2 cụm `ALREADY_USED`, mỗi cụm có ít nhất 2 lượt trong 5 phút, thời điểm bắt đầu cách nhau ít nhất 30 phút; có ít nhất 2 `deviceId` và một cụm có lượt quét từ ít nhất 2 thiết bị.
4. **Một vé được ACCEPTED gần như đồng thời trên nhiều máy:** Cùng vé có ít nhất 2 lượt `ACCEPTED` cách nhau không quá 10 giây trên ít nhất 2 `deviceId` khác nhau.

LLM đánh giá từng vé theo prompt và trả `verdict`, `confidence`, `evidence`; backend chỉ gắn `isFraud: true` trên luồng LLM bình thường khi kết quả LLM đạt ngưỡng/evidence tương ứng và log trong DB khớp ít nhất một rule. Seed có hai mẫu rõ ràng cho mỗi rule để LLM đánh giá từng mẫu độc lập. Prompt yêu cầu LLM trả `fraud_suspected` cho vé thỏa rule và nêu bằng chứng cụ thể. LLM là mô hình sinh nên không thể bảo đảm tuyệt đối cùng một kết quả ở mọi lần gọi. Riêng endpoint này chờ tối đa 10 giây; nếu timeout hoặc provider trả HTTP 503, API trả nguyên response tĩnh trong `check-in-analysis.timeout-fallback.ts`, với `generatedBy: "timeout-fallback-static"`. Các ticket ID, timestamp, nội dung và kết luận trong fallback là dữ liệu demo được hardcode, không lấy từ request/DB. Chỉ dùng response tĩnh này để demo giao diện. Lỗi cấu hình hoặc lỗi HTTP khác từ provider vẫn trả lỗi tương ứng. Các endpoint AI khác giữ timeout 5 phút. Với R4, nhiều lượt `ACCEPTED` có thể chỉ ra race condition trong xử lý check-in; đây là tín hiệu cần rà soát tính nguyên tử, không tự chứng minh người dùng cố ý gian lận. Các rule khác cũng là **mẫu hành vi cần rà soát**, không chứng minh ý định gian lận. API không tự chặn vé.

```json
{
  "eventId": "evt-001",
  "from": "2026-11-15T08:00:00.000Z",
  "to": "2026-11-15T09:00:00.000Z"
}
```

Frontend gửi khoảng thời gian tuyệt đối qua `from` và `to` (ISO 8601); backend truy vấn các lượt quét trong khoảng này và tự áp dụng cả bốn rule cố định. Frontend không gửi cấu hình rule. Seed tạo tám mẫu dương tính (hai mẫu cho mỗi rule) và ba mẫu đối chứng; lệnh seed in khoảng `from`/`to` đang chứa dữ liệu mẫu. Scenario R4 có hậu tố `multiple-accepted` và `multiple-accepted-2`. API từ chối khoảng không hợp lệ, `from > to` hoặc dài hơn 30 ngày. Thiết bị được nối qua quan hệ `Device` trong DB.

Migration gán `legacy-unknown` cho log cũ; các giá trị này không được tính là bằng chứng có nhiều máy quét.

Chưa có auth guard/rate limiting trên các endpoint này. Chỉ dùng local/dev đến khi xác thực và giới hạn sử dụng được hoàn thiện.
