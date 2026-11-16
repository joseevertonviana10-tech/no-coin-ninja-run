import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { audio } from "../audio";
import { MAPS } from "../data/maps";
import { DIFFICULTIES, type DifficultyId } from "../sim/constants";
import { formatTime, useSettings, useStats, useUI } from "../store";
import { ArcadeButton, clickSfx, pct, ScreenHeader, Segmented, SliderRow } from "./kit";

export function MapSelect() {
  const setScreen = useUI((s) => s.setScreen);
  const s = useSettings();
  const bestBy = useStats((st) => st.bestByMap);
  return (
    <div className="absolute inset-0 flex flex-col justify-between gap-3 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl">
        <ScreenHeader title="Mapas" onBack={() => setScreen("menu")} />
      </div>
      <div className="mx-auto w-full max-w-2xl animate-pop-in space-y-3">
        <div className="glass grid max-h-[38vh] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
          {MAPS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                clickSfx();
                s.set({ map: m.id });
                audio.startMusic(m.id);
              }}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                m.id === s.map ? "border-accent bg-secondary" : "border-border bg-muted/60 hover:bg-secondary",
              )}
            >
              <span
                className="h-12 w-12 shrink-0 rounded-lg border border-border"
                style={{ background: `linear-gradient(160deg, ${m.swatch[0]}, ${m.swatch[1]})` }}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{m.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{m.tagline}</span>
                <span className="timer-text text-xs text-coin">{formatTime(bestBy[m.id] ?? 0)}</span>
              </span>
              {m.id === s.map && <Check className="h-4 w-4 shrink-0 text-accent" />}
            </button>
          ))}
        </div>
        <div className="glass px-4 py-2">
          <div className="py-2 text-sm font-semibold">Dificuldade</div>
          <Segmented<DifficultyId>
            value={s.difficulty}
            onChange={(v) => s.set({ difficulty: v })}
            options={Object.values(DIFFICULTIES).map((d) => ({ value: d.id, label: d.label }))}
          />
          <SliderRow label="Velocidade da corrida" value={s.speedMult} min={0.6} max={1.6} step={0.05} format={pct} onChange={(v) => s.set({ speedMult: v })} />
        </div>
        <ArcadeButton variant="primary" className="w-full py-3 text-lg" onClick={() => setScreen("menu")}>
          CONFIRMAR
        </ArcadeButton>
      </div>
    </div>
  );
}
