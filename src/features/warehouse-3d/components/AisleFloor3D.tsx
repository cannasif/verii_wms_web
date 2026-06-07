import { type ReactElement, useState } from 'react';
import { Html, Line, Text } from '@react-three/drei';

interface AisleFloor3DProps {
  row: string;
  position: { x: number; z: number };
  width: number;
  length: number;
  selected: boolean;
  onSelect: () => void;
}

export function AisleFloor3D({ row, position, width, length, selected, onSelect }: AisleFloor3DProps): ReactElement {
  const [hovered, setHovered] = useState(false);

  const startX = position.x;
  const endX = position.x + length;
  const z = position.z;

  const floorColor = selected ? '#1a3a6e' : hovered ? '#15304d' : '#1a2636';

  return (
    <group>
      <mesh
        position={[startX + length / 2, 0.008, z]}
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
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial
          color={floorColor}
          transparent
          opacity={0.9}
        />
      </mesh>

      <Line
        points={[[startX, 0.015, z - width / 2], [endX, 0.015, z - width / 2]]}
        color={selected ? '#246BFD' : '#3d5a80'}
        lineWidth={selected ? 2 : 1}
        dashed={!selected}
        dashSize={0.3}
        dashOffset={0}
        gapSize={0.15}
      />
      <Line
        points={[[startX, 0.015, z + width / 2], [endX, 0.015, z + width / 2]]}
        color={selected ? '#246BFD' : '#3d5a80'}
        lineWidth={selected ? 2 : 1}
        dashed={!selected}
        dashSize={0.3}
        dashOffset={0}
        gapSize={0.15}
      />

      <Text
        position={[startX - 1.2, 0.05, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="#246BFD"
        fontWeight="bold"
      >
        {row}
      </Text>

      <Text
        position={[endX + 1.2, 0.05, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="#246BFD"
        fontWeight="bold"
      >
        {row}
      </Text>

      {(selected || hovered) && (
        <Html 
          position={[startX + length / 2, 0.1, z]} 
          center 
          distanceFactor={8} 
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(36, 107, 253, 0.92)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '2px solid rgba(36, 107, 253, 1)',
              boxShadow: '0 0 16px rgba(36, 107, 253, 0.6)',
            }}
          >
            Koridor {row}
          </div>
        </Html>
      )}
    </group>
  );
}
