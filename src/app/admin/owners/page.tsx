"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SerializedEntry } from "@/lib/validations";

type OwnerRow = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [entries, setEntries] = useState<SerializedEntry[]>([]);

  const load = useCallback(async () => {
    const [ownersRes, entriesRes] = await Promise.all([
      fetch("/api/owners?all=1"),
      fetch("/api/entries?status=ACTIVE"),
    ]);
    if (ownersRes.ok) setOwners(await ownersRes.json());
    if (entriesRes.ok) setEntries(await entriesRes.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeOwners = useMemo(
    () => owners.filter((o) => o.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [owners],
  );

  const inactiveOwners = useMemo(
    () => owners.filter((o) => !o.isActive).sort((a, b) => a.name.localeCompare(b.name)),
    [owners],
  );

  const entryCountByOwnerId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      const id = entry.owner.id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  function formatOwnerEntryCount(ownerId: string): string | null {
    const count = entryCountByOwnerId.get(ownerId);
    if (count == null || count <= 0) return null;
    return `${count} entrée${count > 1 ? "s" : ""} active${count > 1 ? "s" : ""}`;
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    setName("");
    load();
  }

  async function handleUpdate(owner: OwnerRow) {
    const response = await fetch(`/api/owners/${owner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: owner.name,
        isActive: owner.isActive,
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
    if (!confirm("Désactiver ce propriétaire ?")) return;
    const response = await fetch(`/api/owners/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    load();
  }

  async function handlePermanentDelete(id: string) {
    if (!confirm("Supprimer définitivement ce propriétaire inactif ?")) return;
    const response = await fetch(`/api/owners/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    load();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeOwners.length) return;

    const reordered = [...activeOwners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setReordering(true);
    setError("");
    const response = await fetch("/api/owners/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((o) => o.id) }),
    });
    setReordering(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur de réorganisation");
      return;
    }

    const updated = (await response.json()) as OwnerRow[];
    const inactive = owners.filter((o) => !o.isActive);
    setOwners([...updated, ...inactive]);
  }

  function renderOwnerRow(owner: OwnerRow, index: number, options: { showReorder: boolean }) {
    return (
      <li
        key={owner.id}
        className={`rounded-xl border bg-white px-2.5 py-2 ${
          owner.isActive ? "border-stone-200" : "border-stone-100 opacity-60"
        }`}
      >
        {editingId === owner.id ? (
          <div className="space-y-2">
            <Input
              label="Nom"
              value={owner.name}
              onChange={(e) =>
                setOwners((list) =>
                  list.map((o) => (o.id === owner.id ? { ...o, name: e.target.value } : o)),
                )
              }
            />
            {!owner.isActive ? (
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={owner.isActive}
                  onChange={(e) =>
                    setOwners((list) =>
                      list.map((o) =>
                        o.id === owner.id ? { ...o, isActive: e.target.checked } : o,
                      ),
                    )
                  }
                />
                Actif
              </label>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={() => handleUpdate(owner)}>Enregistrer</Button>
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
                  disabled={reordering || index === activeOwners.length - 1}
                  onClick={() => handleMove(index, 1)}
                  className="rounded border border-stone-200 px-1.5 py-0.5 text-xs text-stone-600 enabled:hover:bg-stone-50 disabled:opacity-30"
                  aria-label="Descendre"
                >
                  ↓
                </button>
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-stone-800">{owner.name}</p>
              {formatOwnerEntryCount(owner.id) ? (
                <p className="mt-0.5 text-xs text-stone-500">{formatOwnerEntryCount(owner.id)}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="secondary"
                className="!w-auto px-2 py-1.5 text-xs"
                onClick={() => setEditingId(owner.id)}
              >
                Modifier
              </Button>
              {owner.isActive ? (
                <Button
                  variant="danger"
                  className="!w-auto px-2 py-1.5 text-xs"
                  onClick={() => handleDeactivate(owner.id)}
                >
                  Désactiver
                </Button>
              ) : (
                <Button
                  variant="danger"
                  className="!w-auto px-2 py-1.5 text-xs"
                  onClick={() => handlePermanentDelete(owner.id)}
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
        <h1 className="text-xl font-bold text-emerald-900">Propriétaires</h1>
        <p className="text-sm text-stone-600">Exploitations associées aux entrées</p>
      </header>

      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold">Ajouter un propriétaire</h2>
        <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
        <Button type="submit">Ajouter</Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ul className="space-y-1">
        {activeOwners.map((owner, index) =>
          renderOwnerRow(owner, index, { showReorder: true }),
        )}
      </ul>

      {inactiveOwners.length > 0 ? (
        <section className="space-y-1">
          <h2 className="text-sm font-medium text-stone-500">Propriétaires inactifs</h2>
          <ul className="space-y-1">
            {inactiveOwners.map((owner, index) =>
              renderOwnerRow(owner, index, { showReorder: false }),
            )}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
