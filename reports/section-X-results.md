# X. Kết quả đạt được

Ghi chức năng hoàn thành, kết quả kiểm thử, hạn chế, bài học và hướng phát triển.

Ghi rõ từng tính năng AI đã chạy thực tế hay mới dừng ở khung; nêu độ tin cậy/giới hạn, chi phí sử dụng và việc cần người kiểm tra.

## Tiểu mục kết quả TV4 – Backend 2

Code hiện có luồng đăng ký → phát hành QR → check-in, log theo máy quét, audit query theo event/time và endpoint AI nhận `from`/`to`; LLM đánh giá từng vé theo bốn rule, backend hậu kiểm verdict/confidence/evidence với log. Seed cung cấp tám mẫu dương tính (hai cho mỗi rule) và ba mẫu đối chứng. Các kết quả này mô tả phần code; chưa có bằng chứng cho thấy ứng dụng đã chạy hoặc test đã pass. Cần chạy unit test và demo MySQL trước khi báo cáo trạng thái hoàn thành.

Giới hạn hiện tại: `deviceId` do client gửi và chưa được xác thực; endpoint API chưa có auth guard; LLM có thể sai và confidence không phải xác suất được hiệu chuẩn; `isFraud: true` là cờ nghi ngờ theo policy demo, không phải xác minh ý định. Chưa có tích hợp Swagger trong API.

## Tiểu mục kết quả TV2 – Phân tích và thiết kế

**Kết quả đạt được**

- Bộ tài liệu phân tích – thiết kế hoàn chỉnh, đối chiếu với mã nguồn thực tế: SRS 17 nhóm yêu cầu chức năng và 19 yêu cầu phi chức năng có tiêu chí chấp nhận; 19 use case (6 đặc tả đầy đủ); 7 quy trình nghiệp vụ; ERD 18 bảng; hợp đồng API hợp nhất; danh mục 19 màn hình và wireframe; sổ 21 rủi ro.
- Ma trận truy vết yêu cầu → use case → API → màn hình → test case giúp tester và PM thấy ngay chức năng nào chưa có kiểm thử.
- Đối chiếu tài liệu với mã nguồn phát hiện và báo lại cho nhóm: API AI check-in đang để công khai; chức năng gửi đánh giá chưa có làm AI tổng hợp phản hồi thiếu dữ liệu; luồng duyệt dự toán do AI gợi ý chưa được cài đặt; test case check-in lệch hợp đồng API; 4 unit test cũ đang lỗi.
- Tính năng AI bản nháp yêu cầu (FR-11) có che dữ liệu cá nhân, phát hiện trùng SRS và 17 luật hậu kiểm, đạt 12/12 unit test.

**Hạn chế**

- Chưa có số liệu phiếu hỏi/phỏng vấn thật trong tài liệu khảo sát (mới có bộ công cụ và khảo sát tài liệu).
- FR-11 chưa chạy với API key thật và chưa có giao diện (dùng qua Swagger); phát hiện trùng dựa trên cụm từ khoá nên có thể bỏ sót yêu cầu trùng nghĩa khác chữ; bộ che dữ liệu chưa nhận diện họ tên, địa chỉ.
- Yêu cầu hiệu năng (NFR-PER-01, NFR-PER-02) chưa được đo.

**Bài học**

Viết tài liệu song song và đối chiếu thường xuyên với mã nguồn giúp phát hiện lệch sớm hơn chờ đến khi kiểm thử; mọi yêu cầu nên có tiêu chí chấp nhận đo được ngay từ đầu để tester viết được test case.

**Hướng phát triển**

Lưu lịch sử bản nháp và quyết định duyệt; dùng embedding để phát hiện trùng theo nghĩa; bổ sung nhận diện họ tên/địa chỉ khi che dữ liệu; đo hiệu năng check-in với nhiều máy quét đồng thời.
