import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthUser, CurrentUser, Roles } from "../auth/auth.decorators";
import { EVENT_ROLES, EventAccessService, EventRoles } from "../auth/event-access";
import { PrismaService } from "../prisma/prisma.module";
import {
  CreateStaffAssignmentDto,
  CreateStaffDto,
  UpdateStaffAssignmentDto,
  UpdateStaffDto,
} from "./dto/staff.dto";

/*
 * Danh bạ nhân sự dùng chung (không gắn sự kiện) → chỉ cần quyền Ban tổ chức.
 * Phân công nhân sự gắn với sự kiện → chỉ Chủ sự kiện / Đồng tổ chức của sự kiện (và ADMIN);
 * danh sách không truyền eventId chỉ trả phân công của các sự kiện mình quản lý.
 */
@Roles(UserRole.ORGANIZER)
@Controller("resources/staff")
export class StaffController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.staffMember.findMany({ orderBy: { fullName: "asc" } });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.staffMember.findUniqueOrThrow({
      where: { id },
      include: { assignments: { include: { event: { select: { id: true, name: true } } } } },
    });
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.prisma.staffMember.create({ data: dto });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateStaffDto) {
    return this.prisma.staffMember.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.staffMember.delete({ where: { id } });
  }
}

/** Phân công nhân sự vào sự kiện. */
@Roles(UserRole.ORGANIZER)
@Controller("resources/staff-assignments")
export class StaffAssignmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EventAccessService,
  ) {}

  @EventRoles(EVENT_ROLES.MANAGERS, { optional: true })
  @Get()
  async list(@CurrentUser() user: AuthUser, @Query("eventId") eventId?: string) {
    return this.prisma.staffAssignment.findMany({
      where: { eventId: await this.access.eventFilter(user, eventId, EVENT_ROLES.MANAGERS) },
      include: { staff: { select: { id: true, fullName: true, phone: true } } },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
    });
  }

  @EventRoles(EVENT_ROLES.MANAGERS)
  @Post()
  create(@Body() dto: CreateStaffAssignmentDto) {
    return this.prisma.staffAssignment.create({ data: dto });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "staffAssignment" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateStaffAssignmentDto) {
    return this.prisma.staffAssignment.update({ where: { id }, data: dto });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "staffAssignment" })
  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.staffAssignment.delete({ where: { id } });
  }
}
