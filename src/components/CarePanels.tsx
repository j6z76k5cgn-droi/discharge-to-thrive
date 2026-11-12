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
                {s.note && <span className="block text-xs whitespace-pre-wrap">📝 {s.note}</span>}
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

/* ── إدارة المريض: خطة ومواعيد التقليب والوضعيات (بنفس أسلوب الأدوية) ── */
export function TurningPlanEditor({ patientId }: { patientId: string }) {
  const list = usePatients();
  const p = list.find((x) => x.id === patientId);
  const [draft, setDraft] = useState<TurningPlan | null>(null);
  const [slot, setSlot] = useState<{ id: string; time: string; positionId: string; note: string } | null>(null);
  if (!p) return <section className="card-surface mt-4 p-5"><h2 className="font-bold text-primary">🔄 خطة ومواعيد التقليب والوضعيات</h2><p className="mt-2 text-sm text-muted-foreground">احفظ بيانات المريض أولًا ثم أضف خطة التقليب.</p></section>;
  const plan = draft ?? p.turning ?? emptyTurningPlan();
  const edit = (f: (x: TurningPlan) => TurningPlan) => setDraft(f(structuredClone(plan)));
  const posName = (id: string) => plan.positions.find((q) => q.id === id);
  const saveSlot = () => {
    if (!slot || !slot.time) return;
    edit((x) => { const i = x.slots.findIndex((s) => s.id === slot.id); const v = { ...slot, note: slot.note }; if (i >= 0) x.slots[i] = v; else x.slots.push(v); x.slots.sort((a, b) => a.time.localeCompare(b.time)); return x; });
    setSlot(null);
  };
  const approve = () => {
    const v = (p.turning?.version ?? 0) + 1; const at = new Date().toISOString();
    const next: TurningPlan = { ...plan, version: v, approved: { by: "الممرض المسؤول", at }, history: [...(plan.history ?? []), { version: v, at, by: "الممرض المسؤول", summary: `${plan.slots.length} مواعيد` }] };
    patientStore.patch(p.id, (x) => ({ ...x, turning: next })); setDraft(null);
  };
  const inp = "w-full rounded-lg border bg-background p-2 text-sm";
  return (
    <section className="card-surface mt-4 p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-primary">🔄 خطة ومواعيد التقليب والوضعيات</h2>
        <button onClick={() => setSlot({ id: newId(), time: "08:00", positionId: plan.positions[0]!.id, note: "" })} className="btn bg-primary px-3 py-1.5 text-sm text-primary-foreground">+ إضافة موعد تقليب</button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{p.turning?.approved ? `معتمدة — الإصدار ${p.turning.version}` : "غير معتمدة — لا تظهر للمرافق"}{draft ? " · توجد تعديلات غير معتمدة" : ""}</p>
      {plan.slots.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مواعيد تقليب بعد. يحدد الممرض الجدول حسب تقييم المريض.</p>}
      {plan.slots.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-3 text-sm first:border-0">
          <div>
            <p className="font-semibold"><span dir="ltr">{s.time}</span> — {posName(s.positionId)?.icon} {posName(s.positionId)?.name ?? "وضعية"}</p>
            {s.note && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{s.note}</p>}
          </div>
          <div className="flex gap-2 text-xs">
            <button onClick={() => setSlot({ ...s, note: s.note ?? "" })} className="text-primary">تعديل</button>
            <button onClick={() => edit((x) => { x.slots = x.slots.filter((y) => y.id !== s.id); return x; })} className="text-destructive">حذف</button>
          </div>
        </div>
      ))}
      <label className="mt-3 block text-sm"><span className="mb-1 block font-semibold">الوضعيات الممنوعة (نص حر)</span><textarea value={plan.forbidden.join("، ")} onChange={(e) => edit((x) => { x.forbidden = forbiddenFromText(e.target.value); return x; })} rows={2} className={inp} /></label>
      <label className="mt-2 block text-sm"><span className="mb-1 block font-semibold">تعليمات للمرافق (زوايا الإمالة، نصف الجلوس...)</span><textarea value={plan.notes} onChange={(e) => edit((x) => { x.notes = e.target.value; return x; })} rows={2} className={inp} /></label>
      <label className="mt-2 block text-sm"><span className="mb-1 block font-semibold">يُعتبر متأخرًا بعد (دقيقة)</span><input type="number" min={0} value={plan.graceMin} onChange={(e) => edit((x) => { x.graceMin = Number(e.target.value) || 0; return x; })} className="w-24 rounded-lg border bg-background p-2 text-sm" /></label>
      <button onClick={approve} disabled={plan.slots.length === 0} className="btn mt-3 w-full bg-primary text-primary-foreground disabled:opacity-50">✓ اعتماد الخطة وتفعيلها للمرافق</button>

      {slot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setSlot(null)}>
          <div dir="rtl" className="card-surface w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-bold text-primary">موعد التقليب</h3>
            <div className="space-y-3 text-sm">
              <label className="block"><span className="mb-1 block font-semibold">الساعة</span><input type="time" value={slot.time} onChange={(e) => setSlot({ ...slot, time: e.target.value })} className={inp} /></label>
              <label className="block"><span className="mb-1 block font-semibold">الوضعية المطلوبة</span>
                <select value={slot.positionId} onChange={(e) => setSlot({ ...slot, positionId: e.target.value })} className={inp}>
                  {plan.positions.map((q) => <option key={q.id} value={q.id}>{q.icon} {q.name}</option>)}
                </select></label>
              <label className="block"><span className="mb-1 block font-semibold">ملاحظات (مثل زاوية نصف الجلوس 30° أو الحماية)</span><textarea rows={2} value={slot.note} onChange={(e) => setSlot({ ...slot, note: e.target.value })} className={inp} /></label>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={saveSlot} disabled={!slot.time} className="btn flex-1 bg-primary text-primary-foreground disabled:opacity-40">حفظ الموعد</button>
              <button onClick={() => setSlot(null)} className="btn flex-1 bg-muted">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── لوحة الممرض: متابعة الالتزام + بلاغات الآثار الجانبية (بدون إعداد) ── */
export function NurseCarePanel({ name }: { name: string }) {
  const list = usePatients();
  const p = list.find((x) => x.name === name);
  const now = useNow();
  if (!p) return null;
  const sum = now ? turnSummary(p.turning, p.turnLog, now) : null;
  const pct = sum && sum.total ? Math.round((sum.done / sum.total) * 100) : 0;
  const se = [...(p.sideEffects ?? [])].reverse();
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <section className="card-surface p-5">
        <h2 className="font-bold text-primary">🛏️ التزام المرافق بجدول التقليب</h2>
        <p className="text-xs text-muted-foreground">{p.turning?.approved ? `الخطة معتمدة — الإصدار ${p.turning.version} · تُعدّل من صفحة إدارة المرضى` : "لا توجد خطة معتمدة — تُعدّ من صفحة إدارة المرضى"}</p>
        {sum && sum.total > 0 ? (
          <>
            <p className="font-display mt-3 text-4xl text-ink">{pct}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-sm">منفذ اليوم: {sum.done}/{sum.total}{sum.overdue ? ` · ⚠️ ${sum.overdue} متأخر` : ""}</p>
          </>
        ) : <p className="mt-2 text-sm text-muted-foreground">لا توجد مواعيد لليوم.</p>}
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
