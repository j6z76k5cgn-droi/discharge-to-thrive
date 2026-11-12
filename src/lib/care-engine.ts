// مِداد — محرك خطة التقليب ومتابعة الآثار الجانبية.
// ⚠️ كل المحتوى هنا مسودة تجريبية غير معتمدة سريريًا. لا يفعَّل للمرافق إلا بعد اعتماد الممرض/الفريق السريري،
// ولا يصدر النظام أي قرار علاجي (لا إيقاف دواء ولا تغيير جرعة ولا تشخيص سببية).

/* ───────────── التقليب ───────────── */
export interface PositionGuide {
  id: string;
  name: string;
  icon: string;
  steps: string[];
  safety: string[];
}

/** مكتبة وضعيات افتراضية قابلة للتعديل الكامل من الممرض لكل مريض (مسودة للمراجعة الطبية). */
export const DEFAULT_POSITIONS: PositionGuide[] = [
  { id: "SUPINE", name: "على الظهر", icon: "🛌", steps: ["اشرح للمريض ما ستفعله قبل البدء.", "ضع وسادة تحت الساقين حتى لا يلمس الكعبان الفراش.", "تأكد أن الشرشف مشدود وبلا ثنيات."], safety: ["لا تسحب المريض على القماش؛ ارفعه بشرشف السحب مع شخص آخر."] },
  { id: "RIGHT", name: "على الجانب الأيمن (إمالة خفيفة)", icon: "↪️", steps: ["اثنِ الركبة البعيدة عنك.", "أدِر المريض بلطف باستخدام شرشف السحب.", "ضع وسادة طويلة خلف الظهر ووسادة بين الركبتين."], safety: ["زاوية الإمالة يحددها الممرض — لا تُدِر المريض على جنبه بالكامل إلا بتوجيه."] },
  { id: "LEFT", name: "على الجانب الأيسر (إمالة خفيفة)", icon: "↩️", steps: ["اثنِ الركبة البعيدة عنك.", "أدِر المريض بلطف باستخدام شرشف السحب.", "ضع وسادة طويلة خلف الظهر ووسادة بين الركبتين."], safety: ["زاوية الإمالة يحددها الممرض — لا تُدِر المريض على جنبه بالكامل إلا بتوجيه."] },
  { id: "SEMI", name: "نصف جلوس", icon: "💺", steps: ["ارفع رأس السرير للدرجة التي حددها الممرض فقط.", "ضع وسادة صغيرة تحت الركبتين لمنع الانزلاق.", "أعده للوضعية السابقة بعد انتهاء الأكل أو الدواء حسب التوجيه."], safety: ["لا ترفع رأس السرير أعلى من الحد الذي كتبه الممرض."] },
];

export const SKIN_TIPS = [
  "افحص يوميًا مناطق الضغط: أسفل الظهر، الكعبين، الأكواع، الكتفين، خلف الرأس.",
  "أبقِ الجلد نظيفًا وجافًا، والشراشف بلا ثنيات أو فتات.",
  "لا تفرك المناطق الحمراء؛ أبلغ الممرض إذا بقي الاحمرار بعد تغيير الوضعية.",
];
export const STOP_SIGNS = ["ألم شديد مفاجئ أثناء التقليب", "صعوبة في التنفس", "تغيّر في الوعي أو الدوخة الشديدة", "نزيف أو انفتاح جرح"];

export interface TurnSlot { id: string; time: string; positionId: string; note?: string }
export interface TurningPlan {
  version: number;
  slots: TurnSlot[];
  positions: PositionGuide[]; // نسخة المريض القابلة للتعديل
  forbidden: string[]; // أسماء/معرفات وضعيات ممنوعة
  notes: string;
  graceMin: number; // بعده يُعتبر الموعد متأخرًا
  approved?: { by: string; at: string };
  history?: { version: number; at: string; by: string; summary: string }[];
}
export interface TurnDone { at: string; by: string }

export const emptyTurningPlan = (): TurningPlan => ({ version: 0, slots: [], positions: DEFAULT_POSITIONS.map((p) => ({ ...p, steps: [...p.steps], safety: [...p.safety] })), forbidden: [], notes: "", graceMin: 30 });

/** الخطة مفعّلة للمرافق فقط إذا اعتمدها الممرض وفيها مواعيد. */
export const isPlanActive = (p?: TurningPlan) => !!p?.approved && p.slots.length > 0;

export type SlotStatus = "DONE" | "DUE" | "OVERDUE" | "UPCOMING";
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function slotStatus(slot: TurnSlot, done: TurnDone | undefined, now: Date, graceMin: number): SlotStatus {
  if (done) return "DONE";
  const diff = now.getHours() * 60 + now.getMinutes() - toMin(slot.time);
  if (diff < -15) return "UPCOMING";
  if (diff <= graceMin) return "DUE";
  return "OVERDUE";
}

export function turnSummary(plan: TurningPlan | undefined, log: Record<string, TurnDone> | undefined, now: Date) {
  if (!isPlanActive(plan)) return { total: 0, done: 0, overdue: 0, due: 0 };
  const dk = dayKey(now);
  let done = 0, overdue = 0, due = 0;
  for (const s of plan!.slots) {
    const st = slotStatus(s, log?.[`${dk}|${s.id}`], now, plan!.graceMin);
    if (st === "DONE") done++; else if (st === "OVERDUE") overdue++; else if (st === "DUE") due++;
  }
  return { total: plan!.slots.length, done, overdue, due };
}

/* ───────────── الآثار الجانبية ───────────── */
export type SeTier = "LOG" | "REVIEW" | "EMERGENCY";
export type SeSeverity = "خفيف" | "متوسط" | "شديد";
export const SE_SYMPTOMS = ["غثيان", "قيء", "دوخة", "صداع", "طفح جلدي", "إسهال", "حكة", "نعاس", "ألم في المعدة"];
/** علامات خطر افتراضية (حساسية شديدة) — توجيه فوري للإسعاف دون انتظار الممرض. */
export const DEFAULT_SE_RED_FLAGS = ["صعوبة في التنفس", "تورم الشفاه أو اللسان أو الحلق", "صعوبة في البلع", "طفح جلدي سريع الانتشار", "إغماء أو دوار شديد"];
export const SFDA_URL = "https://ade.sfda.gov.sa/";

export interface SideEffectReport {
  id: string; patientId: string; medId: string; medName: string;
  symptom: string; doseAt: string; onsetAt: string; severity: SeSeverity; repeated: boolean; note: string;
  at: string; by: string; tier: SeTier;
  status: "NEW" | "REVIEW" | "DONE";
  actions?: { at: string; by: string; text: string }[] | undefined;
}

/** تصنيف قابل للتخصيص: redFlags من خطة المريض تُضاف إلى الافتراضية. لا يحكم على سببية الدواء. */
export function classifySideEffect(input: { symptom: string; severity: SeSeverity; repeated: boolean }, extraRedFlags: string[] = []): SeTier {
  const flags = [...DEFAULT_SE_RED_FLAGS, ...extraRedFlags];
  if (flags.includes(input.symptom)) return "EMERGENCY";
  if (input.severity === "شديد" || input.severity === "متوسط" || input.repeated) return "REVIEW";
  return "LOG";
}

export const SE_TIER_UI: Record<SeTier, { label: string; cls: string; msg: string }> = {
  LOG: { label: "🟢 مسجّل للمتابعة", cls: "border-primary/40 bg-primary/5", msg: "تم تسجيل العرض، وسيطّلع عليه الممرض في المراجعة. لا توقف الدواء أو تغيّر الجرعة دون الرجوع للفريق الصحي." },
  REVIEW: { label: "🟠 يحتاج مراجعة الفريق الصحي", cls: "border-amber-500/60 bg-amber-500/10", msg: "تم إرسال البلاغ للممرض لمراجعته والتواصل معك. لا توقف الدواء أو تغيّر الجرعة من نفسك." },
  EMERGENCY: { label: "🚨 علامة خطر — اطلب الإسعاف الآن", cls: "border-destructive bg-destructive/10", msg: "اتصل بالإسعاف 997 أو توجّه لأقرب طوارئ فورًا، ولا تنتظر رد الممرض. تم إشعار الكادر التمريضي أيضًا." },
};
