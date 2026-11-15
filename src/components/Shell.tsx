import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { setRole, useRole } from "@/lib/role-store";
import { setLang, useLang } from "@/lib/lang-store";
import { setBigFont, useBigFont } from "@/lib/font-scale";
import { WelcomeGate as RolePicker } from "@/components/WelcomeGate";

const nurseNav = [
  { to: "/patients", label: "المرضى", en: "Patients" },
  { to: "/discharge", label: "قبل الخروج", en: "Discharge" },
  { to: "/home-care", label: "المتابعة المنزلية", en: "Home care" },
  { to: "/nurse", label: "لوحة الممرض", en: "Nurse dashboard" },
] as const;
const patientNav = [{ to: "/home-care", label: "المتابعة المنزلية", en: "Home care" }] as const;

export function Shell({ children }: { children: ReactNode }) {
  const role = useRole();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const blocked = role === "patient" && path !== "/home-care";
  useEffect(() => { if (blocked) navigate({ to: "/home-care", replace: true }); }, [blocked, navigate]);
  const nav = role === "patient" ? patientNav : nurseNav;
  const lang = useLang();
  const en = lang === "en";
  const big = useBigFont();
  useEffect(() => { document.documentElement.style.fontSize = big ? "118%" : ""; }, [big]);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = en ? "ltr" : "rtl"; }, [lang, en]);

  return (
    <div dir={en ? "ltr" : "rtl"} lang={lang} className={`min-h-screen ${en ? "font-sans-en" : ""}`}>
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to={role === "patient" ? "/home-care" : "/"} className="font-display text-2xl text-ink">
            مِداد <span className="text-sm text-muted-foreground">| MIDAD</span>
          </Link>
          <div className="flex items-center gap-2"><button onClick={() => setBigFont(!big)} aria-pressed={big} className="rounded-full border border-input px-3 py-1 text-xs font-semibold text-primary transition hover:bg-secondary">{big ? (en ? "A− Normal text" : "ع− حجم عادي") : (en ? "A+ Larger text" : "ع+ تكبير الخط")}</button>
          <button onClick={() => setLang(en ? "ar" : "en")} className="rounded-full border border-input px-3 py-1 text-xs font-semibold text-primary transition hover:bg-secondary" aria-label="Language">{en ? "العربية" : "English"}</button></div>
          {role && (
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary"
                  activeProps={{ className: "rounded-lg px-3 py-1.5 bg-secondary text-secondary-foreground font-semibold" }}>
                  {en ? n.en : n.label}
                </Link>
              ))}
              <span className="mx-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">{role === "patient" ? (en ? "🧑 Patient" : "🧑 مريض") : (en ? "🩺 Nurse" : "🩺 ممرض")}</span>
              <button
                onClick={() => { setRole(null); navigate({ to: "/" }); }}
                className="rounded-lg border border-input px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary"
              >
                {en ? "Sign out" : "خروج ⤶"}
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 animate-in fade-in duration-300">
        {role === undefined ? null : role === null ? <RolePicker /> : blocked ? null : children}
      </main>
    </div>
  );
}

