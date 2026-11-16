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

### Check-in risk analysis

`POST /api/ai/check-in-analysis` lấy số liệu và chuỗi log từng vé từ `CheckInAttempt` trong MySQL. LLM trả đánh giá theo từng `ticketRef`; backend hậu xử lý theo bốn quy tắc:

1. **Quét lặp dồn dập:** LLM trả `fraud_suspected`, confidence >= 0.85 và có evidence; cùng vé có `ACCEPTED`, sau đó ít nhất 3 `ALREADY_USED` trong 5 phút; chuỗi quét có ít nhất 2 `deviceId`.
2. **Quét lặp kéo dài:** LLM trả `fraud_suspected`, confidence >= 0.90 và có evidence; cùng vé có ít nhất 5 `ALREADY_USED` sau `ACCEPTED`, từ lần lặp đầu đến cuối kéo dài ít nhất 10 phút; lượt lặp đến từ ít nhất 2 `deviceId`.
3. **Nhiều đợt quét lặp tách biệt:** LLM trả `fraud_suspected`, confidence >= 0.90 và có evidence; có ít nhất 2 cụm `ALREADY_USED`, mỗi cụm có ít nhất 2 lượt trong 5 phút, thời điểm bắt đầu cách nhau ít nhất 30 phút; có ít nhất 2 `deviceId` và một cụm có lượt quét từ ít nhất 2 thiết bị.
4. **Một vé được ACCEPTED gần như đồng thời trên nhiều máy:** LLM trả `fraud_suspected`, confidence >= 0.90 và có evidence; cùng vé có ít nhất 2 lượt `ACCEPTED` cách nhau không quá 10 giây trên ít nhất 2 `deviceId` khác nhau.

Khớp một trong bốn quy tắc thì API trả `isFraud: true` theo chính sách demo và yêu cầu ban tổ chức rà soát. Với R4, nhiều lượt `ACCEPTED` có thể chỉ ra race condition trong xử lý check-in; đây là tín hiệu cần rà soát tính nguyên tử của thao tác check-in, không tự chứng minh người dùng cố ý gian lận. Với các rule khác, đây là **vé có mẫu hành vi nghi ngờ**, không chứng minh người quét cố ý gian lận; nhân viên quét lại hoặc thiết bị gửi lại yêu cầu vẫn có thể tạo mẫu tương tự. Nếu LLM trả `not_suspected` với confidence >= 0.85 và không có lượt lặp/mã sai thì `isFraud: false`; trường hợp khác trả `null`/`INCONCLUSIVE`. API không tự chặn vé.

```json
{
  "eventId": "evt-001",
  "from": "2026-11-15T08:00:00.000Z",
  "to": "2026-11-15T09:00:00.000Z"
}
```

Frontend gửi khoảng thời gian tuyệt đối qua `from` và `to` (ISO 8601); backend truy vấn các lượt quét trong khoảng này và tự áp dụng cả bốn rule cố định. Frontend không gửi cấu hình rule. Seed tạo bốn mẫu dương tính (gồm R4) và ba mẫu đối chứng; lệnh seed in khoảng `from`/`to` đang chứa dữ liệu mẫu. Dùng QR demo `DEMO-QR-MULTIPLE-ACCEPTED` để tìm scenario R4. API từ chối khoảng không hợp lệ, `from > to` hoặc dài hơn 30 ngày. `deviceId` là mã máy quét, được gửi cùng mỗi request check-in và lưu trong `CheckInAttempt`. Mã này cho biết chuỗi quét dùng cùng hay khác máy, nhưng chưa xác thực danh tính thiết bị.

Migration gán `legacy-unknown` cho log cũ; các giá trị này không được tính là bằng chứng có nhiều máy quét.

Chưa có auth guard/rate limiting trên các endpoint này. Chỉ dùng local/dev đến khi xác thực và giới hạn sử dụng được hoàn thiện.
