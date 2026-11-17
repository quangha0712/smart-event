import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/auth.decorators";
import { PrismaService } from "../prisma/prisma.module";
import {
  CreateStaffAssignmentDto,
  CreateStaffDto,
  UpdateStaffAssignmentDto,
  UpdateStaffDto,
} from "./dto/staff.dto";

/*
 * TODO(BE): giới hạn theo thành viên sự kiện – EventMemberGuard @EventRoles(OWNER, CO_ORGANIZER).
 *  - Route có eventId (query/body/:eventId): kiểm tra trực tiếp. Route theo :id bản ghi: tra eventId của bản ghi rồi kiểm tra.
 *  - GET danh sách không truyền eventId: ORGANIZER chỉ nhận bản ghi thuộc sự kiện mình là thành viên (ADMIN: tất cả).
 *  - /resources/staff và /resources/vendors là danh bạ dùng chung (không có eventId) → giữ @Roles(ORGANIZER).
 *  (chi tiết guard + ma trận quyền: ghi chú đầu file src/events/events.controller.ts)
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
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("eventId") eventId?: string) {
    return this.prisma.staffAssignment.findMany({
      where: { eventId },
      include: { staff: { select: { id: true, fullName: true, phone: true } } },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
    });
  }

  @Post()
  create(@Body() dto: CreateStaffAssignmentDto) {
    return this.prisma.staffAssignment.create({ data: dto });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateStaffAssignmentDto) {
    return this.prisma.staffAssignment.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.staffAssignment.delete({ where: { id } });
  }
}
