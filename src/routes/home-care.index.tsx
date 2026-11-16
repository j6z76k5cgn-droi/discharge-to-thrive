import { createFileRoute } from "@tanstack/react-router";
import { HomeCarePage } from "@/components/HomeCarePage";

export const Route = createFileRoute("/home-care/")({
  head: () => ({
    meta: [
      { title: "خطة اليوم | مِداد" },
      { name: "description", content: "أدوية اليوم وجدول التقليب وخيارات التيسير للمريض والمرافق." },
      { property: "og:title", content: "خطة اليوم | مِداد" },
      { property: "og:description", content: "أدوية اليوم وجدول التقليب وخيارات التيسير للمريض والمرافق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <HomeCarePage tab="today" />,
});
