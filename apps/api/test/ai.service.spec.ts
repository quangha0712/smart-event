import { AiService } from "../src/integrations/ai/ai.service";
import { CheckInAnalysisInput } from "../src/integrations/ai/ai.types";

const baseTime = Date.parse("2026-11-15T09:00:00.000Z");
const at = (minutesAgo: number) => new Date(baseTime - minutesAgo * 60_000).toISOString();

function makeInput(attempts: CheckInAnalysisInput["ticketPatterns"][number]["attempts"]): CheckInAnalysisInput {
  return {
    eventId: "event-1",
    from: new Date(baseTime - 60 * 60_000),
    to: new Date(baseTime),
    totalAttempts: attempts.length,
    accepted: attempts.filter((attempt) => attempt.status === "ACCEPTED").length,
    repeatedScans: attempts.filter((attempt) => attempt.status === "ALREADY_USED").length,
    invalidCodes: attempts.filter((attempt) => attempt.status === "INVALID").length,
    ticketsWithRepeatedScans: 1,
    ticketsWithHighRepeatCount: 1,
    ruleWindows: {
      rapidRepeatMinutes: 5,
      persistentRepeatSpanMinutes: 10,
      repeatBurstMinutes: 5,
      repeatBurstSeparationMinutes: 30,
      multipleAcceptedWindowSeconds: 10,
    },
    ticketPatterns: [{ ticketRef: "ticket-1", attempts }],
  };
}

describe("AiService.checkInAnalysis rules", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.AI_API_KEY;

  beforeEach(() => {
    process.env.AI_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  });

  async function classify(attempts: CheckInAnalysisInput["ticketPatterns"][number]["attempts"]) {
    const llmResult = {
      summary: "Cần rà soát.",
      riskLevel: "review",
      anomalies: [],
      ticketAssessments: [{ ticketRef: "ticket-1", verdict: "fraud_suspected", confidence: 0.95, evidence: ["Mẫu quét nhiều thiết bị"] }],
      recommendations: [],
      limitations: [],
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(llmResult) } }] }),
    }) as unknown as typeof fetch;

    const response = await new AiService().checkInAnalysis(makeInput(attempts));
    return (response.result as Record<string, any>).ticketFraudConclusions[0];
  }

  it("classifies rapid repeats across devices under R1", async () => {
    const result = await classify([
      { scannedAt: at(8), status: "ACCEPTED", deviceId: "scanner-a" },
      { scannedAt: at(7), status: "ALREADY_USED", deviceId: "scanner-a" },
      { scannedAt: at(6.5), status: "ALREADY_USED", deviceId: "scanner-b" },
      { scannedAt: at(6), status: "ALREADY_USED", deviceId: "scanner-b" },
    ]);

    expect(result.isFraud).toBe(true);
    expect(result.decision).toBe("FRAUD_BY_PROJECT_POLICY");
  });

  it("classifies persistent repeats across devices under R2", async () => {
    const result = await classify([
      { scannedAt: at(35), status: "ACCEPTED", deviceId: "scanner-a" },
      { scannedAt: at(30), status: "ALREADY_USED", deviceId: "scanner-a" },
      { scannedAt: at(25), status: "ALREADY_USED", deviceId: "scanner-b" },
      { scannedAt: at(20), status: "ALREADY_USED", deviceId: "scanner-a" },
      { scannedAt: at(15), status: "ALREADY_USED", deviceId: "scanner-b" },
      { scannedAt: at(12), status: "ALREADY_USED", deviceId: "scanner-a" },
    ]);

    expect(result.isFraud).toBe(true);
    expect(result.decision).toBe("FRAUD_BY_PROJECT_POLICY");
  });

  it("classifies separated repeat bursts across devices under R3", async () => {
    const result = await classify([
      { scannedAt: at(55), status: "ACCEPTED", deviceId: "scanner-a" },
      { scannedAt: at(50), status: "ALREADY_USED", deviceId: "scanner-a" },
      { scannedAt: at(49), status: "ALREADY_USED", deviceId: "scanner-b" },
      { scannedAt: at(8), status: "ALREADY_USED", deviceId: "scanner-a" },
      { scannedAt: at(7), status: "ALREADY_USED", deviceId: "scanner-b" },
    ]);

    expect(result.isFraud).toBe(true);
    expect(result.decision).toBe("FRAUD_BY_PROJECT_POLICY");
  });
});
