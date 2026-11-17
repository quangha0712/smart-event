# Ước lượng PERT

> Ước lượng thời lượng các gói công việc theo WBS bằng công thức PERT:
> `TE = (O + 4M + P) / 6` — O: lạc quan, M: khả dĩ nhất, P: bi quan (đơn vị: ngày làm việc).
> Độ lệch chuẩn `σ = (P − O) / 6`; phương sai `σ² = σ²`. Dùng cho đường găng ở [critical-path.md](critical-path.md).

## 1. Bảng ước lượng theo nhóm công việc

| Mã WBS | Đầu việc | O | M | P | TE | σ | Phụ trách |
|---|---|---:|---:|---:|---:|---:|---|
| 1.1 | Khởi động & lập kế hoạch | 2 | 3 | 5 | 3.2 | 0.50 | TV1 |
| 1.2 | Khảo sát, SRS & thiết kế | 6 | 8 | 12 | 8.3 | 1.00 | TV2 |
| 1.3 | Phát triển backend | 10 | 14 | 20 | 14.3 | 1.67 | TV3, TV4 |
| 1.4 | Tích hợp AI | 4 | 6 | 10 | 6.3 | 1.00 | Cả nhóm |
| 1.5 | Frontend | 7 | 10 | 15 | 10.3 | 1.33 | TV5 |
| 1.6 | Kiểm thử, tích hợp & demo | 5 | 7 | 11 | 7.3 | 1.00 | TV5 |
| 1.7 | Báo cáo & bàn giao | 3 | 4 | 7 | 4.3 | 0.67 | TV1 |

## 2. Bảng ước lượng chi tiết (một số gói trọng yếu)

| Mã WBS | Đầu việc | O | M | P | TE | Phụ trách |
|---|---|---:|---:|---:|---:|---|
| 1.2.4 | ERD & schema dữ liệu | 2 | 3 | 5 | 3.2 | TV2, TV4 |
| 1.2.5 | API contract | 1 | 2 | 4 | 2.2 | TV2, TV3 |
| 1.3.2 | Events & Schedules | 2 | 3 | 5 | 3.2 | TV3 |
| 1.3.3 | Đăng ký/QR/Check-in | 3 | 5 | 8 | 5.2 | TV4 |
| 1.3.5 | Prisma migration & seed | 1 | 2 | 4 | 2.2 | TV4 |
| 1.4.1 | Provider AI chung | 1 | 2 | 4 | 2.2 | TV3 |
| 1.4.4 | AI dự toán (tính toán số học) | 1 | 2 | 3 | 2.0 | TV3 |
| 1.5.4 | Trang AI insights + panel | 2 | 3 | 5 | 3.2 | TV5 |
| 1.6.2 | Test case theo chức năng | 2 | 3 | 5 | 3.2 | TV5 |

## 3. Diễn giải

- **Tổng TE các gói level 1 (không trừ song song):** ≈ 54 ngày. Thực tế một số gói chạy song song (backend ∥ frontend sau khi chốt API), nên thời lượng dự án rút còn ~10 tuần — xem đường găng.
- **Gói rủi ro cao nhất về thời gian:** 1.3 (phát triển backend, σ = 1.67) và 1.5 (frontend, σ = 1.33) → cần đệm thời gian và theo dõi sát.
- **Quy đổi:** 1 tuần làm việc ≈ 5 ngày; nhóm 5 người làm song song nên lịch tổng là 10 tuần (M0–M5).

> Ghi chú: O/M/P ở trên là ước lượng kế hoạch. Khi thực hiện, cập nhật thời lượng thực tế vào [work-log.md](../05-execution-and-monitoring/work-log.md) và [evm-status.md](evm-status.md).
