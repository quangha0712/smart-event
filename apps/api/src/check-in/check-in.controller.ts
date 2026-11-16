import { BadRequestException, Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CheckInInput, CheckInSummaryQuery } from "./check-in.types";
import { CheckInService } from "./check-in.service";

@Controller("events/:eventId")
@ApiTags("Check-in")
export class CheckInController {
  constructor(private readonly checkIn: CheckInService) {}

  @Post("check-in")
  checkInTicket(@Param("eventId") eventId: string, @Body() body: CheckInInput) {
    if (typeof body?.qrCode !== "string" || !body.qrCode.trim() || body.qrCode.length > 191) {
      throw new BadRequestException("qrCode là bắt buộc và tối đa 191 ký tự.");
    }
    if (typeof body?.deviceId !== "string" || !body.deviceId.trim() || body.deviceId.length > 191) {
      throw new BadRequestException("deviceId là bắt buộc và tối đa 191 ký tự.");
    }
    return this.checkIn.process(eventId, body.qrCode.trim(), body.deviceId.trim());
  }

  @Get("check-ins/summary")
  summary(@Param("eventId") eventId: string, @Query() query: CheckInSummaryQuery) {
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();
    if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from > to) {
      throw new BadRequestException("Khoảng thời gian check-in không hợp lệ.");
    }
    return this.checkIn.getSummary(eventId, from, to);
  }
}
