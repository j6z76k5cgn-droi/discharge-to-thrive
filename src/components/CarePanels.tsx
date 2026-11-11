import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { forbiddenFromText } from "@/lib/care-inputs";
import { newId, patientStore, usePatients, type ManagedPatient } from "@/lib/patient-store";
import {
  classifySideEffect, dayKey, emptyTurningPlan, isPlanActive, SE_SYMPTOMS, SE_TIER_UI, SFDA_URL, SKIN_TIPS, slotStatus, STOP_SIGNS, turnSummary,
  type SeSeverity, type SideEffectReport, type SlotStatus, type TurningPlan,
} from "@/lib/care-engine";

const useNow = () => { const [n, setN] = useState<Date | null>(null); useEffect(() => { setN(new Date()); const t = setInterval(() => setN(new Date()), 60000); return () => clearInterval(t); }, []); return n; };
const stUI: Record<SlotStatus, { l: string; c: string }> = {
  DONE: { l: "✓ تم", c: "bg-primary/10 border-primary/40" },
  DUE: { l: "⏰ حان الموعد", c: "bg-warning/30 border-warning" },
  OVERDUE: { l: "⚠️ متأخر", c: "bg-destructive/10 border-destructive" },
  UPCOMING: { l: "قادم", c: "bg-background" },
};
const fmt = (s: string) => new Date(s).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

/* ── واجهة المرافق: دليل وجدول التقليب ── */
export function CaregiverTurning({ patient, readOnly }: { patient: ManagedPatient; readOnly: boolean }) {
  const now = useNow();
  const plan = patient.turning;
  if (!isPlanActive(plan)) return null;
  const dk = now ? dayKey(now) : "";
  const pos = (id: string) => plan!.positions.find((p) => p.id === id);
  return (
    <section className="card-surface p-5 md:col-span-2">
      <h2 className="mb-1 font-bold text-primary">🛏️ جدول التقليب اليومي</h2>
      <p className="mb-3 text-xs text-muted-foreground">الجدول والوضعيات معتمدة من الممرض ({plan!.approved!.by}) — الإصدار {plan!.version}.</p>
      {plan!.notes && <p className="mb-3 rounded-lg bg-secondary p-2 text-sm">📝 {plan!.notes}</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {plan!.slots.map((s) => {
          const done = patient.turnLog?.[`${dk}|${s.id}`];
          const st = now ? slotStatus(s, done, now, plan!.graceMin) : "UPCOMING";
          const p = pos(s.positionId);
          return (
            <label key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 ${stUI[st].c}`}>
              <input type="checkbox" className="h-6 w-6 accent-primary" checked={!!done} disabled={!!done || readOnly}
                onChange={() => patientStore.markTurn(patient.id, `${dk}|${s.id}`, "المرافق")} />
              <span className="flex-1">
                <b className="block">{s.time} — {p?.icon} {p?.name ?? "وضعية"}</b>
                <span className="text-xs">{stUI[st].l}{done ? ` الساعة ${fmt(done.at)}` : ""}</span>
              </span>
            </label>
          );
        })}
      </div>
      <details className="mt-4 rounded-xl border bg-background p-3">
        <summary className="cursor-pointer font-semibold">📘 دليل التقليب الآمن</summary>
        {plan!.positions.filter((p) => plan!.slots.some((s) => s.positionId === p.id)).map((p) => (
          <div key={p.id} className="mt-3 text-sm">
            <p className="font-bold">{p.icon} {p.name}</p>
            <ol className="list-inside list-decimal">{p.steps.map((x) => <li key={x}>{x}</li>)}</ol>
            {p.safety.map((x) => <p key={x} className="text-xs text-muted-foreground">⚠️ {x}</p>)}
          </div>
        ))}
        {plan!.forbidden.length > 0 && <p className="mt-3 text-sm font-semibold text-destructive">⛔ وضعيات ممنوعة: {plan!.forbidden.join("، ")}</p>}
        <p className="mt-3 font-semibold">حماية الجلد</p><ul className="list-inside list-disc text-sm">{SKIN_TIPS.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="mt-3 font-semibold">توقّف وتواصل مع الفريق الصحي إذا ظهر:</p><ul className="list-inside list-disc text-sm">{STOP_SIGNS.map((x) => <li key={x}>{x}</li>)}</ul>
      </details>
    </section>
  );
}

/* ── نموذج الأثر الجانبي ── */
export function SideEffectForm({ patient, readOnly, medId, onReported }: { patient: ManagedPatient; readOnly: boolean; medId: string; onReported?: (report: SideEffectReport) => void }) {
  const [symptom, setSymptom] = useState("");
  const [custom, setCustom] = useState("");
  const [doseAt, setDoseAt] = useState("");
  const [onsetAt, setOnsetAt] = useState("");
  const [severity, setSeverity] = useState<SeSeverity>("خفيف");
  const [repeated, setRepeated] = useState(false);
  const [result, setResult] = useState<SideEffectReport | null>(null);
  if (readOnly) return null;
  const sym = symptom === "أخرى" ? custom.trim() : symptom;
  const submit = () => {
    const med = patient.meds.find((m) => m.id === medId);
    if (!sym) return;
    const tier = classifySideEffect({ symptom: sym, severity, repeated });
    const r: SideEffectReport = { id: newId(), patientId: patient.id, medId, medName: med?.name ?? "غير محدد", symptom: sym, doseAt, onsetAt, severity, repeated, note: "", at: new Date().toISOString(), by: "المريض/المرافق", tier, status: "NEW" };
    patientStore.addSideEffect(r); setResult(r); onReported?.(r);
  };
  const ui = result ? SE_TIER_UI[result.tier] : null;
  return (
    <div className="mt-4 border-t pt-4" aria-label="الإبلاغ عن أثر جانبي">
      <h2 className="mb-1 font-bold text-primary">💊 الإبلاغ عن أثر جانبي</h2>
      <p className="mb-3 text-xs text-muted-foreground">التسجيل لا يعني أن الدواء هو السبب — الفريق الصحي يقيّم ذلك. لا توقف الدواء أو تغيّر الجرعة من نفسك.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0 text-sm">الدواء<input value={patient.meds.find((m) => m.id === medId)?.name ?? ""} readOnly dir="ltr" className="mt-1 w-full rounded-lg border bg-muted p-2" /></label>
        <label className="text-sm">العرض<select value={symptom} onChange={(e) => setSymptom(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2">
          <option value="">— اختر —</option>
          <optgroup label="علامات خطر">{["صعوبة في التنفس", "تورم الشفاه أو اللسان أو الحلق", "صعوبة في البلع", "طفح جلدي سريع الانتشار", "إغماء أو دوار شديد"].map((x) => <option key={x}>{x}</option>)}</optgroup>
          <optgroup label="أعراض أخرى">{SE_SYMPTOMS.map((x) => <option key={x}>{x}</option>)}<option>أخرى</option></optgroup>
        </select></label>
        {symptom === "أخرى" && <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="اكتب العرض" className="rounded-lg border bg-background p-2 text-sm sm:col-span-2" />}
        <label className="text-sm">وقت أخذ الجرعة<input type="time" value={doseAt} onChange={(e) => setDoseAt(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2" /></label>
        <label className="text-sm">وقت ظهور العرض<input type="time" value={onsetAt} onChange={(e) => setOnsetAt(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2" /></label>
        <div className="text-sm">الشدة<div className="mt-1 flex gap-2">{(["خفيف", "متوسط", "شديد"] as SeSeverity[]).map((s) => <Button key={s} type="button" onClick={() => setSeverity(s)} variant={severity === s ? "default" : "secondary"} className="flex-1">{s}</Button>)}</div></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={repeated} onChange={(e) => setRepeated(e.target.checked)} className="h-5 w-5 accent-primary" />تكرر العرض أكثر من مرة</label>
      </div>
      <Button onClick={submit} disabled={!sym} className="mt-4 h-auto w-full whitespace-normal py-3">📤 إرسال البلاغ</Button>
      {result && ui && (
        <div className={`mt-4 rounded-2xl border-2 p-4 ${ui.cls}`} role="alert">
          <p className="font-bold">{ui.label}</p>
          <p className="mt-1 text-sm">{ui.msg}</p>
          {result.tier === "EMERGENCY" && <><a href="tel:997" className="btn mt-3 block bg-destructive py-3 text-center text-lg font-bold text-destructive-foreground">📞 اتصل بالإسعاف 997</a><p className="mt-1 text-xs">الضغط يفتح الاتصال من جهازك — لا يتم الاتصال تلقائيًا.</p></>}
          <a href={SFDA_URL} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary underline">🔗 الإبلاغ للهيئة العامة للغذاء والدواء</a>
        </div>
      )}
    </div>
  );
}

/* ── لوحة الممرض: إعداد واعتماد خطة التقليب + الالتزام + بلاغات الأعراض الجانبية ── */
export function NurseCarePanel({ name }: { name: string }) {
  const list = usePatients();
  const p = list.find((x) => x.name === name);
  const [draft, setDraft] = useState<TurningPlan | null>(null);
  const now = useNow();
  if (!p) return null;
  const plan = draft ?? p.turning ?? emptyTurningPlan();
  const edit = (f: (x: TurningPlan) => TurningPlan) => setDraft(f(structuredClone(plan)));
  const approve = () => {
    const v = (p.turning?.version ?? 0) + 1; const at = new Date().toISOString();
    const next: TurningPlan = { ...plan, version: v, approved: { by: "الممرض المسؤول", at }, history: [...(plan.history ?? []), { version: v, at, by: "الممرض المسؤول", summary: `${plan.slots.length} مواعيد` }] };
    patientStore.patch(p.id, (x) => ({ ...x, turning: next })); setDraft(null);
  };
  const sum = now ? turnSummary(p.turning, p.turnLog, now) : null;
  const se = [...(p.sideEffects ?? [])].reverse();
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <section className="card-surface p-5">
        <h2 className="font-bold text-primary">🛏️ خطة التقليب (يحددها الممرض)</h2>
        <p className="text-xs text-muted-foreground">{p.turning?.approved ? `معتمدة — الإصدار ${p.turning.version}` : "غير معتمدة — لا تظهر للمرافق"}{draft ? " · توجد تعديلات غير معتمدة" : ""}</p>
        <div className="mt-3 space-y-2">
          {plan.slots.map((s, i) => (
            <div key={s.id} className="flex gap-2">
              <input type="time" value={s.time} onChange={(e) => edit((x) => { x.slots[i]!.time = e.target.value; return x; })} className="rounded-lg border bg-background p-2 text-sm" />
              <select value={s.positionId} onChange={(e) => edit((x) => { x.slots[i]!.positionId = e.target.value; return x; })} className="flex-1 rounded-lg border bg-background p-2 text-sm">
                {plan.positions.map((q) => <option key={q.id} value={q.id}>{q.icon} {q.name}</option>)}
              </select>
              <button onClick={() => edit((x) => { x.slots.splice(i, 1); return x; })} className="text-sm text-destructive">حذف</button>
            </div>
          ))}
          <button onClick={() => edit((x) => { x.slots.push({ id: newId(), time: "08:00", positionId: x.positions[0]!.id }); x.slots.sort((a, b) => a.time.localeCompare(b.time)); return x; })} className="btn bg-secondary text-sm text-secondary-foreground">+ إضافة موعد</button>
        </div>
        <label className="mt-3 block text-sm">وضعيات ممنوعة<textarea value={plan.forbidden.join("، ")} onChange={(e) => edit((x) => { x.forbidden = forbiddenFromText(e.target.value); return x; })} rows={2} className="mt-1 w-full rounded-lg border bg-background p-2" /></label>
        <label className="mt-2 block text-sm">تعليمات للمرافق (زوايا الإمالة، نصف الجلوس...)<textarea value={plan.notes} onChange={(e) => edit((x) => { x.notes = e.target.value; return x; })} rows={2} className="mt-1 w-full rounded-lg border bg-background p-2" /></label>
        <label className="mt-2 block text-sm">يُعتبر متأخرًا بعد (دقيقة)<input type="number" value={plan.graceMin} onChange={(e) => edit((x) => { x.graceMin = Number(e.target.value) || 0; return x; })} className="mt-1 w-24 rounded-lg border bg-background p-2" /></label>
        <button onClick={approve} disabled={plan.slots.length === 0} className="btn mt-3 w-full bg-primary text-primary-foreground disabled:opacity-50">✓ اعتماد الخطة وتفعيلها للمرافق</button>
        {sum && sum.total > 0 && <p className="mt-3 rounded-lg bg-secondary p-2 text-sm">التزام اليوم: {sum.done}/{sum.total} منفذ{sum.overdue ? ` · ⚠️ ${sum.overdue} متأخر` : ""}</p>}
      </section>
      <section className="card-surface p-5">
        <h2 className="font-bold text-primary">💊 بلاغات الآثار الجانبية</h2>
        {se.length === 0 && <p className="mt-2 text-sm text-muted-foreground">لا توجد بلاغات.</p>}
        <ul className="mt-2 space-y-2">
          {se.map((r) => (
            <li key={r.id} className={`rounded-xl border-2 p-3 text-sm ${SE_TIER_UI[r.tier].cls}`}>
              <p className="font-bold">{SE_TIER_UI[r.tier].label}</p>
              <p>{r.symptom} · {r.severity}{r.repeated ? " · متكرر" : ""} — {r.medName}</p>
              <p className="text-xs text-muted-foreground">{new Date(r.at).toLocaleString("ar-SA")} · الجرعة {r.doseAt || "—"} · الظهور {r.onsetAt || "—"}</p>
              {r.status !== "DONE" ? <button onClick={() => patientStore.updateSideEffect(p.id, r.id, "DONE", { by: "الممرض", text: "تمت المراجعة" })} className="btn mt-2 bg-card text-xs">✓ تمت المراجعة</button> : <p className="mt-1 text-xs font-semibold">✓ تمت المراجعة</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
