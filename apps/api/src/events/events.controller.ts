import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { EventsService, NewEventInput } from "./events.service";

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
  create(@Body() input: NewEventInput) {
    return this.events.create(input);
  }
}
