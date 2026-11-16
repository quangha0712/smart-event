import { ArgumentsHost, Catch, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

/** Chuyển lỗi Prisma thường gặp thành HTTP 4xx thay vì 500. */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return this.reply(res, HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ");
    }
    switch (exception.code) {
      case "P2025":
        return this.reply(res, HttpStatus.NOT_FOUND, "Không tìm thấy bản ghi");
      case "P2002":
        return this.reply(res, HttpStatus.CONFLICT, "Dữ liệu bị trùng với bản ghi đã có");
      case "P2003":
        return this.reply(res, HttpStatus.BAD_REQUEST, "Tham chiếu không tồn tại (kiểm tra eventId, vendorId, staffId...)");
      default:
        return super.catch(exception, host);
    }
  }

  private reply(res: Response, statusCode: number, message: string) {
    res.status(statusCode).json({ statusCode, message });
  }
}
