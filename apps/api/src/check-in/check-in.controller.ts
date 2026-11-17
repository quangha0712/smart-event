import { Body, Controller, Get, HttpCode, Param, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser, Roles } from "../auth/auth.decorators";
import { CheckInDto, CheckInStatsQuery } from "./check-in.dto";
import { CheckInService } from "./check-in.service";

// TODO(BE): thêm EventMemberGuard @EventRoles(OWNER, CO_ORGANIZER, CHECKIN_STAFF) – eventId lấy từ body (POST)
// hoặc :eventId (stats). Hiện mọi ORGANIZER check-in được ở mọi sự kiện. (chi tiết guard + ma trận quyền: ghi chú đầu file src/events/events.controller.ts)
@Roles(UserRole.ORGANIZER)
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
