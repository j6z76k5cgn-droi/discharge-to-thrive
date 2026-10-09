import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { setRole, useRole } from "@/lib/role-store";

const nurseNav = [
  { to: "/patients", label: "المرضى" },
  { to: "/discharge", label: "قبل الخروج" },
  { to: "/home-care", label: "المتابعة المنزلية" },
  { to: "/nurse", label: "لوحة الممرض" },
] as const;
const patientNav = [{ to: "/home-care", label: "المتابعة المنزلية" }] as const;

export function Shell({ children }: { children: ReactNode }) {
  const role = useRole();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const blocked = role === "patient" && path !== "/home-care";
  useEffect(() => { if (blocked) navigate({ to: "/home-care", replace: true }); }, [blocked, navigate]);
  const nav = role === "patient" ? patientNav : nurseNav;

  return (
    <div dir="rtl" className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to={role === "patient" ? "/home-care" : "/"} className="font-display text-2xl text-ink">
            مِداد <span className="text-sm text-muted-foreground">| MIDAD</span>
          </Link>
          {role && (
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary"
                  activeProps={{ className: "rounded-lg px-3 py-1.5 bg-secondary text-secondary-foreground font-semibold" }}>
                  {n.label}
                </Link>
              ))}
              <span className="mx-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">{role === "patient" ? "🧑 مريض" : "🩺 ممرض"}</span>
              <button
                onClick={() => { setRole(null); navigate({ to: "/" }); }}
                className="rounded-lg border border-input px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary"
              >
                خروج ⤶
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {role === undefined ? null : role === null ? <RolePicker /> : blocked ? null : children}
      </main>
    </div>
  );
}

function RolePicker() {
  const navigate = useNavigate();
  const pick = (r: "patient" | "nurse") => { setRole(r); if (r === "patient") navigate({ to: "/home-care" }); };
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <h1 className="font-display text-3xl text-ink">مرحبًا بك في مِداد</h1>
      <p className="mt-2 text-muted-foreground">اختر طريقة الدخول</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button onClick={() => pick("patient")} className="card-surface p-6 text-lg font-bold transition hover:-translate-y-1">🧑 أنا مريض</button>
        <button onClick={() => pick("nurse")} className="card-surface p-6 text-lg font-bold transition hover:-translate-y-1">🩺 أنا ممرض / كادر صحي</button>
      </div>
    </div>
  );
}
