import { PDFDocument, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import sharp from "sharp";
import {
  getLabelContentLayout,
  ID_TEXT_MM,
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
  labelHeightPx,
  labelWidthPx,
  mmToPx,
  QR_SIZE_MM,
} from "@/lib/label-layout";
import { buildEntryQrUrl } from "@/lib/qr";

const MM_TO_PT = 72 / 25.4;

function mm(value: number): number {
  return value * MM_TO_PT;
}

async function renderLabelRaster(id: number, baseUrl: string): Promise<Buffer> {
  const url = buildEntryQrUrl(id, baseUrl);
  const layout = getLabelContentLayout();
  const widthPx = labelWidthPx();
  const heightPx = labelHeightPx();
  const qrSizePx = mmToPx(QR_SIZE_MM);
  const qrLeftPx = mmToPx(layout.qrLeftMm);
  const qrTopPx = mmToPx(layout.qrTopMm);
  const idText = String(id);
  const idFontPx = mmToPx(ID_TEXT_MM);
  const idY = heightPx - mmToPx(layout.idBaselineMm);

  const qrPng = await QRCode.toBuffer(url, {
    type: "png",
    width: qrSizePx,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const idSvg = Buffer.from(
    `<svg width="${widthPx}" height="${heightPx}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${widthPx / 2}"
        y="${idY}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${idFontPx}"
        font-weight="700"
        fill="#000000"
      >${idText}</text>
    </svg>`,
  );

  return sharp({
    create: {
      width: widthPx,
      height: heightPx,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: qrPng, top: qrTopPx, left: qrLeftPx },
      { input: idSvg, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

function configureLabelPage(page: PDFPage, pageWidth: number, pageHeight: number) {
  page.setMediaBox(0, 0, pageWidth, pageHeight);
  page.setCropBox(0, 0, pageWidth, pageHeight);
  page.setBleedBox(0, 0, pageWidth, pageHeight);
  page.setTrimBox(0, 0, pageWidth, pageHeight);
}

export type QrLabelPdfOptions = {
  from: number;
  to: number;
  baseUrl: string;
};

export async function generateQrLabelPdf({
  from,
  to,
  baseUrl,
}: QrLabelPdfOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`QR labels ${from}-${to}`);
  pdf.setProducer("WeWillRackYou");
  pdf.setCreator("WeWillRackYou");

  const pageWidth = mm(LABEL_WIDTH_MM);
  const pageHeight = mm(LABEL_HEIGHT_MM);

  for (let id = from; id <= to; id++) {
    const labelPng = await renderLabelRaster(id, baseUrl);
    const page = pdf.addPage([pageWidth, pageHeight]);
    configureLabelPage(page, pageWidth, pageHeight);

    const image = await pdf.embedPng(labelPng);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  return pdf.save({ useObjectStreams: false });
}
