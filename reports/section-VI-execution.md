# VI. Triển khai và thực thi dự án

Tổng hợp khảo sát, phân tích, thiết kế, lập trình, kiểm thử và triển khai.

## Hạng mục AI

- TV1: tóm tắt tiến độ và rủi ro từ dữ liệu PM nhập.
- TV2: tạo bản nháp yêu cầu/use case và rà soát đầu ra.
- TV3: AI hỗ trợ dự toán ngân sách sự kiện.
- TV4: AI phân tích số liệu check-in tổng hợp.
- TV5: giao diện AI tổng hợp phản hồi và chuẩn bị kiểm thử/demo.

Mỗi thành viên ghi tiến độ, kết quả thực tế và minh chứng riêng cho hạng mục mình phụ trách.

## Tiểu mục TV4 – Backend 2

- **Database:** MySQL qua Prisma. `CheckInAttempt` lưu sự kiện, vé nếu xác định được, `deviceId`, trạng thái `ACCEPTED`/`ALREADY_USED`/`INVALID` và thời điểm; migration đưa `legacy-unknown` vào log cũ.
- **Đăng ký và vé:** `POST/GET/DELETE /api/events/:eventId/registrations` xử lý đăng ký/xem/hủy; đăng ký hợp lệ phát hành QR payload ngẫu nhiên. `GET /api/tickets/:qrCode` tra cứu vé.
- **Check-in:** `POST /api/events/:eventId/check-in` nhận QR và `deviceId`; transaction cập nhật một lần check-in thành công và lưu mọi attempt. `GET /api/events/:eventId/check-ins/summary` tổng hợp theo thời gian.
- **Audit:** thao tác đăng ký, hủy và check-in được ghi trong transaction; `GET /api/audit-logs` lọc theo event/thời gian.
- **AI check-in:** `POST /api/ai/check-in-analysis` nhận `eventId`, `from`, `to`; backend lấy thống kê/log, gửi prompt và dữ liệu JSON để LLM tự đánh giá theo bốn rule, sau đó đối chiếu verdict/confidence/evidence với log. Kết quả cần người tổ chức rà soát; không tự chặn check-in. LLM được chờ tối đa 10 giây; khi timeout hoặc provider trả HTTP 503, API trả response JSON demo hardcode, không phản ánh dữ liệu của request hiện tại. Các endpoint AI khác chờ tối đa 5 phút.
- **Chạy demo:** `npm run dev` khởi động Next.js và NestJS đồng thời; tiến trình API tự bật MySQL, migration và seed. Seed có tám mẫu dương tính (hai cho mỗi rule) và ba mẫu đối chứng; cần dùng khoảng `from`/`to` seed in ra.
- **Trạng thái minh chứng:** mã và unit test đã được bổ sung; test/runtime chưa được xác nhận chạy. TV4 cập nhật kết quả sau khi thực thi.

## Tiểu mục TV2 – Khảo sát, phân tích và thiết kế

### 1. Khảo sát và thu thập thông tin

Kế hoạch khảo sát, phiếu hỏi người tham dự, kịch bản phỏng vấn người tổ chức, khảo sát tài liệu ba nền tảng tương tự và bảng nhu cầu N-01…N-12: `docs/03-analysis-and-design/stakeholder-analysis.md`. So sánh quy trình hiện tại (AS-IS) và quy trình mới (TO-BE) cho bảy bước từ lập kế hoạch đến tổng kết: `docs/03-analysis-and-design/business-processes.md` mục 1.

### 2. Phân tích

- **Đặc tả yêu cầu (SRS)** – `docs/02-scope-and-requirements.md`: 17 nhóm yêu cầu chức năng (FR-01…FR-17) tách thành yêu cầu con có tiêu chí chấp nhận đo được, 10 quy tắc nghiệp vụ (BR-01…BR-10), 19 yêu cầu phi chức năng theo nhóm bảo mật, riêng tư, tin cậy, hiệu năng, khả dụng, AI, bảo trì, triển khai. Mỗi yêu cầu có trạng thái được đối chiếu trực tiếp với mã nguồn (Đã có / Một phần / Chưa làm).
- **Mô hình use case** – `use-cases.md`: 10 tác nhân, sơ đồ use case tổng quát, 19 use case; đặc tả đầy đủ (tiền/hậu điều kiện, luồng chính, luồng ngoại lệ) cho 6 use case quan trọng: tạo sự kiện, đăng ký nhận vé, check-in, dự toán – thực chi, AI bản nháp yêu cầu, AI phân tích check-in.
- **Quy trình nghiệp vụ** – `business-processes.md`: 7 sơ đồ hoạt động có làn theo tác nhân (BP-01…BP-07).
- **Ma trận truy vết** yêu cầu → use case → API → màn hình → test case: SRS mục 7.

### 3. Thiết kế

- **Cơ sở dữ liệu** – `erd.md`: ERD tổng quan và ERD chi tiết 18 bảng (cộng một bảng nối nhiều–nhiều) sinh từ `prisma/schema.prisma`, bảng quan hệ – bản số – quy tắc xoá, 10 kiểu liệt kê, sơ đồ trạng thái vòng đời sự kiện, chỉ mục phục vụ truy vấn chính.
- **Hợp đồng API** – `api-contract.md`: hợp nhất hai phiên bản mâu thuẫn trước đó thành một danh mục theo nhóm chức năng, ghi rõ quyền hệ thống và vai trò trong sự kiện của từng endpoint; liệt kê 4 điểm lệch giữa tài liệu, test case và code để các thành viên xử lý.
- **Giao diện** – `ui-design.md`: 19 màn hình ánh xạ đường dẫn, quyền và use case; sơ đồ điều hướng theo vai trò; wireframe màn Check-in, Chi tiết sự kiện, Dashboard.

### 4. Tính năng AI của TV2: bản nháp yêu cầu (FR-11)

`POST /api/ai/requirements-draft` nhận mô tả nghiệp vụ và trả bản nháp yêu cầu để BA rà soát. Ngoài việc gọi AI, phần backend do TV2 viết thực hiện:

1. **Che dữ liệu cá nhân** (email, số điện thoại Việt Nam, CMND/CCCD) trước khi gửi nhà cung cấp AI – xử lý rủi ro R-06.
2. **Gửi kèm danh mục yêu cầu đã chốt** (FR-01…FR-17) để AI liên kết, không viết lại yêu cầu cũ.
3. **Hậu kiểm tự động**: cấp mã nháp, phát hiện thiếu tiêu chí chấp nhận, từ ngữ mơ hồ, trùng yêu cầu đã chốt, yêu cầu AI không có bước người duyệt, NFR không đo được, use case tham chiếu sai; dựng ma trận truy vết; chấm điểm chất lượng và kết luận "sẵn sàng rà soát" hoặc "cần làm lại".
4. Trả checklist rà soát và đoạn Markdown để BA đưa vào tài liệu sau khi duyệt.

Mã nguồn: `apps/api/src/integrations/ai/requirements-draft.*.ts`, `requirements-baseline.ts`, `prompts/requirements-draft.prompt.ts`. Đầu ra mẫu và quyết định rà soát: `docs/03-analysis-and-design/ai-requirements-draft-sample.md`.

**Minh chứng kiểm thử:** `apps/api/test/requirements-draft.spec.ts` gồm 12 unit test (mock nhà cung cấp AI) – đạt 12/12 khi chạy ngày 25/11/2026 bằng `npx jest --config ./jest.config.cjs test/requirements-draft.spec.ts`. Chưa chạy với API key thật.
