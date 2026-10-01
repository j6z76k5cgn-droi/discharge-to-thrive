import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { analyze, patients, statusMeta } from "@/lib/midad-data";

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

function PainChart({ values }: { values: number[] }) {
  const w = 320, h = 140, pad = 20;
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(values.length - 1, 1);
  const y = (v: number) => h - pad - (v / 10) * (h - pad * 2);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ direction: "ltr" }}>
      {[0, 5, 10].map((g) => <line key={g} x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} className="stroke-border" />)}
      <path d={d} fill="none" strokeWidth={3} className="stroke-primary" />
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={5} className={v >= 7 ? "fill-destructive" : "fill-primary"} />
          <text x={x(i)} y={y(v) - 9} textAnchor="middle" fontSize={11} className="fill-foreground">{v}</text>
          <text x={x(i)} y={h - 4} textAnchor="middle" fontSize={10} className="fill-muted-foreground">D{i + 1}</text>
        </g>
      ))}
    </svg>
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
          <ul className="space-y-1 text-sm">{a.insights.map((i) => <li key={i}>• {i}</li>)}</ul>
          {a.alerts.length > 0 && (
            <ul className="mt-3 space-y-1">{a.alerts.map((x) => (
              <li key={x.text} className={`rounded-lg px-3 py-1.5 text-sm ${statusMeta[x.level].cls}`}>{x.text}</li>
            ))}</ul>
          )}
          <p className="mt-3 rounded-lg bg-secondary p-3 text-sm font-semibold text-secondary-foreground">التوصية: {a.recommendation}</p>
        </section>
        <section className="card-surface p-5">
          <h2 className="mb-2 font-bold text-primary">📈 منحنى تطور الألم</h2>
          <PainChart values={p.logs.map((l) => l.pain)} />
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
