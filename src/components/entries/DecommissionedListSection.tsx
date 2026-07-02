"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArchiveEntryList } from "@/components/entries/ArchiveEntryList";
import { ClearAllArchivesModal } from "@/components/entries/ClearAllArchivesModal";
import { DeleteArchiveEntryModal } from "@/components/entries/DeleteArchiveEntryModal";
import { RestoreArchiveEntryModal } from "@/components/entries/RestoreArchiveEntryModal";
import { EntryDetailCard } from "@/components/entries/EntryDetailCard";
import type { DecommissionReason, SerializedEntry } from "@/lib/validations";

function ActionButton({
  label,
  onClick,
  href,
  children,
  variant = "view",
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  variant?: "view" | "danger";
}) {
  const className = `inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition ${
    variant === "danger"
      ? "border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
      : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
  }`;

  if (href) {
    return (
      <Link href={href} className={className} title={label} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} title={label} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

type Props = {
  reason: DecommissionReason;
  title: string;
  subtitle?: string;
  emptyMessage: string;
  isAdmin: boolean;
  onMessage?: (message: string) => void;
};

export function DecommissionedListSection({
  reason,
  title,
  subtitle,
  emptyMessage,
  isAdmin,
  onMessage,
}: Props) {
  const [entries, setEntries] = useState<SerializedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<SerializedEntry | null>(null);
  const [restoreEntry, setRestoreEntry] = useState<SerializedEntry | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/entries/decommissioned?reason=${reason}`);
    if (response.ok) {
      setEntries(await response.json());
    }
    setLoading(false);
  }, [reason]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  function handleEntrySelect(entry: SerializedEntry) {
    setSelectedEntryId((current) => (current === entry.id ? null : entry.id));
  }

  async function handleClearAll() {
    const response = await fetch(`/api/entries/decommissioned?reason=${reason}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "Erreur lors de la suppression");
    }

    const data = (await response.json()) as { deleted: number };
    setSelectedEntryId(null);
    onMessage?.(
      data.deleted === 0
        ? `Aucune entrée à supprimer dans ${title}.`
        : `${data.deleted} entrée${data.deleted > 1 ? "s" : ""} supprimée${data.deleted > 1 ? "s" : ""} de ${title}.`,
    );
    load();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-base font-semibold text-emerald-900">{title}</h2>
          {subtitle ? <p className="text-xs text-stone-500">{subtitle}</p> : null}
        </div>
        {isAdmin && !loading && entries.length > 0 ? (
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-red-50 px-3 text-xs font-medium text-red-800 hover:bg-red-100"
            title="Tout supprimer"
            aria-label="Tout supprimer"
            onClick={() => setClearAllOpen(true)}
          >
            Tout supprimer
          </button>
        ) : null}
      </header>

      {loading ? (
        <p className="text-sm text-stone-500">Chargement...</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl bg-stone-50 p-3 text-sm text-stone-600">{emptyMessage}</p>
      ) : (
        <>
          {selectedEntry ? (
            <EntryDetailCard
              entry={selectedEntry}
              actions={
                isAdmin ? (
                  <>
                    <ActionButton
                      href={`/entry/${selectedEntry.id}`}
                      label="Voir la fiche"
                      variant="view"
                    >
                      👁️
                    </ActionButton>
                    <ActionButton
                      label="Remettre en entrepôt"
                      variant="view"
                      onClick={() => setRestoreEntry(selectedEntry)}
                    >
                      ↩️
                    </ActionButton>
                    <ActionButton
                      label="Supprimer définitivement"
                      variant="danger"
                      onClick={() => setDeleteEntry(selectedEntry)}
                    >
                      🗑️
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton
                    href={`/entry/${selectedEntry.id}`}
                    label="Voir la fiche"
                    variant="view"
                  >
                    👁️
                  </ActionButton>
                )
              }
            />
          ) : null}

          <ArchiveEntryList
            entries={entries}
            selectedEntryId={selectedEntryId}
            onEntrySelect={handleEntrySelect}
            title={title}
            emptyMessage={emptyMessage}
          />
        </>
      )}

      <RestoreArchiveEntryModal
        entry={restoreEntry}
        open={!!restoreEntry}
        onClose={() => setRestoreEntry(null)}
        onSuccess={() => {
          const restoredId = restoreEntry?.id;
          setRestoreEntry(null);
          setSelectedEntryId(null);
          if (restoredId != null) {
            onMessage?.(`Entrée #${restoredId} remise en entrepôt.`);
          }
          load();
        }}
      />

      <DeleteArchiveEntryModal
        entry={deleteEntry}
        open={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        onSuccess={() => {
          const deletedId = deleteEntry?.id;
          setDeleteEntry(null);
          setSelectedEntryId(null);
          if (deletedId != null) {
            onMessage?.(`Entrée #${deletedId} supprimée définitivement.`);
          }
          load();
        }}
      />

      <ClearAllArchivesModal
        open={clearAllOpen}
        count={entries.length}
        onClose={() => setClearAllOpen(false)}
        onConfirm={handleClearAll}
      />
    </section>
  );
}
