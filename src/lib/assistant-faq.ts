/** ردود إرشادية عامة للأسئلة الشائعة بعد الخروج — بيانات تجريبية تحتاج اعتماد الفريق الصحي.
 * لا تشخيص ولا تعديل علاج. أي سؤال غير مطابق يُحال للممرض المناوب. */
import { normalize } from "./services-guide";
export interface Faq { id: string; keywords: string[]; answer: string; answerEn: string }
export const FAQ: Faq[] = [
  { id: "dose", keywords: ["نسيت الجرعه", "نسيت الدواء", "فاتتني", "missed dose", "forgot"],
    answer: "لا تضاعف الجرعة. سجّل «لم آخذه» في خطة اليوم، والممرض سيتواصل معك لتوضيح ما تفعله.",
    answerEn: "Do not double the dose. Mark it as not taken in Today's plan; your nurse will advise you." },
  { id: "wound", keywords: ["الجرح", "الغرز", "ضماد", "wound", "dressing"],
    answer: "حافظ على الجرح نظيفًا وجافًا واتبع تعليمات الضماد في خطة خروجك. إذا ظهر احمرار أو صديد أو حرارة فسجّلها في «صحتي».",
    answerEn: "Keep the wound clean and dry and follow your discharge dressing instructions. Report redness, pus or fever in “My health”." },
  { id: "turn", keywords: ["تقليب", "وضعيه", "قرح", "turning", "position"],
    answer: "اتبع جدول التقليب الذي اعتمده الممرض في «خطة اليوم»، وسجّل كل تقليب بعد تنفيذه.",
    answerEn: "Follow the nurse-approved turning schedule in Today's plan and tick each turn once done." },
  { id: "pain", keywords: ["الم", "يوجعني", "pain", "hurts"],
    answer: "سجّل مكان الألم وشدته في «صحتي». لا تأخذ مسكنًا غير موصوف لك. الألم الشديد أو المفاجئ يستدعي التواصل فورًا.",
    answerEn: "Record the pain location and level in “My health”. Take only prescribed painkillers; severe or sudden pain needs urgent contact." },
  { id: "food", keywords: ["اكل", "اكل", "غذاء", "اشرب", "food", "eat", "diet"],
    answer: "اتبع تعليمات الأكل المذكورة في خطة خروجك. إن لم توجد تعليمات خاصة، اسأل الممرض عن ما يناسب حالتك.",
    answerEn: "Follow the diet instructions in your discharge plan; if none, ask your nurse what suits you." },
  { id: "appt", keywords: ["موعد", "مراجعه", "appointment"],
    answer: "موعد المراجعة مسجّل في ملفك لدى الفريق الصحي، ويمكنك الحجز أو التأكد عبر تطبيق صحتي.",
    answerEn: "Your follow-up appointment is in your file with the care team; you can book or confirm via Sehhaty." },
];
export const EMERGENCY_WORDS = ["ضيق تنفس", "الم صدر", "نزيف", "اغماء", "فقدان الوعي", "chest pain", "bleeding", "can't breathe", "faint"];
export type Reply = { kind: "emergency" } | { kind: "faq"; faq: Faq } | { kind: "escalate" };
/** يحدد نوع الرد: طوارئ أولًا، ثم سؤال شائع، وإلا تحويل للممرض المناوب. */
export function replyFor(q: string): Reply {
  const n = normalize(q);
  if (EMERGENCY_WORDS.some((w) => n.includes(normalize(w)))) return { kind: "emergency" };
  const f = FAQ.find((x) => x.keywords.some((k) => n.includes(normalize(k))));
  return f ? { kind: "faq", faq: f } : { kind: "escalate" };
}
