# WBS — Work Breakdown Structure

> Phân rã công việc dự án Smart Event theo 7 gói công việc chính (level 1) và các công việc con (level 2). Mã WBS dùng để liên kết sang PERT, CPM, Gantt và work-log. Người phụ trách: TV1–TV5 theo [Project Charter](../01-project-charter.md) mục 6.

## 1. Sơ đồ phân rã (cây WBS)

```text
1. Smart Event
├─ 1.1 Khởi động & Lập kế hoạch
│  ├─ 1.1.1 Project charter
│  ├─ 1.1.2 Kế hoạch (WBS, PERT, CPM, Gantt, RACI)
│  ├─ 1.1.3 Dựng khung repo (monorepo, Docker, Prisma, health API)
│  └─ 1.1.4 Kế hoạch chất lượng & truyền thông
├─ 1.2 Khảo sát, SRS & Thiết kế
│  ├─ 1.2.1 Khảo sát & stakeholder
│  ├─ 1.2.2 SRS (FR/NFR) & use case
│  ├─ 1.2.3 Business process
│  ├─ 1.2.4 ERD & schema dữ liệu
│  ├─ 1.2.5 API contract
│  └─ 1.2.6 UI design
├─ 1.3 Phát triển Backend
│  ├─ 1.3.1 Auth & Users
│  ├─ 1.3.2 Events & Schedules
│  ├─ 1.3.3 Registrations, Tickets (QR), Check-in
│  ├─ 1.3.4 Nguồn lực & Ngân sách (staff/vendors/sponsors/funding/budget)
│  ├─ 1.3.5 Prisma schema, migration, seed
│  └─ 1.3.6 Audit log & Reports
├─ 1.4 Tích hợp AI
│  ├─ 1.4.1 Provider chung (ai.service) — base URL/key/model, timeout, parse JSON
│  ├─ 1.4.2 AI tóm tắt tiến độ (project-summary)
│  ├─ 1.4.3 AI nháp yêu cầu (requirements-draft)
│  ├─ 1.4.4 AI dự toán (budget-estimate)
│  ├─ 1.4.5 AI phân tích check-in (checkin-analysis)
│  └─ 1.4.6 AI tổng hợp phản hồi (feedback-insights)
├─ 1.5 Frontend
│  ├─ 1.5.1 Layout, trang chủ, danh sách sự kiện
│  ├─ 1.5.2 Chi tiết sự kiện, đăng ký, vé QR
│  ├─ 1.5.3 Dashboard & đánh giá
│  └─ 1.5.4 Trang AI insights + panel phản hồi
├─ 1.6 Kiểm thử, Tích hợp & Demo
│  ├─ 1.6.1 Test plan & traceability
│  ├─ 1.6.2 Test case theo chức năng
│  ├─ 1.6.3 API/E2E test & bug report
│  ├─ 1.6.4 Sửa lỗi & hồi quy
│  └─ 1.6.5 Triển khai demo, user guide, training, demo script
└─ 1.7 Báo cáo & Bàn giao
   ├─ 1.7.1 Viết 10 phần báo cáo (theo phân công)
   ├─ 1.7.2 Ghép & chuẩn hóa báo cáo
   ├─ 1.7.3 Slide thuyết trình
   └─ 1.7.4 Đóng gói bàn giao & nghiệm thu
```

## 2. Bảng WBS chi tiết

| Mã | Gói công việc | Đầu ra chính | Phụ trách (A/R) | Mốc |
|---|---|---|---|---|
| 1.1.1 | Project charter | `docs/01-project-charter.md` | TV1 | M0 |
| 1.1.2 | Kế hoạch PM | WBS, PERT, CPM, Gantt, RACI | TV1 | M0 |
| 1.1.3 | Khung repo | monorepo, Docker, Prisma, health API | TV3, TV4 | M0 |
| 1.1.4 | Chất lượng & truyền thông | `quality-plan.md`, `communication-plan.md` | TV4, TV1 | M0 |
| 1.2.1 | Khảo sát & stakeholder | `stakeholder-analysis.md` | TV2 | M1 |
| 1.2.2 | SRS & use case | `02-scope-and-requirements.md`, `use-cases.md` | TV2 | M1 |
| 1.2.3 | Business process | `business-processes.md` | TV2 | M1 |
| 1.2.4 | ERD & schema | `erd.md`, `prisma/schema.prisma` | TV2, TV4 | M1 |
| 1.2.5 | API contract | `api-contract.md` | TV2, TV3 | M1 |
| 1.2.6 | UI design | `ui-design.md` | TV2, TV5 | M1 |
| 1.3.1 | Auth & Users | module `auth/`, `users/` | TV3 | M2 |
| 1.3.2 | Events & Schedules | module `events/`, `schedules/` | TV3 | M2 |
| 1.3.3 | Đăng ký/QR/Check-in | module `registrations/`, `tickets/`, `check-in/` | TV4 | M2 |
| 1.3.4 | Nguồn lực & Ngân sách | `staff/`,`vendors/`,`sponsors/`,`funding/`,`budget/` | TV3 | M2 |
| 1.3.5 | Prisma & migration & seed | schema, migrations, `seed.ts` | TV4 | M2 |
| 1.3.6 | Audit log & Reports | module `audit-log/`, `reports/` | TV4 | M2 |
| 1.4.1 | Provider AI chung | `integrations/ai/ai.service.ts` | TV3 | M3 |
| 1.4.2 | AI tóm tắt tiến độ | `project-summary.prompt.ts` + method | TV1 | M3 |
| 1.4.3 | AI nháp yêu cầu | `requirements-draft.prompt.ts` + method | TV2 | M3 |
| 1.4.4 | AI dự toán | `budget-estimate.prompt.ts` + method | TV3 | M3 |
| 1.4.5 | AI phân tích check-in | `checkin-analysis.prompt.ts` + method | TV4 | M3 |
| 1.4.6 | AI tổng hợp phản hồi | `feedback-insights.prompt.ts` + method | TV5 | M3 |
| 1.5.1 | Layout & danh sách sự kiện | `app/layout.tsx`, `app/page.tsx` | TV5 | M3 |
| 1.5.2 | Chi tiết/đăng ký/vé QR | trang & component tương ứng | TV5 | M3 |
| 1.5.3 | Dashboard & đánh giá | feature dashboard, event-feedback | TV5 | M3 |
| 1.5.4 | Trang AI insights | `events/[id]/ai-insights/page.tsx`, panel | TV5 | M3 |
| 1.6.1 | Test plan & traceability | `tests/test-plan.md`, traceability | TV5 | M4 |
| 1.6.2 | Test case | `tests/test-cases/*.md` | TV5 | M4 |
| 1.6.3 | API/E2E & bug report | `tests/api/`, `tests/e2e/`, bug-reports | TV5 | M4 |
| 1.6.4 | Sửa lỗi & hồi quy | commit fix + evidence | Cả nhóm | M4 |
| 1.6.5 | Triển khai demo & hướng dẫn | deployment-plan, user-guide, training, demo-script | TV4, TV5 | M4 |
| 1.7.1 | Viết 10 phần báo cáo | các `reports/section-*.md` | Theo phân công | M5 |
| 1.7.2 | Ghép & chuẩn hóa báo cáo | báo cáo cuối | TV1 | M5 |
| 1.7.3 | Slide thuyết trình | `slides/` | TV1 | M5 |
| 1.7.4 | Đóng gói bàn giao | checklist deliverables | TV1 | M5 |

## 3. Quy tắc mã hoá & liên kết

- Mỗi dòng work-log, bug report và commit nên tham chiếu mã WBS (ví dụ `[1.3.3]`) để truy vết.
- Ước lượng thời lượng từng gói: xem [pert-estimation.md](pert-estimation.md).
- Quan hệ phụ thuộc và đường găng: xem [critical-path.md](critical-path.md).
- Lịch thực hiện theo mốc M0–M5: xem [schedule-gantt.md](schedule-gantt.md).

## 4. Giả định khi lập WBS

- Các module nghiệp vụ phụ (nhà cung cấp/tài trợ/IoT/NFC) làm ở mức tối thiểu đủ minh hoạ, ưu tiên luồng cốt lõi 1.3.2 → 1.3.3.
- Phần AI (1.4) phụ thuộc provider chung 1.4.1 phải xong trước.
- Frontend 1.5 chạy song song backend khi API contract (1.2.5) đã chốt.
