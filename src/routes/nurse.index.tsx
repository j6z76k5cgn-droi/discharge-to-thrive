import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { NurseAlerts } from "@/components/NurseAlerts";
import { patientStore, usePatients } from "@/lib/patient-store";
import { analyze, patients, statusMeta } from "@/lib/midad-data";

export const Route = createFileRoute("/nurse/")({
  head: () => ({
    meta: [
      { title: "لوحة الممرض | مِداد" },
      { name: "description", content: "قائمة المرضى بعد الخروج مع مستويات الخطورة والتنبيهات الذكية." },
      { property: "og:title", content: "لوحة الممرض | مِداد" },
      { property: "og:description", content: "Nurse Interactive Dashboard" },
    ],
  }),
  component: Nurse,
});

function Nurse() {
  const rows = patients.map((p) => ({ p, a: analyze(p) }))
    .sort((x, y) => ["urgent", "follow", "stable"].indexOf(x.a.status) - ["urgent", "follow", "stable"].indexOf(y.a.status));
  const [open, setOpen] = useState<"urgent" | "follow" | null>(null);
  return (
    <Shell>
      <h1 className="font-display text-3xl text-ink">مرضاي بعد الخروج</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "إجمالي المرضى", v: rows.length, c: "text-ink" },
          { l: "حالات عاجلة", v: rows.filter((r) => r.a.status === "urgent").length, c: "text-destructive", k: "urgent" as const },
          { l: "تحتاج متابعة", v: rows.filter((r) => r.a.status === "follow").length, c: "text-warning-foreground", k: "follow" as const },
          { l: "متوسط الالتزام الدوائي", v: `${rows.length ? Math.round(rows.reduce((t, r) => t + r.a.adherence, 0) / rows.length) : 0}%`, c: "text-primary" },
        ].map((k) => (
          <button type="button" key={k.l} disabled={!("k" in k)} onClick={() => "k" in k && setOpen(k.k!)} className={`card-surface p-4 text-start ${"k" in k ? "cursor-pointer hover:ring-2 hover:ring-primary" : ""}`}>
            <p className="text-xs text-muted-foreground">{k.l}{"k" in k && " ↩︎ اضغط للتفاصيل"}</p>
            <p className={`font-display mt-1 text-3xl ${k.c}`}>{k.v}</p>
          </button>
        ))}
      </div>
      <div className="card-surface mt-3 p-4">
        <p className="mb-2 text-xs text-muted-foreground">درجة الخطورة لكل مريض</p>
        <div className="space-y-2">
          {rows.map(({ p, a }) => (
            <div key={p.id} className="flex items-center gap-2 text-xs">
              <span className="w-28 truncate font-semibold">{p.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full ${a.status === "urgent" ? "bg-destructive" : a.status === "follow" ? "bg-warning" : "bg-primary"}`} style={{ width: `${a.risk.score}%` }} /></div>
              <span className="w-10 text-left">{a.risk.score}</span>
            </div>
          ))}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setOpen(null)}>
          <div className="card-surface max-h-[85vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`font-bold ${open === "urgent" ? "text-destructive" : "text-warning-foreground"}`}>{open === "urgent" ? "🚨 الحالات العاجلة وأسبابها" : "⚠️ الحالات التي تحتاج متابعة"}</h3>
              <button type="button" onClick={() => setOpen(null)} className="btn bg-muted px-3 py-1 text-sm">✕</button>
            </div>
            {rows.filter((r) => r.a.status === open).length === 0 && <p className="text-sm text-muted-foreground">لا توجد حالات.</p>}
            {rows.filter((r) => r.a.status === open).map(({ p, a }) => (
              <div key={p.id} className="mb-3 rounded-xl border bg-background p-4 text-sm">
                <p className="font-bold">{p.name} <span className="text-xs text-muted-foreground">· درجة الخطورة {a.risk.score}/100</span></p>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">السبب:</p>
                <ul className="mt-1 space-y-1">{a.alerts.map((x) => <li key={x.text} className={`rounded-lg px-2 py-1 ${statusMeta[x.level].cls}`}>{x.text}</li>)}</ul>
                <p className="mt-2 text-xs">التوصية: {a.recommendation}</p>
                <Link to="/nurse/$patientId" params={{ patientId: p.id }} className="btn mt-3 inline-block bg-primary px-3 py-1 text-xs text-primary-foreground">فتح ملف المريض</Link>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">القرار السريري للفريق الصحي.</p>
          </div>
        </div>
      )}
      <NurseAlerts />
      <section className="card-surface mt-6 p-5">
        <h2 className="mb-3 font-bold text-destructive">🚨 تنبيهات الالتزام الدوائي</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {rows.flatMap(({ p }) => {
            const l = p.logs[p.logs.length - 1]!;
            if (l.medsTaken >= l.medsTotal) return [];
            return [(
              <Link key={p.id} to="/nurse/$patientId" params={{ patientId: p.id }}
                className={`rounded-xl p-3 text-sm ${l.medsTotal - l.medsTaken > 1 ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>
                <b>{p.name}</b> — فاتته {l.medsTotal - l.medsTaken} جرعة (اليوم {l.day})
                <span className="block text-xs opacity-90">آخر تسجيل: {l.medTimes[l.medTimes.length - 1]} · السبب: {l.missedReason ?? "غير مسجل"}</span>
              </Link>
            )];
          })}
        </div>
      </section>
      <div className="mt-6 space-y-3">
        {rows.map(({ p, a }) => (
          <Link key={p.id} to="/nurse/$patientId" params={{ patientId: p.id }}
            className={`card-surface flex flex-wrap items-center justify-between gap-3 p-5 transition hover:-translate-y-0.5 ${a.status === "urgent" ? "border-destructive" : ""}`}>
            <div>
              <p className="text-lg font-bold">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.category} · اليوم {p.logs.length} بعد الخروج</p>
              {a.alerts[0] && <p className="mt-1 text-xs text-destructive">⚠ {a.alerts[0].text}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">خطورة {a.risk.score}/100</span>
              <span className="text-sm text-muted-foreground">التزام {a.adherence}%</span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusMeta[a.status].cls}`}>{statusMeta[a.status].label}</span>
            </div>
          </Link>
        ))}
      </div>
      <OnCallQuestions />
    </Shell>
  );
}


function OnCallQuestions() {
  const list = usePatients();
  const qs = list.flatMap((p) => (p.inquiries ?? []).filter((q) => q.escalated && !q.answered).map((q) => ({ p, q })));
  return (
    <section className="card-surface mt-8 p-5">
      <h2 className="mb-2 font-bold text-primary">📨 أسئلة محوّلة للممرض المناوب ({qs.length})</h2>
      {qs.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد أسئلة بانتظار الرد.</p> : (
        <ul className="space-y-2">{qs.map(({ p, q }) => (
          <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-3 text-sm">
            <span><b>{p.name}</b> · {new Date(q.at).toLocaleString("ar-SA")}<br />{q.q}</span>
            <span className="flex gap-2">
              {p.phone && <a href={`tel:${p.phone}`} className="btn bg-primary px-3 py-1 text-xs text-primary-foreground">📞 اتصال</a>}
              <button type="button" onClick={() => patientStore.patch(p.id, (x) => ({ ...x, inquiries: (x.inquiries ?? []).map((y) => (y.id === q.id ? { ...y, answered: true } : y)) }))} className="btn bg-muted px-3 py-1 text-xs">✓ تم الرد</button>
            </span>
          </li>))}
        </ul>)}
    </section>
  );
}
