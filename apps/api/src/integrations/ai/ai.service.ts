import { BadGatewayException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  BudgetEstimateInput,
  CheckInAnalysisInput,
  ProjectSummaryInput,
  RequirementsDraftInput,
} from "./ai.types";
import { PROJECT_SUMMARY_PROMPT } from "./prompts/project-summary.prompt";
import { REQUIREMENTS_DRAFT_PROMPT } from "./prompts/requirements-draft.prompt";
import { BUDGET_ESTIMATE_PROMPT } from "./prompts/budget-estimate.prompt";
import { CHECKIN_ANALYSIS_PROMPT } from "./prompts/checkin-analysis.prompt";
import { FEEDBACK_INSIGHTS_PROMPT } from "./prompts/feedback-insights.prompt";
import { createCheckInAnalysisTimeoutFallback } from "./check-in-analysis.timeout-fallback";
import { REQUIREMENTS_BASELINE } from "./requirements-baseline";
import { REQUIREMENTS_DRAFT_POLICY } from "./requirements-draft.policy";
import { RedactionCounts, redactPersonalData, reviewRequirementsDraft } from "./requirements-draft.review";

class AiRequestTimeoutError extends Error {
  constructor() {
    super("AI request timed out");
    this.name = "AiRequestTimeoutError";
  }
}

class AiProviderHttpError extends BadGatewayException {
  constructor(readonly providerStatus: number) {
    super(`Dịch vụ AI trả về lỗi HTTP ${providerStatus}.`);
  }
}

@Injectable()
export class AiService {
  projectSummary(input: ProjectSummaryInput) {
    return this.generateJson(PROJECT_SUMMARY_PROMPT, input);
  }

  /**
   * TV2 – BA: che dữ liệu cá nhân → gửi LLM kèm danh mục yêu cầu đã chốt → hậu kiểm chất lượng/trùng lặp/truy vết.
   * Kết quả luôn là bản nháp chờ BA duyệt, không tự ghi vào SRS.
   */
  async requirementsDraft(input: RequirementsDraftInput) {
    const redactions: RedactionCounts = { emails: 0, phones: 0, idNumbers: 0 };
    const redact = (text: string) => redactPersonalData(text, redactions);
    const maxRequirements = input.maxRequirements ?? REQUIREMENTS_DRAFT_POLICY.defaultMaxRequirements;
    const moduleName = input.moduleName ? redact(input.moduleName) : null;

    const generated = await this.generateJson(REQUIREMENTS_DRAFT_PROMPT, {
      problemStatement: redact(input.problemStatement),
      targetUsers: redact(input.targetUsers),
      moduleName,
      businessGoals: (input.businessGoals ?? []).map(redact),
      constraints: (input.constraints ?? []).map(redact),
      maxRequirements,
      baseline: REQUIREMENTS_BASELINE.map(({ id, title }) => ({ id, title })),
    });

    return {
      ...generated,
      result: reviewRequirementsDraft(generated.result, {
        baseline: REQUIREMENTS_BASELINE,
        maxRequirements,
        moduleName,
        redactions,
      }),
    };
  }

  async budgetEstimate(input: BudgetEstimateInput) {
    const generated = await this.generateJson(BUDGET_ESTIMATE_PROMPT, input);
    const result = generated.result as Record<string, unknown>;
    if (!Array.isArray(result.items) || result.items.length === 0 || result.items.length > 40) {
      throw new BadGatewayException("AI không trả về danh sách khoản mục dự toán hợp lệ.");
    }

    const items = result.items.map((raw: unknown) => {
      if (!raw || typeof raw !== "object") throw new BadGatewayException("Khoản mục dự toán AI trả về không hợp lệ.");
      const item = raw as Record<string, unknown>;
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);
      if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(unitCost) || unitCost < 0) {
        throw new BadGatewayException("AI trả về số lượng hoặc đơn giá không hợp lệ.");
      }
      return { ...item, quantity, unitCost, totalCost: quantity * unitCost };
    });
    const contingencyPercent = Number(result.contingencyPercent ?? 0);
    if (!Number.isFinite(contingencyPercent) || contingencyPercent < 0 || contingencyPercent > 30) {
      throw new BadGatewayException("AI trả về tỷ lệ dự phòng không hợp lệ.");
    }
    const subtotal = items.reduce((sum, item) => sum + Number(item.totalCost), 0);
    const contingencyAmount = subtotal * contingencyPercent / 100;
    return {
      ...generated,
      result: {
        ...result,
        currency: input.currency,
        items,
        subtotal,
        contingencyPercent,
        contingencyAmount,
        totalEstimate: subtotal + contingencyAmount,
      },
    };
  }

  async checkInAnalysis(input: CheckInAnalysisInput) {
    let generated: Awaited<ReturnType<AiService["generateJson"]>>;
    try {
      generated = await this.generateJson(CHECKIN_ANALYSIS_PROMPT, input, 10_000);
    } catch (error) {
      if (error instanceof AiRequestTimeoutError ||
        (error instanceof AiProviderHttpError && error.providerStatus === 503)) {
        return createCheckInAnalysisTimeoutFallback();
      }
      throw error;
    }

    return Promise.resolve(generated).then((generated) => {
      const result = generated.result as Record<string, unknown>;
      const anomalies = Array.isArray(result.anomalies) ? result.anomalies : [];
      const riskLevel = result.riskLevel;
      const rawAssessments = Array.isArray(result.ticketAssessments) ? result.ticketAssessments : [];
      const assessmentsByTicket = new Map<string, Record<string, unknown>>();
      for (const raw of rawAssessments) {
        if (raw && typeof raw === "object" && typeof (raw as Record<string, unknown>).ticketRef === "string") {
          assessmentsByTicket.set((raw as Record<string, unknown>).ticketRef as string, raw as Record<string, unknown>);
        }
      }

      const ticketFraudConclusions = input.ticketPatterns.map((pattern) => {
        const ruleWindows = input.ruleWindows;
        const assessment = assessmentsByTicket.get(pattern.ticketRef);
        const verdict = assessment?.verdict;
        const confidence = typeof assessment?.confidence === "number" && assessment.confidence >= 0 && assessment.confidence <= 1
          ? assessment.confidence
          : 0;
        const attempts = pattern.attempts
          .map((attempt) => ({ ...attempt, time: new Date(attempt.scannedAt).valueOf() }))
          .filter((attempt) => Number.isFinite(attempt.time))
          .sort((a, b) => a.time - b.time);
        const acceptedAttempts = attempts.filter((attempt) => attempt.status === "ACCEPTED");
        const acceptedAt = acceptedAttempts[0]?.time;
        const hasNearSimultaneousAcceptedOnDifferentDevices = acceptedAttempts.some((first, index) =>
          acceptedAttempts.slice(index + 1).some((second) =>
            Math.abs(second.time - first.time) <= ruleWindows.multipleAcceptedWindowSeconds * 1_000 &&
            first.deviceId !== "legacy-unknown" && second.deviceId !== "legacy-unknown" &&
            first.deviceId !== second.deviceId,
          ),
        );
        const mapScanAttempt = (attempt: (typeof attempts)[number]) => ({
          status: attempt.status,
          scannedAt: new Date(attempt.time).toISOString(),
          deviceId: attempt.deviceId,
        });
        const formatScanTime = (time: number) => new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          dateStyle: "short",
          timeStyle: "medium",
        }).format(new Date(time));
        const evidenceDetails = attempts.map((attempt) => {
          const time = formatScanTime(attempt.time);
          const device = attempt.deviceId === "legacy-unknown"
            ? "không xác định (log cũ không lưu máy quét)"
            : attempt.deviceId;

          if (attempt.status === "ACCEPTED") {
            return `Vé ${pattern.ticketRef} đã được quét thành công lúc ${time} tại máy ${device}.`;
          }
          if (attempt.status === "ALREADY_USED") {
            return `Vé ${pattern.ticketRef} được quét lại lúc ${time} tại máy ${device}; hệ thống báo ALREADY_USED (vé đã được sử dụng).`;
          }
          if (attempt.status === "NOT_ELIGIBLE") {
            return `Vé ${pattern.ticketRef} được quét lúc ${time} tại máy ${device}; hệ thống từ chối vì đăng ký chưa hợp lệ hoặc đã bị hủy.`;
          }
          return `Vé ${pattern.ticketRef} được quét lúc ${time} tại máy ${device}; hệ thống báo INVALID (mã vé không hợp lệ).`;
        });
        const repeatsAfterAccepted = attempts.filter((attempt) =>
          attempt.status === "ALREADY_USED" && acceptedAt !== undefined && attempt.time > acceptedAt,
        );
        const allRepeatedAttempts = attempts.filter((attempt) => attempt.status === "ALREADY_USED");
        const invalidAttempts = attempts.filter((attempt) => attempt.status === "INVALID");
        const distinctRepeatDevices = new Set(repeatsAfterAccepted
          .map((attempt) => attempt.deviceId)
          .filter((deviceId) => deviceId !== "legacy-unknown"));
        const acceptedDevice = attempts.find((attempt) => attempt.status === "ACCEPTED")?.deviceId;
        const distinctDevicesAcrossAcceptance = new Set([
          acceptedDevice,
          ...repeatsAfterAccepted.map((attempt) => attempt.deviceId),
        ].filter((deviceId): deviceId is string => Boolean(deviceId) && deviceId !== "legacy-unknown"));
        const hasThreeRepeatsWithinRapidWindow = repeatsAfterAccepted.some((first, index) =>
          repeatsAfterAccepted.slice(index + 2).some((third) =>
            third.time - first.time <= ruleWindows.rapidRepeatMinutes * 60_000,
          ),
        );
        const repeatBursts: Array<{ start: number; count: number; deviceIds: Set<string> }> = [];
        for (const repeat of repeatsAfterAccepted) {
          const currentBurst = repeatBursts[repeatBursts.length - 1];
          if (!currentBurst || repeat.time - currentBurst.start > ruleWindows.repeatBurstMinutes * 60_000) {
            repeatBursts.push({ start: repeat.time, count: 1, deviceIds: new Set([repeat.deviceId]) });
          } else {
            currentBurst.count += 1;
            currentBurst.deviceIds.add(repeat.deviceId);
          }
        }
        const llmEvidence = Array.isArray(assessment?.evidence)
          ? assessment.evidence.filter((item): item is string => typeof item === "string")
          : [];
        const suspectedByLlm = verdict === "fraud_suspected" && confidence >= 0.85 && llmEvidence.length > 0;
        const persistentRepeatUse = repeatsAfterAccepted.length >= 5 &&
          repeatsAfterAccepted[repeatsAfterAccepted.length - 1].time - repeatsAfterAccepted[0].time >=
            ruleWindows.persistentRepeatSpanMinutes * 60_000;
        const separateRepeatBursts = repeatBursts.some((first, index) =>
          first.count >= 2 && repeatBursts.slice(index + 1).some((next) =>
            next.count >= 2 && next.start - first.start >= ruleWindows.repeatBurstSeparationMinutes * 60_000,
          ),
        );
        const matchedRules: string[] = [];

        if (verdict === "fraud_suspected" && confidence >= 0.9 && llmEvidence.length > 0 && hasNearSimultaneousAcceptedOnDifferentDevices) {
          matchedRules.push("R4_MULTIPLE_ACCEPTED_DIFFERENT_DEVICES");
        }
        if (suspectedByLlm && acceptedAt !== undefined && hasThreeRepeatsWithinRapidWindow && distinctDevicesAcrossAcceptance.size >= 2) {
          matchedRules.push("R1_RAPID_DUPLICATE_USE");
        }
        if (verdict === "fraud_suspected" && confidence >= 0.9 && llmEvidence.length > 0 && persistentRepeatUse && distinctRepeatDevices.size >= 2) {
          matchedRules.push("R2_PERSISTENT_DUPLICATE_USE");
        }
        if (verdict === "fraud_suspected" && confidence >= 0.9 && llmEvidence.length > 0 && separateRepeatBursts) {
          const hasMultipleScannerDevices = distinctRepeatDevices.size >= 2 && repeatBursts.some((burst) => burst.deviceIds.size >= 2);
          if (hasMultipleScannerDevices) matchedRules.push("R3_SEPARATE_REPEAT_BURSTS");
        }

        let isFraud: boolean | null = null;
        let decision: "FRAUD_BY_PROJECT_POLICY" | "NO_FRAUD_SIGNAL" | "INCONCLUSIVE" = "INCONCLUSIVE";
        let decisionReason = "LLM/scan evidence did not meet the project decision rule.";

        if (matchedRules.length > 0) {
          isFraud = true;
          decision = "FRAUD_BY_PROJECT_POLICY";
          decisionReason = matchedRules.includes("R4_MULTIPLE_ACCEPTED_DIFFERENT_DEVICES")
            ? "LLM đánh giá nghi ngờ và log ghi nhận cùng vé được ACCEPTED gần như đồng thời trên nhiều thiết bị; cần rà soát vì hệ thống có thể đã cho check-in trùng."
            : "Log có mẫu quét lặp đáng nghi trên nhiều thiết bị; ban tổ chức cần rà soát lịch sử check-in.";
        } else if (
          verdict === "not_suspected" &&
          confidence >= 0.85 &&
          !hasNearSimultaneousAcceptedOnDifferentDevices &&
          repeatsAfterAccepted.length === 0 &&
          !attempts.some((attempt) => attempt.status === "INVALID" || attempt.status === "NOT_ELIGIBLE")
        ) {
          isFraud = false;
          decision = "NO_FRAUD_SIGNAL";
          decisionReason = "LLM không đánh giá nghi ngờ (confidence >= 0.85) và log không có lượt quét lặp/mã không hợp lệ gắn với vé.";
        }

        return {
          ticketRef: pattern.ticketRef,
          llmAssessment: assessment ?? null,
          matchedRules,
          evidenceDetails,
          scanEvidence: {
            counts: {
              accepted: acceptedAttempts.length,
              alreadyUsed: allRepeatedAttempts.length,
              invalid: invalidAttempts.length,
              notEligible: attempts.filter((attempt) => attempt.status === "NOT_ELIGIBLE").length,
            },
            acceptedAttempts: acceptedAttempts.map(mapScanAttempt),
            repeatedAttempts: allRepeatedAttempts.map(mapScanAttempt),
            repeatedAfterAcceptedCount: repeatsAfterAccepted.length,
            repeatedAfterAccepted: repeatsAfterAccepted.map(mapScanAttempt),
            invalidAttempts: invalidAttempts.map(mapScanAttempt),
          },
          isFraud,
          decision,
          decisionReason,
          requiresOrganizerReview: decision !== "NO_FRAUD_SIGNAL",
        };
      });

      let status: "REVIEW_FOR_POSSIBLE_MISUSE" | "NO_SIGNIFICANT_SIGNAL" | "INSUFFICIENT_DATA";
      let message: string;
      if ((riskLevel === "high" || riskLevel === "review") && anomalies.length > 0) {
        status = "REVIEW_FOR_POSSIBLE_MISUSE";
        message = "Có tín hiệu check-in cần người tổ chức rà soát; đây chưa phải kết luận gian lận.";
      } else if (riskLevel === "low" && anomalies.length === 0) {
        status = "NO_SIGNIFICANT_SIGNAL";
        message = "LLM không nêu tín hiệu đáng kể trong dữ liệu được cung cấp; điều này không chứng minh không có gian lận.";
      } else {
        status = "INSUFFICIENT_DATA";
        message = "Chưa đủ dữ liệu để đưa ra nhận xét rõ ràng.";
      }

      return {
        ...generated,
        result: {
          ...result,
          ticketFraudConclusions,
          organizerDecisionSupport: {
            status,
            message,
            requiresHumanReview: true,
          },
        },
      };
    });
  }

  feedbackInsights(feedback: Array<{ rating: number; comment: string | null }>) {
    const anonymousFeedback = feedback.map(({ rating, comment }) => ({ rating, comment: comment?.slice(0, 1000) ?? null }));
    return this.generateJson(FEEDBACK_INSIGHTS_PROMPT, anonymousFeedback);
  }

  private async generateJson(systemPrompt: string, input: unknown, timeoutMs = 5 * 60_000) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException("AI chưa được cấu hình. Hãy thiết lập AI_API_KEY.");

    const baseUrl = (process.env.AI_API_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    let response: Response;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(input) },
          ],
        }),
        signal: timeoutSignal,
      });
    } catch {
      if (timeoutSignal.aborted) throw new AiRequestTimeoutError();
      throw new ServiceUnavailableException("Không kết nối được dịch vụ AI hoặc yêu cầu đã hết thời gian.");
    }

    if (!response.ok) {
      throw new AiProviderHttpError(response.status);
    }

    try {
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty AI response");
      const parsed: unknown = JSON.parse(content);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected JSON object");
      return { result: parsed, generatedBy: model, requiresHumanReview: true };
    } catch {
      throw new BadGatewayException("AI trả về dữ liệu không đúng định dạng JSON mong đợi.");
    }
  }
}
