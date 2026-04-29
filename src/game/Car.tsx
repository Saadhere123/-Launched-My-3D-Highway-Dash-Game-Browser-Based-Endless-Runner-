import * as THREE from "three";
import { useMemo } from "react";
import { CAR_HEIGHT, CAR_LENGTH, CAR_WIDTH, COLORS } from "./constants";

type Props = {
  color: string;
};

export function CarMesh({ color }: Props) {
  const wheelGeo = useMemo(() => new THREE.CylinderGeometry(0.32, 0.32, 0.25, 16), []);
  const wheelMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLORS.carWheel }),
    [],
  );

  const wheelOffsetX = CAR_WIDTH / 2;
  const wheelOffsetZ = CAR_LENGTH / 2 - 0.55;
  const wheelY = -CAR_HEIGHT / 2 + 0.2;

  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[CAR_WIDTH, CAR_HEIGHT * 0.55, CAR_LENGTH]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Cabin */}
      <mesh
        position={[0, CAR_HEIGHT * 0.4, -0.15]}
        castShadow
      >
        <boxGeometry
          args={[CAR_WIDTH * 0.85, CAR_HEIGHT * 0.45, CAR_LENGTH * 0.55]}
        />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Windshields */}
      <mesh position={[0, CAR_HEIGHT * 0.4, CAR_LENGTH * 0.13]} castShadow>
        <boxGeometry args={[CAR_WIDTH * 0.78, CAR_HEIGHT * 0.4, 0.02]} />
        <meshStandardMaterial color={COLORS.carWindow} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, CAR_HEIGHT * 0.4, -CAR_LENGTH * 0.43]} castShadow>
        <boxGeometry args={[CAR_WIDTH * 0.78, CAR_HEIGHT * 0.4, 0.02]} />
        <meshStandardMaterial color={COLORS.carWindow} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Headlights — facing player (toward +Z) */}
      <mesh position={[-CAR_WIDTH * 0.32, -0.05, CAR_LENGTH / 2 + 0.01]}>
        <boxGeometry args={[0.4, 0.18, 0.04]} />
        <meshStandardMaterial
          color="#fff7cc"
          emissive="#fff3a0"
          emissiveIntensity={1.6}
        />
      </mesh>
      <mesh position={[CAR_WIDTH * 0.32, -0.05, CAR_LENGTH / 2 + 0.01]}>
        <boxGeometry args={[0.4, 0.18, 0.04]} />
        <meshStandardMaterial
          color="#fff7cc"
          emissive="#fff3a0"
          emissiveIntensity={1.6}
        />
      </mesh>
      {/* Tail lights */}
      <mesh position={[-CAR_WIDTH * 0.32, -0.05, -CAR_LENGTH / 2 - 0.01]}>
        <boxGeometry args={[0.35, 0.15, 0.04]} />
        <meshStandardMaterial color="#7f1d1d" emissive="#dc2626" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[CAR_WIDTH * 0.32, -0.05, -CAR_LENGTH / 2 - 0.01]}>
        <boxGeometry args={[0.35, 0.15, 0.04]} />
        <meshStandardMaterial color="#7f1d1d" emissive="#dc2626" emissiveIntensity={0.6} />
      </mesh>

      {/* Wheels (cylinders rotated to align with X axis) */}
      <mesh
        geometry={wheelGeo}
        material={wheelMat}
        position={[-wheelOffsetX, wheelY, wheelOffsetZ]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      />
      <mesh
        geometry={wheelGeo}
        material={wheelMat}
        position={[wheelOffsetX, wheelY, wheelOffsetZ]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      />
      <mesh
        geometry={wheelGeo}
        material={wheelMat}
        position={[-wheelOffsetX, wheelY, -wheelOffsetZ]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      />
      <mesh
        geometry={wheelGeo}
        material={wheelMat}
        position={[wheelOffsetX, wheelY, -wheelOffsetZ]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      />
    </group>
  );
}
