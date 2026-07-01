"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QrLabelSticker } from "@/components/admin/QrLabelSticker";
import { labelCount, MAX_LABELS } from "@/lib/label-layout";
import { buildEntryQrUrl } from "@/lib/qr";
import "./print/print.css";

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
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const rangeParams = useMemo(() => {
    if (!rangeValid) return null;
    return new URLSearchParams({ from: fromId, to: toId });
  }, [fromId, toId, rangeValid]);

  const printUrl = rangeParams ? `/admin/qr-print/print?${rangeParams.toString()}` : null;
  const pdfUrl = rangeParams ? `/api/admin/qr-labels/pdf?${rangeParams.toString()}` : null;
  const sbplUrl = rangeParams ? `/api/admin/qr-labels?${rangeParams.toString()}` : null;

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
          width: 520,
          errorCorrectionLevel: "M",
        }),
      })),
    );

    setPreviews(nextPreviews);
  }, [baseUrl, count, from, rangeValid]);

  useEffect(() => {
    loadPreviews();
  }, [loadPreviews]);

  function runValidated(action: (url: string) => void, url: string | null) {
    setError("");
    const validationError = validateRange(from, to);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (url) action(url);
  }

  function handlePrint() {
    runValidated((url) => window.open(url, "_blank", "noopener,noreferrer"), printUrl);
  }

  function handleDownload(url: string | null) {
    runValidated((target) => {
      window.location.href = target;
    }, url);
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Impression QR</h1>
        <p className="text-sm text-stone-600">
          Étiquettes 80 × 70 mm pour imprimante SATO (via driver Windows)
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
          <Button type="button" disabled={!printUrl} onClick={handlePrint}>
            Imprimer les étiquettes
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {previews.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold">Aperçu</h2>
          <p className="text-sm text-stone-600">
            Même mise en page que l&apos;impression.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {previews.map((preview) => (
              <div key={preview.id} className="print-preview-frame">
                <QrLabelSticker
                  id={preview.id}
                  dataUrl={preview.dataUrl}
                  qrPixelSize={520}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
        <h2 className="font-semibold text-stone-800">Impression (PC relié à l&apos;imprimante)</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Ouvrez cette page sur le PC branché en USB à la SATO.</li>
          <li>Cliquez sur <strong>Imprimer les étiquettes</strong>.</li>
          <li>
            Imprimante : <strong>SATO CL4NX Plus</strong> - format <strong>80 × 70 mm</strong>,
            échelle <strong>100 %</strong>, marges <strong>aucune</strong>.
          </li>
          <li>Commencez par 1 étiquette pour vérifier l&apos;alignement.</li>
        </ol>
        <p className="pt-1 text-stone-500">
          Configuration initiale (une fois) : dans les propriétés de l&apos;imprimante Windows,
          enregistrez ces réglages comme format par défaut.
        </p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-stone-800"
          onClick={() => setShowAdvanced((open) => !open)}
          aria-expanded={showAdvanced}
        >
          Options avancées
          <span className="text-stone-400">{showAdvanced ? "▲" : "▼"}</span>
        </button>
        {showAdvanced ? (
          <div className="space-y-2 border-t border-stone-200 px-4 pb-4 pt-3">
            <p className="text-sm text-stone-600">
              Réservé aux cas particuliers. L&apos;impression navigateur reste la méthode
              recommandée avec un driver Windows USB.
            </p>
            <Button
              type="button"
              variant="secondary"
              disabled={!pdfUrl}
              onClick={() => handleDownload(pdfUrl)}
            >
              Télécharger PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!sbplUrl}
              onClick={() => handleDownload(sbplUrl)}
            >
              Télécharger SBPL (.prn)
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
