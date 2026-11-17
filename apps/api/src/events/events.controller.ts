import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiTags } from "@nestjs/swagger";
import { Public, Roles } from "../auth/auth.decorators";
import { CreateEventDto } from "./dto/create-event.dto";
import { EventsService } from "./events.service";

/*
 * TODO(BE): THÀNH VIÊN BAN TỔ CHỨC THEO SỰ KIỆN (EventMember) – FE đã xong, đang chờ API.
 * Schema đề xuất: comment ngay trên `model Event` trong prisma/schema.prisma.
 * Ma trận quyền FE dùng: apps/web/src/lib/eventPermissions.ts (giữ hai bên khớp nhau).
 *
 * ── 1. Guard dùng chung: EventMemberGuard + decorator @EventRoles(...roles) (đặt ở src/auth/) ──
 *   - Chạy sau AuthGuard (đã có req.user). ADMIN luôn qua.
 *   - Lấy eventId theo thứ tự: req.params.eventId → req.params.id (route /events/:id/...) → req.query.eventId → req.body.eventId.
 *   - Route theo id bản ghi (vd PATCH /resources/budget-items/:id) không có eventId: tra bản ghi để lấy eventId rồi mới kiểm tra
 *     (có thể cho guard nhận option `resolveEventId: (req, prisma) => Promise<string>`).
 *   - Không phải thành viên / sai vai trò → 403 "Bạn không thuộc ban tổ chức sự kiện này" (không trả 404 để khỏi lộ sự kiện).
 *   - Dùng: @Roles(UserRole.ORGANIZER) + @EventRoles(...) trên controller/handler.
 *
 *   | Nhóm API                                              | Vai trò được phép                      |
 *   |-------------------------------------------------------|----------------------------------------|
 *   | POST /check-in, GET /check-in/events/:eventId/stats   | OWNER, CO_ORGANIZER, CHECKIN_STAFF     |
 *   | resources: staff-assignments, sponsors, budget-items, |                                        |
 *   |   expenses, budget-summary/:eventId                   | OWNER, CO_ORGANIZER                    |
 *   | AI theo sự kiện (/ai/events/:eventId/..., check-in-   |                                        |
 *   |   analysis có eventId trong body)                     | OWNER, CO_ORGANIZER                    |
 *   | GET /audit-logs?eventId=                              | OWNER, CO_ORGANIZER                    |
 *   | PATCH/DELETE /events/:id (khi làm)                    | sửa: OWNER, CO_ORGANIZER; xoá: OWNER   |
 *   | GET /events/:eventId/members                          | mọi thành viên của sự kiện             |
 *   | POST/PATCH/DELETE /events/:eventId/members[/:userId]  | OWNER                                  |
 *   Ghi chú: /resources/staff và /resources/vendors là danh bạ dùng chung (không có eventId) → giữ @Roles(ORGANIZER).
 *
 * ── 2. Endpoint FE đang gọi ──
 *   GET  /me/event-memberships
 *        → [{ eventId, role, event: <cùng dạng một phần tử GET /events> }] – sự kiện mình là thành viên.
 *        FE coi 404 là "API chưa có" và tạm không lọc (hiện banner); khi BE xong thì FE tự lọc, không cần sửa gì.
 *   GET  /events/:eventId/members
 *        → [{ eventId, userId, role, createdAt, user: { id, fullName, email } }], OWNER trước rồi theo createdAt.
 *   POST /events/:eventId/members  { email, role: "CO_ORGANIZER" | "CHECKIN_STAFF" }
 *        → 201 EventMember. 404 không có tài khoản email này; 400 tài khoản không phải ORGANIZER
 *          ("Người được thêm cần có quyền Ban tổ chức"); 409 đã là thành viên. Không cho tạo OWNER qua API này.
 *   PATCH  /events/:eventId/members/:userId  { role: "CO_ORGANIZER" | "CHECKIN_STAFF" } → EventMember
 *   DELETE /events/:eventId/members/:userId  → 204
 *        Cả hai: không được đổi / gỡ OWNER (400 "Không thể đổi hoặc gỡ Chủ sự kiện"); sự kiện luôn còn ít nhất một OWNER.
 *   Message lỗi viết tiếng Việt – FE hiển thị nguyên văn.
 *   Nên ghi AuditLog cho thêm / đổi vai trò / gỡ thành viên.
 *
 * ── 3. Thay đổi endpoint có sẵn ──
 *   - GET /events: đang @Public. Cần đọc token nếu có (guard "optional auth" hoặc tự verify trong handler):
 *       ADMIN → tất cả; ORGANIZER → chỉ sự kiện mình là thành viên, mỗi phần tử thêm `myRole`;
 *       ATTENDEE / khách → chỉ PUBLISHED. FE đã gửi kèm token khi đăng nhập.
 *   - GET /events/:id: bản DRAFT chỉ trả cho thành viên / ADMIN.
 *   - POST /events: xem create() bên dưới.
 */
@Controller("events")
@ApiTags("Events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // TODO(BE): đọc token nếu có – ORGANIZER chỉ nhận sự kiện mình là thành viên (+ myRole), ADMIN tất cả, khách chỉ PUBLISHED.
  @Public()
  @Get()
  list() {
    return this.events.list();
  }

  @Public()
  @Get(":id")
  async getById(@Param("id") id: string) {
    const event = await this.events.getById(id);
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    return event;
  }

  // TODO(BE): nhận @CurrentUser(); trong một transaction: tạo Event với createdById = user.id
  // và tạo EventMember { eventId, userId: user.id, role: OWNER } – người tạo tự thành Chủ sự kiện.
  @Roles(UserRole.ORGANIZER)
  @Post()
  create(@Body() input: CreateEventDto) {
    return this.events.create(input);
  }
}
