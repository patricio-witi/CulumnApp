// Traduce controles de alto nivel (flexión, inclinación, rotación, lateral shift, sedestación…)
// en ángulos por segmento usando rangos de movimiento publicados.
import * as THREE from 'three';
import { SEGMENTS, DEG } from '../anatomy/spine-data.js';

export const LUMBAR_SEGS = ['L5-S1', 'L4-L5', 'L3-L4', 'L2-L3', 'L1-L2'];
export const THORACIC_SEGS = ['T12-L1', 'T11-T12', 'T10-T11', 'T9-T10', 'T8-T9', 'T7-T8', 'T6-T7', 'T5-T6', 'T4-T5', 'T3-T4', 'T2-T3', 'T1-T2'];
export const CERVICAL_SEGS = ['C7-T1', 'C6-C7', 'C5-C6', 'C4-C5', 'C3-C4', 'C2-C3', 'C1-C2', 'C0-C1'];
const regionOfSeg = (id) => (LUMBAR_SEGS.includes(id) ? 'lumbar' : THORACIC_SEGS.includes(id) ? 'thoracic' : 'cervical');

export const DEFAULT_STATE = {
  flex: 0, // -1 extensión máxima … 1 flexión máxima del tronco (de pie)
  lat: 0, // -1 izquierda … 1 derecha
  rot: 0, // -1 izquierda … 1 derecha
  shift: 0, // lateral shift: -1 hombros a la izquierda … 1 a la derecha
  shiftKyphosis: 0.5, // pérdida de lordosis asociada al shift (0..1)
  hinge: 0, // estrategia de bisagra de cadera (0 = espalda redonda, 1 = espalda neutra)
  sit: 0, // 0 de pie … 1 sentado
  slump: 0, // 0 sentado erguido … 1 encorvado
  neckFlex: 0, neckLat: 0, neckRot: 0,
  gaze: 0.6, // compensación para mantener la mirada horizontal
  region: 'all',
  loadKg: 0,
  bodyKg: 75,
};

// Ritmo lumbopélvico (Esola et al., Spine 1996): 111° totales, 41,6° lumbares; cociente lumbar/cadera
// 1,9 al inicio (0–30°), 0,9 en la fase media y 0,4 al final.
function lumbarShare(T) {
  const phase = (t0, t1, r) => Math.max(0, Math.min(T, t1) - t0) * (r / (1 + r));
  const raw = phase(0, 30, 1.9) + phase(30, 60, 0.9) + phase(60, 111, 0.4);
  const full = 30 * (1.9 / 2.9) + 30 * (0.9 / 1.9) + 51 * (0.4 / 1.4);
  return (raw / full) * 41.6;
}

export class PostureController {
  constructor(rig) {
    this.rig = rig;
    this.state = { ...DEFAULT_STATE };
    this.segs = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]));
    this.info = {};
  }

  set(partial) { Object.assign(this.state, partial); }

  apply() {
    const s = this.state;
    const R = this.rig;
    const out = {};
    for (const seg of SEGMENTS) out[seg.id] = { flex: 0, lat: 0, rot: 0, settle: 0, shift: 0 };
    const reg = s.region;
    const use = (id) => reg === 'all' || reg === regionOfSeg(id);
    let pelvisTilt = 0, pelvisRot = 0, pelvisList = 0, hip = 0;

    // ---- Flexión / extensión del tronco ----
    const f = s.flex;
    let lumbarFlex = 0, hipFlexTrunk = 0;
    if (f > 0) {
      if (reg === 'all') {
        const T = 111 * f;
        lumbarFlex = lumbarShare(T) * (1 - 0.72 * s.hinge);
        hipFlexTrunk = T - lumbarFlex;
        const thor = Math.pow(f, 1.3) * (1 - 0.6 * s.hinge);
        for (const id of THORACIC_SEGS) out[id].flex += this.segs[id].rom.flex * 0.45 * thor;
        for (const id of CERVICAL_SEGS) out[id].flex += this.segs[id].rom.flex * 0.25 * f;
      } else {
        const ids = reg === 'lumbar' ? LUMBAR_SEGS : reg === 'thoracic' ? THORACIC_SEGS : CERVICAL_SEGS;
        for (const id of ids) out[id].flex += this.segs[id].rom.flex * f;
      }
      const sumL = LUMBAR_SEGS.reduce((a, id) => a + this.segs[id].rom.flex, 0);
      for (const id of LUMBAR_SEGS) out[id].flex += (lumbarFlex * this.segs[id].rom.flex) / sumL;
    } else if (f < 0) {
      const e = -f;
      if (reg === 'all') {
        for (const id of LUMBAR_SEGS) out[id].flex -= this.segs[id].rom.ext * e;
        for (const id of THORACIC_SEGS) out[id].flex -= this.segs[id].rom.ext * 0.7 * e;
        for (const id of CERVICAL_SEGS) out[id].flex -= this.segs[id].rom.ext * 0.3 * e;
        hipFlexTrunk = -12 * e; // extensión de cadera / retroversión
      } else {
        const ids = reg === 'lumbar' ? LUMBAR_SEGS : reg === 'thoracic' ? THORACIC_SEGS : CERVICAL_SEGS;
        for (const id of ids) out[id].flex -= this.segs[id].rom.ext * e;
      }
    }
    pelvisTilt += hipFlexTrunk;

    // ---- Inclinación lateral (con acoplamientos) ----
    if (s.lat) {
      for (const seg of SEGMENTS) {
        if (!use(seg.id)) continue;
        const r = regionOfSeg(seg.id);
        const k = r === 'cervical' && reg === 'all' ? 0.35 : 1;
        const a = seg.rom.lat * s.lat * k;
        out[seg.id].lat += a;
        // acoplamiento con rotación: cervical al mismo lado; lumbar alto al lado opuesto, L5-S1 al mismo
        if (r === 'cervical' && seg.id !== 'C0-C1' && seg.id !== 'C1-C2') out[seg.id].rot += a * 0.6;
        if (r === 'lumbar') out[seg.id].rot += seg.id === 'L5-S1' ? a * 0.2 : -a * 0.2;
      }
      if (reg === 'all') pelvisList += -3 * s.lat;
    }

    // ---- Rotación axial ----
    if (s.rot) {
      for (const seg of SEGMENTS) {
        if (!use(seg.id)) continue;
        const r = regionOfSeg(seg.id);
        const k = r === 'cervical' && reg === 'all' ? 0.3 : 1;
        out[seg.id].rot += seg.rom.rot * s.rot * k;
      }
      if (reg === 'all') pelvisRot += 14 * s.rot;
    }

    // ---- Lateral shift: el tronco se desplaza sobre la pelvis manteniéndose vertical ----
    if (s.shift) {
      const sh = s.shift;
      const lower = { 'L5-S1': 1.5, 'L4-L5': 4.5, 'L3-L4': 3.5 };
      const upper = { 'L2-L3': -2.5, 'L1-L2': -2.5, 'T12-L1': -2, 'T11-T12': -1.2, 'T10-T11': -0.8 };
      for (const [id, v] of Object.entries(lower)) out[id].lat += v * sh;
      for (const [id, v] of Object.entries(upper)) out[id].lat += v * sh;
      // rotación acoplada leve y pérdida de lordosis (cifosis antiálgica)
      for (const id of LUMBAR_SEGS) {
        out[id].rot += -0.6 * sh;
        out[id].flex += Math.abs(sh) * s.shiftKyphosis * Math.abs(this.segs[id].angle) * 0.35;
      }
    }

    // ---- Sedestación ----
    // De pie → sentado erguido: la pelvis rota ~18° hacia atrás y la lordosis lumbar se reduce ~40 %.
    // Encorvado: la pelvis llega a ~38° de retroversión y la lumbar se acerca a su flexión máxima (~85 % del rango).
    if (s.sit > 0) {
      const t = s.sit;
      hip = 88 * t;
      const slump = s.slump;
      pelvisTilt += (-18 - 20 * slump) * t;
      for (const id of LUMBAR_SEGS) {
        const lord = Math.abs(this.segs[id].angle);
        const upright = lord * 0.4;
        const target = upright + slump * Math.max(0, this.segs[id].rom.flex * 0.85 - upright);
        out[id].flex += target * t;
      }
      for (const id of THORACIC_SEGS) out[id].flex += this.segs[id].rom.flex * 0.35 * slump * t;
    }

    // ---- Cuello ----
    for (const id of CERVICAL_SEGS) {
      const sg = this.segs[id];
      if (s.neckFlex > 0) out[id].flex += sg.rom.flex * s.neckFlex;
      else if (s.neckFlex < 0) out[id].flex += sg.rom.ext * s.neckFlex;
      out[id].lat += sg.rom.lat * s.neckLat;
      if (id !== 'C0-C1' && id !== 'C1-C2' && s.neckLat) out[id].rot += sg.rom.lat * s.neckLat * 0.6;
      out[id].rot += sg.rom.rot * s.neckRot;
    }

    // límites por segmento (no superar el rango fisiológico)
    for (const seg of SEGMENTS) {
      const o = out[seg.id];
      o.flex = THREE.MathUtils.clamp(o.flex, -seg.rom.ext * 1.05, seg.rom.flex * 1.05);
      o.lat = THREE.MathUtils.clamp(o.lat, -seg.rom.lat * 1.6 - 1, seg.rom.lat * 1.6 + 1);
      o.rot = THREE.MathUtils.clamp(o.rot, -seg.rom.rot * 1.6 - 0.5, seg.rom.rot * 1.6 + 0.5);
    }

    R.pelvisTilt = pelvisTilt;
    R.pelvisRot = pelvisRot;
    R.pelvisList = pelvisList;
    R.hipFlex.L = hip + pelvisTilt * 0; // fémures: sólo cambian al sentarse (los pies quedan en el suelo de pie)
    R.hipFlex.R = hip;
    for (const seg of SEGMENTS) Object.assign(R.segmentState[seg.id], out[seg.id]);
    R.applyPose();

    // Compensación de la mirada: mantener la cabeza nivelada repartiendo en la columna cervical
    if (s.gaze > 0 && !(f > 0.25 && reg === 'all')) {
      const head = new THREE.Quaternion();
      R.bones.skull.getWorldQuaternion(head);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(head);
      const pitch = Math.atan2(-fwd.y, Math.hypot(fwd.x, fwd.z)) / DEG; // + = mira hacia abajo
      const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(head);
      const roll = Math.atan2(-upv.x, upv.y) / DEG; // + = cabeza inclinada a la derecha
      const share = { 'C0-C1': 0.3, 'C1-C2': 0.15, 'C2-C3': 0.12, 'C3-C4': 0.12, 'C4-C5': 0.12, 'C5-C6': 0.1, 'C6-C7': 0.09 };
      const g = s.gaze * (s.neckFlex || s.neckLat ? 0 : 1);
      for (const [id, w] of Object.entries(share)) {
        const st = R.segmentState[id];
        const sg = this.segs[id];
        st.flex = THREE.MathUtils.clamp(st.flex - pitch * w * g, -sg.rom.ext * 1.1, sg.rom.flex * 1.1);
        if (sg.rom.lat) st.lat = THREE.MathUtils.clamp(st.lat - roll * w * g * 1.1, -sg.rom.lat * 1.6, sg.rom.lat * 1.6);
      }
      R.applyPose();
    }

    // resumen para la interfaz
    const sum = (ids, k) => ids.reduce((a, id) => a + R.segmentState[id][k], 0);
    this.info = {
      lumbarFlex: sum(LUMBAR_SEGS, 'flex'),
      thoracicFlex: sum(THORACIC_SEGS, 'flex'),
      cervicalFlex: sum(CERVICAL_SEGS, 'flex'),
      lumbarLat: sum(LUMBAR_SEGS, 'lat'),
      thoracicLat: sum(THORACIC_SEGS, 'lat'),
      lumbarRot: sum(LUMBAR_SEGS, 'rot'),
      thoracicRot: sum(THORACIC_SEGS, 'rot'),
      cervicalRot: sum(CERVICAL_SEGS, 'rot'),
      hip: pelvisTilt,
      trunk: sum(LUMBAR_SEGS, 'flex') + pelvisTilt,
      sit: s.sit,
    };
    return this.info;
  }
}

// Interpolación animada entre estados
export class PostureAnimator {
  constructor(ctrl) { this.ctrl = ctrl; this.track = null; }
  play(keys, onDone) {
    // keys: [{t: segundos, state: {...}}] (el estado inicial es el actual)
    const resolved = [{ t: 0, state: { ...this.ctrl.state } }];
    for (const k of keys) resolved.push({ t: k.t, state: { ...resolved[resolved.length - 1].state, ...k.state } });
    this.track = { keys: resolved, t0: performance.now(), onDone };
  }
  stop() { this.track = null; }
  get playing() { return !!this.track; }
  tick(now) {
    if (!this.track) return false;
    const { keys, t0 } = this.track;
    const t = (now - t0) / 1000;
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1];
    const u = THREE.MathUtils.clamp((t - a.t) / Math.max(1e-3, b.t - a.t), 0, 1);
    const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    const st = {};
    for (const k of Object.keys(b.state)) {
      const va = a.state[k] ?? this.ctrl.state[k];
      const vb = b.state[k];
      st[k] = typeof vb === 'number' ? va + (vb - va) * e : vb;
    }
    // claves acumuladas: los valores no mencionados se mantienen
    this.ctrl.set(st);
    if (t >= keys[keys.length - 1].t) {
      const done = this.track.onDone;
      this.track = null;
      done && done();
    }
    return true;
  }
}
