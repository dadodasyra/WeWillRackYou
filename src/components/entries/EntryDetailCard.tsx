"use client";

import type { ReactNode } from "react";
import {
  entryWasModifiedAfterCreation,
  formatAttributionLine,
  formatEntryQuickSummary,
  getEntryPreviewDescription,
} from "@/lib/entry-display";
import { VarietyLabel } from "@/components/entries/VarietyLabel";
import type { SerializedEntry } from "@/lib/validations";

type Props = {
  entry: SerializedEntry;
  actions?: ReactNode;
};

export function EntryDetailCard({ entry, actions }: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <InfoRow label="ID" value={`#${entry.id}`} />
          {entry.status === "ACTIVE" ? (
            <InfoRow label="Emplacement" value={entry.position} />
          ) : null}
          {entry.kind === "BIG_BAG" ? (
            <>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Type de graine</span>
                <span className="text-right text-stone-800">
                  {entry.bigBagVariety ? <VarietyLabel variety={entry.bigBagVariety} /> : "-"}
                </span>
              </div>
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
          <div className="space-y-1 border-t border-stone-100 pt-3">
            <p className="text-xs text-stone-500">
              Ajouté par {formatAttributionLine(entry.createdBy.username, entry.createdAt)}
            </p>
            {entry.status === "ACTIVE" && entryWasModifiedAfterCreation(entry) ? (
              <p className="text-xs text-stone-500">
                Modifié par {formatAttributionLine(entry.lastModifiedBy.username, entry.updatedAt)}
              </p>
            ) : null}
            {entry.status === "DECOMMISSIONED" && entry.decommissionedAt ? (
              <p className="text-xs text-stone-500">
                Décommissionné par{" "}
                {formatAttributionLine(entry.lastModifiedBy.username, entry.decommissionedAt)}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function EntryQuickSummary({ entry }: { entry: SerializedEntry }) {
  const previewDescription = getEntryPreviewDescription(entry);

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-stone-800">{formatEntryQuickSummary(entry)}</p>
      {previewDescription ? (
        <p className="text-sm text-stone-500">{previewDescription}</p>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-right text-stone-800">{value ?? "-"}</span>
    </div>
  );
}
