import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
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

export class RequirementsDraftInput {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  problemStatement!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  targetUsers!: string;
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

export class CheckInAnalysisInput {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  eventId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  totalAttempts!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  accepted!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  repeatedScans!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  invalidCodes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  windowMinutes!: number;
}
