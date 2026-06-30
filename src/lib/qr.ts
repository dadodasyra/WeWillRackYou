export function buildEntryQrUrl(id: number, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/entry/${id}`;
}
