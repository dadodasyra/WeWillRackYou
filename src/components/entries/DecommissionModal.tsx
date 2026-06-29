"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedEntry } from "@/lib/validations";
import { Button } from "@/components/ui/Button";

type Props = {
  entry: SerializedEntry | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function DecommissionModal({ entry, open, onClose, onSuccess }: Props) {
  const router = useRouter();
  const [forKikiriki, setForKikiriki] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !entry) return null;

  async function handleConfirm() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/entries/${entry!.id}/decommission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forKikiriki }),
    });
    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }

    onSuccess?.();
    onClose();
    setForKikiriki(false);
    router.push(forKikiriki ? "/payments" : "/");
  }

  function handleClose() {
    setForKikiriki(false);
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

        <label className="mt-4 flex items-start gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={forKikiriki}
            onChange={(e) => setForKikiriki(e.target.checked)}
          />
          <span>
            Pour Ferme du kikiriki
            <span className="block text-xs text-stone-500">Ajoute à la liste de paiement</span>
          </span>
        </label>

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
