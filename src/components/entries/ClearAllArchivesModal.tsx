"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ClearAllArchivesModal({ open, count, onClose, onConfirm }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
      setConfirmed(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
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
      aria-labelledby="clear-archives-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fermer"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <h2 id="clear-archives-modal-title" className="text-lg font-semibold text-red-800">
          Réinitialiser les archives
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Supprime définitivement {count} entrée{count > 1 ? "s" : ""} archivée
          {count > 1 ? "s" : ""}. Cette action est irréversible.
        </p>

        <label className="mt-4 flex items-start gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>Je confirme la suppression définitive de toutes les archives</span>
        </label>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button variant="danger" disabled={loading || !confirmed} onClick={handleConfirm}>
            {loading ? "..." : "Tout supprimer"}
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
