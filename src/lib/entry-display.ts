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
    return text ? (text.length > 40 ? `${text.slice(0, 39)}…` : text) : "-";
  }

  const parts: string[] = [];
  if (entry.year) parts.push(String(entry.year));
  if (entry.weight) parts.push(`${entry.weight} kg`);
  if (entry.humidity != null) parts.push(`${entry.humidity} % H₂O`);

  return parts.length > 0 ? parts.join(" · ") : "-";
}

export function formatAttributionLine(username: string, dateIso: string): string {
  return `${username} le ${new Date(dateIso).toLocaleString("fr-FR")}`;
}

export function entryWasModifiedAfterCreation(entry: SerializedEntry): boolean {
  if (entry.createdBy.username !== entry.lastModifiedBy.username) return true;
  const created = new Date(entry.createdAt).getTime();
  const updated = new Date(entry.updatedAt).getTime();
  return updated - created > 1000;
}

const PREVIEW_DESCRIPTION_MAX_LENGTH = 80;

/** Description courte affichable sous le résumé en preview (sélection carte). */
export function getEntryPreviewDescription(entry: SerializedEntry): string | null {
  if (entry.kind !== "BIG_BAG") return null;
  const text = entry.description?.trim();
  if (!text || text.length > PREVIEW_DESCRIPTION_MAX_LENGTH || text.includes("\n")) {
    return null;
  }
  return text;
}
