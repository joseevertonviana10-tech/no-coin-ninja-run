import { ArrowLeft, Play, Target } from "lucide-react";
import { useSettings, useUI } from "../store";
import { startRun } from "../runtime";
import { ArcadeButton, ScreenHeader, Segmented } from "./kit";

export function TrainingScreen() {
  const setScreen = useUI((s) => s.setScreen);
  const speed = useSettings((s) => s.trainingTimescale);
  const set = useSettings((s) => s.set);
  return (
    <div className="absolute inset-0 flex flex-col gap-4 bg-ink/50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-xl">
        <ScreenHeader title="Treino das três fileiras" onBack={() => setScreen("menu")} />
      </div>
      <div className="glass mx-auto my-auto w-full max-w-xl space-y-5 p-5 animate-pop-in">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/15 p-3 text-primary"><Target className="h-7 w-7" /></div>
          <div>
            <h2 className="font-display text-xl">Domine o salto único</h2>
            <p className="text-sm text-muted-foreground">Cinco barreiras seguidas. Três pistas cobertas por moedas. Um salto para atravessar tudo.</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">Velocidade do treino</div>
          <Segmented
            value={String(speed)}
            onChange={(v) => set({ trainingTimescale: Number(v) as 0.75 | 0.5 | 0.25 })}
            options={[
              { value: "0.75", label: "0,75×" },
              { value: "0.5", label: "0,50×" },
              { value: "0.25", label: "0,25×" },
            ]}
          />
          <p className="text-xs text-muted-foreground">A velocidade reduz o tempo e a corrida, mantendo a física do salto consistente.</p>
        </div>
        <ArcadeButton variant="primary" className="w-full py-4 text-lg" onClick={() => startRun(true)}>
          <Play className="h-5 w-5 fill-current" /> COMEÇAR TREINO
        </ArcadeButton>
        <ArcadeButton className="w-full" onClick={() => setScreen("menu")}><ArrowLeft className="h-4 w-4" /> VOLTAR</ArcadeButton>
      </div>
    </div>
  );
}
