import { AiService } from "../src/integrations/ai/ai.service";
import { RequirementsDraftInput } from "../src/integrations/ai/ai.types";
import { REQUIREMENTS_BASELINE } from "../src/integrations/ai/requirements-baseline";
import { normalizeText, redactPersonalData, reviewRequirementsDraft } from "../src/integrations/ai/requirements-draft.review";

const review = (raw: unknown, maxRequirements?: number) =>
  reviewRequirementsDraft(raw, { baseline: REQUIREMENTS_BASELINE, maxRequirements });

const codesFor = (draft: ReturnType<typeof review>, targetId: string | null) =>
  draft.reviewFindings.filter((f) => f.targetId === targetId).map((f) => f.code);

/** Bản nháp "sạch" mà LLM có thể trả về – dùng làm nền cho các test. */
function cleanLlmDraft() {
  return {
    summary: "Nhắc lịch phiên cho người tham dự.",
    assumptions: ["[đề xuất] Nhắc trước 30 phút."],
    functionalRequirements: [
      {
        id: "FR-1",
        title: "Đăng ký nhận nhắc lịch phiên",
        description: "Người tham dự có thể bật nhắc lịch cho từng phiên đã chọn.",
        actor: "Người tham dự",
        priority: "MUST",
        acceptanceCriteria: [
          "Cho người tham dự đã đăng ký sự kiện, khi bật nhắc cho một phiên, thì phiên xuất hiện trong danh sách nhắc của họ.",
          "Cho phiên đã kết thúc, khi bật nhắc, thì hệ thống từ chối và hiển thị lý do.",
        ],
        relatedBaselineIds: ["FR-03"],
      },
    ],
    nonFunctionalRequirements: [
      { id: "NFR-1", category: "RELIABILITY", description: "Thông báo nhắc được gửi trước giờ phiên 30 phút, sai lệch tối đa 2 phút.", metric: "≥ 99% thông báo đúng hạn" },
    ],
    useCases: [
      { id: "UC-1", name: "Bật nhắc lịch phiên", primaryActor: "Người tham dự", mainFlow: ["Mở lịch trình", "Chọn phiên", "Bật nhắc"], relatedRequirementIds: ["FR-1"] },
    ],
    clarificationQuestions: [{ question: "Nhắc qua email hay thông báo trong ứng dụng?", reason: "Ảnh hưởng chi phí", relatedIds: ["FR-1"] }],
  };
}

describe("redactPersonalData", () => {
  it("masks emails, Vietnamese phone numbers and ID numbers but keeps ordinary numbers", () => {
    const counts = { emails: 0, phones: 0, idNumbers: 0 };
    const text = redactPersonalData(
      "Liên hệ an.nguyen@example.com, 0912 345 678 hoặc +84912345678; CCCD 001095012345; sự kiện 500 người, năm 2026.",
      counts,
    );

    expect(text).not.toMatch(/example\.com|0912|84912345678|001095012345/);
    expect(text).toContain("500 người");
    expect(text).toContain("2026");
    expect(counts).toEqual({ emails: 1, phones: 2, idNumbers: 1 });
  });
});

describe("reviewRequirementsDraft", () => {
  it("baseline ids are unique and phrases are already normalized", () => {
    const ids = REQUIREMENTS_BASELINE.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of REQUIREMENTS_BASELINE) {
      for (const phrase of item.phrases) expect(normalizeText(phrase)).toBe(phrase);
    }
  });

  it("accepts a clean draft, assigns DRAFT ids and remaps use-case references", () => {
    const draft = review(cleanLlmDraft());

    expect(draft.status).toBe("DRAFT_PENDING_BA_REVIEW");
    expect(draft.functionalRequirements[0]).toMatchObject({ id: "DRAFT-FR-01", sourceId: "FR-1", priority: "MUST", relatedBaselineIds: ["FR-03"] });
    expect(draft.useCases[0].relatedRequirementIds).toEqual(["DRAFT-FR-01"]);
    expect(draft.traceability).toEqual([{ requirementId: "DRAFT-FR-01", useCaseIds: ["DRAFT-UC-01"], baselineIds: ["FR-03"] }]);
    expect(draft.clarificationQuestions[0].relatedIds).toEqual(["DRAFT-FR-01"]);
    expect(draft.quality).toMatchObject({ score: 100, readiness: "READY_FOR_BA_REVIEW" });
    expect(draft.srsMarkdown).toContain("CHƯA ĐƯỢC BA DUYỆT");
    expect(draft.srsMarkdown).toContain("| DRAFT-FR-01 |");
  });

  it("flags missing acceptance criteria and ambiguous wording", () => {
    const llm = cleanLlmDraft();
    llm.functionalRequirements[0].description = "Hệ thống gửi nhắc lịch nhanh chóng và thân thiện.";
    llm.functionalRequirements[0].acceptanceCriteria = [];

    const draft = review(llm);
    const codes = codesFor(draft, "DRAFT-FR-01");

    expect(codes).toEqual(expect.arrayContaining(["FR_MISSING_ACCEPTANCE_CRITERIA", "AMBIGUOUS_TERM"]));
    expect(draft.reviewFindings.find((f) => f.code === "AMBIGUOUS_TERM")?.message).toContain("nhanh chóng");
    expect(draft.quality.readiness).toBe("NEEDS_REWORK");
  });

  it("does not treat words that merely share letters with an ambiguous term as ambiguous", () => {
    const llm = cleanLlmDraft();
    llm.functionalRequirements[0].description = "Người tham dự có thể bật nhắc cho phiên ở phòng phụ hợp tác.";
    expect(codesFor(review(llm), "DRAFT-FR-01")).not.toContain("AMBIGUOUS_TERM");
  });

  it("detects a requirement that likely duplicates the approved SRS", () => {
    const llm = cleanLlmDraft();
    llm.functionalRequirements.push({
      id: "FR-2",
      title: "Đăng ký tham dự",
      description: "Người dùng đăng ký tham dự sự kiện; hệ thống chặn khi hết sức chứa và cho phép hủy đăng ký.",
      actor: "Người tham dự",
      priority: "MUST",
      acceptanceCriteria: ["Cho sự kiện còn chỗ, khi đăng ký, thì tạo vé.", "Cho sự kiện hết chỗ, khi đăng ký, thì báo lỗi."],
      relatedBaselineIds: [],
    });

    const fr2 = review(llm).functionalRequirements[1];

    expect(fr2.possibleDuplicateOf).toMatchObject({ id: "FR-04" });
    expect(fr2.possibleDuplicateOf?.matchedPhrases).toEqual(expect.arrayContaining(["dang ky tham du", "suc chua", "huy dang ky"]));
    expect(fr2.relatedBaselineIds).toContain("FR-04");
  });

  it("downgrades the duplicate warning to info when the AI declared the requirement as an extension", () => {
    const llm = cleanLlmDraft();
    llm.functionalRequirements[0].description =
      "Người tham dự đăng ký tham dự lại sau khi huỷ đăng ký nếu sự kiện còn sức chứa.";
    llm.functionalRequirements[0].relatedBaselineIds = ["FR-04"];

    const finding = review(llm).reviewFindings.find((f) => f.code === "POSSIBLE_DUPLICATE_OF_BASELINE");

    expect(finding).toMatchObject({ severity: "info", targetId: "DRAFT-FR-01" });
  });

  it("requires human review wording on AI requirements (project NFR)", () => {
    const llm = cleanLlmDraft();
    llm.functionalRequirements[0].description = "AI tự động sắp xếp lại lịch trình khi diễn giả đến muộn.";
    expect(codesFor(review(llm), "DRAFT-FR-01")).toContain("AI_REQUIREMENT_WITHOUT_HUMAN_REVIEW");

    llm.functionalRequirements[0].description = "AI đề xuất lịch trình thay thế; Chủ sự kiện duyệt trước khi áp dụng.";
    expect(codesFor(review(llm), "DRAFT-FR-01")).not.toContain("AI_REQUIREMENT_WITHOUT_HUMAN_REVIEW");
  });

  it("normalizes bad structure: invalid priority, unmeasurable NFR, unknown references, missing main flow", () => {
    const draft = review({
      functionalRequirements: [
        { id: "FR-1", description: "Ban tổ chức có thể xuất danh sách người đã check-in ra CSV.", priority: "cao", acceptanceCriteria: ["a", "b"], relatedBaselineIds: ["FR-99"] },
        { id: "FR-2" },
      ],
      nonFunctionalRequirements: ["Hệ thống phải ổn định."],
      useCases: [{ id: "UC-1", name: "Xuất danh sách", relatedRequirementIds: ["FR-1", "FR-7"] }],
    });

    expect(draft.functionalRequirements).toHaveLength(1);
    expect(draft.functionalRequirements[0].priority).toBe("SHOULD");
    expect(draft.functionalRequirements[0].relatedBaselineIds).toEqual([]);
    expect(draft.useCases[0].relatedRequirementIds).toEqual(["DRAFT-FR-01"]);
    expect(draft.reviewFindings.map((f) => f.code)).toEqual(
      expect.arrayContaining([
        "INVALID_PRIORITY",
        "UNKNOWN_BASELINE_REFERENCE",
        "DROPPED_INVALID_ITEM",
        "NFR_NOT_MEASURABLE",
        "UC_MISSING_MAIN_FLOW",
        "UC_UNKNOWN_REQUIREMENT",
        "NO_CLARIFICATION_QUESTIONS",
      ]),
    );
  });

  it("truncates to maxRequirements and reports it", () => {
    const llm = cleanLlmDraft();
    const base = llm.functionalRequirements[0];
    llm.functionalRequirements = Array.from({ length: 5 }, (_, i) => ({ ...base, id: `FR-${i + 1}`, title: `Yêu cầu ${i + 1} khác biệt số ${i}` }));

    const draft = review(llm, 3);

    expect(draft.functionalRequirements).toHaveLength(3);
    expect(draft.reviewFindings.map((f) => f.code)).toContain("TRUNCATED_TO_LIMIT");
  });

  it("never crashes on non-object LLM output", () => {
    for (const raw of [null, "text", 42, [], { functionalRequirements: "x" }]) {
      const draft = review(raw);
      expect(draft.quality.readiness).toBe("NEEDS_REWORK");
      expect(draft.reviewFindings.map((f) => f.code)).toContain("NO_FUNCTIONAL_REQUIREMENTS");
    }
  });
});

describe("AiService.requirementsDraft", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.AI_API_KEY;

  beforeEach(() => {
    process.env.AI_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  });

  it("sends redacted input plus the baseline to the provider and returns a reviewed draft", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(cleanLlmDraft()) } }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const input: RequirementsDraftInput = {
      problemStatement: "Chị Lan (lan@example.com, 0987654321) muốn người tham dự được nhắc lịch phiên.",
      targetUsers: "Người tham dự",
      moduleName: "Lịch trình",
    };
    const response = await new AiService().requirementsDraft(input);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const userPayload = JSON.parse(body.messages[1].content);
    expect(body.messages[1].content).not.toMatch(/lan@example\.com|0987654321/);
    expect(userPayload.problemStatement).toContain("[EMAIL]");
    expect(userPayload.maxRequirements).toBe(10);
    expect(userPayload.baseline).toEqual(expect.arrayContaining([{ id: "FR-11", title: expect.any(String) }]));

    expect(response.requiresHumanReview).toBe(true);
    const result = response.result;
    expect(result.status).toBe("DRAFT_PENDING_BA_REVIEW");
    expect(result.redactions).toEqual({ emails: 1, phones: 1, idNumbers: 0 });
    expect(result.reviewFindings.map((f) => f.code)).toContain("PII_REDACTED");
  });
});
