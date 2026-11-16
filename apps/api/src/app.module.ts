import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { EventsModule } from "./events/events.module";
import { AiModule } from "./integrations/ai/ai.module";
import { ResourcesModule } from "./resources/resources.module";

@Module({ imports: [PrismaModule, HealthModule, EventsModule, ResourcesModule, AiModule] })
export class AppModule {}
