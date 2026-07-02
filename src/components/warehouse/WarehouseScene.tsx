"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { iterWarehouseSlots, WAREHOUSE, type WarehouseRow } from "@/lib/warehouse-config";
import {
  getColumnsForRow,
  getDefaultCamera,
  getFloorBounds,
  getFrontLayoutZ,
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
import { entryMatchesFilters } from "@/lib/entry-filters";
import { getStripedVarietyTexture, getVarietyEmissive } from "@/lib/variety-color";
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
  highlightVarietyId?: string | null;
  highlightYear?: number | null;
  onSlotSelect: (selection: SlotSelection) => void;
  compact?: boolean;
};

const WALL_MAT = {
  color: "#d6d3d1",
  transparent: true,
  opacity: 0.14,
  depthWrite: false,
  side: THREE.DoubleSide as THREE.Side,
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
  entry,
  selected,
  highlightVarietyId,
  highlightYear,
  onSelect,
}: {
  positionCode: string;
  level: number;
  entry?: SerializedEntry;
  selected: boolean;
  highlightVarietyId?: string | null;
  highlightYear?: number | null;
  onSelect: () => void;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const occupied = !!entry;
  const variety = entry?.bigBagVariety ?? null;
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS[0];

  const filterActive = Boolean(highlightVarietyId || highlightYear != null);
  const slotMatchesFilter =
    occupied &&
    entry != null &&
    entryMatchesFilters(entry, {
      varietyId: highlightVarietyId ?? undefined,
      year: highlightYear ?? undefined,
    });
  const showOccupied = occupied && (!filterActive || slotMatchesFilter || selected);
  const isDimmed = filterActive && !selected && !showOccupied;

  const stripeTexture = useMemo(() => {
    if (selected || !variety?.isBarred || isDimmed || !showOccupied) return null;
    return getStripedVarietyTexture(variety.color, true);
  }, [variety, isDimmed, showOccupied, selected]);

  const useStripeMap = !!stripeTexture && !selected;

  useFrame(({ clock }) => {
    if (!selected || !materialRef.current) return;
    materialRef.current.emissiveIntensity =
      Math.sin(clock.elapsedTime * 5) * 0.15 + 0.5;
  });

  const match = positionCode.match(/^([A-G])([0-2])([1-9])$/);
  if (!match) return null;

  const { x, y, z } = getSlotPosition(
    match[1] as WarehouseRow,
    Number(match[3]),
    level,
  );

  let color = showOccupied ? colors.occupied : colors.empty;
  let emissive = showOccupied ? "#14532d" : "#000000";
  let emissiveIntensity = showOccupied ? 0.15 : 0;
  let opacity = showOccupied || selected ? 1 : 0.9;

  if (showOccupied && variety && !isDimmed && !useStripeMap) {
    color = variety.color;
    emissive = getVarietyEmissive(variety.color);
    emissiveIntensity = 0.25;
  }

  if (isDimmed) {
    color = colors.empty;
    emissive = "#000000";
    emissiveIntensity = 0;
    opacity = 0.1;
  }

  if (useStripeMap) {
    color = "#ffffff";
    emissive = "#000000";
    emissiveIntensity = 0;
  }

  if (selected) {
    color = SELECTED_COLOR;
    emissive = SELECTED_EMISSIVE;
    emissiveIntensity = 0.55;
    opacity = 1;
  }

  return (
    <mesh position={[x, y, z]} renderOrder={selected ? 2 : isDimmed ? -1 : 0}>
      <boxGeometry args={[SLOT_SIZE, SLOT_SIZE, SLOT_SIZE]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        map={useStripeMap ? stripeTexture : undefined}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity > 0.35}
      />
      <mesh
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
        <boxGeometry args={[SLOT_SIZE * 1.02, SLOT_SIZE * 1.02, SLOT_SIZE * 1.02]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </mesh>
  );
}

function RowLabels() {
  const { labelZ } = getFrontLayoutZ();

  return (
    <>
      {WAREHOUSE.rows.map((row) => {
        const firstCol = getColumnsForRow(row)[0];
        const { x } = getSlotPosition(row, firstCol, 0);
        return (
          <Text
            key={row}
            position={[x, 0.06, labelZ]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.42}
            color="#44403c"
            anchorX="center"
            anchorY="middle"
            renderOrder={5}
          >
            {row}
          </Text>
        );
      })}
    </>
  );
}

/** Porte personnel - charnière à droite, cadre à deux montants + seuil. */
function FloorPersonnelDoor() {
  const door = getPersonnelDoorPlacement();
  const y = 0.05;
  const { jambLeftX, jambRightX, hingeX, hingeZ, leafLength, jambDepth } = door;

  const arcPoints: [number, number, number][] = [];
  const segments = 16;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * (Math.PI / 2);
    // Part du bout intérieur du vantail (−Z) et revient vers la gauche le long du mur
    arcPoints.push([
      hingeX - Math.sin(angle) * leafLength,
      y,
      hingeZ - Math.cos(angle) * leafLength,
    ]);
  }

  const leafEnd: [number, number, number] = [
    hingeX,
    y,
    hingeZ - leafLength,
  ];

  return (
    <group renderOrder={6}>
      {/* Seuil (linteau au sol, le long de l'ouverture) */}
      <Line
        points={[
          [jambLeftX, y, hingeZ],
          [jambRightX, y, hingeZ],
        ]}
        color="#57534e"
        lineWidth={2}
      />
      {/* Montant gauche (gâche) */}
      <Line
        points={[
          [jambLeftX, y, hingeZ],
          [jambLeftX, y, hingeZ - jambDepth],
        ]}
        color="#57534e"
        lineWidth={2}
      />
      {/* Montant droit (charnière) */}
      <Line
        points={[
          [jambRightX, y, hingeZ],
          [jambRightX, y, hingeZ - jambDepth],
        ]}
        color="#57534e"
        lineWidth={2}
      />
      <Line points={arcPoints} color="#78716c" lineWidth={1.5} />
      <Line
        points={[
          [hingeX, y, hingeZ],
          leafEnd,
        ]}
        color="#44403c"
        lineWidth={2}
      />
    </group>
  );
}

/** Grande porte roulante - sur le bord avant du sol. */
function FloorRollingDoor() {
  const door = getRollingDoorPlacement();
  const y = 0.05;
  const half = door.width / 2;
  const innerOffset = 0.12;

  return (
    <group position={[door.x, y, door.z]} renderOrder={6}>
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
          [-half, 0, -innerOffset],
          [half, 0, -innerOffset],
        ]}
        color="#57534e"
        lineWidth={2.5}
      />
      {[-0.35, -0.15, 0.05, 0.25].map((offset) => (
        <Line
          key={offset}
          points={[
            [offset * door.width, 0, -innerOffset],
            [offset * door.width, 0, 0.02],
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
            <meshStandardMaterial color="#a8a29e" opacity={0.7} transparent depthWrite={false} />
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
  const floor = getFloorBounds();
  const aisleDepth = floor.innerMaxZ - floor.innerMinZ;

  return (
    <>
      {aisles.map(([a, b]) => {
        const x = (getSlotPosition(a, 1, 0).x + getSlotPosition(b, 1, 0).x) / 2;
        return (
          <mesh
            key={`${a}-${b}`}
            position={[x, y, (floor.innerMinZ + floor.innerMaxZ) / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[AISLE_PLANE_WIDTH(a, b), aisleDepth * 0.96]} />
            <meshStandardMaterial color="#d6d3d1" opacity={0.3} transparent depthWrite={false} />
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
  const { maxLevelY } = getWarehouseBounds();
  const floor = getFloorBounds();
  const wallHeight = maxLevelY + 0.5;
  const t = 0.07;
  const zMid = (floor.minZ + floor.maxZ) / 2;

  return (
    <>
      <mesh
        position={[floor.centerX, -0.05, floor.centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[floor.width, floor.depth]} />
        <meshStandardMaterial color="#e7e5e4" />
      </mesh>
      <mesh position={[floor.minX + t / 2, wallHeight / 2, zMid]} renderOrder={-1}>
        <boxGeometry args={[t, wallHeight, floor.depth]} />
        <meshStandardMaterial {...WALL_MAT} />
      </mesh>
      <mesh position={[floor.maxX - t / 2, wallHeight / 2, zMid]} renderOrder={-1}>
        <boxGeometry args={[t, wallHeight, floor.depth]} />
        <meshStandardMaterial {...WALL_MAT} />
      </mesh>
      <mesh position={[floor.centerX, wallHeight / 2, floor.minZ + t / 2]} renderOrder={-1}>
        <boxGeometry args={[floor.width, wallHeight, t]} />
        <meshStandardMaterial {...WALL_MAT} />
      </mesh>
    </>
  );
}

function WarehouseGrid({
  occupiedMap,
  visibleLevels,
  selectedPosition,
  highlightVarietyId,
  highlightYear,
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
          entry={entry}
          selected={selectedPosition === position}
          highlightVarietyId={highlightVarietyId}
          highlightYear={highlightYear}
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
  }, [occupiedMap, onSlotSelect, visibleSet, selectedPosition, highlightVarietyId, highlightYear]);

  return (
    <>
      <CameraSetup target={camera.target} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[centerX + 5, maxLevelY + 8, centerZ + 8]} intensity={1.1} />
      <directionalLight position={[centerX - 3, 4, centerZ - 5]} intensity={0.35} />
      <WallsAndFloor />
      <AisleMarkers />
      <RowPosts />
      {slots}
      <RowLabels />
      <FloorRollingDoor />
      <FloorPersonnelDoor />
      <OrbitControls
        enablePan
        enableZoom
        target={camera.target}
        minDistance={6}
        maxDistance={28}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.2}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
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
            Niv. {level}
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
  highlightVarietyId = null,
  highlightYear = null,
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
      <Canvas
        camera={{ position: camera.position, fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#fafaf9");
        }}
      >
        <WarehouseGrid
          occupiedMap={occupiedMap}
          visibleLevels={visibleLevels}
          selectedPosition={selectedPosition}
          highlightVarietyId={highlightVarietyId}
          highlightYear={highlightYear}
          onSlotSelect={onSlotSelect}
          compact={compact}
        />
      </Canvas>
    </div>
  );
}
