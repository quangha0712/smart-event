import { Module } from "@nestjs/common";
import { EventMembersService } from "./event-members.service";
import { EventMembersController, EventsController, MyEventMembershipsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  controllers: [EventsController, EventMembersController, MyEventMembershipsController],
  providers: [EventsService, EventMembersService],
})
export class EventsModule {}
