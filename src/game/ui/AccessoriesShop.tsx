import { ArrowLeft, Hand, HatGlasses, Shirt, Waves } from "lucide-react";
import { useState } from "react";
import { CHARACTERS } from "../data/characters";
import { useSettings, useStats, useUI } from "../store";
import { ArcadeButton, ScreenHeader } from "./kit";

const ITEMS = [
  { id: "straw-neck", name: "Chapéu de palha no pescoço", detail: "Amarrado por uma tira, balança enquanto você corre.", cost: 4, icon: HatGlasses },
  { id: "gloves", name: "Luvas de corrida", detail: "Luvas reforçadas nas duas mãos.", cost: 3, icon: Hand },
  { id: "scarf", name: "Cachecol esvoaçante", detail: "Um cachecol que dança com o vento.", cost: 3, icon: Waves },
  { id: "wristbands", name: "Munhequeiras", detail: "Detalhes esportivos nos pulsos.", cost: 2, icon: Shirt },
] as const;

export function AccessoriesShop() {
  const setScreen = useUI((s) => s.setScreen);
  const settings = useSettings();
  const keys = useStats((s) => s.keys);
  const spendKey = useStats((s) => s.spendKey);
  const addKeys = useStats((s) => s.addKeys);
  const [character, setCharacter] = useState(settings.character);
  const unlocked = settings.unlockedAccessories;
  const equipped = settings.equippedAccessories[character];
  const selected = CHARACTERS.find((c) => c.id === character) ?? CHARACTERS[0]!;
  const buy = (id: string, cost: number) => {
    if (unlocked.includes(id) || keys < cost) return;
    let spent = 0;
    while (spent < cost && spendKey()) spent++;
    if (spent !== cost) { if (spent) addKeys(spent); return; }
    settings.set({ unlockedAccessories: [...unlocked, id], equippedAccessories: { ...settings.equippedAccessories, [character]: id } });
  };
  const equip = (id: string) => settings.set({ equippedAccessories: { ...settings.equippedAccessories, [character]: id } });
  const remove = () => {
    const next = { ...settings.equippedAccessories };
    delete next[character];
    settings.set({ equippedAccessories: next });
  };
  return (
    <div className="absolute inset-0 flex flex-col gap-3 bg-ink/50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl"><ScreenHeader title="Loja de acessórios" onBack={() => setScreen("menu")} /></div>
      <div className="glass mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-hidden p-4 animate-pop-in">
        <div className="flex items-center justify-between gap-2">
          <div><div className="font-display text-lg">{selected.name}</div><p className="text-xs text-muted-foreground">Acessórios cosméticos, salvos por personagem.</p></div>
          <div className="shrink-0 rounded-lg bg-coin/15 px-3 py-2 text-sm font-bold text-coin">🔑 {keys} chaves</div>
        </div>
        <label className="text-xs font-semibold text-muted-foreground">PERSONAGEM</label>
        <select className="w-full rounded-lg border border-border bg-background p-2 text-sm" value={character} onChange={(e) => setCharacter(e.target.value)}>
          {CHARACTERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {ITEMS.map((item) => {
            const owned = unlocked.includes(item.id);
            const active = equipped === item.id;
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <div className="rounded-xl bg-primary/15 p-2 text-primary"><Icon className="h-6 w-6" /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold">{item.name}</div><div className="text-xs text-muted-foreground">{item.detail}</div><div className="mt-1 text-xs text-coin">{owned ? "Desbloqueado" : item.cost + " chaves"}</div></div>
                <button type="button" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50" disabled={active || (!owned && keys < item.cost)} onClick={() => owned ? equip(item.id) : buy(item.id, item.cost)}>{active ? "Equipado" : owned ? "Equipar" : "Comprar"}</button>
              </div>
            );
          })}
        </div>
        {equipped && <ArcadeButton className="w-full" onClick={remove}>REMOVER ACESSÓRIO</ArcadeButton>}
        <p className="text-center text-xs text-muted-foreground">Ganhe chaves sobrevivendo sem pegar moedas. O chapéu de palha fica preso ao pescoço e balança com o movimento.</p>
        <ArcadeButton className="w-full" onClick={() => setScreen("menu")}><ArrowLeft className="h-4 w-4" /> VOLTAR</ArcadeButton>
      </div>
    </div>
  );
}
