// Datos anatómicos compartidos entre el generador de huesos (Node) y la web.
// Unidades: milímetros y grados. Ejes: +Y craneal, +Z anterior, +X izquierda del paciente.
// Las medidas son valores medios de adulto tomados de la literatura morfométrica
// (Panjabi 1991-1992, Zhou 2000 y similares); son aproximaciones, no un paciente real.

export const DEG = Math.PI / 180;

// Orden de abajo hacia arriba (cadena cinemática desde el sacro)
export const VERTEBRAE = [
  'L5', 'L4', 'L3', 'L2', 'L1',
  'T12', 'T11', 'T10', 'T9', 'T8', 'T7', 'T6', 'T5', 'T4', 'T3', 'T2', 'T1',
  'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1',
];

export function regionOf(id) {
  return id[0] === 'L' ? 'lumbar' : id[0] === 'T' ? 'thoracic' : id[0] === 'C' ? 'cervical' : 'other';
}

const lerp = (a, b, t) => a + (b - a) * t;

function interpKeys(keys, n) {
  // keys: {nivel: valor}; interpola linealmente para el número de nivel n
  const ks = Object.keys(keys).map(Number).sort((a, b) => a - b);
  if (n <= ks[0]) return keys[ks[0]];
  if (n >= ks[ks.length - 1]) return keys[ks[ks.length - 1]];
  for (let i = 0; i < ks.length - 1; i++) {
    if (n >= ks[i] && n <= ks[i + 1]) {
      const t = (n - ks[i]) / (ks[i + 1] - ks[i]);
      return lerp(keys[ks[i]], keys[ks[i + 1]], t);
    }
  }
  return keys[ks[0]];
}

// Parámetros lumbares L1..L5 (índice 0 = L1)
const LUMBAR = {
  bodyW: [42, 44.5, 47, 49, 51],
  bodyD: [32, 33, 34, 34.5, 34],
  bodyH: [25, 26, 26.5, 26.5, 25.5],
  canalW: [22, 22, 22.5, 23, 25],
  canalD: [17, 16.5, 16, 16, 16.5],
  pedW: [8, 8.5, 10, 12, 16],
  pedH: [15, 15, 14.5, 14, 13.5],
  spL: [29, 30, 30, 27, 22],
  spH: [17, 19, 20, 19, 15],
  spSlope: [12, 10, 8, 8, 12],
  tpSpan: [68, 78, 90, 84, 86],
  facetBeta: [25, 30, 38, 45, 50],
};

// Torácicas: valores clave por nivel (1..12)
const THORACIC = {
  bodyW: { 1: 27, 4: 28, 8: 32, 12: 40 },
  bodyD: { 1: 17, 4: 21, 8: 26, 12: 30 },
  bodyH: { 1: 15, 4: 17, 8: 19.5, 12: 23 },
  canalW: { 1: 20, 4: 16.5, 9: 16.5, 12: 19 },
  canalD: { 1: 15, 4: 15, 9: 15.5, 12: 16.5 },
  pedW: { 1: 7.5, 4: 5, 8: 6, 12: 8 },
  pedH: { 1: 9, 4: 10.5, 8: 12.5, 12: 15.5 },
  spL: { 1: 33, 4: 38, 8: 40, 11: 32, 12: 28 },
  spH: { 1: 9, 6: 9, 11: 13, 12: 16 },
  spSlope: { 1: 25, 4: 45, 6: 60, 8: 60, 10: 40, 11: 25, 12: 15 },
  tpSpan: { 1: 74, 6: 66, 10: 58, 11: 50, 12: 46 },
};

// Cervicales C3..C7
const CERVICAL = {
  bodyW: { 3: 16, 4: 17, 5: 18, 6: 19.5, 7: 21.5 },
  bodyD: { 3: 15, 4: 15.5, 5: 16, 6: 16.5, 7: 16 },
  bodyH: { 3: 13, 4: 13, 5: 12.8, 6: 13, 7: 14.5 },
  canalW: { 3: 24, 7: 24 },
  canalD: { 3: 14, 7: 14.5 },
  spL: { 3: 14, 4: 15, 5: 16, 6: 20, 7: 30 },
  tpSpan: { 3: 50, 5: 54, 6: 56, 7: 66 },
};

export function vertebraParams(id) {
  const reg = regionOf(id);
  const n = parseInt(id.slice(1), 10);
  if (reg === 'lumbar') {
    const i = n - 1;
    const p = {};
    for (const k of Object.keys(LUMBAR)) p[k] = LUMBAR[k][i];
    p.region = reg; p.n = n; p.id = id;
    p.shapeN = 2.3; p.concave = 3.2; p.egg = 0.04; p.waist = 0.07;
    return p;
  }
  if (reg === 'thoracic') {
    const p = { region: reg, n, id };
    for (const k of Object.keys(THORACIC)) p[k] = interpKeys(THORACIC[k], n);
    p.shapeN = 2.0; p.concave = 1.2; p.egg = n < 11 ? 0.18 : 0.08; p.waist = 0.06;
    return p;
  }
  if (reg === 'cervical') {
    const p = { region: reg, n, id };
    if (n >= 3) {
      for (const k of Object.keys(CERVICAL)) p[k] = interpKeys(CERVICAL[k], n);
      p.pedW = 5.5; p.pedH = 7;
    } else if (n === 2) {
      Object.assign(p, { bodyW: 17.5, bodyD: 15.5, bodyH: 21, canalW: 24, canalD: 16, spL: 24, tpSpan: 56, pedW: 7, pedH: 9 });
    } else {
      Object.assign(p, { bodyW: 0, bodyD: 14, bodyH: 11, canalW: 28, canalD: 30, spL: 0, tpSpan: 78, pedW: 0, pedH: 0 });
    }
    p.shapeN = 3.0; p.concave = 0.6; p.egg = 0; p.waist = 0.05;
    return p;
  }
  return null;
}

// Segmentos (articulación entre vertebra inferior y superior), de abajo hacia arriba.
// disc: altura media del disco (mm). angle: curvatura sagital en reposo (° ; negativo = lordosis).
// rom: flexión y extensión (°), inclinación lateral a un lado (°), rotación axial a un lado (°).
// ROM lumbar: Pearcy 1984 / Pearcy & Tibrewal 1984 (in vivo). Torácica y cervical:
// valores representativos de White & Panjabi (Clinical Biomechanics of the Spine, 2ª ed.).
export const SEGMENTS = [
  { id: 'L5-S1', lower: 'S1', upper: 'L5', disc: 11.5, angle: -19, rom: { flex: 9, ext: 5, lat: 2, rot: 1 } },
  { id: 'L4-L5', lower: 'L5', upper: 'L4', disc: 12, angle: -15, rom: { flex: 13, ext: 2, lat: 3, rot: 1.5 } },
  { id: 'L3-L4', lower: 'L4', upper: 'L3', disc: 11, angle: -10, rom: { flex: 12, ext: 1.5, lat: 5, rot: 1.5 } },
  { id: 'L2-L3', lower: 'L3', upper: 'L2', disc: 10, angle: -7, rom: { flex: 10, ext: 3, lat: 5.5, rot: 1.5 } },
  { id: 'L1-L2', lower: 'L2', upper: 'L1', disc: 9, angle: -4, rom: { flex: 8, ext: 5, lat: 5.5, rot: 1.5 } },
  { id: 'T12-L1', lower: 'L1', upper: 'T12', disc: 7, angle: 2, rom: { flex: 7, ext: 5, lat: 8, rot: 2 } },
  { id: 'T11-T12', lower: 'T12', upper: 'T11', disc: 6.5, angle: 2, rom: { flex: 7, ext: 5, lat: 9, rot: 2 } },
  { id: 'T10-T11', lower: 'T11', upper: 'T10', disc: 6, angle: 2.5, rom: { flex: 5.5, ext: 3.5, lat: 7, rot: 2 } },
  { id: 'T9-T10', lower: 'T10', upper: 'T9', disc: 5.5, angle: 2.5, rom: { flex: 4, ext: 2, lat: 6, rot: 4 } },
  { id: 'T8-T9', lower: 'T9', upper: 'T8', disc: 5, angle: 3, rom: { flex: 4, ext: 2, lat: 6, rot: 7 } },
  { id: 'T7-T8', lower: 'T8', upper: 'T7', disc: 4.5, angle: 3, rom: { flex: 4, ext: 2, lat: 6, rot: 8 } },
  { id: 'T6-T7', lower: 'T7', upper: 'T6', disc: 4.5, angle: 3.5, rom: { flex: 3, ext: 2, lat: 6, rot: 8 } },
  { id: 'T5-T6', lower: 'T6', upper: 'T5', disc: 4.2, angle: 3.5, rom: { flex: 2.5, ext: 1.5, lat: 6, rot: 8 } },
  { id: 'T4-T5', lower: 'T5', upper: 'T4', disc: 4.2, angle: 3.5, rom: { flex: 2.5, ext: 1.5, lat: 6, rot: 8 } },
  { id: 'T3-T4', lower: 'T4', upper: 'T3', disc: 4.2, angle: 3, rom: { flex: 2.5, ext: 1.5, lat: 6, rot: 8 } },
  { id: 'T2-T3', lower: 'T3', upper: 'T2', disc: 4.2, angle: 3, rom: { flex: 2.5, ext: 1.5, lat: 6, rot: 8 } },
  { id: 'T1-T2', lower: 'T2', upper: 'T1', disc: 4.2, angle: 2.5, rom: { flex: 2.5, ext: 1.5, lat: 6, rot: 9 } },
  { id: 'C7-T1', lower: 'T1', upper: 'C7', disc: 5, angle: -2, rom: { flex: 5, ext: 4, lat: 4, rot: 2 } },
  { id: 'C6-C7', lower: 'C7', upper: 'C6', disc: 5, angle: -4, rom: { flex: 9, ext: 8, lat: 7, rot: 6 } },
  { id: 'C5-C6', lower: 'C6', upper: 'C5', disc: 5.5, angle: -4, rom: { flex: 11, ext: 9, lat: 8, rot: 7 } },
  { id: 'C4-C5', lower: 'C5', upper: 'C4', disc: 5.5, angle: -4, rom: { flex: 11, ext: 9, lat: 11, rot: 7 } },
  { id: 'C3-C4', lower: 'C4', upper: 'C3', disc: 5, angle: -3, rom: { flex: 8, ext: 7, lat: 11, rot: 7 } },
  { id: 'C2-C3', lower: 'C3', upper: 'C2', disc: 4.5, angle: -3, rom: { flex: 5, ext: 5, lat: 10, rot: 3 } },
  { id: 'C1-C2', lower: 'C2', upper: 'C1', disc: 0, angle: 0, rom: { flex: 10, ext: 10, lat: 0, rot: 38 } },
  { id: 'C0-C1', lower: 'C1', upper: 'skull', disc: 0, angle: 2, rom: { flex: 8, ext: 17, lat: 4, rot: 2 } },
];

export const SEGMENT_BY_ID = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]));
export const SEGMENT_BELOW = Object.fromEntries(SEGMENTS.map((s) => [s.upper, s]));
export const SEGMENT_ABOVE = Object.fromEntries(SEGMENTS.map((s) => [s.lower, s]));

// Pelvis: origen del mundo en el centro del eje bicoxofemoral (centro de ambas cabezas femorales).
// Parámetros espinopélvicos medios: incidencia pélvica ~51°, pendiente sacra ~40°, versión pélvica ~11°.
export const PELVIS = {
  sacralSlope: 40,
  s1Center: [0, 113, -21], // centro del platillo de S1 respecto del eje de caderas
  hipHalfWidth: 87,
  femoralHeadR: 23,
};

// Utilidades vectoriales mínimas (sin dependencias)
export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};

// Rotación sagital (alrededor de X): ángulo positivo inclina el eje +Y hacia anterior (+Z)
export function rotX(p, phiDeg) {
  const c = Math.cos(phiDeg * DEG), s = Math.sin(phiDeg * DEG);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}

export function frameToWorld(frame, p) {
  return v3.add(frame.pos, rotX(p, frame.phi));
}
export function worldToFrame(frame, p) {
  return rotX(v3.sub(p, frame.pos), -frame.phi);
}
export function dirToWorld(frame, d) { return rotX(d, frame.phi); }
export function dirToFrame(frame, d) { return rotX(d, -frame.phi); }

// Alturas "de cuerpo" para el sacro (origen en el platillo S1) y para C1 (sin cuerpo)
function bodyHeight(id) {
  if (id === 'S1') return 0;
  if (id === 'C1') return 12;
  return vertebraParams(id).bodyH;
}
function bodyDepth(id) {
  if (id === 'S1') return 33;
  if (id === 'C1') return 14;
  return vertebraParams(id).bodyD;
}

// Pose de reposo (bipedestación): marcos locales {pos, phi} en coordenadas de la pelvis.
// El marco de cada vértebra tiene su origen en el centro del cuerpo vertebral.
export function computeRestPose() {
  const frames = {};
  frames.S1 = { pos: PELVIS.s1Center.slice(), phi: PELVIS.sacralSlope };
  const segs = {};
  let lowerId = 'S1';
  for (const seg of SEGMENTS) {
    const lo = frames[seg.lower];
    const Hlo = bodyHeight(seg.lower);
    const top = frameToWorld(lo, [0, Hlo / 2, 0]);
    const phiMid = lo.phi + seg.angle / 2;
    const phiUp = lo.phi + seg.angle;
    let upperCenter;
    let gap = seg.disc;
    if (seg.id === 'C1-C2') gap = 3; // articulación atloaxoidea lateral
    if (seg.id === 'C0-C1') gap = 3;
    const bottomUp = v3.add(top, rotX([0, gap, 0], phiMid));
    const Hup = seg.upper === 'skull' ? 0 : bodyHeight(seg.upper);
    upperCenter = v3.add(bottomUp, rotX([0, Hup / 2, 0], phiUp));
    frames[seg.upper] = { pos: upperCenter, phi: phiUp };
    // centro instantáneo de rotación: mitad posterior del disco, cerca del platillo inferior
    const Dlo = bodyDepth(seg.lower);
    let pivot;
    if (seg.id === 'C1-C2') pivot = v3.add(top, rotX([0, 8, 1], phiMid)); // eje por la apófisis odontoides
    else if (seg.id === 'C0-C1') pivot = v3.add(top, rotX([0, 6, 2], phiMid));
    else pivot = v3.add(top, rotX([0, gap * 0.4, -Dlo * 0.1], phiMid));
    segs[seg.id] = {
      pivot,
      phiMid,
      discCenter: v3.add(top, rotX([0, gap / 2, 0], phiMid)),
    };
    lowerId = seg.upper;
  }
  return { frames, segs };
}

// Contorno 2D del cuerpo vertebral (sección transversal) como función de distancia aproximada.
// x lateral, z anteroposterior. Se usa igual en el generador de huesos y en los discos.
export function bodySection2D(x, z, p, scale = 1) {
  const a = (p.bodyW / 2) * scale;
  const b = (p.bodyD / 2) * scale;
  // forma "de huevo": más estrecho hacia anterior en torácicas (forma de corazón)
  const egg = p.egg || 0;
  const ax = a * (1 - egg * (z / b));
  const n = p.shapeN || 2;
  const qx = Math.abs(x) / ax;
  const qz = Math.abs(z) / b;
  const r = Math.pow(Math.pow(qx, n) + Math.pow(qz, n), 1 / n);
  let d = (r - 1) * Math.min(ax, b) * 0.92;
  // concavidad posterior (pared del canal)
  if (p.concave) {
    const rc = a * 1.1;
    const cz = -b - rc + p.concave * scale;
    const dc = Math.hypot(x, z - cz) - rc;
    // resta suave
    const k = 3;
    const h = Math.max(k - Math.abs(-dc - d), 0) / k;
    d = Math.max(d, -dc) + h * h * k * 0.25;
  }
  return d;
}

// Muestra el contorno con N puntos (de 0 a 2π, empezando en anterior, sentido antihorario visto desde arriba)
export function bodyOutline(p, N = 48, scale = 1) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const dx = Math.sin(t), dz = Math.cos(t);
    let lo = 0, hi = Math.max(p.bodyW, p.bodyD) * scale;
    for (let it = 0; it < 30; it++) {
      const m = (lo + hi) / 2;
      if (bodySection2D(dx * m, dz * m, p, scale) < 0) lo = m; else hi = m;
    }
    const r = (lo + hi) / 2;
    pts.push([dx * r, dz * r]);
  }
  return pts;
}

// Masas segmentarias (fracción del peso corporal) para el modelo estático de carga
// (Dempster / Winter): cabeza+cuello 8,1 %, tronco 49,7 % (tórax 21,6 %, abdomen 13,9 %, pelvis 14,2 %),
// brazo completo 5 % por lado.
export const MASS_FRACTIONS = { headNeck: 0.081, thorax: 0.216, abdomen: 0.139, pelvis: 0.142, armEach: 0.05 };
