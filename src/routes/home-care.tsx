import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { evaluatePatientStatus, riskLevelMeta } from "@/lib/risk-engine";
import { Shell } from "@/components/Shell";
import { usePatients } from "@/lib/patient-store";

export const Route = createFileRoute("/home-care")({
  head: () => ({
    meta: [
      { title: "المتابعة المنزلية | مِداد" },
      { name: "description", content: "تطبيق المريض اليومي: الأدوية، الألم، الأعراض، والمساعد الصوتي." },
      { property: "og:title", content: "المتابعة المنزلية | مِداد" },
      { property: "og:description", content: "مهام يومية لتعافٍ آمن في المنزل." },
    ],
  }),
  component: HomeCare,
});

const ADVANCE = 30;
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h! * 60 + m!; };
const speak = (txt: string) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt); u.lang = "ar-SA"; window.speechSynthesis.speak(u);
};
const symIcons: Record<string, string> = { "حرارة": "🌡️", "غثيان": "🤢", "ضيق التنفس": "😮‍💨", "تورم الجرح": "🩹", "دوخة": "😵‍💫", "زرقة الشفاه/الأطراف": "💙", "ألم صدر حاد": "💔" };
type Mode = "STANDARD" | "BIG_BUTTONS" | "VISUAL_SYMBOLS" | "CAREGIVER";
const modes: { v: Mode; l: string }[] = [
  { v: "STANDARD", l: "📝 عادي" }, { v: "BIG_BUTTONS", l: "👆 أزرار كبيرة" }, { v: "VISUAL_SYMBOLS", l: "🖼️ رموز بصرية" }, { v: "CAREGIVER", l: "👨‍👩‍👧 وضع المرافق" },
];
type Dose = { status: "TAKEN"; at: string } | { status: "MISSED"; reason: string; severe?: string };

const symptomsList = ["حرارة", "غثيان", "ضيق التنفس", "تورم الجرح", "دوخة", "زرقة الشفاه/الأطراف", "ألم صدر حاد", "انخفاض أكسجين الدم"];
const sites = ["الرأس", "الصدر", "البطن", "موضع الجرح", "الظهر", "الأطراف"];

function HomeCare() {
  const list = usePatients();
  const [pid, setPid] = useState("");
  const patient = list.find((x) => x.id === pid) ?? list[0];
  const meds = (patient?.meds ?? []).map((m) => ({ rx: `${patient!.id}-${m.id}`, n: m.name, d: m.route, times: m.times, win: m.windowMin, grace: m.missedAfterMin }));
  const [tasksDone, setTasksDone] = useState<Record<string, boolean>>({});
  const tasks = patient ? [
    "قياس العلامات الحيوية (الحرارة، الضغط، الأكسجين)",
    ...patient.meds.map((m) => `إعطاء/متابعة ${m.name} (${m.route})`),
    "تقييم مستوى الألم والأعراض",
    ...(patient.followUp ? [`تأكيد موعد المتابعة ${patient.followUp.replace("T", " ")}`] : []),
  ] : [];
  const [doses, setDoses] = useState<Record<string, Dose>>({});
  const [now, setNow] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("STANDARD");
  const [cgId, setCgId] = useState("CG-8821");
  useEffect(() => { const f = () => { const d = new Date(); setNow(d.getHours() * 60 + d.getMinutes()); }; f(); const t = setInterval(f, 30000); return () => clearInterval(t); }, []);
  const [painBySite, setPainBySite] = useState<Record<string, number>>({});
  const [sitesSel, setSitesSel] = useState<string[]>([]);
  const [sym, setSym] = useState<string[]>([]);
  const [customSyms, setCustomSyms] = useState<{ name: string; loc?: string | undefined; sev?: string | undefined }[]>([]);
  const [symDraft, setSymDraft] = useState("");
  const [symLoc, setSymLoc] = useState("");
  const [symSev, setSymSev] = useState("");
  const [notes, setNotes] = useState<{ t: string; time: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("المتصفح لا يدعم التسجيل الصوتي"); return; }
    const r = new SR(); r.lang = "ar-SA"; r.interimResults = false;
    r.onresult = (e: any) => setDraft((d) => (d ? d + " " : "") + e.results[0][0].transcript);
    r.onend = () => setListening(false);
    recRef.current = r; r.start(); setListening(true);
  };
  const addNote = () => {
    if (!draft.trim()) return;
    setNotes([...notes, { t: draft.trim() + enteredBy, time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) }]);
    setDraft("");
  };
  const addSym = () => {
    const name = symDraft.trim();
    if (!name) return;
    if (symptomsList.includes(name) || customSyms.some((s) => s.name === name)) { setSymDraft(""); return; }
    setCustomSyms([...customSyms, { name, loc: symLoc || undefined, sev: symSev || undefined }]);
    setSym((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setSymDraft(""); setSymLoc(""); setSymSev("");
  };
  const enteredBy = mode === "CAREGIVER" ? ` · بواسطة المرافق ${cgId}` : "";
  const due = meds.flatMap((m) => m.times.map((t) => ({ k: `${m.rx}-${t}`, t, grace: m.grace }))).filter((x) => now != null && toMin(x.t) <= now);
  const taken = due.filter((x) => doses[x.k]?.status === "TAKEN").length;
  const missedAuto = due.filter((x) => !doses[x.k] && now! - toMin(x.t) > x.grace);
  const adherencePct = due.length ? Math.round((taken / due.length) * 100) : 100;
  const severe = Object.values(doses).find((d) => d.status === "MISSED" && d.severe) as { severe?: string } | undefined;
  const risk = evaluatePatientStatus({
    symptoms: sym.map((n) => { const c = customSyms.find((x) => x.name === n); return { name: n, severity: c?.sev ? Number(c.sev) : undefined }; }),
    adherencePct,
    pain: Math.max(0, ...Object.entries(painBySite).filter(([k]) => sitesSel.includes(k)).map(([, v]) => v)),
    severeSideEffect: severe?.severe,
  });
  const painColor = (n: number) => (n <= 3 ? "bg-success text-success-foreground" : n <= 6 ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground");

  return (
    <Shell>
      <div className={mode === "BIG_BUTTONS" ? "text-lg [&_.btn]:min-h-16 [&_.btn]:min-w-16 [&_.btn]:text-lg" : ""}>
      <h1 className="font-display text-3xl text-ink">مهامي اليومية</h1>
      <div className="card-surface mt-3 flex flex-wrap items-center gap-2 p-3">
        <span className="text-sm font-semibold">المريض:</span>
        <select value={patient?.id ?? ""} onChange={(e) => { setPid(e.target.value); setDoses({}); setTasksDone({}); }} className="rounded-lg border bg-background p-2 text-sm">
          {list.map((x) => <option key={x.id} value={x.id}>{x.name} — {x.mrn}</option>)}
        </select>
        {patient && <span className="text-xs text-muted-foreground">{patient.ward} · غرفة {patient.room}</span>}
      </div>
      <section className="card-surface mt-3 p-4">
        <h2 className="mb-2 font-bold text-primary">📋 المهام التمريضية والطبية لليوم</h2>
        {tasks.map((t) => (
          <label key={t} className="flex items-center gap-2 border-t py-2 text-sm first:border-0">
            <input type="checkbox" checked={!!tasksDone[t]} onChange={(e) => setTasksDone({ ...tasksDone, [t]: e.target.checked })} />
            <span className={tasksDone[t] ? "line-through text-muted-foreground" : ""}>{t}</span>
          </label>
        ))}
      </section>

      <section className="card-surface mt-4 p-4">
        <p className="mb-2 text-sm font-semibold">وضع التعافي المتكيف</p>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button key={m.v} onClick={() => setMode(m.v)} className={`btn px-3 py-1.5 text-sm ${mode === m.v ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.l}</button>
          ))}
          <button onClick={() => speak("مهامي اليومية. سجّل أدويتك، ومستوى الألم، والأعراض.")} className="btn bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">🔊 اقرأ لي</button>
        </div>
        {mode === "CAREGIVER" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-secondary p-2 text-sm text-secondary-foreground">
            رمز المرافق:
            <input value={cgId} onChange={(e) => setCgId(e.target.value)} className="w-28 rounded border bg-background p-1 text-foreground" />
            <span className="text-xs">كل إدخال يُسجَّل باسم المرافق (entered_by: CAREGIVER) لمراجعة التمريض.</span>
          </div>
        )}
      </section>

      {risk.critical ? (
        <div className="mt-4 rounded-2xl bg-destructive p-5 text-destructive-foreground">
          <p className="font-bold">🚨 تم رصد علامة تستدعي تقييمًا عاجلًا</p>
          <p className="mt-1 text-sm">سبب التنبيه: {risk.reasons.join("، ")}. الإجراء: تم إشعار الكادر التمريضي المسؤول وفق بروتوكول المنشأة.</p>
        </div>
      ) : (
        <div className="card-surface mt-4 flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
          <span>البيانات مسجلة والمتابعة مستمرة.</span>
          <span className={`rounded-full px-3 py-1 font-semibold ${riskLevelMeta[risk.level].cls}`}>مؤشر المتابعة: {riskLevelMeta[risk.level].label}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="card-surface p-5 md:col-span-2">
          <h2 className="mb-1 font-bold text-primary">💊 دليل العلاج وتتبع الجرعات</h2>
          <p className="mb-3 text-xs text-muted-foreground">التعليمات منقولة حرفيًا من وصفة الطبيب المعتمدة — لا يتم توليدها أو تعديلها آليًا.</p>
          {missedAuto.length > 0 && (
            <p className="mb-3 rounded-lg bg-warning p-2 text-sm text-warning-foreground">⏰ {missedAuto.length} جرعة تجاوزت فترة السماح (60 دقيقة) — تم إشعار الممرض المتابع.</p>
          )}
          <div className="grid gap-3 lg:grid-cols-3">
            {meds.map((m) => {
              const next = m.times.find((t) => now != null && toMin(t) > now && !doses[`${m.rx}-${t}`]);
              const left = next && now != null ? toMin(next) - now : null;
              const text = `${m.n}، ${m.d}، الأوقات ${m.times.join(" و ")}`;
              return (
                <div key={m.rx} className="rounded-xl border bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="font-bold" dir="ltr">{m.n}</p><p className="text-xs text-muted-foreground">{m.d}</p></div>
                    <button onClick={() => speak(text)} aria-label="استماع" className="btn bg-secondary px-2 py-1 text-secondary-foreground">🔊</button>
                  </div>
                  <p className="mt-2 text-sm">{m.times.length} جرعات يومياً · نافذة ±{m.win}د · فائتة بعد {m.grace}د</p>
                  {next && <p className={`mt-2 rounded-lg p-2 text-xs ${left! <= ADVANCE ? "bg-warning text-warning-foreground" : "bg-muted"}`}>الجرعة القادمة {next} · بعد {Math.floor(left! / 60)}س {left! % 60}د{left! <= ADVANCE ? " — 🔔 تنبيه مسبق" : ""}</p>}
                  <div className="mt-3 space-y-2">
                    {m.times.map((t) => {
                      const k = `${m.rx}-${t}`, d = doses[k];
                      const late = now != null && !d ? now - toMin(t) : -1;
                      const st = d ? d.status : late > m.grace ? "MISSED" : late > m.win ? "DELAYED" : "SCHEDULED";
                      return (
                        <div key={t} className="rounded-lg border p-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span dir="ltr" className="font-semibold">{t}</span>
                            {d?.status === "TAKEN" ? <span className="text-xs font-semibold text-success">✓ أُعطيت {d.at}</span>
                              : d?.status === "MISSED" ? <span className="text-xs text-destructive">لم تؤخذ: {d.reason}{d.severe ? " (حادة)" : ""}</span>
                              : <span className={`text-xs ${st === "MISSED" ? "text-destructive" : st === "DELAYED" ? "text-warning" : "text-muted-foreground"}`}>{st === "MISSED" ? "فائتة" : st === "DELAYED" ? "متأخرة" : "معلقة"}</span>}
                          </div>
                          {!d && (
                            <div className="mt-2 flex gap-2">
                              <button onClick={() => setDoses({ ...doses, [k]: { status: "TAKEN", at: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) + enteredBy } })}
                                className="btn flex-1 bg-success px-2 py-1 text-xs text-success-foreground">أخذت الدواء 🟢</button>
                              <select value="" onChange={(e) => e.target.value && setDoses({ ...doses, [k]: { status: "MISSED", reason: e.target.value } })}
                                className="flex-1 rounded-lg border bg-background p-1 text-xs">
                                <option value="">لم آخذه…</option>
                                <option>نسيت</option><option>ما قدرت آخذ الدواء (صعوبة بلع/غثيان)</option>
                                <option>ظهرت أعراض جانبية</option><option>ما توفر الدواء</option><option>سبب آخر</option>
                              </select>
                            </div>
                          )}
                          {d?.status === "MISSED" && d.reason === "ظهرت أعراض جانبية" && !d.severe && (
                            <div className="mt-2 flex gap-2 text-xs">
                              <span>شدة الأعراض؟</span>
                              <button onClick={() => setDoses({ ...doses, [k]: { ...d, reason: "أعراض جانبية خفيفة" } })} className="btn bg-muted px-2 py-0.5">خفيفة</button>
                              <button onClick={() => setDoses({ ...doses, [k]: { ...d, severe: `${m.n} ${t}` } })} className="btn bg-destructive px-2 py-0.5 text-destructive-foreground">حادة 🚨</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card-surface p-5">
          <h2 className="mb-3 font-bold text-primary">📊 مستوى الألم</h2>
          <p className="mb-2 text-sm font-semibold">مكان الألم <span className="text-xs font-normal text-muted-foreground">(يمكن اختيار أكثر من مكان)</span></p>
          <div className="flex flex-wrap gap-2">
            {sites.map((s) => {
              const on = sitesSel.includes(s);
              return (
                <button key={s} onClick={() => setSitesSel(on ? sitesSel.filter((x) => x !== s) : [...sitesSel, s])}
                  className={`btn px-3 py-1 text-sm ${on ? "bg-ink text-primary-foreground" : "bg-muted"}`}>{s}</button>
              );
            })}
          </div>
          <div className="mt-4 space-y-3">
            {sitesSel.map((s) => (
              <div key={s} className="rounded-xl border bg-background p-3">
                <p className="mb-2 text-sm font-semibold">{s}</p>
                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }, (_, n) => (
                    <button key={n} onClick={() => setPainBySite({ ...painBySite, [s]: n })}
                      className={`aspect-square rounded-lg text-sm font-bold ${(painBySite[s] ?? -1) === n ? painColor(n) + " scale-110" : "bg-muted"}`}>{n}</button>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>لا ألم</span><span>ألم شديد</span></div>
              </div>
            ))}
          </div>
          {sitesSel.length === 0 && <p className="mt-3 text-xs text-muted-foreground">اختر مكان الألم أولاً، ثم قيّم كل مكان على حدة.</p>}
        </section>

        <section className="card-surface p-5">
          <h2 className="mb-3 font-bold text-primary">🩺 الأعراض اليومية</h2>
          <p className="mb-2 text-sm text-muted-foreground">هل تعاني اليوم من أي مما يلي؟</p>
          <div className="flex flex-wrap gap-2">
            {[...symptomsList, ...customSyms.map((c) => c.name)].map((s) => {
              const on = sym.includes(s);
              const extra = customSyms.find((c) => c.name === s);
              return (
                <span key={s} className="inline-flex items-center">
                  <button onClick={() => setSym(on ? sym.filter((x) => x !== s) : [...sym, s])}
                    className={`btn px-3 py-1.5 text-sm ${on ? "bg-destructive text-destructive-foreground" : "bg-muted"}`}>
                    {mode === "VISUAL_SYMBOLS" && <span className="ml-1 text-2xl">{symIcons[s] ?? "❓"}</span>}
                    {s}
                    {extra && (extra.loc || extra.sev) && (
                      <span className="mr-1 text-xs opacity-80">
                        [{[extra.loc, extra.sev && `${extra.sev}/10`].filter(Boolean).join(" · ")}]
                      </span>
                    )}
                  </button>
                  {extra && (
                    <button onClick={() => { setCustomSyms(customSyms.filter((c) => c.name !== s)); setSym(sym.filter((x) => x !== s)); }}
                      aria-label={`حذف ${s}`} className="mr-1 text-xs text-muted-foreground hover:text-destructive">✕</button>
                  )}
                </span>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border bg-background p-3">
            <p className="mb-2 text-sm font-semibold">إضافة عرض آخر غير المذكور</p>
            <input value={symDraft} onChange={(e) => setSymDraft(e.target.value)}
              placeholder="اكتب العرض، مثل: ألم عند التنفس"
              className="w-full rounded-lg border bg-background p-2 text-sm" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select value={symLoc} onChange={(e) => setSymLoc(e.target.value)} className="rounded-lg border bg-background p-1.5 text-xs">
                <option value="">مكان الألم (اختياري)</option>
                {sites.map((s) => <option key={s}>{s}</option>)}
                <option value="أخرى">أخرى</option>
              </select>
              <select value={symSev} onChange={(e) => setSymSev(e.target.value)} className="rounded-lg border bg-background p-1.5 text-xs">
                <option value="">شدة الألم من 10 (اختياري)</option>
                {Array.from({ length: 11 }, (_, n) => <option key={n} value={String(n)}>{n} / 10</option>)}
              </select>
            </div>
            <button onClick={addSym} className="btn mt-2 w-full bg-primary px-3 py-1.5 text-sm text-primary-foreground">+ إضافة العرض</button>
          </div>
          {sym.length > 0 && <p className="mt-3 text-xs text-destructive">سيتم إشعار الممرض المتابع بهذه الأعراض.</p>}
        </section>

        <section className="card-surface p-5">
          <h2 className="mb-3 font-bold text-primary">🎙️ المساعد الصوتي / النصي</h2>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="اكتب أو سجّل ما تشعر به..."
            className="w-full rounded-lg border bg-background p-2 text-sm" />
          <div className="mt-2 flex gap-2">
            <button onClick={() => (listening ? recRef.current?.stop() : startVoice())}
              className={`btn flex-1 ${listening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-secondary-foreground"}`}>
              {listening ? "إيقاف التسجيل" : "🎤 تسجيل صوتي"}
            </button>
            <button onClick={addNote} className="btn flex-1 bg-primary text-primary-foreground">إضافة</button>
          </div>
          <ul className="mt-3 space-y-2">
            {notes.map((n, i) => (
              <li key={i} className="flex items-start justify-between gap-2 rounded-lg bg-muted p-2 text-sm">
                <span><span className="text-xs text-muted-foreground">{n.time} — </span>{n.t}</span>
                <span className="flex gap-2 text-xs">
                  <button onClick={() => { setDraft(n.t); setNotes(notes.filter((_, j) => j !== i)); }} className="text-primary">تعديل</button>
                  <button onClick={() => setNotes(notes.filter((_, j) => j !== i))} className="text-destructive">حذف</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      </div>
    </Shell>
  );
}
