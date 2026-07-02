import type { SerializedEntry } from "@/lib/validations";

export type EntryFilterCriteria = {
  varietyId?: string;
  year?: number;
};

export function entryMatchesFilters(
  entry: SerializedEntry,
  { varietyId, year }: EntryFilterCriteria,
): boolean {
  if (varietyId && entry.bigBagVariety?.id !== varietyId) return false;
  if (year != null && entry.year !== year) return false;
  return true;
}

export function hasActiveEntryFilters(criteria: EntryFilterCriteria): boolean {
  return Boolean(criteria.varietyId || criteria.year != null);
}

export function sumEntryWeightKg(entries: SerializedEntry[]): number {
  let total = 0;
  for (const entry of entries) {
    if (entry.weight != null) total += entry.weight;
  }
  return total;
}

export function formatWeightKg(total: number): string {
  return `${total % 1 === 0 ? total : total.toFixed(1)} kg`;
}

export function collectEntryYears(entries: SerializedEntry[]): number[] {
  const years = new Set<number>();
  for (const entry of entries) {
    if (entry.year != null) years.add(entry.year);
  }
  return [...years].sort((a, b) => b - a);
}
