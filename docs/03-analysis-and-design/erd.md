# ERD

Các entity được khai báo tại `prisma/schema.prisma`; migration nằm trong `prisma/migrations/`.

## Sự kiện & người tham dự

- User 1—N Registration; Event 1—N Registration
- Event 1—N ScheduleItem (có `room`); Event 1—N Speaker; ScheduleItem N—N Speaker (bảng nối `_ScheduleItemToSpeaker`)
- Registration 1—0..1 Ticket (Ticket có `qrCode` ký HMAC, duy nhất, và `nfcUid` tuỳ chọn)
- Event 1—N EventFeedback

## Check-in & IoT

- Event 1—N Device (máy quét QR, đầu đọc NFC, cảm biến, gateway; có cờ `isSimulated` cho demo)
- Event 1—N CheckInAttempt: lưu **mọi** lượt quét với `result` = ACCEPTED / DUPLICATE / INVALID_CODE / WRONG_EVENT / NOT_ELIGIBLE
  - CheckInAttempt N—0..1 Ticket, Device, User (người vận hành)
  - Chỉ lượt ACCEPTED mới ghi `Ticket.checkedInAt`; số liệu tổng hợp cho `POST /ai/check-in-analysis` lấy từ bảng này
- Device 1—N SensorReading (loại cảm biến, khu vực `zone`, giá trị, đơn vị, thời điểm đo; PEOPLE_COUNT = số người trong khu vực)

## Nguồn lực (module `resources`)

- StaffMember (có thể liên kết 0..1 User); Event 1—N StaffAssignment N—1 StaffMember (duy nhất theo `eventId + staffId + role`)
- Vendor 1—N BudgetItem, Vendor 1—N Expense
- Event 1—N Sponsor: mỗi nhà tài trợ gắn với một sự kiện, có `tier` (hạng) và `amount` (giá trị tài trợ). Đã bỏ bảng Funding vì trùng với Sponsor.

## Dự toán – thực chi

- Event 1—N BudgetItem (dự toán): `quantity × unitPrice = plannedAmount`, `source` MANUAL / AI_SUGGESTED, người duyệt `approvedBy`
- Event 1—N Expense (thực chi); Expense N—0..1 BudgetItem (null = chi phát sinh ngoài dự toán)
- Chênh lệch = Σ Expense.amount − BudgetItem.plannedAmount; xem `GET /api/resources/budget-summary/:eventId`

## Khác

- AuditLog lưu lịch sử thao tác (bảng có sẵn, module để sau).
