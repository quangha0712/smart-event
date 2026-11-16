# Audit log

`AuditLogService` ghi sự kiện nghiệp vụ trong cùng transaction với đăng ký/hủy đăng ký/check-in để log và dữ liệu chính không lệch nhau. Không ghi API key hoặc nguyên payload QR.

- `GET /api/audit-logs?eventId=...&from=...&to=...&page=1&pageSize=50` lọc theo sự kiện và thời gian, sắp xếp mới nhất trước và phân trang. Nếu bỏ `from`/`to`, mặc định là 24 giờ gần nhất; tối đa 30 ngày, tối đa 200 bản ghi/trang.
- `eventId` là bắt buộc. Endpoint hiện chưa có auth guard nên chỉ dùng local/dev cho đến khi phân quyền organizer được triển khai.
