// Métricas biomecánicas derivadas de la pose simulada.
// Modelo estático sagital simplificado (tipo Chaffin): NO es una medición clínica.
import * as THREE from 'three';
import { MASS_FRACTIONS } from '../anatomy/spine-data.js';

const G = 9.81;
const EXT_ARM = 0.055; // brazo de palanca de los extensores en L4-L5 (m), ~5–6 cm
const DISC_AREA = { 'L3-L4': 1700, 'L4-L5': 1800, 'L5-S1': 1750 }; // mm²

// Valores de referencia in vivo, L4-L5 (Wilke et al., Spine 1999; n = 1, varón de 45 años, 70 kg)
export const WILKE = [
  { label: 'Acostado boca arriba', mpa: 0.1 },
  { label: 'Acostado de lado', mpa: 0.12 },
  { label: 'Sentado relajado sin respaldo', mpa: 0.46 },
  { label: 'De pie relajado', mpa: 0.5 },
  { label: 'Sentado erguido activamente', mpa: 0.55 },
  { label: 'Sentado muy encorvado', mpa: 0.83 },
  { label: 'De pie, inclinado hacia delante', mpa: 1.1 },
  { label: 'Levantar 20 kg con rodillas flexionadas', mpa: 1.7 },
  { label: 'Levantar 20 kg con la espalda redonda', mpa: 2.3 },
];

export class Biomech {
  constructor(rig, discs, registry, resolver, items) {
    this.rig = rig;
    this.discs = discs;
    this.registry = registry;
    this.items = items; // { muscles, nerves }
    this.resolver = resolver;
    this.rest = {};
    // landmarks para forámenes
    this.foramenPairs = {};
    for (const [seg, up, lo] of [['L3-L4', 'L3', 'L4'], ['L4-L5', 'L4', 'L5'], ['L5-S1', 'L5', null], ['L2-L3', 'L2', 'L3'], ['L1-L2', 'L1', 'L2']]) {
      for (const s of ['L', 'R']) {
        const a = resolver.resolve(`${up}.pedBot${s}`);
        const b = lo ? resolver.resolve(`${lo}.pedTop${s}`) : resolver.resolve(`sacrum.alaTop${s}`);
        this.foramenPairs[seg + s] = { a, b };
      }
    }
    this.compute();
    this.restMetrics = JSON.parse(JSON.stringify(this.metrics));
  }

  wp(anchor, v = new THREE.Vector3()) {
    return v.copy(anchor.local).applyMatrix4(this.rig.bones[anchor.bone].matrixWorld);
  }

  compute(posture = { loadKg: 0, bodyKg: 75 }, flexRelax = 0) {
    const R = this.rig;
    const bw = posture.bodyKg || 75;
    const disc = this.discs.byId['L4-L5'];
    const mLo = R.bones.L5.matrixWorld, mUp = R.bones.L4.matrixWorld;
    const c = new THREE.Vector3(0, R.bones.L5 ? 13 : 0, -3).applyMatrix4(mLo).lerp(new THREE.Vector3(0, -13, -3).applyMatrix4(mUp), 0.5);
    const q = new THREE.Quaternion();
    new THREE.Matrix4().extractRotation(mLo).decompose(new THREE.Vector3(), q, new THREE.Vector3());
    const q2 = new THREE.Quaternion();
    new THREE.Matrix4().extractRotation(mUp).decompose(new THREE.Vector3(), q2, new THREE.Vector3());
    q.slerp(q2, 0.5);
    const discNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    // centros de masa del cuerpo por encima de L4-L5
    const pt = (bone, local) => new THREE.Vector3(...local).applyMatrix4(R.bones[bone].matrixWorld);
    const masses = [
      { m: MASS_FRACTIONS.headNeck * bw, p: pt('skull', [0, 55, 12]) },
      { m: MASS_FRACTIONS.thorax * bw, p: pt('T7', [0, 0, 55]) },
      { m: MASS_FRACTIONS.abdomen * 0.7 * bw, p: pt('L2', [0, -5, 40]) },
      { m: MASS_FRACTIONS.armEach * bw, p: pt('shoulderL', [175, 380, -10]) },
      { m: MASS_FRACTIONS.armEach * bw, p: pt('shoulderR', [-175, 380, -10]) },
    ];
    // carga en las manos: brazos colgando bajo los hombros
    if (posture.loadKg > 0) {
      const sh = pt('shoulderL', [175, 516, -15]).add(pt('shoulderR', [-175, 516, -15])).multiplyScalar(0.5);
      masses.push({ m: posture.loadKg, p: sh.clone().add(new THREE.Vector3(0, -600, 60)) });
    }
    let W = 0, M = 0, Mlat = 0;
    for (const { m, p } of masses) {
      W += m * G;
      M += m * G * ((p.z - c.z) / 1000); // momento flexor (N·m) si la masa está por delante
      Mlat += m * G * ((p.x - c.x) / 1000);
    }
    // fuerza extensora necesaria; en relajación-flexión los tejidos pasivos asumen gran parte
    const Mext = Math.max(0, M);
    const passiveShare = flexRelax;
    const Fm = (Mext / EXT_ARM) * (1 - 0.7 * passiveShare) + (Mext / 0.04) * 0.7 * passiveShare * 0.85;
    // componente de peso a lo largo del eje del disco y cizalla
    const gravity = new THREE.Vector3(0, -W, 0);
    const axial = -gravity.dot(discNormal);
    const shear = Math.sqrt(Math.max(0, W * W - axial * axial));
    const comp = axial + Fm + Math.abs(Mlat) / 0.07 * 0.6;
    const area = DISC_AREA['L4-L5'];
    const mpa = (1.5 * comp) / area; // Nachemson: presión ≈ 1,5 × fuerza / área
    // forámenes
    const foramen = {};
    for (const [k, { a, b }] of Object.entries(this.foramenPairs)) foramen[k] = this.wp(a).distanceTo(this.wp(b));
    // raíces
    const roots = {};
    for (const n of this.items.nerves) if (n.root) roots[n.id] = { strain: n.strands[0].strain, root: n.root, side: n.side };
    this.metrics = { comp, shear, M, Mlat, mpa, Fm, W, foramen, roots, discCenter: c };
    return this.metrics;
  }

  // % de cambio de altura foraminal respecto de reposo
  foramenChange(key) {
    const r = this.restMetrics?.foramen?.[key];
    if (!r) return 0;
    return (this.metrics.foramen[key] - r) / r;
  }
}

// Qué raíz afecta una hernia: paracentral/subarticular → raíz que "atraviesa" (nivel inferior);
// foraminal/extraforaminal → raíz que "sale" (mismo nivel); central → saco dural / cauda equina.
export function affectedRoot(segId, zone) {
  const [up, lo] = segId.split('-');
  if (zone === 'foraminal' || zone === 'extraforaminal') return up;
  if (zone === 'central') return lo === 'S1' ? 'S1' : lo;
  return lo;
}

// Índice ilustrativo de compresión radicular (0–1): depende del tipo de hernia y de la geometría simulada
export function compressionIndex(type, zone, ctx) {
  const base = { none: 0, bulge: 0.12, protrusion: 0.38, extrusion: 0.62, sequestration: 0.55 }[type] || 0;
  if (!base) return 0;
  const push = ctx.push || 0; // empuje del núcleo hacia la hernia (−0,8 … 1,6)
  const forChange = ctx.foramenChange || 0; // −0,3 … +0,3
  const strain = Math.max(0, ctx.rootStrain || 0);
  let k = base * (1 + 0.45 * push);
  if (zone === 'foraminal' || zone === 'extraforaminal') k *= 1 - 2.2 * forChange;
  else k *= 1 - 0.8 * forChange;
  k *= 1 + 6 * strain;
  k *= 1 + (ctx.gradeFactor || 0);
  return THREE.MathUtils.clamp(k, 0, 1);
}

// Activación muscular estimada (0–1) a partir de demandas de momento y del tipo de movimiento.
// Reglas cualitativas basadas en estudios EMG clásicos (relajación-flexión, rotación con oblicuos cruzados).
export function estimateActivation(info, metrics, state) {
  const A = {};
  const flex = state.flex, lat = state.lat, rot = state.rot;
  const ext = Math.max(0, metrics.M) / 140; // demanda extensora normalizada
  const frZone = state.sit ? 0 : THREE.MathUtils.smoothstep(flex, 0.66, 0.8); // relajación-flexión (~2/3 de la flexión máx.)
  const erector = THREE.MathUtils.clamp(ext * (1 - 0.85 * frZone) + 0.06, 0, 1);
  const set = (ids, side, v) => { for (const id of ids) A[id + side] = Math.max(A[id + side] || 0, THREE.MathUtils.clamp(v, 0, 1)); };
  const ES = ['longLumb', 'iliocLumb', 'longThor', 'iliocThor', 'multifidus', 'spinalis', 'iliocThoracis'];
  const latL = Math.max(0, lat), latR = Math.max(0, -lat); // lat>0: inclinación a la derecha → izquierda (convexa) frena
  set(ES, 'L', erector + latL * 0.55 + Math.abs(state.shift) * 0.25);
  set(ES, 'R', erector + latR * 0.55 + Math.abs(state.shift) * 0.25);
  set(['ql'], 'L', 0.08 + latL * 0.75 + (state.shift > 0 ? 0.45 * state.shift : 0));
  set(['ql'], 'R', 0.08 + latR * 0.75 + (state.shift < 0 ? -0.45 * state.shift : 0));
  // rotación derecha: oblicuo externo izquierdo + oblicuo interno derecho; multífido/rotadores contralaterales
  const rr = Math.max(0, rot), rl = Math.max(0, -rot);
  set(['eo'], 'L', 0.05 + rr * 0.8); set(['io'], 'R', 0.05 + rr * 0.75);
  set(['eo'], 'R', 0.05 + rl * 0.8); set(['io'], 'L', 0.05 + rl * 0.75);
  set(['multifidus', 'rotatores'], 'L', erector + rr * 0.45); set(['multifidus', 'rotatores'], 'R', erector + rl * 0.45);
  // extensión: los abdominales controlan la caída hacia atrás
  const back = Math.max(0, -flex);
  set(['rectus', 'eo', 'io'], 'L', 0.05 + back * 0.6); set(['rectus', 'eo', 'io'], 'R', 0.05 + back * 0.6);
  set(['ta'], 'L', 0.15 + erector * 0.3); set(['ta'], 'R', 0.15 + erector * 0.3);
  // extensores de cadera al inclinarse hacia delante
  const hipDemand = Math.max(0, info.hip || 0) / 70;
  set(['gmax'], 'L', hipDemand * 0.7); set(['gmax'], 'R', hipDemand * 0.7);
  set(['gmed'], 'L', 0.1 + latR * 0.3); set(['gmed'], 'R', 0.1 + latL * 0.3);
  // psoas: sedestación erguida y estabilización
  set(['psoas', 'iliacus'], 'L', 0.06 + state.sit * (1 - state.slump) * 0.35);
  set(['psoas', 'iliacus'], 'R', 0.06 + state.sit * (1 - state.slump) * 0.35);
  // cuello
  const neck = Math.max(0, state.neckFlex) * 0.4 + Math.max(0, flex) * 0.25;
  set(['semispinalisCap', 'spleniusCap', 'spleniusCerv', 'longCap', 'trapezius'], 'L', 0.05 + neck + Math.max(0, -state.neckRot) * 0.4);
  set(['semispinalisCap', 'spleniusCap', 'spleniusCerv', 'longCap', 'trapezius'], 'R', 0.05 + neck + Math.max(0, state.neckRot) * 0.4);
  return { A, frZone, erector };
}
