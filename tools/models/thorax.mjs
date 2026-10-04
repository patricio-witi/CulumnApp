// Costillas (en el marco de su vértebra torácica) y esternón (coordenadas de reposo del mundo)
import { SU, U, SSUB, sphere, ellipsoid, chain, limb, roundBox, capsule, roughen, add, sub, mul, norm, lerp3, clamp } from '../sdf.mjs';
import { Landmarks, frameY, mx } from './common.mjs';
import { buildTypical } from './vertebra.mjs';
import { computeRestPose, frameToWorld, worldToFrame } from '../../src/anatomy/spine-data.js';

const REST = computeRestPose();

const A = [56, 76, 91, 101, 109, 115, 119, 121, 121, 118, 108, 90]; // semieje lateral del tórax a la altura de cada costilla
const ZANT = [64, 86, 101, 112, 120, 125, 127, 124, 117, 106, 64, 30];
const DROP = [30, 46, 60, 70, 78, 84, 88, 88, 84, 74, 46, 24];
const XEND = [27, 30, 32, 35, 39, 43, 48, 62, 74, 86, 0, 0];

const ss = (t) => t * t * (3 - 2 * t);

export function ribPath(k) {
  const v = buildTypical('T' + k);
  const lm = v.landmarks;
  const cs = lm.costalBodyL;
  const ct = lm.costalTpL;
  const head = add(cs, [4.4, 0, 0]);
  const tub = add(ct, [0.5, -0.5, 4.2]);
  const a = A[k - 1];
  const zPost = tub[2] - 9;
  const zAnt = ZANT[k - 1];
  const zc = (zAnt + zPost) / 2, b = (zAnt - zPost) / 2;
  const phi0 = Math.asin(clamp((tub[0] + 11) / a, 0, 0.98));
  let phi1;
  if (k <= 10) phi1 = Math.PI - Math.asin(clamp(XEND[k - 1] / a, 0, 0.98));
  else phi1 = k === 11 ? 0.66 * Math.PI : 0.46 * Math.PI;
  const pts = [head, lerp3(head, tub, 0.5), tub];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const phi = phi0 + (phi1 - phi0) * t;
    const tt = (phi - phi0) / (Math.PI - phi0);
    const y = tub[1] - 1.5 - DROP[k - 1] * Math.pow(ss(clamp(tt, 0, 1)), 1.15);
    pts.push([a * Math.sin(phi), y, zc - b * Math.cos(phi)]);
  }
  return { pts, head, tub, lm };
}

export function buildRibs(k, side) {
  const { pts, head, tub } = ribPath(k);
  // radios: [grosor, altura]
  const radii = pts.map((p, i) => {
    if (k === 1) return i < 3 ? [3.6, 3.6] : [6.5, 2.6];
    if (i === 0) return [4.2, 4.6];
    if (i < 3) return [3.4, 4.2];
    const t = (i - 3) / (pts.length - 4);
    const h = (k >= 11 ? 4.8 : 6.6) * (1 - 0.25 * t) + 0.5;
    return [2.6 + 0.4 * (1 - t), h];
  });
  const up = k === 1 ? [0, 0.3, 1] : [0, 1, 0];
  let f = SU(2, chain(pts, radii, up, 1.5), sphere(head, 4.6), ellipsoid(add(tub, [1.5, -0.5, -1.5]), [4, 4.5, 3.8]));
  f = roughen(f, 0.08, 0.4);
  const L = new Landmarks();
  const sideF = side > 0 ? (x, y, z) => f(x, y, z) : (x, y, z) => f(-x, y, z);
  const S = (p) => (side > 0 ? p : mx(p));
  L.set('head', S(head));
  L.set('tubercle', S(tub));
  const n = pts.length;
  L.set('angle', S(pts[4]));
  L.set('post', S(pts[5]));
  L.set('postLat', S(pts[7]));
  L.set('lat', S(pts[Math.round(n * 0.6)]));
  L.set('antLat', S(pts[n - 4]));
  L.set('end', S(pts[n - 1]));
  L.set('endPrev', S(pts[n - 2]));
  L.set('mid12', S(pts[Math.round(n * 0.45)]));
  let bmin = [Infinity, Infinity, Infinity], bmax = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let i = 0; i < 3; i++) { const v = i === 0 && side < 0 ? -p[i] : p[i]; bmin[i] = Math.min(bmin[i], v); bmax[i] = Math.max(bmax[i], v); }
  bmin = bmin.map((v) => v - 9); bmax = bmax.map((v) => v + 9);
  return { sdf: sideF, landmarks: L.pts, bmin, bmax, meta: { k } };
}

// extremo anterior de la costilla k en el mundo (pose de reposo)
export function ribEndWorld(k, side = 1) {
  const { pts } = ribPath(k);
  let p = pts[pts.length - 1];
  if (side < 0) p = mx(p);
  return frameToWorld(REST.frames['T' + k], p);
}

export function sternumGeom() {
  const ends = [];
  for (let k = 1; k <= 7; k++) ends.push(ribEndWorld(k, 1));
  const rise = [2, 0, 2, 5, 9, 15, 22];
  const attach = ends.map((e, i) => [i === 0 ? 22 : 15.5, e[1] + rise[i], e[2] + 8 + i * 0.6]);
  const notch = [0, attach[0][1] + 16, attach[0][2] - 4];
  const angle = [0, (attach[0][1] + attach[1][1]) / 2 - 4, (attach[0][2] + attach[1][2]) / 2 + 1];
  const bodyEnd = [0, attach[6][1] - 6, attach[6][2] + 2];
  const xiph = [0, bodyEnd[1] - 36, bodyEnd[2] - 5];
  return { attach, notch, angle, bodyEnd, xiph };
}

export function buildSternum() {
  const g = sternumGeom();
  const L = new Landmarks();
  const mid = (i) => [0, g.attach[i][1], g.attach[i][2] + 0];
  const segs = [];
  // manubrio
  const manC = lerp3(g.notch, g.angle, 0.5);
  const manB = frameY(sub(g.notch, g.angle), [0, 0, 1]);
  segs.push(roundBox(manC, [25, Math.abs(g.notch[1] - g.angle[1]) / 2 + 2, 5.5], manB, 4));
  // cuerpo
  const bodyPts = [g.angle, mid(2), mid(3), mid(4), mid(5), g.bodyEnd];
  const bodyW = [15, 14.5, 15.5, 16, 15, 12];
  for (let i = 0; i < bodyPts.length - 1; i++) {
    const c = lerp3(bodyPts[i], bodyPts[i + 1], 0.5);
    const Bk = frameY(sub(bodyPts[i], bodyPts[i + 1]), [0, 0, 1]);
    segs.push(roundBox(c, [(bodyW[i] + bodyW[i + 1]) / 2, Math.abs(bodyPts[i][1] - bodyPts[i + 1][1]) / 2 + 2, 4.6], Bk, 3.5));
  }
  // xifoides
  segs.push(limb(g.bodyEnd, g.xiph, [8, 3], [3.5, 2.2], [0, 0, 1]));
  let f = SU(3.5, ...segs);
  // escotadura yugular y escotaduras claviculares
  f = SSUB(3, f, sphere(add(g.notch, [0, 6, 0]), 9));
  f = SSUB(1.5, f, U(sphere(add(g.notch, [19, 0, 0]), 6), sphere(add(g.notch, [-19, 0, 0]), 6)));
  f = roughen(f, 0.08, 0.4);
  L.set('notch', g.notch);
  L.set('angle', g.angle);
  L.set('xiphoid', g.xiph);
  L.set('bodyEnd', g.bodyEnd);
  L.set('front', [0, g.angle[1] - 30, g.angle[2] + 6]);
  g.attach.forEach((a, i) => { L.set('costal' + (i + 1) + 'L', a); L.set('costal' + (i + 1) + 'R', mx(a)); });
  L.set('clavL', add(g.notch, [19, 0, 0]));
  L.set('clavR', add(g.notch, [-19, 0, 0]));
  const ys = [g.notch[1], g.xiph[1]];
  return { sdf: f, landmarks: L.pts, bmin: [-40, Math.min(...ys) - 12, Math.min(g.notch[2], g.xiph[2]) - 20], bmax: [40, Math.max(...ys) + 12, Math.max(...g.attach.map((a) => a[2])) + 20] };
}
