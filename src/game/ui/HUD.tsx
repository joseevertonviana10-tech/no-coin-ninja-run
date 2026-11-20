import { Ban, ImagePlus, Pause, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CHARACTER_BY_ID } from "../data/characters";
import { getDistrict, MAP_BY_ID } from "../data/maps";
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
  const timerColor = useSettings((s) => s.timerColor);
  const timerRgb = useSettings((s) => s.timerRgb);
  const timerGlow = useSettings((s) => s.timerGlow);
  const timerSize = useSettings((s) => s.timerSize);
  const timerFont = useSettings((s) => s.timerFont);
  const [dead, setDead] = useState<string | null>(null);
  const [beating, setBeating] = useState(false);
  const [raceTime, setRaceTime] = useState(0);
  const [district, setDistrict] = useState(() => getDistrict(mapId, 0));
  const [timerPhoto, setTimerPhoto] = useState<string | null>(() => localStorage.getItem("nocoin-timer-photo"));
  const photoInput = useRef<HTMLInputElement>(null);
  const raceClock = useRef(0);

  useEffect(() => {
    let raf = 0;
    let lastDead: string | null = null;
    let lastBeat = false;
    const loop = () => {
      const sim = runtime.sim;
      if (sim && timer.current) {
        timer.current.textContent = formatTime(sim.time);
        timer.current.style.color = timerRgb ? "hsl(" + ((performance.now() * 0.045) % 360) + " 100% 68%)" : timerColor;
        timer.current.style.textShadow = timerGlow ? "0 0 7px currentColor, 0 0 18px currentColor" : "0 2px 4px rgba(0,0,0,0.9)";
        timer.current.style.fontSize = (3 * timerSize) + "rem";
        timer.current.style.fontFamily = timerFont === "mono" ? "monospace" : timerFont === "rounded" ? "system-ui, sans-serif" : "";
        const currentDistrict = getDistrict(mapId, sim.dist);
        if (currentDistrict !== district) setDistrict(currentDistrict);
        if (sim.time < raceClock.current) { raceClock.current = 0; setRaceTime(0); }
        if (runtime.challenge === "race" && sim.time - raceClock.current >= 0.25) {
          raceClock.current = sim.time;
          setRaceTime(sim.time);
        }
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
  }, [best, mapId, district, timerColor, timerRgb, timerGlow, timerSize, timerFont]);

  return (
    <div className="hud-screen pointer-events-none absolute inset-0 select-none">
      <div className="flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-col gap-1.5">
          <span className="chip max-w-[40vw] truncate">{MAP_BY_ID[mapId]?.name}</span>
          <span key={district} className="district-chip max-w-[44vw] truncate">📍 {district}</span>
          <span className="chip max-w-[40vw] truncate">{CHARACTER_BY_ID[charId]?.name}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={cn("glass hud-main-panel relative px-4 py-1.5 text-center", dead && "border-primary", timerPhoto && "bg-black/50")} style={timerPhoto ? { backgroundImage: `linear-gradient(#0006,#0006), url("${timerPhoto}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
            <input ref={photoInput} type="file" accept="image/*" className="hidden" aria-label="Escolher foto para o cronômetro" onChange={(e) => { const file = e.currentTarget.files?.[0]; if (!file || !file.type.startsWith("image/")) return; const reader = new FileReader(); reader.onload = () => { const image = new Image(); image.onload = () => { const scale = Math.min(1, 640 / Math.max(image.width, image.height)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const context = canvas.getContext("2d"); if (!context) return; context.drawImage(image, 0, 0, canvas.width, canvas.height); const data = canvas.toDataURL("image/jpeg", 0.82); localStorage.setItem("nocoin-timer-photo", data); setTimerPhoto(data); }; image.src = String(reader.result); }; reader.readAsDataURL(file); e.currentTarget.value = ""; }} />
            <button type="button" title="Colocar uma foto no cronômetro" aria-label="Colocar uma foto no cronômetro" onClick={() => photoInput.current?.click()} className="pointer-events-auto absolute right-1 top-1 rounded-md bg-black/35 p-1.5 text-white/90 hover:bg-black/60"><ImagePlus className="h-3.5 w-3.5" /></button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              <Ban className="h-3 w-3 text-primary" /> {runtime.challenge === "race" ? "CORRIDA CONTRA BOTS" : runtime.challenge === "nerdola" ? "TREINO NERDOLA" : runtime.challenge === "run-normal" ? "TREINO RUN NORMAL" : runtime.training ? "TREINO 3 FILEIRAS" : "NO COIN TIME"}
            </div>
            <span ref={timer} className={cn("timer-text block text-3xl sm:text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]", beating ? "text-success" : "text-foreground")}>00:00.00</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="chip">
              <Trophy className="h-3 w-3 text-coin" />
              <span className="timer-text text-coin">{formatTime(best)}</span>
            </span>
            <span className="chip">
              <span className={cn("h-2 w-2 rounded-full", dead ? "bg-primary" : "animate-pulse-dot bg-success")} />
              {dead ? "ENCERRADO" : runtime.training ? runtime.timeScale.toFixed(2).replace(".", ",") + "× TREINO" : runtime.challenge === "race" ? `${runtime.raceBots.filter((b) => b.finished).length}/${runtime.raceBots.length} BOTS FORA` : "DESAFIO ATIVO"}
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
      {runtime.challenge === "race" && (
        <div className="glass absolute right-2 top-20 z-20 flex w-36 flex-col gap-2 p-2 text-[10px] sm:right-4 sm:top-24 sm:w-48 sm:p-3 sm:text-xs">
          {runtime.raceBots.map((bot) => (
            <div key={bot.id} className="rounded-lg bg-muted/60 p-2">
              <div className="flex items-center justify-between gap-2"><span className="font-bold">{bot.name}</span><span className={bot.finished ? "text-success" : "text-coin"}>{bot.finished ? "PRONTO" : formatTime(Math.max(0, bot.finishAt - raceTime))}</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, raceTime / bot.finishAt * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      )}
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
