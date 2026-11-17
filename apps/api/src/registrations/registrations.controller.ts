import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthUser, CurrentUser } from "../auth/auth.decorators";
import { ApiTags } from "@nestjs/swagger";
import { CreateRegistrationInput } from "./registration.types";
import { RegistrationsService } from "./registrations.service";

@Controller("events/:eventId/registrations")
@ApiTags("Registrations")
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Post()
  create(@Param("eventId") eventId: string, @Body() body: CreateRegistrationInput, @CurrentUser() user: AuthUser) {
    // Người tham dự chỉ tự đăng ký cho mình; ban tổ chức/quản trị có thể đăng ký hộ bằng userId.
    const canRegisterOthers = user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN;
    const userId = canRegisterOthers && body?.userId ? body.userId : user.id;
    return this.registrations.create(eventId, userId);
  }

  @Get(":registrationId")
  getOne(@Param("eventId") eventId: string, @Param("registrationId") registrationId: string) {
    return this.registrations.getOne(eventId, registrationId);
  }

  @Delete(":registrationId")
  cancel(@Param("eventId") eventId: string, @Param("registrationId") registrationId: string) {
    return this.registrations.cancel(eventId, registrationId);
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
