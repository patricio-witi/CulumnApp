// Antebrazo, mano, tibia/peroné y pie (coordenadas de reposo del mundo, lado izquierdo x>0)
import { U, SU, SSUB, smax, sphere, ellipsoid, capsule, limb, chain, roundBox, roughen, add, sub, mul, norm, lerp3 } from '../sdf.mjs';
import { Landmarks, mx, frameY } from './common.mjs';
import { ELBOW, WRIST } from './shoulder.mjs';

export const KNEE = [96, -446, -2];
export const ANKLE = [90, -862, 0];

function forearm() {
  const L = new Landmarks();
  const E = ELBOW, W = WRIST;
  // cúbito: olécranon detrás del codo, cabeza distal medial
  const ulna = SU(4,
    ellipsoid(add(E, [-6, 6, -16]), [9, 14, 9]),
    chain([add(E, [-6, -4, -10]), add(E, [-2, -60, -10]), add(W, [-12, 8, -8])], [[7, 8], [6, 6.5], [5, 5]], [0, 0, 1], 3),
    sphere(add(W, [-12, 2, -8]), 6.5),
  );
  // radio: cabeza bajo el cóndilo, extremo distal ancho
  const radius = SU(4,
    ellipsoid(add(E, [12, -16, 2]), [9, 6, 9]),
    chain([add(E, [12, -20, 2]), add(E, [12, -110, 0]), add(W, [8, 10, 0])], [[5, 5], [6, 6], [10, 7]], [0, 0, 1], 3),
    ellipsoid(add(W, [6, 2, 0]), [13, 8, 11]),
  );
  const f = SU(2, ulna, radius);
  L.set('elbow', E); L.set('wrist', W); L.set('olecranon', add(E, [-6, 10, -24])); L.set('mid', lerp3(E, W, 0.4));
  return { f, L, bb: [[160, -45, -50], [235, 245, 25]] };
}

function hand() {
  const L = new Landmarks();
  const W = WRIST;
  const carpus = ellipsoid(add(W, [0, -22, 0]), [11, 13, 20]);
  const parts = [carpus];
  // metacarpianos y dedos en el plano sagital (palma mirando hacia medial)
  for (let k = 0; k < 4; k++) {
    const z = -22 + k * 14;
    const base = add(W, [0, -34, z * 0.8]);
    const head = add(W, [0, -98, z]);
    const tip = add(W, [-3, -150 + Math.abs(k - 1.5) * 9, z + 2]);
    parts.push(limb(base, head, [5, 5], [4.6, 4.6]));
    parts.push(chain([head, lerp3(head, tip, 0.45), tip], [[4.2, 4.2], [3.7, 3.7], [3.2, 3.2]], [0, 0, 1], 1));
  }
  const thumbBase = add(W, [-4, -30, 22]);
  parts.push(chain([thumbBase, add(W, [-10, -62, 40]), add(W, [-14, -88, 50])], [[5.5, 5.5], [4.5, 4.5], [3.8, 3.8]], [0, 0, 1], 2));
  const f = SU(3, ...parts);
  L.set('palm', add(W, [-8, -70, 0])); L.set('wrist', W);
  return { f, L, bb: [[175, -185, -50], [225, 5, 70]] };
}

function tibia() {
  const L = new Landmarks();
  const K = KNEE, A = ANKLE;
  const plateau = SU(6,
    ellipsoid(add(K, [-18, -24, -4]), [18, 14, 24]),
    ellipsoid(add(K, [17, -24, -6]), [17, 13, 22]),
    ellipsoid(add(K, [0, -40, 0]), [30, 22, 26]),
  );
  const tuber = ellipsoid(add(K, [0, -60, 24]), [9, 14, 7]);
  const shaft = chain([add(K, [-1, -58, 2]), add(K, [-3, -200, 6]), add(A, [1, 40, 4])], [[16, 15], [12.5, 13], [13, 12]], [0, 0, 1], 5);
  const crest = chain([add(K, [-1, -80, 14]), add(K, [-3, -250, 14]), add(A, [2, 80, 10])], [[3, 3], [2.6, 2.6], [2, 2]], [0, 1, 0], 3);
  const distal = SU(4, ellipsoid(add(A, [0, 22, 2]), [22, 16, 20]), capsule(add(A, [-18, 18, 2]), add(A, [-20, -4, 2]), 7));
  let tib = SU(7, plateau, tuber);
  tib = SU(8, tib, shaft);
  tib = SU(2, tib, crest);
  tib = SU(6, tib, distal);
  tib = SSUB(2, tib, ellipsoid(add(K, [0, -10, -2]), [36, 10, 30])); // superficie articular algo cóncava
  const fib = SU(3,
    sphere(add(K, [30, -50, -16]), 9),
    chain([add(K, [30, -55, -16]), add(K, [27, -200, -14]), add(A, [24, 30, -8])], [[6, 6], [5.5, 6], [5.5, 5.5]], [0, 0, 1], 2),
    ellipsoid(add(A, [25, 0, -9]), [7, 16, 9]),
  );
  const f = U(tib, fib);
  const cart = U(ellipsoid(add(K, [-18, -12, -4]), [15, 2, 20]), ellipsoid(add(K, [17, -12, -6]), [14, 2, 18]));
  L.set('knee', K); L.set('ankle', A);
  L.set('medCond', add(K, [-24, -30, -14])); L.set('latCond', add(K, [24, -30, -14]));
  L.set('fibHead', add(K, [30, -50, -22])); L.set('tuberosity', add(K, [0, -62, 30]));
  L.set('shin', lerp3(K, A, 0.5)); L.set('medMall', add(A, [-20, -4, 2])); L.set('latMall', add(A, [25, -6, -9]));
  L.set('calf', add(lerp3(K, A, 0.3), [0, 0, -40]));
  return { f, cart, L, bb: [[40, -895, -45], [140, -415, 45]] };
}

function foot() {
  const L = new Landmarks();
  const A = ANKLE;
  const talus = ellipsoid(add(A, [0, -12, 4]), [15, 11, 20]);
  const calc = SU(6, ellipsoid(add(A, [2, -34, -24]), [14, 16, 26]), sphere(add(A, [2, -40, -48]), 13));
  const mid = SU(4, ellipsoid(add(A, [-6, -26, 34]), [16, 12, 16]), ellipsoid(add(A, [10, -36, 30]), [12, 10, 18]));
  const parts = [talus, calc, mid];
  for (let k = 0; k < 5; k++) {
    const x = -14 + k * 8;
    const base = add(A, [x * 0.8, -34 - k * 1.5, 46]);
    const head = add(A, [x * 1.15, -56, 118 - k * 7]);
    const tip = add(A, [x * 1.2, -60, 150 - k * 12]);
    parts.push(limb(base, head, [4.5 - k * 0.3, 4.5], [5 - k * 0.4, 5]));
    parts.push(chain([head, tip], [[4.5 - k * 0.4, 4], [3.6 - k * 0.3, 3.2]], [0, 1, 0], 1));
  }
  const f = SU(4, ...parts);
  L.set('heel', add(A, [2, -50, -60])); L.set('toe', add(A, [-12, -62, 158])); L.set('ball', add(A, [0, -60, 110])); L.set('dorsum', add(A, [-2, -18, 70]));
  return { f, L, bb: [[40, -935, -80], [135, -840, 185]] };
}

export function buildLimb(part, side) {
  const r = { forearm, hand, tibia, foot }[part]();
  const s = side;
  const cart0 = r.cart || (() => 1e9);
  const f0 = (x, y, z) => Math.min(r.f(x, y, z), cart0(x, y, z) + 0.2);
  const f = s > 0 ? f0 : (x, y, z) => f0(-x, y, z);
  const cart = s > 0 ? cart0 : (x, y, z) => cart0(-x, y, z);
  const lm = {};
  for (const [k, p] of Object.entries(r.L.pts)) lm[k] = s > 0 ? p : mx(p);
  const bmin = s > 0 ? r.bb[0] : [-r.bb[1][0], r.bb[0][1], r.bb[0][2]];
  const bmax = s > 0 ? r.bb[1] : [-r.bb[0][0], r.bb[1][1], r.bb[1][2]];
  return { sdf: roughen(f, 0.12, 0.3), cartilage: r.cart ? cart : null, landmarks: lm, bmin, bmax };
}
