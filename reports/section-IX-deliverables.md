# IX. Sản phẩm nộp

Liệt kê báo cáo, slide, kế hoạch, tài liệu thiết kế, mã nguồn, kiểm thử, hướng dẫn, ảnh và video demo.

Nếu hoàn thành hạng mục AI, liệt kê prompt/API, UI liên quan, cấu hình hướng dẫn không chứa secret, kết quả rà soát và minh chứng demo.

## Tiểu mục bàn giao TV4 – Backend 2

- Prisma schema/migration/seed MySQL: `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`.
- API đăng ký, vé QR, check-in, audit log: `apps/api/src/registrations/`, `tickets/`, `check-in/`, `audit-log/`.
- API AI check-in, prompt và policy: `apps/api/src/integrations/ai/`.
- Khởi chạy một lệnh: `npm run dev`; hướng dẫn tại `README.md` và `docs/06-deployment/deployment-plan.md`.
- Unit test tại `apps/api/test/`; test case thủ công tại `tests/test-cases/`. Test chưa chạy nên chưa có minh chứng đạt; chỉ bổ sung evidence sau khi thực thi thật.

## Tiểu mục bàn giao TV2 – Tài liệu khảo sát, phân tích, thiết kế

| Sản phẩm | Đường dẫn |
|---|---|
| Tài liệu khảo sát và phân tích bên liên quan | `docs/03-analysis-and-design/stakeholder-analysis.md` |
| Đặc tả yêu cầu phần mềm (SRS), ma trận truy vết | `docs/02-scope-and-requirements.md` |
| Mô hình use case (sơ đồ + đặc tả) | `docs/03-analysis-and-design/use-cases.md` |
| Quy trình nghiệp vụ, sơ đồ hoạt động | `docs/03-analysis-and-design/business-processes.md` |
| Thiết kế cơ sở dữ liệu (ERD) | `docs/03-analysis-and-design/erd.md` |
| Hợp đồng API | `docs/03-analysis-and-design/api-contract.md` |
| Thiết kế giao diện (danh mục màn hình, wireframe) | `docs/03-analysis-and-design/ui-design.md` |
| Yêu cầu AI và đầu ra mẫu FR-11 | `docs/03-analysis-and-design/ai-requirements.md`, `ai-requirements-draft-sample.md` |
| Sổ đăng ký rủi ro | `docs/04-project-management/risk-register.md` |
| Mã nguồn AI bản nháp yêu cầu | `apps/api/src/integrations/ai/requirements-draft.policy.ts`, `requirements-draft.review.ts`, `requirements-baseline.ts`, `prompts/requirements-draft.prompt.ts`, method `requirementsDraft` trong `ai.service.ts` |
| Unit test | `apps/api/test/requirements-draft.spec.ts` (12 test) |

Sơ đồ viết bằng Mermaid, hiển thị trực tiếp trên GitHub; để chèn vào báo cáo Word, xuất ảnh bằng https://mermaid.live.
