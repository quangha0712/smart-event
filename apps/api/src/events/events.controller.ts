import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiTags } from "@nestjs/swagger";
import { Public, Roles } from "../auth/auth.decorators";
import { CreateEventDto } from "./dto/create-event.dto";
import { EventsService } from "./events.service";

@Controller("events")
@ApiTags("Events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Public()
  @Get()
  list() {
    return this.events.list();
  }

  @Public()
  @Get(":id")
  async getById(@Param("id") id: string) {
    const event = await this.events.getById(id);
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    return event;
  }

  @Roles(UserRole.ORGANIZER)
  @Post()
  create(@Body() input: CreateEventDto) {
    return this.events.create(input);
  }
}
