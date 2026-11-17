/** Dạng dữ liệu trả về từ /api/resources/* (Decimal là chuỗi). */

export type AssignmentStatus = "ASSIGNED" | "CONFIRMED" | "DECLINED" | "COMPLETED";

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  ASSIGNED: "Đã phân công",
  CONFIRMED: "Đã xác nhận",
  DECLINED: "Từ chối",
  COMPLETED: "Hoàn thành",
};

export type StaffMember = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  skills: string | null;
  note: string | null;
};

export type StaffAssignment = {
  id: string;
  eventId: string;
  staffId: string;
  role: string;
  task: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: AssignmentStatus;
  staff: { id: string; fullName: string; phone: string | null };
};

export type Vendor = {
  id: string;
  name: string;
  serviceType: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxCode: string | null;
  note: string | null;
};

export type Sponsor = {
  id: string;
  eventId: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  tier: string | null;
  amount: string;
  note: string | null;
};

export type BudgetItem = {
  id: string;
  eventId: string;
  vendorId: string | null;
  name: string;
  category: string;
  quantity: string;
  unit: string | null;
  unitPrice: string;
  plannedAmount: string;
  isIncome: boolean;
  note: string | null;
  vendor: { id: string; name: string } | null;
};

export type Expense = {
  id: string;
  eventId: string;
  budgetItemId: string | null;
  vendorId: string | null;
  description: string;
  amount: string;
  paidAt: string;
  invoiceNumber: string | null;
  note: string | null;
  vendor: { id: string; name: string } | null;
  budgetItem: { id: string; name: string } | null;
};

export type BudgetSummary = {
  eventId: string;
  totals: {
    plannedExpense: string;
    actualExpense: string;
    unplannedExpense: string;
    expenseVariance: string;
    plannedIncome: string;
    sponsorTotal: string;
    balance: string;
  };
  lines: Array<{
    id: string;
    category: string;
    name: string;
    isIncome: boolean;
    plannedAmount: string;
    actualAmount: string;
    variance: string;
  }>;
};
