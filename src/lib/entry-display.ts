import { CEREAL_TYPE_LABELS } from "./cereal-types";
import type { SerializedEntry } from "./validations";

export function getCerealLabel(entry: SerializedEntry): string | null {
  if (entry.kind !== "BIG_BAG" || !entry.cerealType) return null;
  if (entry.cerealType === "AUTRE") {
    return entry.cerealTypeOther ?? "Autre";
  }
  return CEREAL_TYPE_LABELS[entry.cerealType as keyof typeof CEREAL_TYPE_LABELS] ?? null;
}

export function formatEntryQuickSummary(entry: SerializedEntry): string {
  if (entry.kind === "OTHER") {
    return entry.description?.trim() || "Autre objet";
  }

  const parts: string[] = [];
  const cereal = getCerealLabel(entry);
  if (cereal) parts.push(cereal);
  if (entry.year) parts.push(String(entry.year));
  if (entry.weight) parts.push(`${entry.weight} kg`);
  if (entry.humidity != null) parts.push(`${entry.humidity} % H₂O`);

  return parts.length > 0 ? parts.join(" · ") : "Big bag (non renseigné)";
}
