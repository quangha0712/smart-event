# CPM và đường găng (Critical Path Method)

> Dùng TE (làm tròn) từ [pert-estimation.md](pert-estimation.md) cho các gói level 1 của [WBS](wbs.md). Đơn vị: ngày làm việc. Mốc bắt đầu dự án = ngày 0.

## 1. Danh sách công việc và quan hệ phụ thuộc

| Mã | Công việc | WBS | Thời lượng | Phụ thuộc |
|---|---|---|---:|---|
| A | Khởi động & lập kế hoạch | 1.1 | 3 | - |
| B | Khảo sát, SRS & thiết kế | 1.2 | 8 | A |
| C | Phát triển backend | 1.3 | 14 | B |
| D | Tích hợp AI | 1.4 | 6 | C |
| E | Frontend | 1.5 | 10 | B |
| F | Kiểm thử, tích hợp & demo | 1.6 | 7 | C, D, E |
| G | Báo cáo & bàn giao | 1.7 | 4 | F |

## 2. Tính ES/EF/LS/LF/Float

| Công việc | Thời lượng | ES | EF | LS | LF | Float | Găng? |
|---|---:|---:|---:|---:|---:|---:|:---:|
| A | 3 | 0 | 3 | 0 | 3 | 0 | ✅ |
| B | 8 | 3 | 11 | 3 | 11 | 0 | ✅ |
| C | 14 | 11 | 25 | 11 | 25 | 0 | ✅ |
| D | 6 | 25 | 31 | 25 | 31 | 0 | ✅ |
| E | 10 | 11 | 21 | 21 | 31 | 10 | — |
| F | 7 | 31 | 38 | 31 | 38 | 0 | ✅ |
| G | 4 | 38 | 42 | 38 | 42 | 0 | ✅ |

- **Forward pass:** ES = max(EF các việc trước); EF = ES + thời lượng.
- **Backward pass:** LF = min(LS các việc sau); LS = LF − thời lượng. LF(G) = EF(G) = 42.

## 3. Đường găng

```text
A (3) → B (8) → C (14) → D (6) → F (7) → G (4)
```

- **Tổng thời lượng đường găng = 42 ngày làm việc** (≈ 8.4 tuần thuần công; ánh xạ sang lịch 10 tuần M0–M5 do có ngày đệm, họp và phụ thuộc chờ).
- Mọi chậm trễ trên A, B, C, D, F, G đều đẩy lùi ngày kết thúc dự án.

## 4. Công việc có độ trễ (slack)

- **E — Frontend (float = 10 ngày):** có thể bắt đầu ngay sau thiết kế (B) hoặc trễ tối đa 10 ngày mà không ảnh hưởng đích, miễn xong trước khi F bắt đầu (ngày 31). Đây là nguồn lực linh hoạt nếu backend (C) trễ.

## 5. Khuyến nghị quản lý

- Giám sát chặt C (backend) và D (AI) vì nằm trên đường găng và có σ lớn nhất (xem PERT).
- Tận dụng float của E để điều phối TV5 hỗ trợ kiểm thử sớm (1.6.1–1.6.2) khi frontend tạm ổn.
- Cập nhật thời lượng thực tế hằng tuần để tính lại đường găng nếu phát sinh trễ.
