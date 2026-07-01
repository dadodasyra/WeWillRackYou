"use client";

import { useState } from "react";
import type { SerializedEntry } from "@/lib/validations";
import { Button } from "@/components/ui/Button";

type Props = {
  entry: SerializedEntry | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RestoreArchiveEntryModal({ entry, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !entry) return null;

  async function handleConfirm() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/entries/${entry!.id}/restore`, { method: "POST" });
    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }

    onSuccess?.();
    onClose();
  }

  function handleClose() {
    setError("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-archive-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fermer"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <h2 id="restore-archive-modal-title" className="text-lg font-semibold text-emerald-900">
          Remettre en entrepôt #{entry.id}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          L&apos;entrée redeviendra active et réapparaîtra dans l&apos;entrepôt. Il faudra lui
          assigner un emplacement sur la carte.
        </p>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button disabled={loading} onClick={handleConfirm}>
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
