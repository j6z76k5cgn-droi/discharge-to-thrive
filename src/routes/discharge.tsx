import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { patientStore, usePatients } from "@/lib/patient-store";

export const Route = createFileRoute("/discharge")({
  head: () => ({
    meta: [
      { title: "قائمة ما قبل الخروج | مِداد" },
      { name: "description", content: "تقييم جاهزية المريض للخروج عبر 7 مجالات موزونة مع بنود أمان حرجة." },
      { property: "og:title", content: "قائمة ما قبل الخروج | مِداد" },
      { property: "og:description", content: "Discharge Readiness Score — 7 weighted domains" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Discharge,
});

type Q = { id: string; text: string; safety?: { msg: string; action: string } };
const domains: { id: string; title: string; weight: number; qs: Q[] }[] = [
  { id: "MEDICAL_STABILITY", title: "🩺 الاستقرار الطبي", weight: 0.25, qs: [
    { id: "STAB_01", text: "هل حالة المريض الطبية مستقرة ومناسبة للخروج؟", safety: { msg: "الحالة الطبية للمريض غير مستقرة بشكل كامل.", action: "إعادة التقييم الطبي السريري ومراجعة العلامات الحيوية قبل إتمام إجراءات الخروج." } },
    { id: "STAB_02", text: "العلامات الحيوية مستقرة خلال آخر 24 ساعة" },
    { id: "STAB_03", text: "الألم تحت السيطرة بالأدوية الفموية" },
  ]},
  { id: "MEDICATION_PLAN", title: "💊 الأدوية والخطة العلاجية", weight: 0.2, qs: [
    { id: "MED_01", text: "هل يعرف المريض/المرافق خطة الأدوية الأساسية ومواعيدها؟", safety: { msg: "المريض أو المرافق لا يعرف خطة الأدوية الأساسية.", action: "تقديم جلسة تثقيف دوائي ومراجعة الوصفة مع الصيدلي السريري/الممرض." } },
    { id: "MED_02", text: "تم صرف الأدوية أو التأكد من توفرها" },
  ]},
  { id: "HEALTH_LITERACY", title: "🧠 الفهم والتثقيف الصحي", weight: 0.15, qs: [
    { id: "LIT_01", text: "تم توضيح علامات الخطر التي تستدعي مراجعة الطوارئ", safety: { msg: "المريض لا يعرف علامات الخطر.", action: "مراجعة علامات الخطر مع المريض والمرافق بطريقة الشرح المرتجع (Teach-back)." } },
    { id: "LIT_02", text: "يستطيع المريض شرح خطة التعافي بكلماته" },
  ]},
  { id: "HOME_CARE_SKILLS", title: "🩹 المهارات والعناية المنزلية", weight: 0.15, qs: [
    { id: "SKL_01", text: "قادر على العناية بالجرح/تغيير الضمادات (إن وجد)" },
    { id: "SKL_02", text: "قادر على استخدام الأجهزة الطبية المنزلية" },
  ]},
  { id: "CONTINUITY_OF_CARE", title: "📅 المتابعة واستمرارية الرعاية", weight: 0.1, qs: [
    { id: "CON_01", text: "تم تأكيد مواعيد المتابعة القادمة" },
    { id: "CON_02", text: "تم تفعيل تطبيق مِداد للمتابعة المنزلية" },
  ]},
  { id: "HOME_ENVIRONMENT", title: "🏠 المرافق والبيئة المنزلية", weight: 0.1, qs: [
    { id: "HOME_01", text: "تتوفر التجهيزات الأساسية في المنزل (سرير طبي/أكسجين)" },
    { id: "HOME_02", text: "المرافق متواجد ومدرَّب على الرعاية" },
  ]},
  { id: "ACCESSIBILITY_NEEDS", title: "♿ الوصول والاحتياجات الخاصة", weight: 0.05, qs: [
    { id: "ACC_01", text: "تم تحديد نمط التفاعل المناسب (صوت/أزرار كبيرة/مرافق)" },
  ]},
];

type Ans = "YES" | "PARTIAL" | "NO" | "N_A";
const opts: { v: Ans; l: string; on: string }[] = [
  { v: "YES", l: "نعم", on: "bg-success text-success-foreground" },
  { v: "PARTIAL", l: "جزئي", on: "bg-warning text-warning-foreground" },
  { v: "NO", l: "لا", on: "bg-destructive text-destructive-foreground" },
  { v: "N_A", l: "غير شامل", on: "bg-ink text-primary-foreground" },
];
const pts = { YES: 100, PARTIAL: 50, NO: 0 } as const;

function calc(ans: Record<string, Ans>) {
  let total = 0, wSum = 0;
  const concerns: { domain: string; msg: string; action: string }[] = [];
  const perDomain: Record<string, number | null> = {};
  for (const d of domains) {
    const valid = d.qs.filter((q) => ans[q.id] && ans[q.id] !== "N_A");
    for (const q of d.qs) if (q.safety && ans[q.id] === "NO") concerns.push({ domain: d.title, ...q.safety });
    if (!valid.length) { perDomain[d.id] = null; continue; }
    const avg = valid.reduce((a, q) => a + pts[ans[q.id] as keyof typeof pts], 0) / valid.length;
    perDomain[d.id] = Math.round(avg);
    total += avg * d.weight; wSum += d.weight;
  }
  const score = wSum ? Math.round(total / wSum) : 0;
  return { score, concerns, perDomain };
}

function Discharge() {
  const list = usePatients();
  const [pid, setPid] = useState("");
  const p = list.find((x) => x.id === pid) ?? list[0];
  const ans = (p?.discharge ?? {}) as Record<string, Ans>;
  const setAns = (a: Record<string, Ans>) => p && patientStore.setDischarge(p.id, a);
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const done = !!p && doneFor === p.id;
  const setDone = (_: boolean) => p && setDoneFor(p.id);
  const allQ = domains.flatMap((d) => d.qs);
  const complete = allQ.every((q) => ans[q.id]);
  const { score, concerns, perDomain } = calc(ans);
  const level = concerns.length
    ? { l: "🔴 مخاوف جاهزية الخروج", c: "text-destructive", b: "bg-destructive" }
    : score >= 90 ? { l: "🟢 جاهزية عالية", c: "text-success", b: "bg-success" }
    : score >= 75 ? { l: "🟡 يحتاج استكمال متطلبات بسيطة", c: "text-warning", b: "bg-warning" }
    : { l: "🟠 يحتاج تقييم إضافي وتدخل سريري", c: "text-warning", b: "bg-warning" };
  const completion = Math.round((allQ.filter((q) => ans[q.id]).length / allQ.length) * 100);
  const ready = complete && !concerns.length && score >= 90;
  if (!p) return <Shell><p>لا يوجد مرضى. أضف مريضاً من صفحة «المرضى».</p></Shell>;

  return (
    <Shell>
      <h1 className="font-display text-3xl text-ink">تقييم جاهزية الخروج</h1>
      <div className="card-surface mt-4 p-4">
        <label className="text-sm font-semibold">اختر المريض
          <select value={p.id} onChange={(e) => setPid(e.target.value)} className="mr-2 rounded-lg border bg-background p-2 text-sm">
            {list.map((x) => <option key={x.id} value={x.id}>{x.name} — {x.mrn}</option>)}
          </select>
        </label>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <p><span className="text-muted-foreground">الملف:</span> <span dir="ltr">{p.mrn}</span></p>
          <p><span className="text-muted-foreground">القسم/الغرفة:</span> {p.ward} · {p.room}</p>
          <p><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{p.phone}</span></p>
          <p><span className="text-muted-foreground">البريد:</span> <span dir="ltr">{p.email}</span></p>
          <p><span className="text-muted-foreground">المتابعة:</span> <span dir="ltr">{p.followUp.replace("T", " ")}</span></p>
          <p><span className="text-muted-foreground">الأدوية:</span> {p.meds.map((m) => m.name).join("، ") || "—"}</p>
        </div>
        {p.notes && <p className="mt-2 text-xs text-muted-foreground">ملاحظات: {p.notes}</p>}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">7 مجالات موزونة · البنود المعلَّمة ⚠️ بنود أمان حرجة — النظام يقدّم توصية ولا ينوب عن القرار الطبي.</p>

      {concerns.length > 0 && (
        <div className="mt-5 rounded-2xl bg-destructive p-5 text-destructive-foreground">
          <p className="font-bold">🔴 Discharge Readiness Concern — توجد متطلبات أمان حرجة لم تكتمل قبل الخروج</p>
          <ul className="mt-2 space-y-2 text-sm">
            {concerns.map((c) => (
              <li key={c.msg}><b>المشكلة:</b> {c.msg}<br /><b>الإجراء المقترح:</b> {c.action}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {domains.map((d) => (
            <div key={d.id} className="card-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-primary">{d.title}</h2>
                <span className="text-xs text-muted-foreground">الوزن {d.weight * 100}% · {perDomain[d.id] == null ? "—" : `${perDomain[d.id]}%`}</span>
              </div>
              {d.qs.map((q) => (
                <div key={q.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-3 first:border-0">
                  <span className="text-sm">{q.safety && <span title="بند أمان حرج">⚠️ </span>}{q.text}</span>
                  <div className="flex gap-1">
                    {opts.map((o) => (
                      <button key={o.v} onClick={() => setAns({ ...ans, [q.id]: o.v })}
                        className={`btn px-3 py-1 text-sm ${ans[q.id] === o.v ? o.on : "bg-muted text-muted-foreground"}`}>{o.l}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <aside className="card-surface h-fit p-6 text-center lg:sticky lg:top-20">
          <p className="text-sm text-muted-foreground">درجة جاهزية الخروج</p>
          <p className={`font-display mt-2 text-6xl ${level.c}`}>{score}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full transition-all ${level.b}`} style={{ width: `${score}%` }} />
          </div>
          <p className={`mt-3 text-sm font-semibold ${level.c}`}>{level.l}</p>
          <p className="mt-3 text-xs font-semibold">اكتمال القائمة {completion}%</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} /></div>
          <p className="mt-1 text-xs text-muted-foreground">أُجيب على {Object.keys(ans).length} من {allQ.length} · الحد الأدنى 90%</p>
          <button disabled={!ready} onClick={() => setDone(true)}
            className="btn mt-4 w-full bg-primary text-primary-foreground disabled:opacity-40">اعتماد الخروج</button>
          {done && <p className="mt-3 text-sm font-semibold text-success">✓ تم اعتماد خروج المريض وتفعيل المتابعة المنزلية</p>}
        </aside>
      </div>
    </Shell>
  );
}
