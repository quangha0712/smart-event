import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { AuthUser, CurrentUser, Roles } from "../auth/auth.decorators";
import { EVENT_ROLES, EventRoles } from "../auth/event-access";
import { CreateScheduleItemDto, CreateSpeakerDto, UpdateScheduleItemDto, UpdateSpeakerDto } from "./schedules.dto";
import { SchedulesService } from "./schedules.service";

/** Lịch trình của sự kiện – Chủ sự kiện / Đồng tổ chức. Người xem công khai đọc qua GET /events/:id. */
@Roles(UserRole.ORGANIZER)
@EventRoles(EVENT_ROLES.MANAGERS)
@Controller("events/:eventId/schedules")
@ApiTags("Schedules")
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  list(@Param("eventId") eventId: string) {
    return this.schedules.listSchedules(eventId);
  }

  @Post()
  create(@Param("eventId") eventId: string, @Body() dto: CreateScheduleItemDto, @CurrentUser() user: AuthUser) {
    return this.schedules.createSchedule(eventId, dto, user);
  }

  @Patch(":id")
  update(@Param("eventId") eventId: string, @Param("id") id: string, @Body() dto: UpdateScheduleItemDto, @CurrentUser() user: AuthUser) {
    return this.schedules.updateSchedule(eventId, id, dto, user);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("eventId") eventId: string, @Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.schedules.deleteSchedule(eventId, id, user);
  }
}

/** Diễn giả của sự kiện – Chủ sự kiện / Đồng tổ chức. */
@Roles(UserRole.ORGANIZER)
@EventRoles(EVENT_ROLES.MANAGERS)
@Controller("events/:eventId/speakers")
@ApiTags("Schedules")
export class SpeakersController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  list(@Param("eventId") eventId: string) {
    return this.schedules.listSpeakers(eventId);
  }

  @Post()
  create(@Param("eventId") eventId: string, @Body() dto: CreateSpeakerDto, @CurrentUser() user: AuthUser) {
    return this.schedules.createSpeaker(eventId, dto, user);
  }

  @Patch(":id")
  update(@Param("eventId") eventId: string, @Param("id") id: string, @Body() dto: UpdateSpeakerDto, @CurrentUser() user: AuthUser) {
    return this.schedules.updateSpeaker(eventId, id, dto, user);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("eventId") eventId: string, @Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.schedules.deleteSpeaker(eventId, id, user);
  }
}
