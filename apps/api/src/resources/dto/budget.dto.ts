import { PartialType } from "@nestjs/mapped-types";
import { BudgetItemSource } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from "class-validator";

/** Dòng dự toán. plannedAmount do server tính = quantity x unitPrice. */
export class CreateBudgetItemDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsString()
  @IsNotEmpty({ message: "Cần nhập tên khoản mục" })
  @MaxLength(191)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: "Cần nhập nhóm chi phí" })
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Số lượng phải là số" })
  @Min(0, { message: "Số lượng không được âm" })
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @Type(() => Number)
  @IsNumber({}, { message: "Đơn giá phải là số" })
  @Min(0, { message: "Đơn giá không được âm" })
  unitPrice!: number;

  /** true = khoản thu dự kiến (ví dụ bán vé), false = khoản chi. */
  @IsOptional()
  @IsBoolean()
  isIncome?: boolean;

  @IsOptional()
  @IsEnum(BudgetItemSource)
  source?: BudgetItemSource;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateBudgetItemDto extends PartialType(CreateBudgetItemDto) {}

/** Khoản thực chi. Không có budgetItemId = chi phát sinh ngoài dự toán. */
export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsOptional()
  @IsString()
  budgetItemId?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsString()
  @IsNotEmpty({ message: "Cần nhập nội dung chi" })
  @MaxLength(255)
  description!: string;

  @Type(() => Number)
  @IsNumber({}, { message: "Số tiền phải là số" })
  @Min(0, { message: "Số tiền không được âm" })
  amount!: number;

  @IsDateString({}, { message: "paidAt phải là thời gian ISO 8601 hợp lệ" })
  paidAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsOptional()
  @IsUrl({}, { message: "attachmentUrl không hợp lệ" })
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
