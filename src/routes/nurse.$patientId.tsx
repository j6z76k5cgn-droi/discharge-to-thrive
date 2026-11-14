import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { NurseAlerts, SymptomHistory } from "@/components/NurseAlerts";
import { NurseCarePanel } from "@/components/CarePanels";
import { analyze, patients, statusMeta } from "@/lib/midad-data";
import { riskLevelMeta } from "@/lib/risk-engine";

export const Route = createFileRoute("/nurse/$patientId")({
  loader: ({ params }) => {
    const p = patients.find((x) => x.id === params.patientId);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "مريض"} | سجل المتابعة - مِداد` },
      { name: "description", content: "سجل المتابعة اليومي وتحليلات الذكاء الاصطناعي للمريض." },
      { property: "og:title", content: `${loaderData?.name ?? "مريض"} | مِداد` },
      { property: "og:description", content: "سجل يومي للأدوية والألم والأعراض." },
    ],
  }),
  notFoundComponent: () => <Shell><p>المريض غير موجود.</p></Shell>,
  component: PatientPage,
});

function RecoveryChart({ logs }: { logs: { pain: number; medsTaken: number; medsTotal: number; temp: number; symptoms: string[] }[] }) {
  const w = 340, h = 170, pad = 22;
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(logs.length - 1, 1);
  const y = (pct: number) => h - pad - (pct / 100) * (h - pad * 2);
  const series = [
    { k: "pain", l: "الألم", cls: "stroke-destructive", v: logs.map((l) => l.pain * 10) },
    { k: "adh", l: "الالتزام الدوائي", cls: "stroke-primary", v: logs.map((l) => Math.round((l.medsTaken / l.medsTotal) * 100)) },
    { k: "temp", l: "الحرارة", cls: "stroke-warning", v: logs.map((l) => Math.max(0, Math.min(100, ((l.temp - 36) / 3) * 100))) },
  ];
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ direction: "ltr" }}>
        {[0, 50, 100].map((g) => <line key={g} x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} className="stroke-border" />)}
        {series.map((s) => <path key={s.k} d={s.v.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")} fill="none" strokeWidth={2.5} className={s.cls} />)}
        {logs.map((l, i) => (
          <g key={i}>
            {l.symptoms.length > 0 && <circle cx={x(i)} cy={pad - 8} r={5} className="fill-destructive" />}
            <text x={x(i)} y={h - 4} textAnchor="middle" fontSize={10} className="fill-muted-foreground">D{i + 1}</text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <span><span className="inline-block h-2 w-4 rounded bg-destructive" /> الألم (0–10)</span>
        <span><span className="inline-block h-2 w-4 rounded bg-primary" /> الالتزام الدوائي %</span>
        <span><span className="inline-block h-2 w-4 rounded bg-warning" /> الحرارة (36–39°م)</span>
        <span>🔴 يوم ظهرت فيه أعراض</span>
      </div>
    </div>
  );
}

function PatientPage() {
  const p = Route.useLoaderData();
  const a = analyze(p);
  const [action, setAction] = useState("");
  return (
    <Shell>
      <Link to="/nurse" className="text-sm text-primary">→ العودة لقائمة المرضى</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">{p.name}</h1>
          <p className="text-sm text-muted-foreground">{p.age} سنة · {p.diagnosis} · خروج {p.dischargeDate}</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 font-semibold ${statusMeta[a.status].cls}`}>{statusMeta[a.status].label}</span>
      </div>
      <NurseAlerts name={p.name} />
      <SymptomHistory name={p.name} />
      <NurseCarePanel name={p.name} />

      {a.status === "urgent" && (
        <div className="mt-5 rounded-2xl bg-destructive p-5 text-destructive-foreground">
          <p className="font-bold">🚨 تنبيه ذكي عاجل</p>
          <ul className="mt-2 list-inside list-disc text-sm">{a.alerts.filter((x) => x.level === "urgent").map((x) => <li key={x.text}>{x.text}</li>)}</ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`tel:${p.phone}`} onClick={() => setAction("تم بدء الاتصال المباشر")} className="btn bg-card text-destructive">📞 اتصال مباشر</a>
            <button onClick={() => setAction("تم إرسال طلب مراجعة المستشفى")} className="btn border border-destructive-foreground">🏥 طلب مراجعة المستشفى</button>
          </div>
          {action && <p className="mt-2 text-sm">✓ {action}</p>}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="mb-2 font-bold text-primary">🤖 تحليلات الذكاء الاصطناعي</h2>
          <div className="mb-3 flex items-center gap-3">
            <span className="font-display text-4xl text-ink">{a.risk.score}</span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${riskLevelMeta[a.risk.level].cls}`}>{a.risk.critical ? "تجاوز حرج" : riskLevelMeta[a.risk.level].label}</span>
          </div>
          <ul className="space-y-1 text-sm">{a.insights.map((i) => <li key={i}>• {i}</li>)}</ul>
          {a.alerts.length > 0 && (
            <ul className="mt-3 space-y-1">{a.alerts.map((x) => (
              <li key={x.text} className={`rounded-lg px-3 py-1.5 text-sm ${statusMeta[x.level].cls}`}>{x.text}</li>
            ))}</ul>
          )}
          <p className="mt-3 rounded-lg bg-secondary p-3 text-sm font-semibold text-secondary-foreground">التوصية: {a.recommendation}</p>
        </section>
        <section className="card-surface p-5">
          <h2 className="mb-2 font-bold text-primary">📈 منحنى تطور حالة المريض</h2>
          <RecoveryChart logs={p.logs} />
        </section>
      </div>

      <h2 className="mt-8 mb-3 text-xl font-bold">السجل اليومي</h2>
      <div className="space-y-3">
        {[...p.logs].reverse().map((l) => {
          const pct = Math.round((l.medsTaken / l.medsTotal) * 100);
          return (
            <div key={l.day} className="card-surface grid gap-4 p-5 md:grid-cols-[80px_1fr_1fr_1fr]">
              <div className="font-display text-2xl text-primary">Day {l.day}</div>
              <div>
                <p className="text-xs text-muted-foreground">الأدوية</p>
                <p className={`font-bold ${pct < 100 ? "text-destructive" : "text-success"}`}>{pct}% ({l.medsTaken}/{l.medsTotal})</p>
                <p className="text-xs" dir="ltr">{l.medTimes.join(" · ")}</p>
                {l.missedReason && <p className="text-xs text-destructive">السبب: {l.missedReason}</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الألم والحرارة</p>
                <p className="font-bold">{l.pain}/10 · {l.temp}°م</p>
                <p className="text-xs">{l.painSite}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الأعراض والملاحظات</p>
                <p className="text-sm">{l.symptoms.length ? l.symptoms.join("، ") : "لا أعراض جديدة"}</p>
                {l.notes && <p className="text-xs text-muted-foreground">{l.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
