import { useSyncExternalStore } from "react";
const KEY = "midad.bigfont";
const subs = new Set<() => void>();
const read = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
export function setBigFont(v: boolean) {
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export const useBigFont = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, read, () => false);
