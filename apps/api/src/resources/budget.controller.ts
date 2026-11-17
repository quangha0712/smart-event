import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthUser, CurrentUser, Roles } from "../auth/auth.decorators";
import { EVENT_ROLES, EventAccessService, EventRoles } from "../auth/event-access";
import { PrismaService } from "../prisma/prisma.module";
import { BudgetService } from "./budget.service";
import { CreateBudgetItemDto, CreateExpenseDto, UpdateBudgetItemDto, UpdateExpenseDto } from "./dto/budget.dto";

/*
 * Dự toán, thực chi, tổng hợp ngân sách: chỉ Chủ sự kiện / Đồng tổ chức của sự kiện (và ADMIN).
 * Danh sách không truyền eventId → chỉ trả bản ghi của các sự kiện mình quản lý.
 */

/** Dự toán. */
@Roles(UserRole.ORGANIZER)
@Controller("resources/budget-items")
export class BudgetItemsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budget: BudgetService,
    private readonly access: EventAccessService,
  ) {}

  @EventRoles(EVENT_ROLES.MANAGERS, { optional: true })
  @Get()
  async list(@CurrentUser() user: AuthUser, @Query("eventId") eventId?: string) {
    return this.prisma.budgetItem.findMany({
      where: { eventId: await this.access.eventFilter(user, eventId, EVENT_ROLES.MANAGERS) },
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "budgetItem" })
  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.budgetItem.findUniqueOrThrow({ where: { id }, include: { vendor: true, expenses: true } });
  }

  @EventRoles(EVENT_ROLES.MANAGERS)
  @Post()
  create(@Body() dto: CreateBudgetItemDto) {
    return this.budget.createItem(dto);
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "budgetItem" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBudgetItemDto) {
    return this.budget.updateItem(id, dto);
  }

  /** Xoá dòng dự toán; các khoản thực chi liên quan được giữ lại (thành chi ngoài dự toán). */
  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "budgetItem" })
  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.budgetItem.delete({ where: { id } });
  }
}

/** Thực chi. */
@Roles(UserRole.ORGANIZER)
@Controller("resources/expenses")
export class ExpensesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EventAccessService,
  ) {}

  @EventRoles(EVENT_ROLES.MANAGERS, { optional: true })
  @Get()
  async list(@CurrentUser() user: AuthUser, @Query("eventId") eventId?: string, @Query("budgetItemId") budgetItemId?: string) {
    return this.prisma.expense.findMany({
      where: { eventId: await this.access.eventFilter(user, eventId, EVENT_ROLES.MANAGERS), budgetItemId },
      include: { vendor: { select: { id: true, name: true } }, budgetItem: { select: { id: true, name: true } } },
      orderBy: { paidAt: "desc" },
    });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "expense" })
  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.expense.findUniqueOrThrow({ where: { id } });
  }

  @EventRoles(EVENT_ROLES.MANAGERS)
  @Post()
  async create(@Body() dto: CreateExpenseDto) {
    await this.assertBudgetItemInEvent(dto.budgetItemId, dto.eventId);
    return this.prisma.expense.create({ data: dto });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "expense" })
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateExpenseDto) {
    if (dto.budgetItemId) {
      const eventId = dto.eventId ?? (await this.prisma.expense.findUniqueOrThrow({ where: { id }, select: { eventId: true } })).eventId;
      await this.assertBudgetItemInEvent(dto.budgetItemId, eventId);
    }
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  @EventRoles(EVENT_ROLES.MANAGERS, { resolveFrom: "expense" })
  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.expense.delete({ where: { id } });
  }

  /** Khoản chi chỉ được gắn với dòng dự toán của cùng sự kiện. */
  private async assertBudgetItemInEvent(budgetItemId: string | undefined, eventId: string) {
    if (!budgetItemId) return;
    const item = await this.prisma.budgetItem.findUnique({ where: { id: budgetItemId }, select: { eventId: true } });
    if (!item || item.eventId !== eventId) throw new BadRequestException("Dòng dự toán không thuộc sự kiện này");
  }
}

/** Bảng so sánh dự toán – thực chi theo sự kiện. */
@Roles(UserRole.ORGANIZER)
@Controller("resources/budget-summary")
export class BudgetSummaryController {
  constructor(private readonly budget: BudgetService) {}

  @EventRoles(EVENT_ROLES.MANAGERS)
  @Get(":eventId")
  summary(@Param("eventId") eventId: string) {
    return this.budget.summary(eventId);
  }
}
