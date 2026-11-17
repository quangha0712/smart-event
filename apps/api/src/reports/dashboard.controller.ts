import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/auth.decorators";
import { EVENT_ROLES, EventRoles } from "../auth/event-access";
import { DashboardService } from "./dashboard.service";

/** Số liệu dashboard của một sự kiện: Chủ sự kiện / Đồng tổ chức (và ADMIN). */
@Roles(UserRole.ORGANIZER)
@EventRoles(EVENT_ROLES.MANAGERS)
@Controller("events/:eventId/dashboard")
@ApiTags("Reports")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get(@Param("eventId") eventId: string) {
    return this.dashboard.forEvent(eventId);
  }
}
