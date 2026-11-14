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

@Injectable()
export class AiService {
  projectSummary(input: ProjectSummaryInput) {
    return this.generateJson(PROJECT_SUMMARY_PROMPT, input);
  }

  requirementsDraft(input: RequirementsDraftInput) {
    return this.generateJson(REQUIREMENTS_DRAFT_PROMPT, input);
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

  checkInAnalysis(input: CheckInAnalysisInput) {
    return this.generateJson(CHECKIN_ANALYSIS_PROMPT, input);
  }

  feedbackInsights(feedback: Array<{ rating: number; comment: string | null }>) {
    const anonymousFeedback = feedback.map(({ rating, comment }) => ({ rating, comment: comment?.slice(0, 1000) ?? null }));
    return this.generateJson(FEEDBACK_INSIGHTS_PROMPT, anonymousFeedback);
  }

  private async generateJson(systemPrompt: string, input: unknown) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException("AI chưa được cấu hình. Hãy thiết lập AI_API_KEY.");

    const baseUrl = (process.env.AI_API_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    let response: Response;
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
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new ServiceUnavailableException("Không kết nối được dịch vụ AI hoặc yêu cầu đã hết thời gian.");
    }

    if (!response.ok) {
      throw new BadGatewayException(`Dịch vụ AI trả về lỗi HTTP ${response.status}.`);
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
