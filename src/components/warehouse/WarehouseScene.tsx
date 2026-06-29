"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { WAREHOUSE } from "@/lib/warehouse-config";
import { formatPosition } from "@/lib/position";
import type { SerializedEntry } from "@/lib/validations";

type Props = {
  level: number;
  occupiedMap: Map<string, SerializedEntry>;
  onSlotSelect: (position: string | null, entry?: SerializedEntry) => void;
  compact?: boolean;
};

function Slot({
  row,
  column,
  level,
  occupied,
  entry,
  onSelect,
  compact,
}: {
  row: string;
  column: number;
  level: number;
  occupied: boolean;
  entry?: SerializedEntry;
  onSelect: () => void;
  compact?: boolean;
}) {
  const rowIndex = WAREHOUSE.rows.indexOf(row as (typeof WAREHOUSE.rows)[number]);
  const x = column - 5;
  const z = rowIndex - 3.5;
  const y = (level - 1) * 1.2;
  const size = compact ? 0.7 : 0.85;

  return (
    <mesh position={[x, y, z]} onClick={onSelect}>
      <boxGeometry args={[size, 0.5, size]} />
      <meshStandardMaterial
        color={occupied ? "#15803d" : "#d6d3d1"}
        emissive={occupied ? "#14532d" : "#000000"}
        emissiveIntensity={occupied ? 0.15 : 0}
      />
    </mesh>
  );
}

function WarehouseGrid({ level, occupiedMap, onSlotSelect, compact }: Props) {
  const slots = useMemo(() => {
    const items: ReactNode[] = [];
    for (const row of WAREHOUSE.rows) {
      for (let column = 1; column <= WAREHOUSE.columns; column++) {
        const position = formatPosition({
          row,
          level,
          column,
        });
        const entry = occupiedMap.get(position);
        items.push(
          <Slot
            key={position}
            row={row}
            column={column}
            level={level}
            occupied={!!entry}
            entry={entry}
            compact={compact}
            onSelect={() => onSlotSelect(position, entry)}
          />,
        );
      }
    }
    return items;
  }, [level, occupiedMap, onSlotSelect, compact]);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#f5f5f4" />
      </mesh>
      {slots}
      <OrbitControls
        enablePan
        enableZoom
        minDistance={compact ? 8 : 6}
        maxDistance={compact ? 20 : 25}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

export function WarehouseScene(props: Props) {
  return (
    <div className={props.compact ? "h-64 rounded-xl overflow-hidden" : "h-[50vh] rounded-2xl overflow-hidden border border-stone-200"}>
      <Canvas camera={{ position: [8, 10, 12], fov: 45 }} frameloop="demand">
        <WarehouseGrid {...props} />
      </Canvas>
    </div>
  );
}
