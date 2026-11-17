import { PartialType } from "@nestjs/mapped-types";
import { EventStatus } from "@prisma/client";
import { IsEnum } from "class-validator";
import { CreateEventDto } from "./create-event.dto";

/** Sửa thông tin sự kiện: mọi trường đều tuỳ chọn, quy tắc giống khi tạo. */
export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class UpdateEventStatusDto {
  @IsEnum(EventStatus, { message: "Trạng thái phải là DRAFT, PUBLISHED, CANCELLED hoặc COMPLETED" })
  status!: EventStatus;
}
