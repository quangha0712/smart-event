import { BadRequestException, Body, Controller, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "../../auth/auth.decorators";
import { CheckInService } from "../../check-in/check-in.service";
import { PrismaService } from "../../prisma/prisma.module";
import { AiService } from "./ai.service";
import { CHECKIN_RULE_WINDOWS } from "./check-in-analysis.policy";
import {
  BudgetEstimateInput,
  CheckInAnalysisRequest,
  ProjectSummaryInput,
  RequirementsDraftInput,
} from "./ai.types";

// TODO(BE): endpoint AI theo sự kiện (/ai/events/:eventId/..., check-in-analysis có eventId trong body) cần
// EventMemberGuard @EventRoles(OWNER, CO_ORGANIZER). Endpoint không gắn sự kiện (project-summary, requirements-draft,
// budget-estimate) giữ @Roles(ORGANIZER). (chi tiết guard + ma trận quyền: ghi chú đầu file src/events/events.controller.ts)
@Roles(UserRole.ORGANIZER)
@Controller("ai")
@ApiTags("AI")
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly checkIns: CheckInService,
  ) {}

  @Post("project-summary")
  projectSummary(@Body() body: ProjectSummaryInput) {
    return this.ai.projectSummary(body);
  }

  @Post("requirements-draft")
  requirementsDraft(@Body() body: RequirementsDraftInput) {
    return this.ai.requirementsDraft(body);
  }

  @Post("budget-estimate")
  budgetEstimate(@Body() body: BudgetEstimateInput) {
    return this.ai.budgetEstimate(body);
  }

  @Post("check-in-analysis")
  async checkInAnalysis(@Body() body: CheckInAnalysisRequest) {
    const from = new Date(body.from);
    const to = new Date(body.to);
    if (from > to) throw new BadRequestException("from không được sau to.");
    if (to.valueOf() - from.valueOf() > 30 * 24 * 60 * 60_000) {
      throw new BadRequestException("Khoảng phân tích tối đa là 30 ngày.");
    }

    const [metrics, ticketPatterns] = await Promise.all([
      this.checkIns.getAnalysisSummary(body.eventId, from, to),
      this.checkIns.getTicketAnalysisPatterns(body.eventId, from, to),
    ]);
    return this.ai.checkInAnalysis({
      eventId: body.eventId,
      from,
      to,
      ...metrics,
      ruleWindows: { ...CHECKIN_RULE_WINDOWS },
      ticketPatterns,
    });
  }

  @Post("events/:eventId/feedback-insights")
  async feedbackInsights(@Param("eventId") eventId: string) {
    const feedback = await this.prisma.eventFeedback.findMany({
      where: { eventId },
      select: { rating: true, comment: true },
      take: 500,
      orderBy: { createdAt: "desc" },
    });
    if (feedback.length === 0) throw new BadRequestException("Sự kiện chưa có đánh giá để tổng hợp.");
    return this.ai.feedbackInsights(feedback);
  }
}
