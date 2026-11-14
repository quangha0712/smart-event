export type AiJson = Record<string, unknown>;

export type ProjectSummaryInput = {
  period: string;
  completedItems: string[];
  pendingItems: string[];
  risks: string[];
};

export type RequirementsDraftInput = {
  problemStatement: string;
  targetUsers: string;
};

export type BudgetEstimateInput = {
  eventType: string;
  attendees: number;
  days: number;
  location: string;
  constraints: string;
  currency: "VND" | "USD";
};

export type CheckInAnalysisInput = {
  eventId: string;
  totalAttempts: number;
  accepted: number;
  repeatedScans: number;
  invalidCodes: number;
  windowMinutes: number;
};
