import { Controller, Get, Module } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import { ApiTags } from "@nestjs/swagger";

@Public()
@Controller("health")
@ApiTags("Health")
class HealthController {
  @Get()
  getHealth() {
    return { status: "ok", service: "smart-event-api" };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
