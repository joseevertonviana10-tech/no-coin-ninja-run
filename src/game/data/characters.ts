export type CharStyle =
  | "ninja"
  | "monk"
  | "samurai"
  | "robot"
  | "zombie"
  | "scientist"
  | "skeleton"
  | "stick"
  | "knight"
  | "soldier"
  | "explorer"
  | "alien"
  | "monkey"
  | "coat"
  | "lizard"
  | "dinosaur";
export type Pattern = "fabric" | "rust" | "camo" | "plates" | "circuit" | "stains" | "plain" | "scales" | "chain";
export type Category = "Ninjas" | "Samurais" | "Robôs" | "Zumbis" | "Outros" | "Macacos";

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
  weapon?: "katana" | "sword" | "none" | "rifle" | "shotgun";
  desc: string;
  code?: string;
  scale?: number;
  speedBonus?: number;
  jumpBonus?: number;
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
  { id: "sniper-elite", name: "Atirador de Elite", category: "Ninjas", style: "ninja", main: "#43513b", second: "#20291e", accent: "#d2b879", skin: NINJA_SKIN, pattern: "camo", weapon: "rifle", desc: "Ninja de camuflagem com rifle de precisão e mira." },
  { id: "monk-shaolin", name: "Monge Shaolin", category: "Ninjas", style: "monk", main: "#c66b24", second: "#702d19", accent: "#f1c66b", skin: "#e5b58e", pattern: "fabric", desc: "Monge de túnica tradicional e faixa dourada." },
  { id: "ninja-purple", name: "Ninja Violeta", category: "Ninjas", style: "ninja", main: "#5d2a91", second: "#241039", accent: "#e2a7ff", skin: NINJA_SKIN, pattern: "fabric", cape: "#35134e", weapon: "katana", desc: "Ninja de capa violeta e katana." },
  { id: "ninja-green", name: "Ninja Esmeralda", category: "Ninjas", style: "ninja", main: "#237a4a", second: "#123e2b", accent: "#b4f58a", skin: NINJA_SKIN, pattern: "fabric", weapon: "katana", desc: "Ninja verde sem capa, leve e veloz." },
  { id: "ninja-cyan", name: "Ninja Ciano", category: "Ninjas", style: "ninja", main: "#168caa", second: "#06445b", accent: "#8df4ff", skin: NINJA_SKIN, pattern: "fabric", weapon: "katana", desc: "Ninja azul-ciano sem capa." },
  { id: "ninja-ronin", name: "Ninja Ronin", category: "Ninjas", style: "ninja", main: "#77736a", second: "#292823", accent: "#d5b46a", skin: NINJA_SKIN, pattern: "fabric", cape: "#4a3428", weapon: "katana", desc: "Ronin errante com capa curta e katana." },

  { id: "coat-detective", name: "Detetive de Sobretudo", category: "Outros", style: "coat", main: "#20232b", second: "#b7b2a8", accent: "#8b5a2b", skin: "#e4b995", pattern: "fabric", desc: "Sobretudo longo, gola alta e chapéu." },
  { id: "coat-noir", name: "Detetive Noir", category: "Outros", style: "coat", main: "#111722", second: "#343d4b", accent: "#c7a56b", skin: "#d6ae91", pattern: "fabric", cape: "#171d28", desc: "Sobretudo escuro, lapelas e visual de investigador." },
  { id: "skeleton-cape", name: "Esqueleto de Capa", category: "Outros", style: "skeleton", main: "#eee7d6", second: "#b9b1a1", accent: "#252333", skin: "#eee7d6", pattern: "plain", cape: "#171725", glow: "#8b79ff", desc: "Ossos antigos sob uma capa sombria." },
  { id: "skeleton-spectral", name: "Esqueleto Espectral", category: "Outros", style: "skeleton", main: "#e9f7f5", second: "#a8d7d5", accent: "#45eaff", skin: "#e9f7f5", pattern: "plain", glow: "#45eaff", desc: "Emite partículas espectrais enquanto corre." },

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
  { id: "monkey-brown", name: "Macaco Marrom", category: "Macacos", style: "monkey", main: "#80502d", second: "#d9ad7c", accent: "#4a2b1b", skin: "#c88f68", pattern: "plain", desc: "Felpudo, ágil e pronto para correr." },
  { id: "monkey-black", name: "Macaco Preto", category: "Macacos", style: "monkey", main: "#25242a", second: "#b58a68", accent: "#101014", skin: "#9c765e", pattern: "plain", desc: "Pelagem escura e olhar atento." },
  { id: "monkey-white", name: "Macaco Branco", category: "Macacos", style: "monkey", main: "#e8e4dc", second: "#fff0d8", accent: "#a9a09a", skin: "#d6ae91", pattern: "plain", desc: "Pelagem clara como a neve." },
  { id: "monkey-gold", name: "Macaco Dourado", category: "Macacos", style: "monkey", main: "#d7a928", second: "#f7d98b", accent: "#8c5a12", skin: "#d5a47c", pattern: "plain", metal: 0.25, desc: "Um brilho dourado em cada corrida." },
  { id: "monkey-blue", name: "Macaco Azul", category: "Macacos", style: "monkey", main: "#2468c9", second: "#a8d8f5", accent: "#12366e", skin: "#b88970", pattern: "plain", desc: "Pelagem azul vibrante." },
  { id: "monkey-red", name: "Macaco Vermelho", category: "Macacos", style: "monkey", main: "#bd3038", second: "#f0b18e", accent: "#6c151d", skin: "#c58d70", pattern: "plain", desc: "Pelagem vermelha intensa." },
  { id: "monkey-rainbow", name: "Macaco Arco-íris", category: "Macacos", style: "monkey", main: "#e64b67", second: "#ffd166", accent: "#4cc9f0", skin: "#c98f73", pattern: "plain", desc: "Cores vivas em uma skin especial." },
  { id: "lizard-gecko", name: "Lagartixa", category: "Outros", style: "lizard", main: "#4dbb62", second: "#287a43", accent: "#d8f36a", skin: "#9be58a", pattern: "scales", desc: "Lagartixa ágil com pele escamosa e cauda longa." },
  { id: "dino-raptor", name: "Dinossauro Raptor", category: "Outros", style: "dinosaur", main: "#4b8b48", second: "#285333", accent: "#e2b65c", skin: "#8fbd70", pattern: "scales", desc: "Pequeno dinossauro veloz com crista e cauda." },
  { id: "king-emerald", name: "Rei Esmeralda", category: "Outros", style: "knight", main: "#d6b24a", second: "#4b174f", accent: "#f6d76b", skin: "#e0b088", pattern: "plates", metal: 0.72, cape: "#321044", armor: "full", weapon: "sword", desc: "Rei de armadura dourada, coroa real e capa longa." },
  { id: "vigilante-shotgun", name: "Justiceiro", category: "Outros", style: "coat", main: "#24252b", second: "#111318", accent: "#a52d32", skin: "#c99a74", pattern: "fabric", weapon: "shotgun", desc: "Vigilante de sobretudo com espingarda presa às costas." },
  { id: "skeleton-green", name: "Esqueleto Verde", category: "Outros", style: "skeleton", main: "#6ee45d", second: "#2e8c45", accent: "#b8ff82", skin: "#6ee45d", pattern: "plain", glow: "#66ff72", desc: "Ossos verdes com brilho radioativo." },
  { id: "skeleton-blue", name: "Esqueleto Azul", category: "Outros", style: "skeleton", main: "#59baff", second: "#2463b5", accent: "#a5e7ff", skin: "#59baff", pattern: "plain", glow: "#4bc8ff", desc: "Ossos azuis com energia congelante." },
  { id: "skeleton-purple", name: "Esqueleto Roxo", category: "Outros", style: "skeleton", main: "#a56bdb", second: "#59318b", accent: "#e0b0ff", skin: "#a56bdb", pattern: "plain", glow: "#c17bff", desc: "Ossos violetas e olhos sobrenaturais." },
  { id: "skeleton-gold", name: "Esqueleto Dourado", category: "Outros", style: "skeleton", main: "#e8b72e", second: "#9b6a12", accent: "#f7df75", skin: "#e8b72e", pattern: "plain", metal: 0.7, glow: "#43ff9a", desc: "Esqueleto de ouro com coroa e esmeralda brilhante." },
  { id: "ninja-oni", name: "Ninja Oni", category: "Ninjas", style: "ninja", main: "#32151f", second: "#120b13", accent: "#ff405d", skin: "#c98b7d", pattern: "fabric", cape: "#4b101e", weapon: "katana", glow: "#ff1744", desc: "Máscara demoníaca, capa rubra e olhos incandescentes." },
  { id: "samurai-storm", name: "Samurai Tempestade", category: "Samurais", style: "samurai", main: "#31546b", second: "#172b3b", accent: "#9be8ff", skin: "#d9ad8c", pattern: "plates", metal: 0.78, armor: "full", weapon: "katana", glow: "#55dfff", desc: "Armadura azul de aço com energia elétrica." },
  { id: "robot-titan", name: "Titã Mecânico", category: "Robôs", style: "robot", main: "#777f8e", second: "#252b37", accent: "#ff8b36", skin: "#aeb9c9", pattern: "plates", metal: 0.9, armor: "full", glow: "#ff6b25", desc: "Robô pesado com núcleo de energia laranja." },
  { id: "zombie-mummy", name: "Múmia Ancestral", category: "Zumbis", style: "zombie", main: "#c7b78b", second: "#766548", accent: "#4e392b", skin: "#b6a27d", pattern: "stains", glow: "#d7b76a", desc: "Bandagens antigas e olhos dourados." },
  { id: "monkey-cyber", name: "Macaco Cyber", category: "Macacos", style: "monkey", main: "#333c54", second: "#b7c7d9", accent: "#31e6ff", skin: "#b88b70", pattern: "circuit", metal: 0.55, glow: "#31e6ff", desc: "Pelagem metálica com detalhes holográficos." },
  { id: "alien-crystal", name: "Alien Cristal", category: "Outros", style: "alien", main: "#6c4fc4", second: "#30235f", accent: "#a9fff0", skin: "#9de7d9", pattern: "scales", glow: "#8dfff0", desc: "Criatura cristalina com brilho de outro mundo." },
  { id: "alien", name: "Alienígena", category: "Outros", style: "alien", main: "#5a6b8a", second: "#2a3448", accent: "#c0ff3a", skin: "#7ee08a", pattern: "scales", glow: "#c0ff3a", desc: "Veio de muito longe." },
  { id: "hacker-code", name: "Hacker de Código", category: "Outros", style: "coat", main: "#101916", second: "#050908", accent: "#18ff70", skin: "#e8c3a4", pattern: "circuit", glow: "#18ff70", desc: "Máscara digital, laptop aberto e uma trilha verde de códigos. +15% velocidade e +5% salto." },
  { id: "sun-wukong", name: "Sun Wukong", category: "Macacos", style: "monkey", main: "#e7a52d", second: "#8b3c1c", accent: "#ffe66d", skin: "#d99a70", pattern: "fabric", glow: "#ffcf4a", code: "SUNWUK0NG", speedBonus: 0.05, jumpBonus: 0.2, desc: "Rei Macaco com bastão dourado. +5% velocidade e +20% salto." },
  { id: "godzilla", name: "Godzilla", category: "Outros", style: "dinosaur", main: "#315d55", second: "#193b39", accent: "#8de8d0", skin: "#416d61", pattern: "scales", glow: "#3af4db", code: "K1NG0FMONSTERS", scale: 1.72, speedBonus: 0.08, jumpBonus: 0.15, desc: "Monstro colossal com espinhos atômicos. Gigante, +8% velocidade e +15% salto." },
  { id: "sun-kong", name: "Sun Kong", category: "Macacos", style: "monkey", main: "#b66a2d", second: "#3d2118", accent: "#ffcc55", skin: "#a96f50", pattern: "fabric", glow: "#ff9e36", code: "KingKong+SunWukong", scale: 1.78, speedBonus: 0.15, jumpBonus: 0.1, desc: "Fusão colossal do Rei Macaco com King Kong. +15% velocidade e +10% salto." },
  { id: "skeleton-rgb", name: "Esqueleto Espectral RGB", category: "Outros", style: "skeleton", main: "#e9f7f5", second: "#a8d7d5", accent: "#45eaff", skin: "#e9f7f5", pattern: "plain", glow: "#45eaff", code: "R4INB0WSKELETON", speedBonus: 0.12, jumpBonus: 0.08, desc: "Ossos espectrais com brilho RGB permanente. +12% velocidade e +8% salto." },
  { id: "ifood-delivery", name: "Entregador do iFood", category: "Outros", style: "coat", main: "#e52c3b", second: "#25252b", accent: "#ffffff", skin: "#d9a47d", pattern: "fabric", glow: "#ff4050", code: "IFOOD", speedBonus: 0.1, jumpBonus: 0.05, desc: "Uniforme vermelho, mochila de entrega e agilidade urbana. +10% velocidade e +5% salto." },
  { id: "ant-rgb", name: "Formiga RGB", category: "Outros", style: "alien", main: "#25202e", second: "#5a344d", accent: "#49ffb2", skin: "#8b5361", pattern: "plain", glow: "#49ffb2", code: "TINYRGB", scale: 0.62, speedBonus: 0.2, jumpBonus: -0.1, desc: "Formiga minúscula com antenas e carapaça RGB. +20% velocidade, salto -10%." },
];

export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c])) as Record<string, CharacterDef>;
export const CATEGORIES: Category[] = ["Ninjas", "Samurais", "Robôs", "Zumbis", "Outros", "Macacos"];
