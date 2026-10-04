import { norm, cross, dot, sub, add, mul, len } from '../sdf.mjs';

// Base ortonormal [ex, ey, ez] con ez = dirección principal y ey lo más parecido a upHint
export function frameZ(dir, upHint = [0, 1, 0]) {
  const ez = norm(dir);
  let ex = cross(upHint, ez);
  if (len(ex) < 1e-6) ex = cross([1, 0, 0], ez);
  ex = norm(ex);
  const ey = norm(cross(ez, ex));
  return [ex, ey, ez];
}
// Base con ex = dirección principal
export function frameX(dir, upHint = [0, 1, 0]) {
  const ex = norm(dir);
  let ez = cross(ex, upHint);
  if (len(ez) < 1e-6) ez = cross(ex, [0, 0, 1]);
  ez = norm(ez);
  const ey = norm(cross(ez, ex));
  return [ex, ey, ez];
}
// Base con ey = dirección principal
export function frameY(dir, fwdHint = [0, 0, 1]) {
  const ey = norm(dir);
  let ex = cross(ey, fwdHint);
  if (len(ex) < 1e-6) ex = cross(ey, [1, 0, 0]);
  ex = norm(ex);
  const ez = norm(cross(ex, ey));
  return [ex, ey, ez];
}

export const mx = (p) => [-p[0], p[1], p[2]];

// Registro de puntos de referencia (landmarks) con versión izquierda/derecha
export class Landmarks {
  constructor() { this.pts = {}; }
  set(name, p) { this.pts[name] = p.map((v) => Math.round(v * 100) / 100); return p; }
  // define para el lado izquierdo (x>0) y genera el derecho por simetría
  setLR(name, p) {
    this.set(name + 'L', p);
    this.set(name + 'R', mx(p));
    return p;
  }
}

export { norm, cross, dot, sub, add, mul, len };
