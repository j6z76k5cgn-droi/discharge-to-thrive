import { useSyncExternalStore } from "react";
export type Lang = "ar" | "en";
const KEY = "midad.lang";
const subs = new Set<() => void>();
export const getLang = (): Lang => (typeof window !== "undefined" && localStorage.getItem(KEY) === "en" ? "en" : "ar");
export const setLang = (l: Lang) => { localStorage.setItem(KEY, l); subs.forEach((f) => f()); };
export const useLang = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, getLang, () => "ar" as Lang);
