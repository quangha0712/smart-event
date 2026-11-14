# ERD khởi đầu

Các entity chính được khai báo tại `prisma/schema.prisma`:

- User 1—N Registration
- Event 1—N Registration
- Event 1—N ScheduleItem
- Registration 1—0..1 Ticket
- Event 1—N EventFeedback
- Event 1—N BudgetItem
- AuditLog lưu lịch sử thao tác.

Sơ đồ ERD hình ảnh sẽ được bổ sung sau khi BA chốt thuộc tính và quan hệ.
