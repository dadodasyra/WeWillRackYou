"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { VarietySelect } from "@/components/entries/VarietySelect";
import { OwnerSelect } from "@/components/entries/OwnerSelect";
import {
  type EntryFormField,
  type EntryFormFieldErrors,
  hasEntryFormFieldErrors,
  validateBigBagVarietyId,
  validateDescription,
  validateHumidity,
  validateManualId,
  validateOwnerId,
  validatePosition,
  validateWeight,
  validateYear,
} from "@/lib/entry-form-validation";
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
  const [ownerId, setOwnerId] = useState(initial?.owner?.id ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? "");
  const [humidity, setHumidity] = useState(initial?.humidity?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateEntryId, setDuplicateEntryId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EntryFormFieldErrors>({});
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
      setOwnerId(initial.owner.id);
      setYear(initial.year?.toString() ?? "");
      setWeight(initial.weight?.toString() ?? "");
      setHumidity(initial.humidity?.toString() ?? "");
      setDescription(initial.description ?? "");
    }
  }, [initial]);

  const isCreate = !initial;
  const bigBagFieldsRequired = isCreate && kind === "BIG_BAG";

  const setFieldError = useCallback((field: EntryFormField, message: string | null) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }, []);

  const validateField = useCallback(
    (field: EntryFormField): string | null => {
      switch (field) {
        case "manualId":
          return validateManualId(manualId, requireManualId === true && isCreate);
        case "position":
          return validatePosition(position);
        case "bigBagVarietyId":
          return validateBigBagVarietyId(bigBagVarietyId, bigBagFieldsRequired);
        case "ownerId":
          return validateOwnerId(ownerId, isCreate);
        case "year":
          return validateYear(year);
        case "weight":
          return validateWeight(weight);
        case "humidity":
          return validateHumidity(humidity);
        case "description":
          return validateDescription(description);
        default:
          return null;
      }
    },
    [
      manualId,
      requireManualId,
      isCreate,
      position,
      bigBagVarietyId,
      bigBagFieldsRequired,
      ownerId,
      isCreate,
      year,
      weight,
      humidity,
      description,
    ],
  );

  const handleFieldBlur = useCallback(
    (field: EntryFormField) => {
      if (!isCreate) return;
      setFieldError(field, validateField(field));
    },
    [isCreate, setFieldError, validateField],
  );

  const clearFieldError = useCallback(
    (field: EntryFormField) => {
      setFieldError(field, null);
    },
    [setFieldError],
  );

  const checkDuplicateId = useCallback(async () => {
    if (!requireManualId || initial) return;

    const formatError = validateManualId(manualId, true);
    if (formatError) {
      setDuplicateEntryId(null);
      setFieldError("manualId", formatError);
      return;
    }

    const id = Number(manualId);
    setFieldError("manualId", null);

    const response = await fetch(`/api/entries/${id}`);

    if (response.ok) {
      setDuplicateEntryId(id);
    } else {
      setDuplicateEntryId(null);
    }
  }, [manualId, requireManualId, initial, setFieldError]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const resolvedId = entryId ?? (requireManualId ? Number(manualId) : undefined);

    if (isCreate) {
      const errors: EntryFormFieldErrors = {};
      if (requireManualId) {
        const manualIdError = validateManualId(manualId, true);
        if (manualIdError) errors.manualId = manualIdError;
      } else if (!resolvedId || !Number.isInteger(resolvedId) || resolvedId <= 0) {
        setError("Indiquez un identifiant valide (numéro du QR code)");
        setLoading(false);
        return;
      }

      const positionError = validatePosition(position);
      if (positionError) errors.position = positionError;

      const ownerError = validateOwnerId(ownerId, true);
      if (ownerError) errors.ownerId = ownerError;

      if (kind === "BIG_BAG") {
        const varietyError = validateBigBagVarietyId(bigBagVarietyId, true);
        if (varietyError) errors.bigBagVarietyId = varietyError;
        const yearError = validateYear(year);
        if (yearError) errors.year = yearError;
        const weightError = validateWeight(weight);
        if (weightError) errors.weight = weightError;
        const humidityError = validateHumidity(humidity);
        if (humidityError) errors.humidity = humidityError;
      }

      const descriptionError = validateDescription(description);
      if (descriptionError) errors.description = descriptionError;

      if (hasEntryFormFieldErrors(errors) || duplicateEntryId != null) {
        setFieldErrors(errors);
        setError("Corrigez les champs en rouge avant de continuer.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      kind,
      position: position.trim() || null,
      ownerId: ownerId || null,
      bigBagVarietyId: kind === "BIG_BAG" && bigBagVarietyId ? bigBagVarietyId : null,
      year: kind === "BIG_BAG" && year ? Number(year) : null,
      weight: kind === "BIG_BAG" && weight ? Number(weight) : null,
      humidity: kind === "BIG_BAG" && humidity ? Number(humidity) : null,
      description: description.trim() || null,
    };

    const isCreateRequest = !initial;
    const url = isCreateRequest ? "/api/entries" : `/api/entries/${initial.id}`;
    const method = isCreateRequest ? "POST" : "PATCH";
    const body = isCreateRequest ? { ...payload, id: resolvedId } : payload;

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
        <div className="space-y-2">
          <Input
            label="Identifiant (numéro du QR code) *"
            type="number"
            inputMode="numeric"
            value={manualId}
            onChange={(e) => {
              setManualId(e.target.value);
              setDuplicateEntryId(null);
              clearFieldError("manualId");
            }}
            onBlur={checkDuplicateId}
            placeholder="Ex. 42"
            required
            error={
              fieldErrors.manualId ??
              (duplicateEntryId ? "Cet identifiant existe déjà" : undefined)
            }
          />
          {duplicateEntryId ? (
            <Link
              href={`/entry/${duplicateEntryId}?edit=1`}
              className="block w-full rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Voir l&apos;entrée existante
            </Link>
          ) : null}
        </div>
      ) : null}

      {entryId && !initial ? (
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
          Identifiant : <strong>#{entryId}</strong>
        </p>
      ) : null}

      <Select
        label="Type d'entrée *"
        value={kind}
        onChange={(e) => {
          const newKind = e.target.value as "BIG_BAG" | "OTHER";
          setKind(newKind);
          if (isCreate && newKind === "OTHER") {
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.bigBagVarietyId;
              delete next.year;
              delete next.weight;
              delete next.humidity;
              return next;
            });
          }
        }}
        options={[
          { value: "BIG_BAG", label: "Big bag" },
          { value: "OTHER", label: "Autre (bac métallique, etc.)" },
        ]}
      />

      <OwnerSelect
        label="Propriétaire"
        value={ownerId}
        onChange={(value) => {
          setOwnerId(value);
          if (isCreate) clearFieldError("ownerId");
        }}
        onBlur={() => handleFieldBlur("ownerId")}
        required={isCreate}
        error={isCreate ? fieldErrors.ownerId : undefined}
      />

      <div className="space-y-1">
        <Input
          label="Emplacement"
          value={position}
          onChange={(e) => {
            setPosition(e.target.value.toUpperCase());
            if (isCreate) clearFieldError("position");
          }}
          onBlur={() => handleFieldBlur("position")}
          placeholder="Ex. A01, B15"
          error={isCreate ? fieldErrors.position : undefined}
        />
        <p className="text-xs text-stone-500">
          Format : A01 = rangée A, niveau 0, colonne 1.
        </p>
      </div>

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
            if (!entry) {
              setPosition(pos);
              if (isCreate) clearFieldError("position");
            }
          }}
        />
      ) : null}

      {kind === "BIG_BAG" ? (
        <>
          <VarietySelect
            label="Type de graine"
            value={bigBagVarietyId}
            onChange={(value) => {
              setBigBagVarietyId(value);
              if (isCreate) clearFieldError("bigBagVarietyId");
            }}
            onBlur={() => handleFieldBlur("bigBagVarietyId")}
            required={isCreate}
            error={isCreate ? fieldErrors.bigBagVarietyId : undefined}
          />
          <Input
            label="Année"
            type="number"
            inputMode="numeric"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              if (isCreate) clearFieldError("year");
            }}
            onBlur={() => handleFieldBlur("year")}
            error={isCreate ? fieldErrors.year : undefined}
          />
          <Input
            label="Poids net (kg)"
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              if (isCreate) clearFieldError("weight");
            }}
            onBlur={() => handleFieldBlur("weight")}
            error={isCreate ? fieldErrors.weight : undefined}
          />
          <Input
            label="Humidité (%)"
            type="number"
            inputMode="decimal"
            value={humidity}
            onChange={(e) => {
              setHumidity(e.target.value);
              if (isCreate) clearFieldError("humidity");
            }}
            onBlur={() => handleFieldBlur("humidity")}
            error={isCreate ? fieldErrors.humidity : undefined}
          />
        </>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-stone-700">Description</span>
        <textarea
          className={`w-full rounded-xl border bg-white px-3 py-3 text-base outline-none focus:ring-2 ${
            isCreate && fieldErrors.description
              ? "border-red-500 focus:border-red-500 focus:ring-red-100"
              : "border-stone-300 focus:border-emerald-600 focus:ring-emerald-100"
          }`}
          rows={3}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (isCreate) clearFieldError("description");
          }}
          onBlur={() => handleFieldBlur("description")}
        />
        {isCreate && fieldErrors.description ? (
          <span className="text-xs text-red-600">{fieldErrors.description}</span>
        ) : null}
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        <Button
          type="submit"
          disabled={
            loading ||
            duplicateEntryId != null ||
            (isCreate && hasEntryFormFieldErrors(fieldErrors))
          }
        >
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
