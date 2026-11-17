import { BadRequestException, Controller, Get, NotFoundException, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.module";
import { AuditLogService } from "./audit-log.service";

// TODO(BE) – BẢO MẬT: controller này chưa có @Roles nên MỌI tài khoản đã đăng nhập (kể cả ATTENDEE) đều đọc được
// audit log của bất kỳ sự kiện nào. Cần thêm @Roles(UserRole.ORGANIZER) + EventMemberGuard @EventRoles(OWNER, CO_ORGANIZER)
// với eventId lấy từ query. (chi tiết guard + ma trận quyền: ghi chú đầu file src/events/events.controller.ts)
@Controller("audit-logs")
@ApiTags("Audit logs")
export class AuditLogController {
  constructor(
    private readonly auditLogs: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@Query() query: { eventId?: string; from?: string; to?: string; page?: string; pageSize?: string }) {
    if (typeof query.eventId !== "string" || !query.eventId.trim() || query.eventId.length > 191) {
      throw new BadRequestException("eventId là bắt buộc và tối đa 191 ký tự.");
    }
    const eventId = query.eventId.trim();
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện.");

    const now = new Date();
    const from = query.from ? new Date(query.from) : new Date(now.valueOf() - 24 * 60 * 60_000);
    const to = query.to ? new Date(query.to) : now;
    if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from > to) {
      throw new BadRequestException("from/to phải là thời điểm hợp lệ và from không được sau to.");
    }
    if (to.valueOf() - from.valueOf() > 30 * 24 * 60 * 60_000) {
      throw new BadRequestException("Khoảng truy vấn audit log tối đa là 30 ngày.");
    }

    const page = this.parseInteger(query.page, 1, 1_000_000, "page");
    const pageSize = this.parseInteger(query.pageSize, 50, 200, "pageSize");
    return this.auditLogs.listByEvent(eventId, from, to, page, pageSize);
  }

  private parseInteger(value: string | undefined, fallback: number, max: number, field: string) {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
      throw new BadRequestException(`${field} phải là số nguyên từ 1 đến ${max}.`);
    }
    return parsed;
  }
}
