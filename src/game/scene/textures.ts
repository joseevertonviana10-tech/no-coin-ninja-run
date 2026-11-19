import * as THREE from "three";
import type { Pattern } from "../data/characters";
import type { MapDef } from "../data/maps";

const cache = new Map<string, THREE.Texture>();

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function finish(key: string, c: HTMLCanvasElement, repeat?: [number, number], srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

function speckle(g: CanvasRenderingContext2D, w: number, h: number, n: number, min: number, max: number, alpha = 0.25, size = 2) {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(min + Math.random() * (max - min));
    g.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    const s = 1 + Math.random() * size;
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
}

/** Grayscale detail maps that tint with the material color. */
export function patternTexture(p: Pattern) {
  const key = "pat-" + p;
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(128, 128);
  g.fillStyle = "#e8e8e8";
  g.fillRect(0, 0, 128, 128);
  switch (p) {
    case "fabric":
      for (let y = 0; y < 128; y += 2) {
        g.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.05})`;
        g.fillRect(0, y, 128, 1);
      }
      for (let x = 0; x < 128; x += 3) {
        g.fillStyle = "rgba(255,255,255,0.06)";
        g.fillRect(x, 0, 1, 128);
      }
      speckle(g, 128, 128, 300, 120, 200, 0.15);
      break;
    case "rust":
      speckle(g, 128, 128, 400, 180, 240, 0.3, 3);
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(${90 + Math.random() * 40},${40 + Math.random() * 20},10,${0.25 + Math.random() * 0.3})`;
        g.beginPath();
        g.arc(Math.random() * 128, Math.random() * 128, 3 + Math.random() * 12, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = "rgba(0,0,0,0.35)";
      for (let i = 16; i < 128; i += 32) g.strokeRect(2, i - 14, 124, 28);
      break;
    case "camo":
      for (let i = 0; i < 60; i++) {
        const v = [90, 150, 210][i % 3];
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath();
        g.ellipse(Math.random() * 128, Math.random() * 128, 6 + Math.random() * 14, 4 + Math.random() * 8, Math.random() * 3, 0, Math.PI * 2);
        g.fill();
      }
      break;
    case "plates":
      for (let y = 0; y < 128; y += 16) {
        const grd = g.createLinearGradient(0, y, 0, y + 16);
        grd.addColorStop(0, "#ffffff");
        grd.addColorStop(0.85, "#c8c8c8");
        grd.addColorStop(1, "#505050");
        g.fillStyle = grd;
        g.fillRect(0, y, 128, 16);
        g.fillStyle = "#f0d070";
        for (let x = 8; x < 128; x += 20) g.fillRect(x, y + 6, 3, 3);
      }
      break;
    case "circuit":
      g.fillStyle = "#cfcfcf";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "#ffffff";
      g.lineWidth = 2;
      for (let i = 0; i < 18; i++) {
        let x = Math.random() * 128;
        let y = Math.random() * 128;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          if (k % 2) x += (Math.random() - 0.5) * 60;
          else y += (Math.random() - 0.5) * 60;
          g.lineTo(x, y);
        }
        g.stroke();
        g.fillStyle = "#fff";
        g.fillRect(x - 2, y - 2, 4, 4);
      }
      break;
    case "stains":
      speckle(g, 128, 128, 300, 150, 230, 0.25, 3);
      for (let i = 0; i < 25; i++) {
        g.fillStyle = `rgba(60,40,20,${0.15 + Math.random() * 0.25})`;
        g.beginPath();
        g.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 10, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = "rgba(0,0,0,0.5)";
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        const x = Math.random() * 128;
        g.moveTo(x, Math.random() * 128);
        g.lineTo(x + 10, Math.random() * 128);
        g.stroke();
      }
      break;
    case "scales":
      for (let y = 0; y < 128; y += 8)
        for (let x = (y / 8) % 2 ? 4 : 0; x < 128; x += 8) {
          g.strokeStyle = "rgba(0,0,0,0.2)";
          g.beginPath();
          g.arc(x, y, 5, 0, Math.PI);
          g.stroke();
        }
      break;
    case "chain":
      g.fillStyle = "#b0b0b0";
      g.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 6)
        for (let x = (y / 6) % 2 ? 3 : 0; x < 128; x += 6) {
          g.strokeStyle = "#f4f4f4";
          g.beginPath();
          g.arc(x, y, 2.6, 0, Math.PI * 2);
          g.stroke();
        }
      break;
    default:
      speckle(g, 128, 128, 200, 190, 250, 0.2);
  }
  return finish(key, c, [1, 1]);
}

export function trackTexture(map: MapDef) {
  const key = "track-" + map.id;
  if (cache.has(key)) return cache.get(key)!;
  const W = 512;
  const H = 512;
  const [c, g] = canvas(W, H);
  g.fillStyle = map.track;
  g.fillRect(0, 0, W, H);
  speckle(g, W, H, 3000, 0, 255, 0.12, 3);
  const laneX = (l: number) => ((l * 2.5 + 4.2) / 8.4) * W;
  switch (map.trackStyle) {
    case "rails":
    case "basalt":
      for (let y = 0; y < H; y += 32) {
        for (const l of [-1, 0, 1]) {
          g.fillStyle = map.trackStyle === "rails" ? "#5a3a24" : "#2a2420";
          g.fillRect(laneX(l) - 46, y, 92, 12);
        }
      }
      for (const l of [-1, 0, 1]) {
        g.fillStyle = map.trackStyle === "rails" ? "#c8c8d0" : "#8a7a70";
        g.fillRect(laneX(l) - 34, 0, 6, H);
        g.fillRect(laneX(l) + 28, 0, 6, H);
        g.fillStyle = "rgba(255,255,255,0.5)";
        g.fillRect(laneX(l) - 33, 0, 2, H);
        g.fillRect(laneX(l) + 29, 0, 2, H);
      }
      if (map.trackStyle === "basalt") {
        g.strokeStyle = "rgba(255,90,20,0.35)";
        for (let i = 0; i < 30; i++) {
          g.beginPath();
          const x = Math.random() * W;
          const y = Math.random() * H;
          g.moveTo(x, y);
          g.lineTo(x + (Math.random() - 0.5) * 40, y + Math.random() * 40);
          g.stroke();
        }
      }
      break;
    case "asphalt":
      g.fillStyle = "#f2f2f2";
      for (const b of [-0.5, 0.5]) for (let y = 0; y < H; y += 64) g.fillRect(laneX(b) - 4, y, 8, 36);
      for (let y = 0; y < H; y += 32) {
        g.fillStyle = (y / 32) % 2 ? "#e63946" : "#f1faee";
        g.fillRect(0, y, 14, 32);
        g.fillRect(W - 14, y, 14, 32);
      }
      break;
    case "snow":
      for (const l of [-1, 0, 1]) {
        g.fillStyle = "rgba(120,150,190,0.25)";
        g.fillRect(laneX(l) - 30, 0, 12, H);
        g.fillRect(laneX(l) + 18, 0, 12, H);
      }
      speckle(g, W, H, 1500, 220, 255, 0.5, 2);
      break;
    case "dirt":
      for (let i = 0; i < 120; i++) {
        g.fillStyle = `rgba(${40 + Math.random() * 60},${80 + Math.random() * 80},30,0.5)`;
        g.beginPath();
        g.ellipse(Math.random() * W, Math.random() * H, 4 + Math.random() * 8, 2 + Math.random() * 4, Math.random() * 3, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < 80; i++) {
        g.fillStyle = "rgba(60,50,40,0.6)";
        g.beginPath();
        g.arc(Math.random() * W, Math.random() * H, 2 + Math.random() * 5, 0, Math.PI * 2);
        g.fill();
      }
      break;
    case "sand":
      for (let y = 0; y < H; y += 10) {
        g.strokeStyle = "rgba(120,80,30,0.18)";
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x < W; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 3);
        g.stroke();
      }
      for (let y = 0; y < H; y += 64)
        for (const l of [-1, 0, 1]) {
          g.fillStyle = "rgba(160,120,80,0.6)";
          g.fillRect(laneX(l) - 40, y, 80, 28);
          g.strokeStyle = "rgba(80,50,20,0.5)";
          g.strokeRect(laneX(l) - 40, y, 80, 28);
        }
      break;
    case "grid":
      g.strokeStyle = "rgba(43,224,255,0.55)";
      g.lineWidth = 2;
      for (let y = 0; y < H; y += 32) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(W, y);
        g.stroke();
      }
      for (const b of [-1.5, -0.5, 0.5, 1.5]) {
        g.fillStyle = "#ff3df2";
        g.fillRect(laneX(b) - 3, 0, 6, H);
      }
      break;
  }
  return finish(key, c, [1, 6]);
}

export function sideTexture(map: MapDef) {
  const key = "side-" + map.id;
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(256, 256);
  g.fillStyle = map.side;
  g.fillRect(0, 0, 256, 256);
  if (map.id === "volcano") {
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,${120 + Math.random() * 100},0,${0.4 + Math.random() * 0.5})`;
      g.beginPath();
      g.ellipse(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 30, 4 + Math.random() * 10, Math.random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  } else if (map.id === "future") {
    g.strokeStyle = "rgba(43,224,255,0.6)";
    g.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 256);
      g.moveTo(0, i);
      g.lineTo(256, i);
      g.stroke();
    }
  } else {
    speckle(g, 256, 256, 2500, 0, 255, 0.12, 4);
  }
  return finish(key, c, [8, 40]);
}

export function windowsTexture(lit: string, dark: string) {
  const key = `win-${lit}-${dark}`;
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(64, 128);
  g.fillStyle = dark;
  g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 12)
    for (let x = 4; x < 64; x += 12) {
      g.fillStyle = Math.random() < 0.45 ? lit : "rgba(255,255,255,0.12)";
      g.fillRect(x, y, 7, 8);
    }
  return finish(key, c);
}

export function crowdTexture() {
  const key = "crowd";
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(256, 64);
  g.fillStyle = "#3a3a44";
  g.fillRect(0, 0, 256, 64);
  const cols = ["#e63946", "#f1faee", "#ffd166", "#457b9d", "#2a9d8f", "#f4a261"];
  for (let y = 6; y < 64; y += 10)
    for (let x = 2; x < 256; x += 6) {
      g.fillStyle = cols[Math.floor(Math.random() * cols.length)] ?? "#ffffff";
      g.beginPath();
      g.arc(x + Math.random() * 2, y, 2.4, 0, Math.PI * 2);
      g.fill();
    }
  return finish(key, c, [6, 1]);
}

export function coinFaceTexture() {
  const key = "coinface";
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(128, 128);
  const grd = g.createRadialGradient(42, 34, 5, 64, 64, 68);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.42, "#d8d8d8");
  grd.addColorStop(1, "#777777");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "#ffffff";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(64, 64, 55, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#777777";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(64, 64, 47, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.beginPath();
    g.moveTo(64 + Math.cos(a) * 38, 64 + Math.sin(a) * 38);
    g.lineTo(64 + Math.cos(a) * 43, 64 + Math.sin(a) * 43);
    g.stroke();
  }
  g.fillStyle = "#ffffff";
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 13 : 30;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(40,40,40,0.6)";
  g.lineWidth = 1.5;
  g.stroke();
  g.font = "bold 12px Georgia";
  g.textAlign = "center";
  g.fillStyle = "#f8f8f8";
  g.fillText("N", 64, 91);
  return finish(key, c);
}

export function dotTexture() {
  const key = "dot";
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(64, 64);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.4, "rgba(255,255,255,0.7)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return finish(key, c);
}

export function stripeTexture(a: string, b: string) {
  const key = `stripe-${a}-${b}`;
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(128, 32);
  g.fillStyle = a;
  g.fillRect(0, 0, 128, 32);
  g.fillStyle = b;
  for (let x = -32; x < 160; x += 32) {
    g.beginPath();
    g.moveTo(x, 32);
    g.lineTo(x + 16, 0);
    g.lineTo(x + 32, 0);
    g.lineTo(x + 16, 32);
    g.fill();
  }
  return finish(key, c);
}
