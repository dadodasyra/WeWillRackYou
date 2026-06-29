"use client";

import { FormEvent, useEffect, useState } from "react";
import { CEREAL_TYPE_LABELS, CEREAL_TYPES } from "@/lib/cereal-types";
import type { SerializedEntry } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Props = {
  entryId?: number;
  initial?: SerializedEntry | null;
  onSaved: (entry: SerializedEntry) => void;
  onCancel?: () => void;
};

export function EntryForm({ entryId, initial, onSaved, onCancel }: Props) {
  const [kind, setKind] = useState<"BIG_BAG" | "OTHER">(initial?.kind ?? "BIG_BAG");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [cerealType, setCerealType] = useState(initial?.cerealType ?? "");
  const [cerealTypeOther, setCerealTypeOther] = useState(initial?.cerealTypeOther ?? "");
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? "");
  const [humidity, setHumidity] = useState(initial?.humidity?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setKind(initial.kind);
      setPosition(initial.position ?? "");
      setCerealType(initial.cerealType ?? "");
      setCerealTypeOther(initial.cerealTypeOther ?? "");
      setWeight(initial.weight?.toString() ?? "");
      setHumidity(initial.humidity?.toString() ?? "");
      setDescription(initial.description ?? "");
    }
  }, [initial]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      kind,
      position: position.trim() || null,
      cerealType: kind === "BIG_BAG" && cerealType ? cerealType : null,
      cerealTypeOther:
        kind === "BIG_BAG" && cerealType === "AUTRE" ? cerealTypeOther : null,
      weight: kind === "BIG_BAG" && weight ? Number(weight) : null,
      humidity: kind === "BIG_BAG" && humidity ? Number(humidity) : null,
      description: description.trim() || null,
    };

    const isCreate = !initial;
    const url = isCreate ? "/api/entries" : `/api/entries/${initial.id}`;
    const method = isCreate ? "POST" : "PATCH";
    const body = isCreate ? { ...payload, ...(entryId ? { id: entryId } : {}) } : payload;

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
      <Select
        label="Type d'entrée"
        value={kind}
        onChange={(e) => setKind(e.target.value as "BIG_BAG" | "OTHER")}
        options={[
          { value: "BIG_BAG", label: "Gros sac" },
          { value: "OTHER", label: "Autre (bac métallique, etc.)" },
        ]}
      />

      <Input
        label="Position (ex. A11)"
        value={position}
        onChange={(e) => setPosition(e.target.value.toUpperCase())}
        placeholder="Optionnel"
      />

      {kind === "BIG_BAG" ? (
        <>
          <Select
            label="Type de céréale"
            value={cerealType}
            onChange={(e) => setCerealType(e.target.value)}
            options={[
              { value: "", label: "— Non renseigné —" },
              ...CEREAL_TYPES.map((type) => ({
                value: type,
                label: CEREAL_TYPE_LABELS[type],
              })),
            ]}
          />
          {cerealType === "AUTRE" ? (
            <Input
              label="Précision (autre)"
              value={cerealTypeOther}
              onChange={(e) => setCerealTypeOther(e.target.value)}
              maxLength={50}
            />
          ) : null}
          <Input
            label="Poids (kg)"
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
