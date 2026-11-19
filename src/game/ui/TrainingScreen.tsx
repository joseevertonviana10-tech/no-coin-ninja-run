import { ArrowLeft, Brain, Play, Target, Footprints } from "lucide-react";
import { useSettings, useUI } from "../store";
import { useState } from "react";
import { startRun } from "../runtime";
import { ArcadeButton, ScreenHeader, Segmented } from "./kit";

type TrainingMode = "three-rows" | "nerdola" | "run-normal";

export function TrainingScreen() {
  const setScreen = useUI((s) => s.setScreen);
  const speed = useSettings((s) => s.trainingTimescale);
  const [mode, setMode] = useState<TrainingMode>("three-rows");
  const set = useSettings((s) => s.set);
  const normal = mode === "run-normal";
  return (
    <div className="absolute inset-0 flex flex-col gap-4 bg-ink/50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-xl"><ScreenHeader title="Centro de treinamento" onBack={() => setScreen("menu")} /></div>
      <div className="glass mx-auto my-auto w-full max-w-xl space-y-5 overflow-y-auto p-5 animate-pop-in">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => setMode("three-rows")} className={`rounded-xl border p-3 text-left transition ${mode === "three-rows" ? "border-primary bg-primary/15" : "border-border bg-muted/40"}`}>
            <Target className="mb-1 h-5 w-5 text-primary" /><div className="font-bold">Três fileiras</div><div className="text-xs text-muted-foreground">Salte sobre as 15 moedas.</div>
          </button>
          <button type="button" onClick={() => setMode("nerdola")} className={`rounded-xl border p-3 text-left transition ${mode === "nerdola" ? "border-primary bg-primary/15" : "border-border bg-muted/40"}`}>
            <Brain className="mb-1 h-5 w-5 text-primary" /><div className="font-bold">Treino Nerdola</div><div className="text-xs text-muted-foreground">Dois trens laterais e rota central.</div>
          </button>
          <button type="button" onClick={() => { setMode("run-normal"); if (speed === 1) set({ trainingTimescale: 0.75 }); }} className={`rounded-xl border p-3 text-left transition ${mode === "run-normal" ? "border-primary bg-primary/15" : "border-border bg-muted/40"}`}>
            <Footprints className="mb-1 h-5 w-5 text-primary" /><div className="font-bold">Treino Run normal</div><div className="text-xs text-muted-foreground">Uma corrida normal em câmera lenta.</div>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/15 p-3 text-primary">{normal ? <Footprints className="h-7 w-7" /> : mode === "nerdola" ? <Brain className="h-7 w-7" /> : <Target className="h-7 w-7" />}</div>
          <div>
            <h2 className="font-display text-xl">{normal ? "Treine a corrida completa" : mode === "nerdola" ? "Leia o padrão dos trens" : "Domine o salto único"}</h2>
            <p className="text-sm text-muted-foreground">{normal ? "Jogue no modo padrão, com obstáculos e moedas normais. A velocidade reduzida deixa mais tempo para reagir." : mode === "nerdola" ? "Desvie dos dois trens laterais e atravesse a linha central no momento certo." : "Cinco fileiras de moedas em três pistas. Um salto para atravessar tudo."}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">Velocidade do treino</div>
          <Segmented value={String(speed)} onChange={(v) => set({ trainingTimescale: Number(v) as 1 | 0.75 | 0.5 | 0.25 })} options={[
            ...(normal ? [] : [{ value: "1", label: "1×" }]),
            { value: "0.75", label: "0,75×" }, { value: "0.5", label: "0,50×" }, { value: "0.25", label: "0,25×" },
          ]} />
          <p className="text-xs text-muted-foreground">{normal ? "A corrida normal continua com todos os obstáculos. Só o ritmo do jogo fica mais lento." : "A velocidade reduz o tempo e a corrida, mantendo a física do salto consistente."}</p>
        </div>
        <ArcadeButton variant="primary" className="w-full py-4 text-lg" onClick={() => startRun(mode)}>
          <Play className="h-5 w-5 fill-current" /> {normal ? "COMEÇAR TREINO RUN NORMAL" : mode === "nerdola" ? "COMEÇAR TREINO NERDOLA" : "COMEÇAR TREINO 3 FILEIRAS"}
        </ArcadeButton>
        <ArcadeButton className="w-full" onClick={() => setScreen("menu")}><ArrowLeft className="h-4 w-4" /> VOLTAR</ArcadeButton>
      </div>
    </div>
  );
}
