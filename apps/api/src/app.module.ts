import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { EventsModule } from "./events/events.module";
import { AiModule } from "./integrations/ai/ai.module";

@Module({ imports: [PrismaModule, HealthModule, EventsModule, AiModule] })
export class AppModule {}
