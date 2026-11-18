import { EventMemberRole } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, MaxLength } from "class-validator";

const ROLE_MESSAGE = "Vai trò phải là OWNER, CO_ORGANIZER hoặc CHECKIN_STAFF";

export class AddEventMemberDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: "Email không hợp lệ" })
  @MaxLength(191)
  email!: string;

  /** OWNER chỉ ADMIN được gán. */
  @IsEnum(EventMemberRole, { message: ROLE_MESSAGE })
  role!: EventMemberRole;
}

export class UpdateEventMemberDto {
  @IsEnum(EventMemberRole, { message: ROLE_MESSAGE })
  role!: EventMemberRole;
}
