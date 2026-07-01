type Props = {
  id: number;
  dataUrl: string;
  qrPixelSize?: number;
};

export function QrLabelSticker({ id, dataUrl, qrPixelSize = 1280 }: Props) {
  return (
    <div className="print-label">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`QR code ${id}`}
        className="print-label-qr"
        width={qrPixelSize}
        height={qrPixelSize}
      />
      <p className="print-label-id">{id}</p>
    </div>
  );
}
