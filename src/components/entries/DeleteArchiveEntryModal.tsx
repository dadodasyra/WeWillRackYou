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

export function DeleteArchiveEntryModal({ entry, open, onClose, onSuccess }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !entry) return null;

  async function handleConfirm() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/entries/${entry!.id}`, { method: "DELETE" });
    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }

    setConfirmed(false);
    onSuccess?.();
    onClose();
  }

  function handleClose() {
    setConfirmed(false);
    setError("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-archive-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fermer"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <h2 id="delete-archive-modal-title" className="text-lg font-semibold text-red-800">
          Supprimer définitivement #{entry.id}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Cette action est irréversible. L&apos;entrée sera effacée de la base de données.
        </p>

        <label className="mt-4 flex items-start gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>Je confirme la suppression définitive de cette entrée</span>
        </label>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button variant="danger" disabled={loading || !confirmed} onClick={handleConfirm}>
            {loading ? "..." : "Supprimer"}
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
