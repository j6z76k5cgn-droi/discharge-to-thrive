export type Status = "stable" | "follow" | "urgent";

export interface DayLog {
  day: number;
  medsTaken: number;
  medsTotal: number;
  medTimes: string[];
  missedReason?: string;
  pain: number;
  painSite: string;
  temp: number;
  symptoms: string[];
  notes: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  category: string;
  diagnosis: string;
  dischargeDate: string;
  phone: string;
  logs: DayLog[];
}

export const patients: Patient[] = [
  {
    id: "saleh",
    name: "صالح العتيبي",
    age: 64,
    category: "جراحة سابقة",
    diagnosis: "استئصال المرارة بالمنظار",
    dischargeDate: "2026-09-26",
    phone: "0500000001",
    logs: [
      { day: 1, medsTaken: 4, medsTotal: 4, medTimes: ["08:00", "14:00", "20:00", "23:00"], pain: 5, painSite: "البطن - موضع الجرح", temp: 37.2, symptoms: [], notes: "ألم متوسط عند الحركة." },
      { day: 2, medsTaken: 4, medsTotal: 4, medTimes: ["08:10", "14:05", "20:00", "23:10"], pain: 4, painSite: "البطن - موضع الجرح", temp: 37.0, symptoms: [], notes: "تحسن بسيط، نوم أفضل." },
      { day: 3, medsTaken: 3, medsTotal: 4, medTimes: ["08:30", "14:00", "21:00"], missedReason: "نسيت جرعة الليل", pain: 6, painSite: "البطن - موضع الجرح", temp: 37.9, symptoms: ["تورم الجرح"], notes: "(صوتي) الجرح محمر قليلاً ويؤلمني." },
      { day: 4, medsTaken: 2, medsTotal: 4, medTimes: ["09:00", "15:30"], missedReason: "غثيان", pain: 7, painSite: "البطن - موضع الجرح", temp: 38.4, symptoms: ["حرارة", "غثيان", "تورم الجرح"], notes: "(صوتي) أحس بسخونة والجرح منتفخ." },
    ],
  },
  {
    id: "noura",
    name: "نورة الشمري",
    age: 58,
    category: "رعاية باطنية",
    diagnosis: "التهاب رئوي - بعد العلاج الوريدي",
    dischargeDate: "2026-09-27",
    phone: "0500000002",
    logs: [
      { day: 1, medsTaken: 3, medsTotal: 3, medTimes: ["07:00", "15:00", "23:00"], pain: 3, painSite: "الصدر", temp: 37.4, symptoms: ["ضيق تنفس خفيف"], notes: "كحة متقطعة." },
      { day: 2, medsTaken: 3, medsTotal: 3, medTimes: ["07:05", "15:00", "23:00"], pain: 3, painSite: "الصدر", temp: 37.3, symptoms: ["ضيق تنفس خفيف"], notes: "" },
      { day: 3, medsTaken: 2, medsTotal: 3, medTimes: ["07:00", "15:20"], missedReason: "نمت مبكراً", pain: 4, painSite: "الصدر", temp: 37.5, symptoms: ["ضيق تنفس خفيف"], notes: "(نصي) تعب عام." },
    ],
  },
  {
    id: "fahad",
    name: "فهد القحطاني",
    age: 47,
    category: "عظام",
    diagnosis: "تثبيت كسر الساق",
    dischargeDate: "2026-09-25",
    phone: "0500000003",
    logs: [
      { day: 1, medsTaken: 3, medsTotal: 3, medTimes: ["08:00", "16:00", "00:00"], pain: 6, painSite: "الساق اليمنى", temp: 37.0, symptoms: [], notes: "" },
      { day: 2, medsTaken: 3, medsTotal: 3, medTimes: ["08:00", "16:00", "00:00"], pain: 5, painSite: "الساق اليمنى", temp: 36.9, symptoms: [], notes: "" },
      { day: 3, medsTaken: 3, medsTotal: 3, medTimes: ["08:00", "16:00", "00:00"], pain: 4, painSite: "الساق اليمنى", temp: 36.8, symptoms: [], notes: "بدأت المشي بالعكاز." },
      { day: 4, medsTaken: 3, medsTotal: 3, medTimes: ["08:00", "16:00", "00:00"], pain: 3, painSite: "الساق اليمنى", temp: 36.8, symptoms: [], notes: "" },
      { day: 5, medsTaken: 3, medsTotal: 3, medTimes: ["08:00", "16:00", "00:00"], pain: 2, painSite: "الساق اليمنى", temp: 36.7, symptoms: [], notes: "تحسن واضح." },
    ],
  },
];

export interface Alert { level: Status; text: string }

/** Trend analysis engine: compares latest day with previous days. */
export function analyze(p: Patient) {
  const logs = p.logs;
  const last = logs[logs.length - 1]!;
  const prev = logs[logs.length - 2];
  const alerts: Alert[] = [];
  const insights: string[] = [];

  let rising = 0;
  for (let i = logs.length - 1; i > 0 && logs[i]!.pain > logs[i - 1]!.pain; i--) rising++;
  if (rising >= 2) alerts.push({ level: "urgent", text: `ارتفاع الألم لـ ${rising} أيام متتالية (آخر قراءة ${last.pain}/10)` });

  const missedDays = logs.slice(-2).filter((l) => l.medsTaken < l.medsTotal).length;
  if (missedDays >= 2) alerts.push({ level: "urgent", text: "تفويت جرعات دوائية ليومين متتاليين" });
  else if (last.medsTaken < last.medsTotal) alerts.push({ level: "follow", text: `تفويت ${last.medsTotal - last.medsTaken} جرعة اليوم: ${last.missedReason ?? "بدون سبب"}` });

  if (last.temp >= 38) alerts.push({ level: "urgent", text: `حرارة مرتفعة ${last.temp}°م` });
  if (last.symptoms.includes("تورم الجرح")) alerts.push({ level: "follow", text: "علامات تورم في الجرح - احتمال التهاب" });
  if (last.symptoms.some((s) => s.includes("ضيق"))) alerts.push({ level: "follow", text: "ضيق تنفس مستمر" });

  if (prev) {
    const d = last.pain - prev.pain;
    insights.push(d > 0 ? `الألم ارتفع بمقدار ${d} درجة مقارنة بالأمس.` : d < 0 ? `الألم انخفض بمقدار ${-d} درجة مقارنة بالأمس — مؤشر تعافٍ.` : "مستوى الألم ثابت مقارنة بالأمس.");
  }
  const adherence = Math.round((logs.reduce((a, l) => a + l.medsTaken, 0) / logs.reduce((a, l) => a + l.medsTotal, 0)) * 100);
  insights.push(`نسبة الالتزام الدوائي الإجمالية ${adherence}%.`);

  const status: Status = alerts.some((a) => a.level === "urgent") ? "urgent" : alerts.length ? "follow" : "stable";
  const recommendation =
    status === "urgent" ? "يوصى بالاتصال المباشر بالمريض فوراً وطلب مراجعة المستشفى/الطوارئ."
    : status === "follow" ? "يوصى بمكالمة متابعة خلال 24 ساعة وتعزيز التثقيف الدوائي."
    : "منحنى التعافي إيجابي — الاستمرار على الخطة الحالية.";
  return { alerts, insights, status, adherence, recommendation };
}

export const statusMeta: Record<Status, { label: string; cls: string }> = {
  stable: { label: "مستقر", cls: "bg-success text-success-foreground" },
  follow: { label: "يحتاج متابعة", cls: "bg-warning text-warning-foreground" },
  urgent: { label: "تنبيه عاجل", cls: "bg-destructive text-destructive-foreground" },
};
