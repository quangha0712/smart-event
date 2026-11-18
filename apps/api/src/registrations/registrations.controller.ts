import { Body, Controller, Delete, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthUser, CurrentUser } from "../auth/auth.decorators";
import { EVENT_ROLES, EventAccessService } from "../auth/event-access";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.module";
import { CreateRegistrationInput } from "./registration.types";
import { RegistrationsService } from "./registrations.service";

@Controller("events/:eventId/registrations")
@ApiTags("Registrations")
export class RegistrationsController {
  constructor(
    private readonly registrations: RegistrationsService,
    private readonly prisma: PrismaService,
    private readonly access: EventAccessService,
  ) {}

  @Post()
  async create(@Param("eventId") eventId: string, @Body() body: CreateRegistrationInput, @CurrentUser() user: AuthUser) {
    // Người tham dự chỉ tự đăng ký cho mình. Đăng ký hộ (userId khác mình) chỉ dành cho
    // Chủ sự kiện / Đồng tổ chức của chính sự kiện này, hoặc ADMIN.
    const canRegisterOthers = user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN;
    const userId = canRegisterOthers && body?.userId ? body.userId : user.id;
    if (userId !== user.id) await this.access.assert(user, eventId, EVENT_ROLES.MANAGERS);
    return this.registrations.create(eventId, userId);
  }

  @Get(":registrationId")
  async getOne(@Param("eventId") eventId: string, @Param("registrationId") registrationId: string, @CurrentUser() user: AuthUser) {
    await this.assertCanAccess(user, eventId, registrationId);
    return this.registrations.getOne(eventId, registrationId);
  }

  @Delete(":registrationId")
  async cancel(@Param("eventId") eventId: string, @Param("registrationId") registrationId: string, @CurrentUser() user: AuthUser) {
    await this.assertCanAccess(user, eventId, registrationId);
    return this.registrations.cancel(eventId, registrationId);
  }

  /**
   * Chỉ chủ đăng ký, Chủ sự kiện / Đồng tổ chức của sự kiện, hoặc ADMIN.
   * Người khác nhận 404 (như không tồn tại) để không dò được đăng ký / mã QR của người khác.
   */
  private async assertCanAccess(user: AuthUser, eventId: string, registrationId: string) {
    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, eventId },
      select: { userId: true },
    });
    const allowed =
      registration && (registration.userId === user.id || (await this.access.allows(user, eventId, EVENT_ROLES.MANAGERS)));
    if (!allowed) throw new NotFoundException("Không tìm thấy đăng ký.");
  }
}

/** Các đăng ký của người đang đăng nhập – dùng cho trang chủ và trang "Vé của tôi". */
@Controller("me/registrations")
@ApiTags("Registrations")
export class MyRegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.registrations.listForUser(user.id);
  }
}
