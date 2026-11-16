import { Module } from "@nestjs/common";
import { RegistrationsController } from "./registrations.controller";
import { RegistrationsService } from "./registrations.service";
import { AuditLogModule } from "../audit-log/audit-log.module";

@Module({ imports: [AuditLogModule], controllers: [RegistrationsController], providers: [RegistrationsService], exports: [RegistrationsService] })
export class RegistrationsModule {}
