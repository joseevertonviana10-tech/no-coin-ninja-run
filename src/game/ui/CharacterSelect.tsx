import { Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES, CHARACTERS, CHARACTER_BY_ID, type Category } from "../data/characters";
import { runtime } from "../runtime";
import { formatTime, useSettings, useStats, useUI, type Settings } from "../store";
import { ArcadeButton, clickSfx, ScreenHeader } from "./kit";

export function CharacterSelect() {
  const setScreen = useUI((s) => s.setScreen);
  const selected = useSettings((s) => s.character);
  const set = useSettings((s) => s.set);
  const bestBy = useStats((s) => s.bestByCharacter);
  const hackerSkinUnlocked = useSettings((s) => s.hackerSkinUnlocked);
  const settings = useSettings();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [cat, setCat] = useState<Category>(CHARACTER_BY_ID[selected]?.category ?? "Ninjas");
  const cur = CHARACTER_BY_ID[selected];
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl">
        <ScreenHeader title="Personagens" onBack={() => setScreen("menu")} />
      </div>
      <div className="mx-auto max-h-[calc(100dvh-110px)] w-full max-w-2xl animate-pop-in space-y-3 overflow-y-auto pb-2">
        <div className="glass px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-accent">{cur?.category}</div>
              <div className="font-display text-xl">{cur?.name}</div>
              <div className="text-sm text-muted-foreground">{cur?.desc}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-muted-foreground">Melhor tempo</div>
              <div className="timer-text text-coin">{formatTime(bestBy[selected] ?? 0)}</div>
            </div>
          </div>
        </div>
        <div className="glass p-3">
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  clickSfx();
                  setCat(c);
                }}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold",
                  c === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid max-h-[30vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
            {CHARACTERS.filter((c) => c.category === cat && (c.id !== "hacker-code" || hackerSkinUnlocked)).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  clickSfx();
                  set({ character: c.id });
                  runtime.celebrateT = 0;
                }}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl border p-2 text-left transition-colors",
                  c.id === selected ? "border-accent bg-secondary" : "border-border bg-muted/60 hover:bg-secondary",
                )}
              >
                <span
                  className="h-9 w-9 shrink-0 rounded-lg border border-border"
                  style={{ background: `linear-gradient(135deg, ${c.main} 0 55%, ${c.cape ?? c.accent} 55% 100%)` }}
                />
                <span className="min-w-0 text-xs font-semibold leading-tight">{c.name}</span>
                {c.id === selected && <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-accent" />}
              </button>
            ))}
          </div>
        </div>
        <section className="glass space-y-3 p-3">
          <button type="button" onClick={() => setCreatorOpen((v) => !v)} className="flex w-full items-center justify-between rounded-lg bg-secondary px-3 py-2 text-left font-display text-base">
            <span>🎨 Crie seu personagem</span><span>{creatorOpen ? "−" : "+"}</span>
          </button>
          {creatorOpen && (
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm font-semibold"><span>Ativar meu visual personalizado</span><input type="checkbox" checked={settings.customCharacterEnabled} onChange={(e) => settings.set({ customCharacterEnabled: e.target.checked })} className="h-5 w-5 accent-primary" /></label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {([{ key: "customMain", label: "Cor principal", value: settings.customMain }, { key: "customSecond", label: "Cor secundária", value: settings.customSecond }, { key: "customAccent", label: "Detalhes", value: settings.customAccent }, { key: "customSkin", label: "Pele", value: settings.customSkin }, { key: "customGlow", label: "Brilho / energia", value: settings.customGlow }] as const).map((item) => (
                  <label key={item.key} className="flex items-center gap-2 rounded-lg bg-muted/60 p-2 text-xs font-semibold">
                    <input type="color" value={item.value} onChange={(e) => settings.set({ [item.key]: e.target.value } as Partial<Settings>)} className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent" />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              <label className="block space-y-1 text-xs font-semibold">Tamanho do corpo: {Math.round(settings.customBodyScale * 100)}%
                <input type="range" min="0.8" max="1.25" step="0.01" value={settings.customBodyScale} onChange={(e) => settings.set({ customBodyScale: Number(e.target.value) })} className="w-full accent-primary" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <ArcadeButton className="py-2 text-xs" onClick={() => setScreen("accessories")}>Acessórios</ArcadeButton>
                <ArcadeButton className="py-2 text-xs" onClick={() => setScreen("effects")}>Efeitos especiais</ArcadeButton>
              </div>
              <p className="text-[11px] text-muted-foreground">As cores e proporções ficam salvas neste aparelho. Os acessórios e efeitos usam os itens disponíveis nas respectivas lojas.</p>
            </div>
          )}
        </section>
        <ArcadeButton variant="primary" className="w-full py-3 text-lg" onClick={() => setScreen("menu")}>
          SELECIONAR
        </ArcadeButton>
      </div>
    </div>
  );
}
