export type VLevel = "normal" | "warn" | "danger";
export const glucoseContexts = ["صائم", "بعد الأكل بساعتين", "قبل النوم", "عشوائي"] as const;
export const vLevelMeta: Record<VLevel, { label: string; cls: string }> = {
  normal: { label: "طبيعي", cls: "bg-success text-success-foreground" },
  warn: { label: "متوسط — يحتاج متابعة", cls: "bg-warning text-warning-foreground" },
  danger: { label: "غير طبيعي — خطر", cls: "bg-destructive text-destructive-foreground" },
};
export interface VResult { level: VLevel; label: string; title: string; advice: string[] }

export function classifyGlucose(context: string, v: number): VResult {
  const fasting = context === "صائم";
  let level: VLevel = "normal", dir: "low" | "high" | null = null;
  if (v < 60) { level = "danger"; dir = "low"; }
  else if (v < 70) { level = "warn"; dir = "low"; }
  else if (fasting ? v > 180 : v > 300) { level = "danger"; dir = "high"; }
  else if (fasting ? v > 130 : v > 180) { level = "warn"; dir = "high"; }
  const label = `سكر ${v} mg/dL (${context})`;
  if (dir === "low") return { level, label, title: "⚠️ تنبيه: مستوى السكر منخفض", advice: [
    "تناول نصف كوب عصير فاكهة (120 مل) أو 3-4 ملاعق صغيرة من السكر مذابة في ماء.",
    "استرح لمدة 15 دقيقة ثم أعد قياس مستوى السكر.",
    "إذا كنت تشعر بدوخة شديدة، زغللة في العينين، أو تعرق شديد مع عدم القدرة على البلع، لا تتناول أي شيء عن طريق الفم واطلب المساعدة فورًا أو اضغط زر الاستغاثة لإبلاغ الكادر الصحي أو الطوارئ.",
  ] };
  if (dir === "high") return { level, label, title: "⚠️ تنبيه: مستوى السكر مرتفع لديك", advice: [
    "اشرب كمية كافية من الماء لتسهيل خروج السكر الزائد عن طريق الكلى ومنع الجفاف.",
    "تأكد من تناول جرعة الإنسولين أو أدوية السكري المحددة لك وفق خطتك العلاجية (دون زيادة الجرعة من تلقاء نفسك).",
    "إذا كان الارتفاع مصحوبًا بقيء متكرر، ألم حاد في البطن، صعوبة في التنفس، أو رائحة شبيهة بالفواكه في الفم، تواصل مع الكادر الصحي فورًا أو توجه للطوارئ.",
  ] };
  return { level, label, title: "✅ مستوى السكر ضمن النطاق الطبيعي", advice: ["استمر على خطتك العلاجية ونظامك الغذائي."] };
}

export function classifyBP(sys: number, dia: number): VResult {
  const label = `ضغط ${sys}/${dia} mmHg`;
  if (sys < 90 || dia < 60) return { level: sys < 80 || dia < 50 ? "danger" : "warn", label, title: "⚠️ تنبيه: مستوى ضغط الدم منخفض", advice: [
    "اجلس أو استلقِ على ظهرك فورًا وارفع قدميك قليلاً فوق مستوى القلب.",
    "إذا كان الانخفاض حادًا (أقل من 90/60) أو مصحوبًا بدوخة شديدة، إغماء أو وشك إغماء، برودة ورطوبة في الجلد، أو تشوش في الذهن، اطلب المساعدة الطبية العاجلة فورًا.",
  ] };
  const danger = sys >= 180 || dia >= 110;
  if (danger || sys >= 130 || dia >= 85) return { level: danger ? "danger" : "warn", label, title: "⚠️ تنبيه: مستوى ضغط الدم مرتفع", advice: [
    "تأكد من تناول أدوية الضغط المحددة لك من طبيبك في مواعيدها (دون زيادة الجرعة من تلقاء نفسك).",
    "تجنب الأطعمة المالحة، والمشروبات التي تحتوي على الكافيين (القهوة والشاي)، والتدخين.",
    "إذا كان الارتفاع شديدًا (180/110 فأعلى) أو مصحوبًا بصداع حاد جدًا، ألم في الصدر، ضيق في التنفس، زغللة في العيون، أو ضعف في الأطراف، توجه لغرفة الطوارئ فورًا أو تواصل مع الكادر الصحي.",
  ] };
  return { level: "normal", label, title: "✅ ضغط الدم ضمن النطاق الطبيعي", advice: ["استمر على خطتك العلاجية."] };
}
