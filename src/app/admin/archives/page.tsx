"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { VarietyLabel } from "@/components/entries/VarietyLabel";
import { formatAttributionLine } from "@/lib/entry-display";
import type { SerializedEntry } from "@/lib/validations";

export default function ArchivesPage() {
  const [entries, setEntries] = useState<SerializedEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Archives</h1>
        <p className="text-sm text-stone-600">
          Entrées décommissionnées (hors Ferme du kikiriki)
        </p>
      </header>

      {loading ? (
        <p className="text-stone-500">Chargement...</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">Aucune archive.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <Link href={`/entry/${entry.id}`} className="font-semibold text-emerald-800">
                Entrée #{entry.id}
              </Link>
              <p className="text-sm text-stone-600">
                {entry.kind === "BIG_BAG" ? (
                  <VarietyLabel variety={entry.bigBagVariety} />
                ) : (
                  "Autre"
                )}
              </p>
              <p className="text-xs text-stone-500">
                {entry.decommissionedAt
                  ? `Décommissionné par ${formatAttributionLine(entry.lastModifiedBy.username, entry.decommissionedAt)}`
                  : `Décommissionné par ${entry.lastModifiedBy.username}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
