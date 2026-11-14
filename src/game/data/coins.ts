export type CoinColorId = "gold" | "blue" | "red" | "green" | "purple" | "white" | "black" | "rainbow";

export const COIN_COLORS: { id: CoinColorId; label: string; color: string; emissive: string }[] = [
  { id: "gold", label: "Dourado", color: "#ffc82e", emissive: "#ff9a00" },
  { id: "blue", label: "Azul", color: "#3fa0ff", emissive: "#0060ff" },
  { id: "red", label: "Vermelho", color: "#ff3b3b", emissive: "#d00000" },
  { id: "green", label: "Verde", color: "#3ee06a", emissive: "#00a83a" },
  { id: "purple", label: "Roxo", color: "#b45cff", emissive: "#7a00ff" },
  { id: "white", label: "Branco", color: "#f5f5f5", emissive: "#b0c4ff" },
  { id: "black", label: "Preto", color: "#2a2a2e", emissive: "#3a3550" },
  { id: "rainbow", label: "Arco-íris", color: "#ffffff", emissive: "#ffffff" },
];
export const COIN_BY_ID = Object.fromEntries(COIN_COLORS.map((c) => [c.id, c])) as Record<
  CoinColorId,
  (typeof COIN_COLORS)[number]
>;
