"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { iterWarehouseSlots, WAREHOUSE, type WarehouseRow } from "@/lib/warehouse-config";
import {
  getColumnsForRow,
  getDefaultCamera,
  getPersonnelDoorPlacement,
  getPostDividersForRow,
  getRollingDoorPlacement,
  getRowX,
  getSlotPosition,
  getWarehouseBounds,
  LEVEL_COLORS,
  SELECTED_COLOR,
  SELECTED_EMISSIVE,
  SLOT_SIZE,
} from "@/lib/warehouse-layout";
import { formatPosition } from "@/lib/position";
import type { SerializedEntry } from "@/lib/validations";

export type SlotSelection = {
  position: string;
  entry?: SerializedEntry;
  level: number;
};

type Props = {
  occupiedMap: Map<string, SerializedEntry>;
  visibleLevels?: number[];
  selectedPosition?: string | null;
  onSlotSelect: (selection: SlotSelection) => void;
  compact?: boolean;
};

function CameraSetup({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

function Slot({
  positionCode,
  level,
  occupied,
  selected,
  onSelect,
}: {
  positionCode: string;
  level: number;
  occupied: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS[0];

  const match = positionCode.match(/^([A-G])([0-2])([1-9])$/);
  if (!match) return null;

  const { x, y, z } = getSlotPosition(
    match[1] as WarehouseRow,
    Number(match[3]),
    level,
  );

  let color = occupied ? colors.occupied : colors.empty;
  let emissive = occupied ? "#14532d" : "#000000";
  let emissiveIntensity = occupied ? 0.15 : 0;

  if (selected) {
    color = SELECTED_COLOR;
    emissive = SELECTED_EMISSIVE;
    emissiveIntensity = 0.45;
  }

  return (
    <mesh
      position={[x, y, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <boxGeometry args={[SLOT_SIZE, SLOT_SIZE, SLOT_SIZE]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={!occupied && !selected}
        opacity={occupied || selected ? 1 : 0.9}
      />
    </mesh>
  );
}

function RowLabels() {
  const { maxZ } = getWarehouseBounds();
  const labelZ = maxZ + 0.4;

  return (
    <>
      {WAREHOUSE.rows.map((row) => {
        const firstCol = getColumnsForRow(row)[0];
        const { x } = getSlotPosition(row, firstCol, 0);
        return (
          <Text
            key={row}
            position={[x, 0.04, labelZ]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.42}
            color="#44403c"
            anchorX="center"
            anchorY="middle"
          >
            {row}
          </Text>
        );
      })}
    </>
  );
}

/** Symbole de porte au sol — ouverture vers l'intérieur (-Z). */
function FloorPersonnelDoor() {
  const door = getPersonnelDoorPlacement();
  const y = 0.04;
  const hingeX = door.x + door.width / 2;
  const hingeZ = door.z;
  const leafLength = door.width * 0.9;

  const arcPoints: [number, number, number][] = [];
  const segments = 14;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * (Math.PI / 2);
    arcPoints.push([
      hingeX - Math.sin(angle) * leafLength,
      y,
      hingeZ - Math.cos(angle) * leafLength,
    ]);
  }

  const leafEndX = hingeX - Math.sin(Math.PI / 2.2) * leafLength;
  const leafEndZ = hingeZ - Math.cos(Math.PI / 2.2) * leafLength;

  return (
    <group>
      <Line
        points={[
          [hingeX, y, hingeZ - door.width / 2],
          [hingeX, y, hingeZ + door.width / 2],
        ]}
        color="#57534e"
        lineWidth={2}
      />
      <Line points={arcPoints} color="#78716c" lineWidth={1.5} />
      <Line
        points={[
          [hingeX, y, hingeZ],
          [leafEndX, y, leafEndZ],
        ]}
        color="#44403c"
        lineWidth={2}
      />
    </group>
  );
}

/** Grande porte roulante — marquage au sol sur le mur avant, entre C et D. */
function FloorRollingDoor() {
  const door = getRollingDoorPlacement();
  const y = 0.035;
  const half = door.width / 2;

  return (
    <group position={[door.x, y, door.z]}>
      <Line
        points={[
          [-half, 0, 0],
          [half, 0, 0],
        ]}
        color="#57534e"
        lineWidth={2.5}
      />
      <Line
        points={[
          [-half, 0, -0.12],
          [half, 0, -0.12],
        ]}
        color="#57534e"
        lineWidth={2.5}
      />
      {[-0.35, -0.15, 0.05, 0.25].map((offset) => (
        <Line
          key={offset}
          points={[
            [offset * door.width, 0, -0.12],
            [offset * door.width, 0, 0.08],
          ]}
          color="#a8a29e"
          lineWidth={1.5}
        />
      ))}
    </group>
  );
}

function RowPosts() {
  const { maxLevelY } = getWarehouseBounds();
  const postHeight = maxLevelY + 0.15;

  return (
    <>
      {WAREHOUSE.rows.map((row) => {
        const x = getRowX(row);
        return getPostDividersForRow(row).map((z) => (
          <mesh key={`${row}-${z}`} position={[x, postHeight / 2, z]}>
            <boxGeometry args={[0.1, postHeight, 0.1]} />
            <meshStandardMaterial color="#a8a29e" opacity={0.7} transparent />
          </mesh>
        ));
      })}
    </>
  );
}

function AisleMarkers() {
  const y = 0.02;
  const aisles: [WarehouseRow, WarehouseRow][] = [
    ["A", "B"],
    ["C", "D"],
    ["D", "E"],
    ["F", "G"],
  ];
  const { minZ, maxZ } = getWarehouseBounds();

  return (
    <>
      {aisles.map(([a, b]) => {
        const x = (getSlotPosition(a, 1, 0).x + getSlotPosition(b, 1, 0).x) / 2;
        return (
          <mesh key={`${a}-${b}`} position={[x, y, (minZ + maxZ) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[AISLE_PLANE_WIDTH(a, b), Math.abs(maxZ - minZ) * 0.92]} />
            <meshStandardMaterial color="#d6d3d1" opacity={0.35} transparent />
          </mesh>
        );
      })}
    </>
  );
}

function AISLE_PLANE_WIDTH(a: WarehouseRow, b: WarehouseRow): number {
  return Math.abs(getSlotPosition(b, 1, 0).x - getSlotPosition(a, 1, 0).x) * 0.55;
}

function WallsAndFloor() {
  const { minX, maxX, minZ, maxZ, centerX, centerZ, maxLevelY } = getWarehouseBounds();
  const wallHeight = maxLevelY + 0.5;
  const floorW = maxX - minX + 2;
  const floorD = maxZ - minZ + 1.5;
  const wallMat = { color: "#d6d3d1", transparent: true, opacity: 0.22 };
  const trim = 0.4;

  return (
    <>
      <mesh position={[centerX, -0.05, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[floorW, floorD]} />
        <meshStandardMaterial color="#e7e5e4" />
      </mesh>
      <mesh position={[minX - 0.25, wallHeight / 2, centerZ]}>
        <boxGeometry args={[0.08, wallHeight, floorD - trim * 2]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      <mesh position={[maxX + 0.25, wallHeight / 2, centerZ]}>
        <boxGeometry args={[0.08, wallHeight, floorD - trim * 2]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      <mesh position={[centerX, wallHeight / 2, minZ - 0.25]}>
        <boxGeometry args={[floorW - trim * 2, wallHeight, 0.08]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
    </>
  );
}

function WarehouseGrid({
  occupiedMap,
  visibleLevels,
  selectedPosition,
  onSlotSelect,
}: Props) {
  const visibleSet = useMemo(() => new Set(visibleLevels), [visibleLevels]);
  const { centerX, centerZ, maxLevelY } = getWarehouseBounds();
  const camera = getDefaultCamera();

  const slots = useMemo(() => {
    const items: ReactNode[] = [];
    for (const { row, level, column } of iterWarehouseSlots()) {
      if (!visibleSet.has(level)) continue;

      const position = formatPosition({ row, level, column });
      const entry = occupiedMap.get(position);
      items.push(
        <Slot
          key={position}
          positionCode={position}
          level={level}
          occupied={!!entry}
          selected={selectedPosition === position}
          onSelect={() =>
            onSlotSelect({
              position,
              entry,
              level,
            })
          }
        />,
      );
    }
    return items;
  }, [occupiedMap, onSlotSelect, visibleSet, selectedPosition]);

  return (
    <>
      <CameraSetup target={camera.target} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[centerX + 5, maxLevelY + 8, centerZ + 8]} intensity={1.1} />
      <directionalLight position={[centerX - 3, 4, centerZ - 5]} intensity={0.35} />
      <WallsAndFloor />
      <AisleMarkers />
      <RowPosts />
      <FloorRollingDoor />
      <FloorPersonnelDoor />
      <RowLabels />
      {slots}
      <OrbitControls
        enablePan
        enableZoom
        target={camera.target}
        minDistance={6}
        maxDistance={28}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.2}
      />
    </>
  );
}

export function LevelLegend({
  visibleLevels,
  onToggle,
}: {
  visibleLevels: number[];
  onToggle: (level: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {WAREHOUSE.levels.map((level) => {
        const active = visibleLevels.includes(level);
        const color = LEVEL_COLORS[level]?.occupied ?? "#15803d";
        return (
          <button
            key={level}
            type="button"
            onClick={() => onToggle(level)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-white border border-stone-300 text-stone-800 shadow-sm"
                : "bg-stone-100 text-stone-400 line-through"
            }`}
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: active ? color : "#d6d3d1" }}
            />
            Niveau {level}
          </button>
        );
      })}
    </div>
  );
}

export function WarehouseScene({
  occupiedMap,
  visibleLevels = [0, 1, 2],
  selectedPosition,
  onSlotSelect,
  compact,
}: Props) {
  const camera = getDefaultCamera();

  return (
    <div
      className={
        compact
          ? "h-72 rounded-xl overflow-hidden border border-stone-200"
          : "h-[55vh] rounded-2xl overflow-hidden border border-stone-200"
      }
    >
      <Canvas camera={{ position: camera.position, fov: 42 }}>
        <WarehouseGrid
          occupiedMap={occupiedMap}
          visibleLevels={visibleLevels}
          selectedPosition={selectedPosition}
          onSlotSelect={onSlotSelect}
          compact={compact}
        />
      </Canvas>
    </div>
  );
}
