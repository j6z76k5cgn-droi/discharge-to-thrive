import { describe, expect, it } from "vitest";
import { matchPatient, matchStaff } from "./demo-login";
const list = [
  { id: "p1", mrn: "MRN-102938", phone: "0500000001" },
  { id: "p2", mrn: "MRN-204511", phone: "0500000002" },
];
describe("demo login", () => {
  it("demo ID 0000000000 opens the first demo patient", () => expect(matchPatient("0000000000", list)).toBe("p1"));
  it("MRN or phone opens that patient", () => {
    expect(matchPatient(" mrn-204511 ", list)).toBe("p2");
    expect(matchPatient("0500000001", list)).toBe("p1");
  });
  it("random number opens nothing", () => expect(matchPatient("1234567890", list)).toBeNull());
  it("staff accepts only predefined demo accounts", () => {
    expect(matchStaff("SALMA.RN@midad-health.sa")).toBe(true);
    expect(matchStaff("RN-1001")).toBe(true);
    expect(matchStaff("someone@x.com")).toBe(false);
  });
});
