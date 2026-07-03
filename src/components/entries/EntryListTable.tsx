"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { VarietyColorSwatch } from "@/components/entries/VarietyColorSwatch";
import { abbreviateVarietyName, formatEntryDetails } from "@/lib/entry-display";
import {
  entryMatchesFilters,
  hasActiveEntryFilters,
  type EntryFilterCriteria,
} from "@/lib/entry-filters";
import type { SerializedEntry } from "@/lib/validations";

type Props = {
  entries: SerializedEntry[];
  filterCriteria?: EntryFilterCriteria;
  filterVarietyName?: string;
  selectedEntryId?: number | null;
  activeMoveEntryId?: number | null;
  onEntrySelect?: (entry: SerializedEntry) => void;
  onMoveRequest: (entry: SerializedEntry) => void;
  onDecommissionRequest: (entry: SerializedEntry) => void;
};

export function sortEntriesForList(
  entries: SerializedEntry[],
  filterCriteria?: EntryFilterCriteria,
): SerializedEntry[] {
  const filterActive = filterCriteria && hasActiveEntryFilters(filterCriteria);

  return [...entries].sort((a, b) => {
    if (filterActive) {
      const aMatch = entryMatchesFilters(a, filterCriteria) ? 0 : 1;
      const bMatch = entryMatchesFilters(b, filterCriteria) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }

    const aUnplaced = a.position ? 1 : 0;
    const bUnplaced = b.position ? 1 : 0;
    if (aUnplaced !== bUnplaced) return aUnplaced - bUnplaced;

    if (a.position && b.position && a.position !== b.position) {
      return a.position.localeCompare(b.position);
    }

    return a.id - b.id;
  });
}

function ActionIconButton({
  label,
  onClick,
  href,
  children,
  variant = "default",
  pressed = false,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
  variant?: "default" | "edit" | "danger" | "move";
  pressed?: boolean;
}) {
  const variantClass = {
    edit: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    danger: "border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
    move: pressed
      ? "border-amber-500 bg-amber-200 text-amber-950 shadow-inner ring-2 ring-amber-400"
      : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100",
    default: "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
  }[variant];

  const className = `inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${variantClass}`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label} title={label}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function TypeCell({ entry }: { entry: SerializedEntry }) {
  if (entry.kind !== "BIG_BAG") {
    return <span className="truncate text-stone-600">Autre</span>;
  }

  const variety = entry.bigBagVariety;
  if (!variety) {
    return <span className="truncate text-stone-500">-</span>;
  }

  const label = abbreviateVarietyName(variety.name);

  return (
    <span className="flex min-w-0 items-center gap-1" title={variety.name}>
      <VarietyColorSwatch variety={variety} size="sm" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function EntryListTable({
  entries,
  filterCriteria,
  filterVarietyName,
  selectedEntryId,
  activeMoveEntryId,
  onEntrySelect,
  onMoveRequest,
  onDecommissionRequest,
}: Props) {
  const sorted = sortEntriesForList(entries, filterCriteria);
  const filterActive = filterCriteria && hasActiveEntryFilters(filterCriteria);

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl bg-stone-50 px-3 py-4 text-sm text-stone-600">
        Aucune entrée active.
      </p>
    );
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-800">Entrées ({sorted.length})</h2>
        {filterActive ? (
          <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
            Tri :{" "}
            {[filterVarietyName, filterCriteria?.year != null ? String(filterCriteria.year) : null]
              .filter(Boolean)
              .join(" · ")}{" "}
            en premier
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="w-10 px-1.5 py-1.5 font-medium">#</th>
              <th className="w-[5.75rem] px-1.5 py-1.5 font-medium">Type</th>
              <th className="w-11 px-1.5 py-1.5 font-medium">Empl.</th>
              <th className="hidden px-1.5 py-1.5 font-medium sm:table-cell">Infos</th>
              <th className="w-[6.5rem] px-1 py-1.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sorted.map((entry) => {
              const entryHighlighted =
                filterActive && entryMatchesFilters(entry, filterCriteria);
              const isSelected = selectedEntryId === entry.id;
              return (
                <tr
                  key={entry.id}
                  onClick={() => onEntrySelect?.(entry)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-amber-100/80 ring-2 ring-inset ring-amber-400"
                      : entryHighlighted
                        ? "bg-emerald-50/60 hover:bg-emerald-50"
                        : !entry.position
                          ? "bg-amber-50/40 hover:bg-amber-50/60"
                          : "hover:bg-stone-50"
                  }`}
                >
                  <td className="px-1.5 py-1.5 font-medium text-stone-800">#{entry.id}</td>
                  <td className="max-w-0 px-1.5 py-1.5">
                    <TypeCell entry={entry} />
                  </td>
                  <td className="truncate px-1.5 py-1.5 text-stone-600">
                    {entry.position ?? <span className="text-amber-700">-</span>}
                  </td>
                  <td className="hidden truncate px-1.5 py-1.5 text-stone-500 sm:table-cell">
                    {formatEntryDetails(entry)}
                  </td>
                  <td className="px-1 py-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-0.5">
                      <ActionIconButton
                        href={`/entry/${entry.id}`}
                        label="Modifier"
                        variant="edit"
                      >
                        ✏️
                      </ActionIconButton>
                      <ActionIconButton
                        label={entry.position ? "Déplacer" : "Positionner"}
                        variant="move"
                        pressed={activeMoveEntryId === entry.id}
                        onClick={() => onMoveRequest(entry)}
                      >
                        📍
                      </ActionIconButton>
                      <ActionIconButton
                        label="Décommissionner"
                        variant="danger"
                        onClick={() => onDecommissionRequest(entry)}
                      >
                        🗑️
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
