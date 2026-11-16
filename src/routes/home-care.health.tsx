import { createFileRoute } from "@tanstack/react-router";
import { HomeCarePage } from "@/components/HomeCarePage";

export const Route = createFileRoute("/home-care/health")({
  head: () => ({
    meta: [
      { title: "صحتي | مِداد" },
      { name: "description", content: "تسجيل القياسات والألم والأعراض اليومية بعد الخروج." },
      { property: "og:title", content: "صحتي | مِداد" },
      { property: "og:description", content: "تسجيل القياسات والألم والأعراض اليومية بعد الخروج." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <HomeCarePage tab="health" />,
});
