import {
  getColumnsForRow,
  isFullLengthRow,
  WAREHOUSE,
  type WarehouseRow,
} from "./warehouse-config";

/** Espacement entre colonnes le long de la profondeur (avant → fond). */
export const COLUMN_DEPTH = 1.05;

/** Hauteur d'un emplacement cubique. */
export const SLOT_SIZE = 0.82;

/** Écart entre deux rangées jumelées (ex. B–C, E–F). */
const PAIR_GAP = 0.28;

/** Largeur d'un couloir entre rangées. */
const AISLE_WIDTH = 1.85;

/** Positions X des centres de rangée (calculées pour éviter tout chevauchement). */
function initRowX(): Record<WarehouseRow, number> {
  const x: Record<string, number> = {};
  x.A = 0;
  x.B = x.A + SLOT_SIZE / 2 + AISLE_WIDTH + SLOT_SIZE / 2;
  x.C = x.B + SLOT_SIZE / 2 + PAIR_GAP + SLOT_SIZE / 2;
  x.D = x.C + SLOT_SIZE / 2 + AISLE_WIDTH + SLOT_SIZE / 2;
  x.E = x.D + SLOT_SIZE / 2 + AISLE_WIDTH + SLOT_SIZE / 2;
  x.F = x.E + SLOT_SIZE / 2 + PAIR_GAP + SLOT_SIZE / 2;
  x.G = x.F + SLOT_SIZE / 2 + AISLE_WIDTH + SLOT_SIZE / 2;
  return x as Record<WarehouseRow, number>;
}

const ROW_POSITIONS = initRowX();

export function getRowX(row: WarehouseRow): number {
  return ROW_POSITIONS[row];
}

/** Colonne 1 = devant (proche observateur), colonne 9 = vers le fond. */
export function getColumnZ(column: number): number {
  return -(column - 1) * COLUMN_DEPTH;
}

/** Niveau 0 = rez-de-chaussée. */
export function getLevelY(level: number): number {
  return level * SLOT_SIZE + SLOT_SIZE / 2;
}

export function getSlotPosition(row: WarehouseRow, column: number, level: number) {
  return {
    x: getRowX(row),
    y: getLevelY(level),
    z: getColumnZ(column),
  };
}

export function getAisleCenterX(between: [WarehouseRow, WarehouseRow]): number {
  return (getRowX(between[0]) + getRowX(between[1])) / 2;
}

export function getWarehouseBounds() {
  const floor = getFloorBounds();
  const xs = WAREHOUSE.rows.map(getRowX);
  const minX = Math.min(...xs) - SLOT_SIZE / 2 - 0.3;
  const maxX = Math.max(...xs) + SLOT_SIZE / 2 + 0.3;
  const minZ = getColumnZ(WAREHOUSE.fullColumns) - SLOT_SIZE / 2 - 0.3;
  const maxZ = SLOT_SIZE / 2 + 1.0;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const maxLevelY = getLevelY(WAREHOUSE.levels[WAREHOUSE.levels.length - 1]) + SLOT_SIZE / 2;

  return { minX, maxX, minZ, maxZ, centerX, centerZ, maxLevelY, floor };
}

/** Limites du sol (portes et murs alignés sur ces bords). */
export function getFloorBounds() {
  const xs = WAREHOUSE.rows.map(getRowX);
  const innerMinX = Math.min(...xs) - SLOT_SIZE / 2;
  const innerMaxX = Math.max(...xs) + SLOT_SIZE / 2;
  const innerMinZ = getColumnZ(WAREHOUSE.fullColumns) - SLOT_SIZE / 2;
  const innerMaxZ = getColumnZ(1) + SLOT_SIZE / 2;
  const padX = 0.4;
  const padBack = 0.4;
  const padFront = 0.42;

  const minX = innerMinX - padX;
  const maxX = innerMaxX + padX;
  const minZ = innerMinZ - padBack;
  const maxZ = innerMaxZ + padFront;

  return {
    innerMinX,
    innerMaxX,
    innerMinZ,
    innerMaxZ,
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

export function getDefaultCamera() {
  const { centerX, centerZ, maxLevelY, minZ } = getWarehouseBounds();
  return {
    position: [centerX, maxLevelY + 7, centerZ + 12] as [number, number, number],
    target: [centerX, maxLevelY / 2, minZ / 2] as [number, number, number],
  };
}

/** Positions Z avant : lettres entre rangées et portes (observateur = +Z). */
export function getFrontLayoutZ() {
  const floor = getFloorBounds();
  const frontGap = floor.maxZ - floor.innerMaxZ;
  return {
    labelZ: floor.innerMaxZ + frontGap * 0.42,
    doorZ: floor.maxZ,
  };
}

/** Porte personnel — couloir F–G, charnière à droite. */
export function getPersonnelDoorPlacement() {
  const aisleX = getAisleCenterX(["F", "G"]);
  const { doorZ } = getFrontLayoutZ();
  const width = 0.85;
  const jambLeftX = aisleX - width / 2;
  const jambRightX = aisleX + width / 2;
  return {
    jambLeftX,
    jambRightX,
    hingeX: jambRightX,
    hingeZ: doorZ,
    width,
    leafLength: width * 0.92,
    jambDepth: 0.18,
  };
}

/** Grande porte roulante — bord avant du sol, entre C et D. */
export function getRollingDoorPlacement() {
  const aisleX = getAisleCenterX(["C", "D"]);
  const { doorZ } = getFrontLayoutZ();
  const floor = getFloorBounds();
  const spanX = (floor.innerMaxX - floor.innerMinX) * 0.2;
  return { x: aisleX, z: doorZ, width: spanX };
}

export function getPostDividerZ(leftColumn: number, rightColumn: number): number {
  return (getColumnZ(leftColumn) + getColumnZ(rightColumn)) / 2;
}

export function getPostDividersForRow(row: WarehouseRow): number[] {
  const cols = getColumnsForRow(row);
  const positions: number[] = [];
  for (let i = 2; i < cols.length - 1; i += 3) {
    positions.push(getPostDividerZ(cols[i], cols[i + 1]));
  }
  return positions;
}

export const LEVEL_COLORS: Record<number, { occupied: string; empty: string }> = {
  0: { occupied: "#15803d", empty: "#d6d3d1" },
  1: { occupied: "#166534", empty: "#e7e5e4" },
  2: { occupied: "#14532d", empty: "#f5f5f4" },
};

export const SELECTED_COLOR = "#f59e0b";
export const SELECTED_EMISSIVE = "#d97706";

export { getColumnsForRow, isFullLengthRow };
