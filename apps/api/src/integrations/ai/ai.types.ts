import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export type AiJson = Record<string, unknown>;

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const trimEach = ({ value }: { value: unknown }) =>
  Array.isArray(value) ? value.map((v) => (typeof v === "string" ? v.trim() : v)) : value;

const LIST_MSG = "phải là danh sách tối đa 30 chuỗi, mỗi chuỗi không quá 500 ký tự";

export class ProjectSummaryInput {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  period!: string;

  @Transform(trimEach)
  @IsArray({ message: `completedItems ${LIST_MSG}` })
  @ArrayMaxSize(30, { message: `completedItems ${LIST_MSG}` })
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  completedItems!: string[];

  @Transform(trimEach)
  @IsArray({ message: `pendingItems ${LIST_MSG}` })
  @ArrayMaxSize(30, { message: `pendingItems ${LIST_MSG}` })
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  pendingItems!: string[];

  @Transform(trimEach)
  @IsArray({ message: `risks ${LIST_MSG}` })
  @ArrayMaxSize(30, { message: `risks ${LIST_MSG}` })
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  risks!: string[];
}

const SHORT_LIST_MSG = "phải là danh sách tối đa 10 chuỗi, mỗi chuỗi không quá 300 ký tự";

/** Đầu vào AI bản nháp yêu cầu (TV2 – BA). Chỉ hai trường đầu bắt buộc để tương thích client cũ. */
export class RequirementsDraftInput {
  @ApiProperty({
    description: "Mô tả nghiệp vụ/bài toán cần chuyển thành yêu cầu. Email, số điện thoại, số giấy tờ sẽ bị che trước khi gửi AI.",
    example:
      "Ban tổ chức muốn người tham dự nhận nhắc lịch trước mỗi phiên họ quan tâm và có thể đổi phiên khi phiên còn chỗ. Hiện nhân viên phải gọi điện nhắc thủ công.",
    maxLength: 4000,
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  problemStatement!: string;

  @ApiProperty({ example: "Người tham dự hội thảo; Chủ sự kiện; Đồng tổ chức", maxLength: 1000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  targetUsers!: string;

  @ApiPropertyOptional({ description: "Phân hệ/module liên quan để AI khoanh vùng.", example: "Lịch trình", maxLength: 100 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  moduleName?: string;

  @ApiPropertyOptional({ type: [String], example: ["Giảm cuộc gọi nhắc lịch thủ công"], maxItems: 10 })
  @IsOptional()
  @Transform(trimEach)
  @IsArray({ message: `businessGoals ${SHORT_LIST_MSG}` })
  @ArrayMaxSize(10, { message: `businessGoals ${SHORT_LIST_MSG}` })
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  businessGoals?: string[];

  @ApiPropertyOptional({ type: [String], example: ["Không gửi SMS trả phí trong giai đoạn demo"], maxItems: 10 })
  @IsOptional()
  @Transform(trimEach)
  @IsArray({ message: `constraints ${SHORT_LIST_MSG}` })
  @ArrayMaxSize(10, { message: `constraints ${SHORT_LIST_MSG}` })
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  constraints?: string[];

  @ApiPropertyOptional({ description: "Số yêu cầu chức năng tối đa AI được đề xuất (giới hạn chi phí).", minimum: 3, maximum: 20, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "maxRequirements phải là số nguyên" })
  @Min(3)
  @Max(20)
  maxRequirements?: number;
}

export class BudgetEstimateInput {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  eventType!: string;

  @Type(() => Number)
  @IsInt({ message: "attendees phải là số nguyên" })
  @Min(1)
  @Max(100_000)
  attendees!: number;

  @Type(() => Number)
  @IsInt({ message: "days phải là số nguyên" })
  @Min(1)
  @Max(30)
  days!: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  constraints: string = "";

  @IsIn(["VND", "USD"], { message: "currency chỉ nhận VND hoặc USD." })
  currency!: "VND" | "USD";
}

export class CheckInAnalysisRequest {
  @ApiProperty({ example: "demo-smart-event" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  eventId!: string;

  @ApiProperty({ type: String, format: "date-time", example: "2026-11-15T08:00:00.000Z" })
  @IsDateString()
  from!: string;

  @ApiProperty({ type: String, format: "date-time", example: "2026-11-15T09:00:00.000Z" })
  @IsDateString()
  to!: string;
}

export type CheckInRuleWindows = {
  rapidRepeatMinutes: number;
  persistentRepeatSpanMinutes: number;
  repeatBurstMinutes: number;
  repeatBurstSeparationMinutes: number;
  multipleAcceptedWindowSeconds: number;
};

export type CheckInAnalysisInput = {
  eventId: string;
  from: Date;
  to: Date;
  totalAttempts: number;
  accepted: number;
  repeatedScans: number;
  invalidCodes: number;
  ticketsWithRepeatedScans: number;
  ticketsWithHighRepeatCount: number;
  ruleWindows: CheckInRuleWindows;
  ticketPatterns: Array<{
    ticketRef: string;
    attempts: Array<{
      scannedAt: string;
      status: "ACCEPTED" | "ALREADY_USED" | "INVALID" | "NOT_ELIGIBLE";
      deviceId: string;
    }>;
  }>;
};
