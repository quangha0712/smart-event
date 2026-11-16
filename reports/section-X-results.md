# X. Kết quả đạt được

Ghi chức năng hoàn thành, kết quả kiểm thử, hạn chế, bài học và hướng phát triển.

Ghi rõ từng tính năng AI đã chạy thực tế hay mới dừng ở khung; nêu độ tin cậy/giới hạn, chi phí sử dụng và việc cần người kiểm tra.

## Tiểu mục kết quả TV4 – Backend 2

Code hiện có luồng đăng ký → phát hành QR → check-in, log theo `deviceId`, audit query theo event/time và endpoint AI nhận `from`/`to`, áp dụng ba rule để hỗ trợ rà soát. Seed cung cấp ba mẫu rule và ba mẫu đối chứng. Các kết quả này mô tả phần code; chưa có bằng chứng cho thấy ứng dụng đã chạy hoặc test đã pass. Cần chạy unit test và demo MySQL trước khi báo cáo trạng thái hoàn thành.

Giới hạn hiện tại: `deviceId` do client gửi và chưa được xác thực; endpoint API chưa có auth guard; LLM có thể sai và confidence không phải xác suất được hiệu chuẩn; `isFraud: true` là cờ nghi ngờ theo policy demo, không phải xác minh ý định. Chưa có tích hợp Swagger trong API.
