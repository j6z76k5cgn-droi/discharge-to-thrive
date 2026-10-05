import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { emptyPatient, newId, patientStore, usePatients, type ManagedPatient, type MedPlan } from "@/lib/patient-store";

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [
      { title: "إدارة المرضى | مِداد" },
      { name: "description", content: "إضافة وتعديل بيانات المرضى وخطط الأدوية والجرعات." },
      { property: "og:title", content: "إدارة المرضى | مِداد" },
      { property: "og:description", content: "قاعدة بيانات المرضى وخطط الجرعات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Patients,
});

const fields: { k: keyof ManagedPatient; l: string; type?: string; dir?: "ltr" }[] = [
  { k: "name", l: "الاسم الكامل" },
  { k: "mrn", l: "رقم الملف الطبي (MRN)", dir: "ltr" },
  { k: "ward", l: "القسم / الجناح" },
  { k: "room", l: "رقم الغرفة" },
  { k: "phone", l: "رقم الهاتف", type: "tel", dir: "ltr" },
  { k: "email", l: "البريد الإلكتروني للمريض", type: "email", dir: "ltr" },
  { k: "followUp", l: "موعد المتابعة القادم", type: "datetime-local" },
];
const inp = "w-full rounded-lg border bg-background p-2 text-sm";

function Patients() {
  const list = usePatients();
  const [edit, setEdit] = useState<ManagedPatient | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [med, setMed] = useState<MedPlan | null>(null);
  const [timeDraft, setTimeDraft] = useState("08:00");
  const [msg, setMsg] = useState("");

  const save = () => {
    if (!edit) return;
    if (!edit.name.trim() || !edit.mrn.trim()) { setMsg("الاسم ورقم الملف الطبي مطلوبان."); return; }
    patientStore.save(edit); setEdit(null); setMsg("✓ تم حفظ البيانات");
  };
  const del = () => {
    if (!edit) return;
    if (!isNew && !confirm(`هل تريد حذف المريض ${edit.name} نهائياً؟`)) return;
    patientStore.remove(edit.id); setEdit(null); setMsg("تم حذف المريض");
  };
  const saveMed = () => {
    if (!edit || !med || !med.name.trim() || !med.times.length) return;
    const meds = edit.meds.some((m) => m.id === med.id) ? edit.meds.map((m) => (m.id === med.id ? med : m)) : [...edit.meds, med];
    setEdit({ ...edit, meds }); setMed(null);
  };

  if (edit) return (
    <Shell>
      <h1 className="font-display text-3xl text-ink">{isNew ? "إضافة مريض" : `تعديل: ${edit.name}`}</h1>
      <section className="card-surface mt-5 p-5">
        <h2 className="mb-3 font-bold text-primary">البيانات الأساسية</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {fields.map((f) => (
            <label key={f.k} className="text-sm">
              <span className="mb-1 block font-semibold">{f.l}</span>
              <input type={f.type ?? "text"} dir={f.dir} value={edit[f.k] as string} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} className={inp} />
            </label>
          ))}
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-semibold">ملاحظات طبية عامة</span>
            <textarea rows={3} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} className={inp} />
          </label>
        </div>
      </section>

      <section className="card-surface mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-primary">💊 الأدوية وخطة الجرعات</h2>
          <button onClick={() => setMed({ id: newId(), name: "", route: "فموي Oral", times: [], windowMin: 30, missedAfterMin: 60 })} className="btn bg-primary px-3 py-1.5 text-sm text-primary-foreground">+ إضافة دواء / خطة الجرعات</button>
        </div>
        {edit.meds.length === 0 && <p className="text-sm text-muted-foreground">لا توجد أدوية بعد.</p>}
        {edit.meds.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-3 first:border-0 text-sm">
            <div>
              <p className="font-semibold" dir="ltr">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.route} · <span dir="ltr">{m.times.join(", ")}</span> · نافذة ±{m.windowMin}د · فائتة بعد {m.missedAfterMin}د</p>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => setMed(m)} className="text-primary">تعديل</button>
              <button onClick={() => setEdit({ ...edit, meds: edit.meds.filter((x) => x.id !== m.id) })} className="text-destructive">حذف</button>
            </div>
          </div>
        ))}
      </section>

      {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={save} className="btn bg-primary text-primary-foreground">حفظ البيانات</button>
        <button onClick={del} className="btn bg-destructive text-destructive-foreground">حذف المريض</button>
        <button onClick={() => { setEdit(null); setMsg(""); }} className="btn bg-muted">إلغاء / خروج</button>
      </div>

      {med && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setMed(null)}>
          <div dir="rtl" className="card-surface w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-bold text-primary">خطة الدواء والجرعات</h3>
            <div className="space-y-3 text-sm">
              <label className="block"><span className="mb-1 block font-semibold">اسم الدواء</span>
                <input dir="ltr" placeholder="Paracetamol 500 mg" value={med.name} onChange={(e) => setMed({ ...med, name: e.target.value })} className={inp} /></label>
              <label className="block"><span className="mb-1 block font-semibold">طريقة الإعطاء (Route)</span>
                <select value={med.route} onChange={(e) => setMed({ ...med, route: e.target.value })} className={inp}>
                  {["فموي Oral", "وريدي IV", "عضل IM", "تحت الجلد SC", "استنشاق Inhalation", "موضعي Topical"].map((r) => <option key={r}>{r}</option>)}
                </select></label>
              <div><span className="mb-1 block font-semibold">أوقات الجرعات</span>
                <div className="flex gap-2">
                  <input type="time" value={timeDraft} onChange={(e) => setTimeDraft(e.target.value)} className={inp} />
                  <button onClick={() => timeDraft && !med.times.includes(timeDraft) && setMed({ ...med, times: [...med.times, timeDraft].sort() })} className="btn bg-secondary px-3 text-secondary-foreground">إضافة</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {med.times.map((t) => (
                    <button key={t} dir="ltr" onClick={() => setMed({ ...med, times: med.times.filter((x) => x !== t) })} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t} ✕</button>
                  ))}
                </div></div>
              <div className="grid grid-cols-2 gap-2">
                <label><span className="mb-1 block font-semibold">نافذة الالتزام ± (دقيقة)</span>
                  <input type="number" min={0} value={med.windowMin} onChange={(e) => setMed({ ...med, windowMin: Number(e.target.value) })} className={inp} /></label>
                <label><span className="mb-1 block font-semibold">تعد فائتة بعد (دقيقة)</span>
                  <input type="number" min={0} value={med.missedAfterMin} onChange={(e) => setMed({ ...med, missedAfterMin: Number(e.target.value) })} className={inp} /></label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={saveMed} disabled={!med.name.trim() || !med.times.length} className="btn flex-1 bg-primary text-primary-foreground disabled:opacity-40">حفظ الدواء</button>
              <button onClick={() => setMed(null)} className="btn flex-1 bg-muted">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink">إدارة المرضى</h1>
        <button onClick={() => { setEdit(emptyPatient()); setIsNew(true); setMsg(""); }} className="btn bg-primary text-primary-foreground">+ إضافة مريض</button>
      </div>
      {msg && <p className="mt-3 text-sm text-success">{msg}</p>}
      <div className="mt-5 space-y-3">
        {list.map((p) => (
          <button key={p.id} onClick={() => { setEdit(p); setIsNew(false); setMsg(""); }} className="card-surface flex w-full flex-wrap items-center justify-between gap-2 p-4 text-right">
            <div>
              <p className="font-bold">{p.name}</p>
              <p className="text-xs text-muted-foreground"><span dir="ltr">{p.mrn}</span> · {p.ward} · غرفة {p.room}</p>
            </div>
            <span className="text-sm text-muted-foreground">{p.meds.length} أدوية · تعديل ←</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}
