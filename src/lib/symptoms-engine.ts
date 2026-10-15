// Rule-based symptom advice. Thresholds/rules are DRAFT and must be reviewed by clinicians before clinical use.
// No diagnosis, no medication start/stop/dose change advice.
export type Tier = "HOME" | "URGENT" | "EMERGENCY";

export const tierMeta: Record<Tier, { label: string; cls: string; icon: string }> = {
  HOME: { label: "إرشادات منزلية", cls: "bg-success text-success-foreground", icon: "🟢" },
  URGENT: { label: "تواصل عاجل مع الفريق الصحي", cls: "bg-warning text-warning-foreground", icon: "🟠" },
  EMERGENCY: { label: "حالة طارئة", cls: "bg-destructive text-destructive-foreground", icon: "🚨" },
};

export interface SymptomRule { tier: Tier; critical: boolean; now: string[]; avoid: string[]; when: string }

export const SYMPTOM_RULES: Record<string, SymptomRule> = {
  "حرارة": { tier: "URGENT", critical: false,
    now: ["قِس حرارتك وسجّل القراءة.", "اشرب سوائل كافية وارتدِ ملابس خفيفة.", "استرح في مكان معتدل الحرارة."],
    avoid: ["تجنب التغطية الثقيلة.", "لا تبدأ أو تغيّر أي دواء دون استشارة الطبيب."],
    when: "تواصل مع الفريق الصحي اليوم، واطلب الإسعاف 997 إذا صاحبتها رعشة شديدة أو تشوش أو صعوبة تنفس." },
  "غثيان": { tier: "HOME", critical: false,
    now: ["اشرب رشفات صغيرة من الماء بشكل متكرر.", "تناول وجبات خفيفة وصغيرة.", "اجلس بوضعية مستقيمة بعد الأكل."],
    avoid: ["تجنب الأطعمة الدسمة والحارة.", "لا توقف أدويتك من نفسك."],
    when: "تواصل مع الفريق الصحي إذا تكرر القيء أو لم تستطع شرب السوائل أو أخذ أدويتك." },
  "ضيق التنفس": { tier: "EMERGENCY", critical: true,
    now: ["اتصل بالإسعاف 997 الآن.", "اجلس بوضعية مستقيمة وحاول التنفس بهدوء.", "اطلب من أحد البقاء بجانبك."],
    avoid: ["لا تبذل أي مجهود.", "لا تقُد السيارة بنفسك إلى المستشفى."],
    when: "حالة طارئة: اطلب الإسعاف 997 فورًا." },
  "تورم الجرح": { tier: "URGENT", critical: false,
    now: ["حافظ على الجرح نظيفًا وجافًا.", "لاحظ وجود احمرار أو حرارة أو إفرازات وسجّلها."],
    avoid: ["لا تضغط على الجرح ولا تحاول تصريفه.", "لا تضع مواد غير موصوفة عليه."],
    when: "تواصل مع الفريق الصحي اليوم، واطلب الإسعاف 997 إذا صاحبه نزيف لا يتوقف." },
  "دوخة": { tier: "HOME", critical: false,
    now: ["اجلس أو استلقِ فورًا حتى تزول.", "اشرب الماء.", "انهض ببطء على مراحل."],
    avoid: ["تجنب الوقوف المفاجئ وصعود الدرج وحدك.", "لا تقُد السيارة."],
    when: "تواصل مع الفريق الصحي إذا تكررت أو أدت للسقوط، واطلب الإسعاف 997 عند الإغماء." },
  "زرقة الشفاه/الأطراف": { tier: "EMERGENCY", critical: true,
    now: ["اتصل بالإسعاف 997 الآن.", "اجلس بوضعية مستقيمة.", "اطلب من أحد البقاء بجانبك."],
    avoid: ["لا تنتظر لترى إن كانت ستتحسن.", "لا تبذل أي مجهود."],
    when: "حالة طارئة: اطلب الإسعاف 997 فورًا." },
  "ألم صدر حاد": { tier: "EMERGENCY", critical: true,
    now: ["اتصل بالإسعاف 997 الآن.", "توقف عن أي نشاط واجلس.", "افتح الباب واطلب من أحد البقاء معك."],
    avoid: ["لا تقُد السيارة بنفسك.", "لا تتناول أي دواء غير موصوف لهذه الحالة."],
    when: "حالة طارئة: اطلب الإسعاف 997 فورًا." },
  "انخفاض أكسجين الدم": { tier: "EMERGENCY", critical: true,
    now: ["اتصل بالإسعاف 997 الآن.", "اجلس بوضعية مستقيمة.", "إذا كان لديك أكسجين موصوف فاستخدمه حسب تعليمات طبيبك."],
    avoid: ["لا تبذل أي مجهود.", "لا تنتظر إعادة القياس لاحقًا."],
    when: "حالة طارئة: اطلب الإسعاف 997 فورًا." },
};

const CUSTOM: SymptomRule = { tier: "HOME", critical: false,
  now: ["استرح وراقب العرض وسجّل أي تغير."], avoid: ["لا تبدأ أو توقف أي دواء دون استشارة الطبيب."],
  when: "تواصل مع الفريق الصحي إذا ازداد العرض أو استمر." };

const rank: Record<Tier, number> = { HOME: 0, URGENT: 1, EMERGENCY: 2 };

/** Critical override rules win over the aggregate score. */
export function classifySymptoms(symptoms: { name: string; sev?: number | undefined }[], riskScore: number) {
  const items = symptoms.map((s) => {
    let r = SYMPTOM_RULES[s.name] ?? CUSTOM;
    if (!SYMPTOM_RULES[s.name] && (s.sev ?? 0) >= 7) r = { ...r, tier: "URGENT", when: "شدة مرتفعة: تواصل مع الفريق الصحي اليوم." };
    return { name: s.name, ...r };
  });
  const critical = items.some((i) => i.critical);
  let tier: Tier = items.reduce<Tier>((t, i) => (rank[i.tier] > rank[t] ? i.tier : t), "HOME");
  if (critical) tier = "EMERGENCY";
  else if (riskScore > 60 && tier === "HOME") tier = "URGENT";
  return { tier, critical, items };
}
