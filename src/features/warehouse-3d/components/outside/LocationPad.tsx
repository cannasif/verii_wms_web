import { type ReactElement } from 'react';
import { Line, Text } from '@react-three/drei';

interface LocationPadProps {
  width: number;
  depth: number;
  label: string;
}

export function LocationPad({ width, depth, label }: LocationPadProps): ReactElement {
  const halfW = width / 2;
  const halfD = depth / 2;

  const frame: [number, number, number][] = [
    [-halfW, 0.012, -halfD],
    [halfW, 0.012, -halfD],
    [halfW, 0.012, halfD],
    [-halfW, 0.012, halfD],
    [-halfW, 0.012, -halfD],
  ];

  return (
    <group>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.85} transparent opacity={0.92} />
      </mesh>

      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.04} />
      </mesh>

      <Line points={frame} color="#22d3ee" lineWidth={1.5} dashed dashSize={0.2} gapSize={0.12} />

      {[
        [-halfW, 0, -halfD],
        [halfW, 0, -halfD],
        [halfW, 0, halfD],
        [-halfW, 0, halfD],
      ].map((corner, idx) => (
        <mesh key={idx} position={[corner[0], 0.18, corner[2]]}>
          <cylinderGeometry args={[0.02, 0.02, 0.36, 8]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
      ))}

      <Text
        position={[-halfW + 0.5, 0.02, -halfD + 0.25]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.22}
        color="#67e8f9"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#082f49"
        fontWeight="bold"
      >
        {label}
      </Text>
    </group>
  );
}
