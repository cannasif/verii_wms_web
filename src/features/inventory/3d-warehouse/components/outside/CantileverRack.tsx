import { type ReactElement, useMemo } from 'react';

interface CantileverRackProps {
  width: number;
  depth: number;
  height: number;
  armLevels: number;
  postCount: number;
  orientation: 'horizontal' | 'vertical';
}

const POST_COLOR = '#fbbf24';
const ARM_COLOR = '#1e293b';
const BASE_COLOR = '#0f172a';
const BRACE_COLOR = '#334155';

const POST_THICKNESS = 0.09;
const ARM_THICKNESS = 0.06;
const BASE_HEIGHT = 0.06;
const SAFETY_STRIPE_HEIGHT = 0.18;

export function CantileverRack({
  width,
  depth,
  height,
  armLevels,
  postCount,
  orientation,
}: CantileverRackProps): ReactElement {
  const postPositions = useMemo<number[]>(() => {
    if (postCount <= 1) return [0];
    const span = width - POST_THICKNESS;
    const step = span / (postCount - 1);
    return Array.from({ length: postCount }, (_, i) => -span / 2 + i * step);
  }, [postCount, width]);

  const armPositions = useMemo<number[]>(() => {
    if (armLevels <= 0) return [];
    const usableHeight = height - BASE_HEIGHT - 0.3;
    const step = usableHeight / Math.max(armLevels, 1);
    return Array.from({ length: armLevels }, (_, i) => BASE_HEIGHT + step * (i + 0.4));
  }, [armLevels, height]);

  return (
    <group>
      <mesh position={[0, BASE_HEIGHT / 2, -depth / 2 + 0.04]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.4, BASE_HEIGHT, 0.18]} />
        <meshStandardMaterial color={BASE_COLOR} metalness={0.7} roughness={0.45} />
      </mesh>

      <mesh position={[0, BASE_HEIGHT / 2, depth / 2 - 0.04]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.4, BASE_HEIGHT, 0.18]} />
        <meshStandardMaterial color={BASE_COLOR} metalness={0.7} roughness={0.45} />
      </mesh>

      {postPositions.map((x, idx) => (
        <group key={`post-${idx}`} position={[x, 0, -depth / 2 + 0.04]}>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[POST_THICKNESS, height, POST_THICKNESS]} />
            <meshStandardMaterial color={POST_COLOR} metalness={0.55} roughness={0.55} />
          </mesh>

          <mesh position={[0, SAFETY_STRIPE_HEIGHT / 2 + BASE_HEIGHT, POST_THICKNESS / 2 + 0.001]}>
            <planeGeometry args={[POST_THICKNESS * 0.92, SAFETY_STRIPE_HEIGHT]} />
            <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.7} />
          </mesh>

          <mesh position={[0, height + 0.04, 0]} castShadow>
            <boxGeometry args={[POST_THICKNESS * 1.4, 0.08, POST_THICKNESS * 1.4]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {orientation === 'horizontal' &&
        postPositions.map((x, postIdx) =>
          armPositions.map((y, levelIdx) => (
            <mesh
              key={`arm-${postIdx}-${levelIdx}`}
              position={[x, y, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[ARM_THICKNESS, ARM_THICKNESS, depth - 0.1]} />
              <meshStandardMaterial color={ARM_COLOR} metalness={0.85} roughness={0.3} />
            </mesh>
          )),
        )}

      {orientation === 'horizontal' &&
        armPositions.map((y, levelIdx) =>
          Array.from({ length: Math.max(postCount - 1, 0) }).map((_, segIdx) => (
            <mesh
              key={`tie-${levelIdx}-${segIdx}`}
              position={[(postPositions[segIdx] + postPositions[segIdx + 1]) / 2, y, depth / 2 - 0.05]}
              castShadow
            >
              <boxGeometry args={[
                Math.abs(postPositions[segIdx + 1] - postPositions[segIdx]) - POST_THICKNESS,
                ARM_THICKNESS * 0.6,
                ARM_THICKNESS * 0.6,
              ]} />
              <meshStandardMaterial color={BRACE_COLOR} metalness={0.7} roughness={0.4} />
            </mesh>
          )),
        )}

      {orientation === 'vertical' &&
        Array.from({ length: Math.max(postCount - 1, 0) }).map((_, segIdx) => {
          const xMid = (postPositions[segIdx] + postPositions[segIdx + 1]) / 2;
          const segWidth = Math.abs(postPositions[segIdx + 1] - postPositions[segIdx]) - POST_THICKNESS;
          return (
            <group key={`brace-${segIdx}`} position={[xMid, 0, 0]}>
              <mesh position={[0, height * 0.18, 0]}>
                <boxGeometry args={[segWidth, ARM_THICKNESS * 0.7, depth * 0.85]} />
                <meshStandardMaterial color={BRACE_COLOR} metalness={0.7} roughness={0.45} />
              </mesh>
              <mesh position={[0, height * 0.55, -depth / 2 + 0.05]} rotation={[0, 0, Math.PI / 6]}>
                <boxGeometry args={[segWidth * 1.1, ARM_THICKNESS * 0.55, ARM_THICKNESS * 0.55]} />
                <meshStandardMaterial color={BRACE_COLOR} metalness={0.7} roughness={0.45} />
              </mesh>
              <mesh position={[0, height * 0.55, depth / 2 - 0.05]} rotation={[0, 0, -Math.PI / 6]}>
                <boxGeometry args={[segWidth * 1.1, ARM_THICKNESS * 0.55, ARM_THICKNESS * 0.55]} />
                <meshStandardMaterial color={BRACE_COLOR} metalness={0.7} roughness={0.45} />
              </mesh>
            </group>
          );
        })}
    </group>
  );
}
