export const WAREHOUSE = {
  rows: ["A", "B", "C", "D", "E", "F", "G"] as const,
  levels: [0, 1, 2] as const,
  fullColumns: 9,
} as const;

export type WarehouseRow = (typeof WAREHOUSE.rows)[number];
export type WarehouseLevel = (typeof WAREHOUSE.levels)[number];

const FULL_LENGTH_ROWS = new Set<WarehouseRow>(["A", "G"]);
const OFFSET_ONE_ROWS = new Set<WarehouseRow>(["B", "C", "E", "F"]);
const OFFSET_TWO_ROWS = new Set<WarehouseRow>(["D"]);

export function isFullLengthRow(row: WarehouseRow): boolean {
  return FULL_LENGTH_ROWS.has(row);
}

export function getColumnsForRow(row: WarehouseRow): number[] {
  if (isFullLengthRow(row)) {
    return Array.from({ length: WAREHOUSE.fullColumns }, (_, i) => i + 1);
  }
  if (OFFSET_TWO_ROWS.has(row)) {
    return [3, 4, 5, 6, 7, 8];
  }
  if (OFFSET_ONE_ROWS.has(row)) {
    return [2, 3, 4, 5, 6, 7];
  }
  return [];
}

export function isValidSlot(row: WarehouseRow, level: number, column: number): boolean {
  if (!WAREHOUSE.rows.includes(row)) return false;
  if (!WAREHOUSE.levels.includes(level as WarehouseLevel)) return false;
  return getColumnsForRow(row).includes(column);
}

export function* iterWarehouseSlots() {
  for (const row of WAREHOUSE.rows) {
    for (const level of WAREHOUSE.levels) {
      for (const column of getColumnsForRow(row)) {
        yield { row, level, column };
      }
    }
  }
}
