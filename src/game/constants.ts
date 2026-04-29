export const LANE_WIDTH = 2.4;
export const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];
export const ROAD_WIDTH = 9;
export const ROAD_LENGTH = 200;

export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.7;
export const PLAYER_DEPTH = 0.5;
export const PLAYER_BASE_Y = PLAYER_HEIGHT / 2;

export const GRAVITY = -38;
export const JUMP_VELOCITY = 13;

export const CAR_WIDTH = 1.6;
export const CAR_HEIGHT = 1.2;
export const CAR_LENGTH = 3.2;

export const INITIAL_SPEED = 18;
export const MAX_SPEED = 55;
export const SPEED_RAMP_PER_SEC = 0.35;

export const MAX_LEVEL = 100;
export const DISTANCE_PER_LEVEL = 250;
export const COINS_PER_LEVEL = 50;

/** Speed for a given level (1..MAX_LEVEL). */
export function speedForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, level));
  const t = (clamped - 1) / (MAX_LEVEL - 1);
  return INITIAL_SPEED + t * (MAX_SPEED - INITIAL_SPEED);
}

export const SPAWN_Z = -90;
export const DESPAWN_Z = 12;

export const MIN_SPAWN_INTERVAL = 0.55;
export const MAX_SPAWN_INTERVAL = 1.4;

export const COLORS = {
  sky: "#0a0e1a",
  fog: "#0a0e1a",
  road: "#1a1d29",
  roadEdge: "#2a2f45",
  laneLine: "#f5d76e",
  grass: "#0d2818",
  player: "#4ade80",
  playerHead: "#fbbf24",
  carBody: ["#ef4444", "#3b82f6", "#a855f7", "#f97316", "#ec4899", "#06b6d4"],
  carWindow: "#0f172a",
  carWheel: "#111827",
  building: ["#1e293b", "#334155", "#475569"],
  streetLight: "#fde68a",
};
