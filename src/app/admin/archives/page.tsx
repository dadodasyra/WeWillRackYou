"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArchiveEntryList } from "@/components/entries/ArchiveEntryList";
import { ClearAllArchivesModal } from "@/components/entries/ClearAllArchivesModal";
import { DeleteArchiveEntryModal } from "@/components/entries/DeleteArchiveEntryModal";
import { EntryDetailCard } from "@/components/entries/EntryDetailCard";
import type { SerializedEntry } from "@/lib/validations";

function ArchiveActionButton({
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

export default function ArchivesPage() {
  const [entries, setEntries] = useState<SerializedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<SerializedEntry | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/entries/archives");
    if (response.ok) {
      setEntries(await response.json());
    }
    setLoading(false);
  }, []);

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
    setError("");
    setMessage("");

    const response = await fetch("/api/entries/archives", { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "Erreur lors de la suppression");
    }

    const data = (await response.json()) as { deleted: number };
    setSelectedEntryId(null);
    setMessage(
      data.deleted === 0
        ? "Aucune archive à supprimer."
        : `${data.deleted} entrée${data.deleted > 1 ? "s" : ""} supprimée${data.deleted > 1 ? "s" : ""} définitivement.`,
    );
    load();
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold text-emerald-900">Archives</h1>
          <p className="text-sm text-stone-600">
            Entrées décommissionnées (hors Ferme du kikiriki)
          </p>
        </div>
        {!loading && entries.length > 0 ? (
          <button
            type="button"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-red-50 px-3 text-sm font-medium text-red-800 hover:bg-red-100"
            title="Tout supprimer"
            aria-label="Tout supprimer"
            onClick={() => setClearAllOpen(true)}
          >
            Tout supprimer
          </button>
        ) : null}
      </header>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-stone-500">Chargement...</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">Aucune archive.</p>
      ) : (
        <>
          {selectedEntry ? (
            <EntryDetailCard
              entry={selectedEntry}
              actions={
                <>
                  <ArchiveActionButton
                    href={`/entry/${selectedEntry.id}`}
                    label="Voir la fiche"
                    variant="view"
                  >
                    👁️
                  </ArchiveActionButton>
                  <ArchiveActionButton
                    label="Supprimer définitivement"
                    variant="danger"
                    onClick={() => setDeleteEntry(selectedEntry)}
                  >
                    🗑️
                  </ArchiveActionButton>
                </>
              }
            />
          ) : null}

          <ArchiveEntryList
            entries={entries}
            selectedEntryId={selectedEntryId}
            onEntrySelect={handleEntrySelect}
          />
        </>
      )}

      <DeleteArchiveEntryModal
        entry={deleteEntry}
        open={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        onSuccess={() => {
          const deletedId = deleteEntry?.id;
          setDeleteEntry(null);
          setSelectedEntryId(null);
          if (deletedId != null) {
            setMessage(`Entrée #${deletedId} supprimée définitivement.`);
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
    </main>
  );
}
