# Project Charter — Phần mềm Quản lý Sự kiện Thông minh (Smart Event)

> Tài liệu khởi tạo dự án (Project Charter) chốt mục tiêu, phạm vi, tổ chức, mốc thời gian và tiêu chí nghiệm thu. Các chỗ ghi `«…»` cần nhóm điền thông tin thật trước khi nộp.

## 1. Thông tin chung

| Hạng mục | Nội dung |
|---|---|
| Tên dự án | Phần mềm Quản lý Sự kiện Thông minh (Smart Event) |
| Mã môn học | PTPMHDV — Phát triển phần mềm hướng đối tượng/dịch vụ |
| Lớp / Nhóm | «Lớp …» / Nhóm «…» |
| Giảng viên hướng dẫn | «…» |
| Nhóm trưởng (PM) | «TV1 — …» |
| Thời gian thực hiện | 14/09/2026 → 21/11/2026 (10 tuần) |
| Ngày lập charter | 17/11/2026 |
| Phiên bản | 1.0 |

## 2. Bối cảnh và lý do thực hiện

Việc tổ chức sự kiện (hội thảo, workshop, lễ hội, sự kiện nội bộ) hiện thường dựa vào thao tác thủ công: đăng ký qua biểu mẫu rời rạc, kiểm soát vé và check-in bằng danh sách giấy, tổng hợp phản hồi và chi phí sau sự kiện mất nhiều thời gian. Điều này dẫn tới sai sót dữ liệu, khó kiểm soát sức chứa, dễ dùng vé trùng và thiếu số liệu để ra quyết định.

Dự án xây dựng một hệ thống tập trung giúp ban tổ chức quản lý toàn bộ vòng đời sự kiện — từ tạo sự kiện, đăng ký, phát hành vé QR, check-in đến đánh giá — kèm một số tính năng AI hỗ trợ (bản nháp, ước lượng, tổng hợp) mà con người vẫn giữ quyền quyết định cuối cùng.

## 3. Mục tiêu dự án

**Mục tiêu tổng thể:** cung cấp một hệ thống quản lý sự kiện chạy được trên môi trường demo, kèm bộ tài liệu, mã nguồn, kiểm thử và báo cáo đạt yêu cầu môn học.

**Mục tiêu cụ thể (SMART):**

| # | Mục tiêu | Đo lường |
|---|---|---|
| G1 | Hoàn thiện luồng nghiệp vụ cốt lõi: tạo sự kiện → đăng ký → vé QR → check-in | Demo chạy được end-to-end, có dữ liệu seed |
| G2 | Triển khai 5 tính năng AI (tóm tắt tiến độ, nháp yêu cầu, dự toán, phân tích check-in, tổng hợp phản hồi) | 5 endpoint `/api/ai/*` gọi được và trả JSON có nhãn cần người rà soát |
| G3 | Bảo đảm chất lượng: validation API, ràng buộc dữ liệu, migration, test case có traceability | ≥ 80% test case chính Pass, có bug report |
| G4 | Bàn giao đầy đủ tài liệu PM/BA/triển khai và báo cáo 10 phần | Checklist sản phẩm bàn giao đạt 100% |
| G5 | Hoàn thành đúng hạn trong 10 tuần với 5 thành viên | Bám sát lịch Gantt, sai lệch ≤ 1 tuần |

## 4. Phạm vi

### 4.1 Trong phạm vi (In-scope)

- Quản lý tài khoản và phân quyền (ADMIN / ORGANIZER / ATTENDEE).
- Quản lý sự kiện và lịch trình (ScheduleItem).
- Đăng ký tham dự và kiểm soát sức chứa.
- Phát hành vé QR duy nhất và check-in chống dùng trùng.
- Dashboard thống kê cơ bản và đánh giá sự kiện.
- Quản lý nguồn lực/ngân sách (nhân sự, nhà cung cấp, tài trợ, ngân sách) ở mức nhóm chốt.
- 5 tính năng AI qua một provider tương thích OpenAI, cấu hình chung bằng `.env`.
- Tài liệu quản lý dự án, phân tích thiết kế, kiểm thử, triển khai và báo cáo.

### 4.2 Ngoài phạm vi (Out-of-scope)

- Thanh toán trực tuyến / cổng thanh toán thật.
- Ứng dụng di động native; tích hợp phần cứng NFC/IoT thật (chỉ để ở mức README/kế hoạch).
- Triển khai production có SLA, auth/quota/rate-limit đầy đủ cho endpoint AI (chỉ chạy local/dev).
- Gửi email/SMS thật và các kênh tích hợp bên thứ ba.

### 4.3 Giả định và ràng buộc

- **Giả định:** có sẵn Node.js 20+, Docker Desktop; có một API key AI tương thích OpenAI dùng chung cho dev.
- **Ràng buộc:** nhân lực 5 sinh viên; thời gian 10 tuần; không commit API key; kết quả AI chỉ là bản nháp/ước lượng và bắt buộc con người rà soát.

## 5. Sản phẩm bàn giao chính (Deliverables)

| Nhóm | Sản phẩm |
|---|---|
| Mã nguồn | Monorepo `apps/web` (Next.js), `apps/api` (NestJS), `prisma`, `infra` |
| Tài liệu PM | Charter, WBS, PERT, CPM, Gantt, OBS/RACI, ước lượng & ngân sách, rủi ro, chất lượng, EVM, change-log |
| Tài liệu BA | SRS, stakeholder, use case, business process, ERD, API contract, UI design |
| Kiểm thử | Test plan, test cases, traceability, bug report, evidence |
| Triển khai & hướng dẫn | Deployment plan, user guide, training, demo script |
| Nghiệm thu | Báo cáo 10 phần, slide, demo (ảnh/video) |

## 6. Tổ chức nhóm và vai trò

| Mã | Vai trò | Trách nhiệm chính |
|---|---|---|
| TV1 | Nhóm trưởng / PM | Lập kế hoạch, điều phối, tài liệu PM, AI tóm tắt tiến độ, ghép báo cáo |
| TV2 | Business Analyst | SRS, use case, ERD, API contract, rủi ro nghiệp vụ, AI nháp yêu cầu |
| TV3 | Backend 1 / Ước lượng | Auth/users/events/schedules/nguồn lực-ngân sách, AI dự toán, provider AI chung |
| TV4 | Backend 2 / Giám sát KT | Prisma/schema/migration/seed, đăng ký/vé/check-in, triển khai, AI phân tích check-in |
| TV5 | Frontend / Tester / Demo | Giao diện web, kiểm thử, hướng dẫn/đào tạo/demo, AI tổng hợp phản hồi + UI |

Ma trận RACI chi tiết: xem [team-obs-raci.md](04-project-management/team-obs-raci.md).

## 7. Mốc thời gian chính (Milestones)

| Mốc | Nội dung | Dự kiến |
|---|---|---|
| M0 | Khởi động, chốt charter & kế hoạch | Tuần 1 (14–20/09/2026) |
| M1 | SRS & thiết kế (ERD, API, UI) được duyệt | Tuần 3 (hết 04/10/2026) |
| M2 | Backend cốt lõi + schema/migration hoàn tất | Tuần 6 (hết 25/10/2026) |
| M3 | Frontend tích hợp + 5 luồng AI chạy được | Tuần 8 (hết 08/11/2026) |
| M4 | Kiểm thử, sửa lỗi, demo ổn định | Tuần 9 (hết 15/11/2026) |
| M5 | Hoàn thiện báo cáo/slide và bàn giao | Tuần 10 (21/11/2026) |

## 8. Tiêu chí thành công / nghiệm thu

- Luồng tạo sự kiện → đăng ký → vé QR → check-in chạy được trên môi trường demo với dữ liệu seed.
- 5 endpoint AI phản hồi đúng định dạng, có nhãn "nội dung do AI tạo, cần con người rà soát".
- Có kết quả kiểm thử với traceability tới yêu cầu; các lỗi nghiêm trọng đã xử lý.
- Có hướng dẫn chạy (README) tái lập được môi trường dev.
- Hoàn thành báo cáo 10 phần, slide và tư liệu demo.

## 9. Rủi ro mức cao (tóm tắt)

| Rủi ro | Ảnh hưởng | Ứng phó sơ bộ |
|---|---|---|
| Thiếu/hết hạn API key AI | Không demo được tính năng AI | Chuẩn bị key dự phòng; có dữ liệu mẫu đầu ra AI |
| Phạm vi phình to (nhiều module) | Trễ tiến độ | Ưu tiên luồng cốt lõi G1–G2, module phụ ở mức tối thiểu |
| Thành viên lệch tiến độ | Dồn việc cuối kỳ | Họp tuần, cập nhật work-log, điều phối lại RACI |
| Dữ liệu seed/migration lỗi | Chặn tích hợp & test | TV4 kiểm soát schema/migration, review trước khi merge |

Sổ rủi ro đầy đủ: [risk-register.md](04-project-management/risk-register.md).

## 10. Phê duyệt

| Vai trò | Họ tên | Ngày | Ký |
|---|---|---|---|
| Nhóm trưởng (PM) | «…» | | |
| Giảng viên hướng dẫn | «…» | | |
