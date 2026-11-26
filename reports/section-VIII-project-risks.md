# VIII. Quản lý rủi ro

Tổng hợp rủi ro, mức độ ảnh hưởng, người phụ trách và phương án ứng phó.

## Tiểu mục TV2 – Nhận diện, phân tích và phương án ứng phó rủi ro

Sổ rủi ro đầy đủ: `docs/04-project-management/risk-register.md` (21 rủi ro). Mỗi rủi ro được đánh giá Xác suất (P) và Ảnh hưởng (I) theo thang 1–5, Điểm = P × I (1–4 Thấp, 5–9 Trung bình, 10–14 Cao, 15–25 Rất cao), có dấu hiệu nhận biết, chiến lược (tránh / giảm thiểu / chuyển giao / chấp nhận), kế hoạch dự phòng và người chịu trách nhiệm.

### 1. Các rủi ro truyền thống

| ID | Rủi ro | Điểm | Phương án chính |
|---|---|---|---|
| R-04 | Phạm vi phình to so với thời gian một học kỳ | 16 Rất cao | Chốt phạm vi trong SRS, ưu tiên MoSCoW, thay đổi qua change-log |
| R-01 | FE/BE hiểu khác hợp đồng API | 12 Cao | Một API contract duy nhất, Swagger là nguồn DTO |
| R-08 | Thành viên tham gia không đều | 12 Cao | Phân công theo file, biên bản ghi người vắng, PM phân lại việc |
| R-09 | Thiếu kiểm thử, test hỏng không được sửa | 12 Cao | Chạy unit test trước khi merge |
| R-07 | Yêu cầu mơ hồ, hiểu sai nghiệp vụ | 9 TB | Tiêu chí chấp nhận đo được, AI kiểm tra từ mơ hồ |
| R-10 | Xung đột khi merge nhiều nhánh | 9 TB | PR nhỏ, merge vào `dev` thường xuyên |
| R-02 | Migration lỗi, mất dữ liệu demo | 8 TB | Migration Prisma, seed tạo lại dữ liệu |

### 2. Các rủi ro của dự án

| ID | Rủi ro | Điểm | Phương án chính |
|---|---|---|---|
| R-11 | API AI check-in đang để công khai | 12 Cao | Gỡ `@Public()`, bật kiểm tra vai trò trước demo |
| R-12 | Chưa có chức năng gửi đánh giá nên AI tổng hợp phản hồi không có dữ liệu | 12 Cao | Làm API/form tối giản hoặc seed dữ liệu mẫu có ghi rõ |
| R-14 | Kết quả AI check-in dự phòng cố định bị hiểu nhầm là thật | 12 Cao | Hiển thị cảnh báo khi gặp kết quả fallback |
| R-13 | Lộ hoặc đổi khoá bí mật JWT/QR | 10 Cao | Khoá chỉ nằm trong `.env`, API dừng nếu thiếu |
| R-05 | AI sai số liệu hoặc vượt chi phí | 9 TB | Người duyệt, server tính lại, giới hạn đầu vào |
| R-15 | Đánh dấu nhầm vé hợp lệ là đáng ngờ | 9 TB | AI và luật cùng khớp mới đánh dấu, không tự chặn vé |
| R-03 | Một vé được check-in hai lần khi quét đồng thời | 8 TB | Cập nhật có điều kiện, luật R4 phát hiện |
| R-06 | Dữ liệu cá nhân gửi tới nhà cung cấp AI | 8 TB | Ẩn danh phản hồi, tự che email/SĐT/CCCD |
| R-17 | Mạng tại địa điểm yếu | 8 TB | 4G dự phòng, nhập bù thủ công |
| R-16 | Camera không đọc được QR | 6 TB | Nhập mã thủ công, NFC |

### 3. Các rủi ro bất khả kháng

| ID | Rủi ro | Điểm | Phương án chính |
|---|---|---|---|
| R-19 | Mất điện, đứt mạng, hỏng máy của thành viên sát hạn | 8 TB | Mọi thứ đẩy lên GitHub/thư mục chung |
| R-20 | Thành viên ốm, việc gia đình, công việc đột xuất | 9 TB | Người hỗ trợ dự phòng cho mỗi module |
| R-18 | Nhà cung cấp AI ngừng dịch vụ hoặc đổi giá | 3 Thấp | Đổi nhà cung cấp qua biến môi trường; luồng chính không phụ thuộc AI |
| R-21 | Thay đổi quy định/hạn nộp môn học, thiên tai, dịch bệnh | 4 Thấp | Giữ đệm 1 tuần trước hạn nộp |

### 4. Nhận xét

Bảy rủi ro có điểm ≥ 12 cần xử lý ngay; trong đó R-11, R-12, R-14 phát sinh từ chính quá trình phân tích mã nguồn của BA và đã được báo cho người phụ trách. Rủi ro đặc thù của tính năng AI (R-05, R-06, R-14, R-15) được kiểm soát theo một nguyên tắc chung: AI chỉ đề xuất, con người quyết định, dữ liệu cá nhân không rời khỏi hệ thống.
