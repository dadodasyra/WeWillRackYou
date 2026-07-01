import { PRINTER_OFFSET_CORRECTION_MM } from "@/lib/label-layout";

type Props = {
  id: number;
  dataUrl: string;
  correctPrinterOffset?: boolean;
};

export function QrLabelSticker({ id, dataUrl, correctPrinterOffset = false }: Props) {
  return (
    <div className="print-label">
      <div
        className="print-label-content"
        style={
          correctPrinterOffset
            ? { transform: `translateX(-${PRINTER_OFFSET_CORRECTION_MM}mm)` }
            : undefined
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={`QR code ${id}`} className="print-label-qr" />
        <p className="print-label-id">{id}</p>
      </div>
    </div>
  );
}
