import { Module } from "@nestjs/common";
import { CheckInController } from "./check-in.controller";
import { CheckInService } from "./check-in.service";
import { AuditLogModule } from "../audit-log/audit-log.module";

@Module({ imports: [AuditLogModule], controllers: [CheckInController], providers: [CheckInService], exports: [CheckInService] })
export class CheckInModule {}
