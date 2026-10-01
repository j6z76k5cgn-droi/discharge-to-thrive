import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/discharge")({
  head: () => ({
    meta: [
      { title: "قائمة ما قبل الخروج | مِداد" },
      { name: "description", content: "تقييم جاهزية المريض للخروج من المستشفى بدرجة جاهزية ذكية." },
      { property: "og:title", content: "قائمة ما قبل الخروج | مِداد" },
      { property: "og:description", content: "Smart Discharge Readiness Score" },
    ],
  }),
  component: Discharge,
});

const sections = [
  { title: "الخطة العلاجية والتثقيف الصحي", items: [
    "تم شرح جدول الأدوية وفهمه المريض",
    "تم توضيح علامات الخطر التي تستدعي مراجعة الطوارئ",
    "تم تأكيد مواعيد المتابعة القادمة",
  ]},
  { title: "تقييم قدرة المريض/المرافق", items: [
    "قادر على استخدام الأجهزة الطبية المنزلية",
    "قادر على الغيار على الجرح (إن وجد)",
    "المرافق متواجد ومدرَّب على الرعاية",
  ]},
  { title: "الجاهزية العامة", items: [
    "العلامات الحيوية مستقرة خلال آخر 24 ساعة",
    "الألم تحت السيطرة بالأدوية الفموية",
    "تم تثبيت تطبيق المتابعة المنزلية",
  ]},
];

type Ans = 0 | 0.5 | 1;
const opts: { v: Ans; l: string }[] = [{ v: 1, l: "نعم" }, { v: 0.5, l: "جزئي" }, { v: 0, l: "لا" }];

function Discharge() {
  const [ans, setAns] = useState<Record<string, Ans>>({});
  const [done, setDone] = useState(false);
  const total = sections.reduce((a, s) => a + s.items.length, 0);
  const score = Math.round((Object.values(ans).reduce((a: number, v) => a + v, 0) / total) * 100);
  const ready = score >= 90;

  return (
    <Shell>
      <h1 className="font-display text-3xl text-ink">قائمة مهام ما قبل الخروج</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.title} className="card-surface p-5">
              <h2 className="mb-3 font-bold text-primary">{s.title}</h2>
              {s.items.map((it) => (
                <div key={it} className="flex flex-wrap items-center justify-between gap-2 border-t py-3 first:border-0">
                  <span className="text-sm">{it}</span>
                  <div className="flex gap-1">
                    {opts.map((o) => (
                      <button key={o.l} onClick={() => setAns({ ...ans, [it]: o.v })}
                        className={`btn px-3 py-1 text-sm ${ans[it] === o.v ? (o.v === 1 ? "bg-success text-success-foreground" : o.v === 0 ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground") : "bg-muted text-muted-foreground"}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <aside className="card-surface h-fit p-6 text-center lg:sticky lg:top-20">
          <p className="text-sm text-muted-foreground">درجة جاهزية الخروج</p>
          <p className={`font-display mt-2 text-6xl ${ready ? "text-success" : score >= 60 ? "text-warning" : "text-destructive"}`}>{score}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full transition-all ${ready ? "bg-success" : "bg-warning"}`} style={{ width: `${score}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">الحد الأدنى للخروج الآمن: 90%</p>
          <button disabled={!ready} onClick={() => setDone(true)}
            className="btn mt-4 w-full bg-primary text-primary-foreground disabled:opacity-40">اعتماد الخروج</button>
          {done && <p className="mt-3 text-sm font-semibold text-success">✓ تم اعتماد خروج المريض وتفعيل المتابعة المنزلية</p>}
        </aside>
      </div>
    </Shell>
  );
}
