import { PartialType } from "@nestjs/mapped-types";
import { AssignmentStatus } from "@prisma/client";
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty({ message: "Cần nhập họ tên nhân sự" })
  @MaxLength(191)
  fullName!: string;

  @IsOptional()
  @IsEmail({}, { message: "Email không hợp lệ" })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Liên kết tài khoản đăng nhập (tuỳ chọn). */
  @IsOptional()
  @IsString()
  userId?: string;
}

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}

export class CreateStaffAssignmentDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @IsString()
  @IsNotEmpty({ message: "Cần nhập vai trò trong sự kiện" })
  @MaxLength(100)
  role!: string;

  @IsOptional()
  @IsString()
  task?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;
}

export class UpdateStaffAssignmentDto extends PartialType(CreateStaffAssignmentDto) {}
