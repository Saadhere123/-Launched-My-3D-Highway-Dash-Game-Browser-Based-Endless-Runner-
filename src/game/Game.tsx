import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Player, type PlayerHandle } from "./Player";
import { CarMesh } from "./Car";
import {
  Ground,
  ScrollingLaneLines,
  ScrollingRoad,
  ScrollingScenery,
  StreetLights,
} from "./Scenery";
import {
  CAR_HEIGHT,
  CAR_LENGTH,
  CAR_WIDTH,
  COLORS,
  DESPAWN_Z,
  DISTANCE_PER_LEVEL,
  GRAVITY,
  INITIAL_SPEED,
  JUMP_VELOCITY,
  LANES,
  MAX_LEVEL,
  MAX_SPAWN_INTERVAL,
  MAX_SPEED,
  MIN_SPAWN_INTERVAL,
  PLAYER_BASE_Y,
  PLAYER_DEPTH,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SPAWN_Z,
  speedForLevel,
} from "./constants";
import { store, useGameStore } from "./store";
import { HUD } from "./HUD";

type Car = {
  id: number;
  lane: number; // index into LANES
  z: number;
  color: string;
};

const PLAYER_BASE_Z = 4;
const COLLISION_PADDING_X = -0.05; // a touch of forgiveness
const COLLISION_PADDING_Z = -0.1;

function World() {
  const playerRef = useRef<PlayerHandle>(null);
  const carsGroupRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const { camera } = useThree();

  // Game runtime refs (no re-renders)
  const stateRef = useRef(store.get().state);
  const levelRef = useRef(1);
  const speedRef = useRef(speedForLevel(1));
  const distanceRef = useRef(0);
  const levelDistanceRef = useRef(0);
  const targetLane = useRef(1); // index 0..2
  const playerX = useRef(LANES[1]);
  const playerY = useRef(PLAYER_BASE_Y);
  const velocityY = useRef(0);
  const isJumpingRef = useRef(false);
  const carsRef = useRef<Car[]>([]);
  const carMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const carIdRef = useRef(0);
  const spawnTimerRef = useRef(1.5);
  const lastScoreInt = useRef(0);
  const carScoreSet = useRef<Set<number>>(new Set());
  const [, force] = useState(0);
  const cameraShake = useRef(0);
  const levelFlashRef = useRef(0); // brief boost / glow after level up

  // Subscribe to game state changes
  useEffect(() => {
    return store.subscribe(() => {
      const s = store.get().state;
      const prev = stateRef.current;
      stateRef.current = s;
      if (s === "playing" && prev !== "playing") {
        // reset
        levelRef.current = 1;
        speedRef.current = speedForLevel(1);
        distanceRef.current = 0;
        levelDistanceRef.current = 0;
        targetLane.current = 1;
        playerX.current = LANES[1];
        playerY.current = PLAYER_BASE_Y;
        velocityY.current = 0;
        isJumpingRef.current = false;
        carsRef.current = [];
        carScoreSet.current.clear();
        spawnTimerRef.current = 1.2;
        lastScoreInt.current = 0;
        levelFlashRef.current = 0;
        // clear meshes
        carMeshesRef.current.clear();
        if (carsGroupRef.current) {
          while (carsGroupRef.current.children.length > 0) {
            carsGroupRef.current.remove(carsGroupRef.current.children[0]);
          }
        }
        force((n) => n + 1);
      }
    });
  }, []);

  // Keyboard input
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const s = store.get().state;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (s === "menu") {
          store.start();
          return;
        }
        if (s === "gameover") {
          store.start();
          return;
        }
        // jump
        if (!isJumpingRef.current && Math.abs(playerY.current - PLAYER_BASE_Y) < 0.01) {
          velocityY.current = JUMP_VELOCITY;
          isJumpingRef.current = true;
        }
        return;
      }
      if (s !== "playing") return;
      if (e.code === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        targetLane.current = Math.max(0, targetLane.current - 1);
      } else if (e.code === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        targetLane.current = Math.min(LANES.length - 1, targetLane.current + 1);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Touch / swipe input for mobile
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    function onStart(e: TouchEvent) {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startTime = performance.now();
    }
    function onEnd(e: TouchEvent) {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = performance.now() - startTime;
      const s = store.get().state;
      if (s !== "playing") {
        if (dt < 400 && Math.hypot(dx, dy) < 30) {
          store.start();
        }
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        if (dx < 0) targetLane.current = Math.max(0, targetLane.current - 1);
        else targetLane.current = Math.min(LANES.length - 1, targetLane.current + 1);
      } else if (-dy > 30 || (dt < 250 && Math.hypot(dx, dy) < 30)) {
        if (
          !isJumpingRef.current &&
          Math.abs(playerY.current - PLAYER_BASE_Y) < 0.01
        ) {
          velocityY.current = JUMP_VELOCITY;
          isJumpingRef.current = true;
        }
      }
    }
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  function spawnCar() {
    // Pick a lane (avoid the same lane twice in a row close ahead by checking last car)
    const lane = Math.floor(Math.random() * LANES.length);
    const color =
      COLORS.carBody[Math.floor(Math.random() * COLORS.carBody.length)];
    const id = carIdRef.current++;
    carsRef.current.push({ id, lane, z: SPAWN_Z, color });
    force((n) => n + 1);
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // clamp dt to avoid tunneling on lag
    const gameState = stateRef.current;

    // Always update player smooth lateral movement & camera
    const targetX = LANES[targetLane.current];
    playerX.current += (targetX - playerX.current) * Math.min(1, dt * 14);

    // Jump physics
    if (gameState === "playing") {
      if (isJumpingRef.current || playerY.current > PLAYER_BASE_Y) {
        velocityY.current += GRAVITY * dt;
        playerY.current += velocityY.current * dt;
        if (playerY.current <= PLAYER_BASE_Y) {
          playerY.current = PLAYER_BASE_Y;
          velocityY.current = 0;
          isJumpingRef.current = false;
        }
      }
    } else {
      // ensure on ground
      playerY.current = PLAYER_BASE_Y;
      velocityY.current = 0;
      isJumpingRef.current = false;
    }

    if (playerRef.current?.group) {
      const g = playerRef.current.group;
      g.position.x = playerX.current;
      g.position.y = playerY.current - PLAYER_BASE_Y; // group origin is feet
      g.position.z = PLAYER_BASE_Z;
      // tilt slightly when sliding
      g.rotation.z = (targetX - playerX.current) * -0.15;
    }
    playerRef.current?.setRunning(gameState === "playing");

    // Camera follow
    if (cameraRef.current) {
      const cam = cameraRef.current;
      const targetCamX = playerX.current * 0.4;
      cam.position.x += (targetCamX - cam.position.x) * Math.min(1, dt * 4);
      cam.position.y = 4.5 + Math.sin(state.clock.elapsedTime * 14) * 0.04;
      cam.position.z = PLAYER_BASE_Z + 7.5;
      // small shake on game over
      if (cameraShake.current > 0) {
        cam.position.x += (Math.random() - 0.5) * cameraShake.current;
        cam.position.y += (Math.random() - 0.5) * cameraShake.current;
        cameraShake.current = Math.max(0, cameraShake.current - dt * 2);
      }
      cam.lookAt(playerX.current * 0.4, 1.2, PLAYER_BASE_Z - 6);
    }

    if (gameState !== "playing") {
      return;
    }

    // Level-based speed (with brief boost glow right after a level up)
    const baseSpeed = speedForLevel(levelRef.current);
    const boost = levelFlashRef.current > 0 ? 1 + levelFlashRef.current * 0.25 : 1;
    speedRef.current = baseSpeed * boost;
    if (levelFlashRef.current > 0) {
      levelFlashRef.current = Math.max(0, levelFlashRef.current - dt * 0.7);
    }
    const speed = speedRef.current;
    distanceRef.current += speed * dt;
    levelDistanceRef.current += speed * dt;

    // Level up when reaching the per-level distance threshold
    if (
      levelDistanceRef.current >= DISTANCE_PER_LEVEL &&
      levelRef.current < MAX_LEVEL
    ) {
      levelDistanceRef.current = 0;
      const newLevel = store.levelUp();
      levelRef.current = newLevel;
      levelFlashRef.current = 1;
      // Bonus score per level cleared
      store.setScore(store.get().score + 100);
      if (newLevel >= MAX_LEVEL) {
        // Reached max level — let them play out one more "lap" as victory lap
        // but mark their best and switch to victory after a brief pause
        setTimeout(() => {
          if (store.get().state === "playing") store.victory();
        }, 1500);
      }
    }
    store.setLevelProgress(
      Math.min(1, levelDistanceRef.current / DISTANCE_PER_LEVEL),
    );

    // Spawn cars
    spawnTimerRef.current -= dt;
    if (spawnTimerRef.current <= 0) {
      spawnCar();
      const ratio = (speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED);
      const interval =
        MAX_SPAWN_INTERVAL -
        ratio * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
      spawnTimerRef.current = interval * (0.7 + Math.random() * 0.6);
    }

    // Move cars and check collisions
    let removed = false;
    for (let i = carsRef.current.length - 1; i >= 0; i--) {
      const car = carsRef.current[i];
      car.z += speed * dt;

      // Update mesh position
      const mesh = carMeshesRef.current.get(car.id);
      if (mesh) {
        mesh.position.set(LANES[car.lane], CAR_HEIGHT / 2, car.z);
      }

      // Score: when car passes the player
      if (
        !carScoreSet.current.has(car.id) &&
        car.z > PLAYER_BASE_Z + CAR_LENGTH / 2 + 0.1
      ) {
        carScoreSet.current.add(car.id);
        const cur = store.get().score;
        store.setScore(cur + 10);
      }

      // Collision (AABB)
      const carX = LANES[car.lane];
      const carZ = car.z;
      const dx = Math.abs(carX - playerX.current);
      const dz = Math.abs(carZ - PLAYER_BASE_Z);
      const overlapX = dx < (CAR_WIDTH + PLAYER_WIDTH) / 2 + COLLISION_PADDING_X;
      const overlapZ = dz < (CAR_LENGTH + PLAYER_DEPTH) / 2 + COLLISION_PADDING_Z;
      // Vertical clearance: top of car is CAR_HEIGHT
      const playerBottom = playerY.current - PLAYER_HEIGHT / 2;
      const cleared = playerBottom > CAR_HEIGHT - 0.05;

      if (overlapX && overlapZ && !cleared) {
        cameraShake.current = 0.4;
        store.gameOver();
        return;
      }

      // Despawn
      if (car.z > DESPAWN_Z) {
        carsRef.current.splice(i, 1);
        carMeshesRef.current.delete(car.id);
        removed = true;
      }
    }
    if (removed) force((n) => n + 1);

    // Distance score every meter
    const distScore = Math.floor(distanceRef.current);
    if (distScore !== lastScoreInt.current) {
      const diff = distScore - lastScoreInt.current;
      lastScoreInt.current = distScore;
      store.setScore(store.get().score + diff);
    }

    store.setSpeed(speed);
  });

  // Sync camera ref to default camera
  useEffect(() => {
    cameraRef.current = camera as THREE.PerspectiveCamera;
    camera.position.set(0, 4.5, PLAYER_BASE_Z + 7.5);
    camera.lookAt(0, 1.2, PLAYER_BASE_Z - 6);
  }, [camera]);

  // Helper to get distance for scrolling backgrounds
  const getDistance = () => distanceRef.current;

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#cbd5ff", "#1a1330", 0.5]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={20}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />

      <fog attach="fog" args={[COLORS.fog, 25, 90]} />

      <Ground />
      <ScrollingRoad getDistance={getDistance} />
      <ScrollingLaneLines getDistance={getDistance} />
      <ScrollingScenery getDistance={getDistance} />
      <StreetLights getDistance={getDistance} />

      <Player ref={playerRef} isJumping={isJumpingRef.current} />

      <group ref={carsGroupRef}>
        {carsRef.current.map((c) => (
          <group
            key={c.id}
            ref={(g) => {
              if (g) carMeshesRef.current.set(c.id, g);
              else carMeshesRef.current.delete(c.id);
            }}
            position={[LANES[c.lane], CAR_HEIGHT / 2, c.z]}
          >
            <CarMesh color={c.color} />
          </group>
        ))}
      </group>
    </>
  );
}

export function Game() {
  const state = useGameStore((s) => s.state);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0e1a] select-none">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[COLORS.sky]} />
        <World />
      </Canvas>
      <HUD state={state} />
    </div>
  );
}
