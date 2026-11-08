import { describe, it, expect } from "vitest";
import { classifySideEffect, slotStatus, isPlanActive, emptyTurningPlan, turnSummary, dayKey } from "./care-engine";

describe("side-effect classification", () => {
  it("mild non-repeated symptom is only logged", () => expect(classifySideEffect({ symptom: "نعاس", severity: "خفيف", repeated: false })).toBe("LOG"));
  it("moderate symptom needs team review", () => expect(classifySideEffect({ symptom: "دوخة", severity: "متوسط", repeated: false })).toBe("REVIEW"));
  it("repeated mild symptom needs review", () => expect(classifySideEffect({ symptom: "غثيان", severity: "خفيف", repeated: true })).toBe("REVIEW"));
  it("throat swelling is an emergency even if mild", () => expect(classifySideEffect({ symptom: "تورم الشفاه أو اللسان أو الحلق", severity: "خفيف", repeated: false })).toBe("EMERGENCY"));
  it("nurse-added red flag escalates to emergency", () => expect(classifySideEffect({ symptom: "نزيف لثة", severity: "خفيف", repeated: false }, ["نزيف لثة"])).toBe("EMERGENCY"));
});

describe("turning plan", () => {
  it("plan is not active for caregiver until nurse approves", () => {
    const p = { ...emptyTurningPlan(), slots: [{ id: "a", time: "10:00", positionId: "SUPINE" }] };
    expect(isPlanActive(p)).toBe(false);
    expect(isPlanActive({ ...p, approved: { by: "ممرض", at: "x" } })).toBe(true);
  });
  it("slot becomes overdue after the nurse-set grace minutes", () => {
    const s = { id: "a", time: "10:00", positionId: "SUPINE" };
    expect(slotStatus(s, undefined, new Date(2026, 0, 1, 10, 20), 30)).toBe("DUE");
    expect(slotStatus(s, undefined, new Date(2026, 0, 1, 10, 45), 30)).toBe("OVERDUE");
    expect(slotStatus(s, undefined, new Date(2026, 0, 1, 10, 45), 60)).toBe("DUE");
    expect(slotStatus(s, { at: "x", by: "y" }, new Date(2026, 0, 1, 12, 0), 30)).toBe("DONE");
  });
  it("summary counts done and overdue", () => {
    const now = new Date(2026, 0, 1, 14, 0);
    const plan = { ...emptyTurningPlan(), approved: { by: "n", at: "x" }, slots: [{ id: "a", time: "08:00", positionId: "SUPINE" }, { id: "b", time: "11:00", positionId: "LEFT" }, { id: "c", time: "18:00", positionId: "RIGHT" }] };
    expect(turnSummary(plan, { [`${dayKey(now)}|a`]: { at: "x", by: "m" } }, now)).toEqual({ total: 3, done: 1, overdue: 1, due: 0 });
  });
});
