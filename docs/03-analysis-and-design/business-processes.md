# Quy trình nghiệp vụ và sơ đồ hoạt động

> Người phụ trách: TV2 – BA. Sơ đồ hoạt động vẽ bằng Mermaid, mỗi `subgraph` là một làn (swimlane) theo tác nhân.

## 1. Hiện trạng (AS-IS) và quy trình mới (TO-BE)

| Bước | Cách làm phổ biến hiện nay (AS-IS) | Vấn đề | Quy trình mới (TO-BE) |
|---|---|---|---|
| Lập kế hoạch | Bảng tính + nhóm chat; mỗi người giữ một bản | Lệch phiên bản, không rõ ai được sửa | Sự kiện, lịch trình, ban tổ chức tập trung một nơi, phân quyền theo vai trò |
| Đăng ký | Google Form, xuất danh sách ra Excel | Đăng ký trùng, vượt sức chứa, phải lọc tay | Đăng ký trực tuyến chặn trùng và chặn vượt sức chứa tự động |
| Phát vé | Gửi email/tin nhắn danh sách hoặc mã tự đặt | Mã dễ đoán, dễ chuyển cho người khác | Vé QR có chữ ký HMAC, không giả mạo được |
| Check-in | Dò tên trên giấy/Excel ở cổng | Xếp hàng lâu, một vé dùng nhiều lần, không biết ai đã vào | Quét QR bằng điện thoại, mỗi vé chỉ chấp nhận một lần, ghi mọi lượt quét |
| Theo dõi | Hỏi qua nhóm chat | Không có số liệu thời gian thực | Dashboard: đăng ký, check-in theo khung giờ, mật độ khu vực, chi phí |
| Chi phí | Tổng hợp hoá đơn sau sự kiện | Phát hiện vượt dự toán quá muộn | Dự toán – thực chi theo từng khoản, xem chênh lệch ngay |
| Sau sự kiện | Đọc tay từng phản hồi | Tốn thời gian, khó thấy xu hướng | AI nhóm chủ đề phản hồi, ban tổ chức duyệt |

## 2. Tổng quan chuỗi giá trị

```mermaid
flowchart LR
  A[Lập kế hoạch<br/>& công bố] --> B[Đăng ký<br/>& phát vé] --> C[Check-in<br/>tại cổng] --> D[Giám sát<br/>trong sự kiện] --> E[Đánh giá<br/>& tổng kết]
  F[Nguồn lực<br/>& ngân sách] -.-> A
  F -.-> D
  F -.-> E
```

## 3. BP-01. Lập kế hoạch và công bố sự kiện (UC-04, UC-05, UC-06, UC-07)

```mermaid
flowchart TB
  subgraph OWN["Chủ sự kiện"]
    s((Bắt đầu)) --> o1[Tạo sự kiện<br/>tên, thời gian, địa điểm, sức chứa]
    o3[Mời Đồng tổ chức,<br/>Nhân viên check-in]
    o5{Nội dung đủ<br/>để công bố?}
    o6[Bấm Công bố]
  end
  subgraph CO["Đồng tổ chức"]
    c1[Nhập lịch trình,<br/>phòng, diễn giả]
    c2[Phân công nhân sự,<br/>nhà cung cấp, dự toán]
  end
  subgraph SYS["Hệ thống"]
    y1[Kiểm tra dữ liệu,<br/>lưu DRAFT, gán OWNER]
    y2{Phiên nằm trong<br/>thời gian sự kiện?}
    y3{Chưa qua giờ<br/>kết thúc?}
    y4[Chuyển PUBLISHED,<br/>hiện công khai, ghi nhật ký]
    e((Kết thúc))
  end
  o1 --> y1 --> o3 --> c1 --> y2
  y2 -- Không --> c1
  y2 -- Có --> c2 --> o5
  o5 -- Chưa --> c1
  o5 -- Rồi --> o6 --> y3
  y3 -- Đã qua --> o1
  y3 -- Chưa --> y4 --> e
```

## 4. BP-02. Đăng ký tham dự và phát vé (UC-08, UC-09)

```mermaid
flowchart TB
  subgraph ATT["Người tham dự"]
    s((Bắt đầu)) --> a1[Xem chi tiết sự kiện]
    a2[Bấm Đăng ký]
    a5[Xem vé QR ở<br/>'Vé của tôi']
    a6{Không đi được?}
    a7[Huỷ đăng ký]
  end
  subgraph SYS["Hệ thống"]
    y1{Sự kiện PUBLISHED<br/>và chưa bắt đầu?}
    y2{Đã có đăng ký<br/>còn hiệu lực?}
    y3{Còn chỗ?}
    y4[Tạo đăng ký CONFIRMED,<br/>ký mã QR HMAC, ghi nhật ký]
    y5[Báo lỗi 409]
    y6{Vé đã check-in?}
    y7[Chuyển CANCELLED,<br/>vé hết hiệu lực, trả chỗ]
    e((Kết thúc))
  end
  a1 --> a2 --> y1
  y1 -- Không --> y5
  y1 -- Có --> y2
  y2 -- Có --> y5
  y2 -- Không --> y3
  y3 -- Hết --> y5
  y3 -- Còn --> y4 --> a5 --> a6
  a6 -- Đi được --> e
  a6 -- Có --> a7 --> y6
  y6 -- Rồi --> y5
  y6 -- Chưa --> y7 --> e
  y5 --> e
```

Bước y2–y4 chạy trong một giao dịch mức Serializable để hai người không cùng lấy được chỗ cuối.

## 5. BP-03. Check-in tại cổng (UC-10)

```mermaid
flowchart TB
  subgraph ATT["Người tham dự"]
    s((Đến cổng)) --> a1[Mở vé QR<br/>hoặc chạm thẻ NFC]
    a9[Vào sự kiện]
    a8[Đến bàn hỗ trợ]
  end
  subgraph STF["Nhân viên check-in"]
    t1[Quét bằng camera /<br/>đầu đọc NFC]
    t2{Quét được?}
    t3[Nhập mã thủ công]
    t5{Màu kết quả}
  end
  subgraph SYS["Hệ thống"]
    y1{Chữ ký mã hợp lệ<br/>và vé tồn tại?}
    y2{Đúng sự kiện?}
    y3{Đăng ký CONFIRMED?}
    y4{Đã check-in?}
    y5{Trong khung giờ<br/>mở cổng?}
    y6[Đánh dấu check-in<br/>có điều kiện: ACCEPTED]
    y7[Ghi CheckInAttempt<br/>mọi kết quả]
  end
  a1 --> t1 --> t2
  t2 -- Không --> t3 --> y1
  t2 -- Có --> y1
  y1 -- Không: INVALID_CODE --> y7
  y1 -- Có --> y2
  y2 -- Không: WRONG_EVENT --> y7
  y2 -- Có --> y3
  y3 -- Không: NOT_ELIGIBLE --> y7
  y3 -- Có --> y4
  y4 -- Rồi: DUPLICATE --> y7
  y4 -- Chưa --> y5
  y5 -- Không: OUT_OF_HOURS --> y7
  y5 -- Có --> y6 --> y7
  y7 --> t5
  t5 -- Xanh --> a9
  t5 -- Cam / Đỏ --> a8
```

Khung giờ check-in: từ 120 phút trước giờ bắt đầu đến giờ kết thúc. Nếu hai máy quét cùng một vé cùng lúc, chỉ một máy cập nhật được `checkedInAt`, máy kia nhận DUPLICATE.

## 6. BP-04. Rà soát bất thường check-in bằng AI (UC-17)

```mermaid
flowchart TB
  subgraph CO["Đồng tổ chức"]
    s((Bắt đầu)) --> c1[Chọn khoảng thời gian<br/>cần rà soát]
    c5[Đọc vé bị đánh dấu<br/>và bằng chứng]
    c6{Xác minh tại cổng<br/>/ camera / nhân viên}
    c7[Xử lý theo quy định<br/>ban tổ chức]
    c8[Ghi nhận báo động giả,<br/>điều chỉnh quy trình cổng]
  end
  subgraph SYS["Hệ thống"]
    y1[Lấy thống kê và lịch sử<br/>quét từng vé trong khoảng]
    y3[Đối chiếu đánh giá AI<br/>với 4 luật R1–R4]
    y4[Trả kết luận theo vé:<br/>true / false / null + bằng chứng]
  end
  subgraph AI["Nhà cung cấp AI"]
    i1[Đánh giá từng vé:<br/>verdict, confidence, evidence]
  end
  c1 --> y1 --> i1 --> y3 --> y4 --> c5 --> c6
  c6 -- Đúng là dùng sai vé --> c7
  c6 -- Không --> c8
```

Hệ thống **không** tự khoá vé hay từ chối người tham dự; quyết định cuối thuộc ban tổ chức (BR-10).

## 7. BP-05. Dự toán – thực chi (UC-14)

```mermaid
flowchart TB
  subgraph CO["Đồng tổ chức"]
    s((Bắt đầu)) --> c1{Dùng AI<br/>gợi ý?}
    c2[Nhập thông số:<br/>loại, số người, số ngày, địa điểm]
    c4[Rà soát từng khoản,<br/>giữ / sửa / bỏ]
    c5[Nhập dòng dự toán thủ công]
    c6[Ghi thực chi khi phát sinh,<br/>kèm số hoá đơn]
    c8{Vượt dự toán?}
    c9[Báo Chủ sự kiện,<br/>điều chỉnh]
  end
  subgraph SYS["Hệ thống"]
    y1[Gọi AI, tính lại<br/>số lượng × đơn giá]
    y2[Lưu dòng dự toán<br/>MANUAL / AI_SUGGESTED + người duyệt]
    y3[Tính chênh lệch theo nhóm,<br/>cập nhật dashboard]
    e((Kết thúc))
  end
  c1 -- Có --> c2 --> y1 --> c4 --> y2
  c1 -- Không --> c5 --> y2
  y2 --> c6 --> y3 --> c8
  c8 -- Có --> c9 --> c6
  c8 -- Không --> e
```

## 8. BP-06. Sau sự kiện: đánh giá và tổng hợp (UC-12)

```mermaid
flowchart TB
  subgraph ATT["Người tham dự"]
    s((Sau sự kiện)) --> a1[Gửi điểm 1–5<br/>và nhận xét]
  end
  subgraph SYS["Hệ thống"]
    y1[Lưu đánh giá,<br/>mỗi người một lần]
    y2[Ẩn danh: chỉ giữ<br/>điểm + nhận xét]
  end
  subgraph AI["Nhà cung cấp AI"]
    i1[Nhóm chủ đề tích cực /<br/>cần cải thiện, gợi ý hành động]
  end
  subgraph CO["Đồng tổ chức"]
    c1[Bấm Tổng hợp phản hồi]
    c2[Rà soát, chọn hành động<br/>cho sự kiện sau]
    c3[Đổi trạng thái COMPLETED]
    e((Kết thúc))
  end
  a1 --> y1
  c1 --> y2 --> i1 --> c2 --> c3 --> e
  y1 -.-> c1
```

Bước a1–y1 thuộc FR-08, **chưa có API/giao diện**; các bước còn lại đã có.

## 9. BP-07. Quy trình phân tích yêu cầu của BA có AI hỗ trợ (UC-16)

```mermaid
flowchart TB
  subgraph BA["BA (TV2)"]
    s((Bắt đầu)) --> b1[Khảo sát: phiếu hỏi,<br/>phỏng vấn, tài liệu]
    b2[Viết mô tả nghiệp vụ<br/>theo từng module]
    b4[Đọc phát hiện,<br/>sửa lỗi mức error]
    b5[Gửi câu hỏi làm rõ<br/>cho bên liên quan]
    b7[Cấp mã FR/NFR/UC chính thức,<br/>cập nhật SRS + truy vết]
  end
  subgraph SYS["Hệ thống"]
    y1[Che email / SĐT /<br/>số giấy tờ]
    y3[Hậu kiểm: trùng SRS, từ mơ hồ,<br/>thiếu tiêu chí, AI thiếu duyệt, truy vết]
    y4[Trả bản nháp + điểm<br/>+ checklist + Markdown]
  end
  subgraph AI["Nhà cung cấp AI"]
    i1[Đề xuất FR, NFR,<br/>use case, câu hỏi]
  end
  subgraph STK["Bên liên quan / PM"]
    k1{Xác nhận?}
    k2[Duyệt thay đổi phạm vi]
  end
  b1 --> b2 --> y1 --> i1 --> y3 --> y4 --> b4 --> b5 --> k1
  k1 -- Chưa, cần sửa --> b2
  k1 -- Đồng ý --> k2 --> b7
```
