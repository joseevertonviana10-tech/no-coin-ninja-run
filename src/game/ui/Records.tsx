import { Trash2 } from "lucide-react";
import { useState } from "react";
import { CHARACTERS } from "../data/characters";
import { MAPS } from "../data/maps";
import { formatTime, useStats, useUI } from "../store";
import { ArcadeButton, ScreenHeader, Segmented } from "./kit";

export function Records() {
  const setScreen = useUI((s) => s.setScreen);
  const st = useStats();
  const [tab, setTab] = useState<"rec" | "stats">("rec");
  const [confirm, setConfirm] = useState(false);
  const chars = CHARACTERS.filter((c) => (st.bestByCharacter[c.id] ?? 0) > 0).sort(
    (a, b) => (st.bestByCharacter[b.id] ?? 0) - (st.bestByCharacter[a.id] ?? 0),
  );
  const stat = (label: string, value: string) => (
    <div className="rounded-xl bg-muted/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="timer-text text-lg text-foreground">{value}</div>
    </div>
  );
  return (
    <div className="absolute inset-0 flex flex-col gap-3 bg-ink/40 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-xl">
        <ScreenHeader title="Recordes" onBack={() => setScreen("menu")} />
      </div>
      <div className="glass mx-auto flex min-h-0 w-full max-w-xl flex-1 animate-pop-in flex-col gap-3 p-4">
        <div className="no-coin-badge rounded-2xl p-4 text-center">
          <div className="font-display text-xs tracking-widest">MAIOR TEMPO SEM MOEDAS</div>
          <div className="timer-text text-4xl">{formatTime(st.bestTime)}</div>
        </div>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "rec", label: "Recordes" },
            { value: "stats", label: "Estatísticas" },
          ]}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "rec" ? (
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Melhor por mapa</div>
                <div className="space-y-1.5">
                  {MAPS.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: m.swatch[0] }} />
                        {m.name}
                      </span>
                      <span className="timer-text text-coin">{formatTime(st.bestByMap[m.id] ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Melhor por personagem</div>
                {chars.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Jogue uma partida para registrar tempos por personagem.</p>
                ) : (
                  <div className="space-y-1.5">
                    {chars.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                        <span>{c.name}</span>
                        <span className="timer-text text-coin">{formatTime(st.bestByCharacter[c.id] ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {stat("Partidas", String(st.runs))}
              {stat("Moedas coletadas", String(st.coinsCollected))}
              {stat("Colisões", String(st.collisions))}
              {stat("Quedas", String(st.falls))}
              {stat("Tempo total", formatTime(st.totalTime))}
              {stat("Distância total", `${Math.round(st.totalDistance)} m`)}
              {stat("Média por partida", formatTime(st.runs ? st.totalTime / st.runs : 0))}
              {stat("Recorde", formatTime(st.bestTime))}
            </div>
          )}
        </div>
        <ArcadeButton
          className="py-2 text-xs"
          onClick={() => {
            if (confirm) {
              st.resetStats();
              setConfirm(false);
            } else setConfirm(true);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> {confirm ? "Toque de novo para apagar tudo" : "Apagar recordes"}
        </ArcadeButton>
      </div>
    </div>
  );
}
