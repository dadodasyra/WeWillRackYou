import { buildEntryQrUrl } from "@/lib/qr";
import {
  DOTS_PER_MM,
  idTextSbplScale,
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
} from "@/lib/label-layout";

const ESC = "\x1B";

export { DOTS_PER_MM, LABEL_WIDTH_MM, LABEL_HEIGHT_MM };

const LABEL_WIDTH_DOTS = LABEL_WIDTH_MM * DOTS_PER_MM;
const LABEL_HEIGHT_DOTS = LABEL_HEIGHT_MM * DOTS_PER_MM;
const H_CENTER = Math.floor(LABEL_WIDTH_DOTS / 2);
const QR_V = 400;
const TEXT_V = 1350;

function padH(value: number): string {
  return String(value).padStart(4, "0");
}

function padV(value: number): string {
  return String(value).padStart(5, "0");
}

function padDataLength(length: number): string {
  return String(length).padStart(4, "0");
}

function generateLabel(id: number, baseUrl: string): string {
  const url = buildEntryQrUrl(id, baseUrl);
  const idText = String(id);

  return [
    `${ESC}A`,
    `${ESC}A1${String(LABEL_HEIGHT_DOTS).padStart(4, "0")}${String(LABEL_WIDTH_DOTS).padStart(4, "0")}`,
    `${ESC}AL5`,
    `${ESC}H${padH(H_CENTER)}`,
    `${ESC}V${padV(QR_V)}`,
    `<2D30>,M,08,1,0${padDataLength(url.length)},${url}`,
    `${ESC}AL8`,
    `${ESC}H${padH(H_CENTER)}`,
    `${ESC}V${padV(TEXT_V)}`,
    `${ESC}RH0,SATOSANS.ttf,0,${idTextSbplScale()},${idTextSbplScale()},${idText}`,
    `${ESC}Q000001`,
    `${ESC}Z`,
  ].join("\r\n");
}

export type QrLabelBatchOptions = {
  from: number;
  to: number;
  baseUrl: string;
};

export function generateQrLabelBatch({ from, to, baseUrl }: QrLabelBatchOptions): Buffer {
  const labels: string[] = [];
  for (let id = from; id <= to; id++) {
    labels.push(generateLabel(id, baseUrl));
  }
  return Buffer.from(labels.join("\r\n"), "latin1");
}
