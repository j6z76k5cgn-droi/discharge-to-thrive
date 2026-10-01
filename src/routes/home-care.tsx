import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Shell } from "@/components/Shell";

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

const meds = [
  { n: "باراسيتامول 500mg", t: "08:00" },
  { n: "أموكسيسيلين 500mg", t: "14:00" },
  { n: "أوميبرازول 20mg", t: "20:00" },
  { n: "باراسيتامول 500mg", t: "23:00" },
];
const symptomsList = ["حرارة", "غثيان", "ضيق التنفس", "تورم الجرح", "دوخة"];
const sites = ["الرأس", "الصدر", "البطن", "موضع الجرح", "الظهر", "الأطراف"];

function HomeCare() {
  const [medState, setMedState] = useState<Record<number, string>>({});
  const [pain, setPain] = useState<number | null>(null);
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
    setNotes([...notes, { t: draft.trim(), time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) }]);
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
  const painColor = (n: number) => (n <= 3 ? "bg-success text-success-foreground" : n <= 6 ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground");

  return (
    <Shell>
      <h1 className="font-display text-3xl text-ink">مهامي اليومية</h1>
      <p className="text-sm text-muted-foreground">اليوم الرابع بعد الخروج</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="mb-3 font-bold text-primary">💊 تتبع الأدوية</h2>
          {meds.map((m, i) => (
            <div key={i} className="border-t py-3 first:border-0">
              <div className="flex items-center justify-between">
                <div><p className="font-semibold">{m.n}</p><p className="text-xs text-muted-foreground">{m.t}</p></div>
                {medState[i] === "taken" ? <span className="text-sm font-semibold text-success">✓ تم التناول</span> : (
                  <button onClick={() => setMedState({ ...medState, [i]: "taken" })} className="btn bg-primary px-3 py-1 text-sm text-primary-foreground">تم</button>
                )}
              </div>
              {medState[i] !== "taken" && (
                <select value={medState[i] ?? ""} onChange={(e) => setMedState({ ...medState, [i]: e.target.value })}
                  className="mt-2 w-full rounded-lg border bg-background p-1.5 text-xs">
                  <option value="">سبب عدم التناول (اختياري)</option>
                  <option>نسيت</option><option>أعراض جانبية</option><option>نفد الدواء</option><option>كنت نائماً</option>
                </select>
              )}
            </div>
          ))}
        </section>

        <section className="card-surface p-5">
          <h2 className="mb-3 font-bold text-primary">📊 مستوى الألم</h2>
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} onClick={() => setPain(n)}
                className={`aspect-square rounded-lg text-sm font-bold ${pain === n ? painColor(n) + " scale-110" : "bg-muted"}`}>{n}</button>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>لا ألم</span><span>ألم شديد</span></div>
          <p className="mt-4 mb-2 text-sm font-semibold">مكان الألم <span className="text-xs font-normal text-muted-foreground">(يمكن اختيار أكثر من مكان)</span></p>
          <div className="flex flex-wrap gap-2">
            {sites.map((s) => {
              const on = sitesSel.includes(s);
              return (
                <button key={s} onClick={() => setSitesSel(on ? sitesSel.filter((x) => x !== s) : [...sitesSel, s])}
                  className={`btn px-3 py-1 text-sm ${on ? "bg-ink text-primary-foreground" : "bg-muted"}`}>{s}</button>
              );
            })}
          </div>
          {sitesSel.length > 0 && <p className="mt-2 text-xs text-muted-foreground">مكان الألم: {sitesSel.join("، ")}</p>}
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
    </Shell>
  );
}
