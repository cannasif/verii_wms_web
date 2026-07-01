import { type ReactElement } from 'react';
import { Grid, Line } from '@react-three/drei';
import type { Warehouse3dSceneTheme } from '../utils/warehouse-3d-scene-theme';

interface WarehouseFloorProps {
  center: { x: number; z: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  sceneTheme: Warehouse3dSceneTheme;
}

export function WarehouseFloor({ bounds, sceneTheme }: WarehouseFloorProps): ReactElement {
  const padding = 1.5;
  const minX = bounds.minX - padding;
  const maxX = bounds.maxX + padding;
  const minZ = bounds.minZ - padding;
  const maxZ = bounds.maxZ + padding;
  
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const frameCorners: [number, number, number][] = [
    [minX, 0.02, minZ],
    [maxX, 0.02, minZ],
    [maxX, 0.02, maxZ],
    [minX, 0.02, maxZ],
    [minX, 0.02, minZ],
  ];

  return (
    <group>
      <Grid
        args={[100, 100]}
        cellSize={2}
        cellThickness={0.65}
        cellColor={sceneTheme.gridCell}
        sectionSize={10}
        sectionThickness={1.1}
        sectionColor={sceneTheme.gridSection}
        fadeDistance={55}
        fadeStrength={1.2}
        position={[centerX, 0.001, centerZ]}
      />

      <mesh position={[centerX, 0.003, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={sceneTheme.floorPlane} transparent opacity={0.94} />
      </mesh>

      <Line
        points={frameCorners}
        color={sceneTheme.frameLine}
        lineWidth={2}
      />

      <Line points={[[minX, 0.02, minZ], [minX, 0.4, minZ]]} color={sceneTheme.frameLine} lineWidth={1.5} />
      <Line points={[[maxX, 0.02, minZ], [maxX, 0.4, minZ]]} color={sceneTheme.frameLine} lineWidth={1.5} />
      <Line points={[[maxX, 0.02, maxZ], [maxX, 0.4, maxZ]]} color={sceneTheme.frameLine} lineWidth={1.5} />
      <Line points={[[minX, 0.02, maxZ], [minX, 0.4, maxZ]]} color={sceneTheme.frameLine} lineWidth={1.5} />
    </group>
  );
}
