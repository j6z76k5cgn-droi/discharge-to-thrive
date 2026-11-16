import { createFileRoute } from "@tanstack/react-router";
import { HomeCarePage } from "@/components/HomeCarePage";

export const Route = createFileRoute("/home-care/help")({
  head: () => ({
    meta: [
      { title: "المساعدة والتواصل | مِداد" },
      { name: "description", content: "مرشد الخدمات والتواصل المباشر مع الممرضة المناوبة." },
      { property: "og:title", content: "المساعدة والتواصل | مِداد" },
      { property: "og:description", content: "مرشد الخدمات والتواصل المباشر مع الممرضة المناوبة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <HomeCarePage tab="help" />,
});
