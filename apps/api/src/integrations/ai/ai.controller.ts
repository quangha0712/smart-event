import { BadRequestException, Body, Controller, Param, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../auth/auth.decorators";
import { CheckInStatsQuery } from "../../check-in/check-in.dto";
import { CheckInService } from "../../check-in/check-in.service";
import { PrismaService } from "../../prisma/prisma.module";
import { AiService } from "./ai.service";
import {
  BudgetEstimateInput,
  CheckInAnalysisInput,
  ProjectSummaryInput,
  RequirementsDraftInput,
} from "./ai.types";

/** Mỗi lần gọi tốn phí provider AI nên chỉ ORGANIZER / ADMIN được dùng. */
@Roles(UserRole.ORGANIZER)
@Controller("ai")
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

  /** Phân tích với số liệu nhập tay (thử kịch bản). Dùng endpoint theo sự kiện bên dưới cho dữ liệu thật. */
  @Post("check-in-analysis")
  checkInAnalysis(@Body() body: CheckInAnalysisInput) {
    if (body.accepted + body.repeatedScans + body.invalidCodes > body.totalAttempts) {
      throw new BadRequestException("Tổng các loại lượt quét không được vượt totalAttempts.");
    }
    return this.ai.checkInAnalysis(body);
  }

  /** Phân tích check-in từ dữ liệu thật trong bảng CheckInAttempt. */
  @Post("events/:eventId/check-in-analysis")
  async checkInAnalysisFromData(@Param("eventId") eventId: string, @Query() query: CheckInStatsQuery) {
    const stats = await this.checkIns.stats(eventId, query.windowMinutes);
    if (stats.totalAttempts === 0) throw new BadRequestException("Sự kiện chưa có lượt quét nào để phân tích.");
    const { notEligible: _notEligible, ...input } = stats;
    return { stats, ...(await this.ai.checkInAnalysis(input)) };
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
