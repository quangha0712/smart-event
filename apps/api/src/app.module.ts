import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { CheckInModule } from "./check-in/check-in.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { EventsModule } from "./events/events.module";
import { AiModule } from "./integrations/ai/ai.module";
import { ResourcesModule } from "./resources/resources.module";

@Module({ imports: [PrismaModule, AuthModule, HealthModule, EventsModule, CheckInModule, ResourcesModule, AiModule] })
export class AppModule {}
