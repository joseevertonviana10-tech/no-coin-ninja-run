import { ArrowLeft, Flame, Gem, Leaf, Moon, Snowflake, Sparkles, Star, Waves } from "lucide-react";
import { useState } from "react";
import { CHARACTERS } from "../data/characters";
import { useSettings, useStats, useUI } from "../store";
import { ArcadeButton, ScreenHeader } from "./kit";

const EFFECTS = [
  { id: "fire", name: "Chamas", detail: "Rastro de fogo laranja e vermelho", cost: 2, icon: Flame, color: "#ff6a22" },
  { id: "blue-smoke", name: "Fumaça azul", detail: "Nuvem azul que acompanha a corrida", cost: 2, icon: Waves, color: "#269cff" },
  { id: "gold-stars", name: "Estrelas douradas", detail: "Partículas douradas cintilantes", cost: 3, icon: Star, color: "#ffd34e" },
  { id: "shadow", name: "Aura sombria", detail: "Rastro violeta escuro", cost: 3, icon: Moon, color: "#7860a8" },
  { id: "rainbow", name: "Arco-íris", detail: "Partículas que mudam de cor", cost: 4, icon: Sparkles, color: "#e45cff" },
  { id: "emerald", name: "Energia esmeralda", detail: "Brilho verde intenso", cost: 2, icon: Leaf, color: "#39e879" },
  { id: "ice", name: "Geada azul", detail: "Rastro gelado azul-claro", cost: 2, icon: Snowflake, color: "#7cecff" },
  { id: "starlight", name: "Brilho celestial", detail: "Partículas brancas luminosas", cost: 3, icon: Gem, color: "#f4f5ff" },
] as const;

export function EffectsShop() {
  const setScreen = useUI((s) => s.setScreen);
  const settings = useSettings();
  const keys = useStats((s) => s.keys);
  const spendKey = useStats((s) => s.spendKey);
  const addKeys = useStats((s) => s.addKeys);
  const [character, setCharacter] = useState(settings.character);
  const unlocked = settings.unlockedEffects;
  const current = settings.equippedEffects[character];
  const selected = CHARACTERS.find((c) => c.id === character) ?? CHARACTERS[0]!;
  const buy = (effectId: string, cost: number) => {
    if (unlocked.includes(character + ":" + effectId) || keys < cost) return;
    let spent = 0;
    while (spent < cost && spendKey()) spent++;
    if (spent !== cost) { if (spent) addKeys(spent); return; }
    settings.set({ unlockedEffects: [...unlocked, character + ":" + effectId], equippedEffects: { ...settings.equippedEffects, [character]: effectId } });
  };
  const equip = (effectId: string) => settings.set({ equippedEffects: { ...settings.equippedEffects, [character]: effectId } });
  return (
    <div className="absolute inset-0 flex flex-col gap-3 bg-ink/50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl">
        <ScreenHeader title="Loja de efeitos especiais" onBack={() => setScreen("menu")} />
      </div>
      <div className="glass mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-hidden p-4 animate-pop-in">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0"><div className="font-display text-lg">{selected.name}</div><p className="text-xs text-muted-foreground">Cada personagem tem sua própria coleção de efeitos.</p></div>
          <div className="shrink-0 rounded-lg bg-coin/15 px-3 py-2 text-sm font-bold text-coin">🔑 {keys} chaves</div>
        </div>
        <label className="text-xs font-semibold text-muted-foreground">PERSONAGEM</label>
        <select className="w-full rounded-lg border border-border bg-background p-2 text-sm" value={character} onChange={(e) => setCharacter(e.target.value)}>
          {CHARACTERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {EFFECTS.map((effect) => {
            const owned = unlocked.includes(character + ":" + effect.id);
            const equipped = current === effect.id;
            const Icon = effect.icon;
            return (
              <div key={effect.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <div className="rounded-xl p-2" style={{ color: effect.color, background: effect.color + "20" }}><Icon className="h-6 w-6" /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold">{effect.name}</div><div className="text-xs text-muted-foreground">{effect.detail}</div><div className="mt-1 text-xs text-coin">{owned ? "Desbloqueado" : effect.cost + " chaves"}</div></div>
                <button type="button" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50" disabled={equipped || (!owned && keys < effect.cost)} onClick={() => owned ? equip(effect.id) : buy(effect.id, effect.cost)}>{equipped ? "Equipado" : owned ? "Equipar" : "Comprar"}</button>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground">Os efeitos são salvos separadamente para cada personagem. Ganhe chaves sobrevivendo 10 segundos sem moedas.</p>
        <ArcadeButton className="w-full" onClick={() => setScreen("menu")}><ArrowLeft className="h-4 w-4" /> VOLTAR</ArcadeButton>
      </div>
    </div>
  );
}
