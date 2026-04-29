import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, ROAD_LENGTH, ROAD_WIDTH } from "./constants";

const REPEAT = ROAD_LENGTH;

/**
 * Scrolls a tiled element relative to player Z position.
 * Player stays at z=0, world recedes toward +Z so trees come toward camera.
 */
export function ScrollingRoad({ getDistance }: { getDistance: () => number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const d = getDistance();
    // place strip so its midpoint is centered on a sliding window
    meshRef.current.position.z = (d % REPEAT) - REPEAT / 2;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[ROAD_WIDTH, REPEAT * 2]} />
      <meshStandardMaterial color={COLORS.road} />
    </mesh>
  );
}

export function ScrollingLaneLines({ getDistance }: { getDistance: () => number }) {
  // Pre-compute lane line dashes for two lane dividers.
  const dashes = useMemo(() => {
    const arr: number[] = [];
    const spacing = 5;
    const count = Math.floor((REPEAT * 2) / spacing);
    for (let i = 0; i < count; i++) {
      arr.push(-REPEAT + i * spacing);
    }
    return arr;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const d = getDistance();
    groupRef.current.position.z = (d % 5);
  });

  return (
    <group ref={groupRef}>
      {dashes.map((z, i) => (
        <group key={i} position={[0, 0.01, z]}>
          <mesh position={[-2.4 / 2 - 1.2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.18, 2]} />
            <meshStandardMaterial color={COLORS.laneLine} emissive={COLORS.laneLine} emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[2.4 / 2 + 1.2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.18, 2]} />
            <meshStandardMaterial color={COLORS.laneLine} emissive={COLORS.laneLine} emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Ground() {
  return (
    <>
      {/* Grass — left side */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-ROAD_WIDTH / 2 - 50, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 600]} />
        <meshStandardMaterial color={COLORS.grass} />
      </mesh>
      {/* Grass — right side */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[ROAD_WIDTH / 2 + 50, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 600]} />
        <meshStandardMaterial color={COLORS.grass} />
      </mesh>
      {/* Road edges (curbs) */}
      <mesh position={[-ROAD_WIDTH / 2 - 0.15, 0.1, 0]}>
        <boxGeometry args={[0.3, 0.2, 600]} />
        <meshStandardMaterial color={COLORS.roadEdge} />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2 + 0.15, 0.1, 0]}>
        <boxGeometry args={[0.3, 0.2, 600]} />
        <meshStandardMaterial color={COLORS.roadEdge} />
      </mesh>
    </>
  );
}

type SideProp = { x: number; z: number; height: number; color: string };

function makeProps(side: 1 | -1, count: number, seed: number): SideProp[] {
  const props: SideProp[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    const z = -REPEAT + (i / count) * (REPEAT * 2) + (rand() - 0.5) * 8;
    const x = side * (ROAD_WIDTH / 2 + 6 + rand() * 30);
    const height = 4 + rand() * 14;
    const c = COLORS.building[Math.floor(rand() * COLORS.building.length)];
    props.push({ x, z, height, color: c });
  }
  return props;
}

export function ScrollingScenery({
  getDistance,
}: {
  getDistance: () => number;
}) {
  const left = useMemo(() => makeProps(-1, 18, 12345), []);
  const right = useMemo(() => makeProps(1, 18, 67890), []);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const d = getDistance();
    groupRef.current.position.z = ((d % (REPEAT * 2)) - REPEAT);
  });

  return (
    <group ref={groupRef}>
      {[...left, ...right].map((p, i) => (
        <mesh key={i} position={[p.x, p.height / 2, p.z]} castShadow receiveShadow>
          <boxGeometry args={[6, p.height, 6]} />
          <meshStandardMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  );
}

export function StreetLights({
  getDistance,
}: {
  getDistance: () => number;
}) {
  const positions = useMemo(() => {
    const arr: number[] = [];
    const spacing = 18;
    const count = Math.floor((REPEAT * 2) / spacing);
    for (let i = 0; i < count; i++) arr.push(-REPEAT + i * spacing);
    return arr;
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    const d = getDistance();
    groupRef.current.position.z = ((d % 18));
  });

  return (
    <group ref={groupRef}>
      {positions.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          {/* Left pole */}
          <mesh position={[-ROAD_WIDTH / 2 - 0.6, 2, 0]} castShadow>
            <boxGeometry args={[0.18, 4, 0.18]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          <mesh position={[-ROAD_WIDTH / 2 - 0.2, 4, 0]}>
            <boxGeometry args={[0.7, 0.18, 0.4]} />
            <meshStandardMaterial color={COLORS.streetLight} emissive={COLORS.streetLight} emissiveIntensity={1.2} />
          </mesh>
          {/* Right pole */}
          <mesh position={[ROAD_WIDTH / 2 + 0.6, 2, 0]} castShadow>
            <boxGeometry args={[0.18, 4, 0.18]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          <mesh position={[ROAD_WIDTH / 2 + 0.2, 4, 0]}>
            <boxGeometry args={[0.7, 0.18, 0.4]} />
            <meshStandardMaterial color={COLORS.streetLight} emissive={COLORS.streetLight} emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
