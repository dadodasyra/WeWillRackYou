"use client";

import { formatEntryQuickSummary, getCerealLabel } from "@/lib/entry-display";
import type { SerializedEntry } from "@/lib/validations";

type Props = {
  entry: SerializedEntry;
};

export function EntryDetailCard({ entry }: Props) {
  const cerealLabel = getCerealLabel(entry);

  return (
    <section className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4">
      <InfoRow label="ID" value={`#${entry.id}`} />
      <InfoRow label="Emplacement" value={entry.position} />
      {entry.kind === "BIG_BAG" ? (
        <>
          <InfoRow label="Type de graine" value={cerealLabel} />
          <InfoRow label="Année" value={entry.year?.toString()} />
          <InfoRow label="Poids net" value={entry.weight ? `${entry.weight} kg` : null} />
          <InfoRow label="Humidité" value={entry.humidity != null ? `${entry.humidity} %` : null} />
        </>
      ) : (
        <InfoRow label="Description" value={entry.description} />
      )}
      {entry.kind === "BIG_BAG" && entry.description ? (
        <InfoRow label="Description" value={entry.description} />
      ) : null}
      <p className="pt-2 text-xs text-stone-500">
        Dernière modification par {entry.lastModifiedBy.username} le{" "}
        {new Date(entry.updatedAt).toLocaleString("fr-FR")}
      </p>
    </section>
  );
}

export function EntryQuickSummary({ entry }: { entry: SerializedEntry }) {
  return (
    <p className="text-sm font-medium text-stone-800">{formatEntryQuickSummary(entry)}</p>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-right text-stone-800">{value ?? "—"}</span>
    </div>
  );
}
