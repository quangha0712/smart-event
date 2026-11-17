import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser, Public, Roles } from "../auth/auth.decorators";
import { EVENT_ROLES, EventAccessService, EventRoles } from "../auth/event-access";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto, UpdateEventStatusDto } from "./dto/update-event.dto";
import { AddEventMemberDto, UpdateEventMemberDto } from "./event-members.dto";
import { EventMembersService } from "./event-members.service";
import { EventsService } from "./events.service";

/*
 * Phân quyền theo thành viên sự kiện: guard + ma trận ở src/auth/event-access.ts.
 * Route công khai vẫn nhận token nếu có (AuthGuard gắn req.user) để trả dữ liệu theo người gọi.
 */
@Controller("events")
@ApiTags("Events")
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly access: EventAccessService,
  ) {}

  /** ADMIN: tất cả; Ban tổ chức: sự kiện mình là thành viên (+ myRole); khách / người tham dự: trừ bản nháp. */
  @Public()
  @Get()
  list(@CurrentUser() user?: AuthUser) {
    return this.events.list(user);
  }

  @Public()
  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() user?: AuthUser) {
    const event = await this.events.getById(id, user);
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    return event;
  }

  /** Người tạo tự thành Chủ sự kiện. */
  @Roles(UserRole.ORGANIZER)
  @Post()
  create(@Body() input: CreateEventDto, @CurrentUser() user: AuthUser) {
    return this.events.create(input, user);
  }

  /** Sửa thông tin: Chủ sự kiện / Đồng tổ chức. */
  @Roles(UserRole.ORGANIZER)
  @EventRoles(EVENT_ROLES.MANAGERS, { idIsEventId: true })
  @Patch(":id")
  update(@Param("id") id: string, @Body() input: UpdateEventDto, @CurrentUser() user: AuthUser) {
    return this.events.update(id, input, user);
  }

  /** Công bố / chuyển về nháp / kết thúc: Chủ sự kiện / Đồng tổ chức; huỷ: chỉ Chủ sự kiện (kiểm tra trong service). */
  @Roles(UserRole.ORGANIZER)
  @EventRoles(EVENT_ROLES.MANAGERS, { idIsEventId: true })
  @Patch(":id/status")
  async changeStatus(@Param("id") id: string, @Body() input: UpdateEventStatusDto, @CurrentUser() user: AuthUser) {
    const myRole = user.role === UserRole.ADMIN ? null : await this.access.roleOf(id, user.id);
    return this.events.changeStatus(id, input.status, user, myRole);
  }
}

/** Thành viên ban tổ chức của một sự kiện. */
@Roles(UserRole.ORGANIZER)
@Controller("events/:eventId/members")
@ApiTags("Event members")
export class EventMembersController {
  constructor(private readonly members: EventMembersService) {}

  @EventRoles(EVENT_ROLES.ALL)
  @Get()
  list(@Param("eventId") eventId: string) {
    return this.members.list(eventId);
  }

  @EventRoles(EVENT_ROLES.OWNER)
  @Post()
  add(@Param("eventId") eventId: string, @Body() dto: AddEventMemberDto, @CurrentUser() user: AuthUser) {
    return this.members.add(user, eventId, dto.email, dto.role);
  }

  @EventRoles(EVENT_ROLES.OWNER)
  @Patch(":userId")
  updateRole(
    @Param("eventId") eventId: string,
    @Param("userId") userId: string,
    @Body() dto: UpdateEventMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.members.updateRole(user, eventId, userId, dto.role);
  }

  @EventRoles(EVENT_ROLES.OWNER)
  @Delete(":userId")
  @HttpCode(204)
  async remove(@Param("eventId") eventId: string, @Param("userId") userId: string, @CurrentUser() user: AuthUser) {
    await this.members.remove(user, eventId, userId);
  }
}

/** Sự kiện người đang đăng nhập là thành viên ban tổ chức – FE dùng để lọc trang chủ, menu, màn quét vé. */
@Roles(UserRole.ORGANIZER)
@Controller("me/event-memberships")
@ApiTags("Event members")
export class MyEventMembershipsController {
  constructor(private readonly members: EventMembersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.members.listForUser(user.id);
  }
}
