export const TUNNEL_FIRST = 205;
export const TUNNEL_SPACING = 285;
export const TUNNEL_LENGTH = 54;
export const TUNNEL_APPROACH = 8;
export const TUNNEL_VISUAL_LEAD = 10;

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Darkness envelope shared by lighting and tunnel rendering. */
export function getTunnelBlend(distance: number, entrances: readonly number[] = []) {
  let blend = 0;
  for (const entrance of entrances) {
    const start = entrance - TUNNEL_VISUAL_LEAD;
    const end = start + TUNNEL_LENGTH + TUNNEL_VISUAL_LEAD;
    if (distance < start - 7 || distance > end + 8) continue;
    const entering = smoothstep(start - 7, start + 12, distance);
    const leaving = 1 - smoothstep(end - 5, end + 8, distance);
    blend = Math.max(blend, entering * leaving);
  }
  return blend;
}
