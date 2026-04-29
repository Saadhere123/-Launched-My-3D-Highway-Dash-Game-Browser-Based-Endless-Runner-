import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_DEPTH,
  COLORS,
} from "./constants";

export type PlayerHandle = {
  group: THREE.Group | null;
  setRunning: (running: boolean) => void;
};

type Props = {
  isJumping: boolean;
};

export const Player = forwardRef<PlayerHandle, Props>(function Player(
  { isJumping },
  ref,
) {
  const group = useRef<THREE.Group>(null);
  const leftLegPivot = useRef<THREE.Group>(null);
  const rightLegPivot = useRef<THREE.Group>(null);
  const leftArmPivot = useRef<THREE.Group>(null);
  const rightArmPivot = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const torso = useRef<THREE.Mesh>(null);
  const runningRef = useRef(true);

  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return group.current;
      },
      setRunning: (r: boolean) => {
        runningRef.current = r;
      },
    }),
    [],
  );

  const legHeight = 0.7;
  const torsoHeight = 0.7;
  const headSize = 0.4;
  const armLength = 0.6;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!runningRef.current) {
      if (leftLegPivot.current) leftLegPivot.current.rotation.x = 0;
      if (rightLegPivot.current) rightLegPivot.current.rotation.x = 0;
      if (leftArmPivot.current) leftArmPivot.current.rotation.x = 0;
      if (rightArmPivot.current) rightArmPivot.current.rotation.x = 0;
      return;
    }
    if (isJumping) {
      // tucked-up jump pose
      if (leftLegPivot.current) leftLegPivot.current.rotation.x = -0.6;
      if (rightLegPivot.current) rightLegPivot.current.rotation.x = -0.6;
      if (leftArmPivot.current) leftArmPivot.current.rotation.x = 1.4;
      if (rightArmPivot.current) rightArmPivot.current.rotation.x = 1.4;
      if (head.current) head.current.position.y = legHeight + torsoHeight + headSize / 2;
      return;
    }
    const cycle = Math.sin(t * 14) * 0.9;
    if (leftLegPivot.current) leftLegPivot.current.rotation.x = cycle;
    if (rightLegPivot.current) rightLegPivot.current.rotation.x = -cycle;
    if (leftArmPivot.current) leftArmPivot.current.rotation.x = -cycle * 0.8;
    if (rightArmPivot.current) rightArmPivot.current.rotation.x = cycle * 0.8;
    if (head.current)
      head.current.position.y =
        legHeight + torsoHeight + headSize / 2 + Math.sin(t * 14) * 0.04;
    if (torso.current) torso.current.rotation.z = Math.sin(t * 14) * 0.05;
  });

  return (
    <group ref={group}>
      {/* Left leg pivot at hip */}
      <group ref={leftLegPivot} position={[-0.2, legHeight, 0]}>
        <mesh position={[0, -legHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.28, legHeight, 0.32]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[0, -legHeight + 0.05, 0.1]} castShadow>
          <boxGeometry args={[0.32, 0.12, 0.5]} />
          <meshStandardMaterial color="#0b1220" />
        </mesh>
      </group>

      {/* Right leg pivot at hip */}
      <group ref={rightLegPivot} position={[0.2, legHeight, 0]}>
        <mesh position={[0, -legHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.28, legHeight, 0.32]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[0, -legHeight + 0.05, 0.1]} castShadow>
          <boxGeometry args={[0.32, 0.12, 0.5]} />
          <meshStandardMaterial color="#0b1220" />
        </mesh>
      </group>

      {/* Torso */}
      <mesh
        ref={torso}
        position={[0, legHeight + torsoHeight / 2, 0]}
        castShadow
      >
        <boxGeometry args={[PLAYER_WIDTH, torsoHeight, PLAYER_DEPTH]} />
        <meshStandardMaterial color={COLORS.player} />
      </mesh>

      {/* Arms - pivot at shoulder */}
      <group
        ref={leftArmPivot}
        position={[-PLAYER_WIDTH / 2 - 0.05, legHeight + torsoHeight - 0.05, 0]}
      >
        <mesh position={[0, -armLength / 2, 0]} castShadow>
          <boxGeometry args={[0.22, armLength, 0.22]} />
          <meshStandardMaterial color={COLORS.player} />
        </mesh>
      </group>
      <group
        ref={rightArmPivot}
        position={[PLAYER_WIDTH / 2 + 0.05, legHeight + torsoHeight - 0.05, 0]}
      >
        <mesh position={[0, -armLength / 2, 0]} castShadow>
          <boxGeometry args={[0.22, armLength, 0.22]} />
          <meshStandardMaterial color={COLORS.player} />
        </mesh>
      </group>

      {/* Head */}
      <mesh
        ref={head}
        position={[0, legHeight + torsoHeight + headSize / 2, 0]}
        castShadow
      >
        <boxGeometry args={[headSize, headSize, headSize]} />
        <meshStandardMaterial color={COLORS.playerHead} />
      </mesh>
      {/* Hair tuft */}
      <mesh
        position={[0, legHeight + torsoHeight + headSize + 0.05, -0.05]}
        castShadow
      >
        <boxGeometry args={[headSize * 0.8, 0.1, headSize * 0.8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
});

export const PLAYER_DIMS = {
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  depth: PLAYER_DEPTH,
};
