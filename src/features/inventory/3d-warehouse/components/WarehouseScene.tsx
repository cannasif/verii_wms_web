import { type ReactElement, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { WarehouseFloor } from './WarehouseFloor';
import { Shelf3D } from './Shelf3D';
import { AisleFloor3D } from './AisleFloor3D';
import { buildWarehouseModel, calculateCenter, LAYOUT_CONSTANTS } from '../utils/layout-engine';
import { parseLocation } from '../utils/location-parser';
import type { WarehouseShelvesWithStockInformationDto, WarehouseSlot as WarehouseSlotType } from '../types/warehouse-3d';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { Vector3, PerspectiveCamera as ThreePerspectiveCamera } from 'three';

interface WarehouseSceneProps {
  data: WarehouseShelvesWithStockInformationDto[];
  onSlotHover?: (slot: WarehouseSlotType | null) => void;
  onSlotClick?: (slot: WarehouseSlotType | null) => void;
}

interface ShelfGroup {
  row: string;
  column: number;
  slots: WarehouseSlotType[];
  position: { x: number; z: number };
}

interface AisleData {
  row: string;
  position: { x: number; z: number };
  width: number;
  length: number;
}

const { AISLE_SPACING, BAY_SPACING, AISLE_WIDTH } = LAYOUT_CONSTANTS;

export function WarehouseScene({ data, onSlotHover, onSlotClick }: WarehouseSceneProps): ReactElement {
  const controlsRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const defaultCameraPos = useRef(new Vector3(0, 15, 20));
  const defaultTargetPos = useRef(new Vector3(0, 2, 0));
  
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [selectedAisleId, setSelectedAisleId] = useState<string | null>(null);
  const [clickedBin, setClickedBin] = useState<WarehouseSlotType | null>(null);
  const [showLabels] = useState(true);

  const { center, shelfGroups, aisles, bounds } = useMemo(() => {
    const builtSlots = buildWarehouseModel(data);
    const calculatedCenter = calculateCenter(builtSlots);
    
    const groupMap = new Map<string, ShelfGroup>();
    const rowSet = new Set<string>();
    
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    
    for (const slot of builtSlots) {
      const parsed = parseLocation(slot.hucreKodu);
      if (!parsed) continue;
      
      rowSet.add(parsed.row);
      const key = `${parsed.row}-${parsed.column}`;
      const rowIndex = parsed.row.charCodeAt(0) - 'A'.charCodeAt(0);
      const posX = parsed.column * BAY_SPACING;
      const posZ = rowIndex * AISLE_SPACING;
      
      minX = Math.min(minX, posX);
      maxX = Math.max(maxX, posX);
      minZ = Math.min(minZ, posZ);
      maxZ = Math.max(maxZ, posZ);
      
      if (groupMap.has(key)) {
        groupMap.get(key)!.slots.push(slot);
      } else {
        groupMap.set(key, {
          row: parsed.row,
          column: parsed.column,
          slots: [slot],
          position: { x: posX, z: posZ },
        });
      }
    }

    const groups = Array.from(groupMap.values());
    const uniqueRows = Array.from(rowSet).sort();
    
    const allMaxColumn = Math.max(...groups.map(g => g.column), 0);
    const totalLength = (allMaxColumn + 1) * BAY_SPACING + 0.5;
    
    const aisleData: AisleData[] = uniqueRows.map(row => {
      const rowIndex = row.charCodeAt(0) - 'A'.charCodeAt(0);
      
      return {
        row,
        position: { x: -0.3, z: rowIndex * AISLE_SPACING },
        width: AISLE_WIDTH,
        length: totalLength,
      };
    });

    const adjustedCenter = {
      x: calculatedCenter.x,
      y: calculatedCenter.y,
      z: calculatedCenter.z,
    };
    
    defaultCameraPos.current.set(adjustedCenter.x + 15, 15, adjustedCenter.z + 20);
    defaultTargetPos.current.set(adjustedCenter.x, 0.5, adjustedCenter.z);

    return { 
      center: adjustedCenter, 
      shelfGroups: groups,
      aisles: aisleData,
      bounds: { minX, maxX: maxX + 1, minZ: minZ - AISLE_WIDTH / 2, maxZ: maxZ + AISLE_WIDTH / 2 },
    };
  }, [data]);

  const selectedShelf = useMemo(() => {
    return shelfGroups.find(g => `${g.row}-${g.column}` === selectedShelfId) || null;
  }, [shelfGroups, selectedShelfId]);

  const handleSelectShelf = useCallback((row: string, column: number) => {
    const id = `${row}-${column}`;
    setSelectedShelfId(prev => prev === id ? null : id);
    setSelectedAisleId(null);
    setClickedBin(null);
  }, []);

  const handleSelectAisle = useCallback((row: string) => {
    setSelectedAisleId(prev => prev === row ? null : row);
    setSelectedShelfId(null);
    setClickedBin(null);
  }, []);

  const handleBinClick = useCallback((slot: WarehouseSlotType | null) => {
    if (selectedShelfId) {
      setClickedBin(slot);
      onSlotClick?.(slot);
    }
  }, [selectedShelfId, onSlotClick]);

  useEffect(() => {
    if (!controlsRef.current || !cameraRef.current) return;

    const controls = controlsRef.current;
    const camera = cameraRef.current;
    const duration = 1200;
    const startTime = Date.now();
    
    if (selectedShelf) {
      const { position } = selectedShelf;
      const shelfHeight = LAYOUT_CONSTANTS.LEVEL_HEIGHT * 4;
      
      const targetPos = new Vector3(position.x, shelfHeight / 2, position.z);
      const cameraDistance = 6;
      const cameraPos = new Vector3(
        position.x + cameraDistance * 0.5,
        shelfHeight + 3,
        position.z + cameraDistance
      );
      
      const startCameraPos = camera.position.clone();
      const startTargetPos = controls.target.clone();

      const animate = (): void => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        camera.position.lerpVectors(startCameraPos, cameraPos, easeProgress);
        controls.target.lerpVectors(startTargetPos, targetPos, easeProgress);
        controls.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    } else {
      const startCameraPos = camera.position.clone();
      const startTargetPos = controls.target.clone();

      const animate = (): void => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        camera.position.lerpVectors(startCameraPos, defaultCameraPos.current, easeProgress);
        controls.target.lerpVectors(startTargetPos, defaultTargetPos.current, easeProgress);
        controls.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  }, [selectedShelf]);

  return (
    <Canvas
      gl={{ 
        antialias: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      style={{ background: 'linear-gradient(to bottom, #0a0e1a 0%, #0d1628 100%)' }}
    >
      <PerspectiveCamera 
        ref={cameraRef} 
        makeDefault 
        position={[center.x + 15, 15, center.z + 20]} 
        fov={50} 
      />
      <OrbitControls
        ref={controlsRef}
        target={[center.x, 0.5, center.z]}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.2}
      />

      <ambientLight intensity={0.7} color="#f5f8ff" />
      <directionalLight 
        position={[15, 30, 20]} 
        intensity={1.0} 
        color="#ffffff"
      />
      <directionalLight position={[-15, 20, -15]} intensity={0.5} color="#e8f0ff" />
      <hemisphereLight intensity={0.4} color="#ffffff" groundColor="#1a2332" />

      <WarehouseFloor center={{ x: center.x, z: center.z }} bounds={bounds} />

      {aisles.map((aisle) => (
        <AisleFloor3D
          key={aisle.row}
          row={aisle.row}
          position={aisle.position}
          width={aisle.width}
          length={aisle.length}
          selected={selectedAisleId === aisle.row}
          onSelect={() => handleSelectAisle(aisle.row)}
        />
      ))}

      {shelfGroups.map((group) => (
        <Shelf3D
          key={`${group.row}-${group.column}`}
          row={group.row}
          column={group.column}
          slots={group.slots}
          position={group.position}
          selected={selectedShelfId === `${group.row}-${group.column}`}
          showLabels={showLabels && !clickedBin}
          onSelect={() => handleSelectShelf(group.row, group.column)}
          onBinHover={(slot) => onSlotHover?.(slot)}
          onBinClick={handleBinClick}
          clickedBin={clickedBin}
        />
      ))}
    </Canvas>
  );
}
