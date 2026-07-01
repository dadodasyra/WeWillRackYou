type Props = {
  id: number;
  dataUrl: string;
};

export function QrLabelSticker({ id, dataUrl }: Props) {
  return (
    <div className="print-label">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`QR code ${id}`} className="print-label-qr" />
      <p className="print-label-id">{id}</p>
    </div>
  );
}
