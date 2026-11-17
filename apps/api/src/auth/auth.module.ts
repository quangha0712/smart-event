import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { requireSecret } from "../common/secrets";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { EventAccessService, EventMemberGuard } from "./event-access";

/** Global để mọi module dùng được EventAccessService. */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: requireSecret("JWT_SECRET"),
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EventAccessService,
    // Thứ tự quan trọng: AuthGuard (gắn req.user, kiểm tra @Roles) chạy trước EventMemberGuard (@EventRoles).
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: EventMemberGuard },
  ],
  exports: [EventAccessService],
})
export class AuthModule {}
