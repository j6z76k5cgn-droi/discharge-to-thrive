import { describe, it, expect } from "vitest";
import { replyFor } from "./assistant-faq";
describe("patient assistant replies", () => {
  it("emergency words go to emergency, never to a normal answer", () => { expect(replyFor("عندي ألم صدر شديد").kind).toBe("emergency"); });
  it("known question gets an automatic answer", () => { const r = replyFor("نسيت الجرعة وش أسوي؟"); expect(r.kind === "faq" && r.faq.id).toBe("dose"); });
  it("unknown question is sent to the on-call nurse", () => { expect(replyFor("هل أقدر أسافر الأسبوع الجاي؟").kind).toBe("escalate"); });
});
