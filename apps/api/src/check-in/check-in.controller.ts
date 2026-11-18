import { Body, Controller, Get, HttpCode, Param, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser, Roles } from "../auth/auth.decorators";
import { EVENT_ROLES, EventRoles } from "../auth/event-access";
import { CheckInDto, CheckInStatsQuery } from "./check-in.dto";
import { CheckInService } from "./check-in.service";

/** Chỉ thành viên ban tổ chức của sự kiện (eventId trong body hoặc đường dẫn) được check-in / xem số liệu. */
@Roles(UserRole.ORGANIZER)
@EventRoles(EVENT_ROLES.ALL)
@Controller("check-in")
@ApiTags("Check-in")
export class CheckInController {
  constructor(private readonly checkIns: CheckInService) {}

  /** Trả 200 cho mọi kết quả quét; xem trường `result` / `accepted`. */
  @Post()
  @HttpCode(200)
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: AuthUser) {
    return this.checkIns.checkIn(dto, user.id);
  }

  @Get("events/:eventId/stats")
  stats(@Param("eventId") eventId: string, @Query() query: CheckInStatsQuery) {
    return this.checkIns.stats(eventId, query.windowMinutes);
  }
}
