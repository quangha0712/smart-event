import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { EventsModule } from "./events/events.module";
import { AiModule } from "./integrations/ai/ai.module";
import { RegistrationsModule } from "./registrations/registrations.module";
import { TicketsModule } from "./tickets/tickets.module";
import { CheckInModule } from "./check-in/check-in.module";
import { AuditLogModule } from "./audit-log/audit-log.module";

@Module({ imports: [PrismaModule, HealthModule, EventsModule, RegistrationsModule, TicketsModule, CheckInModule, AuditLogModule, AiModule] })
export class AppModule {}
