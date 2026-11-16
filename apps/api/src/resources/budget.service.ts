import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";
import { CreateBudgetItemDto, UpdateBudgetItemDto } from "./dto/budget.dto";

const ZERO = new Prisma.Decimal(0);

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  createItem(dto: CreateBudgetItemDto) {
    const quantity = dto.quantity ?? 1;
    return this.prisma.budgetItem.create({
      data: { ...dto, quantity, plannedAmount: new Prisma.Decimal(quantity).mul(dto.unitPrice) },
    });
  }

  /** Khi đổi số lượng hoặc đơn giá thì tính lại plannedAmount. */
  async updateItem(id: string, dto: UpdateBudgetItemDto) {
    let plannedAmount: Prisma.Decimal | undefined;
    if (dto.quantity !== undefined || dto.unitPrice !== undefined) {
      const current = await this.prisma.budgetItem.findUniqueOrThrow({ where: { id } });
      plannedAmount = new Prisma.Decimal(dto.quantity ?? current.quantity).mul(dto.unitPrice ?? current.unitPrice);
    }
    return this.prisma.budgetItem.update({ where: { id }, data: { ...dto, plannedAmount } });
  }

  /** Tổng hợp dự toán – thực chi của một sự kiện. */
  async summary(eventId: string) {
    await this.prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { id: true } });

    const [items, unplanned, sponsors] = await Promise.all([
      this.prisma.budgetItem.findMany({
        where: { eventId },
        include: { expenses: { select: { amount: true } } },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
      this.prisma.expense.aggregate({ where: { eventId, budgetItemId: null }, _sum: { amount: true } }),
      this.prisma.sponsor.aggregate({ where: { eventId }, _sum: { amount: true } }),
    ]);

    let plannedExpense = ZERO;
    let plannedIncome = ZERO;
    let actualPlannedExpense = ZERO;

    const lines = items.map((item) => {
      const actual = item.expenses.reduce((sum, e) => sum.add(e.amount), ZERO);
      if (item.isIncome) {
        plannedIncome = plannedIncome.add(item.plannedAmount);
      } else {
        plannedExpense = plannedExpense.add(item.plannedAmount);
        actualPlannedExpense = actualPlannedExpense.add(actual);
      }
      return {
        id: item.id,
        category: item.category,
        name: item.name,
        isIncome: item.isIncome,
        plannedAmount: item.plannedAmount,
        actualAmount: actual,
        variance: actual.sub(item.plannedAmount),
      };
    });

    const unplannedExpense = unplanned._sum.amount ?? ZERO;
    const actualExpense = actualPlannedExpense.add(unplannedExpense);
    const sponsorTotal = sponsors._sum.amount ?? ZERO;

    return {
      eventId,
      totals: {
        plannedExpense,
        actualExpense,
        unplannedExpense,
        expenseVariance: actualExpense.sub(plannedExpense),
        plannedIncome,
        sponsorTotal,
        /** Thu dự kiến + tài trợ − thực chi. */
        balance: plannedIncome.add(sponsorTotal).sub(actualExpense),
      },
      lines,
    };
  }
}
