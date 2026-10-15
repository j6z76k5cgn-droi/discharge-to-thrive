import { patientStore, usePatients, type ManagedPatient } from "@/lib/patient-store";
import { tierMeta } from "@/lib/symptoms-engine";

const fmt = (s: string) => new Date(s).toLocaleString("ar-SA");

/** Live alerts from patient-entered symptoms and vitals. Optional `name` limits to one patient. */
export function NurseAlerts({ name }: { name?: string }) {
  const list = usePatients().filter((p) => !name || p.name === name);
  const open = list.flatMap((p) => (p.symptomReports ?? []).filter((r) => !r.resolved && r.tier !== "HOME").map((r) => ({ p, r })))
    .sort((a, b) => (a.r.tier === "EMERGENCY" ? -1 : 1) - (b.r.tier === "EMERGENCY" ? -1 : 1) || b.r.at.localeCompare(a.r.at));
  const vit = list.flatMap((p) => (p.vitals ?? []).filter((v) => v.level !== "normal").slice(-3).map((v) => ({ p, v })));
  return (
    <section className="card-surface mt-6 p-5">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-destructive">
        🔔 التنبيهات العاجلة من المرضى
        {open.length > 0 && <span className="animate-pulse rounded-full bg-destructive px-2.5 py-0.5 text-sm text-destructive-foreground">{open.length}</span>}
      </h2>
      {open.length === 0 && vit.length === 0 && <p className="text-sm text-muted-foreground">لا توجد تنبيهات مفتوحة.</p>}
      <div className="space-y-2">
        {open.map(({ p, r }) => (
          <div key={r.id} className={`rounded-xl p-3 text-sm ${tierMeta[r.tier].cls}`}>
            <p className="font-bold">{tierMeta[r.tier].icon} {p.name} — {tierMeta[r.tier].label}{r.critical ? " (تجاوز حرج)" : ""}</p>
            <p>الأعراض: {r.symptoms.join("، ")} · درجة الخطورة {r.score}/100</p>
            <p className="text-xs opacity-90">{fmt(r.at)} · مُدخل من قِبل المريض · النصيحة المعروضة: {r.advice.map((a) => a.when).join(" / ")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={`tel:${p.phone}`} className="btn bg-card px-3 py-1 text-foreground">📞 اتصال بالمريض</a>
              <button onClick={() => patientStore.resolveReport(p.id, r.id, "الممرض")} className="btn border px-3 py-1">✓ تمت المعالجة</button>
            </div>
          </div>
        ))}
        {vit.map(({ p, v }) => <VitalRow key={v.id} p={p} v={v} />)}
      </div>
    </section>
  );
}

function VitalRow({ p, v }: { p: ManagedPatient; v: NonNullable<ManagedPatient["vitals"]>[number] }) {
  return (
    <div className={`rounded-xl p-3 text-sm ${v.level === "danger" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>
      <b>{p.name}</b> — قراءة خارج النطاق: {v.label} <span className="block text-xs opacity-90">{fmt(v.at)} · مُدخل من قِبل {v.by}</span>
    </div>
  );
}

/** Full history of symptom reports for one patient. */
export function SymptomHistory({ name }: { name: string }) {
  const p = usePatients().find((x) => x.name === name);
  const rs = [...(p?.symptomReports ?? [])].reverse();
  return (
    <section className="card-surface mt-5 p-5">
      <h2 className="mb-3 font-bold text-primary">🩺 سجل الأعراض المُدخلة من المريض</h2>
      {rs.length === 0 && <p className="text-sm text-muted-foreground">لا توجد تقارير أعراض بعد.</p>}
      <ul className="space-y-2">{rs.map((r) => (
        <li key={r.id} className="rounded-lg border bg-background p-3 text-sm">
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${tierMeta[r.tier].cls}`}>{tierMeta[r.tier].label}</span>
          {r.symptoms.join("، ")} · {r.score}/100
          <span className="block text-xs text-muted-foreground">{fmt(r.at)} · {r.resolved ? `عولج ${fmt(r.resolved.at)}` : "مفتوح"}</span>
        </li>
      ))}</ul>
    </section>
  );
}
