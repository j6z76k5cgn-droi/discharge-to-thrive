/** دليل خدمات ما بعد الخروج — بيانات استرشادية تجريبية تحتاج مراجعة وتحديثًا من الجهة الصحية.
 * المرشد يطابق سؤال الأسرة بكلمات مفتاحية فقط؛ لا يشخّص ولا يخترع خدمات. */
export interface Service {
  id: string; icon: string; title: string; titleEn: string;
  keywords: string[]; where: string; whereEn: string; steps: string[]; stepsEn: string[]; contact: string;
}
export const SERVICES: Service[] = [
  { id: "physio", icon: "🦵", title: "علاج طبيعي وتأهيل", titleEn: "Physiotherapy & rehabilitation",
    keywords: ["علاج طبيعي", "تأهيل", "جلطة", "مشي", "حركة", "physio", "rehab", "stroke"],
    where: "عيادة العلاج الطبيعي في المستشفى المحيل أو مركز تأهيل طبي", whereEn: "Physiotherapy clinic at the referring hospital or a rehabilitation center",
    steps: ["اطلب من الممرض/الطبيب خطاب إحالة للعلاج الطبيعي", "احجز موعدًا عبر تطبيق صحتي أو المستشفى", "أحضر تقرير الخروج والهوية"],
    stepsEn: ["Ask the nurse/doctor for a physiotherapy referral", "Book via the Sehhaty app or the hospital", "Bring the discharge summary and ID"], contact: "937" },
  { id: "homecare", icon: "🏠", title: "الرعاية الصحية المنزلية", titleEn: "Home health care",
    keywords: ["رعاية منزلية", "منزل", "زيارة", "طريح", "home care", "visit", "bedbound"],
    where: "برنامج الرعاية الصحية المنزلية التابع للمستشفى أو التجمع الصحي", whereEn: "Hospital / health cluster home-care program",
    steps: ["يقيّم الفريق الصحي أهلية المريض قبل الخروج", "تُرفع الإحالة لبرنامج الرعاية المنزلية", "يتواصل البرنامج مع الأسرة لتحديد الزيارة"],
    stepsEn: ["The care team assesses eligibility before discharge", "A referral is sent to the home-care program", "The program contacts the family to schedule a visit"], contact: "937" },
  { id: "assess", icon: "🩺", title: "تقييم ومتابعة الحالة", titleEn: "Condition assessment & follow-up",
    keywords: ["تقييم", "مراجعة", "متابعة", "طبيب", "موعد", "assess", "follow", "doctor"],
    where: "المركز الصحي الأولي أو عيادة المتابعة المحددة في خطة الخروج", whereEn: "Primary health center or the follow-up clinic in the discharge plan",
    steps: ["راجع موعد المتابعة في ملف المريض", "احجز عبر صحتي إن لم يكن هناك موعد", "للأعراض الخطيرة اتصل 997 فورًا"],
    stepsEn: ["Check the follow-up date in the patient file", "Book via Sehhaty if none exists", "For serious symptoms call 997 immediately"], contact: "937" },
  { id: "equipment", icon: "♿", title: "أجهزة ومستلزمات طبية", titleEn: "Medical equipment & supplies",
    keywords: ["سرير", "كرسي", "أكسجين", "جهاز", "مستلزمات", "bed", "wheelchair", "oxygen", "equipment"],
    where: "قسم الرعاية المنزلية أو التأهيل في المستشفى المحيل", whereEn: "Home-care or rehabilitation department of the referring hospital",
    steps: ["اطلب من الفريق الصحي تحديد الجهاز المطلوب كتابيًا", "قدّم الطلب للقسم المختص", "تعلّم الاستخدام الآمن قبل الاستلام"],
    stepsEn: ["Ask the care team to specify the device in writing", "Submit the request to the department", "Learn safe use before receiving it"], contact: "937" },
];
export const normalize = (s: string) => s.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").trim();
/** يطابق السؤال بالكلمات المفتاحية؛ يعيد [] إذا لم يتطابق شيء (لا تخمين). */
export function matchServices(q: string): Service[] {
  const n = normalize(q);
  if (!n) return [];
  return SERVICES.filter((s) => s.keywords.some((k) => n.includes(normalize(k))));
}
