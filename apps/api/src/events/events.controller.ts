import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { CreateEventDto } from "./dto/create-event.dto";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.list();
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const event = await this.events.getById(id);
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    return event;
  }

  @Post()
  create(@Body() input: CreateEventDto) {
    return this.events.create(input);
  }
}
