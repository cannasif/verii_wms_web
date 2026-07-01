import { type ReactElement, useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Bin3D } from './Bin3D';
import type { WarehouseSlot as WarehouseSlotType } from '../types/warehouse-3d';
import type { Warehouse3dSceneTheme } from '../utils/warehouse-3d-scene-theme';
import { LAYOUT_CONSTANTS } from '../utils/layout-engine';
import * as THREE from 'three';

interface Shelf3DProps {
  row: string;
  column: number;
  slots: WarehouseSlotType[];
  position: { x: number; z: number };
  selected: boolean;
  showLabels: boolean;
  onSelect: () => void;
  onBinHover: (slot: WarehouseSlotType | null) => void;
  onBinClick: (slot: WarehouseSlotType | null) => void;
  clickedBin: WarehouseSlotType | null;
  sceneTheme: Warehouse3dSceneTheme;
}

const SLOT_WIDTH = LAYOUT_CONSTANTS.SHELF_WIDTH;
const SLOT_HEIGHT = LAYOUT_CONSTANTS.LEVEL_HEIGHT * 0.9;
const SHELF_DEPTH = LAYOUT_CONSTANTS.SHELF_DEPTH;
const POST_THICKNESS = 0.04;
const BASE_HEIGHT = 0.1;
const LEVEL_GAP = LAYOUT_CONSTANTS.LEVEL_HEIGHT * 0.1;
const HORIZONTAL_PADDING = 0.05;
const VERTICAL_PADDING = 0.05;
const BACK_PANEL_THICKNESS = 0.02;

export function Shelf3D({ 
  row, 
  column, 
  slots, 
  position, 
  selected, 
  showLabels, 
  onSelect, 
  onBinHover, 
  onBinClick, 
  clickedBin,
  sceneTheme,
}: Shelf3DProps): ReactElement {
  const binOutlineRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  
  const { levelCount, shelfWidth, shelfHeight } = useMemo(() => {
    const maxLevel = Math.max(...slots.map(s => {
      const match = s.hucreKodu.match(/\d+$/);
      return match ? parseInt(match[0].slice(-1), 10) : 0;
    }), 0);
    const levels = maxLevel + 1;
    const contentW = SLOT_WIDTH;
    const contentH = levels * SLOT_HEIGHT + (levels - 1) * LEVEL_GAP;
    const shelfW = contentW + 2 * HORIZONTAL_PADDING;
    const shelfH = contentH + BASE_HEIGHT + VERTICAL_PADDING;
    
    return { levelCount: levels, shelfWidth: shelfW, shelfHeight: shelfH };
  }, [slots]);

  const bins = useMemo(() => {
    return slots.map((slot) => {
      const match = slot.hucreKodu.match(/\d+$/);
      const level = match ? parseInt(match[0].slice(-1), 10) : 0;
      const x = 0;
      const y = level * (SLOT_HEIGHT + LEVEL_GAP) + BASE_HEIGHT + VERTICAL_PADDING / 2 + SLOT_HEIGHT / 2;
      return { ...slot, localX: x, localY: y };
    });
  }, [slots]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (clickedBin) {
      const binMesh = binOutlineRefs.current.get(clickedBin.hucreKodu);
      if (binMesh) {
        const material = binMesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.5 + Math.sin(time * 5) * 0.3;
        const scale = 1.0 + Math.sin(time * 6) * 0.03;
        binMesh.scale.set(scale, scale, scale);
      }
    }
  });

  const label = `${row}${column.toString().padStart(2, '0')}`;

  return (
    <group position={[position.x, 0, position.z]} onClick={onSelect}>
      {showLabels && (
        <Html 
          position={[0, shelfHeight + 0.15, 0]} 
          center 
          distanceFactor={5} 
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: selected ? sceneTheme.label.bgSelected : sceneTheme.label.bg,
              color: sceneTheme.label.text,
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: selected ? `2px solid ${sceneTheme.label.borderSelected}` : `1px solid ${sceneTheme.label.border}`,
              boxShadow: selected ? `0 0 16px ${sceneTheme.label.borderSelected}` : '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {label}
          </div>
        </Html>
      )}

      <mesh position={[0, BASE_HEIGHT / 2, 0]}>
        <boxGeometry args={[shelfWidth, BASE_HEIGHT, SHELF_DEPTH]} />
        <meshStandardMaterial color={sceneTheme.shelf.base} metalness={0.65} roughness={0.35} />
      </mesh>

      {Array.from({ length: 4 }).map((_, i) => {
        const x = i < 2 ? -shelfWidth / 2 + POST_THICKNESS / 2 : shelfWidth / 2 - POST_THICKNESS / 2;
        const z = i % 2 === 0 ? -SHELF_DEPTH / 2 + POST_THICKNESS / 2 : SHELF_DEPTH / 2 - POST_THICKNESS / 2;
        return (
          <mesh key={i} position={[x, shelfHeight / 2, z]}>
            <boxGeometry args={[POST_THICKNESS, shelfHeight, POST_THICKNESS]} />
            <meshStandardMaterial color={sceneTheme.shelf.post} metalness={0.75} roughness={0.25} />
          </mesh>
        );
      })}

      <mesh position={[0, shelfHeight / 2, -SHELF_DEPTH / 2 + BACK_PANEL_THICKNESS / 2]} receiveShadow>
        <boxGeometry args={[shelfWidth - POST_THICKNESS * 2, shelfHeight, BACK_PANEL_THICKNESS]} />
        <meshStandardMaterial color={sceneTheme.shelf.panel} metalness={0.55} roughness={0.45} />
      </mesh>

      <mesh position={[-shelfWidth / 2 + POST_THICKNESS + BACK_PANEL_THICKNESS / 2, shelfHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[BACK_PANEL_THICKNESS, shelfHeight, SHELF_DEPTH - POST_THICKNESS * 2]} />
        <meshStandardMaterial color={sceneTheme.shelf.panel} metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[shelfWidth / 2 - POST_THICKNESS - BACK_PANEL_THICKNESS / 2, shelfHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[BACK_PANEL_THICKNESS, shelfHeight, SHELF_DEPTH - POST_THICKNESS * 2]} />
        <meshStandardMaterial color={sceneTheme.shelf.panel} metalness={0.55} roughness={0.45} />
      </mesh>

      {Array.from({ length: levelCount }).map((_, level) => {
        const y = BASE_HEIGHT + level * (SLOT_HEIGHT + LEVEL_GAP);
        return (
          <mesh key={`shelf-${level}`} position={[0, y, 0]} receiveShadow>
            <boxGeometry args={[shelfWidth - POST_THICKNESS * 2, 0.04, SHELF_DEPTH - POST_THICKNESS * 2]} />
            <meshStandardMaterial color={sceneTheme.shelf.level} metalness={0.62} roughness={0.38} />
          </mesh>
        );
      })}

      {selected && (
        <>
          <mesh position={[0, shelfHeight, 0]}>
            <boxGeometry args={[shelfWidth + 0.1, 0.05, SHELF_DEPTH + 0.1]} />
            <meshBasicMaterial color={sceneTheme.shelf.selectGlow} transparent opacity={0.8} toneMapped={false} />
          </mesh>
          
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[shelfWidth + 0.1, 0.05, SHELF_DEPTH + 0.1]} />
            <meshBasicMaterial color={sceneTheme.shelf.selectGlow} transparent opacity={0.8} toneMapped={false} />
          </mesh>
          
          <mesh position={[-shelfWidth / 2, shelfHeight / 2, SHELF_DEPTH / 2]}>
            <boxGeometry args={[0.05, shelfHeight, 0.05]} />
            <meshBasicMaterial color={sceneTheme.shelf.selectGlow} transparent opacity={0.8} toneMapped={false} />
          </mesh>
          <mesh position={[shelfWidth / 2, shelfHeight / 2, SHELF_DEPTH / 2]}>
            <boxGeometry args={[0.05, shelfHeight, 0.05]} />
            <meshBasicMaterial color={sceneTheme.shelf.selectGlow} transparent opacity={0.8} toneMapped={false} />
          </mesh>
          
          <pointLight
            position={[0, shelfHeight / 2, SHELF_DEPTH / 2 + 0.2]}
            color={sceneTheme.shelf.selectGlow}
            intensity={0.3}
            distance={shelfHeight}
            decay={2}
          />
        </>
      )}

      {bins.map((bin) => (
        <Bin3D
          key={bin.hucreKodu}
          slot={bin}
          localX={bin.localX}
          localY={bin.localY}
          selected={selected}
          isClicked={clickedBin?.hucreKodu === bin.hucreKodu}
          onBinHover={onBinHover}
          onBinClick={onBinClick}
          binOutlineRef={(mesh) => {
            if (mesh) binOutlineRefs.current.set(bin.hucreKodu, mesh);
          }}
          slotWidth={SLOT_WIDTH}
          slotHeight={SLOT_HEIGHT}
          shelfDepth={SHELF_DEPTH}
          sceneTheme={sceneTheme}
        />
      ))}
    </group>
  );
}
