import { PartialType } from "@nestjs/mapped-types";
import { ArrayMaxSize, IsArray, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateScheduleItemDto {
  @IsString()
  @IsNotEmpty({ message: "Cần nhập tên phiên" })
  @MaxLength(191, { message: "Tên phiên tối đa 191 ký tự" })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString({}, { message: "Giờ bắt đầu không hợp lệ" })
  startsAt!: string;

  @IsDateString({}, { message: "Giờ kết thúc không hợp lệ" })
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Phòng tối đa 100 ký tự" })
  room?: string;

  /** Diễn giả của phiên (phải thuộc cùng sự kiện). Khi sửa: gửi mảng mới để thay toàn bộ, [] để bỏ hết. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: "Một phiên tối đa 20 diễn giả" })
  @IsString({ each: true })
  speakerIds?: string[];
}

export class UpdateScheduleItemDto extends PartialType(CreateScheduleItemDto) {}

export class CreateSpeakerDto {
  @IsString()
  @IsNotEmpty({ message: "Cần nhập họ tên diễn giả" })
  @MaxLength(191)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  organization?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  /** Chỉ ban tổ chức thấy; không trả ra trang công khai. */
  @IsOptional()
  @IsEmail({}, { message: "Email không hợp lệ" })
  @MaxLength(191)
  email?: string;

  @IsOptional()
  @IsUrl({}, { message: "Link ảnh không hợp lệ" })
  @MaxLength(500)
  avatarUrl?: string;
}

export class UpdateSpeakerDto extends PartialType(CreateSpeakerDto) {}
