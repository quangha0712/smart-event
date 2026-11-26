# Thiết kế cơ sở dữ liệu (ERD)

> Người phụ trách: TV2 – BA. Nguồn sự thật: `prisma/schema.prisma` (MySQL 8.4, Prisma 6); migration trong `prisma/migrations/`.
> Sơ đồ viết bằng Mermaid nên hiển thị trực tiếp trên GitHub. Khi schema đổi, cập nhật tài liệu này trong cùng pull request.

## 1. Sơ đồ tổng quan (theo nhóm nghiệp vụ)

```mermaid
erDiagram
  User ||--o{ Registration : "đăng ký"
  Event ||--o{ Registration : "nhận"
  Registration ||--o| Ticket : "phát hành"
  Event ||--o{ ScheduleItem : "có phiên"
  ScheduleItem }o--o{ Speaker : "trình bày"
  Event ||--o{ Speaker : "mời"
  Event ||--o{ EventMember : "ban tổ chức"
  User ||--o{ EventMember : "là thành viên"
  Event ||--o{ CheckInAttempt : "ghi nhận"
  Ticket |o--o{ CheckInAttempt : "được quét"
  Device |o--o{ CheckInAttempt : "quét bởi"
  Device ||--o{ SensorReading : "đo"
  Event ||--o{ EventFeedback : "nhận"
  Event ||--o{ StaffAssignment : "cần"
  StaffMember ||--o{ StaffAssignment : "được phân công"
  Event ||--o{ Sponsor : "được tài trợ"
  Event ||--o{ BudgetItem : "dự toán"
  Event ||--o{ Expense : "thực chi"
  BudgetItem |o--o{ Expense : "chi theo"
  Vendor |o--o{ BudgetItem : "cung cấp"
```

Năm nhóm dữ liệu:

| Nhóm | Bảng | Phục vụ yêu cầu |
|---|---|---|
| Tài khoản & ban tổ chức | User, EventMember | FR-01, FR-15 |
| Sự kiện & chương trình | Event, ScheduleItem, Speaker | FR-02, FR-03 |
| Đăng ký, vé, check-in, IoT | Registration, Ticket, CheckInAttempt, Device, SensorReading | FR-04, FR-05, FR-06, FR-13, FR-17 |
| Nguồn lực & tài chính | StaffMember, StaffAssignment, Vendor, Sponsor, BudgetItem, Expense | FR-09, FR-12 |
| Phản hồi & kiểm soát | EventFeedback, AuditLog | FR-08, FR-14, FR-16 |

## 2. Sơ đồ chi tiết (đầy đủ thuộc tính)

PK = khoá chính, FK = khoá ngoại, UK = duy nhất. Kiểu enum xem mục 4.

```mermaid
erDiagram
  User {
    String id PK
    String email UK
    String fullName
    String passwordHash
    UserRole role
    DateTime createdAt
    DateTime updatedAt
  }
  EventMember {
    String eventId PK,FK
    String userId PK,FK
    EventMemberRole role
    String invitedById FK
    DateTime createdAt
    DateTime updatedAt
  }
  Event {
    String id PK
    String name
    String description
    String location
    DateTime startsAt
    DateTime endsAt
    Int capacity
    EventStatus status
    String createdById FK
    DateTime createdAt
    DateTime updatedAt
  }
  ScheduleItem {
    String id PK
    String eventId FK
    String title
    String description
    DateTime startsAt
    DateTime endsAt
    String room
  }
  Speaker {
    String id PK
    String eventId FK
    String fullName
    String title
    String organization
    String bio
    String email
    String avatarUrl
    DateTime createdAt
    DateTime updatedAt
  }
  Registration {
    String id PK
    String userId FK
    String eventId FK
    RegistrationStatus status
    DateTime createdAt
  }
  Ticket {
    String id PK
    String registrationId FK,UK
    String qrCode UK
    String nfcUid UK
    DateTime checkedInAt
    DateTime createdAt
  }
  EventFeedback {
    String id PK
    String eventId FK
    String userId FK
    Int rating
    String comment
    DateTime createdAt
  }
  Device {
    String id PK
    String eventId FK
    String code UK
    String name
    DeviceType type
    String location
    Boolean isSimulated
    Boolean isActive
    DateTime lastSeenAt
    DateTime createdAt
    DateTime updatedAt
  }
  CheckInAttempt {
    String id PK
    String eventId FK
    String ticketId FK
    String deviceId FK
    String operatorId FK
    String scannedCode
    CheckInMethod method
    CheckInResult result
    String note
    DateTime createdAt
  }
  SensorReading {
    String id PK
    String eventId FK
    String deviceId FK
    SensorType sensorType
    String zone
    Decimal value
    String unit
    DateTime recordedAt
    DateTime createdAt
  }
  StaffMember {
    String id PK
    String userId FK,UK
    String fullName
    String email
    String phone
    String position
    String skills
    String note
    Boolean isActive
    DateTime createdAt
    DateTime updatedAt
  }
  StaffAssignment {
    String id PK
    String eventId FK
    String staffId FK
    String role
    String task
    DateTime startsAt
    DateTime endsAt
    AssignmentStatus status
    DateTime createdAt
    DateTime updatedAt
  }
  Vendor {
    String id PK
    String name
    String serviceType
    String contactName
    String email
    String phone
    String address
    String taxCode UK
    String note
    DateTime createdAt
    DateTime updatedAt
  }
  Sponsor {
    String id PK
    String eventId FK
    String name
    String contactName
    String email
    String phone
    String website
    String logoUrl
    String tier
    Decimal amount
    String note
    DateTime createdAt
    DateTime updatedAt
  }
  BudgetItem {
    String id PK
    String eventId FK
    String vendorId FK
    String name
    String category
    Decimal quantity
    String unit
    Decimal unitPrice
    Decimal plannedAmount
    Boolean isIncome
    BudgetItemSource source
    String approvedById FK
    DateTime approvedAt
    String note
    DateTime createdAt
    DateTime updatedAt
  }
  Expense {
    String id PK
    String eventId FK
    String budgetItemId FK
    String vendorId FK
    String recordedById FK
    String description
    Decimal amount
    DateTime paidAt
    String invoiceNumber
    String attachmentUrl
    String note
    DateTime createdAt
    DateTime updatedAt
  }
  AuditLog {
    String id PK
    String actorId "ref User (lỏng)"
    String action
    String entityType
    String entityId
    Json details
    DateTime createdAt
  }
  User ||--o{ Registration : "đăng ký"
  Event ||--o{ Registration : "nhận"
  Registration ||--o| Ticket : "phát hành"
  Event ||--o{ ScheduleItem : "có phiên"
  Event ||--o{ Speaker : "mời"
  ScheduleItem }o--o{ Speaker : "trình bày"
  Event ||--o{ EventMember : "ban tổ chức"
  User ||--o{ EventMember : "là thành viên"
  User |o--o{ EventMember : "mời"
  User |o--o{ Event : "tạo"
  User ||--o{ EventFeedback : "gửi"
  Event ||--o{ EventFeedback : "nhận"
  Event |o--o{ Device : "triển khai"
  Event ||--o{ CheckInAttempt : "ghi nhận"
  Ticket |o--o{ CheckInAttempt : "được quét"
  Device |o--o{ CheckInAttempt : "quét bởi"
  User |o--o{ CheckInAttempt : "vận hành"
  Device ||--o{ SensorReading : "đo"
  Event ||--o{ SensorReading : "thuộc"
  User |o--o| StaffMember : "hồ sơ nhân sự"
  StaffMember ||--o{ StaffAssignment : "được phân công"
  Event ||--o{ StaffAssignment : "cần"
  Event ||--o{ Sponsor : "được tài trợ"
  Event ||--o{ BudgetItem : "dự toán"
  Vendor |o--o{ BudgetItem : "cung cấp"
  User |o--o{ BudgetItem : "duyệt"
  Event ||--o{ Expense : "thực chi"
  BudgetItem |o--o{ Expense : "chi theo"
  Vendor |o--o{ Expense : "nhận thanh toán"
  User |o--o{ Expense : "ghi nhận"
```

## 3. Quan hệ và quy tắc toàn vẹn

| Quan hệ | Bản số | Xoá bản ghi cha | Ý nghĩa nghiệp vụ |
|---|---|---|---|
| User – Registration – Event | N–N qua Registration | Cascade | Một người chỉ có **một** đăng ký cho mỗi sự kiện (`@@unique([userId, eventId])`); đăng ký bị huỷ có thể kích hoạt lại. |
| Registration – Ticket | 1 – 0..1 | Cascade | Mỗi đăng ký hợp lệ có đúng một vé. `qrCode` duy nhất, dạng `SE1.<ticketId>.<HMAC>`; `nfcUid` duy nhất nếu gắn thẻ NFC. |
| Ticket – CheckInAttempt | 0..1 – N | SetNull | Ghi **mọi** lượt quét, kể cả mã sai (ticketId = null). Chỉ lượt ACCEPTED mới ghi `Ticket.checkedInAt`. |
| Device – CheckInAttempt / SensorReading | 0..1 – N / 1 – N | SetNull / Cascade | Máy quét, đầu đọc NFC, cảm biến (có cờ `isSimulated` cho demo). `Device.code` duy nhất, là mã máy gửi lên khi check-in. |
| Event – EventMember – User | N–N | Cascade | Khoá chính kép (eventId, userId): mỗi người có **một** vai trò trong một sự kiện; sự kiện luôn còn ít nhất một OWNER (kiểm tra ở service). |
| User – Event (createdBy) | 0..1 – N | SetNull | Người tạo tự trở thành OWNER. |
| ScheduleItem – Speaker | N–N | Cascade | Bảng nối ngầm `_ScheduleItemToSpeaker`; diễn giả phải cùng sự kiện với phiên. |
| StaffMember – StaffAssignment – Event | N–N | Cascade | Duy nhất theo (eventId, staffId, role). StaffMember là danh bạ dùng chung, có thể liên kết 0..1 tài khoản. |
| Event – Sponsor | 1 – N | Cascade | Gộp thông tin nhà tài trợ và giá trị tài trợ (đã bỏ bảng Funding vì trùng). |
| Event – BudgetItem – Expense | 1 – N – N | Cascade / SetNull | `plannedAmount = quantity × unitPrice` (tính ở service). Expense không gắn BudgetItem = chi phát sinh ngoài dự toán. Thiết kế: dòng `source = AI_SUGGESTED` cần người duyệt (`approvedById`, `approvedAt`) – hiện service chưa ghi hai trường này. |
| Event – EventFeedback – User | N–N | Cascade | Mỗi người đánh giá một sự kiện một lần (`@@unique([eventId, userId])`). |
| AuditLog | độc lập | – | `actorId`, `entityId` là tham chiếu lỏng (không FK) để log vẫn còn khi bản ghi gốc bị xoá. |

## 4. Kiểu liệt kê (enum) và vòng đời

| Enum | Giá trị | Ghi chú |
|---|---|---|
| UserRole | ADMIN, ORGANIZER, ATTENDEE | Quyền hệ thống; tài khoản tự đăng ký luôn là ATTENDEE. |
| EventMemberRole | OWNER, CO_ORGANIZER, CHECKIN_STAFF | Quyền trong từng sự kiện. |
| EventStatus | DRAFT, PUBLISHED, CANCELLED, COMPLETED | Xem sơ đồ trạng thái bên dưới. |
| RegistrationStatus | PENDING, CONFIRMED, CANCELLED | Hiện đăng ký tạo ra là CONFIRMED ngay (PENDING dự phòng cho duyệt thủ công). |
| CheckInMethod | QR, NFC, MANUAL | |
| CheckInResult | ACCEPTED, DUPLICATE, INVALID_CODE, WRONG_EVENT, NOT_ELIGIBLE, OUT_OF_HOURS | AI check-in quy đổi sang ACCEPTED / ALREADY_USED / INVALID / NOT_ELIGIBLE. |
| DeviceType | QR_SCANNER, NFC_READER, SENSOR, GATEWAY | |
| SensorType | TEMPERATURE, HUMIDITY, CO2, NOISE, PEOPLE_COUNT, OTHER | PEOPLE_COUNT dùng cho mật độ khu vực trên dashboard. |
| AssignmentStatus | ASSIGNED, CONFIRMED, DECLINED, COMPLETED | |
| BudgetItemSource | MANUAL, AI_SUGGESTED | |

```mermaid
stateDiagram-v2
  [*] --> DRAFT : Tạo sự kiện
  DRAFT --> PUBLISHED : Công bố (chưa qua giờ kết thúc)
  PUBLISHED --> DRAFT : Về nháp (chưa có đăng ký)
  PUBLISHED --> COMPLETED : Kết thúc (sau giờ kết thúc)
  DRAFT --> CANCELLED : Huỷ (chỉ OWNER)
  PUBLISHED --> CANCELLED : Huỷ (chỉ OWNER)
  COMPLETED --> [*]
  CANCELLED --> [*]
```

Sự kiện CANCELLED/COMPLETED không được sửa; sức chứa mới không được nhỏ hơn số đăng ký CONFIRMED.

## 5. Chỉ mục phục vụ truy vấn chính

- `Event(status, startsAt)`: danh sách sự kiện công khai theo thời gian.
- `CheckInAttempt(eventId, createdAt)` và `(eventId, result)`: dashboard và AI phân tích check-in theo khoảng thời gian.
- `SensorReading(eventId, zone, recordedAt)`: mật độ theo khu vực.
- `Registration(eventId, status)`: đếm chỗ đã dùng khi kiểm soát sức chứa.

## 6. Hạn chế và việc còn lại

- Chưa có API ghi EventFeedback (bảng đã có) → FR-08 và AI feedback-insights (FR-14) chưa có dữ liệu thật.
- Chưa có API quản lý Device/SensorReading; dữ liệu thiết bị hiện do seed tạo.
- AuditLog đang ghi thao tác sự kiện (tạo, sửa, đổi trạng thái), lịch trình, đăng ký/huỷ và thành viên ban tổ chức; chưa ghi cho nguồn lực, dự toán – thực chi và check-in (check-in đã có bảng CheckInAttempt riêng).
