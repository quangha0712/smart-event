# Sổ đăng ký rủi ro

> Người phụ trách: TV2 – BA (nhận diện, phân tích, đề xuất ứng phó); TV1 – PM theo dõi hằng tuần và quyết định khi rủi ro xảy ra. Cập nhật lần cuối: 25/11/2026 theo hiện trạng nhánh `dev`.

## 1. Phương pháp

- **Nhận diện:** rà soát yêu cầu (SRS), mã nguồn và lịch sử commit, kinh nghiệm dự án phần mềm phổ biến, buổi họp nhóm.
- **Phân nhóm** theo mẫu báo cáo: (A) rủi ro truyền thống của dự án phần mềm, (B) rủi ro riêng của dự án này, (C) rủi ro bất khả kháng.
- **Đánh giá:** Xác suất (P) và Ảnh hưởng (I) thang 1–5; **Điểm = P × I**. Mức: 1–4 Thấp · 5–9 Trung bình · 10–14 Cao · 15–25 Rất cao.

| Thang | P – Xác suất | I – Ảnh hưởng |
|---|---|---|
| 1 | < 10% | Không đáng kể, sửa trong vài giờ |
| 2 | 10–30% | Chậm 1–2 ngày một hạng mục nhỏ |
| 3 | 30–50% | Chậm một hạng mục chính hoặc phải cắt tính năng phụ |
| 4 | 50–70% | Ảnh hưởng demo/luồng chính hoặc điểm báo cáo |
| 5 | > 70% | Không nộp/không demo được sản phẩm |

- **Chiến lược ứng phó:** Tránh · Giảm thiểu · Chuyển giao · Chấp nhận.
- **Trạng thái:** Mở · Đang xử lý · Đã kiểm soát (biện pháp đã có hiệu lực, vẫn theo dõi) · Đóng.

## 2. Sổ rủi ro

### A. Rủi ro truyền thống của dự án phần mềm

| ID | Rủi ro (nguyên nhân → hậu quả) | Dấu hiệu nhận biết | P | I | Điểm | Chiến lược & biện pháp phòng ngừa | Kế hoạch dự phòng khi xảy ra | Chủ sở hữu | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
| R-01 | FE/BE hiểu khác hợp đồng API → tích hợp trễ, lỗi khi demo | Test case/FE dùng tên trường khác API (đã thấy: test check-in dùng `qrCode/deviceId`, API nhận `code/deviceCode`) | 4 | 3 | 12 Cao | Giảm thiểu: một API contract duy nhất (đã hợp nhất), Swagger là nguồn DTO, đổi API phải sửa contract cùng PR | Họp tích hợp 30 phút, sửa theo contract, ưu tiên luồng demo | TV2, TV3, TV4 | Đang xử lý |
| R-02 | Migration lỗi hoặc mất dữ liệu demo → không chạy được buổi demo | Migration báo lỗi trên máy thành viên; seed không chạy | 2 | 4 | 8 TB | Giảm thiểu: migration qua Prisma, seed tạo lại toàn bộ dữ liệu demo, chạy thử trên máy sạch trước demo | Xoá DB, chạy lại migrate + seed (≤ 10 phút) | TV4 | Đã kiểm soát |
| R-04 | Phạm vi phình to (đề tài gồm AI, QR/NFC, IoT, ngân sách…) so với một học kỳ → không kịp hoàn thiện | Nhiều module chỉ có README; yêu cầu mới phát sinh giữa kỳ | 4 | 4 | 16 Rất cao | Tránh/giảm: chốt phạm vi trong SRS mục 1.3 (ngoài phạm vi: thanh toán, offline, IoT thật); MoSCoW; thay đổi qua change-log | Cắt các mục C/S chưa làm (FR-08, FR-17.1) và ghi vào hạn chế Phần X | TV1, TV2 | Đang xử lý |
| R-07 | Yêu cầu mơ hồ hoặc hiểu sai nghiệp vụ → làm sai, phải làm lại | Tiêu chí chấp nhận thiếu; tranh luận khi review | 3 | 3 | 9 TB | Giảm thiểu: SRS có tiêu chí chấp nhận đo được, use case có luồng ngoại lệ, AI bản nháp có kiểm tra từ mơ hồ/thiếu tiêu chí | BA làm rõ trong 24 giờ, cập nhật SRS và truy vết | TV2 | Đã kiểm soát |
| R-08 | Thành viên tham gia không đều (học từ xa, đi làm) → dồn việc, mất điểm theo quy định môn | Không cập nhật work-log, vắng họp 2 buổi liên tiếp | 3 | 4 | 12 Cao | Giảm thiểu: phân công theo file trong `plan.md`, mỗi người có phần báo cáo riêng, biên bản họp ghi người vắng | PM phân lại việc, ghi nhận minh chứng để đánh giá thành viên | TV1 | Mở |
| R-09 | Thiếu kiểm thử hoặc test hỏng không ai sửa → lỗi lọt vào demo | Hiện 4/22 unit test cũ (check-in, đăng ký) lỗi do mock chưa cập nhật theo code | 4 | 3 | 12 Cao | Giảm thiểu: chạy `npm run test --workspace apps/api` trước khi merge; test mới cho phần AI BA | Người sở hữu module sửa test trong sprint hiện tại | TV4, TV5 | Đang xử lý |
| R-10 | Nhiều nhánh song song, merge xung đột → mất code hoặc hỏng build | Commit "fix conflicts", PR lớn nhiều file | 3 | 3 | 9 TB | Giảm thiểu: nhánh theo người/tính năng, PR nhỏ, merge vào `dev` thường xuyên, `main` chỉ nhận bản ổn định | Revert PR lỗi, merge lại có review | TV1 | Mở |

### B. Rủi ro riêng của dự án

| ID | Rủi ro (nguyên nhân → hậu quả) | Dấu hiệu nhận biết | P | I | Điểm | Chiến lược & biện pháp phòng ngừa | Kế hoạch dự phòng khi xảy ra | Chủ sở hữu | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
| R-03 | Hai máy quét cùng một vé cùng lúc → một vé vào hai người | Hai lượt ACCEPTED cùng vé trong log | 2 | 4 | 8 TB | Giảm thiểu: cập nhật có điều kiện `checkedInAt IS NULL`; AI luật R4 phát hiện nếu vẫn xảy ra | Đối chiếu log CheckInAttempt, xác minh tại cổng | TV4 | Đã kiểm soát |
| R-05 | AI trả số liệu/nhận định sai, hoặc chi phí API vượt dự kiến | Tổng dự toán vô lý; hoá đơn API tăng | 3 | 3 | 9 TB | Giảm thiểu: `requiresHumanReview`, server tính lại tổng dự toán, giới hạn kích thước đầu vào, chỉ ORGANIZER gọi được, dùng model rẻ | Tắt tính năng AI (bỏ `AI_API_KEY`), demo bằng kết quả đã lưu có ghi rõ nguồn | TV3 | Đã kiểm soát |
| R-06 | Dữ liệu cá nhân bị gửi tới nhà cung cấp AI | Prompt/log chứa email, SĐT, tên người tham dự | 2 | 4 | 8 TB | Giảm thiểu: feedback gửi AI chỉ có điểm + nhận xét; FR-11 tự che email/SĐT/CMND-CCCD (có unit test); hướng dẫn BA không nhập họ tên, địa chỉ | Thu hồi/đổi API key, xoá dữ liệu phía nhà cung cấp theo chính sách của họ, báo PM | TV2, TV5 | Đã kiểm soát |
| R-11 | `POST /ai/check-in-analysis` đang `@Public()` để test → người ngoài gọi được, tốn phí AI và xem được log check-in | Swagger gọi được không cần token | 3 | 4 | 12 Cao | Tránh: gỡ `@Public()`, bật `@EventRoles(MANAGERS)` trước demo; thêm vào checklist release | Xoay vòng API key, kiểm tra hoá đơn | TV4 | Mở |
| R-12 | FR-08 gửi đánh giá chưa có → AI tổng hợp phản hồi (FR-14) không có dữ liệu thật để demo | Màn AI insights báo "chưa có đánh giá" | 4 | 3 | 12 Cao | Giảm thiểu: làm API + form gửi đánh giá tối giản; tạm thời seed đánh giá mẫu có ghi rõ là dữ liệu mẫu | Demo bằng dữ liệu seed và ghi hạn chế ở Phần X | TV1 phân công | Mở |
| R-13 | Lộ hoặc đổi `JWT_SECRET` / `TICKET_QR_SECRET` → giả mạo token, hoặc mọi QR đã phát bị vô hiệu | Secret xuất hiện trong commit/chat nhóm | 2 | 5 | 10 Cao | Tránh: secret chỉ trong `.env` (đã gitignore), API dừng nếu thiếu/quá ngắn; không gửi secret qua chat | Đổi secret, phát lại vé, đăng nhập lại toàn bộ | TV3 | Đã kiểm soát |
| R-14 | AI check-in quá 10 giây trả **kết quả mẫu cố định** → ban tổ chức hiểu nhầm là kết quả thật của sự kiện đang xem | Response có `generatedBy: "timeout-fallback-static"` | 3 | 4 | 12 Cao | Giảm thiểu: giao diện hiển thị cảnh báo rõ khi `generatedBy` là fallback; cân nhắc trả 503 thay vì dữ liệu mẫu ngoài chế độ demo | Hướng dẫn trong user guide: chạy lại phân tích, không dùng kết quả fallback | TV4, TV5 | Mở |
| R-15 | AI/luật đánh dấu nhầm vé hợp lệ là đáng ngờ → làm phiền hoặc xúc phạm người tham dự | Phản ánh từ người tham dự; vé bị đánh dấu nhưng xác minh không có gì | 3 | 3 | 9 TB | Giảm thiểu: chỉ đánh dấu khi AI **và** luật cùng khớp; luôn kèm bằng chứng và giải thích khác; không tự chặn vé (BR-10) | Ban tổ chức xác minh tại chỗ, ghi nhận báo động giả để điều chỉnh ngưỡng | TV4 | Đã kiểm soát |
| R-16 | Camera điện thoại không đọc được QR (thiếu sáng, màn hình mờ) → ùn tắc cổng | Thời gian quét/lượt tăng, nhiều lượt nhập tay | 3 | 2 | 6 TB | Giảm thiểu: có nhập mã thủ công và đọc NFC; hướng dẫn tăng độ sáng màn hình | Bàn hỗ trợ tra cứu theo vé, check-in MANUAL | TV5 | Đã kiểm soát |
| R-17 | Mạng tại địa điểm yếu/mất → không check-in được (chưa hỗ trợ offline) | API timeout tại cổng | 2 | 4 | 8 TB | Chấp nhận (offline ngoài phạm vi) + giảm thiểu: chuẩn bị 4G dự phòng cho máy quét | Ghi danh sách tay, nhập bù MANUAL khi có mạng | TV1 | Mở |

### C. Rủi ro bất khả kháng

| ID | Rủi ro | P | I | Điểm | Chiến lược & biện pháp | Chủ sở hữu | Trạng thái |
|---|---|---|---|---|---|---|---|
| R-18 | Nhà cung cấp AI ngừng dịch vụ, đổi giá hoặc chặn khu vực | 1 | 3 | 3 Thấp | Chuyển giao/giảm thiểu: dùng API tương thích OpenAI nên đổi được nhà cung cấp chỉ bằng `AI_API_BASE_URL`/`AI_MODEL`; luồng chính không phụ thuộc AI | TV3 | Mở |
| R-19 | Mất điện, đứt mạng, hỏng máy tính cá nhân của thành viên sát hạn nộp | 2 | 4 | 8 TB | Giảm thiểu: code và tài liệu luôn đẩy lên GitHub; báo cáo trên thư mục dùng chung; có thể làm trên máy khác trong 1 giờ | Từng thành viên | Mở |
| R-20 | Thành viên ốm đau, việc gia đình hoặc công việc chính đột xuất | 3 | 3 | 9 TB | Giảm thiểu: mỗi module có tài liệu README và người hỗ trợ dự phòng (BA hỗ trợ tài liệu, Tester hỗ trợ FE) | TV1 | Mở |
| R-21 | Thay đổi yêu cầu/hạn nộp của môn học, thiên tai, dịch bệnh ảnh hưởng lịch học | 1 | 4 | 4 Thấp | Chấp nhận: theo dõi nhóm Zalo lớp; giữ đệm 1 tuần trước hạn nộp trong kế hoạch | TV1 | Mở |

## 3. Bản đồ nhiệt (số mã rủi ro theo ô)

| P \ I | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **5** | | | | | |
| **4** | | | R-01, R-09, R-12 | R-04 | |
| **3** | | R-16 | R-05, R-07, R-10, R-15, R-20 | R-08, R-11, R-14 | |
| **2** | | | | R-02, R-03, R-06, R-17, R-19 | R-13 |
| **1** | | | R-18 | R-21 | |

**Ưu tiên xử lý ngay (Điểm ≥ 12, trạng thái Mở/Đang xử lý):** R-04 (16), R-01, R-08, R-09, R-11, R-12, R-14 (12).

## 4. Theo dõi và kiểm soát

1. PM rà sổ rủi ro trong họp tuần; cập nhật P, I, trạng thái; ghi vào `docs/05-execution-and-monitoring/monitoring-log.md`.
2. Khi dấu hiệu nhận biết xuất hiện, chủ sở hữu báo nhóm trong 24 giờ và thực hiện kế hoạch dự phòng.
3. Rủi ro mới phát sinh: ai phát hiện cũng thêm dòng với trạng thái Mở; BA đánh giá P/I trong lần rà tiếp theo.
4. Rủi ro đóng khi biện pháp đã kiểm chứng (có test/minh chứng) và không còn dấu hiệu trong 2 tuần.
