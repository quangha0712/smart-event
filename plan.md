# Kế hoạch kiến trúc và phân công dự án Smart Event

## 1. Mục tiêu

Tài liệu này chốt kiến trúc codebase, công nghệ, phạm vi AI và đầu việc riêng của 5 thành viên cho dự án Phần mềm Quản lý Sự kiện Thông minh. Các đường dẫn trong tài liệu tính từ thư mục `smart-event/`.

## 2. Công nghệ sử dụng

| Khu vực | Công nghệ | Mục đích |
|---|---|---|
| Frontend | Next.js 14, React 18, TypeScript | Trang người dùng, ban tổ chức, dashboard và AI insights |
| Backend | NestJS 10, TypeScript, REST API | Nghiệp vụ, API, tích hợp database và AI |
| Database | MySQL 8.4 | Lưu tài khoản, sự kiện, lịch trình, đăng ký, vé, đánh giá và ngân sách |
| ORM/migration | Prisma 6 | Schema database, migration, truy vấn và seed |
| Chạy database local | Docker Compose | Khởi động MySQL cùng volume và health check |
| Workspace | npm workspaces | Quản lý `apps/web`, `apps/api`, `packages/shared` trong một repository |
| Kết nối AI | OpenAI-compatible Chat Completions API qua `fetch` của Node.js | Gọi một provider AI chung cho các tính năng AI |
| Backend testing | Jest/Nest testing scaffold | Unit/integration test cho API |
| API/E2E testing | Collection Postman/Insomnia; Playwright theo kế hoạch | Kiểm tra API và luồng người dùng trên trình duyệt |

AI được cấu hình bằng `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL` trong `.env`. Dự án chỉ dùng một cấu hình provider chung, không tạo 5 tài khoản hay 5 API key theo thành viên. API key không được commit vào repository.

## 3. Cây codebase đầy đủ

```text
smart-event/
├─ .env.example
├─ .gitignore
├─ package.json
├─ tsconfig.base.json
├─ README.md
├─ plan.md
│
├─ apps/
│  ├─ api/
│  │  ├─ package.json
│  │  ├─ nest-cli.json
│  │  ├─ tsconfig.json
│  │  ├─ tsconfig.build.json
│  │  ├─ src/
│  │  │  ├─ main.ts
│  │  │  ├─ app.module.ts
│  │  │  ├─ health/
│  │  │  │  └─ health.module.ts
│  │  │  ├─ common/
│  │  │  │  └─ README.md
│  │  │  ├─ auth/
│  │  │  │  └─ README.md
│  │  │  ├─ users/
│  │  │  │  └─ README.md
│  │  │  ├─ events/
│  │  │  │  ├─ events.controller.ts
│  │  │  │  ├─ events.module.ts
│  │  │  │  ├─ events.service.ts
│  │  │  │  └─ README.md
│  │  │  ├─ schedules/
│  │  │  │  └─ README.md
│  │  │  ├─ registrations/
│  │  │  │  └─ README.md
│  │  │  ├─ tickets/
│  │  │  │  └─ README.md
│  │  │  ├─ check-in/
│  │  │  │  └─ README.md
│  │  │  ├─ event-feedback/
│  │  │  │  └─ README.md
│  │  │  ├─ resources/          # nguồn lực: nhân sự, NCC, tài trợ, dự toán – thực chi
│  │  │  │  ├─ README.md
│  │  │  │  ├─ resources.module.ts
│  │  │  │  ├─ staff.controller.ts
│  │  │  │  ├─ partners.controller.ts
│  │  │  │  ├─ budget.controller.ts
│  │  │  │  ├─ budget.service.ts
│  │  │  │  └─ dto/
│  │  │  ├─ reports/
│  │  │  │  └─ README.md
│  │  │  ├─ audit-log/          # để sau
│  │  │  │  └─ README.md
│  │  │  ├─ prisma/
│  │  │  │  └─ prisma.module.ts
│  │  │  └─ integrations/
│  │  │     ├─ ai/
│  │  │     │  ├─ ai.controller.ts
│  │  │     │  ├─ ai.module.ts
│  │  │     │  ├─ ai.service.ts
│  │  │     │  ├─ ai.types.ts
│  │  │     │  ├─ README.md
│  │  │     │  └─ prompts/
│  │  │     │     ├─ project-summary.prompt.ts
│  │  │     │     ├─ requirements-draft.prompt.ts
│  │  │     │     ├─ budget-estimate.prompt.ts
│  │  │     │     ├─ checkin-analysis.prompt.ts
│  │  │     │     └─ feedback-insights.prompt.ts
│  │  │     ├─ nfc/
│  │  │     │  └─ README.md
│  │  │     └─ iot/
│  │  │        └─ README.md
│  │  └─ test/
│  │     ├─ README.md
│  │     └─ jest-e2e.json
│  │
│  └─ web/
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ next.config.mjs
│     └─ src/
│        ├─ app/
│        │  ├─ layout.tsx
│        │  ├─ page.tsx
│        │  ├─ globals.css
│        │  └─ events/
│        │     └─ [id]/
│        │        └─ ai-insights/
│        │           └─ page.tsx
│        ├─ components/
│        │  └─ README.md
│        ├─ features/
│        │  ├─ ai/
│        │  │  ├─ FeedbackInsightsPanel.tsx
│        │  │  └─ README.md
│        │  ├─ auth/README.md
│        │  ├─ events/README.md
│        │  ├─ schedules/README.md
│        │  ├─ registrations/README.md
│        │  ├─ tickets/README.md
│        │  ├─ check-in/README.md
│        │  ├─ event-feedback/README.md
│        │  ├─ resources/README.md
│        │  └─ dashboard/README.md
│        ├─ lib/README.md
│        └─ types/README.md
│
├─ packages/
│  └─ shared/
│     ├─ package.json
│     └─ src/index.ts
│
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
│     ├─ migration_lock.toml
│     └─ 20261114000000_init/migration.sql
│
├─ infra/
│  ├─ docker-compose.yml
│  └─ deployment/README.md
│
├─ tests/
│  ├─ test-plan.md
│  ├─ requirements-traceability.md
│  ├─ test-cases/
│  │  ├─ auth.md
│  │  ├─ event-management.md
│  │  ├─ schedule.md
│  │  ├─ registration.md
│  │  ├─ qr-ticket.md
│  │  ├─ check-in.md
│  │  ├─ event-feedback.md
│  │  └─ dashboard.md
│  ├─ test-data/
│  ├─ api/README.md
│  ├─ e2e/README.md
│  ├─ bug-reports/README.md
│  └─ test-evidence/
│
├─ docs/
│  ├─ 01-project-charter.md
│  ├─ 02-scope-and-requirements.md
│  ├─ 03-analysis-and-design/
│  │  ├─ stakeholder-analysis.md
│  │  ├─ use-cases.md
│  │  ├─ business-processes.md
│  │  ├─ erd.md
│  │  ├─ api-contract.md
│  │  ├─ ui-design.md
│  │  └─ ai-requirements.md
│  ├─ 04-project-management/
│  │  ├─ wbs.md
│  │  ├─ pert-estimation.md
│  │  ├─ critical-path.md
│  │  ├─ schedule-gantt.md
│  │  ├─ team-obs-raci.md
│  │  ├─ estimation-and-budget.md
│  │  ├─ risk-register.md
│  │  ├─ quality-plan.md
│  │  ├─ communication-plan.md
│  │  ├─ evm-status.md
│  │  └─ change-log.md
│  ├─ 05-execution-and-monitoring/
│  │  ├─ work-log.md
│  │  ├─ monitoring-log.md
│  │  └─ meeting-minutes/
│  ├─ 06-deployment/deployment-plan.md
│  ├─ 07-user-guide.md
│  ├─ 08-training.md
│  └─ 09-demo-script.md
│
├─ reports/
│  ├─ README.md
│  ├─ section-I-team.md
│  ├─ section-II-project-overview.md
│  ├─ section-III-project-planning.md
│  ├─ section-IV-project-cost.md
│  ├─ section-V-human-resources.md
│  ├─ section-VI-execution.md
│  ├─ section-VII-monitoring-control.md
│  ├─ section-VIII-project-risks.md
│  ├─ section-IX-deliverables.md
│  └─ section-X-results.md
│
├─ slides/README.md
└─ demo/
   ├─ data/README.md
   ├─ screenshots/
   └─ videos/
```

## 4. AI trong dự án

### 4.1 Cách sử dụng AI

- Dự án dùng một provider AI chung cấu hình qua `.env`; đây không phải 5 tài khoản riêng.
- Mỗi thành viên sở hữu một tính năng AI và prompt riêng. Endpoint AI gọi phần kết nối provider chung trong `apps/api/src/integrations/ai/ai.service.ts`.
- TV3 là người phụ trách kết nối kỹ thuật chung: đọc biến môi trường, gọi endpoint provider, nhận JSON, xử lý timeout/lỗi và kiểm tra/tính lại tổng dự toán.
- Các thành viên khác sở hữu prompt, endpoint method và nghiệp vụ AI được giao; không sửa phần provider chung của TV3.
- Hiện chưa có xác thực, phân quyền hay hạn mức theo tài khoản; API AI chỉ dùng local/dev. Cần bổ sung auth, quota và audit trước khi đưa lên môi trường dùng thật.
- Kết quả AI phải được người phụ trách rà soát. Dự toán chỉ là ước lượng; phân tích check-in chỉ đưa tín hiệu cần kiểm tra; không tự động từ chối người tham dự hoặc quyết định chi tiêu.

### 4.2 Năm tính năng AI và chủ sở hữu

| Thành viên | Tính năng và mục đích | Endpoint | Prompt riêng | Method sở hữu |
|---|---|---|---|---|
| TV1 – PM | Tóm tắt tiến độ, việc còn tồn, rủi ro và hành động tiếp theo từ dữ liệu PM nhập | `POST /api/ai/project-summary` | `prompts/project-summary.prompt.ts` | `AiController.projectSummary`, `AiService.projectSummary` |
| TV2 – BA | Tạo bản nháp FR/NFR, use case, giả định và câu hỏi cần làm rõ từ mô tả nghiệp vụ | `POST /api/ai/requirements-draft` | `prompts/requirements-draft.prompt.ts` | `AiController.requirementsDraft`, `AiService.requirementsDraft` |
| TV3 – Backend 1 | Gợi ý dự toán sự kiện theo loại, số người, thời lượng, địa điểm và ràng buộc | `POST /api/ai/budget-estimate` | `prompts/budget-estimate.prompt.ts` | `AiController.budgetEstimate`, `AiService.budgetEstimate`; đồng thời sở hữu provider chung |
| TV4 – Backend 2 | Phân tích tổng số lượt check-in, lượt hợp lệ, quét lặp, mã sai theo khoảng thời gian | `POST /api/ai/check-in-analysis` | `prompts/checkin-analysis.prompt.ts` | `AiController.checkInAnalysis`, `AiService.checkInAnalysis` |
| TV5 – Frontend/Tester | Tổng hợp chủ đề phản hồi sự kiện và gợi ý cải thiện cho ban tổ chức | `POST /api/ai/events/:eventId/feedback-insights` | `prompts/feedback-insights.prompt.ts` | `AiController.feedbackInsights`, `AiService.feedbackInsights`; UI tại `apps/web/src/features/ai/` |

## 5. Phân công codebase theo thành viên

### Thành viên 1 – Nhóm trưởng / PM

**Phải hoàn thành trong codebase**

1. Điền thông tin dự án và phạm vi PM trong `docs/01-project-charter.md`.
2. Hoàn thiện các file PM: `docs/04-project-management/wbs.md`, `pert-estimation.md`, `critical-path.md`, `schedule-gantt.md`, `team-obs-raci.md`.
3. Cập nhật `docs/05-execution-and-monitoring/work-log.md`, `monitoring-log.md` và lưu biên bản tại `meeting-minutes/`.
4. Hoàn thiện AI tóm tắt tiến độ trong prompt `project-summary.prompt.ts`, method `projectSummary` của controller/service; định nghĩa đầu vào gắn với nhật ký PM và rà soát đầu ra.
5. Chuẩn bị `slides/` và điều phối `demo/`.

**Phần báo cáo phải tự viết**

- Phần I: thông tin nhóm, phân công, quá trình họp.
- Phần II: mục tiêu, phạm vi và quy mô tổng thể.
- Phần III: kế hoạch tổng thể.
- Phần IV: tổng dự toán/thực tế và các khoản không phát sinh.
- Phần V: thông tin 5 thành viên và nhiệm vụ.
- Phần VII – tiểu mục PM: tiến độ tổng thể, nhật ký PM và biên bản họp.

### Thành viên 2 – Phân tích nghiệp vụ / BA

**Phải hoàn thành trong codebase**

1. Hoàn thiện SRS và phạm vi trong `docs/02-scope-and-requirements.md`.
2. Hoàn thiện `stakeholder-analysis.md`, `use-cases.md`, `business-processes.md`, `erd.md`, `api-contract.md`, `ui-design.md` trong `docs/03-analysis-and-design/`.
3. Hoàn thiện danh sách rủi ro nghiệp vụ trong `docs/04-project-management/risk-register.md`.
4. Hoàn thiện AI tạo bản nháp yêu cầu trong prompt `requirements-draft.prompt.ts`, method `requirementsDraft` của controller/service; rà soát kết quả trước khi đưa yêu cầu vào SRS.

**Phần báo cáo phải tự viết**

- Phần II – tiểu mục khảo sát, nhu cầu, người dùng và bên liên quan.
- Phần VI – tiểu mục khảo sát, yêu cầu, use case, quy trình và thiết kế.
- Phần VIII – sổ rủi ro, xác suất, ảnh hưởng và phương án xử lý.

### Thành viên 3 – Backend 1 / Ước lượng và chi phí

**Phải hoàn thành trong codebase**

1. Hoàn thiện module `apps/api/src/auth/`, `users/`, `events/`, `schedules/` và module nguồn lực `resources/` (nhân sự, nhà cung cấp, nhà tài trợ, dự toán – thực chi).
2. Hoàn thiện AI dự toán: prompt `budget-estimate.prompt.ts`, method `budgetEstimate` controller/service và kiểm tra đầu ra số học.
3. Sở hữu kết nối kỹ thuật provider chung trong `ai.service.ts`: cấu hình base URL/key/model, gửi request, timeout, lỗi provider và parse JSON. Những thành viên khác không sửa phần provider chung.
4. Cập nhật schema/module API liên quan đến nghiệp vụ Backend 1 và tài liệu API tương ứng.

**Phần báo cáo phải tự viết**

- Phần IV – tiểu mục chi phí backend, AI/provider và giả định ước lượng.
- Phần VI – tiểu mục chức năng Backend 1.
- Phần IX – tiểu mục mã nguồn/API Backend 1.
- Phần X – kết quả, hạn chế và hướng phát triển Backend 1.

### Thành viên 4 – Backend 2 / Giám sát kỹ thuật

**Phải hoàn thành trong codebase**

1. Hoàn thiện `prisma/schema.prisma`, migrations, seed và `apps/api/src/prisma/`.
2. Hoàn thiện `apps/api/src/registrations/`, `tickets/`, `check-in/`, `integrations/nfc/`, `integrations/iot/`. Module `audit-log/` để sau (ngoài phạm vi đợt hiện tại).
3. Hoàn thiện cấu hình triển khai trong `infra/` và `docs/06-deployment/deployment-plan.md`.
4. Hoàn thiện `quality-plan.md`, `evm-status.md`, `change-log.md`.
5. Hoàn thiện AI phân tích check-in: prompt `checkin-analysis.prompt.ts`, method `checkInAnalysis` controller/service; chỉ tạo cảnh báo tham khảo, không tự chặn vé/người.

**Phần báo cáo phải tự viết**

- Phần VI – tiểu mục database, đăng ký, QR, check-in và triển khai.
- Phần VII – tiểu mục nhật ký kỹ thuật, EVM, chất lượng và kiểm soát thay đổi.
- Phần IX – tiểu mục database, migration và mã nguồn Backend 2.
- Phần X – kết quả, hạn chế và hướng phát triển Backend 2.

### Thành viên 5 – Frontend / Tester / Demo

**Phải hoàn thành trong codebase**

1. Hoàn thiện giao diện tại `apps/web/src/app/`, `components/`, `features/`.
2. Hoàn thiện tài liệu kiểm thử trong `tests/`: test plan, traceability, test cases, API/E2E, bug report và evidence.
3. Hoàn thiện `docs/07-user-guide.md`, `08-training.md`, `09-demo-script.md` và tư liệu trong `demo/`.
4. Hoàn thiện AI feedback insights: prompt `feedback-insights.prompt.ts`, method `feedbackInsights` controller/service, UI `apps/web/src/features/ai/FeedbackInsightsPanel.tsx` và trang `apps/web/src/app/events/[id]/ai-insights/page.tsx`.
5. Kiểm thử luồng UI AI: gọi endpoint, trạng thái loading/lỗi, hiển thị kết quả và nhãn cần con người rà soát.

**Phần báo cáo phải tự viết**

- Phần IV – tiểu mục chi phí frontend, công cụ kiểm thử và demo.
- Phần VI – tiểu mục giao diện, tích hợp, kiểm thử và demo.
- Phần IX – tiểu mục frontend, test cases, kết quả test, ảnh/video demo.
- Phần X – kết quả kiểm thử, lỗi tồn tại và hạn chế frontend.

## 6. Chia tiểu mục báo cáo để mỗi người viết phần riêng

Word và ảnh giao Phần IV, VII khác nhau. Các mục được chia thành các tiểu mục độc lập như sau:

| Phần | Người viết | Tiểu mục người đó hoàn thành |
|---|---|---|
| I | TV1 | Toàn bộ phần giới thiệu nhóm |
| II | TV1 | Mục tiêu, phạm vi, quy mô tổng thể |
| II | TV2 | Khảo sát, người dùng, nhu cầu, bên liên quan |
| III | TV1 | Toàn bộ phần kế hoạch dự án |
| IV | TV1 | Tổng ngân sách, chi phí thực tế, khoản không phát sinh |
| IV | TV3 | Chi phí kỹ thuật backend và provider/AI |
| IV | TV5 | Chi phí frontend, công cụ test và demo |
| V | TV1 | Toàn bộ phần nguồn nhân lực |
| VI | TV2 | Khảo sát, yêu cầu, phân tích và thiết kế |
| VI | TV3 | Chức năng Backend 1 |
| VI | TV4 | Database, Backend 2, QR/check-in và triển khai |
| VI | TV5 | Frontend, kiểm thử và demo |
| VII | TV1 | Tiến độ tổng thể, nhật ký PM, biên bản họp |
| VII | TV4 | EVM, chất lượng kỹ thuật, nhật ký thay đổi |
| VIII | TV2 | Nhận diện, phân tích và phương án ứng phó rủi ro |
| IX | TV1 | Danh mục tổng thể sản phẩm bàn giao |
| IX | TV2 | Tài liệu khảo sát/phân tích/thiết kế |
| IX | TV3 | Mã nguồn/API Backend 1 |
| IX | TV4 | Database/API Backend 2, dữ liệu mẫu |
| IX | TV5 | Frontend, kiểm thử, hướng dẫn và demo |
| X | TV1 | Kết quả tổng thể so với mục tiêu |
| X | TV2 | Kết quả và hạn chế phân tích/thiết kế |
| X | TV3 | Kết quả và hạn chế Backend 1 |
| X | TV4 | Kết quả và hạn chế Backend 2/triển khai |
| X | TV5 | Kết quả kiểm thử, frontend và demo |

TV1 thực hiện ghép định dạng các tiểu mục thành báo cáo cuối; không viết thay nội dung chuyên môn của người được giao.

## 7. Trạng thái và giới hạn hiện tại

- Đã có khung monorepo, cấu hình Docker/MySQL/Prisma, API health, API mẫu quản lý sự kiện và code khung cho 5 luồng AI.
- Nhiều module nghiệp vụ hiện mới có `README.md`; người được giao module cần triển khai nghiệp vụ, DTO, API và kiểm thử tương ứng.
- AI cần API key hợp lệ mới gọi được; thiếu key API trả lỗi cấu hình.
- AI endpoints chưa có auth guard, quota hoặc rate limit. Chỉ chạy local/dev cho đến khi bổ sung các kiểm soát này.
- Đầu ra AI phải được người phụ trách duyệt. Không xem dự toán là báo giá, không dùng phân tích check-in để tự động kết luận gian lận.
