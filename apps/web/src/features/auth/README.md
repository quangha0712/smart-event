# Auth feature

Giao diện đăng nhập và trạng thái người dùng.

- `AuthProvider` (bọc trong `app/layout.tsx`): `useAuth()` trả `user`, `status`, `login`, `logout`, `hasRole(...)`. Khi tải trang gọi `/auth/me` để xác nhận token và lấy quyền mới nhất.
- `RequireAuth`: bọc nội dung trang cần đăng nhập, ví dụ `<RequireAuth roles={["ORGANIZER"]}>...</RequireAuth>`. Chưa đăng nhập → `/login?next=...`; sai quyền → thông báo 403. ADMIN luôn được vào.
- `LoginForm`: trang `/login`, chỉ chuyển hướng về đường dẫn nội bộ (`next` bắt đầu bằng `/`).
- `UserRoleTable`: trang `/admin/users` cho ADMIN đổi quyền.

Chặn trang ở frontend chỉ để điều hướng; bảo mật thật do API kiểm tra quyền.
