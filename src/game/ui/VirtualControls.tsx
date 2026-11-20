import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { audio } from "../audio";
import { press, release, type Action } from "../input";
import { useSettings } from "../store";

type KeyDef = { a: Action; label: string; Icon: typeof ArrowUp; hint: string };
const KEYS: [KeyDef, KeyDef, KeyDef, KeyDef] = [
  { a: "up", label: "W", Icon: ArrowUp, hint: "Pular" },
  { a: "left", label: "A", Icon: ArrowLeft, hint: "Esquerda" },
  { a: "down", label: "S", Icon: ArrowDown, hint: "Deslizar" },
  { a: "right", label: "D", Icon: ArrowRight, hint: "Direita" },
];

function Key({ a, label, Icon, hint, size }: KeyDef & { size: number }) {
  const [down, setDown] = useState(false);
  const pointers = useRef(new Set<number>());
  const vibration = useSettings((s) => s.vibration);
  const end = (id: number) => {
    if (!pointers.current.has(id)) return;
    pointers.current.delete(id);
    release(a);
    if (pointers.current.size === 0) setDown(false);
  };
  return (
    <button
      type="button"
      aria-label={hint}
      data-down={down}
      className="keycap pointer-events-auto flex-col"
      style={{ width: size, height: size }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        if (pointers.current.has(e.pointerId)) return;
        pointers.current.add(e.pointerId);
        setDown(true);
        press(a);
        audio.unlock();
        audio.click();
        if (vibration && navigator.vibrate) navigator.vibrate(8);
      }}
      onPointerUp={(e) => end(e.pointerId)}
      onPointerCancel={(e) => end(e.pointerId)}
      onLostPointerCapture={(e) => end(e.pointerId)}
    >
      <span style={{ fontSize: size * 0.36 }} className="leading-none">
        {label}
      </span>
      <Icon style={{ width: size * 0.22, height: size * 0.22 }} className="mt-0.5 opacity-70" />
    </button>
  );
}

export function VirtualControls() {
  const visible = useSettings((s) => s.controlsVisible);
  const scale = useSettings((s) => s.controlsSize);
  const pos = useSettings((s) => s.controlsPosition);
  const opacity = useSettings((s) => s.controlsOpacity);
  if (!visible) return null;
  const size = Math.round(64 * scale);
  const gap = Math.round(8 * scale);
  return (
    <div
      className={cn(
        "virtual-controls-root pointer-events-none absolute bottom-0 flex p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        pos === "left" && "left-0",
        pos === "right" && "right-0",
        pos === "center" && "inset-x-0 justify-center",
      )}
      style={{ opacity }}
    >
      <div className="flex flex-col items-center" style={{ gap }}>
        <Key {...KEYS[0]} size={size} />
        <div className="flex" style={{ gap }}>
          <Key {...KEYS[1]} size={size} />
          <Key {...KEYS[2]} size={size} />
          <Key {...KEYS[3]} size={size} />
        </div>
      </div>
    </div>
  );
}
