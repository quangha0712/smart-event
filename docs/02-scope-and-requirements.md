# Đặc tả yêu cầu phần mềm (SRS) – Phần mềm Quản lý Sự kiện Thông minh

| Thuộc tính | Giá trị |
|---|---|
| Người phụ trách | TV2 – Phân tích nghiệp vụ (BA) |
| Phiên bản | 1.0 (chốt theo code nhánh `dev`, 21/11/2026) |
| Cấu trúc | Tham khảo ISO/IEC/IEEE 29148 (mục đích – phạm vi – người dùng – FR – NFR – ràng buộc – truy vết) |
| Tài liệu liên quan | [Bên liên quan & khảo sát](03-analysis-and-design/stakeholder-analysis.md) · [Use case](03-analysis-and-design/use-cases.md) · [Quy trình](03-analysis-and-design/business-processes.md) · [ERD](03-analysis-and-design/erd.md) · [API](03-analysis-and-design/api-contract.md) · [Giao diện](03-analysis-and-design/ui-design.md) · [AI](03-analysis-and-design/ai-requirements.md) |

Trạng thái mỗi yêu cầu được BA đối chiếu trực tiếp với mã nguồn: **Đã có** (API + giao diện chạy được), **Một phần** (mới có một phía hoặc thiếu một số tiêu chí), **Chưa làm**.

## 1. Mục đích và phạm vi

### 1.1 Bài toán

Ban tổ chức hội thảo, workshop, sự kiện cộng đồng hiện thường quản lý bằng nhiều công cụ rời rạc: form đăng ký trực tuyến, bảng tính danh sách khách, nhóm chat để phân công, đối chiếu tên thủ công ở cổng và tổng hợp chi phí sau sự kiện. Hậu quả: xếp hàng lâu khi check-in, khó chặn vé chụp màn hình dùng lại, số liệu tham dự và chi phí chỉ có sau khi sự kiện kết thúc.

### 1.2 Mục tiêu sản phẩm

1. Một hệ thống duy nhất cho toàn bộ vòng đời sự kiện: lập kế hoạch → công bố → đăng ký → phát vé → check-in → thống kê → đánh giá.
2. Mỗi vé chỉ được check-in **một lần**, kể cả khi nhiều máy quét cùng lúc.
3. Ban tổ chức xem số liệu đăng ký, check-in, mật độ khu vực và dự toán – thực chi **trong lúc** sự kiện diễn ra.
4. AI hỗ trợ soạn thảo, ước lượng và phát hiện bất thường, nhưng **con người luôn duyệt** trước khi dùng kết quả.

### 1.3 Phạm vi

**Trong phạm vi (bản demo môn học):** tài khoản và phân quyền; sự kiện, lịch trình, diễn giả; ban tổ chức theo sự kiện; đăng ký, vé QR có chữ ký; check-in QR/NFC/thủ công; thiết bị và cảm biến (dữ liệu giả lập); dashboard; nhân sự, nhà cung cấp, nhà tài trợ, dự toán – thực chi; nhật ký thao tác; 5 tính năng AI.

**Ngoài phạm vi:** thanh toán và bán vé có phí; gửi email/SMS; ứng dụng di động native; chế độ check-in offline; tích hợp phần cứng IoT thật (chỉ giả lập dữ liệu); đa ngôn ngữ; triển khai production có giám sát và sao lưu.

### 1.4 Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| Ban tổ chức (ORGANIZER) | Quyền hệ thống cho phép tạo và quản lý sự kiện |
| Chủ sự kiện (OWNER) / Đồng tổ chức (CO_ORGANIZER) / Nhân viên check-in (CHECKIN_STAFF) | Vai trò của một người **trong một sự kiện cụ thể** |
| Lượt quét (CheckInAttempt) | Một lần đưa mã vé vào máy quét, kể cả bị từ chối |
| Quét lặp | Lượt quét vé đã check-in thành công trước đó (kết quả DUPLICATE) |
| Bản nháp AI | Kết quả do AI tạo, có `requiresHumanReview: true`, chưa có giá trị quyết định |

## 2. Người dùng và đặc điểm

| Nhóm người dùng | Quyền hệ thống | Mục tiêu chính | Tần suất | Kỹ năng CNTT |
|---|---|---|---|---|
| Khách vãng lai | (chưa đăng nhập) | Xem sự kiện đã công bố | Thỉnh thoảng | Cơ bản |
| Người tham dự | ATTENDEE | Đăng ký, giữ vé, check-in, đánh giá | Theo sự kiện | Cơ bản, chủ yếu dùng điện thoại |
| Chủ sự kiện | ORGANIZER + OWNER | Toàn quyền sự kiện, mời ban tổ chức, huỷ sự kiện | Hằng ngày trước sự kiện | Khá |
| Đồng tổ chức | ORGANIZER + CO_ORGANIZER | Nội dung, nguồn lực, ngân sách, AI, dashboard | Hằng ngày trước sự kiện | Khá |
| Nhân viên check-in | ORGANIZER + CHECKIN_STAFF | Quét vé ở cổng | Trong ngày sự kiện | Cơ bản, thao tác nhanh |
| Quản trị viên | ADMIN | Quản lý tài khoản, đổi quyền, hỗ trợ mọi sự kiện | Khi cần | Tốt |

Chi tiết nhu cầu và mức ảnh hưởng của từng nhóm: [stakeholder-analysis.md](03-analysis-and-design/stakeholder-analysis.md).

## 3. Yêu cầu chức năng

Độ ưu tiên theo MoSCoW (M = bắt buộc cho demo, S = nên có, C = có thì tốt). Mã FR-01…FR-14 giữ nguyên từ bản phạm vi đầu tiên; FR-15…FR-17 bổ sung khi phân tích chi tiết. Danh mục này đồng bộ với `apps/api/src/integrations/ai/requirements-baseline.ts`.

### FR-01. Tài khoản, đăng nhập và phân quyền hệ thống — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-01.1 | Khách tự đăng ký tài khoản bằng email, họ tên, mật khẩu | Email đúng định dạng, chưa tồn tại (trùng → 409); mật khẩu 8–72 ký tự; tài khoản mới luôn là ATTENDEE |
| FR-01.2 | Đăng nhập bằng email/mật khẩu | Đúng → trả JWT (mặc định hết hạn 8 giờ); sai → 401, không tiết lộ email có tồn tại hay không |
| FR-01.3 | Xem/sửa hồ sơ, đổi mật khẩu | Đổi mật khẩu phải nhập đúng mật khẩu hiện tại |
| FR-01.4 | ADMIN xem danh sách tài khoản và đổi quyền ADMIN/ORGANIZER/ATTENDEE | Người không phải ADMIN gọi → 403 |
| FR-01.5 | Mọi API yêu cầu đăng nhập trừ API được đánh dấu công khai | Thiếu/sai token → 401 |

### FR-02. Quản lý sự kiện — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-02.1 | ORGANIZER tạo sự kiện: tên, mô tả, địa điểm, thời gian bắt đầu/kết thúc, sức chứa | Thiếu tên/thời gian → 400; kết thúc ≤ bắt đầu → 400; sức chứa phải nguyên dương; sự kiện mới ở trạng thái DRAFT; người tạo thành OWNER |
| FR-02.2 | OWNER/CO_ORGANIZER sửa thông tin sự kiện | Không sửa được sự kiện CANCELLED/COMPLETED (409); sức chứa mới ≥ số đăng ký CONFIRMED |
| FR-02.3 | Chuyển trạng thái theo vòng đời DRAFT → PUBLISHED → COMPLETED, huỷ CANCELLED | Chỉ công bố khi chưa qua giờ kết thúc; về nháp chỉ khi chưa có đăng ký; kết thúc chỉ sau giờ kết thúc; **chỉ OWNER được huỷ** |
| FR-02.4 | Danh sách/chi tiết sự kiện công khai | Khách và ATTENDEE không thấy bản nháp; ORGANIZER chỉ thấy sự kiện mình là thành viên (kèm vai trò); ADMIN thấy tất cả |

### FR-03. Lịch trình, phiên và diễn giả — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-03.1 | Thêm/sửa/xoá phiên: tiêu đề, thời gian, phòng, mô tả, diễn giả | Phiên phải nằm trong thời gian sự kiện; kết thúc > bắt đầu |
| FR-03.2 | Quản lý diễn giả của sự kiện; gán nhiều diễn giả cho nhiều phiên | Diễn giả phải cùng sự kiện với phiên; email diễn giả không trả ra API công khai |

### FR-04. Đăng ký tham dự và kiểm soát sức chứa — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-04.1 | Người tham dự tự đăng ký sự kiện | Chỉ sự kiện PUBLISHED và chưa bắt đầu; mỗi người một đăng ký/sự kiện (trùng → 409); hết sức chứa → 409; hai người đăng ký chỗ cuối cùng cùng lúc chỉ một người thành công |
| FR-04.2 | Ban tổ chức (OWNER/CO_ORGANIZER) đăng ký hộ người khác | Người không có vai trò quản lý sự kiện chỉ đăng ký được cho chính mình |
| FR-04.3 | Huỷ đăng ký | Chỉ chủ đăng ký hoặc ban tổ chức; không huỷ được khi vé đã check-in; huỷ xong giải phóng một chỗ và vé không còn trả mã QR |
| FR-04.4 | Xem danh sách đăng ký của mình ("Vé của tôi") | Chỉ thấy đăng ký của chính mình; người khác dò đăng ký → 404 |

### FR-05. Vé QR — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-05.1 | Mỗi đăng ký CONFIRMED có đúng một vé với mã QR duy nhất | Mã dạng `SE1.<ticketId>.<chữ ký HMAC-SHA256>`; sửa bất kỳ ký tự nào → không hợp lệ |
| FR-05.2 | Tra cứu vé theo mã QR | Mã không tồn tại → 404; vé của đăng ký đã huỷ không hợp lệ |
| FR-05.3 | Gắn UID thẻ NFC cho vé (tuỳ chọn) | UID duy nhất toàn hệ thống — **Một phần**: có trường dữ liệu, chưa có màn hình gán thẻ |

### FR-06. Check-in — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-06.1 | Nhân viên check-in quét QR bằng camera, hoặc nhập mã thủ công, hoặc đọc NFC | Chỉ thành viên ban tổ chức của sự kiện (mọi vai trò) |
| FR-06.2 | Hệ thống trả một trong 6 kết quả: ACCEPTED, DUPLICATE, INVALID_CODE, WRONG_EVENT, NOT_ELIGIBLE, OUT_OF_HOURS, kèm thông báo tiếng Việt và tên người tham dự (trừ mã sai) | API luôn trả 200 kèm `result`; giao diện hiển thị xanh/cam/đỏ và rung |
| FR-06.3 | Mỗi vé chỉ ACCEPTED **một lần** | Hai máy quét cùng vé cùng lúc: đúng một ACCEPTED, máy còn lại DUPLICATE (cập nhật có điều kiện) |
| FR-06.4 | Chỉ check-in trong khung giờ | Mở trước giờ bắt đầu 120 phút (cấu hình `CHECKIN_OPEN_BEFORE_MINUTES`) đến khi sự kiện kết thúc |
| FR-06.5 | Ghi **mọi** lượt quét (kể cả bị từ chối) với thời điểm, máy quét, người vận hành | Là nguồn dữ liệu cho dashboard và FR-13 |
| FR-06.6 | Xem số liệu check-in tổng hợp theo N phút gần nhất | Tổng lượt, hợp lệ, quét lặp, mã sai, không đủ điều kiện |

### FR-07. Dashboard sự kiện — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-07.1 | KPI: số đã đăng ký và tỷ lệ lấp đầy, số đã check-in và tỷ lệ check-in, lượt quét bị từ chối, thực chi so với dự toán | Số liệu khớp dữ liệu trong DB |
| FR-07.2 | Biểu đồ đăng ký theo ngày, check-in theo khung giờ (15 phút/1 giờ/1 ngày tuỳ độ dài), kết quả quét, mật độ khu vực, dự toán – thực chi theo nhóm | Chỉ OWNER/CO_ORGANIZER; có bảng dữ liệu thay thế cho biểu đồ |

### FR-08. Đánh giá sự kiện — S — **Chưa làm**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-08.1 | Người đã check-in gửi điểm 1–5 và nhận xét sau khi sự kiện bắt đầu | Mỗi người một đánh giá/sự kiện (DB đã ràng buộc); điểm ngoài 1–5 → 400 |
| FR-08.2 | Ban tổ chức xem danh sách đánh giá | Ẩn danh khi xuất cho AI (FR-14) |

> Bảng `EventFeedback` đã có nhưng chưa có API/giao diện gửi đánh giá. Đây là điểm nghẽn của FR-14.

### FR-09. Nguồn lực và tài chính — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-09.1 | Danh bạ nhân sự dùng chung; phân công nhân sự vào sự kiện theo vai trò, ca, trạng thái | Một người không bị phân trùng cùng vai trò trong cùng sự kiện |
| FR-09.2 | Danh bạ nhà cung cấp (loại dịch vụ, liên hệ, mã số thuế duy nhất) | |
| FR-09.3 | Nhà tài trợ theo sự kiện: hạng, giá trị tài trợ | |
| FR-09.4 | Dự toán: khoản mục, số lượng × đơn giá = thành tiền, nguồn MANUAL/AI_SUGGESTED, người duyệt | Thành tiền tính ở server. Dòng AI_SUGGESTED phải có người duyệt mới tính là chính thức — **Chưa làm**: DB đã có `approvedById/approvedAt` nhưng API và giao diện chưa ghi/kiểm tra người duyệt |
| FR-09.5 | Thực chi: gắn với dòng dự toán hoặc chi phát sinh; so sánh dự toán – thực chi | Không gắn được khoản chi vào dự toán của sự kiện khác |

### FR-10 … FR-14. Tính năng AI — S

Chi tiết đầu vào/đầu ra: [ai-requirements.md](03-analysis-and-design/ai-requirements.md). Mọi kết quả AI có `requiresHumanReview: true` (NFR-AI-01).

| Mã | Chủ sở hữu | Mô tả | Trạng thái |
|---|---|---|---|
| FR-10 | TV1 | Tóm tắt tiến độ, việc tồn, rủi ro, hành động tiếp theo từ dữ liệu PM nhập | Đã có API |
| FR-11 | TV2 | Chuyển mô tả nghiệp vụ thành bản nháp FR/NFR/use case; che dữ liệu cá nhân, phát hiện trùng SRS, chấm chất lượng, câu hỏi làm rõ; BA duyệt trước khi đưa vào SRS | Đã có API + unit test; chưa có giao diện (dùng Swagger) |
| FR-12 | TV3 | Gợi ý dự toán sơ bộ; server tính lại tổng từ số lượng × đơn giá | Đã có API |
| FR-13 | TV4 | Phân tích log quét theo vé trong khoảng thời gian; đối chiếu 4 luật R1–R4 để đánh dấu vé cần rà soát; không tự chặn vé | Đã có API + giao diện |
| FR-14 | TV5 | Tổng hợp chủ đề phản hồi đã ẩn danh và gợi ý cải thiện | Đã có API + giao diện; **chưa có dữ liệu thật** do FR-08 chưa làm |

### FR-15. Ban tổ chức theo sự kiện — M — **Đã có**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-15.1 | OWNER thêm thành viên theo email với vai trò CO_ORGANIZER hoặc CHECKIN_STAFF | Tài khoản được thêm phải có quyền ORGANIZER; chỉ ADMIN gán vai trò OWNER |
| FR-15.2 | Đổi vai trò, gỡ thành viên | Sự kiện luôn còn ít nhất một OWNER |
| FR-15.3 | Mọi API theo sự kiện kiểm tra vai trò trong sự kiện | Ma trận: check-in → cả 3 vai trò; nội dung/nguồn lực/ngân sách/AI/dashboard/audit → OWNER, CO_ORGANIZER; quản lý thành viên → OWNER; sai vai trò → 403 |

### FR-16. Nhật ký thao tác — S — **Một phần**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-16.1 | Ghi người thực hiện, hành động, đối tượng, chi tiết cho thao tác quản trị | Đang ghi: sự kiện, lịch trình, đăng ký/huỷ, thành viên. Chưa ghi: nguồn lực, dự toán – thực chi |
| FR-16.2 | OWNER/CO_ORGANIZER tra cứu nhật ký theo sự kiện, khoảng thời gian, phân trang | |

### FR-17. Thiết bị và cảm biến IoT — C — **Một phần**

| Mã | Mô tả | Tiêu chí chấp nhận |
|---|---|---|
| FR-17.1 | Đăng ký thiết bị (máy quét QR, đầu đọc NFC, cảm biến, gateway) theo sự kiện, mã thiết bị duy nhất | Có bảng dữ liệu và seed; **chưa có API quản lý** |
| FR-17.2 | Ghi số đo cảm biến theo khu vực (nhiệt độ, CO2, tiếng ồn, số người) | Dữ liệu giả lập; dashboard đã hiển thị mật độ khu vực |

## 4. Quy tắc nghiệp vụ

| Mã | Quy tắc | Áp dụng tại |
|---|---|---|
| BR-01 | Một người – một đăng ký – một vé cho mỗi sự kiện | FR-04, FR-05 |
| BR-02 | Số đăng ký CONFIRMED không vượt sức chứa (nếu có) | FR-04, FR-02.2 |
| BR-03 | Chỉ đăng ký được sự kiện PUBLISHED chưa bắt đầu | FR-04 |
| BR-04 | Không huỷ đăng ký đã check-in | FR-04.3 |
| BR-05 | Một vé chỉ ACCEPTED một lần; lượt sau là DUPLICATE | FR-06.3 |
| BR-06 | Check-in mở trước giờ bắt đầu 120 phút, đóng khi sự kiện kết thúc | FR-06.4 |
| BR-07 | Phiên lịch trình phải nằm trong thời gian sự kiện | FR-03 |
| BR-08 | Sự kiện luôn có ít nhất một Chủ sự kiện; chỉ Chủ sự kiện được huỷ | FR-15, FR-02.3 |
| BR-09 | Thành tiền dự toán = số lượng × đơn giá, do server tính | FR-09.4, FR-12 |
| BR-10 | Kết quả AI là bản nháp; không tự động quyết định chi tiêu, từ chối người tham dự hay kết luận gian lận | FR-10…FR-14 |

## 5. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|
| NFR-SEC-01 | Bảo mật | Mật khẩu băm bcrypt; không lưu/trả mật khẩu gốc | Đọc DB và response | Đã có |
| NFR-SEC-02 | Bảo mật | `JWT_SECRET` ≥ 32 ký tự, thiếu thì API không khởi động; token hết hạn sau 8 giờ (cấu hình được) | Khởi động thiếu biến môi trường | Đã có |
| NFR-SEC-03 | Bảo mật | Mã QR ký HMAC bằng `TICKET_QR_SECRET`; sửa mã → INVALID_CODE | Unit test tickets | Đã có |
| NFR-SEC-04 | Bảo mật | Mọi API theo sự kiện kiểm tra vai trò trong sự kiện; người ngoài dò đăng ký → 404 | Test 403/404 | Đã có |
| NFR-SEC-05 | Bảo mật | Endpoint AI chỉ cho ORGANIZER/ADMIN để tránh người ngoài làm tốn phí | Gọi không token → 401 | **Một phần**: `POST /ai/check-in-analysis` đang tạm `@Public()` để test Swagger, phải gỡ trước demo |
| NFR-PRI-01 | Riêng tư | Không gửi dữ liệu định danh cho nhà cung cấp AI: phản hồi gửi AI chỉ có điểm + nhận xét; bản nháp yêu cầu che email/SĐT/số giấy tờ | Unit test FR-11 | Đã có |
| NFR-PRI-02 | Riêng tư | Email diễn giả chỉ ban tổ chức thấy | Gọi API công khai | Đã có |
| NFR-REL-01 | Tin cậy | Đăng ký chỗ cuối và check-in cùng vé đồng thời không tạo dữ liệu sai (transaction / cập nhật có điều kiện) | Test đồng thời | Đã có |
| NFR-REL-02 | Tin cậy | Lỗi/timeout nhà cung cấp AI trả 502/503 có thông báo, không làm sập API | Ngắt mạng khi gọi AI | Đã có |
| NFR-PER-01 | Hiệu năng | API check-in phản hồi ≤ 1 giây (p95) với 4 máy quét đồng thời trên môi trường demo | Đo bằng Postman/k6 | Chưa đo |
| NFR-PER-02 | Hiệu năng | Dashboard trả số liệu một sự kiện 1.000 đăng ký ≤ 2 giây | Seed dữ liệu lớn | Chưa đo |
| NFR-USA-01 | Khả dụng | Giao diện tiếng Việt, dùng được trên màn hình 360 px trở lên; thao tác bằng bàn phím có focus nhìn thấy | Kiểm thử thủ công | Đã có |
| NFR-USA-02 | Khả dụng | Kết quả check-in nhận biết được trong ≤ 1 giây bằng màu + biểu tượng + chữ (không chỉ dựa vào màu) | Quan sát | Đã có |
| NFR-AI-01 | AI | Mọi kết quả AI có nhãn `requiresHumanReview: true` và ghi rõ model tạo ra | Kiểm tra response | Đã có |
| NFR-AI-02 | AI | Thiếu `AI_API_KEY` → 503 rõ ràng; API key không commit vào repo | Kiểm tra `.env.example` | Đã có |
| NFR-AI-03 | AI | Giới hạn kích thước đầu vào AI (độ dài chuỗi, số phần tử, khoảng thời gian ≤ 30 ngày) để kiểm soát chi phí | Gửi đầu vào quá giới hạn → 400 | Đã có |
| NFR-MNT-01 | Bảo trì | Schema thay đổi qua migration Prisma; tài liệu API trên Swagger tại `/docs` | Chạy migration mới | Đã có |
| NFR-MNT-02 | Bảo trì | Unit test cho quy tắc nghiệp vụ chính chạy bằng `npm run test --workspace apps/api` | Chạy lệnh | **Một phần**: 4 test check-in/đăng ký cũ đang lỗi do mock chưa cập nhật |
| NFR-DEP-01 | Triển khai | Dựng MySQL cục bộ bằng Docker Compose; một lệnh chạy cả API và web | Làm theo README | Đã có |

## 6. Ràng buộc và giả định

**Ràng buộc:** Next.js 14 + NestJS 10 + MySQL 8.4 + Prisma 6 (đã chốt trong `plan.md`); không phát sinh chi phí ngoài API AI; thời gian thực hiện trong một học kỳ, 5 thành viên học từ xa, làm việc chủ yếu online.

**Giả định cần xác nhận với giảng viên/nhóm:**

1. Sự kiện miễn phí, không cần thanh toán.
2. Người tham dự có điện thoại hiển thị được mã QR; cổng có mạng Internet ổn định (chưa hỗ trợ offline).
3. Dữ liệu thiết bị/cảm biến IoT được giả lập là đủ cho demo.
4. Một sự kiện tối đa khoảng 1.000 người tham dự và 4 cổng check-in.
5. Chấp nhận dùng nhà cung cấp AI bên ngoài với dữ liệu đã ẩn danh.

## 7. Ma trận truy vết

| Yêu cầu | Use case | API chính | Màn hình | Test case |
|---|---|---|---|---|
| FR-01 | UC-01, UC-02, UC-18 | `/auth/*` | `/login`, `/register`, `/account`, `/admin/users` | AUTH-001…003 |
| FR-02 | UC-04, UC-05 | `POST/PATCH /events`, `PATCH /events/:id/status` | `/events`, `/events/new`, `/events/[id]/edit` | EVT-001…003 |
| FR-03 | UC-06 | `/events/:eventId/schedules`, `/speakers` | `/events/[id]/schedule` | SCH-001…002 |
| FR-04 | UC-08, UC-09 | `/events/:eventId/registrations`, `/me/registrations` | `/events/[id]`, `/my-tickets` | REG-001…005 |
| FR-05 | UC-08, UC-10 | `GET /tickets/:qrCode` | `/my-tickets` | TKT-001…003 |
| FR-06 | UC-10 | `POST /check-in`, `GET /check-in/events/:eventId/stats` | `/check-in` | CIN-001…005 |
| FR-07 | UC-11 | `GET /events/:eventId/dashboard` | `/dashboard` | DASH-001…002 |
| FR-08 | UC-12 | (chưa có) | (chưa có) | FDB-001…002 |
| FR-09 | UC-13, UC-14 | `/resources/*` | `/resources` | (chưa có) |
| FR-10 | UC-15 | `POST /ai/project-summary` | Swagger | (chưa có) |
| FR-11 | UC-16 | `POST /ai/requirements-draft` | Swagger | `apps/api/test/requirements-draft.spec.ts` |
| FR-12 | UC-14 | `POST /ai/budget-estimate` | Swagger | (chưa có) |
| FR-13 | UC-17 | `POST /ai/check-in-analysis` | `/check-in` (FraudCheckPanel) | ACI-001…005 |
| FR-14 | UC-12 | `POST /ai/events/:eventId/feedback-insights` | `/events/[id]/ai-insights` | (chưa có) |
| FR-15 | UC-07 | `/events/:eventId/members`, `/me/event-memberships` | `/events/[id]/members` | (chưa có) |
| FR-16 | UC-19 | `GET /audit-logs` | (chưa có) | `audit-log.service.spec.ts` |
| FR-17 | UC-11 | (chưa có) | `/dashboard` (mật độ) | (chưa có) |

Tester (TV5) cập nhật cột trạng thái chạy test trong `tests/requirements-traceability.md`; BA cập nhật bảng này khi thêm/sửa yêu cầu.

## 8. Quản lý thay đổi yêu cầu

1. Ai cũng có thể đề xuất thay đổi; BA ghi vào `docs/04-project-management/change-log.md` với lý do và yêu cầu bị ảnh hưởng.
2. BA phân tích tác động (use case, API, ERD, test case) và PM quyết định nhận/hoãn.
3. Khi nhận: BA cập nhật SRS, ma trận truy vết và `requirements-baseline.ts`; thành viên phụ trách cập nhật code/test.
4. Yêu cầu do AI đề xuất (FR-11) chỉ vào SRS sau khi BA xử lý hết phát hiện mức error và xác nhận giả định với bên liên quan.
