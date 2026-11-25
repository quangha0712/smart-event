# API contract

> Người phụ trách tài liệu: TV2 – BA (đối chiếu với controller trong `apps/api/src`, nhánh `dev`). Swagger chạy tại `http://localhost:3001/docs` (OpenAPI JSON: `/docs-json`) là nguồn chi tiết DTO.

## 1. Quy ước chung

- Base URL cục bộ: `http://localhost:3001/api`.
- Xác thực: header `Authorization: Bearer <accessToken>` lấy từ `POST /auth/login`. Mọi route cần đăng nhập, trừ dòng ghi **Công khai**.
- Hai lớp phân quyền:
  - **Quyền hệ thống** (`UserRole`): ADMIN, ORGANIZER, ATTENDEE. ADMIN luôn được phép.
  - **Vai trò trong sự kiện** (`EventMemberRole`, kiểm tra bởi `EventMemberGuard`): OWNER, CO_ORGANIZER, CHECKIN_STAFF. Viết tắt bên dưới: **ALL** = cả ba; **MGR** = OWNER + CO_ORGANIZER; **OWN** = chỉ OWNER.
- Mã lỗi: 400 dữ liệu sai / tham chiếu không tồn tại · 401 chưa đăng nhập hoặc token hết hạn · 403 không đủ quyền · 404 không tìm thấy (cũng dùng khi không được xem bản ghi của người khác) · 409 xung đột nghiệp vụ (trùng, hết chỗ, sai trạng thái) · 502 AI trả lỗi/sai định dạng · 503 AI chưa cấu hình hoặc không kết nối được.

## 2. Danh mục endpoint

### 2.1 Tài khoản (FR-01)

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| GET | `/health` | Công khai | Kiểm tra API |
| POST | `/auth/register` | Công khai | Tạo tài khoản ATTENDEE `{ email, fullName, password }` |
| POST | `/auth/login` | Công khai | Trả `accessToken` (JWT, mặc định 8h) |
| GET / PATCH | `/auth/me` | Đã đăng nhập | Xem / sửa họ tên |
| PATCH | `/auth/me/password` | Đã đăng nhập | Đổi mật khẩu (cần mật khẩu hiện tại) |
| GET | `/auth/users` | ADMIN | Danh sách tài khoản |
| PATCH | `/auth/users/:id/role` | ADMIN | Đổi quyền hệ thống |

### 2.2 Sự kiện, ban tổ chức, lịch trình (FR-02, FR-03, FR-15)

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| GET | `/events` | Công khai (đọc token nếu có) | ADMIN: tất cả; ORGANIZER: sự kiện mình thuộc + `myRole`; khách/ATTENDEE: không có bản nháp |
| GET | `/events/:id` | Công khai | Chi tiết kèm lịch trình, diễn giả (không trả email diễn giả); bản nháp chỉ thành viên/ADMIN |
| POST | `/events` | ORGANIZER | Tạo sự kiện DRAFT, người tạo thành OWNER |
| PATCH | `/events/:id` | ORGANIZER · MGR | Sửa thông tin; `null` = xoá mô tả/địa điểm/bỏ giới hạn sức chứa |
| PATCH | `/events/:id/status` | ORGANIZER · MGR (huỷ: OWN) | `{ status }` theo vòng đời trong [ERD §4](erd.md) |
| GET | `/me/event-memberships` | ORGANIZER | Sự kiện mình là thành viên kèm vai trò |
| GET | `/events/:eventId/members` | ORGANIZER · ALL | Danh sách ban tổ chức |
| POST | `/events/:eventId/members` | ORGANIZER · OWN | `{ email, role }`; tài khoản phải là ORGANIZER; chỉ ADMIN gán OWNER |
| PATCH / DELETE | `/events/:eventId/members/:userId` | ORGANIZER · OWN | Đổi vai trò / gỡ; luôn còn ≥ 1 OWNER |
| GET / POST | `/events/:eventId/schedules` | ORGANIZER · MGR | `{ title, startsAt, endsAt, room?, description?, speakerIds? }` |
| PATCH / DELETE | `/events/:eventId/schedules/:id` | ORGANIZER · MGR | `speakerIds` khi sửa thay toàn bộ danh sách |
| GET / POST | `/events/:eventId/speakers` | ORGANIZER · MGR | `{ fullName, title?, organization?, bio?, email?, avatarUrl? }` |
| PATCH / DELETE | `/events/:eventId/speakers/:id` | ORGANIZER · MGR | |

### 2.3 Đăng ký, vé, check-in (FR-04, FR-05, FR-06)

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| POST | `/events/:eventId/registrations` | Đã đăng nhập | Tự đăng ký; `{ userId }` để đăng ký hộ chỉ dành cho MGR |
| GET / DELETE | `/events/:eventId/registrations/:registrationId` | Chủ đăng ký hoặc MGR | Xem (kèm `qrPayload`) / huỷ. Người khác nhận 404 |
| GET | `/me/registrations` | Đã đăng nhập | "Vé của tôi" |
| GET | `/tickets/:qrCode` | Đã đăng nhập | Tra cứu vé; `valid=false` và không trả `qrPayload` nếu đăng ký đã huỷ |
| POST | `/check-in` | ORGANIZER · ALL | `{ eventId, code, method?: QR\|NFC\|MANUAL, deviceCode? }`; **luôn 200**, xem `result`/`accepted`/`message` |
| GET | `/check-in/events/:eventId/stats?windowMinutes=` | ORGANIZER · ALL | Tổng lượt, hợp lệ, quét lặp, mã sai, không đủ điều kiện |

Ví dụ phản hồi check-in:

```json
{
  "result": "DUPLICATE",
  "accepted": false,
  "message": "Vé này đã check-in trước đó",
  "checkedInAt": "2026-11-20T01:05:12.000Z",
  "checkInWindow": { "opensAt": "2026-11-19T23:00:00.000Z", "closesAt": "2026-11-20T10:00:00.000Z" },
  "attendee": { "fullName": "Nguyễn Văn A" }
}
```

`result` ∈ ACCEPTED, DUPLICATE, INVALID_CODE, WRONG_EVENT, NOT_ELIGIBLE, OUT_OF_HOURS. Mã QR: `SE1.<ticketId>.<HMAC-SHA256>` ký bằng `TICKET_QR_SECRET`.

### 2.4 Dashboard, nguồn lực, nhật ký (FR-07, FR-09, FR-16)

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| GET | `/events/:eventId/dashboard` | ORGANIZER · MGR | Đăng ký, check-in theo khung, kết quả quét, mật độ khu vực, dự toán – thực chi |
| GET/POST/PATCH/DELETE | `/resources/staff[/:id]` | ORGANIZER | Danh bạ nhân sự dùng chung |
| GET/POST/PATCH/DELETE | `/resources/staff-assignments[/:id]` | ORGANIZER · MGR | Phân công theo sự kiện; GET không có `eventId` → chỉ sự kiện mình quản lý |
| GET/POST/PATCH/DELETE | `/resources/vendors[/:id]` | ORGANIZER | Danh bạ nhà cung cấp |
| GET/POST/PATCH/DELETE | `/resources/sponsors[/:id]` | ORGANIZER · MGR | Nhà tài trợ theo sự kiện |
| GET/POST/PATCH/DELETE | `/resources/budget-items[/:id]` | ORGANIZER · MGR | Dự toán; server tính `plannedAmount` |
| GET/POST/PATCH/DELETE | `/resources/expenses[/:id]` | ORGANIZER · MGR | Thực chi; không gắn được vào dự toán của sự kiện khác |
| GET | `/resources/budget-summary/:eventId` | ORGANIZER · MGR | So sánh dự toán – thực chi |
| GET | `/audit-logs?eventId=&from=&to=&page=&pageSize=` | ORGANIZER · MGR | Mặc định 24 giờ gần nhất; tối đa 30 ngày; `pageSize` ≤ 200 |

### 2.5 AI (FR-10 … FR-14)

| Method | Endpoint | Quyền | Chủ sở hữu | Đầu vào chính |
|---|---|---|---|---|
| POST | `/ai/project-summary` | ORGANIZER | TV1 | `{ period, completedItems[], pendingItems[], risks[] }` |
| POST | `/ai/requirements-draft` | ORGANIZER | TV2 | Xem §3 |
| POST | `/ai/budget-estimate` | ORGANIZER | TV3 | `{ eventType, attendees, days, location, constraints?, currency: VND\|USD }` |
| POST | `/ai/check-in-analysis` | ⚠️ đang **Công khai** tạm để test Swagger; đích là ORGANIZER · MGR | TV4 | `{ eventId, from, to }` (ISO 8601, ≤ 30 ngày) |
| POST | `/ai/events/:eventId/feedback-insights` | ORGANIZER · MGR | TV5 | Không có body; server lấy tối đa 500 đánh giá, bỏ định danh |

Mọi phản hồi AI có dạng `{ result, generatedBy, requiresHumanReview: true }`. Chi tiết luật check-in R1–R4 và dữ liệu seed: [ai-requirements.md](ai-requirements.md).

## 3. Chi tiết `POST /ai/requirements-draft` (TV2)

**Request**

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `problemStatement` | string | ✔ | ≤ 4000 ký tự |
| `targetUsers` | string | ✔ | ≤ 1000 ký tự |
| `moduleName` | string | | ≤ 100 ký tự |
| `businessGoals` | string[] | | ≤ 10 phần tử, mỗi phần tử ≤ 300 ký tự |
| `constraints` | string[] | | như trên |
| `maxRequirements` | int | | 3–20, mặc định 10 |

```json
{
  "problemStatement": "Ban tổ chức muốn người tham dự nhận nhắc lịch trước mỗi phiên họ quan tâm và có thể đổi phiên khi phiên còn chỗ. Hiện nhân viên phải gọi điện nhắc thủ công.",
  "targetUsers": "Người tham dự hội thảo; Chủ sự kiện; Đồng tổ chức",
  "moduleName": "Lịch trình",
  "businessGoals": ["Giảm cuộc gọi nhắc lịch thủ công"],
  "constraints": ["Không gửi SMS trả phí trong giai đoạn demo"],
  "maxRequirements": 6
}
```

**Xử lý:** che email / số điện thoại VN / CMND-CCCD → gửi AI kèm danh mục FR-01…FR-17 → hậu kiểm (`requirements-draft.review.ts`).

**Response `result`**

| Trường | Nội dung |
|---|---|
| `status` | Luôn `DRAFT_PENDING_BA_REVIEW` |
| `functionalRequirements[]` | `{ id: "DRAFT-FR-01", sourceId, title, description, actor, priority: MUST\|SHOULD\|COULD\|WONT, acceptanceCriteria[], relatedBaselineIds[], possibleDuplicateOf }` |
| `nonFunctionalRequirements[]` | `{ id: "DRAFT-NFR-01", category, description, metric }` |
| `useCases[]` | `{ id: "DRAFT-UC-01", name, primaryActor, preconditions[], mainFlow[], alternativeFlows[], postconditions[], relatedRequirementIds[] }` (tham chiếu đã đổi sang mã DRAFT) |
| `assumptions[]`, `outOfScope[]`, `businessRules[]`, `businessRisks[]`, `clarificationQuestions[]` | Để BA xác nhận với bên liên quan |
| `traceability[]` | `{ requirementId, useCaseIds[], baselineIds[] }` |
| `reviewFindings[]` | `{ code, severity: error\|warning\|info, targetId, message }` – danh sách mã tại [ai-requirements.md](ai-requirements.md#fr-11--ai-bản-nháp-yêu-cầu-tv2) |
| `quality` | `{ score 0–100, readiness: READY_FOR_BA_REVIEW\|NEEDS_REWORK, counts }` |
| `redactions` | `{ emails, phones, idNumbers }` số dữ liệu cá nhân đã che |
| `reviewChecklist[]` | Việc BA phải làm trước khi đưa vào SRS |
| `srsMarkdown` | Bản Markdown để dán vào tài liệu rà soát |

## 4. Khác biệt cần thống nhất

| # | Vấn đề | Đề xuất | Người xử lý |
|---|---|---|---|
| 1 | `POST /ai/check-in-analysis` đang `@Public()` | Bỏ `@Public()`, bật lại `@EventRoles(EVENT_ROLES.MANAGERS)` trước demo | TV4 |
| 2 | Test case CIN-001…005 dùng `qrCode/deviceId`, kết quả `ALREADY_USED/INVALID` và yêu cầu `deviceId` bắt buộc; API thực nhận `code/deviceCode` (tuỳ chọn) và trả 6 giá trị `result` | Cập nhật test case theo hợp đồng ở §2.3 | TV5 |
| 3 | Chưa có `POST /events/:eventId/feedback` | Thêm endpoint theo FR-08 | TV4/TV3 (theo PM phân) |
| 4 | Chưa có API quản lý `Device` | Thêm CRUD thiết bị theo FR-17.1 nếu còn thời gian | TV4 |
