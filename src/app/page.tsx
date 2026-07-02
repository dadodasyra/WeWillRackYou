"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { SlotSelection } from "@/components/warehouse/WarehouseScene";
import { DecommissionModal } from "@/components/entries/DecommissionModal";
import { EntryListTable } from "@/components/entries/EntryListTable";
import { EntryQuickSummary } from "@/components/entries/EntryDetailCard";
import { VarietyFilterSelect } from "@/components/entries/VarietyFilterSelect";
import { YearFilterSelect } from "@/components/entries/YearFilterSelect";
import { parsePosition } from "@/lib/position";
import {
  collectEntryYears,
  entryMatchesFilters,
  formatWeightKg,
  hasActiveEntryFilters,
  sumEntryWeightKg,
  type EntryFilterCriteria,
} from "@/lib/entry-filters";
import type { SerializedEntry } from "@/lib/validations";

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
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [varietyFilter, setVarietyFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [varietyNames, setVarietyNames] = useState<Record<string, string>>({});
  const [movingEntry, setMovingEntry] = useState<SerializedEntry | null>(null);
  const [decommissionEntry, setDecommissionEntry] = useState<SerializedEntry | null>(null);
  const [message, setMessage] = useState("");

  const loadEntries = useCallback(async () => {
    const response = await fetch("/api/entries?status=ACTIVE");
    if (response.ok) {
      setEntries(await response.json());
    }
  }, []);

  const loadVarieties = useCallback(async () => {
    const response = await fetch("/api/big-bag-varieties");
    if (response.ok) {
      const varieties = (await response.json()) as { id: string; name: string }[];
      setVarietyNames(Object.fromEntries(varieties.map((v) => [v.id, v.name])));
    }
  }, []);

  useEffect(() => {
    loadEntries();
    loadVarieties();
  }, [loadEntries, loadVarieties]);

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

  function applySlotSelection(selection: SlotSelection | null) {
    setSelectedSlot(selection);
    setSelectedEntryId(selection?.entry?.id ?? null);
  }

  function handleEntrySelect(entry: SerializedEntry) {
    if (selectedEntryId === entry.id) {
      applySlotSelection(null);
      return;
    }

    if (entry.position) {
      const parsed = parsePosition(entry.position);
      applySlotSelection({
        position: entry.position,
        entry: occupiedMap.get(entry.position) ?? entry,
        level: parsed?.level ?? 0,
      });
    } else {
      setSelectedSlot(null);
      setSelectedEntryId(entry.id);
    }
  }

  async function handleSlotSelect(selection: SlotSelection) {
    if (movingEntry) {
      if (selection.entry && selection.entry.id !== movingEntry.id) {
        setMessage("Cet emplacement est déjà occupé.");
        return;
      }
      if (selection.entry?.id === movingEntry.id) {
        setMovingEntry(null);
        setMessage("");
        return;
      }

      const response = await fetch(`/api/entries/${movingEntry.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: selection.position }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.error ?? "Erreur de placement");
        return;
      }

      setMessage(`Entrée #${movingEntry.id} placée en ${selection.position}.`);
      setMovingEntry(null);
      applySlotSelection(selection);
      loadEntries();
      return;
    }

    setMessage("");
    applySlotSelection(
      selectedSlot?.position === selection.position ? null : selection,
    );
  }

  const filterCriteria = useMemo<EntryFilterCriteria>(() => {
    const criteria: EntryFilterCriteria = {};
    if (varietyFilter) criteria.varietyId = varietyFilter;
    if (yearFilter) criteria.year = Number(yearFilter);
    return criteria;
  }, [varietyFilter, yearFilter]);

  const availableYears = useMemo(() => collectEntryYears(entries), [entries]);

  const filteredEntries = useMemo(
    () =>
      hasActiveEntryFilters(filterCriteria)
        ? entries.filter((entry) => entryMatchesFilters(entry, filterCriteria))
        : [],
    [entries, filterCriteria],
  );

  const filteredWeightKg = useMemo(() => sumEntryWeightKg(filteredEntries), [filteredEntries]);

  const highlightVarietyName = varietyFilter ? varietyNames[varietyFilter] : undefined;

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header>
        <h1 className="text-xl font-bold text-emerald-900">Entrepôt</h1>
      </header>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <LevelLegend visibleLevels={visibleLevels} onToggle={toggleLevel} />
        </div>
        <Link
          href="/entry/new"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-lg font-bold text-white shadow-md transition hover:bg-emerald-800"
          aria-label="Ajouter une entrée"
          title="Ajouter"
        >
          +
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex gap-2">
          <VarietyFilterSelect
            className="min-w-0 flex-1 space-y-1"
            value={varietyFilter}
            onChange={setVarietyFilter}
          />
          <YearFilterSelect
            className="min-w-0 flex-1 space-y-1"
            value={yearFilter}
            years={availableYears}
            onChange={setYearFilter}
          />
        </div>
        {hasActiveEntryFilters(filterCriteria) ? (
          <p className="text-xs text-stone-500">
            Mis en évidence : {" "}
            {highlightVarietyName ? <strong>{highlightVarietyName}</strong> : null}
            {highlightVarietyName && filterCriteria.year != null ? " de " : null}
            {!highlightVarietyName && filterCriteria.year != null ? "de " : null}
            {filterCriteria.year != null ? <strong>{filterCriteria.year}</strong> : null}{" "}
            . <strong>{formatWeightKg(filteredWeightKg)}</strong>
          </p>
        ) : null}
      </div>

      {movingEntry ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>
            Touchez un emplacement vide pour{" "}
            {movingEntry.position ? "déplacer" : "positionner"} #{movingEntry.id}
          </span>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-amber-300 px-2 py-1 text-xs font-medium"
            onClick={() => {
              setMovingEntry(null);
              setMessage("");
            }}
          >
            Annuler
          </button>
        </div>
      ) : null}

      <Suspense fallback={null}>
        <WarehouseScene
          visibleLevels={visibleLevels}
          occupiedMap={occupiedMap}
          selectedPosition={selectedSlot?.position ?? null}
          highlightVarietyId={varietyFilter || null}
          highlightYear={yearFilter ? Number(yearFilter) : null}
          onSlotSelect={handleSlotSelect}
        />
      </Suspense>

      {selectedSlot ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-emerald-900">{selectedSlot.position}</p>
              {selectedSlot.entry ? (
                <div className="mt-2">
                  <EntryQuickSummary entry={selectedSlot.entry} />
                </div>
              ) : (
                <p className="mt-2 text-sm text-stone-500">Emplacement vide</p>
              )}
            </div>
            {selectedSlot.entry ? (
              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="text-sm font-medium text-stone-500">#{selectedSlot.entry.id}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/entry/${selectedSlot.entry.id}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-sm text-emerald-800 hover:bg-emerald-100"
                    title="Modifier"
                    aria-label="Modifier"
                  >
                    ✏️
                  </Link>
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition ${
                      movingEntry?.id === selectedSlot.entry.id
                        ? "border-amber-500 bg-amber-200 text-amber-950 shadow-inner ring-2 ring-amber-400"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                    }`}
                    title="Déplacer"
                    aria-label="Déplacer"
                    aria-pressed={movingEntry?.id === selectedSlot.entry.id}
                    onClick={() => {
                      if (movingEntry?.id === selectedSlot.entry!.id) {
                        setMovingEntry(null);
                        setMessage("");
                      } else {
                        setMovingEntry(selectedSlot.entry!);
                        setMessage("");
                      }
                    }}
                  >
                    📍
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-sm text-red-800 hover:bg-red-100"
                    title="Décommissionner"
                    aria-label="Décommissionner"
                    onClick={() => setDecommissionEntry(selectedSlot.entry!)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>
      ) : null}

      <EntryListTable
        entries={entries}
        filterCriteria={filterCriteria}
        filterVarietyName={highlightVarietyName}
        selectedEntryId={selectedEntryId}
        activeMoveEntryId={movingEntry?.id ?? null}
        onEntrySelect={handleEntrySelect}
        onMoveRequest={(entry) => {
          if (movingEntry?.id === entry.id) {
            setMovingEntry(null);
            setMessage("");
          } else {
            setMovingEntry(entry);
            setMessage("");
            applySlotSelection(null);
          }
        }}
        onDecommissionRequest={setDecommissionEntry}
      />

      <DecommissionModal
        entry={decommissionEntry}
        open={!!decommissionEntry}
        onClose={() => setDecommissionEntry(null)}
        onSuccess={() => {
          setDecommissionEntry(null);
          applySlotSelection(null);
          loadEntries();
        }}
      />
    </main>
  );
}
