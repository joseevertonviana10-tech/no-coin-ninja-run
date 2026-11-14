export type CharStyle =
  | "ninja"
  | "samurai"
  | "robot"
  | "zombie"
  | "scientist"
  | "skeleton"
  | "stick"
  | "knight"
  | "soldier"
  | "explorer"
  | "alien";
export type Pattern = "fabric" | "rust" | "camo" | "plates" | "circuit" | "stains" | "plain" | "scales" | "chain";
export type Category = "Ninjas" | "Samurais" | "Robôs" | "Zumbis" | "Outros";

export interface CharacterDef {
  id: string;
  name: string;
  category: Category;
  style: CharStyle;
  main: string;
  second: string;
  accent: string;
  skin: string;
  pattern: Pattern;
  metal?: number;
  glow?: string; // emissive accents (eyes, neon strips, radiation)
  cape?: string;
  armor?: "light" | "full";
  weapon?: "katana" | "sword" | "none" | "rifle";
  desc: string;
}

const NINJA_SKIN = "#e8b98f";

export const CHARACTERS: CharacterDef[] = [
  { id: "ninja-gold", name: "Ninja Dourado", category: "Ninjas", style: "ninja", main: "#d9a520", second: "#7a5600", accent: "#fff1a8", skin: NINJA_SKIN, pattern: "fabric", metal: 0.5, weapon: "katana", desc: "Seda dourada e lâmina reluzente." },
  { id: "ninja-black", name: "Ninja Preto", category: "Ninjas", style: "ninja", main: "#1d1d22", second: "#0c0c0f", accent: "#c8102e", skin: NINJA_SKIN, pattern: "fabric", weapon: "katana", desc: "Silencioso como a noite." },
  { id: "ninja-white", name: "Ninja Branco", category: "Ninjas", style: "ninja", main: "#eef1f5", second: "#b8c2cf", accent: "#3a7bd5", skin: NINJA_SKIN, pattern: "fabric", weapon: "katana", desc: "Mestre das montanhas nevadas." },
  { id: "ninja-blue", name: "Ninja Azul", category: "Ninjas", style: "ninja", main: "#1f5fbf", second: "#0d2f66", accent: "#9fe3ff", skin: NINJA_SKIN, pattern: "fabric", weapon: "katana", desc: "Rápido como a água." },
  { id: "ninja-red", name: "Ninja Vermelho", category: "Ninjas", style: "ninja", main: "#c41e2a", second: "#5c0a10", accent: "#ffd166", skin: NINJA_SKIN, pattern: "fabric", weapon: "katana", desc: "Fúria em cada passo." },
  { id: "ninja-cape-black", name: "Ninja Capa Negra", category: "Ninjas", style: "ninja", main: "#2a2a33", second: "#111116", accent: "#8a8aa0", skin: NINJA_SKIN, pattern: "fabric", cape: "#0d0d12", weapon: "katana", desc: "Capa com física dinâmica." },
  { id: "ninja-cape-red", name: "Ninja Capa Vermelha", category: "Ninjas", style: "ninja", main: "#26262c", second: "#121216", accent: "#e63946", skin: NINJA_SKIN, pattern: "fabric", cape: "#b5121b", weapon: "katana", desc: "A capa escarlate tremula ao vento." },

  { id: "samurai-trad", name: "Samurai Tradicional", category: "Samurais", style: "samurai", main: "#8c1c13", second: "#1f1a17", accent: "#d4af37", skin: "#e0b088", pattern: "plates", armor: "light", weapon: "katana", desc: "Armadura laqueada de honra." },
  { id: "samurai-gold", name: "Samurai Dourado", category: "Samurais", style: "samurai", main: "#d4a017", second: "#3b2a05", accent: "#fff3b0", skin: "#e0b088", pattern: "plates", metal: 0.7, armor: "light", weapon: "katana", desc: "Brilho do shogun." },
  { id: "samurai-dark", name: "Samurai Sombrio", category: "Samurais", style: "samurai", main: "#1a1a20", second: "#3a0d12", accent: "#ff2d3d", skin: "#9c8a80", pattern: "plates", glow: "#ff2d3d", armor: "light", weapon: "katana", desc: "Olhos que ardem na escuridão." },
  { id: "samurai-full", name: "Samurai Armadura Completa", category: "Samurais", style: "samurai", main: "#2f4a6b", second: "#1a1a1a", accent: "#c9a227", skin: "#e0b088", pattern: "plates", metal: 0.4, armor: "full", weapon: "katana", desc: "Placas da cabeça aos pés." },

  { id: "robot-future", name: "Robô Futurista", category: "Robôs", style: "robot", main: "#e8edf2", second: "#2a3240", accent: "#2bd9ff", skin: "#c9d2dc", pattern: "plain", metal: 0.6, glow: "#2bd9ff", desc: "Liga leve, visor de plasma." },
  { id: "robot-rust", name: "Robô Enferrujado", category: "Robôs", style: "robot", main: "#9a5a32", second: "#4a3020", accent: "#e0a040", skin: "#7a5a40", pattern: "rust", metal: 0.5, glow: "#ffb020", desc: "Range, mas não para." },
  { id: "robot-neon", name: "Robô Neon", category: "Robôs", style: "robot", main: "#1a1630", second: "#0c0a18", accent: "#ff3df2", skin: "#2a2448", pattern: "circuit", metal: 0.7, glow: "#ff3df2", desc: "Circuitos em néon pulsante." },
  { id: "robot-combat", name: "Robô de Combate", category: "Robôs", style: "robot", main: "#4a5a3a", second: "#22281a", accent: "#ff6a00", skin: "#3a4230", pattern: "plates", metal: 0.6, glow: "#ff3a00", armor: "full", desc: "Blindagem de guerra." },

  { id: "zombie-classic", name: "Zumbi Clássico", category: "Zumbis", style: "zombie", main: "#4a6fa5", second: "#5a4632", accent: "#9b2d2d", skin: "#8fae7a", pattern: "stains", desc: "Camisa rasgada, fome eterna." },
  { id: "zombie-military", name: "Zumbi Militar", category: "Zumbis", style: "zombie", main: "#5b6b3a", second: "#3a4226", accent: "#2a2a1a", skin: "#86a070", pattern: "camo", desc: "Ainda de farda." },
  { id: "zombie-rad", name: "Zumbi Radioativo", category: "Zumbis", style: "zombie", main: "#d8c020", second: "#3a3a10", accent: "#7dff3a", skin: "#9cff6a", pattern: "stains", glow: "#7dff3a", desc: "Brilha no escuro." },

  { id: "scientist", name: "Cientista", category: "Outros", style: "scientist", main: "#f4f6f8", second: "#3a4a6a", accent: "#2bb5ff", skin: "#f0c8a0", pattern: "fabric", desc: "Jaleco e óculos de proteção." },
  { id: "skeleton", name: "Esqueleto", category: "Outros", style: "skeleton", main: "#efe9d8", second: "#cfc6ae", accent: "#1a1a1a", skin: "#efe9d8", pattern: "plain", desc: "Só ossos, muita atitude." },
  { id: "stickman", name: "Stickman", category: "Outros", style: "stick", main: "#141414", second: "#141414", accent: "#ff3b3b", skin: "#141414", pattern: "plain", desc: "Minimalismo puro." },
  { id: "knight", name: "Cavaleiro Medieval", category: "Outros", style: "knight", main: "#b8c0c8", second: "#2a4a8a", accent: "#d4af37", skin: "#e0b088", pattern: "chain", metal: 0.85, armor: "full", weapon: "sword", desc: "Aço polido e brasão real." },
  { id: "soldier", name: "Soldado", category: "Outros", style: "soldier", main: "#5f6e45", second: "#3b4430", accent: "#1f1f1f", skin: "#c99a74", pattern: "camo", weapon: "rifle", desc: "Pronto para a missão." },
  { id: "explorer", name: "Explorador", category: "Outros", style: "explorer", main: "#c9a66b", second: "#6b4a2a", accent: "#2f6b5a", skin: "#e8b48a", pattern: "fabric", desc: "Chapéu e mochila de aventura." },
  { id: "alien", name: "Alienígena", category: "Outros", style: "alien", main: "#5a6b8a", second: "#2a3448", accent: "#c0ff3a", skin: "#7ee08a", pattern: "scales", glow: "#c0ff3a", desc: "Veio de muito longe." },
];

export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c])) as Record<string, CharacterDef>;
export const CATEGORIES: Category[] = ["Ninjas", "Samurais", "Robôs", "Zumbis", "Outros"];
