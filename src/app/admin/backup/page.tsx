"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type BackupType = "manual" | "auto";

type BackupMeta = {
  name: string;
  type: BackupType;
  sizeBytes: number;
  modifiedAt: string;
  payloadCreatedAt: string;
  version: number;
  counts: {
    owners: number;
    varieties: number;
    entries: number;
  };
};

type PendingRestore =
  | { kind: "server"; name: string; counts: BackupMeta["counts"] }
  | { kind: "upload"; fileName: string };

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminBackupPage() {
  const [files, setFiles] = useState<BackupMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/backup", { cache: "no-store" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Impossible de charger les sauvegardes");
      }
      const data = (await response.json()) as BackupMeta[];
      setFiles(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function createBackup() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/backup", { method: "POST" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Création de sauvegarde échouée");
      }
      const data = (await response.json()) as BackupMeta;
      setNotice(`Sauvegarde créée : ${data.name}`);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  async function downloadBackup(name: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/backup/${encodeURIComponent(name)}`);
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Téléchargement échoué");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  async function deleteBackup(name: string) {
    if (!window.confirm(`Supprimer la sauvegarde ${name} ?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/backup/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Suppression échouée");
      }
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAllBackups() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/backup", { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Suppression échouée");
      }
      const data = (await response.json()) as { deleted?: number };
      setNotice(`${data.deleted ?? 0} sauvegarde(s) supprimée(s).`);
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erreur inconnue");
    } finally {
      setBusy(false);
      setConfirmDeleteAll(false);
    }
  }

  async function performRestore() {
    if (!pendingRestore) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      let response: Response;
      if (pendingRestore.kind === "server") {
        response = await fetch("/api/admin/backup/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: pendingRestore.name }),
        });
      } else {
        if (!uploadFile) {
          setError("Sélectionnez un fichier JSON");
          setBusy(false);
          setPendingRestore(null);
          return;
        }
        const formData = new FormData();
        formData.append("file", uploadFile);
        response = await fetch("/api/admin/backup/restore", {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Restauration échouée");
      }

      const data = (await response.json()) as {
        restored?: { entries: number; varieties: number; owners: number };
      };
      const restored = data.restored;
      setNotice(
        restored
          ? `Restauration effectuée : ${restored.entries} entrées, ${restored.varieties} variétés, ${restored.owners} propriétaires.`
          : "Restauration effectuée.",
      );
      if (pendingRestore.kind === "upload") setUploadFile(null);
      await load();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Erreur inconnue");
    } finally {
      setBusy(false);
      setPendingRestore(null);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setUploadFile(event.target.files?.[0] ?? null);
  }

  const autoBackups = useMemo(() => files.filter((file) => file.type === "auto"), [files]);
  const latestAuto = autoBackups[0] ?? null;

  const totalFilesLabel = useMemo(() => {
    if (files.length === 0) return "Aucune sauvegarde";
    return `${files.length} sauvegarde${files.length > 1 ? "s" : ""}`;
  }, [files.length]);

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Sauvegardes</h1>
        <p className="text-sm text-stone-600">
          Sauvegarde et restauration de la base (hors utilisateurs)
        </p>
      </header>

      <section className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <h2 className="font-semibold text-emerald-900">Sauvegardes automatiques</h2>
        <p className="text-sm text-emerald-800">
          Une sauvegarde automatique est créée chaque jour par l&apos;application (14 max, les plus anciennes sont supprimées).
        </p>
        <p className="text-sm text-emerald-800">
          {latestAuto
            ? `Dernière sauvegarde automatique : ${formatDate(latestAuto.payloadCreatedAt)} (${autoBackups.length}/14).`
            : "Aucune sauvegarde automatique pour le moment — la première sera créée sous peu."}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold">Créer une sauvegarde</h2>
        <p className="text-sm text-stone-600">
          Crée immédiatement une sauvegarde manuelle sur le serveur.
        </p>
        <Button disabled={busy} onClick={() => void createBackup()}>
          Créer une sauvegarde maintenant
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-stone-800">Sauvegardes existantes</h2>
          <span className="text-xs text-stone-500">{loading ? "Chargement..." : totalFilesLabel}</span>
        </div>

        {files.length > 0 ? (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => setConfirmDeleteAll(true)}
          >
            Supprimer toutes les sauvegardes
          </Button>
        ) : null}

        {files.length === 0 && !loading ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-500">
            Aucune sauvegarde disponible.
          </p>
        ) : null}

        <ul className="space-y-3">
          {files.map((file) => (
            <li key={file.name} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-stone-900">{file.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        file.type === "auto"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {file.type === "auto" ? "Automatique" : "Manuelle"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Créée {formatDate(file.payloadCreatedAt)} · {formatBytes(file.sizeBytes)}
                  </p>
                  <p className="text-xs text-stone-600">
                    {file.counts.entries} entrées · {file.counts.varieties} variétés · {file.counts.owners} propriétaires
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                  disabled={busy}
                  title="Télécharger"
                  aria-label={`Télécharger ${file.name}`}
                  onClick={() => void downloadBackup(file.name)}
                >
                  ⬇️
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="danger"
                  className="!w-auto px-3 py-2"
                  disabled={busy}
                  onClick={() =>
                    setPendingRestore({
                      kind: "server",
                      name: file.name,
                      counts: file.counts,
                    })
                  }
                >
                  Restaurer
                </Button>
                <Button
                  variant="secondary"
                  className="!w-auto px-3 py-2"
                  disabled={busy}
                  onClick={() => void deleteBackup(file.name)}
                >
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold">Restaurer depuis un fichier</h2>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Attention : restaurer <strong>remplace définitivement</strong> toutes les entrées,
          variétés et propriétaires actuels. Action irréversible.
        </p>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-stone-700">Fichier JSON</span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <Button
          variant="danger"
          disabled={busy || !uploadFile}
          onClick={() =>
            uploadFile && setPendingRestore({ kind: "upload", fileName: uploadFile.name })
          }
        >
          Restaurer ce fichier
        </Button>
      </section>

      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {confirmDeleteAll ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-all-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Fermer"
            disabled={busy}
            onClick={() => !busy && setConfirmDeleteAll(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h2 id="delete-all-modal-title" className="text-lg font-semibold text-red-800">
              Supprimer toutes les sauvegardes
            </h2>
            <div className="mt-2 space-y-2 text-sm text-stone-700">
              <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-900">
                Cette action supprime <strong>DÉFINITIVEMENT</strong> l&apos;ensemble des
                sauvegardes ({files.length}), automatiques et manuelles. Action irréversible.
              </p>
              <p className="text-stone-600">
                La base de données actuelle n&apos;est pas modifiée, mais vous ne pourrez plus
                restaurer d&apos;état antérieur.
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="danger" disabled={busy} onClick={() => void deleteAllBackups()}>
                {busy ? "Suppression..." : "Oui, tout supprimer"}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirmDeleteAll(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingRestore ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Fermer"
            disabled={busy}
            onClick={() => !busy && setPendingRestore(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h2 id="restore-modal-title" className="text-lg font-semibold text-red-800">
              Restaurer une sauvegarde
            </h2>
            <div className="mt-2 space-y-2 text-sm text-stone-700">
              <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-900">
                Cette action est <strong>IRRÉVERSIBLE</strong>. Toutes les entrées, variétés et
                propriétaires actuels seront <strong>définitivement supprimés</strong> et remplacés
                par le contenu de la sauvegarde.
              </p>
              <p className="text-stone-600">
                Les comptes utilisateurs ne sont pas modifiés.
              </p>
              {pendingRestore.kind === "server" ? (
                <p className="text-stone-700">
                  Source : <strong>{pendingRestore.name}</strong>
                  <br />
                  Contenu : {pendingRestore.counts.entries} entrées, {pendingRestore.counts.varieties} variétés, {pendingRestore.counts.owners} propriétaires.
                </p>
              ) : (
                <p className="text-stone-700">
                  Fichier : <strong>{pendingRestore.fileName}</strong>
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="danger" disabled={busy} onClick={() => void performRestore()}>
                {busy ? "Restauration..." : "Oui, remplacer les données"}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setPendingRestore(null)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
