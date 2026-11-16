import { CheckInRuleWindows } from "./ai.types";

// Fixed server-side policy. The frontend chooses only the analysis period.
export const CHECKIN_RULE_WINDOWS: Readonly<CheckInRuleWindows> = Object.freeze({
  rapidRepeatMinutes: 5,
  persistentRepeatSpanMinutes: 10,
  repeatBurstMinutes: 5,
  repeatBurstSeparationMinutes: 30,
  multipleAcceptedWindowSeconds: 10,
});
