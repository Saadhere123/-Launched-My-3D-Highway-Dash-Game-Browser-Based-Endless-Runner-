import { useSyncExternalStore } from "react";
import { COINS_PER_LEVEL, MAX_LEVEL } from "./constants";

export type GameState = "menu" | "playing" | "gameover" | "victory";

type StoreData = {
  state: GameState;
  score: number;
  best: number;
  speed: number;
  level: number;
  levelProgress: number; // 0..1 toward next level
  coins: number;
  lastLevelUp: number; // timestamp (ms) of the most recent level up — used for HUD toast
};

let data: StoreData = {
  state: "menu",
  score: 0,
  best: Number(localStorage.getItem("runner_best") || "0"),
  speed: 0,
  level: 1,
  levelProgress: 0,
  coins: Number(localStorage.getItem("runner_coins") || "0"),
  lastLevelUp: 0,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persistCoins(coins: number) {
  localStorage.setItem("runner_coins", String(coins));
}

export const store = {
  get(): StoreData {
    return data;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setState(state: GameState) {
    data = { ...data, state };
    emit();
  },
  setScore(score: number) {
    data = { ...data, score };
    emit();
  },
  setSpeed(speed: number) {
    if (data.speed === speed) return;
    data = { ...data, speed };
    emit();
  },
  setLevelProgress(progress: number) {
    if (Math.abs(data.levelProgress - progress) < 0.005) return;
    data = { ...data, levelProgress: progress };
    emit();
  },
  /** Advance to next level, awards coins, returns the new level. */
  levelUp(): number {
    const nextLevel = Math.min(MAX_LEVEL, data.level + 1);
    const newCoins = data.coins + COINS_PER_LEVEL;
    persistCoins(newCoins);
    data = {
      ...data,
      level: nextLevel,
      coins: newCoins,
      levelProgress: 0,
      lastLevelUp: Date.now(),
    };
    emit();
    return nextLevel;
  },
  start() {
    data = {
      ...data,
      state: "playing",
      score: 0,
      speed: 0,
      level: 1,
      levelProgress: 0,
    };
    emit();
  },
  gameOver() {
    const best = Math.max(data.best, data.score);
    if (best !== data.best) {
      localStorage.setItem("runner_best", String(best));
    }
    data = { ...data, state: "gameover", best };
    emit();
  },
  victory() {
    const best = Math.max(data.best, data.score);
    if (best !== data.best) {
      localStorage.setItem("runner_best", String(best));
    }
    // Bonus coins for clearing all 100 levels
    const newCoins = data.coins + 1000;
    persistCoins(newCoins);
    data = { ...data, state: "victory", best, coins: newCoins };
    emit();
  },
};

export function useGameStore<T>(selector: (s: StoreData) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}
