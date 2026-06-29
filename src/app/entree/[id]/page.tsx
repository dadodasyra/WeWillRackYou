"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { EntryForm } from "@/components/entries/EntryForm";
import { EntryDetailCard } from "@/components/entries/EntryDetailCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SerializedEntry } from "@/lib/validations";

const WarehouseScene = dynamic(
  () => import("@/components/warehouse/WarehouseScene").then((m) => m.WarehouseScene),
  { ssr: false },
);

function EntryPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const entryId = Number(params.id);

  const [entry, setEntry] = useState<SerializedEntry | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [position, setPosition] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [forKikiriki, setForKikiriki] = useState(false);
  const [confirmDecom, setConfirmDecom] = useState(false);
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState<SerializedEntry[]>([]);

  const loadEntry = useCallback(async () => {
    if (!Number.isInteger(entryId) || entryId <= 0) {
      setEntry(null);
      return;
    }

    const response = await fetch(`/api/entries/${entryId}`);
    if (response.status === 404) {
      setEntry(null);
      setCreating(true);
      return;
    }
    if (response.ok) {
      const data = (await response.json()) as SerializedEntry;
      setEntry(data);
      setPosition(data.position ?? "");
      setCreating(false);
    }
  }, [entryId]);

  const loadEntries = useCallback(async () => {
    const response = await fetch("/api/entries?status=ACTIVE");
    if (response.ok) {
      setEntries(await response.json());
    }
  }, []);

  useEffect(() => {
    loadEntry();
    loadEntries();
  }, [loadEntry, loadEntries]);

  const occupiedMap = useMemo(() => {
    const map = new Map<string, SerializedEntry>();
    for (const e of entries) {
      if (e.position) map.set(e.position, e);
    }
    return map;
  }, [entries]);

  async function handleMove() {
    if (!entry) return;
    const response = await fetch(`/api/entries/${entry.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: position.trim() || null }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Erreur");
      return;
    }
    setEntry(data);
    setMessage("Position mise à jour.");
    loadEntries();
  }

  async function handleDecommission() {
    if (!entry) return;
    const response = await fetch(`/api/entries/${entry.id}/decommission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forKikiriki }),
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Erreur");
      return;
    }
    router.push(forKikiriki ? "/paiements" : "/");
  }

  if (entry === undefined) {
    return (
      <main className="px-4 py-8 text-center text-stone-500">Chargement...</main>
    );
  }

  if (creating || entry === null) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <header>
          <h1 className="text-xl font-bold text-emerald-900">
            Nouvelle entrée #{entryId}
          </h1>
          <p className="text-sm text-stone-600">
            Cet identifiant n&apos;existe pas encore. Créez l&apos;entrée associée au QR code.
          </p>
        </header>
        <EntryForm
          entryId={entryId}
          onSaved={(saved) => {
            setEntry(saved);
            setCreating(false);
            router.replace(`/entree/${saved.id}`);
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-emerald-700">
          ← Retour à la carte
        </Link>
        <h1 className="text-xl font-bold text-emerald-900">Entrée #{entry.id}</h1>
        <p className="text-sm text-stone-600">
          {entry.kind === "BIG_BAG" ? "Gros sac" : "Autre"} ·{" "}
          {entry.position ?? "Sans position"}
          {entry.status === "DECOMMISSIONED" ? " · Décommissionné" : ""}
        </p>
      </header>

      {entry.status === "DECOMMISSIONED" ? (
        <p className="rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-700">
          Cette entrée est archivée
          {entry.decommissionForKikiriki ? " (liste de paiement kikiriki)" : ""}.
        </p>
      ) : null}

      {message ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>
      ) : null}

      {editing ? (
        <EntryForm
          initial={entry}
          onSaved={(saved) => {
            setEntry(saved);
            setEditing(false);
            setMessage("Modifications enregistrées.");
            loadEntries();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <EntryDetailCard entry={entry} />
          <div className="space-y-2">
            {entry.status === "ACTIVE" ? (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Modifier
              </Button>
            ) : null}
          </div>
        </>
      )}

      {!editing && entry.status === "ACTIVE" ? (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold text-stone-800">Déplacer</h2>
          <Input
            label="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value.toUpperCase())}
            placeholder="Ex. B15"
          />
          <Button variant="secondary" onClick={() => setShowMap((v) => !v)}>
            {showMap ? "Masquer la carte" : "Choisir sur la carte"}
          </Button>
          {showMap ? (
            <WarehouseScene
              compact
              visibleLevels={[0, 1, 2]}
              occupiedMap={occupiedMap}
              onSlotSelect={({ position, entry }) => {
                if (entry) {
                  setPosition(position);
                  return;
                }
                setPosition(position);
              }}
            />
          ) : null}
          <Button onClick={handleMove}>Appliquer la position</Button>
        </section>
      ) : null}

      {!editing && entry.status === "ACTIVE" ? (
        <section className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800">Décommissionner</h2>
          {!confirmDecom ? (
            <Button variant="danger" onClick={() => setConfirmDecom(true)}>
              Décommissionner cette entrée
            </Button>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={forKikiriki}
                  onChange={(e) => setForKikiriki(e.target.checked)}
                />
                Pour Ferme du kikiriki (liste de paiement)
              </label>
              <Button variant="danger" onClick={handleDecommission}>
                Confirmer la décommission
              </Button>
              <Button variant="secondary" onClick={() => setConfirmDecom(false)}>
                Annuler
              </Button>
            </>
          )}
        </section>
      ) : null}

      <p className="text-center">
        <a
          href={`/api/entries/${entry.id}/qr`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-stone-500 underline"
        >
          Réimprimer QR
        </a>
      </p>
    </main>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={<main className="px-4 py-8 text-center">Chargement...</main>}>
      <EntryPageContent />
    </Suspense>
  );
}
