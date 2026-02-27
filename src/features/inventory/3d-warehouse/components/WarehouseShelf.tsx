import { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { WarehouseSlot as WarehouseSlotType } from '../types/warehouse-3d';
import { parseLocation } from '../utils/location-parser';
import { 
  SLOT_WIDTH, 
  SLOT_HEIGHT, 
  SLOT_GAP, 
  SHELF_DEPTH, 
  POST_THICKNESS, 
  BASE_HEIGHT, 
  LEVEL_GAP,
  HORIZONTAL_PADDING,
  VERTICAL_PADDING,
  BACK_PANEL_THICKNESS
} from '../constants/warehouse-constants';
import { WarehouseBin } from './WarehouseBin';
import * as THREE from 'three';

interface WarehouseShelfProps {
  slots: WarehouseSlotType[];
  row: string;
  column: number;
  position: { x: number; z: number };
  selected: boolean;
  showLabels: boolean;
  onSelect: () => void;
  onBinHover: (bin: WarehouseSlotType | null) => void;
  onBinClick: (bin: WarehouseSlotType | null) => void;
  clickedBin: WarehouseSlotType | null;
}

export function WarehouseShelf({ 
  slots, 
  row, 
  column, 
  position, 
  selected, 
  showLabels, 
  onSelect, 
  onBinHover, 
  onBinClick, 
  clickedBin 
}: WarehouseShelfProps) {
  const binOutlineRefs = useRef<Map<string, THREE.Mesh>>(new Map());

  const shelfSlots = useMemo(() => {
    return slots.filter(slot => {
      const parsed = parseLocation(slot.hucreKodu);
      return parsed && parsed.row === row && parsed.column === column;
    });
  }, [slots, row, column]);

  const levelCount = useMemo(() => {
    const levels = shelfSlots.map(slot => {
      const parsed = parseLocation(slot.hucreKodu);
      return parsed ? parsed.level : 0;
    });
    return levels.length > 0 ? Math.max(...levels) + 1 : 1;
  }, [shelfSlots]);

  const bayCount = 1;

  const contentWidth = useMemo(() => bayCount * SLOT_WIDTH + (bayCount - 1) * SLOT_GAP, [bayCount]);
  const contentHeight = useMemo(() => levelCount * SLOT_HEIGHT + (levelCount - 1) * LEVEL_GAP, [levelCount]);
  const shelfWidth = useMemo(() => contentWidth + 2 * HORIZONTAL_PADDING, [contentWidth]);
  const shelfHeight = useMemo(() => contentHeight + BASE_HEIGHT + VERTICAL_PADDING, [contentHeight]);

  const bins = useMemo(() => {
    return shelfSlots.map((slot) => {
      const parsed = parseLocation(slot.hucreKodu);
      if (!parsed) return null;

      const x = parsed.column * (SLOT_WIDTH + SLOT_GAP) - contentWidth / 2 + SLOT_WIDTH / 2;
      const y = parsed.level * (SLOT_HEIGHT + LEVEL_GAP) + BASE_HEIGHT + VERTICAL_PADDING / 2 + SLOT_HEIGHT / 2;
      return { ...slot, x, y, bay: parsed.column || 0, level: parsed.level };
    }).filter((bin): bin is WarehouseSlotType & { x: number; y: number; bay: number; level: number } => bin !== null);
  }, [shelfSlots, contentWidth]);

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

  return (
    <group position={[position.x, 0, position.z]} onClick={onSelect}>
      {showLabels && (
        <Html 
          position={[0, shelfHeight + 0.6, 0]} 
          center 
          distanceFactor={8} 
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: selected ? 'rgba(60, 157, 255, 0.92)' : 'rgba(13, 22, 40, 0.88)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: selected ? '2px solid rgba(60, 157, 255, 1)' : '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: selected ? '0 0 16px rgba(60, 157, 255, 0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {row}{column.toString().padStart(2, '0')}
          </div>
        </Html>
      )}

      <mesh position={[0, BASE_HEIGHT / 2, 0]}>
        <boxGeometry args={[shelfWidth, BASE_HEIGHT, SHELF_DEPTH]} />
        <meshStandardMaterial color="#1a2332" metalness={0.6} roughness={0.4} />
      </mesh>

      {Array.from({ length: 4 }).map((_, i) => {
        const x = i < 2 ? -shelfWidth / 2 + POST_THICKNESS / 2 : shelfWidth / 2 - POST_THICKNESS / 2;
        const z = i % 2 === 0 ? -SHELF_DEPTH / 2 + POST_THICKNESS / 2 : SHELF_DEPTH / 2 - POST_THICKNESS / 2;
        return (
          <mesh key={i} position={[x, shelfHeight / 2, z]}>
            <boxGeometry args={[POST_THICKNESS, shelfHeight, POST_THICKNESS]} />
            <meshStandardMaterial color="#2a3442" metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}

      <mesh position={[0, shelfHeight / 2, -SHELF_DEPTH / 2 + BACK_PANEL_THICKNESS / 2]} receiveShadow>
        <boxGeometry args={[shelfWidth - POST_THICKNESS * 2, shelfHeight, BACK_PANEL_THICKNESS]} />
        <meshStandardMaterial 
          color="#384454" 
          metalness={0.5} 
          roughness={0.5}
          envMapIntensity={1.5}
        />
      </mesh>

      <mesh position={[-shelfWidth / 2 + POST_THICKNESS + BACK_PANEL_THICKNESS / 2, shelfHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[BACK_PANEL_THICKNESS, shelfHeight, SHELF_DEPTH - POST_THICKNESS * 2]} />
        <meshStandardMaterial 
          color="#384454" 
          metalness={0.5} 
          roughness={0.5}
          envMapIntensity={1.5}
        />
      </mesh>
      <mesh position={[shelfWidth / 2 - POST_THICKNESS - BACK_PANEL_THICKNESS / 2, shelfHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[BACK_PANEL_THICKNESS, shelfHeight, SHELF_DEPTH - POST_THICKNESS * 2]} />
        <meshStandardMaterial 
          color="#384454" 
          metalness={0.5} 
          roughness={0.5}
          envMapIntensity={1.5}
        />
      </mesh>

      {Array.from({ length: levelCount }).map((_, level) => {
        const y = BASE_HEIGHT + level * (SLOT_HEIGHT + LEVEL_GAP);
        return (
          <mesh key={`shelf-${level}`} position={[0, y, 0]} receiveShadow>
            <boxGeometry args={[shelfWidth - POST_THICKNESS * 2, 0.04, SHELF_DEPTH - POST_THICKNESS * 2]} />
            <meshStandardMaterial 
              color="#3d4a5e" 
              metalness={0.6} 
              roughness={0.4}
              envMapIntensity={1.2}
            />
          </mesh>
        );
      })}

      {selected && (
        <>
          <mesh position={[0, shelfHeight, 0]}>
            <boxGeometry args={[shelfWidth + 0.1, 0.05, SHELF_DEPTH + 0.1]} />
            <meshBasicMaterial
              color="#3c9dff"
              transparent
              opacity={0.8}
              toneMapped={false}
            />
          </mesh>
          
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[shelfWidth + 0.1, 0.05, SHELF_DEPTH + 0.1]} />
            <meshBasicMaterial
              color="#3c9dff"
              transparent
              opacity={0.8}
              toneMapped={false}
            />
          </mesh>
          
          <mesh position={[-shelfWidth / 2, shelfHeight / 2, SHELF_DEPTH / 2]}>
            <boxGeometry args={[0.05, shelfHeight, 0.05]} />
            <meshBasicMaterial
              color="#3c9dff"
              transparent
              opacity={0.8}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[shelfWidth / 2, shelfHeight / 2, SHELF_DEPTH / 2]}>
            <boxGeometry args={[0.05, shelfHeight, 0.05]} />
            <meshBasicMaterial
              color="#3c9dff"
              transparent
              opacity={0.8}
              toneMapped={false}
            />
          </mesh>
          
          <pointLight
            position={[0, shelfHeight / 2, SHELF_DEPTH / 2 + 0.2]}
            color="#3c9dff"
            intensity={0.3}
            distance={shelfHeight}
            decay={2}
          />
        </>
      )}

      {bins.map((bin) => (
        <WarehouseBin
          key={bin.hucreKodu}
          bin={bin}
          selected={selected}
          isClicked={clickedBin?.hucreKodu === bin.hucreKodu}
          onBinHover={onBinHover}
          onBinClick={onBinClick}
          binOutlineRef={(mesh) => {
            if (mesh) binOutlineRefs.current.set(bin.hucreKodu, mesh);
          }}
        />
      ))}
    </group>
  );
}
