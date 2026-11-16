import { Controller, Get, Module } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

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
