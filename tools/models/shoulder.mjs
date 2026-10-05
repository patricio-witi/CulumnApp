// Cintura escapular: escápula, clavícula y húmero proximal (coordenadas de reposo del mundo)
import { U, SU, SSUB, SI, smax, sphere, ellipsoid, capsule, limb, chain, roundBox, plate, halfSpace, roughen, add, sub, mul, norm, dot, cross, len, lerp3 } from '../sdf.mjs';
import { Landmarks, mx, frameX } from './common.mjs';

export const ELBOW = [197, 222, -20];
export const WRIST = [204, -18, -12];
export const SH = {
  SA: [73, 549, -63],
  spineRoot: [70, 524, -67],
  IA: [90, 440, -60],
  infraGlen: [146, 500, -36],
  glen: [156, 517, -28],
  notch: [124, 549, -42],
  coracoidBase: [140, 541, -27],
  acromion: [181, 546, -14],
  acromBase: [152, 541, -44],
  humHead: [181, 516, -15],
  stern: [24, 545, 34],
};

function scapula() {
  const L = new Landmarks();
  const SA = SH.SA, IA = SH.IA, G = SH.glen;
  const e1 = norm(sub(IA, SA));
  let n = norm(cross(e1, sub(G, SA)));
  if (n[2] > 0) n = mul(n, -1); // normal hacia posterior
  const e2 = norm(cross(n, e1));
  const B = [e1, e2, n];
  const to2 = (p) => { const d = sub(p, SA); return [dot(d, e1), dot(d, e2)]; };
  const outline = [SA, SH.notch, SH.coracoidBase, add(G, [-6, 6, -4]), SH.infraGlen, lerp3(SH.infraGlen, IA, 0.5), IA, lerp3(IA, SH.spineRoot, 0.5), SH.spineRoot].map(to2);
  const blade = plate(SA, B, outline, 3.2, 1.2);
  // curvatura anterior (cóncava hacia las costillas)
  const medBorder = chain([SA, SH.spineRoot, lerp3(SH.spineRoot, IA, 0.5), IA], [[2.6, 2.6], [3, 3], [2.6, 2.6], [3.5, 3.5]], [0, 0, 1], 2);
  const latBorder = chain([IA, lerp3(IA, SH.infraGlen, 0.5), SH.infraGlen], [[3.5, 3.5], [5, 5], [6, 6]], [0, 0, 1], 3);
  const supBorder = chain([SA, SH.notch, SH.coracoidBase], [[2.5, 2.5], [2, 2], [3.5, 3.5]], [0, 0, 1], 2);
  // espina de la escápula: cresta que sobresale hacia posterior
  const spRoot = SH.spineRoot, spEnd = SH.acromBase;
  const spMidOut = add(lerp3(spRoot, spEnd, 0.55), mul(n, 13));
  const spineRidge = SU(3, limb(spRoot, spEnd, [3, 3], [5, 7], n), chain([add(spRoot, mul(n, 3)), spMidOut, add(spEnd, mul(n, 8))], [[2.5, 3], [3.2, 4], [4, 5]], e1, 3));
  const spineWeb = limb(add(lerp3(spRoot, spEnd, 0.5), mul(n, 1)), spMidOut, [2, 14], [2, 10], e2);
  const acrom = SU(4, limb(spEnd, SH.acromion, [7, 5], [10, 4], [0, 1, 0]), ellipsoid(SH.acromion, [10, 4, 13]));
  const coracoid = chain([SH.coracoidBase, [141, 551, -10], [150, 543, 8]], [[5, 5], [4.5, 4.5], [4, 4]], [0, 1, 0], 3);
  // cavidad glenoidea
  const gn = norm([0.9, 0.05, 0.43]);
  const gB = frameX(gn, [0, 1, 0]);
  let glen = ellipsoid(G, [6, 19, 13], gB);
  glen = SSUB(1, SU(4, glen, limb(add(G, mul(gn, -14)), G, [9, 12], [8, 13])), sphere(SH.humHead, 25));
  let f = SU(2.5, blade, medBorder, latBorder, supBorder);
  f = SU(3, f, spineRidge, spineWeb, acrom);
  f = SU(4, f, glen, coracoid);
  f = SSUB(1.5, f, sphere(add(SH.notch, [0, 5, 0]), 5));
  const cart = SI(0.5, ellipsoid(G, [6.8, 18.6, 12.6], gB), (x, y, z) => -(Math.hypot(x - SH.humHead[0], y - SH.humHead[1], z - SH.humHead[2]) - 25.8));
  L.set('SA', SA); L.set('IA', IA); L.set('spineRoot', SH.spineRoot); L.set('acromion', SH.acromion);
  L.set('spineMid', spMidOut); L.set('spineLat', add(SH.acromBase, mul(n, 8)));
  L.set('glen', G); L.set('coracoid', [150, 543, 8]);
  L.set('medMid', lerp3(SH.spineRoot, IA, 0.5));
  L.set('medUp', lerp3(SA, SH.spineRoot, 0.5));
  L.set('infraGlen', SH.infraGlen);
  L.set('latMid', lerp3(IA, SH.infraGlen, 0.5));
  L.set('supraFossa', add(lerp3(SA, SH.acromBase, 0.5), [0, 10, 3]));
  L.set('infraFossa', add(lerp3(SH.spineRoot, SH.infraGlen, 0.45), [0, -25, -2]));
  return { f, cart, L };
}

function clavicle() {
  const L = new Landmarks();
  const pts = [SH.stern, [58, 551, 43], [100, 556, 32], [135, 553, 6], [160, 549, -10], [174, 547, -16]];
  const radii = [[8, 9], [6, 6.5], [5.5, 5.5], [5, 6.5], [4, 8], [4, 9]];
  let f = chain(pts, radii, [0, 1, 0], 3);
  L.set('medial', SH.stern); L.set('lateral', [174, 547, -16]); L.set('mid', [100, 556, 32]); L.set('lat3', [140, 552, 2]);
  return { f, cart: sphere(SH.stern, 6), L };
}

function humerus() {
  const L = new Landmarks();
  const H = SH.humHead;
  const head = sphere(H, 23);
  const neckC = add(H, [9, -12, -2]);
  const gTub = ellipsoid([195, 508, -10], [8, 13, 11]);
  const lTub = ellipsoid([184, 503, 5], [6, 9, 6]);
  const shaftTop = [188, 488, -10];
  const shaftBot = [195, 262, -20];
  const E = ELBOW;
  const shaft = limb(shaftTop, shaftBot, [12, 12.5], [11, 9.5], [0, 0, 1]);
  const delt = ellipsoid([199, 420, -14], [4, 14, 5]);
  // extremo distal: epicóndilos, tróclea y cóndilo
  const distal = SU(4,
    ellipsoid(add(E, [0, 12, 0]), [26, 14, 11]),
    sphere(add(E, [-28, 14, -2]), 7.5),
    sphere(add(E, [26, 13, 0]), 6.5),
    ellipsoid(add(E, [-8, 0, 0]), [12, 10, 11]),
    sphere(add(E, [12, 1, 2]), 9.5),
  );
  let f = SU(6, head, ellipsoid(neckC, [17, 17, 17]));
  f = SU(4, f, gTub, lTub);
  f = SU(8, f, shaft);
  f = SU(3, f, delt);
  f = SU(7, f, distal);
  f = SSUB(1.2, f, capsule([189, 518, 3], [190, 470, -1], 3.4));
  f = SSUB(2, f, ellipsoid(add(E, [0, 16, -12]), [9, 10, 6])); // fosa olecraneana
  const cart = (x, y, z) => smax(Math.hypot(x - H[0], y - H[1], z - H[2]) - 23.6, -dot(norm([-0.9, 0.25, -0.35]), [x - H[0], y - H[1], z - H[2]]) - 4, 1);
  L.set('head', H); L.set('groove', [190, 492, -2]); L.set('crestGT', [196, 480, -6]); L.set('deltoid', [199, 420, -14]);
  L.set('shaftTop', shaftTop); L.set('shaftBot', [191, 365, -20]); L.set('lesserTub', [184, 500, 5]);
  L.set('elbow', E); L.set('medEpi', add(E, [-28, 14, -2])); L.set('latEpi', add(E, [26, 13, 0]));
  return { f, cart, L };
}
function smaxF(a, b, k) { return (x, y, z) => smax(a(x, y, z), b(x, y, z), k); }

export function buildShoulder(part, side) {
  const r = part === 'scapula' ? scapula() : part === 'clavicle' ? clavicle() : humerus();
  const s = side;
  const f0 = (x, y, z) => Math.min(r.f(x, y, z), r.cart(x, y, z) + 0.2);
  const f = s > 0 ? f0 : (x, y, z) => f0(-x, y, z);
  const cart = s > 0 ? r.cart : (x, y, z) => r.cart(-x, y, z);
  const lm = {};
  for (const [k, p] of Object.entries(r.L.pts)) lm[k] = s > 0 ? p : mx(p);
  const bb = part === 'scapula' ? [[55, 425, -95], [200, 570, 25]] : part === 'clavicle' ? [[10, 530, -30], [190, 570, 55]] : [[150, 196, -45], [232, 545, 20]];
  const bmin = s > 0 ? bb[0] : [-bb[1][0], bb[0][1], bb[0][2]];
  const bmax = s > 0 ? bb[1] : [-bb[0][0], bb[1][1], bb[1][2]];
  return { sdf: roughen(f, 0.1, 0.35), cartilage: cart, landmarks: lm, bmin, bmax };
}
