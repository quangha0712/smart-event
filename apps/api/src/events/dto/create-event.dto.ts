import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateEventDto {
  @IsString({ message: "Tên sự kiện phải là chuỗi" })
  @IsNotEmpty({ message: "Cần cung cấp tên sự kiện" })
  @MaxLength(191, { message: "Tên sự kiện tối đa 191 ký tự" })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsDateString({}, { message: "startsAt phải là thời gian ISO 8601 hợp lệ" })
  startsAt!: string;

  @IsDateString({}, { message: "endsAt phải là thời gian ISO 8601 hợp lệ" })
  endsAt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Sức chứa phải là số nguyên dương" })
  @Min(1, { message: "Sức chứa phải là số nguyên dương" })
  capacity?: number;
}
