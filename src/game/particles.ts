// Pooled CPU particles (dust, landing bursts, coin sparkles, crash debris).
// Positions are in scene space; z scrolls toward the camera with the world.
export class ParticlePool {
  readonly max: number;
  pos: Float32Array;
  vel: Float32Array;
  col: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  size: Float32Array;
  alpha: Float32Array;
  gravity: Float32Array;
  private cursor = 0;

  constructor(max = 400) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.gravity = new Float32Array(max);
    for (let i = 0; i < max; i++) this.pos[i * 3 + 1] = -999;
  }

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, r: number, g: number, b: number, life: number, size: number, gravity = 9) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx, vy, vz], i * 3);
    this.col.set([r, g, b], i * 3);
    this.life[i] = life;
    this.maxLife[i] = life;
    this.size[i] = size;
    this.gravity[i] = gravity;
  }

  burst(n: number, x: number, y: number, z: number, speed: number, rgb: [number, number, number], life: number, size: number, gravity = 9, up = 1) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const e = Math.random() * up;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.emit(x, y, z, Math.cos(a) * s, e * s + Math.random() * speed * 0.3, Math.sin(a) * s, rgb[0], rgb[1], rgb[2], life * (0.6 + Math.random() * 0.4), size * (0.6 + Math.random() * 0.8), gravity);
    }
  }

  update(dt: number, scroll: number) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const j = i * 3;
      this.vel[j + 1] -= this.gravity[i] * dt;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += (this.vel[j + 2] + scroll) * dt;
      const t = Math.max(0, this.life[i] / this.maxLife[i]);
      this.alpha[i] = t;
      if (this.life[i] <= 0) this.pos[j + 1] = -999;
    }
  }

  clear() {
    this.life.fill(0);
    this.alpha.fill(0);
  }
}
