import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { audio } from "../audio";

export function clickSfx() {
  audio.unlock();
  audio.click();
}

export function ArcadeButton({
  children,
  variant = "default",
  className,
  onClick,
  ...rest
}: { children: ReactNode; variant?: "default" | "primary" | "accent"; className?: string; onClick?: () => void } & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
>) {
  return (
    <button
      type="button"
      className={cn("arcade-btn", variant === "primary" && "arcade-btn-primary", variant === "accent" && "arcade-btn-accent", className)}
      onClick={() => {
        clickSfx();
        onClick?.();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <ArcadeButton className="h-11 w-11 shrink-0 p-0" onClick={onBack} aria-label="Voltar">
        <ArrowLeft className="h-5 w-5" />
      </ArcadeButton>
      <h2 className="font-display text-xl tracking-wide text-foreground text-stroke sm:text-2xl">{title}</h2>
      <div className="ml-auto">{right}</div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => {
            clickSfx();
            onChange(o.value);
          }}
          className={cn(
            "min-w-0 flex-1 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors",
            value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {hint && <span className="timer-text text-xs text-accent">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <Row label={label} hint={format ? format(value) : String(value)}>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0] ?? value)} className="py-2" />
    </Row>
  );
}

export function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-3">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={(v) => {
          clickSfx();
          onChange(v);
        }}
      />
    </label>
  );
}

export const pct = (v: number) => `${Math.round(v * 100)}%`;
