import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/game/GameApp";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NO COIN SURFERS — Corrida infinita sem moedas" },
      { name: "description", content: "Jogo 3D de corrida infinita em 3 faixas: desvie de trens e obstáculos e sobreviva sem pegar nenhuma moeda." },
      { property: "og:title", content: "NO COIN SURFERS — Corrida infinita sem moedas" },
      { property: "og:description", content: "Jogo 3D de corrida infinita em 3 faixas: desvie de trens e obstáculos e sobreviva sem pegar nenhuma moeda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GameApp,
});
