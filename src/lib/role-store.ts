import { useSyncExternalStore } from "react";
export type Role = "patient" | "nurse";
const KEY = "midad.role";
const subs = new Set<() => void>();
function read(): Role | null { try { const v = localStorage.getItem(KEY); return v === "patient" || v === "nurse" ? v : null; } catch { return null; } }
export function setRole(r: Role | null) {
  try { if (r) localStorage.setItem(KEY, r); else localStorage.removeItem(KEY); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
/** Returns undefined during SSR/hydration, null if not chosen. */
export function useRole(): Role | null | undefined {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, read, () => undefined);
}
