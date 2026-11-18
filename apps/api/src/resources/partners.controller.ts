import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthUser, CurrentUser, Roles } from "../auth/auth.decorators";
import { EVENT_ROLES, EventAccessService, EventRoles } from "../auth/event-access";
import { PrismaService } from "../prisma/prisma.module";
import { CreateSponsorDto, CreateVendorDto, UpdateSponsorDto, UpdateVendorDto } from "./dto/partner.dto";

/*
 * Nhà cung cấp: danh bạ dùng chung (không gắn sự kiện) → chỉ cần quyền Ban tổ chức.
 * Nhà tài trợ gắn với sự kiện → chỉ Chủ sự kiện / Đồng tổ chức của sự kiện (và ADMIN);
 * danh sách không truyền eventId chỉ trả nhà tài trợ của các sự kiện mình quản lý.
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EventAccessService,
  ) {}

  @EventRoles(EVENT_ROLES.MANAGERS, { optional: true })
  @Get()
  async list(@CurrentUser() user: AuthUser, @Query("eventId") eventId?: string) {
    return this.prisma.sponsor.findMany({
      where: { eventId: await this.access.eventFilter(user, eventId, EVENT_ROLES.MANAGERS) },
      orderBy: [{ amount: "desc" }, { name: "asc" }],
    });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "sponsor" })
  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.sponsor.findUniqueOrThrow({ where: { id } });
  }

  @EventRoles(EVENT_ROLES.MANAGERS)
  @Post()
  create(@Body() dto: CreateSponsorDto) {
    return this.prisma.sponsor.create({ data: dto });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "sponsor" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSponsorDto) {
    return this.prisma.sponsor.update({ where: { id }, data: dto });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "sponsor" })
  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.sponsor.delete({ where: { id } });
  }
}
