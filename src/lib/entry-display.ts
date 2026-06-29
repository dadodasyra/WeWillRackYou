import type { SerializedEntry } from "./validations";

export function getVarietyLabel(entry: SerializedEntry): string | null {
  if (entry.kind !== "BIG_BAG" || !entry.bigBagVariety) return null;
  return entry.bigBagVariety.name;
}

/** Libellé court pour colonnes étroites (ex. tableau). */
export function abbreviateVarietyName(name: string, maxLength = 11): string {
  let short = name.replace(/^Tourteaux\b/, "Tourt.");
  if (short.length > maxLength) {
    short = `${short.slice(0, maxLength - 1)}…`;
  }
  return short;
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

/** Détails sans le type de graine (déjà affiché ailleurs). */
export function formatEntryDetails(entry: SerializedEntry): string {
  if (entry.kind === "OTHER") {
    const text = entry.description?.trim();
    return text ? (text.length > 40 ? `${text.slice(0, 39)}…` : text) : "—";
  }

  const parts: string[] = [];
  if (entry.year) parts.push(String(entry.year));
  if (entry.weight) parts.push(`${entry.weight} kg`);
  if (entry.humidity != null) parts.push(`${entry.humidity} % H₂O`);

  return parts.length > 0 ? parts.join(" · ") : "—";
}
