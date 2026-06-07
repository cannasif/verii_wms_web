import { type ReactElement, Suspense, memo, useEffect, useMemo, useRef, useState } from 'react';
import { Html, useTexture } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SteelPlacementVisualizationItemDto } from '../../types/warehouse-3d';

export type PlateOrientation = 'horizontal' | 'vertical';

interface SteelPlateProps {
  item: SteelPlacementVisualizationItemDto;
  position: [number, number, number];
  size: [number, number, number];
  orientation: PlateOrientation;
  imageUrl: string | null;
  selected: boolean;
  onClick: (item: SteelPlacementVisualizationItemDto) => void;
}

const SELECTED_EMISSIVE_COLOR = '#22d3ee';
const HOVER_EMISSIVE_COLOR = '#3b82f6';

interface PlateMeshMaterialProps {
  orientation: PlateOrientation;
  imageUrl: string | null;
  selected: boolean;
  hovered: boolean;
}

function PlateMeshMaterial({ orientation, imageUrl, selected, hovered }: PlateMeshMaterialProps): ReactElement {
  const baseColor = imageUrl ? '#f5f6f8' : '#5a6677';
  const edgeColor = '#1f2937';
  const emissiveColor = selected ? SELECTED_EMISSIVE_COLOR : hovered ? HOVER_EMISSIVE_COLOR : '#000000';
  const emissiveIntensity = selected ? 0.45 : hovered ? 0.22 : 0;

  return (
    <>
      <meshStandardMaterial
        attach="material-0"
        color={orientation === 'horizontal' ? edgeColor : baseColor}
        metalness={0.85}
        roughness={0.32}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
      />
      <meshStandardMaterial
        attach="material-1"
        color={orientation === 'horizontal' ? edgeColor : baseColor}
        metalness={0.85}
        roughness={0.32}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
      />
      <FaceMaterial
        slot={2}
        face={orientation === 'horizontal' ? 'top' : 'side'}
        imageUrl={imageUrl}
        selected={selected}
        hovered={hovered}
      />
      <meshStandardMaterial
        attach="material-3"
        color={edgeColor}
        metalness={0.85}
        roughness={0.4}
      />
      <FaceMaterial
        slot={4}
        face={orientation === 'horizontal' ? 'side' : 'side'}
        imageUrl={imageUrl}
        selected={selected}
        hovered={hovered}
      />
      <meshStandardMaterial
        attach="material-5"
        color={edgeColor}
        metalness={0.85}
        roughness={0.4}
      />
    </>
  );
}

interface FaceMaterialProps {
  slot: number;
  face: 'top' | 'side';
  imageUrl: string | null;
  selected: boolean;
  hovered: boolean;
}

function FaceMaterial({ slot, imageUrl, selected, hovered }: FaceMaterialProps): ReactElement {
  if (imageUrl) {
    return (
      <Suspense
        fallback={
          <meshStandardMaterial
            attach={`material-${slot}`}
            color="#5a6677"
            metalness={0.85}
            roughness={0.4}
          />
        }
      >
        <TexturedFaceMaterial slot={slot} imageUrl={imageUrl} selected={selected} hovered={hovered} />
      </Suspense>
    );
  }

  return (
    <meshStandardMaterial
      attach={`material-${slot}`}
      color="#5a6677"
      metalness={0.85}
      roughness={0.4}
      emissive={selected ? SELECTED_EMISSIVE_COLOR : hovered ? HOVER_EMISSIVE_COLOR : '#000000'}
      emissiveIntensity={selected ? 0.45 : hovered ? 0.22 : 0}
    />
  );
}

interface TexturedFaceMaterialProps {
  slot: number;
  imageUrl: string;
  selected: boolean;
  hovered: boolean;
}

function TexturedFaceMaterial({ slot, imageUrl, selected, hovered }: TexturedFaceMaterialProps): ReactElement {
  const texture = useTexture(imageUrl);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <meshStandardMaterial
      attach={`material-${slot}`}
      map={texture}
      metalness={0.55}
      roughness={0.45}
      emissive={selected ? SELECTED_EMISSIVE_COLOR : hovered ? HOVER_EMISSIVE_COLOR : '#000000'}
      emissiveIntensity={selected ? 0.32 : hovered ? 0.16 : 0}
    />
  );
}

const SteelPlateInner = ({
  item,
  position,
  size,
  orientation,
  imageUrl,
  selected,
  onClick,
}: SteelPlateProps): ReactElement => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const baseY = position[1];

  useFrame((state) => {
    if (!groupRef.current || !selected) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = baseY + Math.sin(t * 2.4) * 0.012;
  });

  useEffect(() => {
    if (groupRef.current && !selected) {
      groupRef.current.position.set(position[0], baseY, position[2]);
    }
  }, [selected, baseY, position]);

  const haloSize = useMemo<[number, number, number]>(
    () => [size[0] + 0.045, size[1] + 0.045, size[2] + 0.045],
    [size],
  );

  const handlePointerOver = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (): void => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    onClick(item);
  };

  return (
    <group ref={groupRef} position={position}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={size} />
        <PlateMeshMaterial
          orientation={orientation}
          imageUrl={imageUrl}
          selected={selected}
          hovered={hovered}
        />
      </mesh>

      {selected && (
        <mesh>
          <boxGeometry args={haloSize} />
          <meshBasicMaterial
            color={SELECTED_EMISSIVE_COLOR}
            transparent
            opacity={0.18}
            side={THREE.BackSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {hovered && !selected && (
        <Html
          position={[0, size[1] / 2 + 0.25, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              color: '#e2e8f0',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              boxShadow: '0 4px 18px rgba(8, 47, 73, 0.45)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ color: '#67e8f9' }}>{item.stockCode}</div>
            <div style={{ opacity: 0.85 }}>{item.serialNo}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

export const SteelPlate = memo(SteelPlateInner, (prev, next) =>
  prev.item.lineId === next.item.lineId &&
  prev.selected === next.selected &&
  prev.imageUrl === next.imageUrl &&
  prev.position[0] === next.position[0] &&
  prev.position[1] === next.position[1] &&
  prev.position[2] === next.position[2],
);
