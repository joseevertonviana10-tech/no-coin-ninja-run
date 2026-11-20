import { Check, Lock, UserRound } from "lucide-react";
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
  const [codeOpen, setCodeOpen] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [unlockMessage, setUnlockMessage] = useState("");
  const normalizeUnlockCode = (value: string) => value.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
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
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
          <button type="button" onClick={() => { setCreatorOpen(false); setCodeOpen(false); }} className={cn("rounded-lg px-2 py-2 text-xs font-bold", !creatorOpen && !codeOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Personagens</button>
          <button type="button" onClick={() => { setCreatorOpen(false); setCodeOpen(true); }} className={cn("rounded-lg px-2 py-2 text-xs font-bold", codeOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>PERSONAGENS DE CÓDIGO</button>
          <button type="button" onClick={() => { setCreatorOpen(true); setCodeOpen(false); }} className={cn("rounded-lg px-2 py-2 text-xs font-bold", creatorOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Crie seu personagem</button>
        </div>
        {!creatorOpen && !codeOpen && (
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
            {CHARACTERS.filter((c) => c.category === cat && !c.code).map((c) => (
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
                  c.id === selected ? "border-accent bg-secondary" : "border-white/10 bg-white/5 hover:bg-secondary",
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
        )}
        {codeOpen && (
          <section className="glass glass-soft space-y-3 p-3">
            <div>
              <div className="font-display text-lg text-accent">PERSONAGENS DE CÓDIGO</div>
              <p className="text-xs text-muted-foreground">As silhuetas escondem personagens secretos. Digite o código correspondente para revelar e desbloquear cada um.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CHARACTERS.filter((character) => !!character.code).map((character) => {
                const unlocked = character.id === "hacker-code" ? hackerSkinUnlocked : (settings.unlockedCodeCharacters ?? []).includes(character.id);
                return (
                  <button key={character.id} type="button" disabled={!unlocked} onClick={() => { set({ character: character.id }); runtime.celebrateT = 0; }} className={cn("relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center", selected === character.id ? "border-accent bg-secondary" : "border-border bg-muted/60", !unlocked && "cursor-not-allowed")}>
                    {unlocked ? <span className="h-12 w-12 rounded-full border-2 border-white/30 shadow-lg" style={{ background: "linear-gradient(135deg, " + character.main + ", " + character.accent + ")" }} /> : <UserRound className="h-12 w-12 fill-current text-black drop-shadow-[0_2px_2px_rgba(255,255,255,0.25)]" />}
                    <span className="text-xs font-bold">{unlocked ? character.name : "??????"}</span>
                    {!unlocked && <Lock className="absolute right-2 top-2 h-3.5 w-3.5 text-muted-foreground" />}
                    {unlocked && <span className="text-[10px] text-emerald-400">Desbloqueado</span>}
                  </button>
                );
              })}
            </div>
            <form className="flex flex-wrap gap-2" onSubmit={(e) => {
              e.preventDefault();
              const normalized = normalizeUnlockCode(unlockCode);
              const found = normalized ? CHARACTERS.find((character) => character.code && normalizeUnlockCode(character.code) === normalized) : undefined;
              if (!found) { setUnlockMessage("Código incorreto. Confira e tente novamente."); return; }
              if (found.id === "hacker-code") set({ hackerSkinUnlocked: true });
              else set({ unlockedCodeCharacters: Array.from(new Set([...(settings.unlockedCodeCharacters ?? []), found.id])) });
              setUnlockMessage(found.name + " desbloqueado! ✨");
              setUnlockCode("");
            }}>
              <input aria-label="Código do personagem" value={unlockCode} onChange={(e) => setUnlockCode(e.target.value)} placeholder="Digite o código do personagem" autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Desbloquear</button>
              {unlockMessage && <p role="status" className="w-full text-xs text-muted-foreground">{unlockMessage}</p>}
            </form>
          </section>
        )}
        {creatorOpen && (
        <section className="glass space-y-3 p-3">
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm font-semibold"><span>Ativar meu visual personalizado</span><input type="checkbox" checked={settings.customCharacterEnabled} onChange={(e) => settings.set({ customCharacterEnabled: e.target.checked })} className="h-5 w-5 accent-primary" /></label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {([{ key: "customMain", label: "Cor principal", value: settings.customMain }, { key: "customSecond", label: "Cor secundária", value: settings.customSecond }, { key: "customAccent", label: "Detalhes", value: settings.customAccent }, { key: "customSkin", label: "Pele", value: settings.customSkin }, { key: "customGlow", label: "Brilho / energia", value: settings.customGlow }] as const).map((item) => (
                  <label key={item.key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs font-semibold">
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
        </section>
        )}
        <ArcadeButton variant="primary" className="w-full py-3 text-lg" onClick={() => setScreen("menu")}>
          SELECIONAR
        </ArcadeButton>
      </div>
    </div>
  );
}
