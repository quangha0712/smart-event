import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/auth.decorators";
import { PrismaService } from "../prisma/prisma.module";
import { CreateSponsorDto, CreateVendorDto, UpdateSponsorDto, UpdateVendorDto } from "./dto/partner.dto";

/*
 * TODO(BE): giới hạn theo thành viên sự kiện – EventMemberGuard @EventRoles(OWNER, CO_ORGANIZER).
 *  - Route có eventId (query/body/:eventId): kiểm tra trực tiếp. Route theo :id bản ghi: tra eventId của bản ghi rồi kiểm tra.
 *  - GET danh sách không truyền eventId: ORGANIZER chỉ nhận bản ghi thuộc sự kiện mình là thành viên (ADMIN: tất cả).
 *  - /resources/staff và /resources/vendors là danh bạ dùng chung (không có eventId) → giữ @Roles(ORGANIZER).
 *  (chi tiết guard + ma trận quyền: ghi chú đầu file src/events/events.controller.ts)
 */
@Roles(UserRole.ORGANIZER)
@Controller("resources/vendors")
export class VendorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("serviceType") serviceType?: string) {
    return this.prisma.vendor.findMany({ where: { serviceType }, orderBy: { name: "asc" } });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.vendor.findUniqueOrThrow({ where: { id } });
  }

  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: dto });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateVendorDto) {
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.vendor.delete({ where: { id } });
  }
}

@Roles(UserRole.ORGANIZER)
@Controller("resources/sponsors")
export class SponsorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("eventId") eventId?: string) {
    return this.prisma.sponsor.findMany({ where: { eventId }, orderBy: [{ amount: "desc" }, { name: "asc" }] });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.sponsor.findUniqueOrThrow({ where: { id } });
  }

  @Post()
  create(@Body() dto: CreateSponsorDto) {
    return this.prisma.sponsor.create({ data: dto });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSponsorDto) {
    return this.prisma.sponsor.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.sponsor.delete({ where: { id } });
  }
}
