import { useSyncExternalStore } from "react";

export interface MedPlan {
  id: string;
  name: string;
  route: string; // فموي / وريدي / عضل
  times: string[];
  windowMin: number; // ± adherence window
  missedAfterMin: number; // missed dose threshold
  knownEffects?: string; // أعراض جانبية معروفة (من معلومات الدواء المعتمدة) يدخلها الممرض
}
export interface ManagedPatient {
  id: string;
  name: string;
  mrn: string;
  ward: string;
  room: string;
  phone: string;
  email: string;
  followUp: string;
  notes: string;
  meds: MedPlan[];
  discharge: Record<string, string>; // questionId -> answer
  plan?: string; // خطة علاجية مخصصة من الكادر الصحي
  vitals?: VitalEntry[];
  home?: HomeData;
  tasksDone?: Record<string, boolean>;
  symptomReports?: SymptomReport[];
  bedbound?: boolean;
  turning?: TurningPlan;
  turnLog?: Record<string, TurnDone>; // "YYYY-MM-DD|slotId" -> done
  sideEffects?: SideEffectReport[];
  seRedFlags?: string[]; // علامات خطر إضافية يحددها الممرض
}
import type { TurningPlan, TurnDone, SideEffectReport } from "./care-engine";
export interface SymptomReport {
  id: string;
  patientId: string;
  at: string;
  symptoms: string[];
  tier: "HOME" | "URGENT" | "EMERGENCY";
  critical: boolean;
  score: number;
  advice: { name: string; now: string[]; avoid: string[]; when: string }[];
  resolved?: { at: string; by: string };
}
export interface VitalEntry {
  id: string;
  at: string; // ISO timestamp
  kind: "glucose" | "bp";
  context?: string;
  glucose?: number;
  sys?: number;
  dia?: number;
  level: "normal" | "warn" | "danger";
  label: string;
  by: string;
}
export interface HomeData {
  doses: Record<string, { status: "TAKEN"; at: string } | { status: "MISSED"; reason: string; severe?: string }>;
  painBySite: Record<string, number>;
  sitesSel: string[];
  sym: string[];
  customSyms: { name: string; loc?: string | undefined; sev?: string | undefined }[];
  notes: { t: string; time: string }[];
  updatedAt?: string;
}

const KEY = "midad.patients.v1";
const seed: ManagedPatient[] = [
  { id: "p1", name: "صالح العتيبي", mrn: "MRN-102938", ward: "الجراحة العامة", room: "214", phone: "0500000001", email: "saleh@example.com", followUp: "2026-10-12T10:00", notes: "بعد استئصال المرارة بالمنظار.", discharge: {},
    meds: [
      { id: "m1", name: "Paracetamol 500 mg", route: "فموي Oral", times: ["08:00", "16:00", "23:00"], windowMin: 30, missedAfterMin: 60 },
      { id: "m2", name: "Amoxicillin 500 mg", route: "فموي Oral", times: ["08:00", "14:00", "20:00"], windowMin: 30, missedAfterMin: 90 },
    ] },
  { id: "p2", name: "نورة الشمري", mrn: "MRN-204511", ward: "الباطنية", room: "108", phone: "0500000002", email: "noura@example.com", followUp: "2026-10-09T09:30", notes: "التهاب رئوي بعد العلاج الوريدي.", discharge: {},
    meds: [{ id: "m3", name: "Azithromycin 500 mg", route: "فموي Oral", times: ["09:00"], windowMin: 60, missedAfterMin: 120 }] },
  { id: "p3", name: "فهد القحطاني", mrn: "MRN-309874", ward: "العظام", room: "317", phone: "0500000003", email: "fahad@example.com", followUp: "2026-10-15T11:00", notes: "تثبيت كسر الساق.", discharge: {},
    meds: [
      { id: "m4", name: "Enoxaparin 40 mg", route: "تحت الجلد SC", times: ["20:00"], windowMin: 30, missedAfterMin: 60 },
      { id: "m5", name: "Ibuprofen 400 mg", route: "فموي Oral", times: ["08:00", "20:00"], windowMin: 30, missedAfterMin: 60 },
    ] },
];

let state: ManagedPatient[] = seed;
let loaded = false;
const subs = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch { /* ignore */ }
}
function set(next: ManagedPatient[]) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

export function usePatients() {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); if (!loaded) { load(); cb(); } return () => subs.delete(cb); },
    () => state,
    () => seed,
  );
}
export const patientStore = {
  save(p: ManagedPatient) { set(state.some((x) => x.id === p.id) ? state.map((x) => (x.id === p.id ? p : x)) : [...state, p]); },
  remove(id: string) { set(state.filter((x) => x.id !== id)); },
  addVital(id: string, v: VitalEntry) { set(state.map((x) => (x.id === id ? { ...x, vitals: [...(x.vitals ?? []), v] } : x))); },
  setHome(id: string, home: HomeData) { set(state.map((x) => (x.id === id ? { ...x, home } : x))); },
  setTasks(id: string, tasksDone: Record<string, boolean>) { set(state.map((x) => (x.id === id ? { ...x, tasksDone } : x))); },
  setDischarge(id: string, answers: Record<string, string>) { set(state.map((x) => (x.id === id ? { ...x, discharge: answers } : x))); },
  /** Adds a report; skips duplicates (same symptoms+tier still unresolved within 30 min). Returns false if duplicate. */
  addSymptomReport(r: SymptomReport) {
    const p = state.find((x) => x.id === r.patientId); if (!p) return false;
    const key = [...r.symptoms].sort().join("|") + r.tier;
    const dup = (p.symptomReports ?? []).some((x) => !x.resolved && [...x.symptoms].sort().join("|") + x.tier === key && Date.parse(r.at) - Date.parse(x.at) < 30 * 60000);
    if (dup) return false;
    set(state.map((x) => (x.id === r.patientId ? { ...x, symptomReports: [...(x.symptomReports ?? []), r] } : x)));
    return true;
  },
  patch(id: string, fn: (p: ManagedPatient) => ManagedPatient) { set(state.map((x) => (x.id === id ? fn(x) : x))); },
  markTurn(id: string, key: string, by: string) { this.patch(id, (p) => ({ ...p, turnLog: { ...(p.turnLog ?? {}), [key]: { at: new Date().toISOString(), by } } })); },
  addSideEffect(r: SideEffectReport) { this.patch(r.patientId, (p) => ({ ...p, sideEffects: [...(p.sideEffects ?? []), r] })); },
  updateSideEffect(pid: string, rid: string, status: SideEffectReport["status"], action?: { by: string; text: string }) {
    this.patch(pid, (p) => ({ ...p, sideEffects: (p.sideEffects ?? []).map((r) => (r.id === rid ? { ...r, status, actions: action ? [...(r.actions ?? []), { ...action, at: new Date().toISOString() }] : r.actions } : r)) }));
  },
  resolveReport(pid: string, rid: string, by: string) {
    set(state.map((x) => (x.id === pid ? { ...x, symptomReports: (x.symptomReports ?? []).map((r) => (r.id === rid ? { ...r, resolved: { at: new Date().toISOString(), by } } : r)) } : x)));
  },
};
export const newId = () => Math.random().toString(36).slice(2, 9);
export const emptyPatient = (): ManagedPatient => ({ id: newId(), name: "", mrn: "", ward: "", room: "", phone: "", email: "", followUp: "", notes: "", meds: [], discharge: {} });
