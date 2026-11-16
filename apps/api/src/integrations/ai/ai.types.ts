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

export type CheckInRuleWindows = {
  rapidRepeatMinutes: number;
  persistentRepeatSpanMinutes: number;
  repeatBurstMinutes: number;
  repeatBurstSeparationMinutes: number;
  multipleAcceptedWindowSeconds: number;
};

export type CheckInAnalysisInput = {
  eventId: string;
  from: Date;
  to: Date;
  totalAttempts: number;
  accepted: number;
  repeatedScans: number;
  invalidCodes: number;
  ticketsWithRepeatedScans: number;
  ticketsWithHighRepeatCount: number;
  ruleWindows: CheckInRuleWindows;
  ticketPatterns: Array<{
    ticketRef: string;
    attempts: Array<{
      scannedAt: string;
      status: "ACCEPTED" | "ALREADY_USED" | "INVALID";
      deviceId: string;
    }>;
  }>;
};
