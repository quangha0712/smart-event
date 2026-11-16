import { Controller, Get, Module } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";

@Public()
@Controller("health")
class HealthController {
  @Get()
  getHealth() {
    return { status: "ok", service: "smart-event-api" };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
