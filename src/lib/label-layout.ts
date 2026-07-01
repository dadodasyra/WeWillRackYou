export const MAX_LABELS = 200;
export const DOTS_PER_MM = 24;
export const LABEL_WIDTH_MM = 80;
export const LABEL_HEIGHT_MM = 70;
export const LABEL_MARGIN_TOP_MM = 6;
export const LABEL_MARGIN_BOTTOM_MM = 6;
export const LABEL_MARGIN_SIDE_MM = 0;
export const LABEL_ID_GAP_MM = 2;
export const QR_SIZE_MM = 52;
export const ID_TEXT_MM = 6;

/** Shift content left to compensate SATO driver horizontal offset. */
export const PRINTER_OFFSET_CORRECTION_MM = 6;

export type LabelContentLayout = {
  qrLeftMm: number;
  qrTopMm: number;
  idBaselineMm: number;
};

export function getLabelContentLayout(): LabelContentLayout {
  const qrLeftMm = (LABEL_WIDTH_MM - QR_SIZE_MM) / 2;
  const qrTopMm = LABEL_MARGIN_TOP_MM;
  const idBaselineMm = LABEL_MARGIN_BOTTOM_MM;

  return { qrLeftMm, qrTopMm, idBaselineMm };
}

export function parseLabelRange(
  fromRaw?: string,
  toRaw?: string,
): { from: number; to: number } | null {
  const from = Number(fromRaw);
  const to = Number(toRaw);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
    return null;
  }
  if (to - from + 1 > MAX_LABELS) {
    return null;
  }
  return { from, to };
}

export function labelCount(from: number, to: number): number {
  return to - from + 1;
}

export function labelWidthPx(): number {
  return Math.round(LABEL_WIDTH_MM * DOTS_PER_MM);
}

export function labelHeightPx(): number {
  return Math.round(LABEL_HEIGHT_MM * DOTS_PER_MM);
}

export function mmToPx(value: number): number {
  return Math.round(value * DOTS_PER_MM);
}
