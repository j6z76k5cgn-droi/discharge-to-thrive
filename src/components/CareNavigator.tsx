import { useState } from "react";
import { newId, patientStore, type ManagedPatient } from "@/lib/patient-store";
import { matchServices, SERVICES } from "@/lib/services-guide";
import { useLang } from "@/lib/lang-store";
import { replyFor } from "@/lib/assistant-faq";

const QUICK = ["والدي خرج ويحتاج علاج طبيعي، أين نتوجه؟", "كيف أحصل على خدمة الرعاية المنزلية؟", "ما الجهة المناسبة لتقييم حالة المريض؟", "نحتاج تأهيل بعد الجلطة، ما الخطوة التالية؟"];
const QUICK_EN = ["My father needs physiotherapy after discharge, where do we go?", "How do I get home care?", "Who can assess the patient's condition?", "We need rehab after a stroke, what's next?"];

export function CareNavigator({ patient, readOnly }: { patient: ManagedPatient; readOnly: boolean }) {
  const en = useLang() === "en";
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const suggested = SERVICES.filter((s) => patient.services?.includes(s.id));
  const res = asked != null ? matchServices(asked) : [];
  const reply = asked != null ? replyFor(asked) : null;
  const ask = (text: string) => {
    setAsked(text); setQ(text);
    if (readOnly) return;
    if (!text.trim()) return;
    const m = matchServices(text);
    const escalated = m.length === 0 && replyFor(text).kind !== "faq";
    patientStore.patch(patient.id, (p) => ({ ...p, inquiries: [...(p.inquiries ?? []), { id: newId(), at: new Date().toISOString(), q: text, matched: m.map((s) => s.id), escalated }] }));
  };
  return (
    <section className="card-surface mt-6 p-5">
      <h2 className="mb-1 font-bold text-primary">🧭 {en ? "MIDAD assistant & services guide" : "مساعد مِداد ومرشد الخدمات"}</h2>
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
      {asked != null && reply?.kind === "emergency" && (
        <div className="mt-3 rounded-lg bg-destructive p-3 text-sm text-destructive-foreground" role="alert">
          <p className="font-bold">{en ? "This may be an emergency — call 997 now." : "قد تكون حالة طارئة — اتصل بالإسعاف 997 الآن."}</p>
          <a href="tel:997" className="btn mt-2 inline-block bg-card px-4 py-1 text-destructive">📞 997</a>
        </div>)}
      {asked != null && res.length === 0 && reply?.kind === "faq" && (
        <p className="mt-3 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">🤖 {en ? reply.faq.answerEn : reply.faq.answer}</p>)}
      {asked != null && (res.length === 0
        ? (reply?.kind !== "faq" && <p className="mt-3 rounded-lg bg-warning p-3 text-sm text-warning-foreground">📨 {en ? "Your question has been sent to the on-call nurse." : "تم إرسال السؤال إلى الممرض المناوب."}</p>)
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
