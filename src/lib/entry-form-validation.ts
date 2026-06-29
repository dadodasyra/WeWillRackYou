import { parsePosition } from "./position";

export type EntryFormField =
  | "manualId"
  | "position"
  | "bigBagVarietyId"
  | "year"
  | "weight"
  | "humidity"
  | "description";

export type EntryFormFieldErrors = Partial<Record<EntryFormField, string>>;

const YEAR_MIN = 1980;
const YEAR_MAX = 2100;
const DESCRIPTION_MAX = 2000;

export function validateManualId(value: string, required: boolean): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return required ? "Indiquez un identifiant valide (numéro du QR code)" : null;
  }
  const id = Number(trimmed);
  if (!Number.isInteger(id) || id <= 0) {
    return "Indiquez un identifiant valide (numéro du QR code)";
  }
  return null;
}

export function validatePosition(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!parsePosition(trimmed)) {
    return "Position invalide (ex. A01, B15)";
  }
  return null;
}

export function validateBigBagVarietyId(value: string, required: boolean): string | null {
  if (!value.trim()) {
    return required ? "Le type de graine est obligatoire" : null;
  }
  return null;
}

export function validateYear(value: string, required: boolean): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return required ? "L'année est obligatoire" : null;
  }
  const year = Number(trimmed);
  if (!Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX) {
    return `Année invalide (${YEAR_MIN}–${YEAR_MAX})`;
  }
  return null;
}

export function validateWeight(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const weight = Number(trimmed);
  if (!Number.isFinite(weight) || weight <= 0) {
    return "Poids invalide (nombre positif)";
  }
  return null;
}

export function validateHumidity(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const humidity = Number(trimmed);
  if (!Number.isFinite(humidity) || humidity < 0 || humidity > 100) {
    return "Humidité invalide (0–100 %)";
  }
  return null;
}

export function validateDescription(value: string): string | null {
  if (value.length > DESCRIPTION_MAX) {
    return `Description trop longue (${DESCRIPTION_MAX} car. max.)`;
  }
  return null;
}

export function hasEntryFormFieldErrors(errors: EntryFormFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
