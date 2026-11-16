import { Home, Play, RotateCcw, Settings, Trophy } from "lucide-react";
import { useState } from "react";
import { CHARACTER_BY_ID } from "../data/characters";
import { MAP_BY_ID } from "../data/maps";
import { resumeRun, reviveRun, runtime, startRun, toMenu } from "../runtime";
import { formatTime, useStats, useUI } from "../store";
import { ArcadeButton } from "./kit";
import { SettingsScreen } from "./SettingsScreen";

const REASON: Record<string, { title: string; text: string }> = {
  coin: { title: "Você pegou uma moeda!", text: "No NO COIN CHALLENGE qualquer moeda encerra o desafio." },
  collision: { title: "Colisão!", text: "Você bateu em um obstáculo." },
  fall: { title: "Caiu da pista!", text: "Você caiu em um buraco fora da pista." },
};

export function GameOver() {
  const run = useUI((s) => s.lastRun);
  const best = useStats((s) => s.bestTime);
  const keys = useStats((s) => s.keys);
  if (!run) return null;
  const r = REASON[run.reason] ?? REASON['collision']!;
  return (
    <div className="absolute inset-0 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="glass w-full max-w-sm animate-pop-in space-y-3 p-5 text-center">
        {run.newRecord ? (
          <div className="no-coin-badge mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1 font-display text-sm">
            <Trophy className="h-4 w-4" /> NOVO RECORDE!
          </div>
        ) : (
          <div className="font-display text-sm tracking-widest text-primary">DESAFIO ENCERRADO</div>
        )}
        <div>
          <div className="text-xs text-muted-foreground">Tempo sem moedas</div>
          <div className="timer-text text-5xl text-foreground">{formatTime(run.time)}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left text-sm">
          <div className="rounded-xl bg-muted/70 p-2.5">
            <div className="text-xs text-muted-foreground">Recorde pessoal</div>
            <div className="timer-text text-coin">{formatTime(best)}</div>
          </div>
          <div className="rounded-xl bg-muted/70 p-2.5">
            <div className="text-xs text-muted-foreground">Distância</div>
            <div className="timer-text">{Math.round(run.distance)} m</div>
          </div>
        </div>
        <div className="rounded-xl border border-primary/50 bg-primary/15 p-3 text-left">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Motivo da derrota</div>
          <div className="font-semibold">{r.title}</div>
          <div className="text-xs text-muted-foreground">
            {r.text} · {MAP_BY_ID[run.map]?.name} · {CHARACTER_BY_ID[run.character]?.name}
          </div>
        </div>
        {keys > 0 && (
          <ArcadeButton variant="primary" className="w-full py-3.5 text-lg" onClick={reviveRun}>
            <span className="text-sky-300">✦</span> REVIVER · 1 CHAVE ({keys} DISPONÍVEIS)
          </ArcadeButton>
        )}
        <ArcadeButton variant="primary" className="w-full py-3.5 text-lg" onClick={() => startRun(runtime.training)}>
          <RotateCcw className="h-5 w-5" /> TENTAR NOVAMENTE
        </ArcadeButton>
        <ArcadeButton className="w-full" onClick={toMenu}>
          <Home className="h-4 w-4" /> VOLTAR AO MENU
        </ArcadeButton>
      </div>
    </div>
  );
}

export function PauseMenu() {
  const [settings, setSettings] = useState(false);
  if (settings) return <SettingsScreen onBack={() => setSettings(false)} />;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink/60 p-4">
      <div className="glass w-full max-w-xs animate-pop-in space-y-3 p-5 text-center">
        <div className="font-display text-2xl">PAUSADO</div>
        <p className="text-xs text-muted-foreground">O cronômetro está parado.</p>
        <ArcadeButton variant="primary" className="w-full py-3 text-lg" onClick={resumeRun}>
          <Play className="h-5 w-5 fill-current" /> CONTINUAR
        </ArcadeButton>
        <ArcadeButton className="w-full" onClick={startRun}>
          <RotateCcw className="h-4 w-4" /> Reiniciar
        </ArcadeButton>
        <ArcadeButton className="w-full" onClick={() => setSettings(true)}>
          <Settings className="h-4 w-4" /> Configurações
        </ArcadeButton>
        <ArcadeButton className="w-full" onClick={toMenu}>
          <Home className="h-4 w-4" /> Voltar ao menu
        </ArcadeButton>
      </div>
    </div>
  );
}
