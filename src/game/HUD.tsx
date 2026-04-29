import { useEffect, useState } from "react";
import { store, useGameStore, type GameState } from "./store";
import { COINS_PER_LEVEL, MAX_LEVEL } from "./constants";

function CoinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.5" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="900"
        fontSize="9"
        fill="#92400e"
      >
        $
      </text>
    </svg>
  );
}

function LevelUpToast() {
  const lastLevelUp = useGameStore((s) => s.lastLevelUp);
  const level = useGameStore((s) => s.level);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastLevelUp) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, [lastLevelUp]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-28 flex justify-center">
      <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 text-black px-6 py-3 shadow-2xl shadow-amber-500/40 border border-amber-200 animate-[fadeUp_.4s_ease-out]">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-900">
              Level Up
            </div>
            <div className="text-2xl font-black leading-none mt-0.5">
              Level {level}
            </div>
          </div>
          <div className="h-10 w-px bg-amber-700/30" />
          <div className="flex items-center gap-1.5">
            <CoinIcon className="w-6 h-6" />
            <span className="text-xl font-black">+{COINS_PER_LEVEL}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HUD({ state }: { state: GameState }) {
  const score = useGameStore((s) => s.score);
  const best = useGameStore((s) => s.best);
  const speed = useGameStore((s) => s.speed);
  const level = useGameStore((s) => s.level);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const coins = useGameStore((s) => s.coins);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      {/* Top bar - playing */}
      {state === "playing" && (
        <>
          <div className="flex items-start justify-between p-5 text-white gap-3">
            <div className="rounded-2xl bg-black/45 backdrop-blur-md px-5 py-3 border border-white/10">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                Score
              </div>
              <div className="text-3xl font-bold tabular-nums leading-none mt-1">
                {score.toLocaleString()}
              </div>
            </div>

            {/* Center: level + progress */}
            <div className="rounded-2xl bg-black/45 backdrop-blur-md px-5 py-3 border border-white/10 flex-1 max-w-xs">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/60">
                <span>Level</span>
                <span className="text-amber-300 font-mono">
                  {level} / {MAX_LEVEL}
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.round(levelProgress * 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-amber-300">
                <CoinIcon />
                <span className="text-base font-bold tabular-nums">
                  {coins.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-black/45 backdrop-blur-md px-5 py-3 border border-white/10 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                Speed
              </div>
              <div className="text-3xl font-bold tabular-nums leading-none mt-1">
                {Math.round(speed * 3.6)}
                <span className="text-sm text-white/60 ml-1">km/h</span>
              </div>
            </div>
          </div>

          <LevelUpToast />
        </>
      )}

      {/* Center overlays */}
      {state !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto rounded-3xl bg-black/65 backdrop-blur-xl border border-white/10 shadow-2xl px-10 py-9 max-w-md w-[90%] text-center">
            {state === "menu" && (
              <>
                <div className="text-xs uppercase tracking-[0.3em] text-emerald-300/80 mb-2">
                  3D Endless Runner
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  HIGHWAY DASH
                </h1>
                <p className="text-white/70 mt-3 text-sm leading-relaxed">
                  Sprint down the highway across {MAX_LEVEL} levels. Each level
                  cleared makes you faster and rewards you with coins. Dodge
                  oncoming cars by switching lanes — or jump straight over
                  them.
                </p>
                <div className="flex items-center justify-center gap-2 mt-3 text-amber-300">
                  <CoinIcon className="w-5 h-5" />
                  <span className="font-bold text-lg tabular-nums">
                    {coins.toLocaleString()}
                  </span>
                  <span className="text-white/50 text-xs uppercase tracking-widest ml-1">
                    Coins
                  </span>
                </div>
              </>
            )}

            {state === "gameover" && (
              <>
                <div className="text-xs uppercase tracking-[0.3em] text-rose-300/80 mb-2">
                  Game Over
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  YOU CRASHED
                </h1>
                <div className="grid grid-cols-3 gap-2 mt-5">
                  <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                      Score
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">
                      {score.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                      Level
                    </div>
                    <div className="text-xl font-bold text-emerald-300 tabular-nums">
                      {level}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                      Best
                    </div>
                    <div className="text-xl font-bold text-amber-300 tabular-nums">
                      {best.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 text-amber-300">
                  <CoinIcon className="w-5 h-5" />
                  <span className="font-bold text-lg tabular-nums">
                    {coins.toLocaleString()}
                  </span>
                  <span className="text-white/50 text-xs uppercase tracking-widest ml-1">
                    Total Coins
                  </span>
                </div>
              </>
            )}

            {state === "victory" && (
              <>
                <div className="text-xs uppercase tracking-[0.3em] text-amber-300 mb-2">
                  Champion
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  HIGHWAY MASTERED!
                </h1>
                <p className="text-white/70 mt-3 text-sm">
                  You cleared all {MAX_LEVEL} levels. Bonus reward: 1,000 coins!
                </p>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                      Final Score
                    </div>
                    <div className="text-2xl font-bold text-white tabular-nums">
                      {score.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex flex-col items-center justify-center">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                      Coins
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CoinIcon className="w-5 h-5" />
                      <div className="text-2xl font-bold text-amber-300 tabular-nums">
                        {coins.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => store.start()}
              className="mt-7 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 transition text-black font-bold py-3 text-lg tracking-wide shadow-lg shadow-emerald-500/30"
            >
              {state === "menu"
                ? "Start Running"
                : state === "victory"
                  ? "Play Again"
                  : "Run Again"}
            </button>

            <div className="mt-6 grid grid-cols-3 gap-2 text-white/80 text-xs">
              <div className="rounded-lg bg-white/5 border border-white/10 py-2">
                <div className="font-mono text-base text-white">A / ←</div>
                <div className="text-[10px] text-white/50 mt-0.5">Left</div>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 py-2">
                <div className="font-mono text-base text-white">SPACE</div>
                <div className="text-[10px] text-white/50 mt-0.5">Jump</div>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 py-2">
                <div className="font-mono text-base text-white">D / →</div>
                <div className="text-[10px] text-white/50 mt-0.5">Right</div>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-white/40 uppercase tracking-widest">
              On mobile: swipe left/right · tap or swipe up to jump
            </div>
          </div>
        </div>
      )}

      {state === "playing" && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-xs uppercase tracking-[0.25em]">
          A / D — switch lanes &nbsp; · &nbsp; SPACE — jump
        </div>
      )}
    </div>
  );
}
