import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min } from "class-validator";

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty({ message: "Cần nhập tên nhà cung cấp" })
  @MaxLength(191)
  name!: string;

  /** Loại dịch vụ, ví dụ: "Âm thanh - ánh sáng", "Ăn uống". */
  @IsString()
  @IsNotEmpty({ message: "Cần nhập loại dịch vụ" })
  @MaxLength(100)
  serviceType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  contactName?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email không hợp lệ" })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  taxCode?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateVendorDto extends PartialType(CreateVendorDto) {}

export class CreateSponsorDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsString()
  @IsNotEmpty({ message: "Cần nhập tên nhà tài trợ" })
  @MaxLength(191)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  contactName?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email không hợp lệ" })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsUrl({}, { message: "Website không hợp lệ" })
  website?: string;

  @IsOptional()
  @IsUrl({}, { message: "logoUrl không hợp lệ" })
  logoUrl?: string;

  /** Hạng tài trợ, ví dụ: Kim cương, Vàng, Bạc. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tier?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Giá trị tài trợ phải là số" })
  @Min(0, { message: "Giá trị tài trợ không được âm" })
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateSponsorDto extends PartialType(CreateSponsorDto) {}
