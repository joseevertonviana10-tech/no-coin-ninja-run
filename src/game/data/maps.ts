import type { KindWeights, ObstacleKind } from "../sim/types";

export type MapId = "city" | "snow" | "volcano" | "jungle" | "race" | "desert" | "future";
export type Weather = "none" | "dust" | "snow" | "embers" | "sand" | "leaves" | "neon" | "confetti" | "rain" | "blizzard" | "ash" | "tech-rain" | "sandstorm";

export interface MapDef {
  id: MapId;
  name: string;
  tagline: string;
  sky: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  side: string; // side ground color
  sideEmissive?: string; // lava / neon floors
  track: string;
  trackStyle: "rails" | "snow" | "basalt" | "dirt" | "asphalt" | "sand" | "grid";
  sun: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  laneGrip: number;
  weather: Weather;
  weights: KindWeights;
  names: Record<Exclude<ObstacleKind, "ramp">, string>;
  swatch: [string, string];
}

export const MAPS: MapDef[] = [
  {
    id: "city",
    name: "Cidade",
    tagline: "Metrôs, túneis e trens em alta velocidade",
    sky: "#77c5ff",
    fog: "#c9edff",
    fogNear: 40,
    fogFar: 170,
    side: "#7d8590",
    track: "#6e6259",
    trackStyle: "rails",
    sun: "#fff2d9",
    sunIntensity: 2.4,
    hemiSky: "#cfe8ff",
    hemiGround: "#6b5f55",
    hemiIntensity: 1.1,
    laneGrip: 1,
    weather: "rain",
    weights: { low: 3, high: 2, crate: 2, car: 1, train: 3.5, hole: 0.8 },
    names: { low: "Barricada", high: "Placa suspensa", crate: "Caixas", car: "Táxi", train: "Metrô", hole: "Trilho quebrado" },
    swatch: ["#ffb347", "#4a90d9"],
  },
  {
    id: "snow",
    name: "Neve",
    tagline: "Montanhas congeladas e pista escorregadia",
    sky: "#a8d9f5",
    fog: "#e9f7ff",
    fogNear: 25,
    fogFar: 130,
    side: "#f4f8fc",
    track: "#dfe9f2",
    trackStyle: "snow",
    sun: "#eaf3ff",
    sunIntensity: 2.0,
    hemiSky: "#ffffff",
    hemiGround: "#9fb6cc",
    hemiIntensity: 1.3,
    laneGrip: 0.55,
    weather: "blizzard",
    weights: { low: 3, high: 2, crate: 2.5, car: 0.6, train: 2.5, hole: 1.2 },
    names: { low: "Tronco nevado", high: "Arco de gelo", crate: "Bloco de gelo", car: "Snowmobile", train: "Trem limpa-neve", hole: "Fenda no gelo" },
    swatch: ["#e8f4ff", "#5aa0d8"],
  },
  {
    id: "volcano",
    name: "Vulcão",
    tagline: "Pontes sobre lava e rochas incandescentes",
    sky: "#b34b42",
    fog: "#d27650",
    fogNear: 25,
    fogFar: 120,
    side: "#2a0e06",
    sideEmissive: "#ff4a0a",
    track: "#3b3633",
    trackStyle: "basalt",
    sun: "#ffb37a",
    sunIntensity: 2.2,
    hemiSky: "#ff7a3d",
    hemiGround: "#2a1410",
    hemiIntensity: 1.0,
    laneGrip: 1,
    weather: "ash",
    weights: { low: 3, high: 1.5, crate: 3, car: 1, train: 2, hole: 2 },
    names: { low: "Rochas vulcânicas", high: "Arco de rocha", crate: "Pedregulho", car: "Carrinho de mina", train: "Trem de minério", hole: "Fenda de lava" },
    swatch: ["#ff5a1f", "#2a0e06"],
  },
  {
    id: "jungle",
    name: "Floresta Amazônica",
    tagline: "Árvores gigantes, cipós e rios",
    sky: "#83d6a0",
    fog: "#b2e7a7",
    fogNear: 20,
    fogFar: 110,
    side: "#2f6b2a",
    track: "#7a5a3a",
    trackStyle: "dirt",
    sun: "#fff4c4",
    sunIntensity: 2.0,
    hemiSky: "#d8f5c8",
    hemiGround: "#3a5a2a",
    hemiIntensity: 1.2,
    laneGrip: 1,
    weather: "leaves",
    weights: { low: 3.5, high: 2.5, crate: 2.5, car: 0.5, train: 2, hole: 1.5 },
    names: { low: "Tronco caído", high: "Cipó", crate: "Pedra", car: "Jipe", train: "Árvore gigante caída", hole: "Rio" },
    swatch: ["#3fa34d", "#f2c14e"],
  },
  {
    id: "race",
    name: "Pista de Corrida",
    tagline: "Asfalto, arquibancadas e carros de corrida",
    sky: "#80c9ff",
    fog: "#c8edff",
    fogNear: 45,
    fogFar: 180,
    side: "#4e9a3a",
    track: "#3b3d42",
    trackStyle: "asphalt",
    sun: "#ffffff",
    sunIntensity: 2.6,
    hemiSky: "#e0f0ff",
    hemiGround: "#4a5a40",
    hemiIntensity: 1.1,
    laneGrip: 1.1,
    weather: "confetti",
    weights: { low: 3, high: 1.5, crate: 2.5, car: 3, train: 2, hole: 0.6 },
    names: { low: "Cones", high: "Pórtico", crate: "Pneus", car: "Carro de corrida", train: "Caminhão", hole: "Poça de óleo" },
    swatch: ["#e63946", "#f1faee"],
  },
  {
    id: "desert",
    name: "Deserto",
    tagline: "Dunas, ruínas e tempestades de areia",
    sky: "#ffc477",
    fog: "#f8d59a",
    fogNear: 18,
    fogFar: 100,
    side: "#e2b46e",
    track: "#c79a5c",
    trackStyle: "sand",
    sun: "#fff0d0",
    sunIntensity: 2.6,
    hemiSky: "#ffe2b0",
    hemiGround: "#a07040",
    hemiIntensity: 1.1,
    laneGrip: 0.85,
    weather: "sandstorm",
    weights: { low: 3, high: 2, crate: 2.5, car: 1, train: 2, hole: 1.5 },
    names: { low: "Sacos de areia", high: "Arco de ruína", crate: "Jarros antigos", car: "Jipe velho", train: "Caravana", hole: "Areia movediça" },
    swatch: ["#e9a23b", "#8a4b2a"],
  },
  {
    id: "future",
    name: "Cidade Futurista",
    tagline: "Neon, hologramas e veículos voadores",
    sky: "#373b83",
    fog: "#6b63ad",
    fogNear: 30,
    fogFar: 150,
    side: "#0e0b22",
    sideEmissive: "#2be0ff",
    track: "#1c1b2e",
    trackStyle: "grid",
    sun: "#b8c8ff",
    sunIntensity: 1.8,
    hemiSky: "#7a6bff",
    hemiGround: "#1a1030",
    hemiIntensity: 1.1,
    laneGrip: 1.15,
    weather: "tech-rain",
    weights: { low: 3, high: 2.5, crate: 2, car: 1.5, train: 3, hole: 1.2 },
    names: { low: "Cerca laser", high: "Portal holográfico", crate: "Cubo de carga", car: "Carro flutuante", train: "Trem maglev", hole: "Vazio de energia" },
    swatch: ["#2be0ff", "#ff3df2"],
  },
];

export const MAP_BY_ID = Object.fromEntries(MAPS.map((m) => [m.id, m])) as Record<MapId, MapDef>;


/** Each map is a looping route made of four themed districts. */
export const MAP_DISTRICTS: Record<MapId, [string, string, string, string]> = {
  city: ["Centro da Cidade", "Zona Industrial", "Bairro Residencial", "Parque Urbano"],
  snow: ["Floresta Nevada", "Vila da Montanha", "Lago Congelado", "Passagem Alpina"],
  volcano: ["Campo de Cinzas", "Mina Vulcânica", "Aldeia da Montanha", "Ponte de Obsidiana"],
  jungle: ["Margem do Rio", "Vila da Floresta", "Templo Antigo", "Selva Fechada"],
  race: ["Entrada dos Boxes", "Arquibancadas", "Área de Serviço", "Reta de Chegada"],
  desert: ["Mar de Dunas", "Oásis", "Ruínas Antigas", "Acampamento Nômade"],
  future: ["Distrito Neon", "Mercado Cibernético", "Reator Central", "Via Elevada"],
};
export function getDistrict(mapId: MapId, distance: number) {
  const index = Math.floor(Math.max(0, distance) / 65) % 4;
  return MAP_DISTRICTS[mapId][index] ?? MAP_DISTRICTS[mapId][0];
}
