import { Ban, Pause, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CHARACTER_BY_ID } from "../data/characters";
import { MAP_BY_ID } from "../data/maps";
import { pauseRun, runtime } from "../runtime";
import { formatTime, useSettings, useStats } from "../store";
import { clickSfx } from "./kit";

const REASON: Record<string, string> = { coin: "MOEDA COLETADA!", collision: "COLISÃO!", fall: "CAIU DA PISTA!" };

export function HUD() {
  const timer = useRef<HTMLSpanElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  const best = useStats((s) => s.bestTime);
  const keys = useStats((s) => s.keys);
  const mapId = useSettings((s) => s.map);
  const charId = useSettings((s) => s.character);
  const [dead, setDead] = useState<string | null>(null);
  const [beating, setBeating] = useState(false);

  useEffect(() => {
    let raf = 0;
    let lastDead: string | null = null;
    let lastBeat = false;
    const loop = () => {
      const sim = runtime.sim;
      if (sim && timer.current) {
        timer.current.textContent = formatTime(sim.time);
        if (speed.current) speed.current.textContent = `${Math.round(sim.speed * 3.6)} km/h`;
        const d = sim.status === "dead" ? sim.reason : null;
        if (d !== lastDead) {
          lastDead = d;
          setDead(d);
        }
        const b = best > 0 && sim.time > best;
        if (b !== lastBeat) {
          lastBeat = b;
          setBeating(b);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [best]);

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div className="flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-col gap-1.5">
          <span className="chip max-w-[40vw] truncate">{MAP_BY_ID[mapId]?.name}</span>
          <span className="chip max-w-[40vw] truncate">{CHARACTER_BY_ID[charId]?.name}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={cn("glass px-4 py-1.5 text-center", dead && "border-primary")}>
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              <Ban className="h-3 w-3 text-primary" /> {runtime.training ? "TREINO 3 FILEIRAS" : "NO COIN TIME"}
            </div>
            <span ref={timer} className={cn("timer-text block text-3xl sm:text-4xl", beating ? "text-success" : "text-foreground")}>
              00:00.00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="chip">
              <Trophy className="h-3 w-3 text-coin" />
              <span className="timer-text text-coin">{formatTime(best)}</span>
            </span>
            <span className="chip">
              <span className={cn("h-2 w-2 rounded-full", dead ? "bg-primary" : "animate-pulse-dot bg-success")} />
              {dead ? "ENCERRADO" : runtime.training ? runtime.timeScale.toFixed(2) + "× TREINO" : "DESAFIO ATIVO"}
            </span>
            <span className="chip text-sky-300">🔑 {keys}</span>
          </div>
          <span ref={speed} className="timer-text mt-1 text-[10px] text-muted-foreground" />
        </div>
        <button
          type="button"
          aria-label="Pausar"
          onClick={() => {
            clickSfx();
            pauseRun();
          }}
          className="arcade-btn pointer-events-auto h-11 w-11 p-0"
        >
          <Pause className="h-5 w-5" />
        </button>
      </div>
      {dead && (
        <>
          <div className={cn("animate-flash-out absolute inset-0", dead === "coin" ? "bg-coin" : "bg-primary")} />
          <div className="absolute inset-x-0 top-1/3 flex justify-center">
            <div className="animate-pop-in font-display text-3xl text-foreground text-stroke sm:text-5xl">{REASON[dead]}</div>
          </div>
        </>
      )}
    </div>
  );
}
