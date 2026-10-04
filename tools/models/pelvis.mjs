// Coxales (ilion, isquion, pubis) y fémures en coordenadas del mundo (origen = centro del eje de caderas)
import {
  U, SU, SSUB, SI, smin, smax, sphere, ellipsoid, capsule, limb, chain, roundBox, cylinder, ellCylinder, halfSpace,
  polygon2D, roughen, add, sub, mul, norm, dot, cross, len, lerp3, clamp,
} from '../sdf.mjs';
import { Landmarks, frameY, frameZ, mx } from './common.mjs';
import { PELVIS } from '../../src/anatomy/spine-data.js';

const HX = PELVIS.hipHalfWidth;

// Ajuste algebraico de esfera por mínimos cuadrados
function fitSphere(pts) {
  // x²+y²+z² = 2ax + 2by + 2cz + d
  const M = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], R = [0, 0, 0, 0];
  for (const p of pts) {
    const row = [2 * p[0], 2 * p[1], 2 * p[2], 1];
    const rhs = p[0] * p[0] + p[1] * p[1] + p[2] * p[2];
    for (let i = 0; i < 4; i++) { R[i] += row[i] * rhs; for (let j = 0; j < 4; j++) M[i][j] += row[i] * row[j]; }
  }
  // Gauss
  for (let i = 0; i < 4; i++) {
    let mxr = i;
    for (let r = i + 1; r < 4; r++) if (Math.abs(M[r][i]) > Math.abs(M[mxr][i])) mxr = r;
    [M[i], M[mxr]] = [M[mxr], M[i]]; [R[i], R[mxr]] = [R[mxr], R[i]];
    for (let r = i + 1; r < 4; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c < 4; c++) M[r][c] -= f * M[i][c]; R[r] -= f * R[i]; }
  }
  const x = [0, 0, 0, 0];
  for (let i = 3; i >= 0; i--) { let s = R[i]; for (let c = i + 1; c < 4; c++) s -= M[i][c] * x[c]; x[i] = s / M[i][i]; }
  const c = [x[0], x[1], x[2]];
  return { c, r: Math.sqrt(x[3] + dot(c, c)) };
}

// Puntos de referencia del coxal izquierdo (x>0)
export const PEL = {
  ASIS: [115, 80, 52],
  AIIS: [106, 48, 44],
  tubercle: [135, 127, 26],
  crestTop: [131, 155, -15],
  crestPost1: [118, 157, -35],
  crestPost2: [80, 135, -70],
  crestPost3: [61, 118, -80],
  PSIS: [44, 100, -84],
  PIIS: [52, 82, -76],
  notch: [64, 48, -56],
  acetPost: [86, 20, -22],
  acetSup: [96, 30, 12],
  ischialSpine: [47, 6, -44],
  ischialTub: [60, -58, -31],
  pubicTub: [22, -20, 61],
  symphysis: [3, -30, 56],
  obturator: [50, -38, 24],
  hip: [HX, 0, 0],
  auricular: [58, 98, -50],
};

// Ala ilíaca: abanico de "hebras" óseas aplanadas entre la línea basal (sobre el acetábulo)
// y la cresta ilíaca, con un ligero abombamiento lateral (cara glútea convexa / fosa ilíaca cóncava).
export const CREST = [
  [115, 80, 52], [126, 104, 43], [135, 127, 26], [137, 144, 6], [131, 155, -15],
  [118, 157, -35], [100, 150, -55], [80, 135, -70], [61, 118, -80], [44, 100, -84],
];
const BASE = [
  [106, 48, 44], [108, 44, 30], [107, 40, 14], [102, 39, -4], [93, 42, -22],
  [82, 50, -38], [70, 66, -56], [60, 82, -68], [52, 92, -77], [46, 97, -82],
];
function wing() {
  const strands = [];
  const n = CREST.length;
  // subdividir para un abanico más denso
  const S = 26;
  const sample = (arr, u) => {
    const x = u * (arr.length - 1);
    const i = Math.min(Math.floor(x), arr.length - 2);
    return lerp3(arr[i], arr[i + 1], x - i);
  };
  for (let k = 0; k <= S; k++) {
    const u = k / S;
    const c = sample(CREST, u), b = sample(BASE, u);
    const c2 = sample(CREST, Math.min(1, u + 0.02)), c1 = sample(CREST, Math.max(0, u - 0.02));
    const tang = norm(sub(c2, c1));
    const along = sub(c, b);
    let nrm = norm(cross(tang, along));
    if (dot(nrm, [1, 0, -0.2]) < 0) nrm = mul(nrm, -1);
    const L = len(along);
    const bow = 9 * Math.sin(Math.PI * u) + 3;
    const mid = add(lerp3(b, c, 0.5), mul(nrm, bow));
    const q1 = add(lerp3(b, c, 0.25), mul(nrm, bow * 0.7));
    const q3 = add(lerp3(b, c, 0.78), mul(nrm, bow * 0.55));
    const wide = 7;
    // grosor: fino en el centro de la fosa, más grueso cerca de la base y del borde posterior
    const post = Math.max(0, (u - 0.7) / 0.3);
    const tBase = 6 + 4 * post, tMid = 1.5 + 5 * post, tTop = 2.6 + 2 * post;
    strands.push(chain([b, q1, mid, q3, c], [[wide, tBase], [wide, tBase * 0.6 + tMid * 0.4], [wide, tMid], [wide, (tMid + tTop) / 2], [wide * 0.8, tTop]], nrm, 2));
  }
  return { f: SU(3, ...strands) };
}

export function buildPelvis() {
  const L = new Landmarks();
  const w = wing();
  const crestPts = CREST;
  const crestR = [[4.5, 5.5], [4.8, 5.5], [6.5, 6.5], [6, 6.5], [5.6, 6], [5.4, 6], [5.6, 6], [6, 6.5], [6.5, 7], [7, 7.5]];
  const crest = chain(crestPts, crestR, [0, 1, 0], 3);
  // tuberosidad ilíaca y superficie auricular
  const tuber = ellipsoid([61, 100, -60], [9, 22, 17], frameY(norm([0.1, 1, 0.55]), [1, 0, 0]));
  // acetábulo
  const H = PEL.hip;
  const nAc = norm([0.72, -0.5, 0.45]);
  const cupOuter = sphere(H, 33);
  const cupInner = sphere(H, 25.5);
  let cup = SSUB(1.5, cupOuter, cupInner);
  cup = SI(2, cup, halfSpace(add(H, mul(nAc, 6)), nAc));
  const iliumBody = ellipsoid(add(H, [-4, 30, -12]), [17, 26, 22]);
  // isquion
  const ischBody = limb(add(H, [-12, -18, -22]), PEL.ischialTub, [12, 13], [11, 12], [0, 0, 1]);
  const ischTub = ellipsoid(PEL.ischialTub, [11, 18, 13], frameY(norm([0.2, 1, -0.3]), [0, 0, 1]));
  const spine = limb([62, 10, -40], PEL.ischialSpine, [5, 5], [2, 2]);
  const ischRamus = limb([56, -66, -16], [22, -60, 36], [6.5, 8], [5.5, 7], [0, 1, 0]);
  const infPubic = limb([22, -60, 36], [8, -44, 52], [5.5, 7], [6, 8], [0, 1, 0]);
  const supPubic = limb(add(H, [-20, -10, 23]), [18, -18, 56], [8.5, 9.5], [7.5, 8], [0, 1, 0]);
  const pubBody = roundBox([10, -30, 56], [7.5, 16, 9], null, 5);
  const pubTub = sphere(PEL.pubicTub, 4.5);
  // cresta pectínea / línea arcuata (borde de la pelvis menor)
  const arcPts = [[60, 92, -40], [64, 62, -18], [68, 34, 4], [52, 8, 36], [24, -15, 54]];
  const arcuate = chain(arcPts, [[4, 4], [3.6, 3.6], [3.8, 3.8], [3.6, 3.6], [3.2, 3.2]], [0, 1, 0], 2);
  // lámina cuadrilátera (pared medial del acetábulo) y borde de la escotadura ciática mayor
  const quad = SU(3,
    chain([[61, 90, -42], [56, 50, -48], [49, 10, -44]], [[9, 3.5], [9, 3], [7, 3.5]], [1, 0, 0], 2),
    chain([[65, 62, -20], [61, 30, -27], [57, 4, -30]], [[10, 3], [10, 2.6], [9, 3.5]], [1, 0, 0], 2),
    chain([[68, 34, 4], [64, 12, -5], [60, -10, -14]], [[10, 3.2], [10, 3], [9, 4]], [1, 0, 0], 2),
  );
  // bloque auricular (articulación sacroilíaca) frente a la tuberosidad ilíaca
  const auricBlock = ellipsoid([67, 93, -44], [8.5, 27, 19], frameY(norm([0.05, 1, 0.5]), [1, 0, 0]));
  let f = SU(6, w.f, crest);
  f = SU(8, f, tuber);
  f = SU(9, f, iliumBody);
  f = SU(5, f, cup);
  f = SU(7, f, ischBody, ischTub);
  f = SU(4, f, spine, ischRamus, infPubic);
  f = SU(6, f, supPubic, pubBody, pubTub);
  f = SU(3, f, arcuate);
  f = SU(5, f, quad);
  f = SU(7, f, auricBlock);
  // espinas ilíacas anteriores
  f = SU(4, f, ellipsoid(PEL.ASIS, [6, 8, 7]), ellipsoid(PEL.AIIS, [6, 7, 6]));
  // agujero obturador
  f = SSUB(3, f, ellipsoid(PEL.obturator, [30, 18, 15], frameY(norm([0, 1, 0.25]), [1, 0, 0])));
  // fosa del acetábulo (vaciar el fondo)
  f = SSUB(1, f, sphere(add(H, mul(nAc, -6)), 15));
  // simetría bilateral
  const left = f;
  const pelvisSdf = (x, y, z) => left(Math.abs(x), y, z);
  // cartílagos: fibrocartílago de la sínfisis y superficie semilunar del acetábulo
  const symph = roundBox([0, -30, 56], [2.6, 15, 8.5], null, 2);
  const lunate = (x, y, z) => {
    const ax = Math.abs(x);
    return smax(Math.abs(Math.hypot(ax - H[0], y - H[1], z - H[2]) - 26.2) - 0.9, (ax - H[0]) * nAc[0] + (y - H[1]) * nAc[1] + (z - H[2]) * nAc[2] - 4, 1);
  };
  const aurE = ellipsoid([58.8, 93, -44], [2.2, 25, 17], frameY(norm([0.05, 1, 0.5]), [1, 0, 0]));
  const auricular = (x, y, z) => aurE(Math.abs(x), y, z);
  const cart = (x, y, z) => Math.min(symph(x, y, z), lunate(x, y, z), auricular(x, y, z));
  const total = (x, y, z) => Math.min(pelvisSdf(x, y, z), symph(x, y, z));
  const sdf = roughen(total, 0.2, 0.18);

  for (const [k, p] of Object.entries(PEL)) L.setLR(k, p);
  CREST.forEach((p, i) => L.setLR('crest' + i, p));
  L.setLR('iliacFossa', [88, 105, 30]);
  L.setLR('iliacFossaLow', [78, 60, 20]);
  L.setLR('iliacFossaPost', [72, 110, -10]);
  L.setLR('glutealPost', [70, 95, -78]);
  L.setLR('glutealMid', [118, 95, -30]);
  L.setLR('glutealAnt', [128, 100, 20]);
  L.setLR('sciaticExit', [56, 18, -52]);
  L.setLR('iliopectineal', [62, 6, 44]);
  L.setLR('qlCrest', [96, 150, -52]);
  L.setLR('iliolumbarCrest', [74, 136, -62]);
  L.setLR('esAponeurosis', [48, 108, -86]);
  return { sdf, cartilage: cart, landmarks: L.pts, bmin: [-140, -80, -95], bmax: [140, 172, 75] };
}

// ---------------- Fémur ----------------
export function femurGeom(side) {
  const s = side;
  const Hc = [HX * s, 0, 0];
  return {
    Hc,
    neckBase: [125 * s, -36, -9],
    GT: [134 * s, -12, -12],
    LT: [101 * s, -66, -17],
    shaft: [[127 * s, -42, -10], [119 * s, -150, -2], [108 * s, -290, 2], [99 * s, -392, -2]],
    knee: [96 * s, -432, -2],
  };
}

export function buildFemur(side) {
  const g = femurGeom(side);
  const s = side;
  const L = new Landmarks();
  const head = sphere(g.Hc, 23);
  const neck = limb(g.Hc, g.neckBase, [12.5, 15], [15, 18], [0, 1, 0]);
  const gt = SU(4, ellipsoid(g.GT, [11, 22, 17]), sphere([130 * s, 3, -15], 8));
  const lt = limb([110 * s, -60, -10], g.LT, [8, 8], [5.5, 5.5]);
  const itCrest = capsule([131 * s, -20, -22], [104 * s, -64, -17], 5);
  const shaft = chain(g.shaft, [[15, 16], [13.5, 14], [13, 13.5], [17, 15]], [0, 0, 1], 4);
  const aspera = chain([[121 * s, -95, -15], [113 * s, -210, -14], [104 * s, -330, -14]], [[3.5, 3.5], [3.8, 3.8], [3.2, 3.2]], [0, 1, 0], 2);
  const K = g.knee;
  const medC = ellipsoid(add(K, [-21 * s, 0, -6]), [13, 23, 28]);
  const latC = ellipsoid(add(K, [20 * s, 2, -5]), [13.5, 22, 27]);
  const distal = ellipsoid(add(K, [0, 22, -2]), [34, 26, 22]);
  let f = SU(6, head, neck);
  f = SU(6, f, gt, itCrest);
  f = SU(5, f, lt);
  f = SU(8, f, shaft);
  f = SU(3, f, aspera);
  f = SU(9, f, distal, medC, latC);
  f = SSUB(3, f, capsule(add(K, [0, -14, -36]), add(K, [0, -12, -4]), 9.5));
  f = SSUB(3, f, capsule(add(K, [0, 18, 26]), add(K, [0, -10, 24]), 7));
  // fóvea de la cabeza
  f = SSUB(1, f, sphere(add(g.Hc, [-22 * s, -4, 1]), 4));
  const cart = (x, y, z) => Math.min(
    smax(Math.hypot(x - g.Hc[0], y - g.Hc[1], z - g.Hc[2]) - 23.6, -dot(norm([-1 * s, 0.35, 0.2]), [x - g.Hc[0], y - g.Hc[1], z - g.Hc[2]]) - 6, 1),
    smax(Math.min(medC(x, y, z), latC(x, y, z)) - 0.6, (y - (K[1] - 2)) * 1, 1),
  );
  const sdf = roughen((x, y, z) => Math.min(f(x, y, z), cart(x, y, z) + 0.2), 0.15, 0.2);
  L.set('head', g.Hc);
  L.set('GT', g.GT);
  L.set('GTtip', [130 * s, 6, -15]);
  L.set('GTpost', [128 * s, -6, -24]);
  L.set('GTlat', [144 * s, -18, -10]);
  L.set('LT', g.LT);
  L.set('gluteal', [130 * s, -70, -18]);
  L.set('asperaUp', [121 * s, -95, -18]);
  L.set('asperaMid', [113 * s, -210, -17]);
  L.set('knee', K);
  L.set('popliteal', add(K, [0, 20, -30]));
  L.set('neckBase', g.neckBase);
  return { sdf, cartilage: cart, landmarks: L.pts, bmin: [Math.min(55 * s, 165 * s), -470, -50], bmax: [Math.max(55 * s, 165 * s), 32, 42] };
}
