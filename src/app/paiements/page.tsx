"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { VarietyLabel } from "@/components/entries/VarietyLabel";
import type { SerializedEntry } from "@/lib/validations";

type Filter = "all" | "paid" | "unpaid";

export default function PaiementsPage() {
  const [entries, setEntries] = useState<SerializedEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/entries/payments?filter=${filter}`);
    if (response.ok) {
      setEntries(await response.json());
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePaid(entry: SerializedEntry) {
    const response = await fetch(`/api/entries/${entry.id}/paid`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid: !entry.isPaid }),
    });
    if (response.ok) {
      load();
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Paiements</h1>
        <p className="text-sm text-stone-600">Ferme du kikiriki — entrées à régler</p>
      </header>

      <div className="flex gap-2">
        {(
          [
            ["all", "Tous"],
            ["unpaid", "Non payés"],
            ["paid", "Payés"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`flex-1 rounded-xl py-2 text-xs font-medium ${
              filter === value ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-stone-500">Chargement...</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
          Aucune entrée à afficher.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <Link href={`/entree/${entry.id}`} className="font-semibold text-emerald-800">
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
                    Décommissionné le{" "}
                    {entry.decommissionedAt
                      ? new Date(entry.decommissionedAt).toLocaleString("fr-FR")
                      : "—"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={entry.isPaid}
                    onChange={() => togglePaid(entry)}
                  />
                  Payé
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
