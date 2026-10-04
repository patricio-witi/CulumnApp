// Modelos SDF de vértebras: lumbares, torácicas, cervicales típicas, atlas (C1), axis (C2) y sacro/cóccix.
import {
  U, SU, SUB, SSUB, I, SI, smin, smax, sphere, ellipsoid, capsule, limb, chain, roundBox, cylinder, ellCylinder,
  halfSpace, roughen, place, add, sub, mul, norm, dot, cross, len, lerp3, clamp,
} from '../sdf.mjs';
import { frameZ, frameX, frameY, mx, Landmarks } from './common.mjs';
import {
  vertebraParams, bodySection2D, bodyOutline, computeRestPose, SEGMENT_BELOW, SEGMENT_ABOVE,
  frameToWorld, worldToFrame, dirToWorld, dirToFrame, DEG,
} from '../../src/anatomy/spine-data.js';

const REST = computeRestPose();

// Cuerpo vertebral: sección "riñón/corazón" extruida con cintura y bordes redondeados
function bodySDF(p, opts = {}) {
  const H = p.bodyH;
  const r = opts.round ?? 2.2;
  const waist = p.waist ?? 0.06;
  return (x, y, z) => {
    const t = clamp(y / (H / 2), -1, 1);
    const s = 1 - waist * (1 - t * t);
    const d2 = bodySection2D(x / s, z / s, p) * s;
    const dy = Math.abs(y) - H / 2;
    const wx = d2 + r, wy = dy + r;
    return Math.min(Math.max(wx, wy), 0) + Math.hypot(Math.max(wx, 0), Math.max(wy, 0)) - r;
  };
}

// Transfiere un punto/dirección del marco de la vértebra "from" al de "to" (pose de reposo)
function xferPoint(from, to, pt) { return worldToFrame(REST.frames[to], frameToWorld(REST.frames[from], pt)); }
function xferDir(from, to, d) { return dirToFrame(REST.frames[to], dirToWorld(REST.frames[from], d)); }

function discAbove(id) { const s = SEGMENT_ABOVE[id]; return s ? s.disc : 5; }
function discBelow(id) { const s = SEGMENT_BELOW[id]; return s ? s.disc : 5; }

// ---------------- geometría clave de vértebras lumbares/torácicas ----------------
export function typicalGeom(id) {
  const p = vertebraParams(id);
  const B = p.bodyD / 2, H = p.bodyH, W2 = p.bodyW / 2;
  const lumbar = p.region === 'lumbar';
  const zc = -B - p.canalD / 2 + (p.concave || 0) * 0.6;
  const xp = p.canalW / 2 + p.pedW / 2 + (lumbar ? 0 : 0.5);
  const yp = H / 2 - p.pedH / 2 - (lumbar ? 1.5 : 1);
  const dA = discAbove(id);
  let n, S, sapHalf;
  if (lumbar) {
    const b = p.facetBeta * DEG;
    n = [-Math.cos(b), 0, -Math.sin(b)];
    S = [xp + p.pedW * 0.12 + 1.2, H / 2 + dA * 0.45 + 1, zc - p.canalD * 0.32];
    sapHalf = [7, 8.5, 3];
  } else {
    // carillas superiores torácicas: miran hacia atrás, arriba y lateral (T12 tiene inferiores de tipo lumbar)
    n = norm([0.22, 0.38, -0.9]);
    S = [xp + 0.3, H / 2 + dA * 0.4 + 1.5, zc - p.canalD * 0.22];
    sapHalf = [5.5, 5.5, 2.2];
  }
  const J = add(S, mul(n, sapHalf[2] + 0.5 + 0.9));
  return { p, B, H, W2, zc, xp, yp, n, S, J, sapHalf, lumbar };
}

// Articulación facetaria que esta vértebra comparte con la de abajo, expresada en SU marco
function jointBelowInThisFrame(id) {
  const seg = SEGMENT_BELOW[id];
  const lower = seg.lower;
  let J, n;
  if (lower === 'S1') ({ J, n } = sacrumGeom());
  else if (vertebraParams(lower).region === 'cervical') ({ J, n } = cervicalGeom(lower));
  else ({ J, n } = typicalGeom(lower));
  return { J: xferPoint(lower, id, J), n: norm(xferDir(lower, id, n)) };
}

function facetPlate(center, n, half, upHint = [0, 1, 0]) {
  // apófisis articular ovalada con eje fino a lo largo de n
  const t = norm(cross(upHint, n));
  const v = norm(cross(n, t));
  return ellipsoid(center, [half[0], half[1], half[2] * 1.15], [t, v, n]);
}
function facetCart(center, n, half, upHint = [0, 1, 0]) {
  const t = norm(cross(upHint, n));
  const v = norm(cross(n, t));
  return ellipsoid(center, half, [t, v, n]);
}

export function buildTypical(id) {
  const g = typicalGeom(id);
  const { p, B, H, W2, zc, xp, yp, n, S, sapHalf, lumbar } = g;
  const L = new Landmarks();
  const parts = [];
  const cart = [];
  const body = bodySDF(p);
  // concavidad leve de platillos
  const endplates = U(
    ellipsoid([0, H / 2 + 5.2, -0.5], [W2 * 0.72, 6, B * 0.7]),
    ellipsoid([0, -H / 2 - 5.2, -0.5], [W2 * 0.72, 6, B * 0.7]),
  );
  const bodyF = SSUB(1.5, body, endplates);

  // Pedículos
  const ped = mirrorPart(limb([xp * 0.8, yp, -B + 5], [xp, yp, zc - p.canalD * 0.1], [p.pedW / 2, p.pedH / 2], [p.pedW / 2 * 1.08, p.pedH / 2 * 1.1]));
  // Láminas
  const lamH = lumbar ? 21 : H + 3;
  const yl = lumbar ? yp - 4.5 : yp - 3.5;
  const Jlat = [xp - p.pedW * 0.2, yl, zc - p.canalD * 0.15];
  const Jmid = [0, yl - (lumbar ? 1 : 2), zc - p.canalD / 2 - 3.2];
  const lamDir = sub(Jmid, Jlat);
  const lamB = frameX(lamDir, norm([0, 1, lumbar ? 0.28 : 0.4]));
  const lamina = mirrorPart(roundBox(lerp3(Jlat, Jmid, 0.5), [len(lamDir) / 2 + 2.5, lamH / 2, lumbar ? 2.8 : 2.4], lamB, 2.3));

  // Apófisis espinosa
  const slope = p.spSlope * DEG;
  const spDir = [0, -Math.sin(slope), -Math.cos(slope)];
  const sp0 = [0, Jmid[1] + (lumbar ? 1 : 0), Jmid[2] + 1];
  const spTip = add(sp0, mul(spDir, p.spL));
  const spB = frameZ(spDir, [0, 1, 0]);
  const spinous = lumbar
    ? SU(5,
      limb(sp0, add(spTip, mul(spDir, -3)), [2.8, p.spH * 0.32], [3.4, p.spH * 0.5], spB[1]),
      ellipsoid(add(spTip, mul(spDir, -4.5)), [4, p.spH / 2 + 0.3, 5.5], spB),
    )
    : SU(4,
      limb(sp0, spTip, [3.2, p.spH / 2], [2.6, p.spH / 2 * 0.7], spB[1]),
      ellipsoid(spTip, [3.6, 4.4, 4.4], spB),
    );

  // Apófisis transversas
  let tp, tpTip, tpRoot;
  if (lumbar) {
    tpRoot = [xp + p.pedW * 0.25, yp + 1, zc + p.canalD * 0.2];
    const reach = p.tpSpan / 2 - tpRoot[0];
    tpTip = [p.tpSpan / 2, yp + 3 + (p.n === 5 ? 3 : 0), tpRoot[2] - reach * Math.tan((p.n === 5 ? 25 : 14) * DEG)];
    const r0 = p.n === 5 ? [5, 7.5] : [3.2, 5.6];
    const r1 = p.n === 5 ? [4.4, 6] : [2.6, 4.6];
    tp = mirrorPart(SU(3, limb(tpRoot, tpTip, r0, r1), sphere(tpTip, Math.max(r1[0], 3.2))));
    if (p.n === 5) tp = SU(4, tp, mirrorPart(capsule([W2 * 0.85, yp, -B * 0.4], tpRoot, 6)));
  } else {
    tpRoot = [xp + p.pedW * 0.3, yp + 1.5, zc - 1.5];
    const back = 38 * DEG, upA = 8 * DEG;
    const reach = (p.tpSpan / 2 - tpRoot[0]) / Math.cos(back);
    tpTip = add(tpRoot, [reach * Math.cos(back), reach * Math.sin(upA), -reach * Math.sin(back)]);
    tp = mirrorPart(SU(3, limb(tpRoot, tpTip, [4.2, 4.6], [5, 5.2]), ellipsoid(tpTip, [5.2, 5.5, 5.2])));
  }

  // Apófisis articulares superiores (SAP) y carillas
  const sapCore = facetPlate(S, n, sapHalf);
  const sapRoot = capsule([xp, yp + 2, zc - p.canalD * 0.15], add(S, mul(n, -1)), lumbar ? 4.5 : 3.5);
  let sap = SU(3, sapCore, sapRoot);
  if (lumbar) {
    const mamm = add(S, [2.5, -3, -5.5]);
    sap = SU(2.5, sap, ellipsoid(mamm, [3, 3.5, 3]));
    L.setLR('mamm', mamm);
    const acc = [tpRoot[0] + 4, tpRoot[1] - 3.5, tpRoot[2] - 3.5];
    sap = SU(2, sap, sphere(acc, 2.2));
    L.setLR('acc', acc);
  }
  const sapCart = facetCart(add(S, mul(n, sapHalf[2] * 0.72)), n, [sapHalf[0] * 0.78, sapHalf[1] * 0.78, 0.9]);
  // Apófisis articulares inferiores (IAP): encajan con la SAP de la vértebra de abajo
  const jb = jointBelowInThisFrame(id);
  const iapHalf = lumbar ? [6, 8, 3] : [5.5, 5.5, 2.2];
  const Ic = add(jb.J, mul(jb.n, 0.9 + 0.5 + iapHalf[2]));
  const iapCore = facetPlate(Ic, jb.n, iapHalf);
  const lamBot = [Jlat[0] * 0.75, yl - lamH / 2 + 3, (Jlat[2] + Jmid[2]) / 2];
  const iap = SU(4, iapCore, capsule(lamBot, add(Ic, mul(jb.n, 1)), lumbar ? 4.2 : 3.2));
  const iapCart = facetCart(add(Ic, mul(jb.n, -iapHalf[2] * 0.72)), jb.n, [iapHalf[0] * 0.78, iapHalf[1] * 0.78, 0.9]);

  // Torácicas: carillas costales en el cuerpo y en la transversa
  let costal = null;
  if (!lumbar) {
    const cs = [W2 * 0.86, H / 2 + 0.5, -B * 0.45];
    const ct = add(tpTip, [-1.5, -0.5, 4.2]);
    costal = { cs, ct };
    L.setLR('costalBody', cs);
    L.setLR('costalTp', ct);
  }

  let posterior = SU(2.4, mirrorPart(sap), mirrorPart(iap), lamina, spinous);
  let f = SU(2.8, bodyF, ped);
  f = SU(2.2, f, tp);
  f = SU(2.2, f, posterior);
  // Canal vertebral
  const canal = ellCylinder([0, 0, zc], p.canalW / 2, p.canalD / 2, 80, null, 0);
  f = SSUB(1.2, f, canal);
  if (costal) {
    const pits = mirrorPart(U(sphere(add(costal.cs, [3.5, 0, 0]), 4.2), sphere(add(costal.ct, [0, 0, 2.6]), 3.4)));
    f = SSUB(1, f, pits);
  }
  // foramen nutricio (vena basivertebral)
  f = SSUB(0.8, f, capsule([0, 0, -B - 1], [0, 0, -B + 4], 1.6));
  const cartF = mirrorPart(U(sapCart, iapCart));
  const total = smin2(f, cartF);
  const sdf = roughen(total, 0.12, 0.35);

  // ---- landmarks ----
  L.set('body', [0, 0, 0]);
  L.set('bodyTop', [0, H / 2, 0]);
  L.set('bodyBot', [0, -H / 2, 0]);
  L.set('antMid', [0, 0, B]);
  L.set('antTop', [0, H / 2 - 1, B - 0.5]);
  L.set('antBot', [0, -H / 2 + 1, B - 0.5]);
  L.set('postTop', [0, H / 2 - 1, -B + (p.concave || 0)]);
  L.set('postMid', [0, 0, -B + (p.concave || 0)]);
  L.set('postBot', [0, -H / 2 + 1, -B + (p.concave || 0)]);
  L.setLR('lat', [W2, 0, -B * 0.1]);
  L.setLR('latTop', [W2 * 0.95, H / 2 - 2, -B * 0.1]);
  L.setLR('latBot', [W2 * 0.95, -H / 2 + 2, -B * 0.1]);
  L.setLR('antLat', [W2 * 0.7, 0, B * 0.75]);
  L.set('canal', [0, 0, zc]);
  L.setLR('ped', [xp, yp, -B - p.canalD * 0.25]);
  L.setLR('pedTop', [xp, yp + p.pedH / 2, -B - 3]);
  L.setLR('pedBot', [xp, yp - p.pedH / 2, -B - 3]);
  L.setLR('foramen', [xp, yp - p.pedH / 2 - 6, -B - 2.5]);
  L.setLR('recess', [p.canalW / 2 - 2.5, yp - 2, zc + p.canalD * 0.25]);
  L.set('spBase', sp0);
  L.set('spTip', spTip);
  L.set('spMid', lerp3(sp0, spTip, 0.5));
  L.set('spTop', add(lerp3(sp0, spTip, 0.6), [0, (lumbar ? p.spH / 2 : 4), 0]));
  L.set('spBot', add(lerp3(sp0, spTip, 0.6), [0, -(lumbar ? p.spH / 2 : 4), 0]));
  L.setLR('lam', lerp3(Jlat, Jmid, 0.55));
  L.setLR('lamTop', add(lerp3(Jlat, Jmid, 0.55), [0, lamH / 2 - 1, 0]));
  L.setLR('lamBot', add(lerp3(Jlat, Jmid, 0.55), [0, -lamH / 2 + 1, 1]));
  L.setLR('tpTip', tpTip);
  L.setLR('tpRoot', tpRoot);
  L.setLR('tpMid', lerp3(tpRoot, tpTip, 0.5));
  L.setLR('sap', S);
  L.setLR('facetSup', g.J);
  L.setLR('iap', Ic);
  L.setLR('facetInf', jb.J);

  const bmin = [-(Math.max(p.tpSpan / 2, W2) + 8), -H / 2 - discBelow(id) - 22, spTip[2] - 9];
  const bmax = [Math.max(p.tpSpan / 2, W2) + 8, H / 2 + discAbove(id) + 16, B + 4];
  return {
    sdf, bone: f, bmin, bmax,
    cartilage: cartF,
    landmarks: L.pts,
    outlineTop: bodyOutline(p, 48),
    meta: { H, W: p.bodyW, D: p.bodyD, canalW: p.canalW, canalD: p.canalD, zc },
  };
}

// une la parte definida para x>0 con su espejo
function mirrorPart(f) { return (x, y, z) => f(Math.abs(x), y, z); }
function smin2(a, b) { return (x, y, z) => Math.min(a(x, y, z), b(x, y, z)); }

// ---------------- cervicales típicas C3–C7 ----------------
export function cervicalGeom(id) {
  const p = vertebraParams(id);
  const B = p.bodyD / 2, H = p.bodyH, W2 = p.bodyW / 2;
  const zc = -B - p.canalD / 2;
  const Pc = [p.canalW / 2 + 5, 0, -B - 6.5];
  const dA = discAbove(id);
  const ang = (id === 'C7' ? 55 : 45) * DEG;
  const n = norm([0, Math.cos(ang), -Math.sin(ang)]);
  const J = add(Pc, [0, H / 2 + dA / 2, 0]);
  return { p, B, H, W2, zc, Pc, n, J };
}

export function buildCervical(id) {
  const g = cervicalGeom(id);
  const { p, B, H, W2, zc, Pc, n } = g;
  const L = new Landmarks();
  const C7 = id === 'C7';
  const body = bodySDF(p, { round: 1.8 });
  // procesos unciformes y labio anteroinferior
  const unc = mirrorPart(capsule([W2 - 1.4, H / 2 + 0.6, -B + 3], [W2 - 1.4, H / 2 + 0.6, B * 0.35], 1.9));
  const lip = ellipsoid([0, -H / 2 + 0.8, B - 1.2], [W2 * 0.65, 2.6, 3]);
  let f = SU(1.5, body, unc, lip);
  f = SSUB(1, f, ellipsoid([0, H / 2 + 4.2, 0], [W2 * 0.6, 4.5, B * 0.65]));
  // pedículos
  const ped = mirrorPart(limb([W2 - 2.5, 0.5, -B + 2.5], [p.canalW / 2 + 2.5, 0.5, -B - 4.5], [2.6, 3.4]));
  // pilares articulares con carillas a ~45°
  const dB = discBelow(id);
  const dA = discAbove(id);
  const pillarRaw = ellCylinder(Pc, 5.8, 6.4, H / 2 + Math.max(dA, dB) / 2 + 7, null, 2);
  const jb = jointBelowInThisFrame(id);
  const topCut = halfSpace(add(g.J, mul(n, -1.4)), n); // conserva debajo
  const botCut = halfSpace(add(jb.J, mul(jb.n, 1.4)), mul(jb.n, -1)); // conserva encima
  const pillar = SI(1.2, SI(1.2, pillarRaw, topCut), botCut);
  const pillarM = mirrorPart(pillar);
  const cart = mirrorPart(U(
    SI(0.4, SI(0.3, ellCylinder(Pc, 4.8, 5.4, 40), halfSpace(add(g.J, mul(n, -0.75)), n)), halfSpace(add(g.J, mul(n, -1.6)), mul(n, -1))),
    SI(0.4, SI(0.3, ellCylinder(Pc, 4.8, 5.4, 40), halfSpace(add(jb.J, mul(jb.n, 0.75)), mul(jb.n, -1))), halfSpace(add(jb.J, mul(jb.n, 1.6)), jb.n)),
  ));
  // apófisis transversa con agujero transverso y surco del nervio
  const tpX = p.tpSpan / 2;
  const antTub = [tpX - 3.5, -1.5, 1.5];
  const postTub = [tpX - 1.5, -1.5, -B - 2.5];
  let tp = SU(2.5,
    limb([W2 - 1, -0.5, -1.5], antTub, [2.2, 3], [2.4, 3.2]),
    limb([Pc[0] + 3, -0.5, Pc[2] + 2], postTub, [2.6, 3.2], [2.6, 3]),
    limb(antTub, postTub, [2.2, 2.6]),
    ellipsoid(antTub, [3, 3.2, id === 'C6' ? 4.2 : 3]),
    ellipsoid(postTub, [3.2, 3.2, 3]),
  );
  const ftC = [W2 + 4.5, -0.5, -B + 1.5];
  tp = SSUB(0.8, tp, cylinder(ftC, C7 ? 2 : 3, 20));
  tp = SSUB(1.2, tp, capsule([W2 + 6, 3.6, (antTub[2] + postTub[2]) / 2], [tpX + 3, 2.8, (antTub[2] + postTub[2]) / 2], 2.4));
  const tpM = mirrorPart(tp);
  // láminas y espinosa
  const lamA = [Pc[0] - 3, -1.5, Pc[2] - 4];
  const lamM = [0, -2.5, zc - p.canalD / 2 - 2.2];
  const lamDir = sub(lamM, lamA);
  const lamina = mirrorPart(roundBox(lerp3(lamA, lamM, 0.5), [len(lamDir) / 2 + 1.5, 5, 1.8], frameX(lamDir, norm([0, 1, 0.35])), 1.5));
  const slope = (C7 ? 15 : 25) * DEG;
  const spDir = [0, -Math.sin(slope), -Math.cos(slope)];
  const sp0 = [0, -2.5, zc - p.canalD / 2 - 2.5];
  const spTip = add(sp0, mul(spDir, p.spL));
  let spinous;
  if (C7) spinous = SU(3, limb(sp0, spTip, [3, 5], [2.8, 4]), ellipsoid(spTip, [4.4, 4.6, 4.4]));
  else spinous = SU(2.5, limb(sp0, add(spTip, mul(spDir, -3)), [2.4, 4], [2.2, 3.2]), mirrorPart(ellipsoid(add(spTip, [3.2, 0, 0]), [2.4, 3, 3.2])));

  f = SU(2, f, ped);
  f = SU(1.8, f, pillarM, tpM);
  f = SU(1.6, f, lamina, spinous);
  f = SSUB(1, f, ellCylinder([0, 0, zc], p.canalW / 2, p.canalD / 2, 60));
  const total = smin2(f, cart);
  const sdf = roughen(total, 0.08, 0.5);

  L.set('body', [0, 0, 0]);
  L.set('bodyTop', [0, H / 2, 0]);
  L.set('bodyBot', [0, -H / 2, 0]);
  L.set('antMid', [0, 0, B]);
  L.set('antTop', [0, H / 2 - 1, B - 0.5]);
  L.set('antBot', [0, -H / 2 + 1, B - 0.5]);
  L.set('postTop', [0, H / 2 - 1, -B]);
  L.set('postMid', [0, 0, -B]);
  L.set('postBot', [0, -H / 2 + 1, -B]);
  L.setLR('lat', [W2, 0, 0]);
  L.setLR('antLat', [W2 * 0.75, 0, B * 0.7]);
  L.set('canal', [0, 0, zc]);
  L.setLR('ped', [p.canalW / 2 + 1.5, 0.5, -B - 3]);
  L.setLR('foramen', [p.canalW / 2 + 3, H / 2 + dA / 2 + 1, -B - 2]);
  L.setLR('foramenBelow', [p.canalW / 2 + 3, -H / 2 - dB / 2 + 1, -B - 2]);
  L.set('spBase', sp0);
  L.set('spTip', spTip);
  L.set('spMid', lerp3(sp0, spTip, 0.5));
  L.setLR('lam', lerp3(lamA, lamM, 0.5));
  L.setLR('pillar', Pc);
  L.setLR('tpTip', [tpX, -1.5, (antTub[2] + postTub[2]) / 2]);
  L.setLR('tpAnt', antTub);
  L.setLR('tpPost', postTub);
  L.setLR('foramenTransv', ftC);
  L.setLR('facetSup', g.J);
  L.setLR('facetInf', jb.J);
  return {
    sdf, bone: f, cartilage: cart, landmarks: L.pts,
    bmin: [-tpX - 6, -H / 2 - dB - 14, spTip[2] - 7], bmax: [tpX + 6, H / 2 + dA + 12, B + 4],
    outlineTop: bodyOutline(p, 48),
    meta: { H, W: p.bodyW, D: p.bodyD, canalW: p.canalW, canalD: p.canalD, zc },
  };
}

// ---------------- Axis (C2) ----------------
export function c2Geom() {
  const p = vertebraParams('C2');
  const H = p.bodyH, B = p.bodyD / 2;
  const top = [12.5, H / 2 - 0.5, -1.5];
  const n = norm([0.28, 1, 0.04]);
  const J = add(top, mul(n, 1.6));
  return { p, H, B, top, n, J };
}

export function buildC2() {
  const g = c2Geom();
  const { p, H, B } = g;
  const W2 = p.bodyW / 2;
  const L = new Landmarks();
  const zc = -B - p.canalD / 2;
  let f = bodySDF({ ...p, bodyH: H }, { round: 2 });
  // diente (odontoides)
  const densBase = [0, H / 2 - 3, 1];
  const densTip = [0, H / 2 + 13, 0.5];
  f = SU(3, f, limb(densBase, densTip, [5, 5.2], [4.2, 4.2]), sphere(densTip, 4.4));
  // masas laterales con carillas superiores
  const plat = mirrorPart(SI(1, ellipsoid([12.5, H / 2 - 4, -1.5], [8, 6, 9.2]), halfSpace(g.top, g.n)));
  f = SU(3, f, plat);
  const cartSup = mirrorPart(SI(0.3, SI(0.3, ellipsoid([12.5, H / 2 - 4, -1.5], [7.2, 6.5, 8.4]), halfSpace(g.top, g.n)), halfSpace(add(g.top, mul(g.n, -0.9)), mul(g.n, -1))));
  // pilar inferior (articulación C2–C3)
  const Pc = [p.canalW / 2 + 4.5, -H / 2 + 3, -B - 7];
  const jb = jointBelowInThisFrame('C2');
  const pillar = mirrorPart(SI(1.2, ellCylinder(Pc, 6, 6.5, 10, null, 2), halfSpace(add(jb.J, mul(jb.n, 1.4)), mul(jb.n, -1))));
  const cartInf = mirrorPart(SI(0.4, SI(0.3, ellCylinder(Pc, 5, 5.5, 30), halfSpace(add(jb.J, mul(jb.n, 0.75)), mul(jb.n, -1))), halfSpace(add(jb.J, mul(jb.n, 1.6)), jb.n)));
  // pars / pedículo grueso
  const pars = mirrorPart(capsule([12, H / 2 - 5, -3], [Pc[0], Pc[1] + 3, Pc[2]], 4.8));
  // transversa pequeña con agujero
  let tp = limb([W2 + 1.5, -1, -3], [26, -5, -5], [3, 3.4], [2.6, 3]);
  tp = SU(2, tp, sphere([26, -5, -5], 3.2));
  const ftC = [W2 + 4.2, -1.5, -3.5];
  tp = mirrorPart(SSUB(0.8, tp, cylinder(ftC, 2.8, 15)));
  // láminas gruesas y espinosa bífida grande
  const lamA = [Pc[0] - 3, -H / 2 + 2, Pc[2] - 4];
  const lamM = [0, -H / 2 + 2, zc - p.canalD / 2 - 3];
  const lamina = mirrorPart(roundBox(lerp3(lamA, lamM, 0.5), [len(sub(lamM, lamA)) / 2 + 2, 6.5, 2.6], frameX(sub(lamM, lamA), [0, 1, 0.2]), 2));
  const sp0 = [0, -H / 2 + 1.5, zc - p.canalD / 2 - 4];
  const spTip = add(sp0, [0, -5, -p.spL]);
  const spinous = SU(3, limb(sp0, add(spTip, [0, 1, 3]), [4.2, 7], [3.5, 5.5]), mirrorPart(ellipsoid(add(spTip, [4, 0, 0]), [3.5, 5, 4.2])));
  f = SU(2, f, pars, pillar, tp);
  f = SU(2, f, lamina, spinous);
  f = SSUB(1, f, ellCylinder([0, 0, zc], p.canalW / 2, p.canalD / 2, 60));
  const cart = U(cartSup, cartInf, ellipsoid([0, H / 2 + 7, 4.6], [3.5, 4.5, 1.2]));
  const sdf = roughen(smin2(f, cart), 0.08, 0.5);
  L.set('body', [0, 0, 0]);
  L.set('bodyBot', [0, -H / 2, 0]);
  L.set('antMid', [0, -2, B]);
  L.set('antBot', [0, -H / 2 + 1, B - 0.5]);
  L.set('postBot', [0, -H / 2 + 1, -B]);
  L.set('postMid', [0, 0, -B]);
  L.set('densTip', densTip);
  L.set('canal', [0, 0, zc]);
  L.set('spBase', sp0);
  L.set('spTip', spTip);
  L.set('spMid', lerp3(sp0, spTip, 0.5));
  L.setLR('lam', lerp3(lamA, lamM, 0.5));
  L.setLR('tpTip', [26, -5, -5]);
  L.setLR('pillar', Pc);
  L.setLR('facetSup', g.J);
  L.setLR('facetInf', jb.J);
  L.setLR('foramen', [p.canalW / 2 + 2, H / 2 + 2, -B - 3]);
  L.setLR('foramenBelow', [p.canalW / 2 + 3, -H / 2 - 3, -B - 2]);
  L.setLR('lat', [W2, 0, 0]);
  return {
    sdf, bone: f, cartilage: cart, landmarks: L.pts,
    bmin: [-32, -H / 2 - 16, spTip[2] - 9], bmax: [32, H / 2 + 20, B + 5],
    outlineTop: bodyOutline(p, 48),
    meta: { H, W: p.bodyW, D: p.bodyD, canalW: p.canalW, canalD: p.canalD, zc },
  };
}

// ---------------- Atlas (C1) ----------------
export function buildC1() {
  const L = new Landmarks();
  const LM = [21, 0, -1.5];
  // carilla inferior: coincide con la superior de C2
  const g2 = c2Geom();
  const Jc = xferPoint('C2', 'C1', g2.J);
  const nc = norm(xferDir('C2', 'C1', g2.n));
  let lat = ellipsoid(LM, [7.6, 7.4, 11]);
  lat = SI(1.2, lat, halfSpace(add(Jc, mul(nc, 1.6)), mul(nc, -1)));
  // concavidad superior para el cóndilo occipital
  lat = SSUB(1.2, lat, ellipsoid([20, 10.5, -1.5], [6.2, 5.2, 10]));
  const latM = mirrorPart(lat);
  const antArch = chain([[16, 0, 7], [9, 0, 12.2], [0, 0, 13.6]], [[3, 5.2], [3, 5], [3, 5]]);
  const antTub = ellipsoid([0, 0, 15], [4.5, 5.6, 3]);
  const postArch = chain([[16, 1, -11], [13, 2, -23], [6.5, 2.5, -30.5], [0, 2.5, -32.5]], [[3.6, 4], [3.4, 3.8], [3.4, 4], [3.6, 4.4]], [0, 1, 0]);
  const postTub = ellipsoid([0, 2.5, -33.5], [4.5, 5, 3.5]);
  let tp = SU(2, limb([26, 0, -2.5], [37.5, -0.5, -4.5], [4.4, 4.6], [4, 4.6]), ellipsoid([38, -0.5, -4.5], [4.5, 5.5, 5]));
  tp = SSUB(0.8, tp, cylinder([28.5, 0, -2.6], 3, 15));
  let f = SU(2.2, latM, mirrorPart(antArch), antTub, mirrorPart(postArch), postTub, mirrorPart(tp));
  // carilla para el diente en el arco anterior (cartílago)
  const cart = U(
    ellipsoid([0, 0, 9.3], [4, 4.5, 1.1]),
    mirrorPart(SI(0.3, ellipsoid([20, 4.2, -1.5], [6.4, 2, 9.4]), (x, y, z) => -(y - 4.6))),
    mirrorPart(SI(0.3, ellipsoid(add(Jc, mul(nc, 1.5)), [6.4, 1.1, 8]), halfSpace(add(Jc, mul(nc, 1.5)), mul(nc, -1)))),
  );
  const sdf = roughen(smin2(f, cart), 0.08, 0.5);
  L.set('body', [0, 0, 0]);
  L.set('antTub', [0, 0, 17]);
  L.set('postTub', [0, 2.5, -36]);
  L.set('canal', [0, 0, -14]);
  L.setLR('tpTip', [39, -0.5, -4.5]);
  L.setLR('latMass', LM);
  L.setLR('facetSup', [20, 6.2, -1.5]);
  L.setLR('facetInf', Jc);
  L.setLR('postArch', [13, 2, -23]);
  L.setLR('foramen', [14, -6, -6]);
  return {
    sdf, bone: f, cartilage: cart, landmarks: L.pts,
    bmin: [-46, -12, -42], bmax: [46, 14, 22],
    outlineTop: [],
    meta: { H: 12, W: 0, D: 14, canalW: 28, canalD: 30, zc: -14 },
  };
}

// ---------------- Sacro y cóccix (marco: centro del platillo de S1) ----------------
export function sacrumGeom() {
  // S1 se comporta como una "vértebra" de referencia para la carilla de L5
  const canalW = 27, canalD = 13;
  const B = 16.5;
  const zc = -B - canalD / 2 + 1;
  const xp = canalW / 2 + 8;
  const b = 52 * DEG;
  const n = [-Math.cos(b), 0, -Math.sin(b)];
  const S = [xp + 1.8, 0 + 11.5 * 0.45 + 1, zc - canalD * 0.35];
  const J = add(S, mul(n, 3 + 0.5 + 0.9));
  return { canalW, canalD, B, zc, xp, n, S, J };
}

function sacralAxis() {
  const segLen = [29, 24, 20, 16, 13];
  const theta = [0, 7, 20, 36, 52, 66];
  const pts = [[0, 0, 0]];
  let p = [0, 0, 0];
  for (let k = 0; k < 5; k++) {
    const th = ((theta[k] + theta[k + 1]) / 2) * DEG;
    p = add(p, mul([0, -Math.cos(th), Math.sin(th)], segLen[k]));
    pts.push(p);
  }
  return { pts, theta, segLen };
}

export function buildSacrum() {
  const g = sacrumGeom();
  const L = new Landmarks();
  const ax = sacralAxis();
  const W = [25, 19, 15, 11.5, 8];
  const D = [16.5, 13, 10.5, 8, 6];
  const alaW = [55, 47, 37, 26, 15];
  const alaD = [17, 15, 11.5, 9, 7];
  const parts = [];
  const latParts = [];
  const dir = [];
  const mids = [];
  for (let k = 0; k < 5; k++) {
    const a = ax.pts[k], b = ax.pts[k + 1];
    const m = lerp3(a, b, 0.5);
    const d = norm(sub(a, b)); // hacia craneal
    dir.push(d); mids.push(m);
    const Bk = frameY(d, [0, 0, 1]);
    // cuerpos fusionados
    parts.push(ellCylinder(m, W[k], D[k], ax.segLen[k] / 2 + 1, Bk, 2.5));
    // masas laterales (alas): se desplazan hacia posterior
    const back = mul(Bk[2], -(D[k] * 0.35));
    latParts.push(roundBox(add(add(m, back), mul(Bk[0], alaW[k] * 0.5)), [alaW[k] * 0.5, ax.segLen[k] / 2 + 2.5, alaD[k]], Bk, 5));
  }
  let f = SU(7, ...parts);
  const alae = mirrorPart(SU(9, ...latParts));
  f = SU(6, f, alae);
  // superficie superior del ala inclinada y promontorio limpio
  f = SSUB(3, f, mirrorPart(ellipsoid([44, 16, 10], [26, 14, 26])));
  // cresta sacra media y techo dorsal
  const crest = [];
  for (let k = 0; k < 4; k++) {
    const Bk = frameY(dir[k], [0, 0, 1]);
    const c = add(mids[k], mul(Bk[2], -(D[k] + 11 - k * 1.2)));
    crest.push(ellipsoid(c, [3, ax.segLen[k] * 0.35, 4], Bk));
    crest.push(roundBox(add(mids[k], mul(Bk[2], -(D[k] + 6 - k))), [W[k] + 2, ax.segLen[k] / 2 + 1, 4], Bk, 3));
  }
  f = SU(4, f, ...crest);
  // apófisis articulares superiores de S1 (para L5)
  const sap = mirrorPart(SU(3, facetPlate(g.S, g.n, [7, 8.5, 3]), capsule([g.xp, 2, g.zc - 3], add(g.S, mul(g.n, -1)), 5)));
  f = SU(3, f, sap);
  // canal sacro
  const canalPts = [];
  for (let k = 0; k <= 4; k++) {
    const Bk = frameY(k < 5 ? dir[Math.min(k, 4)] : dir[4], [0, 0, 1]);
    canalPts.push(add(ax.pts[k], mul(Bk[2], -(D[Math.min(k, 4)] + 4.5 - k * 0.6))));
  }
  const canalR = [[12.5, 6], [10, 5], [7.5, 4], [5.5, 3.2], [4, 2.5]];
  f = SSUB(1.2, f, chain(canalPts, canalR.map((r) => [r[1], r[0]]), [0, 0, 1]));
  // hiato sacro
  f = SSUB(2, f, ellipsoid(add(ax.pts[4], [0, 2, -9]), [6, 12, 6]));
  // agujeros sacros (anteriores y posteriores, alineados)
  const foramR = [5, 4.4, 3.6, 3];
  const forX = [15, 13.5, 11.5, 9.5];
  for (let k = 0; k < 4; k++) {
    const c = ax.pts[k + 1];
    const Bk = frameY(norm(add(dir[k], dir[k + 1 < 5 ? k + 1 : 4])), [0, 0, 1]);
    const zAx = Bk[2];
    const fA = mirrorPart(capsule(add(add(c, mul(Bk[0], forX[k])), mul(zAx, 25)), add(add(c, mul(Bk[0], forX[k] + 3)), mul(zAx, -30)), foramR[k]));
    f = SSUB(1, f, fA);
    L.setLR('aforS' + (k + 1), add(add(c, mul(Bk[0], forX[k])), mul(zAx, D[k] * 0.6)));
    L.setLR('pforS' + (k + 1), add(add(c, mul(Bk[0], forX[k] + 2)), mul(zAx, -(D[k] + 8))));
  }
  // cóccix
  const coc = [];
  let cp = ax.pts[5];
  let th = 66;
  const cl = [9, 7.5, 6.5, 5.5], cw = [9, 7, 5, 3.6];
  const cocPts = [cp];
  for (let k = 0; k < 4; k++) {
    th += 6;
    const d = [0, -Math.cos(th * DEG), Math.sin(th * DEG)];
    const np = add(cp, mul(d, cl[k] + 1.5));
    coc.push(ellipsoid(lerp3(cp, np, 0.55), [cw[k], cl[k] * 0.55, cw[k] * 0.62], frameY(mul(d, -1), [0, 0, 1])));
    cocPts.push(np);
    cp = np;
  }
  const coccyx = U(...coc, mirrorPart(capsule(add(cocPts[1], [0, 1, -2]), add(cocPts[1], [12, 2, -2]), 2.2)));
  // cartílago: superficie auricular (articulación sacroilíaca) y carillas de S1
  const aur = mirrorPart(SI(0.8, ellipsoid(add(add(mids[0], [0, -8, 0]), [alaW[0] - 1, 0, -6]), [4, 26, 16], frameY(dir[0], [0, 0, 1])), (x, y, z) => -(x - (alaW[0] - 3.5))));
  const sapCart = mirrorPart(facetCart(add(g.S, mul(g.n, 2.4)), g.n, [5.6, 6.8, 0.9]));
  const cart = U(aur, sapCart);
  const sdf = roughen(smin2(f, cart), 0.13, 0.3);
  const cocSdf = roughen(coccyx, 0.08, 0.5);

  L.set('s1Center', [0, 0, 0]);
  L.set('promontory', [0, -1, g.B]);
  L.set('canalTop', [0, -2, g.zc]);
  L.set('apex', ax.pts[5]);
  L.set('coccyxTip', cocPts[cocPts.length - 1]);
  for (let k = 0; k < 5; k++) {
    const Bk = frameY(dir[k], [0, 0, 1]);
    L.set('dorsal' + (k + 1), add(mids[k], mul(Bk[2], -(D[k] + 14 - k * 1.2))));
    L.setLR('dorsalLat' + (k + 1), add(add(mids[k], mul(Bk[2], -(D[k] + 8))), mul(Bk[0], W[k] + 8)));
    L.set('ant' + (k + 1), add(mids[k], mul(Bk[2], D[k] * 0.9)));
    L.setLR('ala' + (k + 1), add(mids[k], mul(Bk[0], alaW[k] - 3)));
  }
  L.setLR('sap', g.S);
  L.setLR('facetSup', g.J);
  L.setLR('alaTop', [36, -3, 2]);
  return {
    sdf, bone: f, cartilage: cart, landmarks: L.pts,
    bmin: [-62, -108, -60], bmax: [62, 22, 58],
    coccyx: { sdf: cocSdf, bmin: [-24, -130, 15], bmax: [24, -75, 85] },
    meta: { canalW: g.canalW, canalD: g.canalD, zc: g.zc },
  };
}

export function buildVertebra(id) {
  const p = vertebraParams(id);
  if (id === 'C1') return buildC1();
  if (id === 'C2') return buildC2();
  if (p.region === 'cervical') return buildCervical(id);
  return buildTypical(id);
}
