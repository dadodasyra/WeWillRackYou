import { parsePosition } from "@/lib/position";
import type { SlotSelection } from "@/components/warehouse/WarehouseScene";
import type { SerializedEntry } from "@/lib/validations";

export function buildOccupiedMap(entries: SerializedEntry[]) {
  const map = new Map<string, SerializedEntry>();
  for (const entry of entries) {
    if (entry.position) {
      map.set(entry.position, entry);
    }
  }
  return map;
}

export function reconcileSelectedSlot(
  selectedSlot: SlotSelection | null,
  entries: SerializedEntry[],
  occupiedMap: Map<string, SerializedEntry>,
): SlotSelection | null {
  if (!selectedSlot) return null;

  if (selectedSlot.entry) {
    const updated = entries.find((e) => e.id === selectedSlot.entry!.id);
    if (!updated || updated.status !== "ACTIVE") return null;

    if (updated.position) {
      const parsed = parsePosition(updated.position);
      return {
        position: updated.position,
        entry: occupiedMap.get(updated.position) ?? updated,
        level: parsed?.level ?? selectedSlot.level,
      };
    }

    return null;
  }

  const nowOccupied = occupiedMap.get(selectedSlot.position);
  return {
    ...selectedSlot,
    entry: nowOccupied,
  };
}

export function reconcileMovingEntry(
  movingEntry: SerializedEntry | null,
  entries: SerializedEntry[],
): SerializedEntry | null {
  if (!movingEntry) return null;

  const updated = entries.find((e) => e.id === movingEntry.id);
  if (!updated || updated.status !== "ACTIVE") return null;

  return updated;
}

export function reconcileSelectedEntryId(
  selectedEntryId: number | null,
  entries: SerializedEntry[],
): number | null {
  if (selectedEntryId == null) return null;
  return entries.some((e) => e.id === selectedEntryId) ? selectedEntryId : null;
}
