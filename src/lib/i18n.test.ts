import { describe, it, expect } from "vitest";
import { tr } from "./i18n";
describe("translation", () => {
  it("leaves no Arabic for known UI strings", () => { expect(tr("قياس السكر")).not.toMatch(/[\u0600-\u06FF]/); });
  it("keeps non-Arabic text unchanged", () => { expect(tr("Paracetamol 500 mg")).toBe("Paracetamol 500 mg"); });
});
