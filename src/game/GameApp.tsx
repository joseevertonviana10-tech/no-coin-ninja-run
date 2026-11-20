import { Canvas } from "@react-three/fiber";
import { Component, useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { audio } from "./audio";
import { KEY_MAP, press, release, releaseAll, setSensitivity, tap, type Action } from "./input";
import { pauseRun, resumeRun, runtime, startRun } from "./runtime";
import { World } from "./scene/World";
import { useSettings, useUI } from "./store";
import { CharacterSelect } from "./ui/CharacterSelect";
import { GameOver, PauseMenu } from "./ui/GameOver";
import { HUD } from "./ui/HUD";
import { MapSelect } from "./ui/MapSelect";
import { Menu } from "./ui/Menu";
import { Records } from "./ui/Records";
import { TrainingScreen } from "./ui/TrainingScreen";
import { EffectsShop } from "./ui/EffectsShop";
import { AccessoriesShop } from "./ui/AccessoriesShop";
import { SettingsScreen } from "./ui/SettingsScreen";
import { VirtualControls } from "./ui/VirtualControls";

class CanvasBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  override state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  override render() {
    if (this.state.error)
      return (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Não foi possível iniciar os gráficos 3D neste aparelho. ({this.state.error})
        </div>
      );
    return this.props.children;
  }
}

const DPR = { low: 1, medium: 1.25, high: 1.6, ultra: 2 } as const;

export function GameApp() {
  const screen = useUI((s) => s.screen);
  const quality = useSettings((s) => s.quality);
  const s = useSettings();
  const swipe = useRef<{ id: number; x: number; y: number; fired: boolean } | null>(null);

  // Audio volumes and sensitivity follow settings.
  useEffect(() => {
    audio.setVolumes({ master: s.masterVolume, sfx: s.sfxVolume, music: s.musicVolume, on: s.soundOn });
    setSensitivity(s.sensitivity);
  }, [s.masterVolume, s.sfxVolume, s.musicVolume, s.soundOn, s.sensitivity]);

  useEffect(() => {
    audio.setAmbience(s.ambientWeather && s.soundOn, s.map);
  }, [s.ambientWeather, s.soundOn, s.map]);

  // Start menu music on the first gesture.
  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      if (runtime.mode === "menu") audio.startMusic(useSettings.getState().map);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Keyboard: WASD, arrows, Space; P/Esc pause; Enter play/retry.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const a = KEY_MAP[e.code];
      if (a && (runtime.mode === "playing" || runtime.mode === "dead")) {
        e.preventDefault();
        if (!e.repeat) press(a);
        return;
      }
      if (e.code === "Escape" || e.code === "KeyP") {
        if (runtime.mode === "playing") pauseRun();
        else if (runtime.mode === "paused") resumeRun();
      }
      if (e.code === "Enter" && (runtime.mode === "menu" || runtime.mode === "over")) {
        const sc = useUI.getState().screen;
        if (sc === "menu" || sc === "gameover") startRun();
      }
    };
    const up = (e: KeyboardEvent) => {
      const a = KEY_MAP[e.code];
      if (a) release(a);
    };
    const blur = () => releaseAll();
    const vis = () => {
      if (document.hidden) {
        releaseAll();
        pauseRun();
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  // Gamepad support: face buttons, D-pad and analog stick share the same input layer.
  useEffect(() => {
    let frame = 0;
    let previous = new Set<Action>();
    const actions: Action[] = ["up", "left", "down", "right"];
    const poll = () => {
      const pads = typeof navigator.getGamepads === "function" ? Array.from(navigator.getGamepads()) : [];
      const pad = pads.find((candidate) => candidate?.connected);
      const next = new Set<Action>();
      if (pad && runtime.mode === "playing" && !document.hidden) {
        const pressed = (index: number) => Boolean(pad.buttons[index]?.pressed);
        if (pressed(0) || pressed(12) || (pad.axes[1] ?? 0) < -0.55) next.add("up");
        if (pressed(1) || pressed(13) || (pad.axes[1] ?? 0) > 0.55) next.add("down");
        if (pressed(14) || (pad.axes[0] ?? 0) < -0.55) next.add("left");
        if (pressed(15) || (pad.axes[0] ?? 0) > 0.55) next.add("right");
      }
      for (const action of actions) {
        if (next.has(action) && !previous.has(action)) press(action);
        else if (!next.has(action) && previous.has(action)) release(action);
      }
      previous = next;
      frame = window.requestAnimationFrame(poll);
    };
    frame = window.requestAnimationFrame(poll);
    return () => {
      window.cancelAnimationFrame(frame);
      for (const action of previous) release(action);
      previous.clear();
    };
  }, []);

  useEffect(() => {
    if (screen !== "playing") releaseAll();
  }, [screen]);

  // Dev-only debug handle for scripted checks.
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __game: unknown }).__game = { runtime, startRun, useSettings, useUI };
  }, []);

  const playing = screen === "playing";

  return (
    <div
      id="game-root"
      data-rgb-phone={s.rgbPhone ? "true" : "false"}
      className="fixed inset-0 touch-none overflow-hidden bg-background text-foreground"
      onPointerDown={(e) => {
        if (!playing) return;
        swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false };
      }}
      onPointerMove={(e) => {
        const sw = swipe.current;
        if (!sw || sw.id !== e.pointerId || !playing) return;
        const dx = e.clientX - sw.x;
        const dy = e.clientY - sw.y;
        const th = 36 / useSettings.getState().sensitivity;
        if (Math.abs(dx) > th || Math.abs(dy) > th) {
          if (Math.abs(dx) > Math.abs(dy)) tap(dx > 0 ? "right" : "left");
          else tap(dy < 0 ? "up" : "down");
          sw.x = e.clientX;
          sw.y = e.clientY;
        }
      }}
      onPointerUp={() => (swipe.current = null)}
      onPointerCancel={() => (swipe.current = null)}
    >
      <CanvasBoundary>
        <Canvas
          key={quality}
          shadows={quality !== "low"}
          dpr={[1, DPR[quality]]}
          camera={{ position: [1.8, 1.5, -4.2], fov: 60, near: 0.1, far: 400 }}
          gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <World />
        </Canvas>
      </CanvasBoundary>
      {screen === "menu" && <Menu />}
      {screen === "characters" && <CharacterSelect />}
      {screen === "maps" && <MapSelect />}
      {screen === "settings" && <SettingsScreen />}
      {screen === "records" && <Records />}
      {screen === "training" && <TrainingScreen />}
      {screen === "effects" && <EffectsShop />}
      {screen === "accessories" && <AccessoriesShop />}
      {(screen === "playing" || screen === "paused") && <HUD />}
      {screen === "playing" && <VirtualControls />}
      {screen === "paused" && <PauseMenu />}
      {screen === "gameover" && <GameOver />}
      <div key={`${screen}-${s.map}`} className="screen-wipe" aria-hidden="true" />
    </div>
  );
}
