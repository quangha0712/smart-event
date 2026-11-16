import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";
import {
  CreateStaffAssignmentDto,
  CreateStaffDto,
  UpdateStaffAssignmentDto,
  UpdateStaffDto,
} from "./dto/staff.dto";

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
