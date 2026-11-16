import { BadRequestException, Body, Controller, Param, Post } from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.module";
import { AiService } from "./ai.service";
import { CHECKIN_RULE_WINDOWS } from "./check-in-analysis.policy";
import { CheckInService } from "../../check-in/check-in.service";
import {
  BudgetEstimateInput,
  ProjectSummaryInput,
  RequirementsDraftInput,
} from "./ai.types";

function requireText(value: unknown, field: string, maxLength = 4000): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new BadRequestException(`${field} phải là chuỗi không rỗng, tối đa ${maxLength} ký tự.`);
  }
  return value.trim();
}

function requireStringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > 30 || value.some((item) => typeof item !== "string" || item.length > 500)) {
    throw new BadRequestException(`${field} phải là danh sách tối đa 30 chuỗi, mỗi chuỗi không quá 500 ký tự.`);
  }
  return value.map((item) => item.trim());
}

function requireCount(value: unknown, field: string, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) {
    throw new BadRequestException(`${field} phải là số nguyên từ 0 đến ${max}.`);
  }
  return Number(value);
}

@Controller("ai")
@ApiTags("AI")
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly checkIn: CheckInService,
  ) {}

  @Post("project-summary")
  projectSummary(@Body() body: ProjectSummaryInput) {
    return this.ai.projectSummary({
      period: requireText(body?.period, "period", 100),
      completedItems: requireStringList(body?.completedItems, "completedItems"),
      pendingItems: requireStringList(body?.pendingItems, "pendingItems"),
      risks: requireStringList(body?.risks, "risks"),
    });
  }

  @Post("requirements-draft")
  requirementsDraft(@Body() body: RequirementsDraftInput) {
    return this.ai.requirementsDraft({
      problemStatement: requireText(body?.problemStatement, "problemStatement"),
      targetUsers: requireText(body?.targetUsers, "targetUsers", 1000),
    });
  }

  @Post("budget-estimate")
  budgetEstimate(@Body() body: BudgetEstimateInput) {
    const attendees = requireCount(body?.attendees, "attendees", 100_000);
    const days = requireCount(body?.days, "days", 30);
    if (attendees < 1 || days < 1) throw new BadRequestException("attendees và days phải lớn hơn 0.");
    if (body?.currency !== "VND" && body?.currency !== "USD") {
      throw new BadRequestException("currency chỉ nhận VND hoặc USD.");
    }
    return this.ai.budgetEstimate({
      eventType: requireText(body?.eventType, "eventType", 200),
      attendees,
      days,
      location: requireText(body?.location, "location", 200),
      constraints: typeof body?.constraints === "string" ? body.constraints.slice(0, 2000) : "",
      currency: body.currency,
    });
  }

  @Post("check-in-analysis")
  @ApiBody({
    schema: {
      type: "object",
      required: ["eventId", "from", "to"],
      properties: {
        eventId: { type: "string", example: "demo-smart-event" },
        from: { type: "string", format: "date-time", example: "2026-11-15T08:00:00.000Z" },
        to: { type: "string", format: "date-time", example: "2026-11-15T09:00:00.000Z" },
      },
    },
  })
  async checkInAnalysis(@Body() body: {
    eventId?: string;
    from?: string;
    to?: string;
  }) {
    const eventId = requireText(body?.eventId, "eventId", 191);
    const from = requireText(body?.from, "from", 40);
    const to = requireText(body?.to, "to", 40);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.valueOf()) || Number.isNaN(toDate.valueOf()) || fromDate > toDate) {
      throw new BadRequestException("from/to phải là thời điểm hợp lệ và from không được sau to.");
    }
    const maxRangeMs = 30 * 24 * 60 * 60_000;
    if (toDate.valueOf() - fromDate.valueOf() > maxRangeMs) {
      throw new BadRequestException("Khoảng phân tích tối đa là 30 ngày.");
    }
    const { windowMinutes: _internalWindowMinutes, ...metrics } = await this.checkIn.getSummary(eventId, fromDate, toDate);
    const ticketPatterns = await this.checkIn.getTicketAnalysisPatterns(eventId, fromDate, toDate);
    return this.ai.checkInAnalysis({
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
