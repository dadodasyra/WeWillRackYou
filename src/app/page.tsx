"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { SerializedEntry } from "@/lib/validations";
import { Button } from "@/components/ui/Button";

const WarehouseScene = dynamic(
  () => import("@/components/warehouse/WarehouseScene").then((m) => m.WarehouseScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[50vh] items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
        Chargement de la carte...
      </div>
    ),
  },
);

export default function HomePage() {
  const [entries, setEntries] = useState<SerializedEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [placeMode, setPlaceMode] = useState(false);
  const [message, setMessage] = useState("");

  const loadEntries = useCallback(async () => {
    const response = await fetch("/api/entries?status=ACTIVE");
    if (response.ok) {
      setEntries(await response.json());
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const occupiedMap = useMemo(() => {
    const map = new Map<string, SerializedEntry>();
    for (const entry of entries) {
      if (entry.position) {
        map.set(entry.position, entry);
      }
    }
    return map;
  }, [entries]);

  async function handleSlotSelect(position: string | null, entry?: SerializedEntry) {
    if (entry) {
      window.location.href = `/entree/${entry.id}`;
      return;
    }

    if (!placeMode || !position) return;

    const unpositioned = entries.filter((e) => !e.position);
    if (unpositioned.length === 0) {
      setMessage("Aucune entrée sans position disponible.");
      setPlaceMode(false);
      return;
    }

    const entryToPlace = unpositioned[0];
    const response = await fetch(`/api/entries/${entryToPlace.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position }),
    });

    if (response.ok) {
      setMessage(`Entrée #${entryToPlace.id} placée en ${position}.`);
      setPlaceMode(false);
      loadEntries();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Erreur de placement");
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Entrepôt</h1>
        <p className="text-sm text-stone-600">
          Position : rangée + niveau + colonne (ex. A11)
        </p>
      </header>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setSelectedLevel(level)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium ${
              selectedLevel === level
                ? "bg-emerald-700 text-white"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            Niveau {level}
          </button>
        ))}
      </div>

      <Suspense fallback={null}>
        <WarehouseScene
          level={selectedLevel}
          occupiedMap={occupiedMap}
          onSlotSelect={handleSlotSelect}
        />
      </Suspense>

      {message ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>
      ) : null}

      <div className="space-y-2">
        <Link href="/entree/nouveau">
          <Button>Nouvelle entrée</Button>
        </Link>
        <Button
          variant="secondary"
          onClick={() => {
            setPlaceMode((v) => !v);
            setMessage(
              placeMode
                ? ""
                : "Mode placement : touchez un emplacement vide pour y placer la première entrée sans position.",
            );
          }}
        >
          {placeMode ? "Annuler le placement" : "Placer une entrée"}
        </Button>
      </div>
    </main>
  );
}
