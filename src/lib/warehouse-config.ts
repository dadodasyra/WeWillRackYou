export const WAREHOUSE = {
  rows: ["A", "B", "C", "D", "E", "F", "G", "H"] as const,
  columns: 9,
  levels: 4,
} as const;

export type WarehouseRow = (typeof WAREHOUSE.rows)[number];
