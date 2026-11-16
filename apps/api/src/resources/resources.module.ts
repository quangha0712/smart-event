import { Module } from "@nestjs/common";
import { BudgetItemsController, BudgetSummaryController, ExpensesController } from "./budget.controller";
import { BudgetService } from "./budget.service";
import { SponsorsController, VendorsController } from "./partners.controller";
import { StaffAssignmentsController, StaffController } from "./staff.controller";

/** Nguồn lực: nhân sự, nhà cung cấp, nhà tài trợ, ngân sách (dự toán – thực chi). */
@Module({
  controllers: [
    StaffController,
    StaffAssignmentsController,
    VendorsController,
    SponsorsController,
    BudgetItemsController,
    ExpensesController,
    BudgetSummaryController,
  ],
  providers: [BudgetService],
})
export class ResourcesModule {}
