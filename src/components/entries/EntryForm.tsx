"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { VarietySelect } from "@/components/entries/VarietySelect";
import type { SerializedEntry } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const WarehouseScene = dynamic(
  () => import("@/components/warehouse/WarehouseScene").then((m) => m.WarehouseScene),
  { ssr: false },
);

type Props = {
  /** ID imposé par scan QR (lecture seule). */
  entryId?: number;
  /** Création manuelle : l'utilisateur saisit l'ID du sticker. */
  requireManualId?: boolean;
  initial?: SerializedEntry | null;
  onSaved: (entry: SerializedEntry) => void;
  onCancel?: () => void;
};

export function EntryForm({
  entryId,
  requireManualId,
  initial,
  onSaved,
  onCancel,
}: Props) {
  const [manualId, setManualId] = useState("");
  const [kind, setKind] = useState<"BIG_BAG" | "OTHER">(initial?.kind ?? "BIG_BAG");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [bigBagVarietyId, setBigBagVarietyId] = useState(initial?.bigBagVariety?.id ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? "");
  const [humidity, setHumidity] = useState(initial?.humidity?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [entries, setEntries] = useState<SerializedEntry[]>([]);

  const loadEntries = useCallback(async () => {
    const response = await fetch("/api/entries?status=ACTIVE");
    if (response.ok) setEntries(await response.json());
  }, []);

  useEffect(() => {
    if (showMap) loadEntries();
  }, [showMap, loadEntries]);

  const occupiedMap = useMemo(() => {
    const map = new Map<string, SerializedEntry>();
    for (const entry of entries) {
      if (entry.position) map.set(entry.position, entry);
    }
    return map;
  }, [entries]);

  useEffect(() => {
    if (initial) {
      setKind(initial.kind);
      setPosition(initial.position ?? "");
      setBigBagVarietyId(initial.bigBagVariety?.id ?? "");
      setYear(initial.year?.toString() ?? "");
      setWeight(initial.weight?.toString() ?? "");
      setHumidity(initial.humidity?.toString() ?? "");
      setDescription(initial.description ?? "");
    }
  }, [initial]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const resolvedId = entryId ?? (requireManualId ? Number(manualId) : undefined);
    if (!initial && (!resolvedId || !Number.isInteger(resolvedId) || resolvedId <= 0)) {
      setError("Indiquez un identifiant valide (numéro du QR code)");
      setLoading(false);
      return;
    }

    const payload = {
      kind,
      position: position.trim() || null,
      bigBagVarietyId: kind === "BIG_BAG" && bigBagVarietyId ? bigBagVarietyId : null,
      year: kind === "BIG_BAG" && year ? Number(year) : null,
      weight: kind === "BIG_BAG" && weight ? Number(weight) : null,
      humidity: kind === "BIG_BAG" && humidity ? Number(humidity) : null,
      description: description.trim() || null,
    };

    const isCreate = !initial;
    const url = isCreate ? "/api/entries" : `/api/entries/${initial.id}`;
    const method = isCreate ? "POST" : "PATCH";
    const body = isCreate ? { ...payload, id: resolvedId } : payload;

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur lors de l'enregistrement");
      return;
    }

    const entry = (await response.json()) as SerializedEntry;
    onSaved(entry);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {requireManualId && !initial ? (
        <Input
          label="Identifiant (numéro du QR code)"
          type="number"
          inputMode="numeric"
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="Ex. 42"
          required
        />
      ) : null}

      {entryId && !initial ? (
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
          Identifiant : <strong>#{entryId}</strong>
        </p>
      ) : null}

      <Select
        label="Type d'entrée"
        value={kind}
        onChange={(e) => setKind(e.target.value as "BIG_BAG" | "OTHER")}
        options={[
          { value: "BIG_BAG", label: "Big bag" },
          { value: "OTHER", label: "Autre (bac métallique, etc.)" },
        ]}
      />

      <Input
        label="Emplacement (ex. A01, B15)"
        value={position}
        onChange={(e) => setPosition(e.target.value.toUpperCase())}
        placeholder="Optionnel"
      />

      <Button type="button" variant="secondary" onClick={() => setShowMap((v) => !v)}>
        {showMap ? "Masquer la carte" : "Choisir sur la carte"}
      </Button>
      {showMap ? (
        <WarehouseScene
          compact
          visibleLevels={[0, 1, 2]}
          occupiedMap={occupiedMap}
          selectedPosition={position.trim() || null}
          onSlotSelect={({ position: pos, entry }) => {
            if (!entry) setPosition(pos);
          }}
        />
      ) : null}

      {kind === "BIG_BAG" ? (
        <>
          <VarietySelect
            label="Type de graine"
            value={bigBagVarietyId}
            onChange={setBigBagVarietyId}
          />
          <Input
            label="Année"
            type="number"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Ex. 2024"
          />
          <Input
            label="Poids net (kg)"
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Input
            label="Humidité (%)"
            type="number"
            inputMode="decimal"
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
          />
        </>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-stone-700">Description</span>
        <textarea
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : initial ? "Enregistrer" : "Créer l'entrée"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
