import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateRegistrationInput } from "./registration.types";
import { RegistrationsService } from "./registrations.service";

@Controller("events/:eventId/registrations")
@ApiTags("Registrations")
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Post()
  create(@Param("eventId") eventId: string, @Body() body: CreateRegistrationInput) {
    return this.registrations.create(eventId, body?.userId);
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
