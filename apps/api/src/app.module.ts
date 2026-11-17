import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { CheckInModule } from "./check-in/check-in.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { EventsModule } from "./events/events.module";
import { SchedulesModule } from "./schedules/schedules.module";
import { ReportsModule } from "./reports/reports.module";
import { AiModule } from "./integrations/ai/ai.module";
import { RegistrationsModule } from "./registrations/registrations.module";
import { TicketsModule } from "./tickets/tickets.module";
import { AuditLogModule } from "./audit-log/audit-log.module";
import { ResourcesModule } from "./resources/resources.module";

@Module({
  imports: [PrismaModule, AuthModule, HealthModule, EventsModule, SchedulesModule, ReportsModule, RegistrationsModule, TicketsModule, CheckInModule, AuditLogModule, ResourcesModule, AiModule],
})
export class AppModule {}
