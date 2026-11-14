import { describe, it, expect } from "vitest";
import { matchServices } from "./services-guide";
describe("services guide", () => {
  it("routes stroke rehab question to physiotherapy", () => { expect(matchServices("نحتاج تأهيل بعد الجلطة").map((s) => s.id)).toContain("physio"); });
  it("routes home care question", () => { expect(matchServices("كيف أحصل على خدمة الرعاية المنزلية؟").map((s) => s.id)).toContain("homecare"); });
  it("returns nothing for unrelated text instead of guessing", () => { expect(matchServices("ما لون السماء")).toEqual([]); });
});
