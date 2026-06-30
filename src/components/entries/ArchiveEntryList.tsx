"use client";

import { useEffect, useRef } from "react";
import { VarietyColorSwatch } from "@/components/entries/VarietyColorSwatch";
import { abbreviateVarietyName, formatEntryDetails } from "@/lib/entry-display";
import { sortEntriesForList } from "@/components/entries/EntryListTable";
import type { SerializedEntry } from "@/lib/validations";

type Props = {
  entries: SerializedEntry[];
  selectedEntryId?: number | null;
  onEntrySelect: (entry: SerializedEntry) => void;
};

function TypeCell({ entry }: { entry: SerializedEntry }) {
  if (entry.kind !== "BIG_BAG") {
    return <span className="truncate text-stone-600">Autre</span>;
  }

  const variety = entry.bigBagVariety;
  if (!variety) {
    return <span className="truncate text-stone-500">—</span>;
  }

  const label = abbreviateVarietyName(variety.name);

  return (
    <span className="flex min-w-0 items-center gap-1" title={variety.name}>
      <VarietyColorSwatch variety={variety} size="sm" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function ArchiveEntryList({ entries, selectedEntryId, onEntrySelect }: Props) {
  const sorted = sortEntriesForList(entries);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    if (selectedEntryId == null) return;
    rowRefs.current.get(selectedEntryId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedEntryId]);

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl bg-stone-50 px-3 py-4 text-sm text-stone-600">Aucune archive.</p>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-stone-800">Archives ({sorted.length})</h2>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="w-10 px-1.5 py-1.5 font-medium">#</th>
              <th className="w-[5.75rem] px-1.5 py-1.5 font-medium">Type</th>
              <th className="hidden px-1.5 py-1.5 font-medium sm:table-cell">Infos</th>
              <th className="w-[7.5rem] px-1.5 py-1.5 font-medium">Décom.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sorted.map((entry) => {
              const isSelected = selectedEntryId === entry.id;
              return (
                <tr
                  key={entry.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(entry.id, el);
                    else rowRefs.current.delete(entry.id);
                  }}
                  onClick={() => onEntrySelect(entry)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-amber-100/80 ring-2 ring-inset ring-amber-400"
                      : "hover:bg-stone-50"
                  }`}
                >
                  <td className="px-1.5 py-1.5 font-medium text-stone-800">#{entry.id}</td>
                  <td className="max-w-0 px-1.5 py-1.5">
                    <TypeCell entry={entry} />
                  </td>
                  <td className="hidden truncate px-1.5 py-1.5 text-stone-500 sm:table-cell">
                    {formatEntryDetails(entry)}
                  </td>
                  <td className="truncate px-1.5 py-1.5 text-xs text-stone-500">
                    {entry.decommissionedAt
                      ? new Date(entry.decommissionedAt).toLocaleDateString("fr-FR")
                      : "—"}
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
