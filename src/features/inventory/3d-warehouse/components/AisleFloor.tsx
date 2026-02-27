import { useState } from 'react';
import { Html } from '@react-three/drei';

interface AisleFloorProps {
  position: { x: number; z: number };
  width: number;
  length: number;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function AisleFloor({ position, width, length, label, selected, onSelect }: AisleFloorProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[position.x, 0.01, position.z]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          color={selected ? '#246BFD' : hovered ? '#1a5acc' : '#0d1628'}
          transparent
          opacity={selected ? 0.4 : hovered ? 0.25 : 0.15}
        />
      </mesh>
      {(selected || hovered) && (
        <Html 
          position={[0, 0.1, 0]} 
          center 
          distanceFactor={10} 
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(36, 107, 253, 0.92)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '2px solid rgba(36, 107, 253, 1)',
              boxShadow: '0 0 20px rgba(36, 107, 253, 0.6)',
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}
