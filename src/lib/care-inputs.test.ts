import { describe, expect, it } from "vitest";
import { forbiddenFromText, shouldShowSideEffectForm } from "./care-inputs";

describe("care input rules", () => {
  it("preserves ordinary spaces without requiring commas", () => {
    const text = "على البطن  أو الجانب الأيمن \nحسب تعليمات الفريق، فقط";
    expect(forbiddenFromText(text)).toEqual([text]);
    expect(forbiddenFromText("على ")).toEqual(["على "]);
    expect(forbiddenFromText("")).toEqual([]);
  });
  it("opens a report only for a missed dose caused by side effects", () => {
    expect(shouldShowSideEffectForm({ status: "MISSED", reason: "ظهرت أعراض جانبية" }, false)).toBe(true);
    for (const reason of ["نسيت", "ما توفر الدواء", "سبب آخر", "ما قدرت آخذ الدواء (صعوبة بلع/غثيان)"]) {
      expect(shouldShowSideEffectForm({ status: "MISSED", reason }, false)).toBe(false);
    }
    expect(shouldShowSideEffectForm(undefined, false)).toBe(false);
    expect(shouldShowSideEffectForm({ status: "TAKEN", at: "08:00" }, false)).toBe(false);
  });
  it("never opens an editable report in the nurse read-only view", () => {
    expect(shouldShowSideEffectForm({ status: "MISSED", reason: "ظهرت أعراض جانبية" }, true)).toBe(false);
  });
});