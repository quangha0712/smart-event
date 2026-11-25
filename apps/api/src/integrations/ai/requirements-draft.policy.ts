/**
 * Chính sách rà soát bản nháp yêu cầu do AI tạo (TV2 – BA). Cố định phía server, client không đổi được.
 * Tham khảo tiêu chí chất lượng yêu cầu của IEEE 29148 (rõ ràng, kiểm chứng được, truy vết được).
 */
export const REQUIREMENTS_DRAFT_POLICY = Object.freeze({
  defaultMaxRequirements: 10,
  /** Tối đa use case/NFR giữ lại, tránh output quá dài. */
  maxUseCases: 10,
  maxNonFunctional: 10,
  /** Tỷ lệ cụm từ đặc trưng của yêu cầu đã chốt xuất hiện trong bản nháp để coi là có thể trùng. */
  baselineDuplicateRatio: 0.5,
  baselineDuplicateMinPhrases: 2,
  /** Jaccard giữa hai yêu cầu trong cùng bản nháp để coi là trùng nhau. */
  internalDuplicateJaccard: 0.8,
  /** Điểm trừ theo mức độ phát hiện; điểm sàn 0. */
  penalty: { error: 15, warning: 5, info: 0 },
  /** Dưới ngưỡng này hoặc còn lỗi mức error thì bản nháp cần làm lại trước khi BA đưa vào SRS. */
  readyScore: 60,
  priorities: ["MUST", "SHOULD", "COULD", "WONT"] as const,
  nfrCategories: [
    "PERFORMANCE",
    "SECURITY",
    "PRIVACY",
    "USABILITY",
    "RELIABILITY",
    "AVAILABILITY",
    "MAINTAINABILITY",
    "COMPATIBILITY",
    "COMPLIANCE",
  ] as const,
  /** Từ ngữ mơ hồ, không kiểm chứng được. Viết thường, có dấu. */
  ambiguousTerms: [
    "nhanh",
    "nhanh chóng",
    "dễ dùng",
    "dễ sử dụng",
    "thân thiện",
    "tối ưu",
    "hiệu quả",
    "linh hoạt",
    "phù hợp",
    "hợp lý",
    "mượt",
    "hiện đại",
    "một số",
    "v.v",
    "vân vân",
    "nếu có thể",
    "khi cần thiết",
    "user friendly",
  ],
  /** Dấu hiệu yêu cầu liên quan AI (văn bản đã bỏ dấu). */
  aiMarkers: ["ai", "tri tue nhan tao", "llm", "mo hinh ngon ngu", "machine learning"],
  /** Dấu hiệu đã quy định con người rà soát (văn bản đã bỏ dấu). */
  humanReviewMarkers: ["ra soat", "duyet", "phe duyet", "xac nhan", "kiem tra lai", "human review", "nguoi phu trach"],
  /** Checklist BA phải tự đánh dấu trước khi đưa bản nháp vào SRS. */
  reviewChecklist: [
    "Đối chiếu từng yêu cầu với mô tả nghiệp vụ gốc; xoá yêu cầu AI tự suy diễn không có căn cứ.",
    "Xử lý mọi phát hiện mức error trong reviewFindings.",
    "Với yêu cầu bị đánh dấu có thể trùng, quyết định gộp vào yêu cầu đã chốt hay tách thành yêu cầu con.",
    "Hỏi lại người dùng nghiệp vụ các câu trong clarificationQuestions; ghi câu trả lời vào SRS.",
    "Thay số liệu đề xuất trong assumptions bằng số liệu được bên liên quan xác nhận.",
    "Cấp mã chính thức (FR-xx/NFR-xx/UC-xx) khi đưa vào SRS; không dùng mã DRAFT-* trong tài liệu chính thức.",
    "Cập nhật ma trận truy vết và requirements-baseline.ts nếu thêm yêu cầu mới.",
  ],
});

export type RequirementPriority = (typeof REQUIREMENTS_DRAFT_POLICY.priorities)[number];
export type NfrCategory = (typeof REQUIREMENTS_DRAFT_POLICY.nfrCategories)[number];
