// Deterministic risk engine (S 35%, I 30%, M 20%, P 15%) + critical override. No AI generation.
export type RiskLevel = "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export const riskLevelMeta: Record<RiskLevel, { label: string; cls: string }> = {
  VERY_LOW: { label: "مستقر جداً", cls: "bg-success text-success-foreground" },
  LOW: { label: "خطورة منخفضة", cls: "bg-success/70 text-success-foreground" },
  MODERATE: { label: "خطورة متوسطة", cls: "bg-warning text-warning-foreground" },
  HIGH: { label: "خطورة مرتفعة", cls: "bg-warning text-warning-foreground ring-2 ring-destructive" },
  VERY_HIGH: { label: "خطورة مرتفعة جداً", cls: "bg-destructive text-destructive-foreground" },
};

export const CRITICAL_SYMPTOMS = ["ضيق التنفس", "زرقة الشفاه/الأطراف", "ألم صدر حاد", "انخفاض أكسجين الدم"];

export interface RiskInput {
  symptoms: { name: string; severity?: number | undefined }[];
  temp?: number | undefined;
  adherencePct: number; // 0-100
  pain: number; // 0-10
  severeSideEffect?: string | undefined;
}

export function symptomScore(s: RiskInput["symptoms"]) {
  return Math.min(100, s.reduce((a, x) => a + 20 + (x.severity ?? 3) * 2, 0));
}
export function indicatorScore(temp?: number) {
  if (temp == null) return 10;
  return temp < 37.5 ? 10 : temp < 38 ? 40 : temp < 38.5 ? 70 : 90;
}
export function levelOf(score: number): RiskLevel {
  return score <= 20 ? "VERY_LOW" : score <= 40 ? "LOW" : score <= 60 ? "MODERATE" : score <= 80 ? "HIGH" : "VERY_HIGH";
}

export function evaluatePatientStatus(input: RiskInput) {
  const reasons: string[] = [];
  for (const s of input.symptoms) if (CRITICAL_SYMPTOMS.includes(s.name)) reasons.push(s.name);
  if (input.temp != null && input.temp >= 39) reasons.push(`حرارة ${input.temp}°م`);
  if (input.severeSideEffect) reasons.push(`امتناع عن الجرعة بسبب أعراض جانبية حادة: ${input.severeSideEffect}`);

  const S = symptomScore(input.symptoms);
  const I = indicatorScore(input.temp);
  const M = 100 - input.adherencePct;
  const P = input.pain * 10;
  const score = Math.round(S * 0.35 + I * 0.3 + M * 0.2 + P * 0.15);
  return {
    critical: reasons.length > 0,
    reasons,
    score,
    level: levelOf(score),
    factors: { S, I, M, P },
  };
}
