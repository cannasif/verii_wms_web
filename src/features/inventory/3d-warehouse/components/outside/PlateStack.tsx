import { type ReactElement, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SteelPlacementVisualizationItemDto } from '../../types/warehouse-3d';
import { CantileverRack } from './CantileverRack';
import { SteelPlate } from './SteelPlate';

interface PlateStackProps {
  items: SteelPlacementVisualizationItemDto[];
  position: [number, number, number];
  selectedItemId: number | null;
  onSelectItem: (item: SteelPlacementVisualizationItemDto) => void;
  resolveImageUrl: (url: string | null | undefined) => string | null;
  isExpanded: boolean;
  onRackClick: () => void;
}

const STACKED_PLATE_WIDTH = 1.85;
const STACKED_PLATE_THICKNESS = 0.045;
const STACKED_PLATE_DEPTH = 1.05;
const STACKED_GAP = 0.005;
const STACKED_EXPLODE_GAP = 0.32;

const VERTICAL_PLATE_THICKNESS = 0.06;
const VERTICAL_PLATE_HEIGHT = 1.55;
const VERTICAL_PLATE_DEPTH = 0.95;
const VERTICAL_GAP = 0.018;
const VERTICAL_EXPLODE_GAP = 0.24;

const PALLET_HEIGHT = 0.09;
const RACK_PADDING = 0.28;

interface AnimatedSlotProps {
  normalPos: [number, number, number];
  explodedPos: [number, number, number];
  isExpanded: boolean;
  children: ReactElement;
}

function AnimatedSlot({ normalPos, explodedPos, isExpanded, children }: AnimatedSlotProps): ReactElement {
  const groupRef = useRef<THREE.Group>(null);
  const initialized = useRef(false);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = isExpanded ? explodedPos : normalPos;
    if (!initialized.current) {
      groupRef.current.position.set(target[0], target[1], target[2]);
      initialized.current = true;
      return;
    }
    groupRef.current.position.x += (target[0] - groupRef.current.position.x) * 0.1;
    groupRef.current.position.y += (target[1] - groupRef.current.position.y) * 0.1;
    groupRef.current.position.z += (target[2] - groupRef.current.position.z) * 0.1;
  });

  return <group ref={groupRef}>{children}</group>;
}

export function PlateStack({
  items,
  position,
  selectedItemId,
  onSelectItem,
  resolveImageUrl,
  isExpanded,
  onRackClick,
}: PlateStackProps): ReactElement | null {
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.stackOrderNo ?? 0) - (b.stackOrderNo ?? 0)),
    [items],
  );
  const [palletHovered, setPalletHovered] = useState(false);

  if (sortedItems.length === 0) return null;

  const isVertical = sortedItems[0].placementType === 'SideBySide';
  const slotLabel = `R${sortedItems[0].rowNo ?? 1}/P${sortedItems[0].positionNo ?? 1}`;
  const labelColor = isExpanded ? '#6ee7b7' : '#a5f3fc';
  const labelBg = isExpanded ? 'rgba(6,78,59,0.92)' : 'rgba(8,47,73,0.85)';
  const labelBorder = isExpanded ? 'rgba(52,211,153,0.55)' : 'rgba(34,211,238,0.45)';

  const handlePalletClick = (e: ThreeEvent<MouseEvent>): void => {
    e.stopPropagation();
    onRackClick();
  };
  const handlePalletOver = (e: ThreeEvent<PointerEvent>): void => {
    e.stopPropagation();
    setPalletHovered(true);
    document.body.style.cursor = 'pointer';
  };
  const handlePalletOut = (): void => {
    setPalletHovered(false);
    document.body.style.cursor = 'default';
  };

  if (isVertical) {
    const normalTotalWidth =
      sortedItems.length * VERTICAL_PLATE_THICKNESS +
      Math.max(sortedItems.length - 1, 0) * VERTICAL_GAP;
    const explodedTotalWidth =
      sortedItems.length * VERTICAL_PLATE_THICKNESS +
      Math.max(sortedItems.length - 1, 0) * VERTICAL_EXPLODE_GAP;

    const normalStartX = -normalTotalWidth / 2 + VERTICAL_PLATE_THICKNESS / 2;
    const explodedStartX = -explodedTotalWidth / 2 + VERTICAL_PLATE_THICKNESS / 2;

    const rackWidth = normalTotalWidth + RACK_PADDING * 2;
    const rackDepth = VERTICAL_PLATE_DEPTH + RACK_PADDING * 1.6;
    const rackHeight = VERTICAL_PLATE_HEIGHT + 0.45;

    return (
      <group position={position}>
        <CantileverRack
          width={rackWidth}
          depth={rackDepth}
          height={rackHeight}
          armLevels={0}
          postCount={Math.min(Math.max(sortedItems.length + 1, 2), 6)}
          orientation="vertical"
        />

        <mesh
          position={[0, PALLET_HEIGHT - 0.005, 0]}
          receiveShadow
          castShadow
          onClick={handlePalletClick}
          onPointerOver={handlePalletOver}
          onPointerOut={handlePalletOut}
        >
          <boxGeometry args={[normalTotalWidth + 0.18, 0.012, VERTICAL_PLATE_DEPTH + 0.18]} />
          <meshStandardMaterial
            color={palletHovered || isExpanded ? '#164e63' : '#0f172a'}
            metalness={0.7}
            roughness={0.35}
            emissive={palletHovered || isExpanded ? '#22d3ee' : '#000000'}
            emissiveIntensity={palletHovered ? 0.4 : isExpanded ? 0.28 : 0}
          />
        </mesh>

        {sortedItems.map((item, idx) => {
          const normalX = normalStartX + idx * (VERTICAL_PLATE_THICKNESS + VERTICAL_GAP);
          const explodedX = explodedStartX + idx * (VERTICAL_PLATE_THICKNESS + VERTICAL_EXPLODE_GAP);
          const y = PALLET_HEIGHT + VERTICAL_PLATE_HEIGHT / 2;

          return (
            <AnimatedSlot
              key={item.lineId}
              normalPos={[normalX, y, 0]}
              explodedPos={[explodedX, y, 0]}
              isExpanded={isExpanded}
            >
              <SteelPlate
                item={item}
                position={[0, 0, 0]}
                size={[VERTICAL_PLATE_THICKNESS, VERTICAL_PLATE_HEIGHT, VERTICAL_PLATE_DEPTH]}
                orientation="vertical"
                imageUrl={resolveImageUrl(item.imageUrl)}
                selected={selectedItemId === item.lineId}
                onClick={onSelectItem}
              />
            </AnimatedSlot>
          );
        })}

        <Html
          position={[0, 0.02, VERTICAL_PLATE_DEPTH / 2 + 0.32]}
          center
          distanceFactor={9}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              background: labelBg,
              color: labelColor,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              border: `1px solid ${labelBorder}`,
              whiteSpace: 'nowrap',
            }}
          >
            {slotLabel} · {sortedItems.length}
          </div>
        </Html>
      </group>
    );
  }

  const rackWidth = STACKED_PLATE_WIDTH + RACK_PADDING * 1.4;
  const rackDepth = STACKED_PLATE_DEPTH + RACK_PADDING * 1.4;
  const stackNormalH =
    sortedItems.length * (STACKED_PLATE_THICKNESS + STACKED_GAP);
  const rackHeight = PALLET_HEIGHT + stackNormalH + 0.55;

  return (
    <group position={position}>
      <CantileverRack
        width={rackWidth}
        depth={rackDepth}
        height={rackHeight}
        armLevels={Math.min(Math.max(Math.ceil(sortedItems.length / 4), 1), 4)}
        postCount={2}
        orientation="horizontal"
      />

      <mesh
        position={[0, PALLET_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
        onClick={handlePalletClick}
        onPointerOver={handlePalletOver}
        onPointerOut={handlePalletOut}
      >
        <boxGeometry args={[STACKED_PLATE_WIDTH + 0.18, PALLET_HEIGHT, STACKED_PLATE_DEPTH + 0.18]} />
        <meshStandardMaterial
          color={palletHovered || isExpanded ? '#164e63' : '#3a2917'}
          roughness={0.95}
          metalness={0.05}
          emissive={palletHovered || isExpanded ? '#22d3ee' : '#000000'}
          emissiveIntensity={palletHovered ? 0.28 : isExpanded ? 0.18 : 0}
        />
      </mesh>

      <mesh position={[0, PALLET_HEIGHT * 0.45, STACKED_PLATE_DEPTH / 2 - 0.01]}>
        <boxGeometry args={[STACKED_PLATE_WIDTH * 0.92, 0.025, 0.02]} />
        <meshStandardMaterial color="#241910" roughness={0.95} />
      </mesh>
      <mesh position={[0, PALLET_HEIGHT * 0.45, -STACKED_PLATE_DEPTH / 2 + 0.01]}>
        <boxGeometry args={[STACKED_PLATE_WIDTH * 0.92, 0.025, 0.02]} />
        <meshStandardMaterial color="#241910" roughness={0.95} />
      </mesh>

      {sortedItems.map((item, idx) => {
        const normalY =
          PALLET_HEIGHT +
          STACKED_PLATE_THICKNESS / 2 +
          idx * (STACKED_PLATE_THICKNESS + STACKED_GAP);
        const explodedY =
          PALLET_HEIGHT +
          STACKED_PLATE_THICKNESS / 2 +
          idx * (STACKED_PLATE_THICKNESS + STACKED_EXPLODE_GAP);

        return (
          <AnimatedSlot
            key={item.lineId}
            normalPos={[0, normalY, 0]}
            explodedPos={[0, explodedY, 0]}
            isExpanded={isExpanded}
          >
            <SteelPlate
              item={item}
              position={[0, 0, 0]}
              size={[STACKED_PLATE_WIDTH, STACKED_PLATE_THICKNESS, STACKED_PLATE_DEPTH]}
              orientation="horizontal"
              imageUrl={resolveImageUrl(item.imageUrl)}
              selected={selectedItemId === item.lineId}
              onClick={onSelectItem}
            />
          </AnimatedSlot>
        );
      })}

      <Html
        position={[0, 0.02, STACKED_PLATE_DEPTH / 2 + 0.32]}
        center
        distanceFactor={9}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            padding: '3px 8px',
            borderRadius: '999px',
            background: labelBg,
            color: labelColor,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            border: `1px solid ${labelBorder}`,
            whiteSpace: 'nowrap',
          }}
        >
          {slotLabel} · {sortedItems.length}
        </div>
      </Html>
    </group>
  );
}
