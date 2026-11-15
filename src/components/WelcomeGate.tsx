import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, HeartPulse, Lock, Pill, Route as RouteIcon, ShieldCheck, Sparkles, Stethoscope, UserRound, Bell, FlaskConical } from "lucide-react";
import { setRole } from "@/lib/role-store";
import { useLang } from "@/lib/lang-store";
import { usePatients } from "@/lib/patient-store";
import { DEMO_PATIENT_ID, DEMO_STAFF, matchPatient, matchStaff } from "@/lib/demo-login";

type View = "home" | "patient" | "staff";

function DemoNote({ en }: { en: boolean }) {
  return (
    <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <FlaskConical className="size-4" />
      {en ? "Demo environment — sample data only, not connected to any hospital system." : "بيئة تجريبية — بيانات افتراضية فقط، غير مرتبطة بأي نظام مستشفى."}
    </p>
  );
}

export function WelcomeGate() {
  const en = useLang() === "en";
  const [view, setView] = useState<View>("home");
  if (view === "patient") return <PatientPortal en={en} back={() => setView("home")} />;
  if (view === "staff") return <StaffPortal en={en} back={() => setView("home")} />;
  const Arrow = en ? ArrowRight : ArrowLeft;
  const features = [
    { I: RouteIcon, t: en ? "Organized recovery plan" : "خطة تعافٍ منظمة", d: en ? "Clear daily steps after discharge" : "خطوات يومية واضحة بعد الخروج", c: "bg-secondary text-primary" },
    { I: Pill, t: en ? "Medication reminders" : "تذكير بالأدوية", d: en ? "On-time doses in a simple view" : "مواعيد دقيقة بواجهة مبسطة", c: "bg-coral-soft text-coral" },
    { I: ShieldCheck, t: en ? "Safe contact with your care team" : "تواصل آمن مع فريقك الطبي", d: en ? "Continuous, reassuring follow-up" : "متابعة مستمرة تمنحك الطمأنينة", c: "bg-secondary text-primary" },
  ];
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-4">
      <section className="card-surface overflow-hidden p-6 text-center md:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-primary">
          <span className="size-2 rounded-full bg-primary" />{en ? "Your safety bridge from hospital to home" : "جسر الأمان بين المستشفى ومنزلك"}
        </span>
        <h1 className="font-display mt-5 text-4xl text-ink md:text-5xl">
          {en ? "Welcome to " : "مرحباً بك في "}<span className="text-primary underline decoration-coral/40 decoration-4 underline-offset-8">{en ? "MIDAD" : "مِداد"}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {en ? "Your care continues safely and clearly — from hospital to the comfort of home. We guide you step by step with your medications, recovery, and your care team."
              : "رعايتك تستمر بأمان ووضوح.. من المستشفى إلى راحة منزلك. نرافقك خطوة بخطوة لتنظيم أدويتك، متابعة تعافيك، والبقاء على تواصل دائم مع فريقك الطبي."}
        </p>
        <HomeIllustration />
      </section>

      <section>
        <h2 className="text-center text-2xl font-bold text-ink">{en ? "Choose how to sign in" : "اختر طريقة الدخول للمتابعة"}</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">{en ? "Each space is designed for your daily needs" : "صُممت كل واجهة بعناية لتناسب احتياجاتك اليومية"}</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[
            { k: "patient" as const, I: UserRound, tag: en ? "Easy & comfortable" : "سهل ومريح", t: en ? "I am a patient" : "أنا مريض", d: en ? "Follow your recovery plan, medication times, and log your daily symptoms easily." : "تابع خطة تعافيك، مواعيد أدويتك، وسجّل أعراضك اليومية بكل سهولة ووضوح.", cta: en ? "Enter my recovery journey" : "الدخول إلى رحلة تعافيّ", tone: "primary" },
            { k: "staff" as const, I: Stethoscope, tag: en ? "Follow-up board" : "لوحة المتابعة", t: en ? "I am a nurse / clinician" : "أنا ممرض / كادر صحي", d: en ? "A full follow-up board for patient status, recovery indicators and alerts after discharge." : "لوحة متابعة شاملة لحالة المرضى، مؤشرات التعافي، والتنبيهات بعد الخروج.", cta: en ? "Enter the care board" : "الدخول إلى لوحة الرعاية", tone: "coral" },
          ].map((c) => (
            <button key={c.k} onClick={() => setView(c.k)} className="card-surface group flex flex-col p-6 text-start transition hover:-translate-y-1 md:p-8">
              <div className="flex items-start justify-between">
                <span className={`grid size-14 place-items-center rounded-2xl ${c.tone === "primary" ? "bg-secondary text-primary" : "bg-coral-soft text-coral"}`}><c.I className="size-7" /></span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.tone === "primary" ? "bg-secondary text-primary" : "bg-coral-soft text-coral"}`}>{c.tag}</span>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-ink">{c.t}</h3>
              <p className="mt-2 text-muted-foreground">{c.d}</p>
              <div className="mt-6 flex items-center justify-between border-t pt-5">
                <span className={`font-bold ${c.tone === "primary" ? "text-primary" : "text-coral"}`}>{c.cta}</span>
                <span className={`grid size-11 place-items-center rounded-full transition group-hover:scale-110 ${c.tone === "primary" ? "bg-primary text-primary-foreground" : "bg-coral text-coral-foreground"}`}><Arrow className="size-5" /></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="card-surface flex items-center gap-4 p-5">
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${f.c}`}><f.I className="size-6" /></span>
            <div><p className="font-bold text-ink">{f.t}</p><p className="text-sm text-muted-foreground">{f.d}</p></div>
          </div>
        ))}
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t pt-5 text-sm text-muted-foreground md:flex-row">
        <span className="flex items-center gap-2"><Lock className="size-4" />{en ? "Demo prototype • sample data only" : "نموذج تجريبي • بيانات افتراضية فقط"}</span>
        <span className="rounded-full bg-coral-soft px-4 py-1.5 font-semibold text-coral">{en ? "Need help signing in? Use the demo accounts shown on each portal." : "تحتاج مساعدة في الدخول؟ استخدم الحسابات التجريبية الظاهرة في كل بوابة."}</span>
      </footer>
    </div>
  );
}

function HomeIllustration() {
  return (
    <svg viewBox="0 0 440 300" className="mx-auto mt-8 w-full max-w-md" aria-hidden>
      <ellipse cx="220" cy="160" rx="200" ry="135" className="fill-secondary" />
      <circle cx="350" cy="55" r="32" className="fill-coral-soft" />
      <path d="M20 115 L110 45 L195 115" className="fill-none stroke-ink" strokeWidth="5" strokeLinejoin="round" />
      <rect x="35" y="110" width="150" height="130" rx="22" className="fill-card stroke-ink" strokeWidth="5" />
      <rect x="85" y="150" width="50" height="45" rx="10" className="fill-coral-soft" />
      <path d="M110 186 l-12 -12 a7 7 0 0 1 12 -9 a7 7 0 0 1 12 9z" className="fill-coral" />
      <path d="M190 175 Q235 165 280 140" className="fill-none stroke-coral" strokeWidth="3" strokeDasharray="8 8" />
      <circle cx="235" cy="160" r="20" className="fill-card stroke-coral" strokeWidth="4" />
      <path d="M226 160 l6 6 l12 -12" className="fill-none stroke-coral" strokeWidth="4" strokeLinecap="round" />
      <rect x="280" y="75" width="140" height="160" rx="22" className="fill-card stroke-primary" strokeWidth="5" />
      <path d="M350 105 v30 M335 120 h30" className="stroke-primary" strokeWidth="5" strokeLinecap="round" />
      <rect x="305" y="160" width="90" height="10" rx="5" className="fill-primary" />
      <rect x="305" y="185" width="60" height="10" rx="5" className="fill-coral" />
      <line x1="20" y1="252" x2="420" y2="252" className="stroke-border" strokeWidth="3" />
    </svg>
  );
}

function PortalFrame({ en, back, tag, tone, children }: { en: boolean; back: () => void; tag: string; tone: "primary" | "coral"; children: React.ReactNode }) {
  const BackArrow = en ? ArrowLeft : ArrowRight;
  return (
    <div className="mx-auto max-w-3xl py-4">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button onClick={back} className="card-surface flex items-center gap-2 px-4 py-2 font-semibold text-ink"><BackArrow className="size-4" />{en ? "Back to welcome" : "العودة إلى شاشة الترحيب"}</button>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone === "primary" ? "bg-secondary text-primary" : "bg-coral-soft text-coral"}`}>{tag}</span>
      </div>
      <div className="card-surface p-6 text-center md:p-10">{children}</div>
    </div>
  );
}

function PatientPortal({ en, back }: { en: boolean; back: () => void }) {
  const list = usePatients();
  const navigate = useNavigate();
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const demo = list[0];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = matchPatient(v, list);
    if (!id) { setErr(true); return; }
    localStorage.setItem("midad.patientId", id);
    setRole("patient");
    navigate({ to: "/home-care" });
  };
  return (
    <PortalFrame en={en} back={back} tone="primary" tag={en ? "Patient portal • easy sign-in" : "بوابة المريض • دخول ميسر"}>
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary text-primary"><HeartPulse className="size-8" /></span>
      <h1 className="mt-5 text-2xl font-bold text-ink md:text-3xl">{en ? "Welcome to your care space" : "أهلاً بك في مساحتك العلاجية"}</h1>
      <p className="mt-2 text-muted-foreground">{en ? "Enter your ID number or the medical file number sent to you by text message." : "أدخل رقم الهوية أو رقم الملف الطبي المرسل إليك عبر رسالة نصية"}</p>
      <form onSubmit={submit} className="mx-auto mt-6 max-w-lg space-y-4 text-start">
        <label className="block text-sm font-semibold text-ink">{en ? "Medical file number or mobile number" : "رقم الملف الطبي أو رقم الجوال"}
          <input value={v} onChange={(e) => { setV(e.target.value); setErr(false); }} dir="ltr" inputMode="text" className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring" placeholder={DEMO_PATIENT_ID} />
        </label>
        {err && <p role="alert" className="text-sm font-semibold text-destructive">{en ? "Number not found in the demo data. Try one of the demo numbers below." : "الرقم غير موجود في البيانات التجريبية. جرّب أحد الأرقام التجريبية بالأسفل."}</p>}
        {demo && (
          <button type="button" onClick={() => setV(DEMO_PATIENT_ID)} className="flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4 text-start">
            <Sparkles className="size-6 shrink-0 text-primary" />
            <span className="text-sm"><b className="text-ink">{en ? "Ready demo account: " : "حساب تجريبي جاهز: "}{demo.name}</b><br />
              <span className="text-muted-foreground" dir="ltr">ID {DEMO_PATIENT_ID} • {list.map((p) => p.mrn).join(" • ")}</span></span>
          </button>
        )}
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground transition hover:opacity-90">
          <CheckCircle2 className="size-5" />{en ? "Show my daily dashboard" : "عرض لوحة المريض اليومية"}
        </button>
      </form>
      <DemoNote en={en} />
    </PortalFrame>
  );
}

function StaffPortal({ en, back }: { en: boolean; back: () => void }) {
  const list = usePatients();
  const navigate = useNavigate();
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const Arrow = en ? ArrowRight : ArrowLeft;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!matchStaff(v)) { setErr(true); return; }
    setRole("nurse");
    navigate({ to: "/nurse" });
  };
  return (
    <PortalFrame en={en} back={back} tone="coral" tag={en ? "Clinical staff portal • MIDAD Clinic" : "بوابة الكادر الصحي • مِداد كلينيك"}>
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral-soft text-coral"><Stethoscope className="size-8" /></span>
      <h1 className="mt-5 text-2xl font-bold text-ink md:text-3xl">{en ? "Nurses & care coordinators portal" : "بوابة الممرضين ومنسقي الرعاية"}</h1>
      <p className="mt-2 text-muted-foreground">{en ? "Sign in with your employee number to follow patients after discharge." : "سجّل الدخول بالرقم الوظيفي لمتابعة حالات المرضى بعد الخروج"}</p>
      <form onSubmit={submit} className="mx-auto mt-6 max-w-lg space-y-4 text-start">
        <label className="block text-sm font-semibold text-ink">{en ? "Work email or employee number" : "البريد المؤسسي أو الرقم الوظيفي"}
          <input value={v} onChange={(e) => { setV(e.target.value); setErr(false); }} dir="ltr" className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring" placeholder={DEMO_STAFF[0]} />
        </label>
        {err && <p role="alert" className="text-sm font-semibold text-destructive">{en ? "Not a demo staff account. Use the demo account below." : "ليس حسابًا تجريبيًا معتمدًا. استخدم الحساب التجريبي بالأسفل."}</p>}
        <button type="button" onClick={() => setV(DEMO_STAFF[0]!)} className="flex w-full items-center gap-3 rounded-2xl border border-coral/20 bg-coral-soft p-4 text-start">
          <Bell className="size-6 shrink-0 text-coral" />
          <span className="text-sm"><b className="text-ink">{en ? `${list.length} patients in home follow-up (demo)` : `${list.length} مرضى تحت المتابعة المنزلية (تجريبي)`}</b><br />
            <span className="text-coral" dir="ltr">{DEMO_STAFF.join(" • ")}</span></span>
        </button>
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-4 text-lg font-bold text-coral-foreground transition hover:opacity-90">
          {en ? "Go to nurse dashboard" : "الانتقال إلى لوحة تحكم الممرض"}<Arrow className="size-5" />
        </button>
      </form>
      <DemoNote en={en} />
    </PortalFrame>
  );
}
