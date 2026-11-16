import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { CheckInModule } from "../../check-in/check-in.module";

@Module({ imports: [CheckInModule], controllers: [AiController], providers: [AiService] })
export class AiModule {}
