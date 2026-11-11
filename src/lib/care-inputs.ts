import type { HomeData } from "./patient-store";

/** Keep spaces, punctuation and line breaks exactly as the nurse entered them. */
export const forbiddenFromText = (text: string): string[] => text ? [text] : [];

/** Only a patient-recorded missed dose with this reason opens a side-effect report. */
export const shouldShowSideEffectForm = (dose: HomeData["doses"][string] | undefined, readOnly: boolean) =>
  !readOnly && dose?.status === "MISSED" && dose.reason === "ظهرت أعراض جانبية";