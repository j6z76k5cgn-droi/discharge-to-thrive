import { EN } from "./i18n-en";
const keys = Object.keys(EN).sort((a, b) => b.length - a.length);
const AR = /[\u0600-\u06FF]/;
/** Translate a string by replacing every known Arabic segment (longest first). */
export function tr(s: string): string {
  if (!AR.test(s)) return s;
  const whole = EN[s.trim()];
  if (whole) return s.replace(s.trim(), whole);
  let out = s;
  for (const k of keys) if (out.includes(k)) out = out.split(k).join(EN[k]!);
  return out;
}
const origText = new WeakMap<Node, string>();
const origAttr = new WeakMap<Element, Record<string, string>>();
const ATTRS = ["placeholder", "aria-label", "title"];
function apply(root: Node, en: boolean) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = root;
  while (n) {
    if (n.nodeType === 3) {
      const cur = n.nodeValue ?? "";
      if (en) { if (AR.test(cur)) { origText.set(n, cur); const t = tr(cur); if (t !== cur) n.nodeValue = t; } }
      else { const o = origText.get(n); if (o != null) { n.nodeValue = o; origText.delete(n); } }
    } else if (n.nodeType === 1) {
      const el = n as Element; if (el.tagName === "SCRIPT" || el.tagName === "STYLE") { n = w.nextNode(); continue; }
      for (const a of ATTRS) {
        const v = el.getAttribute(a); if (v == null) continue;
        const rec = origAttr.get(el) ?? {};
        if (en && AR.test(v)) { rec[a] = v; origAttr.set(el, rec); el.setAttribute(a, tr(v)); }
        else if (!en && rec[a] != null) { el.setAttribute(a, rec[a]!); delete rec[a]; }
      }
    }
    n = w.nextNode();
  }
}
let obs: MutationObserver | null = null;
/** Central page translator: translates all visible text (UI + demo data + popups) when English is on. */
export function startTranslation(en: boolean) {
  obs?.disconnect(); obs = null;
  apply(document.body, en);
  if (!en) return;
  obs = new MutationObserver((ms) => {
    obs!.disconnect();
    for (const m of ms) { if (m.type === "characterData") apply(m.target, true); m.addedNodes.forEach((x) => apply(x, true)); if (m.type === "attributes") apply(m.target, true); }
    obs!.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  });
  obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
