export const TUNNEL_FIRST = 205;
export const TUNNEL_SPACING = 285;
export const TUNNEL_LENGTH = 54;
export const TUNNEL_APPROACH = 8;
export const TUNNEL_VISUAL_LEAD = 10;

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 0 outside, smoothly darkens the view while the runner is inside a tunnel. */
export function getTunnelBlend(distance: number) {
  const index = Math.floor((distance - TUNNEL_FIRST + TUNNEL_VISUAL_LEAD) / TUNNEL_SPACING);
  let blend = 0;
  for (let i = index - 1; i <= index + 1; i++) {
    const start = TUNNEL_FIRST + i * TUNNEL_SPACING - TUNNEL_VISUAL_LEAD;
    const end = start + TUNNEL_LENGTH + TUNNEL_VISUAL_LEAD;
    const entering = smoothstep(start - 7, start + 3, distance);
    const leaving = 1 - smoothstep(end - 5, end + 8, distance);
    blend = Math.max(blend, entering * leaving);
  }
  return blend;
}
