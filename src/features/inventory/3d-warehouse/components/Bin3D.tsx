import { type ReactElement, useRef } from 'react';
import { Text } from '@react-three/drei';
import type { WarehouseSlot as WarehouseSlotType } from '../types/warehouse-3d';
import * as THREE from 'three';

interface Bin3DProps {
  slot: WarehouseSlotType;
  localX: number;
  localY: number;
  selected: boolean;
  isClicked: boolean;
  onBinHover: (slot: WarehouseSlotType | null) => void;
  onBinClick: (slot: WarehouseSlotType | null) => void;
  binOutlineRef: (mesh: THREE.Mesh | null) => void;
  slotWidth: number;
  slotHeight: number;
  shelfDepth: number;
}

const getBinColor = (totalBakiye: number): string => {
  if (totalBakiye === 0) return '#49546d';
  if (totalBakiye < 10) return '#f7ba3e';
  if (totalBakiye < 50) return '#3c9dff';
  return '#10b981';
};

export function Bin3D({ 
  slot, 
  localX, 
  localY, 
  selected, 
  isClicked, 
  onBinHover, 
  onBinClick, 
  binOutlineRef,
  slotWidth,
  slotHeight,
  shelfDepth
}: Bin3DProps): ReactElement {
  const meshRef = useRef<THREE.Mesh>(null);
  const binColor = getBinColor(slot.totalBakiye);
  const binWidth = slotWidth - 0.15;
  const binHeight = slotHeight - 0.12;
  const binDepth = shelfDepth - 0.4;

  return (
    <group position={[localX, localY, 0]}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onBinHover(slot);
          if (selected) {
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          onBinHover(null);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          if (selected) {
            e.stopPropagation();
            onBinClick(slot);
          }
        }}
      >
        <boxGeometry args={[binWidth, binHeight, binDepth]} />
        <meshStandardMaterial 
          color={binColor} 
          metalness={0.3} 
          roughness={0.7}
          emissive={binColor}
          emissiveIntensity={0.05}
        />
      </mesh>

      {selected && slot.totalBakiye > 0 && (
        <Text
          position={[0, 0, binDepth / 2 + 0.01]}
          fontSize={0.06}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {slot.totalBakiye}
        </Text>
      )}

      {isClicked && (
        <>
          <mesh ref={binOutlineRef}>
            <boxGeometry args={[slotWidth - 0.02, slotHeight - 0.02, shelfDepth - 0.2]} />
            <meshBasicMaterial
              color="#ffd700"
              transparent
              opacity={0.5}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
          
          <mesh>
            <boxGeometry args={[slotWidth + 0.05, slotHeight + 0.05, shelfDepth - 0.15]} />
            <meshBasicMaterial
              color="#ffec8b"
              transparent
              opacity={0.3}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
          
          <pointLight
            position={[0, 0, shelfDepth / 2]}
            color="#ffd700"
            intensity={1.2}
            distance={1.5}
          />
        </>
      )}
    </group>
  );
}
