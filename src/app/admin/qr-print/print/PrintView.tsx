"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { QrLabelSticker } from "@/components/admin/QrLabelSticker";
import { buildEntryQrUrl } from "@/lib/qr";
import { labelCount } from "@/lib/label-layout";
import "./print.css";

const QR_PIXEL_SIZE = 1280;

type Label = {
  id: number;
  dataUrl: string;
};

type Props = {
  from: number;
  to: number;
  baseUrl: string;
};

export function PrintView({ from, to, baseUrl }: Props) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printedRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.add("qr-print-active");
    return () => {
      document.documentElement.classList.remove("qr-print-active");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const ids = Array.from({ length: labelCount(from, to) }, (_, index) => from + index);
        const nextLabels = await Promise.all(
          ids.map(async (id) => ({
            id,
            dataUrl: await QRCode.toDataURL(buildEntryQrUrl(id, baseUrl), {
              margin: 1,
              width: QR_PIXEL_SIZE,
              errorCorrectionLevel: "M",
            }),
          })),
        );

        if (!cancelled) {
          setLabels(nextLabels);
        }
      } catch {
        if (!cancelled) {
          setError("Impossible de générer les étiquettes.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [from, to, baseUrl]);

  useEffect(() => {
    if (labels.length === 0 || printedRef.current) return;
    printedRef.current = true;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [labels]);

  if (loading) {
    return (
      <div className="print-toolbar">
        <p className="text-stone-700">Préparation de {labelCount(from, to)} étiquettes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="print-toolbar">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="print-toolbar">
        <p className="text-stone-700">
          {labels.length} étiquette{labels.length > 1 ? "s" : ""} prêtes.
        </p>
        <Button type="button" className="max-w-xs" onClick={() => window.print()}>
          Imprimer
        </Button>
        <p className="max-w-sm text-sm text-stone-500">
          Imprimante SATO, format 80 × 70 mm, échelle 100 %, marges aucune.
        </p>
      </div>

      <div className="print-sheet">
        {labels.map((label) => (
          <QrLabelSticker
            key={label.id}
            id={label.id}
            dataUrl={label.dataUrl}
            qrPixelSize={QR_PIXEL_SIZE}
          />
        ))}
      </div>
    </>
  );
}
