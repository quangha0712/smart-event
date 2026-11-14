# Kế hoạch triển khai

## Môi trường phát triển

- MySQL 8.4 chạy bằng Docker Compose tại `infra/docker-compose.yml`.
- API NestJS chạy ở cổng 3001, prefix `/api`.
- Web Next.js chạy ở cổng 3000.

## Quy trình

1. Cấu hình biến môi trường từ `.env.example`.
2. Khởi động database và chờ healthcheck.
3. Áp dụng Prisma migration và seed dữ liệu.
4. Khởi chạy API và web, kiểm tra `/api/health`.
5. Chạy smoke test luồng demo và lưu minh chứng.
