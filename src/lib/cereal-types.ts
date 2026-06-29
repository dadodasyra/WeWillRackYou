import { CerealType } from "@prisma/client";

export const CEREAL_TYPE_LABELS: Record<CerealType, string> = {
  BLE: "Blé",
  ORGE: "Orge",
  MAIS: "Maïs",
  AVOINE: "Avoine",
  COLZA: "Colza",
  TOURNESOL: "Tournesol",
  POIS: "Pois",
  FEVEROLE: "Féverole",
  AUTRE: "Autre",
};

export const CEREAL_TYPES = Object.keys(CEREAL_TYPE_LABELS) as CerealType[];
