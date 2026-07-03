"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { EntryForm } from "@/components/entries/EntryForm";
import { EntryDetailCard } from "@/components/entries/EntryDetailCard";
import { DecommissionModal } from "@/components/entries/DecommissionModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SerializedEntry } from "@/lib/validations";
import { DECOMMISSION_REASON_LABELS } from "@/lib/entries";
import { scheduleScrollAboveKeyboard } from "@/lib/keyboard-viewport";

const WarehouseScene = dynamic(
  () => import("@/components/warehouse/WarehouseScene").then((m) => m.WarehouseScene),
  { ssr: false },
);

function EntryPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = Number(params.id);

  const [entry, setEntry] = useState<SerializedEntry | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [position, setPosition] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [showDecomModal, setShowDecomModal] = useState(false);
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState<SerializedEntry[]>([]);
  const moveButtonRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (searchParams.get("edit") !== "1") return;
    if (!entry || entry.status !== "ACTIVE") return;
    setEditing(true);
  }, [entry, searchParams]);

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
            router.replace(`/entry/${saved.id}`);
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
          {entry.decommissionReason
            ? ` (${DECOMMISSION_REASON_LABELS[entry.decommissionReason]})`
            : ""}
          .
        </p>
      ) : null}

      {message ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>
      ) : null}

      {editing ? (
        <>
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
          <Button variant="danger" onClick={() => setShowDecomModal(true)}>
            Décommissionner
          </Button>
        </>
      ) : (
        <>
          <EntryDetailCard entry={entry} />
          <div className="space-y-2">
            {entry.status === "ACTIVE" ? (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Modifier
                </Button>
                <Button variant="danger" onClick={() => setShowDecomModal(true)}>
                  Décommissionner
                </Button>
              </>
            ) : null}
          </div>
        </>
      )}

      {!editing && entry.status === "ACTIVE" ? (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold text-stone-800">Déplacer</h2>
          <div className="space-y-1">
            <Input
              label="Position"
              value={position}
              onChange={(e) => setPosition(e.target.value.toUpperCase())}
              onFocus={() => scheduleScrollAboveKeyboard(moveButtonRef.current)}
              placeholder="Ex. B15"
            />
            <p className="text-xs text-stone-500">
              Format : A01 = rangée A, niveau 0, colonne 1.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setShowMap((v) => !v)}>
            {showMap ? "Masquer la carte" : "Choisir sur la carte"}
          </Button>
          {showMap ? (
            <WarehouseScene
              compact
              visibleLevels={[0, 1, 2]}
              occupiedMap={occupiedMap}
              selectedPosition={position.trim() || null}
              onSlotSelect={({ position: pos, entry: slotEntry }) => {
                if (!slotEntry) setPosition(pos);
              }}
            />
          ) : null}
          <div ref={moveButtonRef}>
            <Button onClick={handleMove}>Appliquer la position</Button>
          </div>
        </section>
      ) : null}

      <DecommissionModal
        entry={entry.status === "ACTIVE" ? entry : null}
        open={showDecomModal && entry.status === "ACTIVE"}
        onClose={() => setShowDecomModal(false)}
        onSuccess={() => {
          setShowDecomModal(false);
          setEditing(false);
        }}
      />

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
