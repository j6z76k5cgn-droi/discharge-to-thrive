import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/discharge", label: "قبل الخروج" },
  { to: "/home-care", label: "المتابعة المنزلية" },
  { to: "/nurse", label: "لوحة الممرض" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="font-display text-2xl text-ink">
            مِداد <span className="text-sm text-muted-foreground">| MIDAD</span>
          </Link>
          <nav className="flex gap-1 text-sm">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary"
                activeProps={{ className: "rounded-lg px-3 py-1.5 bg-secondary text-secondary-foreground font-semibold" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
