/**
 * Hậu kiểm bản nháp yêu cầu do AI tạo (TV2 – BA).
 *
 * LLM chỉ đề xuất; module này (thuần hàm, không gọi mạng/DB) chuẩn hoá cấu trúc, cấp mã nháp,
 * phát hiện yêu cầu mơ hồ / thiếu tiêu chí chấp nhận / trùng SRS đã chốt / vi phạm chính sách AI,
 * dựng ma trận truy vết FR ↔ UC và xuất đoạn Markdown để BA rà soát rồi mới đưa vào SRS.
 */
import { BaselineRequirement } from "./requirements-baseline";
import { NfrCategory, REQUIREMENTS_DRAFT_POLICY, RequirementPriority } from "./requirements-draft.policy";

type Policy = typeof REQUIREMENTS_DRAFT_POLICY;

export type FindingSeverity = "error" | "warning" | "info";

export type FindingCode =
  | "PII_REDACTED"
  | "DROPPED_INVALID_ITEM"
  | "TRUNCATED_TO_LIMIT"
  | "INVALID_PRIORITY"
  | "INVALID_NFR_CATEGORY"
  | "AMBIGUOUS_TERM"
  | "FR_MISSING_ACCEPTANCE_CRITERIA"
  | "AI_REQUIREMENT_WITHOUT_HUMAN_REVIEW"
  | "POSSIBLE_DUPLICATE_OF_BASELINE"
  | "DUPLICATE_WITHIN_DRAFT"
  | "UNKNOWN_BASELINE_REFERENCE"
  | "NFR_NOT_MEASURABLE"
  | "UC_MISSING_MAIN_FLOW"
  | "UC_UNKNOWN_REQUIREMENT"
  | "FR_NOT_COVERED_BY_USE_CASE"
  | "NO_CLARIFICATION_QUESTIONS"
  | "NO_FUNCTIONAL_REQUIREMENTS";

export type ReviewFinding = {
  code: FindingCode;
  severity: FindingSeverity;
  /** Mã nháp (DRAFT-FR-01…) hoặc null nếu phát hiện ở mức toàn bản nháp. */
  targetId: string | null;
  message: string;
};

export type RedactionCounts = { emails: number; phones: number; idNumbers: number };

export type DraftFunctionalRequirement = {
  id: string;
  /** Mã LLM tự đặt, giữ lại để đối chiếu. */
  sourceId: string | null;
  title: string;
  description: string;
  actor: string | null;
  priority: RequirementPriority;
  acceptanceCriteria: string[];
  relatedBaselineIds: string[];
  possibleDuplicateOf: { id: string; title: string; ratio: number; matchedPhrases: string[] } | null;
};

export type DraftNonFunctionalRequirement = {
  id: string;
  sourceId: string | null;
  category: NfrCategory;
  description: string;
  metric: string | null;
};

export type DraftUseCase = {
  id: string;
  sourceId: string | null;
  name: string;
  primaryActor: string | null;
  preconditions: string[];
  mainFlow: string[];
  alternativeFlows: string[];
  postconditions: string[];
  relatedRequirementIds: string[];
};

export type ReviewedRequirementsDraft = {
  status: "DRAFT_PENDING_BA_REVIEW";
  summary: string;
  moduleName: string | null;
  redactions: RedactionCounts;
  assumptions: string[];
  outOfScope: string[];
  functionalRequirements: DraftFunctionalRequirement[];
  nonFunctionalRequirements: DraftNonFunctionalRequirement[];
  useCases: DraftUseCase[];
  businessRules: string[];
  businessRisks: Array<{ description: string; probability: string | null; impact: string | null; mitigation: string | null }>;
  clarificationQuestions: Array<{ question: string; reason: string | null; relatedIds: string[] }>;
  traceability: Array<{ requirementId: string; useCaseIds: string[]; baselineIds: string[] }>;
  reviewFindings: ReviewFinding[];
  quality: {
    score: number;
    readiness: "READY_FOR_BA_REVIEW" | "NEEDS_REWORK";
    counts: Record<FindingSeverity, number>;
  };
  reviewChecklist: string[];
  srsMarkdown: string;
};

// ---------------------------------------------------------------------------
// Che dữ liệu cá nhân trước khi gửi nhà cung cấp AI (rủi ro R-06)
// ---------------------------------------------------------------------------

const EMAIL_RE = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
/** Số điện thoại Việt Nam: 0xxxxxxxxx hoặc +84/84 xxxxxxxxx, cho phép dấu cách/chấm/gạch giữa các nhóm số. */
const PHONE_RE = /(?<![\p{N}])(?:\+?84|0)(?:[ .-]?\d){9}(?![\p{N}])/gu;
/** CMND 9 số hoặc CCCD 12 số đứng riêng. */
const ID_NUMBER_RE = /(?<![\p{N}])(?:\d{12}|\d{9})(?![\p{N}])/gu;

export function redactPersonalData(text: string, counts: RedactionCounts): string {
  return text
    .replace(EMAIL_RE, () => {
      counts.emails += 1;
      return "[EMAIL]";
    })
    .replace(PHONE_RE, () => {
      counts.phones += 1;
      return "[SỐ ĐIỆN THOẠI]";
    })
    .replace(ID_NUMBER_RE, () => {
      counts.idNumbers += 1;
      return "[SỐ GIẤY TỜ]";
    });
}

// ---------------------------------------------------------------------------
// Chuẩn hoá văn bản
// ---------------------------------------------------------------------------

/** Chữ thường, bỏ dấu tiếng Việt, chỉ giữ chữ/số, các từ cách nhau một khoảng trắng. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Chữ thường, GIỮ dấu, chỉ giữ chữ/số – dùng tìm từ mơ hồ tiếng Việt chính xác ("phù hợp" ≠ "phụ hợp"). */
function normalizeKeepDiacritics(text: string): string {
  return text.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function containsPhrase(normalized: string, phrase: string): boolean {
  return ` ${normalized} `.includes(` ${phrase} `);
}

const STOPWORDS = new Set(
  "va cua cho cac duoc co khi de theo trong voi la mot nhung nay do thi tu den tai ve bi se da dang nguoi he thong phai can".split(" "),
);

function tokenSet(text: string): Set<string> {
  return new Set(normalizeText(text).split(" ").filter((t) => t.length > 1 && !STOPWORDS.has(t)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

// ---------------------------------------------------------------------------
// Đọc an toàn dữ liệu LLM trả về
// ---------------------------------------------------------------------------

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asText = (value: unknown, max = 1000): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

const asTextList = (value: unknown, maxItems = 20, maxLength = 500): string[] =>
  Array.isArray(value)
    ? value.map((item) => asText(item, maxLength)).filter((item): item is string => item !== null).slice(0, maxItems)
    : typeof value === "string" && value.trim()
      ? [value.trim().slice(0, maxLength)]
      : [];

const pad2 = (n: number) => String(n).padStart(2, "0");

// ---------------------------------------------------------------------------
// Rà soát
// ---------------------------------------------------------------------------

export type ReviewContext = {
  baseline: readonly BaselineRequirement[];
  policy?: Policy;
  maxRequirements?: number;
  moduleName?: string | null;
  redactions?: RedactionCounts;
};

export function reviewRequirementsDraft(raw: unknown, context: ReviewContext): ReviewedRequirementsDraft {
  const policy = context.policy ?? REQUIREMENTS_DRAFT_POLICY;
  const maxRequirements = context.maxRequirements ?? policy.defaultMaxRequirements;
  const redactions = context.redactions ?? { emails: 0, phones: 0, idNumbers: 0 };
  const baselineById = new Map(context.baseline.map((item) => [item.id, item]));
  const result = asRecord(raw) ?? {};
  const findings: ReviewFinding[] = [];
  const add = (code: FindingCode, severity: FindingSeverity, targetId: string | null, message: string) =>
    findings.push({ code, severity, targetId, message });

  const redactedTotal = redactions.emails + redactions.phones + redactions.idNumbers;
  if (redactedTotal > 0) {
    add(
      "PII_REDACTED",
      "info",
      null,
      `Đã che ${redactedTotal} dữ liệu cá nhân trong đầu vào trước khi gửi AI (email: ${redactions.emails}, SĐT: ${redactions.phones}, số giấy tờ: ${redactions.idNumbers}).`,
    );
  }

  // Bảng ánh xạ mã LLM tự đặt -> mã nháp do backend cấp, để sửa tham chiếu trong use case.
  const idMap = new Map<string, string>();
  const mapRef = (ref: string) => idMap.get(ref.trim().toUpperCase()) ?? null;

  // ---- Yêu cầu chức năng ----
  const rawFrs = Array.isArray(result.functionalRequirements) ? result.functionalRequirements : [];
  if (rawFrs.length > maxRequirements) {
    add("TRUNCATED_TO_LIMIT", "info", null, `AI trả ${rawFrs.length} yêu cầu chức năng; chỉ giữ ${maxRequirements} yêu cầu đầu theo giới hạn.`);
  }
  const functionalRequirements: DraftFunctionalRequirement[] = [];
  for (const [index, rawItem] of rawFrs.slice(0, maxRequirements).entries()) {
    const item = asRecord(rawItem);
    const description = asText(item?.description, 1500);
    if (!item || !description) {
      add("DROPPED_INVALID_ITEM", "warning", null, `Bỏ yêu cầu chức năng thứ ${index + 1} vì thiếu mô tả.`);
      continue;
    }
    const id = `DRAFT-FR-${pad2(functionalRequirements.length + 1)}`;
    const sourceId = asText(item.id, 50);
    if (sourceId) idMap.set(sourceId.toUpperCase(), id);

    const rawPriority = typeof item.priority === "string" ? item.priority.trim().toUpperCase() : "";
    const priority = (policy.priorities as readonly string[]).includes(rawPriority) ? (rawPriority as RequirementPriority) : "SHOULD";
    if (priority !== rawPriority) {
      add("INVALID_PRIORITY", "info", id, `Độ ưu tiên "${String(item.priority ?? "")}" không thuộc MoSCoW; tạm đặt SHOULD.`);
    }

    const relatedBaselineIds: string[] = [];
    for (const ref of asTextList(item.relatedBaselineIds, 10, 20)) {
      const normalized = ref.toUpperCase();
      if (baselineById.has(normalized)) relatedBaselineIds.push(normalized);
      else add("UNKNOWN_BASELINE_REFERENCE", "info", id, `Bỏ tham chiếu "${ref}" vì không có trong SRS đã chốt.`);
    }

    functionalRequirements.push({
      id,
      sourceId,
      title: asText(item.title, 200) ?? description.slice(0, 80),
      description,
      actor: asText(item.actor, 200),
      priority,
      acceptanceCriteria: asTextList(item.acceptanceCriteria, 10, 600),
      relatedBaselineIds: [...new Set(relatedBaselineIds)],
      possibleDuplicateOf: null,
    });
  }
  if (functionalRequirements.length === 0) {
    add("NO_FUNCTIONAL_REQUIREMENTS", "error", null, "Bản nháp không có yêu cầu chức năng hợp lệ nào.");
  }

  for (const fr of functionalRequirements) {
    const fullText = [fr.title, fr.description, ...fr.acceptanceCriteria].join(" ");
    const normalized = normalizeText(fullText);

    if (fr.acceptanceCriteria.length === 0) {
      add("FR_MISSING_ACCEPTANCE_CRITERIA", "error", fr.id, "Thiếu tiêu chí chấp nhận nên không kiểm thử được.");
    }

    const ambiguous = findAmbiguousTerms([fr.description, ...fr.acceptanceCriteria].join(" "), policy);
    if (ambiguous.length > 0) {
      add("AMBIGUOUS_TERM", "warning", fr.id, `Có từ mơ hồ, cần thay bằng tiêu chí đo được: ${ambiguous.map((t) => `"${t}"`).join(", ")}.`);
    }

    const mentionsAi = policy.aiMarkers.some((marker) => containsPhrase(normalized, marker));
    const mentionsReview = policy.humanReviewMarkers.some((marker) => containsPhrase(normalized, marker));
    if (mentionsAi && !mentionsReview) {
      add(
        "AI_REQUIREMENT_WITHOUT_HUMAN_REVIEW",
        "error",
        fr.id,
        "Yêu cầu có dùng AI nhưng không quy định người phụ trách rà soát/duyệt kết quả – trái NFR-AI của SRS.",
      );
    }

    const duplicate = findBaselineDuplicate(normalized, context.baseline, policy);
    if (duplicate) {
      fr.possibleDuplicateOf = duplicate;
      // AI đã tự khai báo là mở rộng yêu cầu này → chỉ nhắc BA kiểm tra phần lặp (info); chưa khai báo → cảnh báo.
      const declaredExtension = fr.relatedBaselineIds.includes(duplicate.id);
      if (!declaredExtension) fr.relatedBaselineIds.push(duplicate.id);
      add(
        "POSSIBLE_DUPLICATE_OF_BASELINE",
        declaredExtension ? "info" : "warning",
        fr.id,
        declaredExtension
          ? `Mở rộng ${duplicate.id} "${duplicate.title}"; kiểm tra không viết lại phần đã có (khớp: ${duplicate.matchedPhrases.join(", ")}).`
          : `Có thể trùng ${duplicate.id} "${duplicate.title}" (khớp ${duplicate.matchedPhrases.length} cụm: ${duplicate.matchedPhrases.join(", ")}). BA quyết định gộp hay tách yêu cầu con.`,
      );
    }
  }

  const frTokens = functionalRequirements.map((fr) => tokenSet(`${fr.title} ${fr.description}`));
  for (let i = 0; i < functionalRequirements.length; i += 1) {
    for (let j = i + 1; j < functionalRequirements.length; j += 1) {
      if (jaccard(frTokens[i], frTokens[j]) >= policy.internalDuplicateJaccard) {
        add("DUPLICATE_WITHIN_DRAFT", "warning", functionalRequirements[j].id, `Gần như trùng ${functionalRequirements[i].id}; nên gộp.`);
      }
    }
  }

  // ---- Yêu cầu phi chức năng ----
  const nonFunctionalRequirements: DraftNonFunctionalRequirement[] = [];
  const rawNfrs = Array.isArray(result.nonFunctionalRequirements) ? result.nonFunctionalRequirements : [];
  for (const [index, rawItem] of rawNfrs.slice(0, policy.maxNonFunctional).entries()) {
    // Chấp nhận cả dạng chuỗi (prompt phiên bản cũ) lẫn object.
    const item = typeof rawItem === "string" ? { description: rawItem } : asRecord(rawItem);
    const description = asText(item?.description, 1000);
    if (!item || !description) {
      add("DROPPED_INVALID_ITEM", "warning", null, `Bỏ yêu cầu phi chức năng thứ ${index + 1} vì thiếu mô tả.`);
      continue;
    }
    const id = `DRAFT-NFR-${pad2(nonFunctionalRequirements.length + 1)}`;
    const sourceId = asText(item.id, 50);
    if (sourceId) idMap.set(sourceId.toUpperCase(), id);
    const rawCategory = typeof item.category === "string" ? item.category.trim().toUpperCase() : "";
    const category = (policy.nfrCategories as readonly string[]).includes(rawCategory) ? (rawCategory as NfrCategory) : "USABILITY";
    if (category !== rawCategory) {
      add("INVALID_NFR_CATEGORY", "info", id, `Nhóm "${String(item.category ?? "")}" không hợp lệ; tạm đặt USABILITY, BA cần phân loại lại.`);
    }
    const metric = asText(item.metric, 300);
    if (!/\d/.test(`${description} ${metric ?? ""}`)) {
      add("NFR_NOT_MEASURABLE", "warning", id, "Chưa có chỉ số đo được (thời gian, tỷ lệ, số lượng…); khó nghiệm thu.");
    }
    const ambiguous = findAmbiguousTerms(description, policy);
    if (ambiguous.length > 0) {
      add("AMBIGUOUS_TERM", "warning", id, `Có từ mơ hồ: ${ambiguous.map((t) => `"${t}"`).join(", ")}.`);
    }
    nonFunctionalRequirements.push({ id, sourceId, category, description, metric });
  }

  // ---- Use case ----
  const knownIds = new Set([...functionalRequirements.map((fr) => fr.id), ...nonFunctionalRequirements.map((n) => n.id)]);
  const useCases: DraftUseCase[] = [];
  const rawUcs = Array.isArray(result.useCases) ? result.useCases : [];
  for (const [index, rawItem] of rawUcs.slice(0, policy.maxUseCases).entries()) {
    const item = asRecord(rawItem);
    const name = asText(item?.name, 200);
    if (!item || !name) {
      add("DROPPED_INVALID_ITEM", "warning", null, `Bỏ use case thứ ${index + 1} vì thiếu tên.`);
      continue;
    }
    const id = `DRAFT-UC-${pad2(useCases.length + 1)}`;
    const mainFlow = asTextList(item.mainFlow, 15, 400);
    if (mainFlow.length === 0) add("UC_MISSING_MAIN_FLOW", "error", id, "Use case chưa có luồng chính.");

    const relatedRequirementIds: string[] = [];
    for (const ref of asTextList(item.relatedRequirementIds, 15, 50)) {
      const mapped = mapRef(ref) ?? (knownIds.has(ref.toUpperCase()) ? ref.toUpperCase() : null);
      if (mapped) relatedRequirementIds.push(mapped);
      else add("UC_UNKNOWN_REQUIREMENT", "warning", id, `Bỏ tham chiếu "${ref}" vì không có yêu cầu tương ứng trong bản nháp.`);
    }
    useCases.push({
      id,
      sourceId: asText(item.id, 50),
      name,
      primaryActor: asText(item.primaryActor ?? item.actor, 200),
      preconditions: asTextList(item.preconditions, 10, 400),
      mainFlow,
      alternativeFlows: asTextList(item.alternativeFlows, 10, 400),
      postconditions: asTextList(item.postconditions ?? item.result, 10, 400),
      relatedRequirementIds: [...new Set(relatedRequirementIds)],
    });
  }

  const traceability = functionalRequirements.map((fr) => ({
    requirementId: fr.id,
    useCaseIds: useCases.filter((uc) => uc.relatedRequirementIds.includes(fr.id)).map((uc) => uc.id),
    baselineIds: fr.relatedBaselineIds,
  }));
  for (const row of traceability) {
    if (row.useCaseIds.length === 0) {
      add("FR_NOT_COVERED_BY_USE_CASE", "info", row.requirementId, "Chưa có use case nào bao phủ yêu cầu này.");
    }
  }

  // ---- Câu hỏi làm rõ & các phần còn lại ----
  const clarificationQuestions = (Array.isArray(result.clarificationQuestions) ? result.clarificationQuestions : [])
    .slice(0, 15)
    .map((rawItem) => {
      const item = typeof rawItem === "string" ? { question: rawItem } : asRecord(rawItem);
      const question = asText(item?.question, 500);
      if (!item || !question) return null;
      return {
        question,
        reason: asText(item.reason, 500),
        relatedIds: asTextList(item.relatedIds, 10, 50).map((ref) => mapRef(ref) ?? ref),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  if (clarificationQuestions.length === 0) {
    add("NO_CLARIFICATION_QUESTIONS", "info", null, "AI không nêu câu hỏi cần làm rõ; BA nên tự kiểm tra giả định trước khi chốt.");
  }

  const businessRisks = (Array.isArray(result.businessRisks) ? result.businessRisks : [])
    .slice(0, 10)
    .map((rawItem) => {
      const item = asRecord(rawItem);
      const description = asText(item?.description, 500);
      return item && description
        ? { description, probability: asText(item.probability, 30), impact: asText(item.impact, 30), mitigation: asText(item.mitigation, 500) }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // ---- Điểm chất lượng ----
  const counts: Record<FindingSeverity, number> = { error: 0, warning: 0, info: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  const score = Math.max(0, 100 - counts.error * policy.penalty.error - counts.warning * policy.penalty.warning - counts.info * policy.penalty.info);
  const readiness = counts.error === 0 && score >= policy.readyScore ? "READY_FOR_BA_REVIEW" : "NEEDS_REWORK";

  const reviewed: Omit<ReviewedRequirementsDraft, "srsMarkdown"> = {
    status: "DRAFT_PENDING_BA_REVIEW",
    summary: asText(result.summary, 1500) ?? "",
    moduleName: context.moduleName ?? null,
    redactions,
    assumptions: asTextList(result.assumptions, 20, 500),
    outOfScope: asTextList(result.outOfScope, 15, 500),
    functionalRequirements,
    nonFunctionalRequirements,
    useCases,
    businessRules: asTextList(result.businessRules, 20, 500),
    businessRisks,
    clarificationQuestions,
    traceability,
    reviewFindings: findings,
    quality: { score, readiness, counts },
    reviewChecklist: [...policy.reviewChecklist],
  };
  return { ...reviewed, srsMarkdown: renderSrsMarkdown(reviewed) };
}

function findAmbiguousTerms(text: string, policy: Policy): string[] {
  const normalized = normalizeKeepDiacritics(text);
  return policy.ambiguousTerms.filter((term) => containsPhrase(normalized, normalizeKeepDiacritics(term)));
}

function findBaselineDuplicate(normalizedText: string, baseline: readonly BaselineRequirement[], policy: Policy) {
  let best: DraftFunctionalRequirement["possibleDuplicateOf"] = null;
  for (const item of baseline) {
    const matchedPhrases = item.phrases.filter((phrase) => containsPhrase(normalizedText, phrase));
    const ratio = item.phrases.length ? matchedPhrases.length / item.phrases.length : 0;
    if (
      matchedPhrases.length >= policy.baselineDuplicateMinPhrases &&
      ratio >= policy.baselineDuplicateRatio &&
      (!best || ratio > best.ratio)
    ) {
      best = { id: item.id, title: item.title, ratio: Math.round(ratio * 100) / 100, matchedPhrases };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Xuất Markdown cho BA dán vào tài liệu rà soát
// ---------------------------------------------------------------------------

const cell = (value: string | null | undefined) => (value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");

function renderSrsMarkdown(draft: Omit<ReviewedRequirementsDraft, "srsMarkdown">): string {
  const lines: string[] = [];
  lines.push(`# Bản nháp yêu cầu${draft.moduleName ? ` – ${draft.moduleName}` : ""}`);
  lines.push("");
  lines.push("> **BẢN NHÁP DO AI TẠO – CHƯA ĐƯỢC BA DUYỆT.** Không đưa vào SRS khi chưa xử lý các phát hiện mức error và chưa xác nhận giả định.");
  lines.push(`> Điểm chất lượng: **${draft.quality.score}/100** – ${draft.quality.readiness === "READY_FOR_BA_REVIEW" ? "sẵn sàng để BA rà soát" : "cần làm lại"}.`);
  lines.push("");
  if (draft.summary) lines.push(draft.summary, "");

  lines.push("## Yêu cầu chức năng", "");
  lines.push("| Mã nháp | Tên | Tác nhân | Ưu tiên | Tiêu chí chấp nhận | Liên quan SRS |");
  lines.push("|---|---|---|---|---|---|");
  for (const fr of draft.functionalRequirements) {
    lines.push(
      `| ${fr.id} | ${cell(fr.title)}<br>${cell(fr.description)} | ${cell(fr.actor)} | ${fr.priority} | ${cell(fr.acceptanceCriteria.map((c) => `• ${c}`).join("\n"))} | ${fr.relatedBaselineIds.join(", ")} |`,
    );
  }
  lines.push("");

  if (draft.nonFunctionalRequirements.length) {
    lines.push("## Yêu cầu phi chức năng", "");
    lines.push("| Mã nháp | Nhóm | Mô tả | Chỉ số |");
    lines.push("|---|---|---|---|");
    for (const nfr of draft.nonFunctionalRequirements) {
      lines.push(`| ${nfr.id} | ${nfr.category} | ${cell(nfr.description)} | ${cell(nfr.metric)} |`);
    }
    lines.push("");
  }

  for (const uc of draft.useCases) {
    lines.push(`## ${uc.id}: ${uc.name}`, "");
    lines.push(`- **Tác nhân chính:** ${uc.primaryActor ?? "(chưa rõ)"}`);
    lines.push(`- **Yêu cầu liên quan:** ${uc.relatedRequirementIds.join(", ") || "(chưa có)"}`);
    if (uc.preconditions.length) lines.push(`- **Tiền điều kiện:** ${uc.preconditions.join("; ")}`);
    lines.push("- **Luồng chính:**");
    uc.mainFlow.forEach((step, i) => lines.push(`  ${i + 1}. ${step}`));
    if (uc.alternativeFlows.length) lines.push(`- **Luồng thay thế:** ${uc.alternativeFlows.join("; ")}`);
    if (uc.postconditions.length) lines.push(`- **Hậu điều kiện:** ${uc.postconditions.join("; ")}`);
    lines.push("");
  }

  const bullet = (title: string, items: string[]) => {
    if (!items.length) return;
    lines.push(`## ${title}`, "");
    for (const item of items) lines.push(`- ${item}`);
    lines.push("");
  };
  bullet("Giả định cần xác nhận", draft.assumptions);
  bullet("Câu hỏi cần làm rõ", draft.clarificationQuestions.map((q) => `${q.question}${q.reason ? ` _(lý do: ${q.reason})_` : ""}`));
  bullet("Quy tắc nghiệp vụ", draft.businessRules);
  bullet("Ngoài phạm vi", draft.outOfScope);
  bullet(
    "Phát hiện khi rà soát tự động",
    draft.reviewFindings.map((f) => `**${f.severity.toUpperCase()}** \`${f.code}\`${f.targetId ? ` (${f.targetId})` : ""}: ${f.message}`),
  );
  return lines.join("\n").trimEnd() + "\n";
}
