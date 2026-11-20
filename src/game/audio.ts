// Web Audio mixer: buses (sfx | music | ui) -> master -> limiter. Sounds and
// per-map music are synthesized so the game ships without audio downloads.
import type { MapId } from "./data/maps";

type Wave = OscillatorType;

interface MusicDef {
  bpm: number;
  root: number; // midi
  scale: number[];
  prog: number[]; // chord root degree per bar
  bass: (number | null)[]; // 16 steps, scale degree
  lead: (number | null)[]; // 16 steps
  kick: string;
  snare: string;
  hat: string;
  leadWave: Wave;
  bassWave: Wave;
  leadGain: number;
}

const MAJ = [0, 2, 4, 5, 7, 9, 11];
const MIN = [0, 2, 3, 5, 7, 8, 10];
const PENTA = [0, 2, 4, 7, 9, 12, 14];
const PHRYG = [0, 1, 4, 5, 7, 8, 10];
const DOR = [0, 2, 3, 5, 7, 9, 10];

const _ = null;
const MUSIC: Record<MapId, MusicDef> = {
  city: { bpm: 94, root: 45, scale: DOR, prog: [0, 3, 4, 3], bass: [0, _, 0, _, 4, _, 0, _, 0, _, 6, _, 4, _, 2, _], lead: [7, _, 9, _, 11, _, 9, _, _, 7, _, _, 4, _, _, _], kick: "x...x...x...x...", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.xx", leadWave: "square", bassWave: "sawtooth", leadGain: 0.05 },
  snow: { bpm: 88, root: 52, scale: MAJ, prog: [0, 5, 3, 4], bass: [0, _, _, _, 4, _, _, _, 0, _, _, _, 4, _, _, _], lead: [7, 9, 11, 14, _, 11, 9, _, 7, _, 4, _, 9, _, _, _], kick: "x.......x.......", snare: "........x.......", hat: "..x...x...x...x.", leadWave: "triangle", bassWave: "triangle", leadGain: 0.09 },
  volcano: { bpm: 142, root: 38, scale: PHRYG, prog: [0, 1, 0, 6], bass: [0, 0, _, 0, _, 0, 1, _, 0, 0, _, 0, _, 4, 1, _], lead: [7, _, _, 8, _, _, 7, _, 11, _, 8, _, 7, _, _, _], kick: "x..x..x.x..x..x.", snare: "....x.......x..x", hat: "x.xxx.xxx.xxx.xx", leadWave: "sawtooth", bassWave: "sawtooth", leadGain: 0.035 },
  jungle: { bpm: 108, root: 50, scale: PENTA, prog: [0, 3, 1, 4], bass: [0, _, _, 2, _, _, 4, _, 0, _, _, 2, _, 4, _, _], lead: [9, 7, _, 4, 7, _, 9, _, 12, _, 9, 7, _, 4, _, _], kick: "x.....x...x.....", snare: "...x......x..x..", hat: "x..x..x..x..x.x.", leadWave: "triangle", bassWave: "sine", leadGain: 0.1 },
  race: { bpm: 148, root: 40, scale: MIN, prog: [0, 5, 6, 4], bass: [0, 0, 7, 0, 0, 7, 0, 0, 0, 0, 7, 0, 5, 5, 6, 6], lead: [7, _, 7, _, 9, _, 10, _, 9, _, 7, _, 4, _, 5, _], kick: "x...x...x...x...", snare: "....x.......x...", hat: "xxxxxxxxxxxxxxxx", leadWave: "square", bassWave: "square", leadGain: 0.035 },
  desert: { bpm: 102, root: 47, scale: PHRYG, prog: [0, 1, 0, 1], bass: [0, _, _, 0, _, _, 0, _, 1, _, _, 1, _, _, 0, _], lead: [7, 8, _, 7, 5, _, 4, _, 5, 4, _, 1, 0, _, _, _], kick: "x.....x...x.....", snare: "....x.......x...", hat: "x.xx..x.x.xx..x.", leadWave: "sawtooth", bassWave: "triangle", leadGain: 0.04 },
  future: { bpm: 128, root: 45, scale: MIN, prog: [0, 5, 2, 6], bass: [0, _, 7, _, 0, _, 7, _, 0, _, 7, _, 0, _, 7, _], lead: [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 7, 9, 11, 9, 7], kick: "x...x...x...x...", snare: "....x.......x...", hat: "..x...x...x...x.", leadWave: "sawtooth", bassWave: "sawtooth", leadGain: 0.03 },
};

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private ambientBus!: GainNode;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambienceOn = true;
  private ui!: GainNode;
  private noiseBuf!: AudioBuffer;
  private vol = { master: 0.8, sfx: 0.8, music: 0.5, on: true };
  private seq: { def: MusicDef; step: number; next: number; timer: number } | null = null;
  private pendingMap: MapId | null = null;

  /** Must be called from a user gesture at least once. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.2;
      limiter.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.connect(limiter);
      this.sfx = ctx.createGain();
      this.music = ctx.createGain();
      this.ambientBus = ctx.createGain();
      this.ui = ctx.createGain();
      this.sfx.connect(this.master);
      this.music.connect(this.master);
      this.ambientBus.connect(this.master);
      this.ui.connect(this.master);
      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyGains();
      if (this.pendingMap) this.startMusic(this.pendingMap);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setAmbience(enabled: boolean, map: MapId) {
    this.ambienceOn = enabled;
    this.pendingMap = map;
    if (!this.ctx) return;
    if (enabled) this.startAmbience(map);
    else this.stopAmbience();
  }

  private startAmbience(map: MapId) {
    this.stopAmbience();
    if (!this.ctx || !this.ambienceOn || !this.vol.on) return;
    const profiles: Record<MapId, { type: BiquadFilterType; frequency: number; gain: number }> = {
      city: { type: "highpass", frequency: 1500, gain: 0.075 },
      snow: { type: "lowpass", frequency: 420, gain: 0.095 },
      volcano: { type: "lowpass", frequency: 680, gain: 0.065 },
      jungle: { type: "bandpass", frequency: 1250, gain: 0.045 },
      race: { type: "bandpass", frequency: 520, gain: 0.035 },
      desert: { type: "lowpass", frequency: 850, gain: 0.055 },
      future: { type: "bandpass", frequency: 2600, gain: 0.035 },
    };
    const profile = profiles[map];
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = this.noiseBuf;
    source.loop = true;
    filter.type = profile.type;
    filter.frequency.value = profile.frequency;
    filter.Q.value = map === "jungle" || map === "future" ? 0.8 : 0.35;
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.setTargetAtTime(profile.gain, this.ctx.currentTime, 0.8);
    source.connect(filter).connect(gain).connect(this.ambientBus);
    source.start();
    this.ambientSource = source;
    this.ambientFilter = filter;
    this.ambientGain = gain;
  }

  private stopAmbience() {
    if (this.ambientSource) {
      try { this.ambientSource.stop(); } catch { /* already stopped */ }
      this.ambientSource.disconnect();
    }
    this.ambientFilter?.disconnect();
    this.ambientGain?.disconnect();
    this.ambientSource = null;
    this.ambientFilter = null;
    this.ambientGain = null;
  }

  setVolumes(v: { master: number; sfx: number; music: number; on: boolean })
    this.vol = v;
    this.applyGains();
  }

  private applyGains() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.on ? this.vol.master : 0, t, 0.03);
    this.sfx.gain.setTargetAtTime(this.vol.sfx, t, 0.03);
    this.ui.gain.setTargetAtTime(this.vol.sfx, t, 0.03);
    this.music.gain.setTargetAtTime(this.vol.music * 0.7, t, 0.03);
  }

  private ready() {
    return this.ctx && this.ctx.state === "running" && this.vol.on;
  }

  private tone(freq: number, dur: number, wave: Wave, bus: GainNode, gain: number, to?: number, delay = 0, when?: number) {
    const ctx = this.ctx!;
    const t = (when ?? ctx.currentTime) + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, bus: GainNode, gain: number, freq: number, type: BiquadFilterType, to?: number, when?: number) {
    const ctx = this.ctx!;
    const t = when ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  click() {
    if (!this.ready()) return;
    this.tone(2400, 0.025, "square", this.ui, 0.12, 1400);
    this.noise(0.018, this.ui, 0.25, 5000, "highpass");
  }
  jump() {
    if (!this.ready()) return;
    this.tone(300, 0.18, "triangle", this.sfx, 0.25, 780);
    this.noise(0.15, this.sfx, 0.08, 1200, "bandpass", 3000);
  }
  land(impact: number) {
    if (!this.ready()) return;
    const k = Math.min(1, impact / 20);
    this.noise(0.09, this.sfx, 0.15 + 0.25 * k, 500, "lowpass");
    this.tone(110, 0.08, "sine", this.sfx, 0.25 * k + 0.05, 55);
  }
  slide() {
    if (!this.ready()) return;
    this.noise(0.35, this.sfx, 0.18, 2400, "bandpass", 500);
  }
  lane() {
    if (!this.ready()) return;
    this.noise(0.13, this.sfx, 0.12, 1500, "bandpass", 4000);
  }
  bump() {
    if (!this.ready()) return;
    this.tone(160, 0.14, "square", this.sfx, 0.18, 70);
    this.noise(0.1, this.sfx, 0.2, 800, "lowpass");
  }
  coin() {
    if (!this.ready()) return;
    this.tone(988, 0.09, "square", this.sfx, 0.18);
    this.tone(1319, 0.35, "square", this.sfx, 0.18, undefined, 0.08);
    this.tone(220, 0.6, "sawtooth", this.sfx, 0.2, 90, 0.25);
  }
  crash() {
    if (!this.ready()) return;
    this.noise(0.55, this.sfx, 0.6, 1400, "lowpass", 100);
    this.tone(120, 0.45, "sawtooth", this.sfx, 0.25, 40);
  }
  fall() {
    if (!this.ready()) return;
    this.tone(800, 1.0, "sine", this.sfx, 0.22, 80);
  }
  gameover() {
    if (!this.ready()) return;
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, "triangle", this.ui, 0.15, undefined, i * 0.16));
  }
  record() {
    if (!this.ready()) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, "square", this.ui, 0.1, undefined, i * 0.1));
  }

  startMusic(map: MapId) {
    this.pendingMap = map;
    if (!this.ctx) return;
    this.stopMusic();
    const def = MUSIC[map];
    this.startAmbience(map);
    this.seq = { def, step: 0, next: this.ctx.currentTime + 0.1, timer: 0 };
    const tick = () => {
      const s = this.seq;
      if (!s || !this.ctx) return;
      const stepDur = 60 / s.def.bpm / 4;
      while (s.next < this.ctx.currentTime + 0.15) {
        this.playStep(s.def, s.step, s.next, stepDur);
        s.step++;
        s.next += stepDur;
      }
    };
    this.seq.timer = window.setInterval(tick, 30);
  }

  stopMusic() {
    if (this.seq) window.clearInterval(this.seq.timer);
    this.seq = null;
    this.stopAmbience();
  }

  private playStep(d: MusicDef, step: number, t: number, stepDur: number) {
    if (!this.vol.on || this.vol.music <= 0) return;
    const i = step % 16;
    const bar = Math.floor(step / 16) % d.prog.length;
    const chord = d.prog[bar] ?? 0;
    const note = (deg: number, oct: number) => {
      const idx = deg + chord;
      const s = d.scale;
      const o = Math.floor(idx / s.length);
      const n = s[((idx % s.length) + s.length) % s.length] ?? 0;
      return midi(d.root + n + 12 * (o + oct));
    };
    if (d.kick[i] === "x") this.tone(150, 0.18, "sine", this.music, 0.5, 45, 0, t);
    if (d.snare[i] === "x") this.noise(0.12, this.music, 0.22, 1800, "bandpass", undefined, t);
    if (d.hat[i] === "x") this.noise(0.03, this.music, 0.07, 8000, "highpass", undefined, t);
    const b = d.bass[i];
    if (b !== null && b !== undefined) this.tone(note(b, 0), stepDur * 1.6, d.bassWave, this.music, 0.09, undefined, 0, t);
    const l = d.lead[i];
    if (l !== null && l !== undefined && Math.floor(step / 64) % 2 === 1) this.tone(note(l, 1), stepDur * 1.8, d.leadWave, this.music, d.leadGain, undefined, 0, t);
  }
}

export const audio = new AudioEngine();
