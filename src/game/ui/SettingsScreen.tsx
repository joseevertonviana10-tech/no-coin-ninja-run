import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { COIN_COLORS } from "../data/coins";
import { DIFFICULTIES, type DifficultyId } from "../sim/constants";
import { useSettings, useUI, type CameraMode, type ControlsPos, type Quality } from "../store";
import { ArcadeButton, clickSfx, pct, Row, ScreenHeader, Segmented, SliderRow, SwitchRow } from "./kit";

const TABS = ["Gráficos", "Áudio", "Controles", "Jogo", "Moedas"] as const;
type Tab = (typeof TABS)[number];

export function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const setScreen = useUI((s) => s.setScreen);
  const s = useSettings();
  const [tab, setTab] = useState<Tab>("Gráficos");
  const back = onBack ?? (() => setScreen("menu"));
  return (
    <div className="absolute inset-0 flex flex-col gap-3 bg-ink/40 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-xl">
        <ScreenHeader
          title="Configurações"
          onBack={back}
          right={
            <ArcadeButton className="px-3 py-2 text-xs" onClick={() => s.reset()}>
              <RotateCcw className="h-3.5 w-3.5" /> Padrão
            </ArcadeButton>
          }
        />
      </div>
      <div className="glass mx-auto flex min-h-0 w-full max-w-xl flex-1 animate-pop-in flex-col">
        <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                clickSfx();
                setTab(t);
              }}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold",
                t === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto px-4 pb-4">
          {tab === "Gráficos" && (
            <>
              <Row label="Qualidade gráfica">
                <Segmented<Quality>
                  value={s.quality}
                  onChange={(v) => s.set({ quality: v })}
                  options={[
                    { value: "low", label: "Baixo" },
                    { value: "medium", label: "Médio" },
                    { value: "high", label: "Alto" },
                    { value: "ultra", label: "Ultra" },
                  ]}
                />
              </Row>
              <p className="py-3 text-xs text-muted-foreground">
                Baixo desliga sombras e reduz cenário e partículas — ideal para celulares Android mais simples. Alto e Ultra
                adicionam reflexos de ambiente e sombras nítidas.
              </p>
              <SwitchRow label="Efeitos visuais (poeira, faíscas)" checked={s.visualEffects} onChange={(v) => s.set({ visualEffects: v })} />
            </>
          )}
          {tab === "Áudio" && (
            <>
              <SwitchRow label="Sons ativados" checked={s.soundOn} onChange={(v) => s.set({ soundOn: v })} />
              <SliderRow label="Volume geral" value={s.masterVolume} min={0} max={1} step={0.05} format={pct} onChange={(v) => s.set({ masterVolume: v })} />
              <SliderRow label="Efeitos sonoros" value={s.sfxVolume} min={0} max={1} step={0.05} format={pct} onChange={(v) => s.set({ sfxVolume: v })} />
              <SliderRow label="Música" value={s.musicVolume} min={0} max={1} step={0.05} format={pct} onChange={(v) => s.set({ musicVolume: v })} />
            </>
          )}
          {tab === "Controles" && (
            <>
              <SwitchRow label="Controles virtuais na tela" checked={s.controlsVisible} onChange={(v) => s.set({ controlsVisible: v })} />
              <SliderRow label="Tamanho dos botões (até 230%)" value={s.controlsSize} min={0.6} max={2.3} step={0.05} format={pct} onChange={(v) => s.set({ controlsSize: v })} />
              <div className="flex gap-2 pb-2">
                <ArcadeButton className="flex-1 py-2 text-sm" onClick={() => s.set({ controlsSize: Math.max(0.6, +(s.controlsSize - 0.1).toFixed(2)) })}>
                  − Diminuir
                </ArcadeButton>
                <ArcadeButton className="flex-1 py-2 text-sm" onClick={() => s.set({ controlsSize: Math.min(2.3, +(s.controlsSize + 0.1).toFixed(2)) })}>
                  + Aumentar
                </ArcadeButton>
              </div>
              <Row label="Posição dos controles">
                <Segmented<ControlsPos>
                  value={s.controlsPosition}
                  onChange={(v) => s.set({ controlsPosition: v })}
                  options={[
                    { value: "left", label: "Esquerda" },
                    { value: "center", label: "Centro" },
                    { value: "right", label: "Direita" },
                  ]}
                />
              </Row>
              <SliderRow label="Transparência dos botões" value={s.controlsOpacity} min={0.15} max={1} step={0.05} format={pct} onChange={(v) => s.set({ controlsOpacity: v })} />
              <SliderRow label="Sensibilidade (deslizar e segurar)" value={s.sensitivity} min={0.5} max={2} step={0.1} format={(v) => `${v.toFixed(1)}x`} onChange={(v) => s.set({ sensitivity: v })} />
            </>
          )}
          {tab === "Jogo" && (
            <>
              <Row label="Dificuldade">
                <Segmented<DifficultyId>
                  value={s.difficulty}
                  onChange={(v) => s.set({ difficulty: v })}
                  options={Object.values(DIFFICULTIES).map((d) => ({ value: d.id, label: d.label }))}
                />
              </Row>
              <SliderRow label="Velocidade da corrida" value={s.speedMult} min={0.6} max={1.6} step={0.05} format={pct} onChange={(v) => s.set({ speedMult: v })} />
              <Row label="Câmera">
                <Segmented<CameraMode>
                  value={s.camera}
                  onChange={(v) => s.set({ camera: v })}
                  options={[
                    { value: "near", label: "Perto" },
                    { value: "normal", label: "Normal" },
                    { value: "far", label: "Longe" },
                  ]}
                />
              </Row>
              <SwitchRow label="Tremor de câmera" checked={s.cameraShake} onChange={(v) => s.set({ cameraShake: v })} />
              <SwitchRow label="Vibração (celular)" checked={s.vibration} onChange={(v) => s.set({ vibration: v })} />
              <SwitchRow label="Efeitos visuais" checked={s.visualEffects} onChange={(v) => s.set({ visualEffects: v })} />
            </>
          )}
          {tab === "Moedas" && (
            <>
              <Row label="Cor das moedas">
                <div className="grid grid-cols-4 gap-2">
                  {COIN_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        clickSfx();
                        s.set({ coinColor: c.id });
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-2 text-xs font-semibold",
                        s.coinColor === c.id ? "border-accent bg-secondary" : "border-border bg-muted/60",
                      )}
                    >
                      <span
                        className="h-8 w-8 rounded-full border-2 border-border"
                        style={{
                          background:
                            c.id === "rainbow"
                              ? "conic-gradient(#ff3b3b, #ffc82e, #3ee06a, #3fa0ff, #b45cff, #ff3b3b)"
                              : `radial-gradient(circle at 35% 30%, ${c.color}, ${c.emissive})`,
                        }}
                      />
                      {c.label}
                    </button>
                  ))}
                </div>
              </Row>
              <SliderRow label="Tamanho das moedas (afeta a colisão)" value={s.coinSize} min={0.6} max={1.6} step={0.05} format={pct} onChange={(v) => s.set({ coinSize: v })} />
              <SliderRow label="Brilho das moedas" value={s.coinGlow} min={0} max={3} step={0.1} format={pct} onChange={(v) => s.set({ coinGlow: v })} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
