import { WAREHOUSE, type WarehouseRow } from "./warehouse-config";

export type Position = {
  row: WarehouseRow;
  level: number;
  column: number;
};

export function formatPosition(position: Position): string {
  return `${position.row}${position.level}${position.column}`;
}

export function parsePosition(code: string): Position | null {
  const trimmed = code.trim().toUpperCase();
  const match = trimmed.match(/^([A-H])([1-4])([1-9])$/);
  if (!match) return null;

  const row = match[1] as WarehouseRow;
  const level = Number(match[2]);
  const column = Number(match[3]);

  if (!WAREHOUSE.rows.includes(row)) return null;
  if (level < 1 || level > WAREHOUSE.levels) return null;
  if (column < 1 || column > WAREHOUSE.columns) return null;

  return { row, level, column };
}

export function isValidPosition(position: Partial<Position>): position is Position {
  if (!position.row || !position.level || !position.column) return false;
  return (
    WAREHOUSE.rows.includes(position.row) &&
    position.level >= 1 &&
    position.level <= WAREHOUSE.levels &&
    position.column >= 1 &&
    position.column <= WAREHOUSE.columns
  );
}
