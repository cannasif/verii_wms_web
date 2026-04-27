import { Suspense, type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  AdaptiveDpr,
  AdaptiveEvents,
  ContactShadows,
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
  PerformanceMonitor,
  PerspectiveCamera,
} from '@react-three/drei';
import { Vector3, PerspectiveCamera as ThreePerspectiveCamera, FogExp2 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type {
  SteelPlacementVisualizationItemDto,
  SteelPlacementVisualizationLocationDto,
} from '../../types/warehouse-3d';
import { PlateStack } from './PlateStack';
import { PLATE_STACK_LAYOUT } from './plate-stack-layout';
import { LocationPad } from './LocationPad';

interface OutsideSceneProps {
  location: SteelPlacementVisualizationLocationDto;
  selectedItemId: number | null;
  onSelectItem: (item: SteelPlacementVisualizationItemDto) => void;
  resolveImageUrl: (url: string | null | undefined) => string | null;
  cameraPreset: CameraPreset;
  cameraPresetVersion: number;
  selectedRackKey: string | null;
  onSelectRack: (key: string | null, items: SteelPlacementVisualizationItemDto[]) => void;
}

export type CameraPreset = 'iso' | 'top' | 'front' | 'eye' | 'reset';

interface SlotGroup {
  key: string;
  position: [number, number, number];
  items: SteelPlacementVisualizationItemDto[];
}

function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function buildSlotGroups(
  location: SteelPlacementVisualizationLocationDto,
): { groups: SlotGroup[]; bounds: { width: number; depth: number } } {
  const items = location.items;
  if (items.length === 0) {
    return { groups: [], bounds: { width: 6, depth: 6 } };
  }

  const map = new Map<string, SteelPlacementVisualizationItemDto[]>();
  let maxPos = 1;
  let maxRow = 1;

  for (const item of items) {
    const positionNo = item.positionNo ?? 1;
    const rowNo = item.rowNo ?? 1;
    const key = `${rowNo}-${positionNo}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
    if (positionNo > maxPos) maxPos = positionNo;
    if (rowNo > maxRow) maxRow = rowNo;
  }

  const isVerticalLayout = items[0]?.placementType === 'SideBySide';
  const positionSpacing = PLATE_STACK_LAYOUT.positionSpacing;
  const rowSpacing = isVerticalLayout
    ? PLATE_STACK_LAYOUT.verticalRowSpacing
    : PLATE_STACK_LAYOUT.rowSpacing;

  const offsetX = -((maxPos - 1) * positionSpacing) / 2;
  const offsetZ = -((maxRow - 1) * rowSpacing) / 2;

  const groups: SlotGroup[] = Array.from(map.entries()).map(([key, group]) => {
    const first = group[0];
    const positionNo = first.positionNo ?? 1;
    const rowNo = first.rowNo ?? 1;
    const x = (positionNo - 1) * positionSpacing + offsetX;
    const z = (rowNo - 1) * rowSpacing + offsetZ;
    return { key, position: [x, 0, z], items: group };
  });

  const padPaddingX = 1.6;
  const padPaddingZ = 1.2;
  const width = (maxPos - 1) * positionSpacing + padPaddingX * 2;
  const depth = (maxRow - 1) * rowSpacing + padPaddingZ * 2;

  return { groups, bounds: { width: Math.max(width, 4), depth: Math.max(depth, 3.5) } };
}

function CameraDriver({
  preset,
  version,
  cameraRef,
  controlsRef,
  defaultPosition,
  defaultTarget,
  bounds,
  disabled,
}: {
  preset: CameraPreset;
  version: number;
  cameraRef: React.MutableRefObject<ThreePerspectiveCamera | null>;
  controlsRef: React.MutableRefObject<OrbitControlsType | null>;
  defaultPosition: Vector3;
  defaultTarget: Vector3;
  bounds: { width: number; depth: number };
  disabled: boolean;
}): null {
  useEffect(() => {
    if (disabled || !cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    let targetPos: Vector3;
    let targetLook: Vector3;

    if (preset === 'top') {
      targetPos = new Vector3(
        defaultTarget.x + 0.001,
        Math.max(bounds.width, bounds.depth) * 1.6 + 6,
        defaultTarget.z + 0.001,
      );
      targetLook = defaultTarget.clone();
    } else if (preset === 'front') {
      targetPos = new Vector3(defaultTarget.x, 2.4, defaultTarget.z + bounds.depth + 6);
      targetLook = defaultTarget.clone().setY(1.2);
    } else if (preset === 'eye') {
      targetPos = new Vector3(
        defaultTarget.x - bounds.width * 0.55,
        1.65,
        defaultTarget.z + bounds.depth * 0.7 + 1.4,
      );
      targetLook = defaultTarget.clone().setY(1.05);
    } else {
      targetPos = defaultPosition.clone();
      targetLook = defaultTarget.clone();
    }

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 950;
    const startTime = performance.now();

    let raf = 0;
    const animate = (): void => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      const eased = easeInOutCubic(progress);
      camera.position.lerpVectors(startPos, targetPos, eased);
      controls.target.lerpVectors(startTarget, targetLook, eased);
      controls.update();
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [preset, version, cameraRef, controlsRef, defaultPosition, defaultTarget, bounds, disabled]);

  return null;
}

function RackFocusDriver({
  selectedRackKey,
  groups,
  cameraRef,
  controlsRef,
  defaultPosition,
  defaultTarget,
}: {
  selectedRackKey: string | null;
  groups: SlotGroup[];
  cameraRef: React.MutableRefObject<ThreePerspectiveCamera | null>;
  controlsRef: React.MutableRefObject<OrbitControlsType | null>;
  defaultPosition: Vector3;
  defaultTarget: Vector3;
}): null {
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    let targetPos: Vector3;
    let targetLook: Vector3;

    if (selectedRackKey === null) {
      targetPos = defaultPosition.clone();
      targetLook = defaultTarget.clone();
    } else {
      const group = groups.find((g) => g.key === selectedRackKey);
      if (!group) return;
      const [rx, , rz] = group.position;
      targetPos = new Vector3(rx - 0.5, 3.2, rz + 4.6);
      targetLook = new Vector3(rx, 1.15, rz);
    }

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 1000;
    const startTime = performance.now();

    let raf = 0;
    const animate = (): void => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      const eased = easeInOutCubic(progress);
      camera.position.lerpVectors(startPos, targetPos, eased);
      controls.target.lerpVectors(startTarget, targetLook, eased);
      controls.update();
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [selectedRackKey, groups, cameraRef, controlsRef, defaultPosition, defaultTarget]);

  return null;
}

export function OutsideScene({
  location,
  selectedItemId,
  onSelectItem,
  resolveImageUrl,
  cameraPreset,
  cameraPresetVersion,
  selectedRackKey,
  onSelectRack,
}: OutsideSceneProps): ReactElement {
  const cameraRef = useRef<ThreePerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [dpr, setDpr] = useState<number>(1.4);
  const [reflectorEnabled, setReflectorEnabled] = useState<boolean>(true);

  const { groups, bounds } = useMemo(() => buildSlotGroups(location), [location]);

  const padLabel = location.shelfCode
    ? location.areaCode
      ? `${location.shelfCode} / ${location.areaCode}`
      : location.shelfCode
    : location.areaCode ?? location.locationKey;

  const defaultPosition = useMemo(
    () => new Vector3(bounds.width * 0.6, Math.max(bounds.depth * 0.7, 5), bounds.depth * 0.95 + 3.2),
    [bounds.depth, bounds.width],
  );
  const defaultTarget = useMemo(() => new Vector3(0, 0.6, 0), []);
  const fog = useMemo(() => new FogExp2('#06080f', 0.018), []);

  const reflectorSize = useMemo<[number, number]>(
    () => [Math.max(bounds.width, 14) + 18, Math.max(bounds.depth, 12) + 16],
    [bounds.width, bounds.depth],
  );

  if (contextLost) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-sm text-slate-300">
        <span>Grafik bağlamı kayboldu, sahne yeniden yükleniyor...</span>
      </div>
    );
  }

  return (
    <Canvas
      shadows
      dpr={[Math.max(dpr - 0.4, 0.6), dpr]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
      onCreated={({ gl, scene }) => {
        scene.fog = fog;
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          setContextLost(true);
          window.setTimeout(() => setContextLost(false), 250);
        });
      }}
      onPointerMissed={() => onSelectRack(null, [])}
      style={{ background: 'radial-gradient(circle at 50% 0%, #0f1d33 0%, #06080f 70%)' }}
    >
      <PerformanceMonitor
        onIncline={() => setDpr((prev) => Math.min(prev + 0.15, 1.75))}
        onDecline={() => {
          setDpr((prev) => Math.max(prev - 0.2, 0.7));
          setReflectorEnabled(false);
        }}
        flipflops={3}
        onFallback={() => {
          setDpr(0.85);
          setReflectorEnabled(false);
        }}
      />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[defaultPosition.x, defaultPosition.y, defaultPosition.z]}
        fov={48}
        near={0.1}
        far={140}
      />
      <OrbitControls
        ref={controlsRef}
        target={[defaultTarget.x, defaultTarget.y, defaultTarget.z]}
        enableDamping
        dampingFactor={0.075}
        minDistance={2.2}
        maxDistance={36}
        maxPolarAngle={Math.PI / 2.05}
        zoomSpeed={0.85}
        rotateSpeed={0.65}
        panSpeed={0.7}
      />

      <CameraDriver
        preset={cameraPreset}
        version={cameraPresetVersion}
        cameraRef={cameraRef}
        controlsRef={controlsRef}
        defaultPosition={defaultPosition}
        defaultTarget={defaultTarget}
        bounds={bounds}
        disabled={selectedRackKey !== null}
      />
      <RackFocusDriver
        selectedRackKey={selectedRackKey}
        groups={groups}
        cameraRef={cameraRef}
        controlsRef={controlsRef}
        defaultPosition={defaultPosition}
        defaultTarget={defaultTarget}
      />

      <ambientLight intensity={0.42} color="#cbd5f5" />
      <hemisphereLight intensity={0.5} color="#9bb7ff" groundColor="#020617" />
      <directionalLight
        position={[bounds.width * 0.7 + 3, 16, bounds.depth * 0.6 + 5]}
        intensity={1.15}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-bounds.width - 4}
        shadow-camera-right={bounds.width + 4}
        shadow-camera-top={bounds.depth + 4}
        shadow-camera-bottom={-bounds.depth - 4}
        shadow-bias={-0.0008}
      />
      <directionalLight
        position={[-bounds.width * 0.6 - 2, 9, -bounds.depth * 0.4 - 3]}
        intensity={0.45}
        color="#7dd3fc"
      />
      <directionalLight position={[0, 6, -bounds.depth * 0.9 - 4]} intensity={0.55} color="#fde68a" />
      <pointLight
        position={[-bounds.width / 2, 4.5, -bounds.depth / 2]}
        intensity={0.55}
        color="#38bdf8"
        distance={bounds.width + 12}
        decay={2}
      />
      <pointLight
        position={[bounds.width / 2, 4.5, bounds.depth / 2]}
        intensity={0.45}
        color="#a5f3fc"
        distance={bounds.width + 12}
        decay={2}
      />

      <Suspense fallback={null}>
        <Environment preset="warehouse" />
      </Suspense>

      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={reflectorSize} />
        {reflectorEnabled ? (
          <MeshReflectorMaterial
            blur={[420, 120]}
            resolution={1024}
            mixBlur={1.1}
            mixStrength={32}
            mixContrast={1.1}
            roughness={0.85}
            depthScale={1.05}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0b1220"
            metalness={0.55}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial color="#0b1220" metalness={0.4} roughness={0.85} />
        )}
      </mesh>

      <ContactShadows
        position={[0, 0.012, 0]}
        opacity={0.6}
        scale={Math.max(bounds.width, bounds.depth) + 6}
        blur={2.4}
        far={6}
        resolution={1024}
        color="#000000"
      />

      <LocationPad width={bounds.width} depth={bounds.depth} label={padLabel} />

      <Suspense fallback={null}>
        {groups.map((group) => (
          <PlateStack
            key={group.key}
            items={group.items}
            position={group.position}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
            resolveImageUrl={resolveImageUrl}
            isExpanded={selectedRackKey === group.key}
            onRackClick={() =>
              onSelectRack(
                selectedRackKey === group.key ? null : group.key,
                group.items,
              )
            }
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
