"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CEREAL_TYPE_LABELS } from "@/lib/cereal-types";
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
        <Link href="/admin/utilisateurs" className="text-sm text-emerald-700">
          ← Utilisateurs
        </Link>
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
              <Link href={`/entree/${entry.id}`} className="font-semibold text-emerald-800">
                Entrée #{entry.id}
              </Link>
              <p className="text-sm text-stone-600">
                {entry.kind === "BIG_BAG"
                  ? entry.cerealType
                    ? entry.cerealType === "AUTRE"
                      ? entry.cerealTypeOther
                      : CEREAL_TYPE_LABELS[
                          entry.cerealType as keyof typeof CEREAL_TYPE_LABELS
                        ]
                    : "Gros sac"
                  : "Autre"}
              </p>
              <p className="text-xs text-stone-500">
                Décommissionné le{" "}
                {entry.decommissionedAt
                  ? new Date(entry.decommissionedAt).toLocaleString("fr-FR")
                  : "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
