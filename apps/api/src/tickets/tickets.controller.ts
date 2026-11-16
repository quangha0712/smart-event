import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TicketsService } from "./tickets.service";

@Controller("tickets")
@ApiTags("Tickets")
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get(":qrCode")
  getByQrCode(@Param("qrCode") qrCode: string) {
    return this.tickets.getByQrCode(qrCode);
  }
}
