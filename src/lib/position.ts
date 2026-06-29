import {
  isValidSlot,
  WAREHOUSE,
  type WarehouseRow,
} from "./warehouse-config";

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
  const match = trimmed.match(/^([A-G])([0-2])([1-9])$/);
  if (!match) return null;

  const row = match[1] as WarehouseRow;
  const level = Number(match[2]);
  const column = Number(match[3]);

  if (!isValidSlot(row, level, column)) return null;

  return { row, level, column };
}

export function isValidPosition(position: Partial<Position>): position is Position {
  if (!position.row || position.level === undefined || !position.column) return false;
  return isValidSlot(position.row, position.level, position.column);
}

export { isValidSlot, WAREHOUSE };
