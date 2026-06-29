"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { SlotSelection } from "@/components/warehouse/WarehouseScene";
import { EntryQuickSummary } from "@/components/entries/EntryDetailCard";
import type { SerializedEntry } from "@/lib/validations";
import { Button } from "@/components/ui/Button";

const WarehouseScene = dynamic(
  () => import("@/components/warehouse/WarehouseScene").then((m) => m.WarehouseScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[55vh] items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
        Chargement de la carte...
      </div>
    ),
  },
);

const LevelLegend = dynamic(
  () => import("@/components/warehouse/WarehouseScene").then((m) => m.LevelLegend),
  { ssr: false },
);

export default function HomePage() {
  const [entries, setEntries] = useState<SerializedEntry[]>([]);
  const [visibleLevels, setVisibleLevels] = useState([0, 1, 2]);
  const [placeMode, setPlaceMode] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | null>(null);

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

  function toggleLevel(level: number) {
    setVisibleLevels((current) => {
      if (current.includes(level)) {
        const next = current.filter((l) => l !== level);
        return next.length === 0 ? current : next;
      }
      return [...current, level].sort();
    });
  }

  async function handleSlotSelect(selection: SlotSelection) {
    setSelectedSlot(selection);

    if (selection.entry) {
      return;
    }

    if (!placeMode) {
      return;
    }

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
      body: JSON.stringify({ position: selection.position }),
    });

    if (response.ok) {
      setMessage(`Entrée #${entryToPlace.id} placée en ${selection.position}.`);
      setPlaceMode(false);
      setSelectedSlot(null);
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
          Touchez une case pour voir sa position. Format : rangée + niveau + colonne (ex. A01, B12).
        </p>
      </header>

      <LevelLegend visibleLevels={visibleLevels} onToggle={toggleLevel} />

      <Suspense fallback={null}>
        <WarehouseScene
          visibleLevels={visibleLevels}
          occupiedMap={occupiedMap}
          selectedPosition={selectedSlot?.position ?? null}
          onSlotSelect={handleSlotSelect}
        />
      </Suspense>

      {selectedSlot ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-lg font-semibold text-emerald-900">{selectedSlot.position}</p>
          <p className="text-sm text-stone-600">Niveau {selectedSlot.level}</p>
          {selectedSlot.entry ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-stone-500">#{selectedSlot.entry.id}</p>
              <EntryQuickSummary entry={selectedSlot.entry} />
              <Link href={`/entree/${selectedSlot.entry.id}`}>
                <Button>Voir le détail</Button>
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-stone-500">Emplacement vide</p>
          )}
          {placeMode && !selectedSlot.entry ? (
            <p className="mt-2 text-xs text-amber-700">
              Mode placement actif : la prochaine entrée sans position sera placée ici.
            </p>
          ) : null}
        </div>
      ) : null}

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
