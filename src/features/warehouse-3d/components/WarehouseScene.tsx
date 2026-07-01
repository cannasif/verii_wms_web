import { Suspense, lazy, type ReactElement, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useTheme } from '@/components/theme-provider';
import { WarehouseFloor } from './WarehouseFloor';
import { buildWarehouseModel, calculateCenter, LAYOUT_CONSTANTS } from '../utils/layout-engine';
import { getWarehouse3dSceneTheme } from '../utils/warehouse-3d-scene-theme';
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

interface SceneBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function computeCameraSetup(center: { x: number; y: number; z: number }, bounds: SceneBounds): {
  cameraPosition: [number, number, number];
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
} {
  const spanX = Math.max(bounds.maxX - bounds.minX, 4);
  const spanZ = Math.max(bounds.maxZ - bounds.minZ, 4);
  const span = Math.max(spanX, spanZ);
  const distance = span * 0.72 + 3.5;
  const eyeY = Math.max(span * 0.42, 4.5);

  return {
    cameraPosition: [center.x + distance * 0.55, eyeY, center.z + distance * 0.78],
    target: [center.x, 1.4, center.z],
    minDistance: Math.max(span * 0.22, 2.5),
    maxDistance: Math.max(span * 4, 45),
  };
}

const { AISLE_SPACING, BAY_SPACING, AISLE_WIDTH } = LAYOUT_CONSTANTS;

const Shelf3D = lazy(async () => {
  const module = await import('./Shelf3D');
  return { default: module.Shelf3D };
});

const AisleFloor3D = lazy(async () => {
  const module = await import('./AisleFloor3D');
  return { default: module.AisleFloor3D };
});

export function WarehouseScene({ data, onSlotHover, onSlotClick }: WarehouseSceneProps): ReactElement {
  const { resolvedTheme } = useTheme();
  const sceneTheme = useMemo(
    () => getWarehouse3dSceneTheme(resolvedTheme === 'light' ? 'light' : 'dark'),
    [resolvedTheme],
  );

  const controlsRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const defaultCameraPos = useRef(new Vector3(0, 15, 20));
  const defaultTargetPos = useRef(new Vector3(0, 2, 0));
  
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [selectedAisleId, setSelectedAisleId] = useState<string | null>(null);
  const [clickedBin, setClickedBin] = useState<WarehouseSlotType | null>(null);
  const [showLabels] = useState(true);

  const { center, shelfGroups, aisles, bounds, cameraSetup } = useMemo(() => {
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

    const sceneBounds: SceneBounds = {
      minX: Number.isFinite(minX) ? minX : 0,
      maxX: Number.isFinite(maxX) ? maxX + 1 : 8,
      minZ: Number.isFinite(minZ) ? minZ - AISLE_WIDTH / 2 : 0,
      maxZ: Number.isFinite(maxZ) ? maxZ + AISLE_WIDTH / 2 : 8,
    };

    const cameraSetup = computeCameraSetup(adjustedCenter, sceneBounds);
    defaultCameraPos.current.set(...cameraSetup.cameraPosition);
    defaultTargetPos.current.set(...cameraSetup.target);

    return { 
      center: adjustedCenter, 
      shelfGroups: groups,
      aisles: aisleData,
      bounds: sceneBounds,
      cameraSetup,
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
      key={resolvedTheme}
      className="wms-ops-warehouse-3d-r3f-canvas"
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.75]}
      onCreated={({ gl }) => {
        gl.setClearColor(sceneTheme.clearColor);
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={cameraSetup.cameraPosition}
        fov={38}
        near={0.1}
        far={500}
      />
      <OrbitControls
        ref={controlsRef}
        target={cameraSetup.target}
        enableDamping
        dampingFactor={0.06}
        minDistance={cameraSetup.minDistance}
        maxDistance={cameraSetup.maxDistance}
        maxPolarAngle={Math.PI / 2.05}
      />

      <ambientLight intensity={sceneTheme.ambient.intensity} color={sceneTheme.ambient.color} />
      <directionalLight
        position={[12, 24, 14]}
        intensity={sceneTheme.directionalMain.intensity}
        color={sceneTheme.directionalMain.color}
      />
      <directionalLight
        position={[-10, 16, -12]}
        intensity={sceneTheme.directionalFill.intensity}
        color={sceneTheme.directionalFill.color}
      />
      <pointLight
        position={[center.x, 8, center.z]}
        intensity={sceneTheme.point.intensity}
        color={sceneTheme.point.color}
        distance={40}
      />
      <hemisphereLight
        intensity={sceneTheme.hemisphere.intensity}
        color={sceneTheme.hemisphere.sky}
        groundColor={sceneTheme.hemisphere.ground}
      />

      <WarehouseFloor center={{ x: center.x, z: center.z }} bounds={bounds} sceneTheme={sceneTheme} />

      <Suspense fallback={null}>
        {aisles.map((aisle) => (
          <AisleFloor3D
            key={aisle.row}
            row={aisle.row}
            position={aisle.position}
            width={aisle.width}
            length={aisle.length}
            selected={selectedAisleId === aisle.row}
            onSelect={() => handleSelectAisle(aisle.row)}
            sceneTheme={sceneTheme}
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
            sceneTheme={sceneTheme}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
