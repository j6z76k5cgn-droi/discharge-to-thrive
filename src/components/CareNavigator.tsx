import { useState } from "react";
import { newId, patientStore, type ManagedPatient } from "@/lib/patient-store";
import { matchServices, SERVICES } from "@/lib/services-guide";
import { useLang } from "@/lib/lang-store";

const QUICK = ["والدي خرج ويحتاج علاج طبيعي، أين نتوجه؟", "كيف أحصل على خدمة الرعاية المنزلية؟", "ما الجهة المناسبة لتقييم حالة المريض؟", "نحتاج تأهيل بعد الجلطة، ما الخطوة التالية؟"];
const QUICK_EN = ["My father needs physiotherapy after discharge, where do we go?", "How do I get home care?", "Who can assess the patient's condition?", "We need rehab after a stroke, what's next?"];

export function CareNavigator({ patient, readOnly }: { patient: ManagedPatient; readOnly: boolean }) {
  const en = useLang() === "en";
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const suggested = SERVICES.filter((s) => patient.services?.includes(s.id));
  const res = asked != null ? matchServices(asked) : [];
  const ask = (text: string) => {
    setAsked(text); setQ(text);
    if (readOnly) return;
    const m = matchServices(text);
    patientStore.update(patient.id, (p) => ({ ...p, inquiries: [...(p.inquiries ?? []), { id: newId(), at: new Date().toISOString(), q: text, matched: m.map((s) => s.id) }] }));
  };
  return (
    <section className="card-surface mt-6 p-5">
      <h2 className="mb-1 font-bold text-primary">🧭 {en ? "Post-discharge services guide" : "مرشد خدمات ما بعد الخروج"}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{en ? "Guidance from a services directory only — no diagnosis. Demo data, to be verified by the health team." : "توجيه من دليل خدمات فقط — بدون تشخيص. بيانات استرشادية تجريبية تحتاج اعتماد الجهة الصحية."}</p>
      {suggested.length > 0 && (
        <div className="mb-3 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          <b>{en ? "Your care plan includes:" : "خطة الممرض تتضمن:"}</b> {suggested.map((s) => `${s.icon} ${en ? s.titleEn : s.title}`).join(" · ")}
          <div className="mt-2 flex flex-wrap gap-2">{suggested.map((s) => <button key={s.id} type="button" onClick={() => { setAsked(s.keywords[0]!); setQ(en ? s.titleEn : s.title); }} className="btn bg-background px-3 py-1 text-xs text-foreground">{en ? "Show steps" : "اعرض الخطوات"}: {en ? s.titleEn : s.title}</button>)}</div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">{(en ? QUICK_EN : QUICK).map((t) => <button key={t} type="button" onClick={() => ask(t)} className="btn bg-muted px-3 py-1.5 text-xs">{t}</button>)}</div>
      <div className="mt-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={en ? "Type your question…" : "اكتب سؤالك…"} className="flex-1 rounded-lg border bg-background p-2 text-sm" />
        <button type="button" onClick={() => ask(q)} className="btn bg-primary px-4 text-sm text-primary-foreground">{en ? "Ask" : "اسأل"}</button>
      </div>
      {asked != null && (res.length === 0
        ? <p className="mt-3 rounded-lg bg-warning p-3 text-sm text-warning-foreground">{en ? "No matching service in the directory. Please contact your nurse or call 937." : "لا توجد خدمة مطابقة في الدليل. تواصل مع الممرض المتابع أو اتصل 937."}</p>
        : <div className="mt-3 grid gap-3 md:grid-cols-2">{res.map((s) => (
            <div key={s.id} className="rounded-xl border bg-background p-4 text-sm">
              <p className="font-bold">{s.icon} {en ? s.titleEn : s.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{en ? "Where" : "الجهة"}: {en ? s.whereEn : s.where}</p>
              <ol className="mt-2 list-decimal space-y-1 ps-5">{(en ? s.stepsEn : s.steps).map((x) => <li key={x}>{x}</li>)}</ol>
              <a href={`tel:${s.contact}`} className="btn mt-3 inline-block bg-primary px-3 py-1 text-xs text-primary-foreground">📞 {s.contact}</a>
            </div>))}
          </div>)}
    </section>
  );
}
