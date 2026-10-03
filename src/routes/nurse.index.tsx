import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
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
  return (
    <Shell>
      <h1 className="font-display text-3xl text-ink">مرضاي بعد الخروج</h1>
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
              <span className="text-sm text-muted-foreground">التزام {a.adherence}%</span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusMeta[a.status].cls}`}>{statusMeta[a.status].label}</span>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
