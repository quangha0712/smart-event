# Frontend utilities

- `api.ts`: gọi API dùng chung. Tự gắn `Authorization: Bearer <token>`, gửi/nhận JSON, ném `ApiError` (có `status`, `message`).
  - `api.get/post/patch/delete(path, body?, { query, auth, signal })`; `auth: false` cho route công khai.
  - Gặp 401 khi đang có token: xoá phiên và phát sự kiện để `AuthProvider` chuyển về trang đăng nhập.
- `session.ts`: lưu token + user trong localStorage (`smart-event.accessToken`, `smart-event.user`), tự bỏ token hết hạn.
- `navigation.ts`: menu chính và quyền xem từng mục.

Không gọi `fetch` trực tiếp tới API; luôn dùng `api` để có token và xử lý lỗi thống nhất.
