"use client";

import { useState } from "react";
import type { SerializedEntry } from "@/lib/validations";
import { decommissionReasonSchema } from "@/lib/validations";
import { Button } from "@/components/ui/Button";

type DecommissionReason = (typeof decommissionReasonSchema.options)[number];

const REASON_OPTIONS: {
  value: DecommissionReason;
  label: string;
  description: string;
}[] = [
  {
    value: "KIKIRIKI",
    label: "Ferme du kikiriki",
    description: "Ajoute à la liste de paiement",
  },
  {
    value: "OIL_PRESSING",
    label: "Pressage d'huile",
    description: "Entrée décommissionnée pour pressage",
  },
  {
    value: "GENERAL",
    label: "Décommissionné",
    description: "Archivage général",
  },
];

type Props = {
  entry: SerializedEntry | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function DecommissionModal({ entry, open, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState<DecommissionReason>("GENERAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !entry) return null;

  async function handleConfirm() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/entries/${entry!.id}/decommission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }

    onSuccess?.();
    onClose();
    setReason("GENERAL");
  }

  function handleClose() {
    setReason("GENERAL");
    setError("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decom-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fermer"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <h2 id="decom-modal-title" className="text-lg font-semibold text-red-800">
          Décommissionner #{entry.id}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          L&apos;entrée sera retirée de la carte et archivée.
        </p>

        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Raison de décommission</legend>
          {REASON_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-2 rounded-xl border border-stone-200 p-3 text-sm text-stone-700 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
            >
              <input
                type="radio"
                name="decommission-reason"
                className="mt-0.5"
                value={option.value}
                checked={reason === option.value}
                onChange={() => setReason(option.value)}
              />
              <span>
                {option.label}
                <span className="block text-xs text-stone-500">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button variant="danger" disabled={loading} onClick={handleConfirm}>
            {loading ? "..." : "Confirmer"}
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
