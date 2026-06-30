"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { labelCount, MAX_LABELS } from "@/lib/label-layout";
import { buildEntryQrUrl } from "@/lib/qr";

const PREVIEW_COUNT = 3;

type PreviewLabel = {
  id: number;
  dataUrl: string;
};

function validateRange(from: number, to: number): string | null {
  if (!Number.isInteger(from) || from < 1) {
    return "Indiquez un ID de début valide";
  }
  if (!Number.isInteger(to) || to < 1) {
    return "Indiquez un ID de fin valide";
  }
  if (from > to) {
    return "L'ID de début doit être inférieur ou égal à l'ID de fin";
  }
  if (labelCount(from, to) > MAX_LABELS) {
    return `Maximum ${MAX_LABELS} étiquettes par impression`;
  }
  return null;
}

export default function QrPrintPage() {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<PreviewLabel[]>([]);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    fetch("/api/entries/next-id")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.nextId != null) {
          setFromId(String(data.nextId));
          setToId(String(data.nextId));
        }
      })
      .catch(() => {});
  }, []);

  const from = Number(fromId);
  const to = Number(toId);
  const count =
    Number.isInteger(from) && Number.isInteger(to) && from > 0 && to >= from
      ? labelCount(from, to)
      : 0;

  const rangeValid = count > 0 && count <= MAX_LABELS;

  const sbplUrl = useMemo(() => {
    if (!rangeValid) return null;
    const params = new URLSearchParams({ from: fromId, to: toId });
    return `/api/admin/qr-labels?${params.toString()}`;
  }, [fromId, toId, rangeValid]);

  const pdfUrl = useMemo(() => {
    if (!rangeValid) return null;
    const params = new URLSearchParams({ from: fromId, to: toId });
    return `/api/admin/qr-labels/pdf?${params.toString()}`;
  }, [fromId, toId, rangeValid]);

  const printUrl = useMemo(() => {
    if (!rangeValid) return null;
    const params = new URLSearchParams({ from: fromId, to: toId });
    return `/admin/qr-print/print?${params.toString()}`;
  }, [fromId, toId, rangeValid]);

  const loadPreviews = useCallback(async () => {
    if (!baseUrl || !rangeValid) {
      setPreviews([]);
      return;
    }

    const ids = Array.from(
      { length: Math.min(PREVIEW_COUNT, count) },
      (_, index) => from + index,
    );

    const nextPreviews = await Promise.all(
      ids.map(async (id) => ({
        id,
        dataUrl: await QRCode.toDataURL(buildEntryQrUrl(id, baseUrl), {
          margin: 1,
          width: 160,
          errorCorrectionLevel: "M",
        }),
      })),
    );

    setPreviews(nextPreviews);
  }, [baseUrl, count, from, rangeValid]);

  useEffect(() => {
    loadPreviews();
  }, [loadPreviews]);

  function handleDownloadPdf() {
    setError("");

    const validationError = validateRange(from, to);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (pdfUrl) {
      window.location.href = pdfUrl;
    }
  }

  function handleDownloadSbpl() {
    setError("");

    const validationError = validateRange(from, to);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (sbplUrl) {
      window.location.href = sbplUrl;
    }
  }

  function handleBrowserPrint() {
    setError("");

    const validationError = validateRange(from, to);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (printUrl) {
      window.open(printUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Impression QR</h1>
        <p className="text-sm text-stone-600">
          Génération d&apos;étiquettes pour imprimante SATO CL4NX Plus (80 × 70 mm, 609 dpi)
        </p>
      </header>

      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold">Plage d&apos;identifiants</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="ID début"
            type="number"
            min={1}
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            required
          />
          <Input
            label="ID fin"
            type="number"
            min={1}
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            required
          />
        </div>
        {count > 0 ? (
          <p className="text-sm text-stone-600">
            {count} étiquette{count > 1 ? "s" : ""} à imprimer
          </p>
        ) : null}
        <div className="space-y-2">
          <Button type="button" disabled={!pdfUrl} onClick={handleDownloadPdf}>
            Télécharger PDF (80 × 70 mm)
          </Button>
          <Button type="button" variant="secondary" disabled={!printUrl} onClick={handleBrowserPrint}>
            Imprimer dans le navigateur
          </Button>
          <Button type="button" variant="secondary" disabled={!sbplUrl} onClick={handleDownloadSbpl}>
            Télécharger (.prn SBPL)
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {previews.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold">Aperçu</h2>
          <p className="text-sm text-stone-600">
            Aperçu des {previews.length} premières étiquettes (écran uniquement).
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className="flex flex-col items-center rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.dataUrl}
                  alt={`QR code ${preview.id}`}
                  width={160}
                  height={160}
                  className="bg-white"
                />
                <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900">
                  {preview.id}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
        <h2 className="font-semibold text-stone-800">PDF pour impression à distance (Parsec)</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Téléchargez le <strong>PDF (80 × 70 mm)</strong> — une page = une étiquette raster 609 dpi.</li>
          <li>Transférez le fichier sur le PC relié à l&apos;imprimante (Parsec, e-mail, clé USB…).</li>
          <li>
            Ouvrez le PDF avec <strong>Adobe Acrobat Reader</strong> ou <strong>SumatraPDF</strong> (évitez
            l&apos;aperçu Windows si possible).
          </li>
          <li>Imprimez sur la SATO CL4NX Plus : format <strong>80 × 70 mm</strong>, échelle{" "}
            <strong>Taille réelle / 100 %</strong> (pas « Ajuster »), marges <strong>aucune</strong>.
          </li>
          <li>Testez avec 1 étiquette d&apos;abord.</li>
        </ol>
        <p className="pt-1 text-amber-800">
          N&apos;utilisez pas « Enregistrer en PDF » depuis le navigateur : ce PDF serveur a la bonne
          taille d&apos;étiquette, pas du A4.
        </p>
        <h2 className="pt-2 font-semibold text-stone-800">Impression navigateur (sur le PC imprimante)</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Ouvrez l&apos;app sur le PC relié à l&apos;imprimante (directement ou via Parsec).</li>
          <li>Cliquez sur <strong>Imprimer dans le navigateur</strong>.</li>
          <li>
            Format papier : <strong>80 × 70 mm</strong>. Échelle : <strong>100 %</strong>. Marges :{" "}
            <strong>aucune</strong>.
          </li>
        </ol>
        <h2 className="pt-2 font-semibold text-stone-800">Fichier SBPL (avancé)</h2>
        <p>
          Le téléchargement <code className="text-xs">.prn</code> produit des commandes natives SATO.
          Utile si vous envoyez directement les données à l&apos;imprimante (port réseau 9100).
        </p>
      </section>
    </main>
  );
}
