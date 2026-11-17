# Tiến độ Gantt

> Lịch thực hiện Smart Event theo 10 tuần (14/09/2026 → 21/11/2026), bám các gói [WBS](wbs.md), mốc M0–M5 trong [Project Charter](../01-project-charter.md) và đường găng ở [critical-path.md](critical-path.md).

## 1. Khung thời gian theo tuần

| Tuần | Khoảng ngày | Mốc |
|---|---|---|
| T1 | 14–20/09/2026 | M0 — chốt kế hoạch |
| T2 | 21–27/09/2026 | |
| T3 | 28/09–04/10/2026 | M1 — SRS & thiết kế duyệt |
| T4 | 05–11/10/2026 | |
| T5 | 12–18/10/2026 | |
| T6 | 19–25/10/2026 | M2 — backend + schema |
| T7 | 26/10–01/11/2026 | |
| T8 | 02–08/11/2026 | M3 — frontend + AI |
| T9 | 09–15/11/2026 | M4 — test & demo |
| T10 | 16–21/11/2026 | M5 — báo cáo & bàn giao |

## 2. Biểu đồ Gantt (theo tuần)

`█` = thực hiện chính · `░` = đệm/song song phụ · ký hiệu găng ⚑

```text
WBS  Công việc                 T1  T2  T3  T4  T5  T6  T7  T8  T9  T10  Phụ trách
1.1  Khởi động & kế hoạch ⚑    █   ░                                     TV1
1.2  Khảo sát, SRS, thiết kế⚑  ░   █   █                                 TV2
1.3  Phát triển backend ⚑          ░   █   █   █   █                     TV3,TV4
1.4  Tích hợp AI ⚑                             ░   █   █                 Cả nhóm
1.5  Frontend                      ░   ░   █   █   █   █                 TV5
1.6  Kiểm thử, tích hợp, demo⚑                     ░   █   █             TV5
1.7  Báo cáo & bàn giao ⚑                                  ░   █   █     TV1
     Mốc                       M0      M1          M2      M3  M4   M5
```

## 3. Bảng lịch chi tiết

| Mã WBS | Công việc | Bắt đầu | Kết thúc | Phụ trách | Trạng thái |
|---|---|---|---|---|---|
| 1.1 | Khởi động & lập kế hoạch | T1 | T2 | TV1 | ☐ Chưa / ☑ Xong |
| 1.2 | Khảo sát, SRS & thiết kế | T2 | T3 | TV2 | ☐ |
| 1.3 | Phát triển backend | T3 | T6 | TV3, TV4 | ☐ |
| 1.4 | Tích hợp AI | T6 | T8 | Cả nhóm | ☐ |
| 1.5 | Frontend | T4 | T7 | TV5 | ☐ |
| 1.6 | Kiểm thử, tích hợp & demo | T8 | T9 | TV5 | ☐ |
| 1.7 | Báo cáo & bàn giao | T9 | T10 | TV1 | ☐ |

## 4. Ghi chú

- Công việc có ⚑ nằm trên **đường găng** — không được trễ.
- **1.5 Frontend** có 10 ngày float: lịch đặt T4–T7 nhưng có thể dịch trong giới hạn float nếu backend trễ.
- Cập nhật cột **Trạng thái** mỗi tuần sau họp nhóm; chênh lệch so với kế hoạch phản ánh ở [evm-status.md](evm-status.md) và [monitoring-log.md](../05-execution-and-monitoring/monitoring-log.md).
- Có thể đính kèm link bảng Gantt chi tiết của nhóm (Google Sheets/Project) tại đây: «link».
