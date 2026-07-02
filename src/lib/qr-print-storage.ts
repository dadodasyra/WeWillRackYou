const LAST_RANGE_STORAGE_KEY = "qr-print-last-range";

export type SavedQrPrintRange = {
  from: number;
  to: number;
  printedAt: string;
};

export function saveLastQrPrintRange(from: number, to: number): void {
  if (typeof window === "undefined") return;
  const payload: SavedQrPrintRange = {
    from,
    to,
    printedAt: new Date().toISOString(),
  };
  localStorage.setItem(LAST_RANGE_STORAGE_KEY, JSON.stringify(payload));
}

export function loadLastQrPrintRange(): SavedQrPrintRange | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_RANGE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedQrPrintRange;
    if (
      !Number.isInteger(data.from) ||
      !Number.isInteger(data.to) ||
      data.from < 1 ||
      data.to < data.from ||
      typeof data.printedAt !== "string"
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function formatLastQrPrintRange(range: SavedQrPrintRange): string {
  const count = range.to - range.from + 1;
  const when = new Date(range.printedAt).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const labels = count === 1 ? "étiquette" : "étiquettes";
  return `#${range.from} – #${range.to} (${count} ${labels}) · ${when}`;
}
