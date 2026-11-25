# Đầu ra mẫu AI bản nháp yêu cầu (FR-11) và kết quả rà soát của BA

> **Lưu ý minh bạch:** phản hồi AI trong tài liệu này là **giả lập** (viết tay theo đúng định dạng prompt yêu cầu, có cố ý vài lỗi) vì môi trường lập tài liệu chưa có `AI_API_KEY`. Phần **hậu kiểm, điểm chất lượng và Markdown là kết quả chạy thật** của `reviewRequirementsDraft` trên phản hồi đó. Khi nhóm có API key, chạy lại request ở mục 1 qua Swagger, lưu response thật vào `tests/test-evidence/` và thay mục 3–4.

## 1. Request

```json
{
  "problemStatement": "Ban tổ chức muốn người tham dự nhận nhắc lịch trước mỗi phiên họ quan tâm và có thể đổi sang phiên khác khi phiên đó còn chỗ. Hiện chị Hà (ha.nguyen@example.com, 0912345678) phải gọi điện nhắc thủ công từng người.",
  "targetUsers": "Người tham dự hội thảo; Chủ sự kiện; Đồng tổ chức",
  "moduleName": "Lịch trình",
  "businessGoals": [
    "Giảm cuộc gọi nhắc lịch thủ công"
  ],
  "constraints": [
    "Không gửi SMS trả phí trong giai đoạn demo"
  ],
  "maxRequirements": 6
}
```

Đầu vào sau khi che dữ liệu cá nhân (nội dung thực sự gửi AI):

> Ban tổ chức muốn người tham dự nhận nhắc lịch trước mỗi phiên họ quan tâm và có thể đổi sang phiên khác khi phiên đó còn chỗ. Hiện chị Hà ([EMAIL], [SỐ ĐIỆN THOẠI]) phải gọi điện nhắc thủ công từng người.

## 2. Phản hồi AI (giả lập)

<details><summary>Xem JSON</summary>

```json
{
  "summary": "Bổ sung đăng ký phiên quan tâm, nhắc lịch trong ứng dụng và đổi phiên khi còn chỗ.",
  "assumptions": [
    "[đề xuất] Nhắc trước giờ bắt đầu phiên 30 phút.",
    "Mỗi phiên có giới hạn chỗ riêng (hiện schema chưa có sức chứa theo phiên)."
  ],
  "outOfScope": [
    "Gửi SMS",
    "Nhắc qua Zalo"
  ],
  "functionalRequirements": [
    {
      "id": "FR-1",
      "title": "Đánh dấu phiên quan tâm",
      "description": "Người tham dự có thể đánh dấu các phiên quan tâm trong lịch trình của sự kiện đã đăng ký.",
      "actor": "Người tham dự",
      "priority": "MUST",
      "acceptanceCriteria": [
        "Cho người tham dự có đăng ký CONFIRMED, khi đánh dấu một phiên, thì phiên xuất hiện trong 'Lịch của tôi'.",
        "Cho người chưa đăng ký sự kiện, khi đánh dấu phiên, thì hệ thống từ chối và yêu cầu đăng ký trước."
      ],
      "relatedBaselineIds": [
        "FR-03"
      ]
    },
    {
      "id": "FR-2",
      "title": "Nhắc lịch phiên",
      "description": "Hệ thống gửi thông báo trong ứng dụng nhắc người tham dự trước giờ bắt đầu phiên đã đánh dấu một cách nhanh chóng.",
      "actor": "Hệ thống",
      "priority": "MUST",
      "acceptanceCriteria": [
        "Cho phiên đã đánh dấu, khi còn 30 phút đến giờ bắt đầu, thì người tham dự nhận thông báo."
      ],
      "relatedBaselineIds": []
    },
    {
      "id": "FR-3",
      "title": "Đổi phiên khi còn chỗ",
      "description": "Người tham dự có thể đổi từ phiên đã chọn sang phiên khác cùng khung giờ nếu phiên đích còn chỗ.",
      "actor": "Người tham dự",
      "priority": "SHOULD",
      "acceptanceCriteria": [
        "Cho phiên đích còn chỗ, khi đổi, thì chỗ ở phiên cũ được trả lại.",
        "Cho phiên đích hết chỗ, khi đổi, thì hệ thống báo hết chỗ và giữ phiên cũ."
      ],
      "relatedBaselineIds": [
        "FR-03"
      ]
    },
    {
      "id": "FR-4",
      "title": "AI gợi ý phiên",
      "description": "AI tự động gợi ý và thêm phiên phù hợp vào lịch của người tham dự.",
      "actor": "Hệ thống",
      "priority": "COULD",
      "acceptanceCriteria": [
        "Cho người tham dự có lịch sử đánh dấu, khi mở lịch trình, thì thấy tối đa 3 phiên gợi ý."
      ],
      "relatedBaselineIds": []
    },
    {
      "id": "FR-5",
      "title": "Đăng ký tham dự",
      "description": "Người tham dự đăng ký tham dự sự kiện, hệ thống kiểm tra sức chứa và cho phép hủy đăng ký.",
      "actor": "Người tham dự",
      "priority": "MUST",
      "acceptanceCriteria": [
        "Cho sự kiện còn chỗ, khi đăng ký, thì tạo vé.",
        "Cho sự kiện hết chỗ, khi đăng ký, thì báo lỗi."
      ],
      "relatedBaselineIds": []
    }
  ],
  "nonFunctionalRequirements": [
    {
      "id": "NFR-1",
      "category": "RELIABILITY",
      "description": "Thông báo nhắc được tạo đúng hạn, sai lệch tối đa 2 phút so với thời điểm dự kiến.",
      "metric": "≥ 99% thông báo đúng hạn trong ngày sự kiện"
    },
    {
      "id": "NFR-2",
      "category": "USABILITY",
      "description": "Màn hình lịch của tôi thân thiện với người dùng.",
      "metric": ""
    }
  ],
  "useCases": [
    {
      "id": "UC-1",
      "name": "Đánh dấu phiên và nhận nhắc",
      "primaryActor": "Người tham dự",
      "preconditions": [
        "Đã đăng ký sự kiện"
      ],
      "mainFlow": [
        "Mở lịch trình",
        "Bấm 'Quan tâm' ở phiên",
        "Nhận thông báo trước 30 phút"
      ],
      "alternativeFlows": [
        "Phiên đã bắt đầu: không cho đánh dấu"
      ],
      "postconditions": [
        "Phiên nằm trong Lịch của tôi"
      ],
      "relatedRequirementIds": [
        "FR-1",
        "FR-2"
      ]
    },
    {
      "id": "UC-2",
      "name": "Đổi phiên",
      "primaryActor": "Người tham dự",
      "mainFlow": [
        "Mở Lịch của tôi",
        "Chọn Đổi phiên",
        "Chọn phiên đích còn chỗ",
        "Xác nhận"
      ],
      "relatedRequirementIds": [
        "FR-3",
        "FR-9"
      ]
    }
  ],
  "businessRules": [
    "Chỉ người có đăng ký CONFIRMED mới đánh dấu/đổi phiên.",
    "Không đổi sang phiên đã bắt đầu."
  ],
  "businessRisks": [
    {
      "description": "Người tham dự tắt thông báo trình duyệt nên không nhận nhắc",
      "probability": "Trung bình",
      "impact": "Trung bình",
      "mitigation": "Hiển thị nhắc trên trang Vé của tôi"
    }
  ],
  "clarificationQuestions": [
    {
      "question": "Mỗi phiên có giới hạn chỗ riêng không, bằng bao nhiêu?",
      "reason": "Cần cho FR-3; schema hiện chỉ có sức chứa sự kiện",
      "relatedIds": [
        "FR-3"
      ]
    },
    {
      "question": "Thời điểm nhắc 30 phút đã phù hợp chưa?",
      "reason": "Giá trị đang là đề xuất",
      "relatedIds": [
        "FR-2"
      ]
    }
  ]
}
```

</details>

## 3. Kết quả hậu kiểm tự động

Điểm **55/100** – `NEEDS_REWORK` (1 lỗi, 6 cảnh báo, 3 thông tin).

| Mức | Mã | Đối tượng | Nội dung |
|---|---|---|---|
| info | `PII_REDACTED` | – | Đã che 2 dữ liệu cá nhân trong đầu vào trước khi gửi AI (email: 1, SĐT: 1, số giấy tờ: 0). |
| warning | `AMBIGUOUS_TERM` | DRAFT-FR-02 | Có từ mơ hồ, cần thay bằng tiêu chí đo được: "nhanh", "nhanh chóng". |
| warning | `AMBIGUOUS_TERM` | DRAFT-FR-04 | Có từ mơ hồ, cần thay bằng tiêu chí đo được: "phù hợp". |
| error | `AI_REQUIREMENT_WITHOUT_HUMAN_REVIEW` | DRAFT-FR-04 | Yêu cầu có dùng AI nhưng không quy định người phụ trách rà soát/duyệt kết quả – trái NFR-AI của SRS. |
| warning | `POSSIBLE_DUPLICATE_OF_BASELINE` | DRAFT-FR-05 | Có thể trùng FR-04 "Đăng ký tham dự, kiểm soát sức chứa và hủy đăng ký" (khớp 3 cụm: dang ky tham du, suc chua, huy dang ky). BA quyết định gộp hay tách yêu cầu con. |
| warning | `NFR_NOT_MEASURABLE` | DRAFT-NFR-02 | Chưa có chỉ số đo được (thời gian, tỷ lệ, số lượng…); khó nghiệm thu. |
| warning | `AMBIGUOUS_TERM` | DRAFT-NFR-02 | Có từ mơ hồ: "thân thiện". |
| warning | `UC_UNKNOWN_REQUIREMENT` | DRAFT-UC-02 | Bỏ tham chiếu "FR-9" vì không có yêu cầu tương ứng trong bản nháp. |
| info | `FR_NOT_COVERED_BY_USE_CASE` | DRAFT-FR-04 | Chưa có use case nào bao phủ yêu cầu này. |
| info | `FR_NOT_COVERED_BY_USE_CASE` | DRAFT-FR-05 | Chưa có use case nào bao phủ yêu cầu này. |

## 4. Quyết định rà soát của BA

Minh hoạ cách BA xử lý bản nháp. Các mã FR-03.3, FR-03.4, NFR-REL-03 chỉ là mã dự kiến; **chưa đưa vào SRS** cho đến khi PM duyệt thay đổi phạm vi.

| Đối tượng | Quyết định | Lý do |
|---|---|---|
| DRAFT-FR-01 Đánh dấu phiên quan tâm | **Nhận**, cấp mã FR-03.3 | Mở rộng hợp lý FR-03, có tiêu chí chấp nhận đủ cả trường hợp lỗi |
| DRAFT-FR-02 Nhắc lịch phiên | **Nhận sau khi sửa**, cấp mã FR-03.4 | Bỏ cụm "một cách nhanh chóng"; bổ sung tiêu chí lỗi: phiên bị huỷ/đổi giờ thì huỷ/dời nhắc. Thời điểm 30 phút chờ bên tổ chức xác nhận |
| DRAFT-FR-03 Đổi phiên khi còn chỗ | **Hoãn** | Phụ thuộc câu hỏi "mỗi phiên có sức chứa riêng không"; schema chưa có sức chứa theo phiên → ghi change-log, hỏi PM |
| DRAFT-FR-04 AI gợi ý phiên | **Loại** | Vi phạm BR-10 (AI tự thêm vào lịch, không có người xác nhận), từ mơ hồ "phù hợp", ngoài mục tiêu đã nêu |
| DRAFT-FR-05 Đăng ký tham dự | **Loại** | Trùng FR-04 đã chốt |
| DRAFT-NFR-01 | **Nhận**, cấp mã NFR-REL-03 | Có chỉ số đo được |
| DRAFT-NFR-02 | **Viết lại** | "Thân thiện" không kiểm chứng được → "Người dùng mới thêm được một phiên vào Lịch của tôi trong ≤ 3 thao tác" |
| DRAFT-UC-02 | **Sửa** | Bỏ tham chiếu FR-9 không tồn tại (hệ thống đã tự gỡ); hoãn cùng DRAFT-FR-03 |
| Câu hỏi làm rõ (2) | Gửi PM/nhóm trong buổi họp tuần | Câu trả lời ghi vào SRS mục 6 |

## 5. Markdown hệ thống xuất ra (`result.srsMarkdown`)

### Bản nháp yêu cầu – Lịch trình

> **BẢN NHÁP DO AI TẠO – CHƯA ĐƯỢC BA DUYỆT.** Không đưa vào SRS khi chưa xử lý các phát hiện mức error và chưa xác nhận giả định.
> Điểm chất lượng: **55/100** – cần làm lại.

Bổ sung đăng ký phiên quan tâm, nhắc lịch trong ứng dụng và đổi phiên khi còn chỗ.

#### Yêu cầu chức năng

| Mã nháp | Tên | Tác nhân | Ưu tiên | Tiêu chí chấp nhận | Liên quan SRS |
|---|---|---|---|---|---|
| DRAFT-FR-01 | Đánh dấu phiên quan tâm<br>Người tham dự có thể đánh dấu các phiên quan tâm trong lịch trình của sự kiện đã đăng ký. | Người tham dự | MUST | • Cho người tham dự có đăng ký CONFIRMED, khi đánh dấu một phiên, thì phiên xuất hiện trong 'Lịch của tôi'.<br>• Cho người chưa đăng ký sự kiện, khi đánh dấu phiên, thì hệ thống từ chối và yêu cầu đăng ký trước. | FR-03 |
| DRAFT-FR-02 | Nhắc lịch phiên<br>Hệ thống gửi thông báo trong ứng dụng nhắc người tham dự trước giờ bắt đầu phiên đã đánh dấu một cách nhanh chóng. | Hệ thống | MUST | • Cho phiên đã đánh dấu, khi còn 30 phút đến giờ bắt đầu, thì người tham dự nhận thông báo. |  |
| DRAFT-FR-03 | Đổi phiên khi còn chỗ<br>Người tham dự có thể đổi từ phiên đã chọn sang phiên khác cùng khung giờ nếu phiên đích còn chỗ. | Người tham dự | SHOULD | • Cho phiên đích còn chỗ, khi đổi, thì chỗ ở phiên cũ được trả lại.<br>• Cho phiên đích hết chỗ, khi đổi, thì hệ thống báo hết chỗ và giữ phiên cũ. | FR-03 |
| DRAFT-FR-04 | AI gợi ý phiên<br>AI tự động gợi ý và thêm phiên phù hợp vào lịch của người tham dự. | Hệ thống | COULD | • Cho người tham dự có lịch sử đánh dấu, khi mở lịch trình, thì thấy tối đa 3 phiên gợi ý. |  |
| DRAFT-FR-05 | Đăng ký tham dự<br>Người tham dự đăng ký tham dự sự kiện, hệ thống kiểm tra sức chứa và cho phép hủy đăng ký. | Người tham dự | MUST | • Cho sự kiện còn chỗ, khi đăng ký, thì tạo vé.<br>• Cho sự kiện hết chỗ, khi đăng ký, thì báo lỗi. | FR-04 |

#### Yêu cầu phi chức năng

| Mã nháp | Nhóm | Mô tả | Chỉ số |
|---|---|---|---|
| DRAFT-NFR-01 | RELIABILITY | Thông báo nhắc được tạo đúng hạn, sai lệch tối đa 2 phút so với thời điểm dự kiến. | ≥ 99% thông báo đúng hạn trong ngày sự kiện |
| DRAFT-NFR-02 | USABILITY | Màn hình lịch của tôi thân thiện với người dùng. |  |

#### DRAFT-UC-01: Đánh dấu phiên và nhận nhắc

- **Tác nhân chính:** Người tham dự
- **Yêu cầu liên quan:** DRAFT-FR-01, DRAFT-FR-02
- **Tiền điều kiện:** Đã đăng ký sự kiện
- **Luồng chính:**
  1. Mở lịch trình
  2. Bấm 'Quan tâm' ở phiên
  3. Nhận thông báo trước 30 phút
- **Luồng thay thế:** Phiên đã bắt đầu: không cho đánh dấu
- **Hậu điều kiện:** Phiên nằm trong Lịch của tôi

#### DRAFT-UC-02: Đổi phiên

- **Tác nhân chính:** Người tham dự
- **Yêu cầu liên quan:** DRAFT-FR-03
- **Luồng chính:**
  1. Mở Lịch của tôi
  2. Chọn Đổi phiên
  3. Chọn phiên đích còn chỗ
  4. Xác nhận

#### Giả định cần xác nhận

- [đề xuất] Nhắc trước giờ bắt đầu phiên 30 phút.
- Mỗi phiên có giới hạn chỗ riêng (hiện schema chưa có sức chứa theo phiên).

#### Câu hỏi cần làm rõ

- Mỗi phiên có giới hạn chỗ riêng không, bằng bao nhiêu? _(lý do: Cần cho FR-3; schema hiện chỉ có sức chứa sự kiện)_
- Thời điểm nhắc 30 phút đã phù hợp chưa? _(lý do: Giá trị đang là đề xuất)_

#### Quy tắc nghiệp vụ

- Chỉ người có đăng ký CONFIRMED mới đánh dấu/đổi phiên.
- Không đổi sang phiên đã bắt đầu.

#### Ngoài phạm vi

- Gửi SMS
- Nhắc qua Zalo

#### Phát hiện khi rà soát tự động

- **INFO** `PII_REDACTED`: Đã che 2 dữ liệu cá nhân trong đầu vào trước khi gửi AI (email: 1, SĐT: 1, số giấy tờ: 0).
- **WARNING** `AMBIGUOUS_TERM` (DRAFT-FR-02): Có từ mơ hồ, cần thay bằng tiêu chí đo được: "nhanh", "nhanh chóng".
- **WARNING** `AMBIGUOUS_TERM` (DRAFT-FR-04): Có từ mơ hồ, cần thay bằng tiêu chí đo được: "phù hợp".
- **ERROR** `AI_REQUIREMENT_WITHOUT_HUMAN_REVIEW` (DRAFT-FR-04): Yêu cầu có dùng AI nhưng không quy định người phụ trách rà soát/duyệt kết quả – trái NFR-AI của SRS.
- **WARNING** `POSSIBLE_DUPLICATE_OF_BASELINE` (DRAFT-FR-05): Có thể trùng FR-04 "Đăng ký tham dự, kiểm soát sức chứa và hủy đăng ký" (khớp 3 cụm: dang ky tham du, suc chua, huy dang ky). BA quyết định gộp hay tách yêu cầu con.
- **WARNING** `NFR_NOT_MEASURABLE` (DRAFT-NFR-02): Chưa có chỉ số đo được (thời gian, tỷ lệ, số lượng…); khó nghiệm thu.
- **WARNING** `AMBIGUOUS_TERM` (DRAFT-NFR-02): Có từ mơ hồ: "thân thiện".
- **WARNING** `UC_UNKNOWN_REQUIREMENT` (DRAFT-UC-02): Bỏ tham chiếu "FR-9" vì không có yêu cầu tương ứng trong bản nháp.
- **INFO** `FR_NOT_COVERED_BY_USE_CASE` (DRAFT-FR-04): Chưa có use case nào bao phủ yêu cầu này.
- **INFO** `FR_NOT_COVERED_BY_USE_CASE` (DRAFT-FR-05): Chưa có use case nào bao phủ yêu cầu này.

