# Kế hoạch kiến trúc và phân công dự án Smart Event

## 1. Mục tiêu

Tài liệu này chốt kiến trúc codebase, công nghệ, phạm vi AI và đầu việc riêng của 5 thành viên cho dự án Phần mềm Quản lý Sự kiện Thông minh. Các đường dẫn trong tài liệu tính từ thư mục `smart-event/`.

## 2. Công nghệ sử dụng

| Khu vực | Công nghệ | Mục đích |
|---|---|---|
| Frontend | Next.js 14, React 18, TypeScript | Trang người dùng, ban tổ chức, dashboard và AI insights |
| Backend | NestJS 10, TypeScript, REST API | Nghiệp vụ, API, tích hợp database và AI |
| Tài liệu API | Swagger/OpenAPI (`@nestjs/swagger` 7) | Một Swagger UI dùng chung cho mọi controller NestJS đã đăng ký trong `AppModule` |
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
│  │  ├─ jest.config.cjs
│  │  ├─ src/
│  │  │  ├─ main.ts                         # Cấu hình prefix /api, Swagger /docs và OpenAPI /docs-json
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
│  │  │  │  ├─ registration.types.ts
│  │  │  │  ├─ registrations.controller.ts
│  │  │  │  ├─ registrations.module.ts
│  │  │  │  ├─ registrations.service.ts
│  │  │  │  └─ README.md
│  │  │  ├─ tickets/
│  │  │  │  ├─ tickets.controller.ts
│  │  │  │  ├─ tickets.module.ts
│  │  │  │  ├─ tickets.service.ts
│  │  │  │  └─ README.md
│  │  │  ├─ check-in/
│  │  │  │  ├─ check-in.controller.ts
│  │  │  │  ├─ check-in.module.ts
│  │  │  │  ├─ check-in.service.ts
│  │  │  │  ├─ check-in.types.ts
│  │  │  │  └─ README.md
│  │  │  ├─ event-feedback/
│  │  │  │  └─ README.md
│  │  │  ├─ staff/
│  │  │  │  └─ README.md
│  │  │  ├─ vendors/
│  │  │  │  └─ README.md
│  │  │  ├─ sponsors/
│  │  │  │  └─ README.md
│  │  │  ├─ funding/
│  │  │  │  └─ README.md
│  │  │  ├─ budget/
│  │  │  │  └─ README.md
│  │  │  ├─ reports/
│  │  │  │  └─ README.md
│  │  │  ├─ audit-log/
│  │  │  │  ├─ audit-log.controller.ts
│  │  │  │  ├─ audit-log.module.ts
│  │  │  │  ├─ audit-log.service.ts
│  │  │  │  └─ README.md
│  │  │  ├─ prisma/
│  │  │  │  └─ prisma.module.ts
│  │  │  └─ integrations/
│  │  │     ├─ ai/
│  │  │     │  ├─ ai.controller.ts
│  │  │     │  ├─ ai.module.ts
│  │  │     │  ├─ ai.service.ts
│  │  │     │  ├─ ai.types.ts
│  │  │     │  ├─ check-in-analysis.policy.ts
│  │  │     │  ├─ README.md
│  │  │     │  └─ prompts/
│  │  │     │     ├─ project-summary.prompt.ts
│  │  │     │     ├─ requirements-draft.prompt.ts
│  │  │     │     ├─ budget-estimate.prompt.ts
│  │  │     │     ├─ checkin-analysis.prompt.ts
│  │  │     │     └─ feedback-insights.prompt.ts
│  │  └─ test/
│  │     ├─ README.md
│  │     ├─ ai.service.spec.ts
│  │     ├─ audit-log.service.spec.ts
│  │     ├─ check-in.service.spec.ts
│  │     ├─ registrations.service.spec.ts
│  │     ├─ tickets.service.spec.ts
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
│        │  ├─ budget/README.md
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
│     ├─ 20261114000000_init/migration.sql
│     ├─ 20261114120000_backend2_checkin/migration.sql
│     └─ 20261115120000_checkin_device_id/migration.sql
│
├─ scripts/
│  └─ dev-bootstrap.mjs             # Docker MySQL + migration + seed tự động khi chạy API
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
- Kết quả AI phải được người phụ trách rà soát. Dự toán chỉ là ước lượng; phân tích check-in có thể trả phân loại theo chính sách demo dựa trên đánh giá LLM và log từng vé, nhưng không tự động từ chối người tham dự hoặc thay thế xác minh thực tế.

### 4.2 Năm tính năng AI và chủ sở hữu

| Thành viên | Tính năng và mục đích | Endpoint | Prompt riêng | Method sở hữu |
|---|---|---|---|---|
| TV1 – PM | Tóm tắt tiến độ, việc còn tồn, rủi ro và hành động tiếp theo từ dữ liệu PM nhập | `POST /api/ai/project-summary` | `prompts/project-summary.prompt.ts` | `AiController.projectSummary`, `AiService.projectSummary` |
| TV2 – BA | Tạo bản nháp FR/NFR, use case, giả định và câu hỏi cần làm rõ từ mô tả nghiệp vụ | `POST /api/ai/requirements-draft` | `prompts/requirements-draft.prompt.ts` | `AiController.requirementsDraft`, `AiService.requirementsDraft` |
| TV3 – Backend 1 | Gợi ý dự toán sự kiện theo loại, số người, thời lượng, địa điểm và ràng buộc | `POST /api/ai/budget-estimate` | `prompts/budget-estimate.prompt.ts` | `AiController.budgetEstimate`, `AiService.budgetEstimate`; đồng thời sở hữu provider chung |
| TV4 – Backend 2 | Gửi thống kê và lịch sử quét từng vé cho LLM; backend hậu xử lý kết quả theo chính sách demo để trả phân loại vé | `POST /api/ai/check-in-analysis` | `prompts/checkin-analysis.prompt.ts` | `AiController.checkInAnalysis`, `AiService.checkInAnalysis` |
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

1. Hoàn thiện module `apps/api/src/auth/`, `users/`, `events/`, `schedules/`, `staff/`, `vendors/`, `sponsors/`, `funding/`, `budget/`.
2. Hoàn thiện AI dự toán: prompt `budget-estimate.prompt.ts`, method `budgetEstimate` controller/service và kiểm tra đầu ra số học.
3. Sở hữu kết nối kỹ thuật provider chung trong `ai.service.ts`: cấu hình base URL/key/model, gửi request, timeout, lỗi provider và parse JSON. Những thành viên khác không sửa phần provider chung.
4. Cập nhật schema/module API liên quan đến nghiệp vụ Backend 1 và tài liệu API tương ứng.

**Phần báo cáo phải tự viết**

- Phần IV – tiểu mục chi phí backend, AI/provider và giả định ước lượng.
- Phần VI – tiểu mục chức năng Backend 1.
- Phần IX – tiểu mục mã nguồn/API Backend 1.
- Phần X – kết quả, hạn chế và hướng phát triển Backend 1.

### Thành viên 4 – Backend 2 / Giám sát kỹ thuật

**Phạm vi sở hữu**

TV4 sở hữu database và luồng đăng ký → vé QR → check-in, cùng giám sát kỹ thuật/triển khai Backend 2. Các module `staff/`, `vendors/`, `sponsors/`, `funding/`, `budget/` thuộc TV3 theo phân công codebase; TV4 không triển khai lại các module đó.

**Việc bắt buộc phải hoàn thành trong codebase**

1. **Database và migration**
   - Hoàn thiện model `Registration` và `Ticket` trong `prisma/schema.prisma`.
   - Thêm model lưu từng lượt quét check-in để phân biệt `ACCEPTED`, `ALREADY_USED`, `INVALID`, có `eventId`, `deviceId`, thời điểm; chỉ lưu `ticketId` nếu xác định được, không lưu nguyên mã QR hoặc thông tin nhạy cảm.
   - Tạo migration trong `prisma/migrations/`; cập nhật `prisma/seed.ts` với dữ liệu sự kiện, đăng ký, vé và ba chuỗi quét demo có `deviceId`, mỗi chuỗi bao phủ một rule AI.
   - Dùng `apps/api/src/prisma/prisma.module.ts` để truy cập database.

2. **Đăng ký tham dự** — `apps/api/src/registrations/`
   - Tạo controller, service và DTO cho tạo/xem/hủy đăng ký.
   - Kiểm tra sự kiện đang nhận đăng ký, sức chứa còn chỗ và ngăn đăng ký trùng.
   - Bảo đảm một người chỉ có một đăng ký cho cùng sự kiện và trạng thái được lưu trong MySQL.

3. **Vé QR** — `apps/api/src/tickets/`
   - Cấp mã vé duy nhất cho đăng ký hợp lệ; cung cấp API tra cứu và xác thực vé.
   - QR chỉ chứa mã tra cứu, không nhúng thông tin cá nhân trực tiếp.

4. **Check-in** — `apps/api/src/check-in/`
   - Kiểm tra vé tồn tại, thuộc đúng sự kiện và chưa được sử dụng; nhận `deviceId` ổn định của máy quét cho mỗi lượt gọi.
   - Ghi nhận check-in theo cách an toàn với hai lượt quét gần đồng thời; mỗi vé chỉ được check-in thành công một lần.
   - Lưu kết quả quét thành công, quét lặp và mã không hợp lệ để truy vết/thống kê.

5. **AI phân tích check-in** — `apps/api/src/integrations/ai/`
   - TV4 sở hữu `prompts/checkin-analysis.prompt.ts`, method `checkInAnalysis` trong `ai.controller.ts`/`ai.service.ts` và endpoint `POST /api/ai/check-in-analysis`.
   - Điều chỉnh endpoint nhận `eventId` và khoảng thời gian; backend truy vấn lịch sử quét trong database, tổng hợp số liệu rồi gửi AI. Không yêu cầu người gọi tự nhập các tổng số liệu.
   - TV3 sở hữu kết nối provider AI dùng chung trong `ai.service.ts`; TV4 chỉ sửa prompt và method check-in, không sửa cấu hình provider/key/request chung.
   - Frontend chỉ gửi `eventId`, `from`, `to` theo ISO 8601; backend truy vấn log theo vé có `deviceId` trong đúng khoảng thời gian này, tự chạy cả ba rule nội bộ và trả kết quả/căn cứ. Frontend không gửi ngưỡng hoặc lựa chọn rule.
   - Các ngưỡng nội bộ: (1) confidence >= 0.85, `ACCEPTED` rồi >=3 `ALREADY_USED` trong 5 phút trên >=2 thiết bị; (2) confidence >= 0.90, >=5 lượt lặp sau `ACCEPTED`, kéo dài >=10 phút, từ >=2 thiết bị; (3) confidence >= 0.90, hai cụm lặp (mỗi cụm >=2 lượt trong 5 phút, cách nhau >=30 phút), tổng >=2 thiết bị và một cụm có >=2 thiết bị. Seed tạo ba trường hợp dương tính và ba mẫu đối chứng với thời điểm động, đồng thời in khoảng `from`/`to` để gọi API. `deviceId` client gửi chưa tự xác thực thiết bị thật. Trả `false` khi LLM trả `not_suspected` với confidence >= 0.85 và vé không có lượt lặp/mã sai; các trường hợp khác là chưa kết luận.
   - `isFraud: true` chỉ là cờ **mẫu hành vi đáng nghi theo quy ước demo**, luôn cần người tổ chức rà soát; không chứng minh ý định gian lận và không tự chặn người tham dự.

6. **Audit log** — `apps/api/src/audit-log/`
   - Ghi thao tác phát hành vé và kết quả check-in cần truy vết.
   - `GET /api/audit-logs` lọc theo event/time với phân trang; không ghi API key hoặc nguyên mã QR. Endpoint hiện chưa có auth guard, chỉ dùng local/dev.

7. **Triển khai, chất lượng và giám sát kỹ thuật**
   - Hoàn thiện `docs/06-deployment/deployment-plan.md`: cách chạy MySQL bằng `infra/docker-compose.yml`, một lệnh `npm run dev` cho web+API, migration/seed tự động, health check API và chạy demo.
   - Hoàn thiện `docs/04-project-management/quality-plan.md`, `communication-plan.md`, `evm-status.md`, `change-log.md`.
   - Ghi work log và monitoring log phần Backend 2 tại `docs/05-execution-and-monitoring/work-log.md` và `monitoring-log.md`.

8. **Kiểm thử phần Backend 2**
   - Viết unit/integration test trong `apps/api/test/` cho đăng ký trùng, hết sức chứa, QR không hợp lệ, check-in hợp lệ/lặp, lọc audit log và ba rule AI.
   - Cập nhật `tests/test-cases/registration.md`, `qr-ticket.md`, `check-in.md`, `check-in-ai.md`; lưu kết quả/minh chứng thật tại `tests/test-evidence/` sau khi chạy.

**Tiêu chí nghiệm thu phần TV4**

- Migration chạy trên MySQL mới; seed dựng được dữ liệu demo.
- Luồng đăng ký → phát hành QR → check-in chạy được; vé không check-in thành công lần thứ hai.
- Lịch sử quét được lưu và tổng hợp theo sự kiện/khoảng thời gian.
- AI check-in lấy số liệu và lịch sử quét theo vé từ database; backend trả phân loại theo chính sách demo kèm căn cứ, cần người tổ chức rà soát và không tự chặn vé.
- Có kết quả test, hướng dẫn chạy và minh chứng cho các luồng TV4 sở hữu.

**Phần báo cáo TV4 tự viết**

- `reports/section-VI-execution.md`: database/migration, đăng ký, vé QR, check-in, AI check-in và triển khai.
- `reports/section-VII-monitoring-control.md`: nhật ký kỹ thuật, EVM, chất lượng, truyền thông kỹ thuật và kiểm soát thay đổi.
- `reports/section-IX-deliverables.md`: schema/migration, API đăng ký-vé-check-in, dữ liệu mẫu, kết quả test và hướng dẫn chạy thử.
- `reports/section-X-results.md`: kết quả thực tế, kết quả test, lỗi còn tồn, giới hạn AI và hướng phát triển Backend 2.

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
- Đầu ra AI phải được người phụ trách duyệt. Không xem dự toán là báo giá; phân loại gian lận check-in là kết quả theo chính sách demo, không phải xác minh ý định ngoài đời và không tự động từ chối check-in.
