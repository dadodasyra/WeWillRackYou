"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { VarietyOptionContent } from "@/components/entries/VarietySelect";
import { Button } from "@/components/ui/Button";
import { ColorInput } from "@/components/ui/ColorInput";
import { Input } from "@/components/ui/Input";

import type { SerializedEntry } from "@/lib/validations";

type VarietyRow = {
  id: string;
  name: string;
  color: string;
  isBarred: boolean;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminVarietesPage() {
  const [varieties, setVarieties] = useState<VarietyRow[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#808080");
  const [isBarred, setIsBarred] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [entries, setEntries] = useState<SerializedEntry[]>([]);

  const load = useCallback(async () => {
    const [varietiesRes, entriesRes] = await Promise.all([
      fetch("/api/big-bag-varieties?all=1"),
      fetch("/api/entries?status=ACTIVE"),
    ]);
    if (varietiesRes.ok) setVarieties(await varietiesRes.json());
    if (entriesRes.ok) setEntries(await entriesRes.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeVarieties = useMemo(
    () => varieties.filter((v) => v.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [varieties],
  );

  const inactiveVarieties = useMemo(
    () => varieties.filter((v) => !v.isActive).sort((a, b) => a.name.localeCompare(b.name)),
    [varieties],
  );

  const weightByVarietyId = useMemo(() => {
    const totals = new Map<string, number>();
    for (const entry of entries) {
      if (entry.kind !== "BIG_BAG" || !entry.bigBagVariety?.id || entry.weight == null) continue;
      const id = entry.bigBagVariety.id;
      totals.set(id, (totals.get(id) ?? 0) + entry.weight);
    }
    return totals;
  }, [entries]);

  function formatVarietyWeight(varietyId: string): string | null {
    const total = weightByVarietyId.get(varietyId);
    if (total == null || total <= 0) return null;
    return `${total % 1 === 0 ? total : total.toFixed(1)} kg`;
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/big-bag-varieties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, isBarred }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    setName("");
    setColor("#808080");
    setIsBarred(false);
    load();
  }

  async function handleUpdate(variety: VarietyRow) {
    const response = await fetch(`/api/big-bag-varieties/${variety.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: variety.name,
        color: variety.color,
        isBarred: variety.isBarred,
        isActive: variety.isActive,
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    setEditingId(null);
    load();
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Désactiver cette variété ?")) return;
    const response = await fetch(`/api/big-bag-varieties/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    load();
  }

  async function handlePermanentDelete(id: string) {
    if (!confirm("Supprimer définitivement cette variété inactive ?")) return;
    const response = await fetch(`/api/big-bag-varieties/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    load();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeVarieties.length) return;

    const reordered = [...activeVarieties];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setReordering(true);
    setError("");
    const response = await fetch("/api/big-bag-varieties/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((v) => v.id) }),
    });
    setReordering(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur de réorganisation");
      return;
    }

    const updated = (await response.json()) as VarietyRow[];
    const inactive = varieties.filter((v) => !v.isActive);
    setVarieties([...updated, ...inactive]);
  }

  function renderVarietyRow(variety: VarietyRow, index: number, options: { showReorder: boolean }) {
    return (
      <li
        key={variety.id}
        className={`rounded-xl border bg-white px-2.5 py-2 ${
          variety.isActive ? "border-stone-200" : "border-stone-100 opacity-60"
        }`}
      >
        {editingId === variety.id ? (
          <div className="space-y-2">
            <Input
              label="Nom"
              value={variety.name}
              onChange={(e) =>
                setVarieties((list) =>
                  list.map((v) => (v.id === variety.id ? { ...v, name: e.target.value } : v)),
                )
              }
            />
            <ColorInput
              label="Couleur"
              value={variety.color}
              onChange={(newColor) =>
                setVarieties((list) =>
                  list.map((v) => (v.id === variety.id ? { ...v, color: newColor } : v)),
                )
              }
              isBarred={variety.isBarred}
            />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={variety.isBarred}
                onChange={(e) =>
                  setVarieties((list) =>
                    list.map((v) =>
                      v.id === variety.id ? { ...v, isBarred: e.target.checked } : v,
                    ),
                  )
                }
              />
              Rayures diagonales
            </label>
            {!variety.isActive ? (
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={variety.isActive}
                  onChange={(e) =>
                    setVarieties((list) =>
                      list.map((v) =>
                        v.id === variety.id ? { ...v, isActive: e.target.checked } : v,
                      ),
                    )
                  }
                />
                Active
              </label>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={() => handleUpdate(variety)}>Enregistrer</Button>
              <Button variant="secondary" onClick={() => setEditingId(null)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {options.showReorder ? (
              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  disabled={reordering || index === 0}
                  onClick={() => handleMove(index, -1)}
                  className="rounded border border-stone-200 px-1.5 py-0.5 text-xs text-stone-600 enabled:hover:bg-stone-50 disabled:opacity-30"
                  aria-label="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={reordering || index === activeVarieties.length - 1}
                  onClick={() => handleMove(index, 1)}
                  className="rounded border border-stone-200 px-1.5 py-0.5 text-xs text-stone-600 enabled:hover:bg-stone-50 disabled:opacity-30"
                  aria-label="Descendre"
                >
                  ↓
                </button>
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <VarietyOptionContent variety={variety} />
              {formatVarietyWeight(variety.id) ? (
                <p className="mt-0.5 text-xs text-stone-500">
                  {formatVarietyWeight(variety.id)} en stock
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="secondary"
                className="!w-auto px-2 py-1.5 text-xs"
                onClick={() => setEditingId(variety.id)}
              >
                Modifier
              </Button>
              {variety.isActive ? (
                <Button
                  variant="danger"
                  className="!w-auto px-2 py-1.5 text-xs"
                  onClick={() => handleDeactivate(variety.id)}
                >
                  Désactiver
                </Button>
              ) : (
                <Button
                  variant="danger"
                  className="!w-auto px-2 py-1.5 text-xs"
                  onClick={() => handlePermanentDelete(variety.id)}
                >
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Variétés big bags</h1>
        <p className="text-sm text-stone-600">Types de graine configurables</p>
      </header>

      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold">Ajouter une variété</h2>
        <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
        <ColorInput label="Couleur" value={color} onChange={setColor} isBarred={isBarred} />
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={isBarred}
            onChange={(e) => setIsBarred(e.target.checked)}
          />
          Rayures diagonales sur la couleur (tourteaux, séparés)
        </label>
        <Button type="submit">Ajouter</Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ul className="space-y-1">
        {activeVarieties.map((variety, index) =>
          renderVarietyRow(variety, index, { showReorder: true }),
        )}
      </ul>

      {inactiveVarieties.length > 0 ? (
        <section className="space-y-1">
          <h2 className="text-sm font-medium text-stone-500">Variétés inactives</h2>
          <ul className="space-y-1">
            {inactiveVarieties.map((variety, index) =>
              renderVarietyRow(variety, index, { showReorder: false }),
            )}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
