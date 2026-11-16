# Resources module (Nguồn lực)

Gộp quản lý **nhân sự, nhà cung cấp, nhà tài trợ và ngân sách** (dự toán – thực chi), thao tác thêm/sửa/xoá đơn giản.
Mọi route có tiền tố `/api/resources`.

| Tài nguyên | Route | Lọc (query) |
| --- | --- | --- |
| Nhân sự | `/staff` | |
| Phân công nhân sự | `/staff-assignments` | `eventId` |
| Nhà cung cấp | `/vendors` | `serviceType` |
| Nhà tài trợ (gắn với sự kiện, có `tier`, `amount`) | `/sponsors` | `eventId` |
| Dự toán | `/budget-items` | `eventId` |
| Thực chi | `/expenses` | `eventId`, `budgetItemId` |
| Tổng hợp dự toán – thực chi | `GET /budget-summary/:eventId` | |

Mỗi tài nguyên (trừ `budget-summary`) có: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` (trả 204).
Riêng `staff-assignments` không có `GET /:id`.

Quy tắc:

- `budget-items.plannedAmount` do server tính = `quantity × unitPrice`; `quantity` mặc định 1.
- Xoá dòng dự toán không xoá thực chi liên quan; khoản đó trở thành chi ngoài dự toán.
- Xoá nhân sự sẽ xoá các phân công của người đó. Xoá nhà cung cấp chỉ gỡ liên kết ở dự toán/thực chi.
- Lỗi tham chiếu sai (`eventId`, `vendorId`...) trả 400, không tìm thấy trả 404, trùng dữ liệu trả 409.
