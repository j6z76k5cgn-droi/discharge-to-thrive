import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مِداد | تعافٍ آمن" },
      { name: "description", content: "متابعة ذكية للمريض مع لوحة تحكم التمريض والتنبيهات الذكية." },
      { property: "og:title", content: "مِداد | تعافٍ آمن" },
      { property: "og:description", content: "متابعة ذكية للمريض مع لوحة تحكم التمريض والتنبيهات الذكية." },
    ],
  }),
  component: Index,
});

const cards = [
  { to: "/nurse", n: "١", t: "لوحة تحكم الممرض", d: "قائمة المرضى، السجل اليومي، وتحليلات وتنبيهات ذكية." },
] as const;

function Index() {
  return (
    <Shell>
      <section className="bg-ink-gradient rounded-2xl p-8 text-primary-foreground md:p-12">
        <p className="text-sm opacity-80">Smart Care → Home</p>
        <h1 className="font-display mt-2 text-4xl md:text-5xl">مِداد ← تعافٍ آمن</h1>
        <p className="mt-4 max-w-xl opacity-90">نظام صحي ذكي لمتابعة المرضى وتنبيهات الذكاء الاصطناعي للتمريض.</p>
      </section>
      <div className="mt-6 grid gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card-surface p-6 transition hover:-translate-y-1 md:max-w-md">
            <span className="font-display text-3xl text-primary">{c.n}</span>
            <h2 className="mt-2 text-lg font-bold">{c.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
