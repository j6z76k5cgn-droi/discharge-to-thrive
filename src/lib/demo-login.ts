// DEMO-ONLY sign-in. No real verification, no SMS/OTP, no hospital connection.
// Replace with real authentication later; keep the same function signatures.
export type PatientRef = { id: string; mrn: string; phone: string };
export const DEMO_PATIENT_ID = "0000000000"; // opens the first demo patient
export const DEMO_STAFF = ["salma.rn@midad-health.sa", "RN-1001"];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");

/** Returns the matching demo patient id, or null. Random numbers never open a record. */
export function matchPatient(input: string, list: PatientRef[]): string | null {
  const v = norm(input);
  if (!v) return null;
  if (v === DEMO_PATIENT_ID) return list[0]?.id ?? null;
  const hit = list.find((p) => norm(p.mrn) === v || norm(p.phone) === v);
  return hit?.id ?? null;
}

export function matchStaff(input: string): boolean {
  const v = norm(input);
  return !!v && DEMO_STAFF.some((s) => norm(s) === v);
}
