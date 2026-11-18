import { Module } from "@nestjs/common";
import { SchedulesController, SpeakersController } from "./schedules.controller";
import { SchedulesService } from "./schedules.service";

@Module({ controllers: [SchedulesController, SpeakersController], providers: [SchedulesService] })
export class SchedulesModule {}
