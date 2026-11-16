import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";
import { BudgetService } from "./budget.service";
import { CreateBudgetItemDto, CreateExpenseDto, UpdateBudgetItemDto, UpdateExpenseDto } from "./dto/budget.dto";

/** Dự toán. */
@Controller("resources/budget-items")
export class BudgetItemsController {
  constructor(private readonly prisma: PrismaService, private readonly budget: BudgetService) {}

  @Get()
  list(@Query("eventId") eventId?: string) {
    return this.prisma.budgetItem.findMany({
      where: { eventId },
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.budgetItem.findUniqueOrThrow({ where: { id }, include: { vendor: true, expenses: true } });
  }

  @Post()
  create(@Body() dto: CreateBudgetItemDto) {
    return this.budget.createItem(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBudgetItemDto) {
    return this.budget.updateItem(id, dto);
  }

  /** Xoá dòng dự toán; các khoản thực chi liên quan được giữ lại (thành chi ngoài dự toán). */
  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.budgetItem.delete({ where: { id } });
  }
}

/** Thực chi. */
@Controller("resources/expenses")
export class ExpensesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("eventId") eventId?: string, @Query("budgetItemId") budgetItemId?: string) {
    return this.prisma.expense.findMany({
      where: { eventId, budgetItemId },
      include: { vendor: { select: { id: true, name: true } }, budgetItem: { select: { id: true, name: true } } },
      orderBy: { paidAt: "desc" },
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.expense.findUniqueOrThrow({ where: { id } });
  }

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.prisma.expense.create({ data: dto });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateExpenseDto) {
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.prisma.expense.delete({ where: { id } });
  }
}

/** Bảng so sánh dự toán – thực chi theo sự kiện. */
@Controller("resources/budget-summary")
export class BudgetSummaryController {
  constructor(private readonly budget: BudgetService) {}

  @Get(":eventId")
  summary(@Param("eventId") eventId: string) {
    return this.budget.summary(eventId);
  }
}
