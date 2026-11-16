# Auth module

Đăng nhập JWT, mật khẩu băm bcrypt, 3 quyền ADMIN / ORGANIZER / ATTENDEE.

- `AuthGuard` đăng ký toàn cục: mọi route cần token, trừ route gắn `@Public()`.
- `@Roles(UserRole.ORGANIZER)` giới hạn quyền; ADMIN luôn được phép. Quyền được đọc lại từ DB mỗi request.
- `@CurrentUser()` lấy người dùng hiện tại.
- Cần `JWT_SECRET` (>= 32 ký tự ngẫu nhiên) trong `.env`, nếu không API dừng ngay khi khởi động.
- Tài khoản demo do seed tạo: `admin@`, `organizer@`, `attendee@example.com`, mật khẩu `SEED_DEMO_PASSWORD` (mặc định `SmartEvent@2026`).
