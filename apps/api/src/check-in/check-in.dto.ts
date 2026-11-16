import { CheckInMethod } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CheckInDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  /** Nội dung QR (mã có chữ ký) hoặc UID thẻ NFC. */
  @IsString()
  @IsNotEmpty({ message: "Cần có mã vé" })
  @MaxLength(500)
  code!: string;

  /** QR / MANUAL: kiểm tra chữ ký mã vé. NFC: tra theo Ticket.nfcUid. */
  @IsOptional()
  @IsEnum(CheckInMethod)
  method?: CheckInMethod;

  /** Mã thiết bị quét (Device.code), nếu có. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceCode?: string;
}

export class CheckInStatsQuery {
  /** Chỉ tính các lượt quét trong N phút gần nhất; bỏ trống = toàn bộ. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  windowMinutes?: number;
}
