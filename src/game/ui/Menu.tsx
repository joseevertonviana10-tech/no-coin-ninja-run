import { BarChart3, Map, Play, Settings, Shirt, Sparkles, Target, Trophy, Gem, Flag } from "lucide-react";
import { CHARACTER_BY_ID } from "../data/characters";
import { MAP_BY_ID } from "../data/maps";
import { startRun } from "../runtime";
import { DIFFICULTIES } from "../sim/constants";
import { formatTime, useSettings, useStats, useUI } from "../store";
import { ArcadeButton } from "./kit";

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="select-none text-center">
      <div className={small ? "flex items-center justify-center gap-2" : "flex items-center justify-center gap-3"}>
        <div className={`no-coin-badge relative flex shrink-0 items-center justify-center rounded-full ${small ? "h-9 w-9" : "h-12 w-12 sm:h-14 sm:w-14"}`}>
          <span className="font-display text-sm">$</span>
          <span className="absolute h-[3px] w-[120%] rotate-[-40deg] rounded-full bg-primary" />
        </div>
        <h1 className={`font-display leading-none text-foreground text-stroke ${small ? "text-2xl" : "text-4xl sm:text-6xl"}`}>
          NO COIN
        </h1>
      </div>
      <div className={`font-display tracking-[0.3em] text-accent text-stroke ${small ? "text-xs" : "mt-1 text-lg sm:text-2xl"}`}>SURFERS</div>
    </div>
  );
}

export function Menu() {
  const setScreen = useUI((s) => s.setScreen);
  const s = useSettings();
  const best = useStats((st) => st.bestTime);
  const map = MAP_BY_ID[s.map];
  const ch = CHARACTER_BY_ID[s.character];
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-8">
      <div className="pointer-events-auto mx-auto w-full max-w-md animate-pop-in pt-2 sm:mx-0 sm:max-w-sm">
        <Logo />
        <div className="mt-3 flex justify-center gap-2">
          <span className="chip">
            <Trophy className="h-3.5 w-3.5 text-coin" /> Recorde <span className="timer-text text-coin">{formatTime(best)}</span>
          </span>
        </div>
      </div>
      <div className="pointer-events-auto mx-auto w-full max-w-md animate-pop-in space-y-3 sm:mx-0 sm:max-w-sm">
        <div className="glass flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Personagem</div>
            <div className="truncate font-semibold">{ch?.name}</div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-xs text-muted-foreground">Mapa · {DIFFICULTIES[s.difficulty].label}</div>
            <div className="truncate font-semibold">{map?.name}</div>
          </div>
        </div>
        <ArcadeButton variant="primary" className="w-full py-4 text-2xl" onClick={startRun}>
          <Play className="h-6 w-6 fill-current" /> JOGAR
        </ArcadeButton>
        <div className="grid grid-cols-2 gap-2.5">
          <ArcadeButton onClick={() => setScreen("characters")}>
            <Shirt className="h-4 w-4" /> Personagens
          </ArcadeButton>
          <ArcadeButton onClick={() => setScreen("maps")}>
            <Map className="h-4 w-4" /> Mapas
          </ArcadeButton>
          <ArcadeButton onClick={() => setScreen("records")}>
            <BarChart3 className="h-4 w-4" /> Recordes
          </ArcadeButton>
          <ArcadeButton variant="primary" onClick={() => startRun("race")}>
            <Flag className="h-4 w-4" /> Corrida contra bots
          </ArcadeButton>
          <ArcadeButton onClick={() => setScreen("training")}>
            <Target className="h-4 w-4" /> Treino 3 fileiras
          </ArcadeButton>
          <ArcadeButton onClick={() => setScreen("effects")}>
            <Sparkles className="h-4 w-4" /> Loja de efeitos
          </ArcadeButton>
          <ArcadeButton onClick={() => setScreen("accessories")}>
            <Gem className="h-4 w-4" /> Loja de acessórios
          </ArcadeButton>
          <ArcadeButton onClick={() => setScreen("settings")}>
            <Settings className="h-4 w-4" /> Ajustes
          </ArcadeButton>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Corra sem pegar <span className="font-semibold text-coin">nenhuma moeda</span>. W pula · A/D troca de faixa · S desliza
        </p>
        <p className="text-center text-[11px] text-muted-foreground">Na Corrida contra bots, cada rival pega sua moeda entre 30 segundos e 7 minutos. Sobreviva até todos terminarem!</p>
      </div>
    </div>
  );
}
