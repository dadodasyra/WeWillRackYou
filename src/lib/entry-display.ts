import type { SerializedEntry } from "./validations";

export function getVarietyLabel(entry: SerializedEntry): string | null {
  if (entry.kind !== "BIG_BAG" || !entry.bigBagVariety) return null;
  return entry.bigBagVariety.name;
}

export function formatEntryQuickSummary(entry: SerializedEntry): string {
  if (entry.kind === "OTHER") {
    return entry.description?.trim() || "Autre objet";
  }

  const parts: string[] = [];
  const variety = getVarietyLabel(entry);
  if (variety) parts.push(variety);
  if (entry.year) parts.push(String(entry.year));
  if (entry.weight) parts.push(`${entry.weight} kg`);
  if (entry.humidity != null) parts.push(`${entry.humidity} % H₂O`);

  return parts.length > 0 ? parts.join(" · ") : "Big bag (non renseigné)";
}
