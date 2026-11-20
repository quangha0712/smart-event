# Thiết kế giao diện

- Thiết kế tham chiếu hiện tại: [trang chủ](../../apps/web/src/app/page.tsx) và [CSS chung](../../apps/web/src/app/globals.css); chưa có Figma.
- Màn hình: đăng nhập, danh sách/chi tiết sự kiện, đăng ký, vé QR, check-in, dashboard, đánh giá và quản trị.
- Frontend khởi tạo tại `apps/web`.

## Định hướng giao diện

- Giữ giao diện sáng và màu xanh dương hiện có làm điểm nhấn; nền sáng, bề mặt trắng và chữ tối.
- Nút chính chuyển sang tông tối gần đen; nút phụ và nút nguy hiểm cần phân biệt rõ với nút chính. Dùng màu xanh cho liên kết, trạng thái đang chọn và các điểm nhấn phù hợp.
- Ưu tiên chuyển động tinh tế, mượt và nhẹ, tham khảo cảm giác tương tác của Claude: chuyển trạng thái hover/focus, mở nội dung và phản hồi thao tác; không sao chép giao diện. Không để hiệu ứng cản trở thao tác hoặc làm chậm nội dung.
- Tôn trọng thiết lập giảm chuyển động của người dùng (`prefers-reduced-motion`); vẫn đảm bảo nhận biết trạng thái khi không có animation.
- Dùng bố cục thoáng, phân cấp chữ rõ ràng, thành phần nhất quán và giao diện thích ứng với điện thoại/desktop.

Định hướng màu sắc và chuyển động đã được người yêu cầu xác nhận. Chưa có thiết kế Figma hoặc xác nhận của cả nhóm.

## Quy ước triển khai phần nền

- Màu nền `#f4f7fb`, bề mặt `#ffffff`, chữ chính `#172033`, chữ phụ `#526078`, điểm nhấn `#2563eb`, nút chính `#202734`.
- Font Aptos/Segoe UI với dự phòng sans-serif, dùng cùng một họ chữ với kích thước và độ đậm phân cấp. Trang chủ giới thiệu quy trình sự kiện và vai trò người dùng; menu hiển thị theo quyền đã có.
- Hover/focus và phản hồi thao tác dùng chuyển động ngắn, không chặn thao tác; tắt gần như hoàn toàn khi bật `prefers-reduced-motion`.
- Menu cuộn ngang trên màn hình nhỏ; phần giới thiệu và nội dung theo vai trò tự chuyển thành một cột khi cần. Bảng dữ liệu có vùng cuộn ngang riêng.
- Loading, dữ liệu rỗng và lỗi phải có nội dung rõ ràng; đổi quyền thành công có thông báo dùng kiểu chung và `role="status"`.

## Tiêu chí review

- Trang chủ và menu dẫn đến các trang thực sự có trong ứng dụng, không giả lập chức năng hoặc số liệu.
- Nội dung dễ đọc ở desktop và điện thoại; không tràn trang, trừ vùng bảng được phép cuộn ngang.
- Có thể điều hướng bằng bàn phím, nhận biết focus, nhãn form và các thông báo lỗi; kiểm tra độ tương phản chữ và nút.
- Hiệu ứng không gây khó chịu, không làm mất thông tin khi bật giảm chuyển động. Cần kiểm tra trực tiếp trên trình duyệt trước khi nghiệm thu.
