// Discos intervertebrales deformables (CPU).
// Estructura: anillo fibroso de láminas concéntricas (fibras alternas ±30°), núcleo pulposo,
// platillos cartilaginosos arriba y abajo. El anillo se abomba donde se comprime y el núcleo
// migra hacia el lado que se abre. La patología altera altura, color, abre una fisura radial
// y deja salir material nuclear (protrusión/extrusión/secuestro).
import * as THREE from 'three';
import { SEGMENTS, vertebraParams } from '../anatomy/spine-data.js';
import { CAP_GLSL } from '../core/bones.js';

const N = 48; // puntos del contorno
const M = 10; // anillos en altura
const LAMELLAE = [1, 0.87, 0.75, 0.64, 0.54]; // factor radial de cada lámina (exterior → interior)
const DETAILED = ['T12-L1', 'L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1'];

export const PFIRRMANN = {
  1: { loss: 0, nucleus: 1.0, nColor: 0xcfe6f2, aColor: 0xf3f4f1, label: 'I · normal' },
  2: { loss: 0.02, nucleus: 0.95, nColor: 0xc4d9e2, aColor: 0xeeefe8, label: 'II · cambios mínimos' },
  3: { loss: 0.12, nucleus: 0.8, nColor: 0xb9c2bf, aColor: 0xe6e1cf, label: 'III · degeneración moderada' },
  4: { loss: 0.3, nucleus: 0.62, nColor: 0xb2a98e, aColor: 0xdccfac, label: 'IV · degeneración avanzada' },
  5: { loss: 0.58, nucleus: 0.42, nColor: 0x8f7f63, aColor: 0xcdbb90, label: 'V · disco colapsado' },
};

// breach = cuántas láminas (desde dentro) atraviesa la fisura radial
export const HERNIA = {
  none: { mag: 0, sigma: 0.3, blob: 0, breach: 0, label: 'Sin hernia' },
  fissure: { mag: 0.9, sigma: 0.22, blob: 0, breach: 4, label: 'Fisura anular radial (sin hernia)' },
  bulge: { mag: 2.2, sigma: 0.95, blob: 0, breach: 0, label: 'Abombamiento (>25 % de la circunferencia)' },
  protrusion: { mag: 3.6, sigma: 0.3, blob: 3.8, breach: 4, label: 'Protrusión (base más ancha que la cúpula)' },
  extrusion: { mag: 4.2, sigma: 0.24, blob: 5.2, breach: 5, label: 'Extrusión (cúpula más ancha que la base)' },
  sequestration: { mag: 2.8, sigma: 0.22, blob: 4.6, breach: 5, label: 'Secuestro (fragmento libre)' },
};
// ángulo medido desde anterior (+Z) hacia la izquierda (+X)
export const ZONES = {
  central: { angle: Math.PI, label: 'Central' },
  paracentral: { angle: Math.PI - 0.42, label: 'Paracentral / subarticular' },
  foraminal: { angle: Math.PI - 0.95, label: 'Foraminal' },
  extraforaminal: { angle: Math.PI - 1.22, label: 'Extraforaminal' },
};

function annulusTexture() {
  const W = 512, H = 128;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, W, H);
  // fibras de colágeno a unos 30° (la lámina siguiente se espeja en la UV)
  g.strokeStyle = 'rgba(255,255,255,0.42)';
  g.lineWidth = 2.2;
  for (let x = -W; x < W * 2; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H / 0.58, H); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,0.22)';
  g.lineWidth = 1;
  for (let x = -W + 4; x < W * 2; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H / 0.58, H); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export class DiscSystem {
  constructor(rig, bonesJson) {
    this.rig = rig;
    this.group = new THREE.Group();
    this.group.name = 'discos';
    this.discs = [];
    this.pathology = {};
    this.pressureView = false;
    this.xray = false;
    this.interior = false;
    this.cutaway = null; // id del disco cortado en cuadrante
    this.layerVisible = true;
    this.stress = null; // { seg, angle, amount } punto de tensión (mala fuerza)
    this.inflam = {}; // seg → 0..1 (tejido de granulación en la fisura)
    const recs = Object.fromEntries(bonesJson.bones.map((b) => [b.name, b]));
    const bump = annulusTexture();
    this.makeAnnulusMat = () => {
      const m = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, vertexColors: true, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.3,
        sheen: 0.5, sheenColor: new THREE.Color(0xffffff), bumpMap: bump, bumpScale: 0.7, side: THREE.DoubleSide,
        clipIntersection: true,
      });
      m.userData.uniforms = { uHighlight: { value: new THREE.Color(0, 0, 0) }, uCapColor: { value: new THREE.Color(0xe2ded2) } };
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, m.userData.uniforms);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform vec3 uHighlight;\nuniform vec3 uCapColor;\n' + CAP_GLSL)
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uHighlight;')
          .replace('#include <dithering_fragment>', `#include <dithering_fragment>
            if (!gl_FrontFacing) gl_FragColor = vec4(vColor.rgb * uCapColor * 0.95, gl_FragColor.a);`);
      };
      m.customProgramCacheKey = () => 'annulus2';
      return m;
    };
    this.endplateMat = () => new THREE.MeshPhysicalMaterial({ color: 0xc9dce6, roughness: 0.25, clearcoat: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.92, clipIntersection: true });
    this.nucleusMat = new THREE.MeshPhysicalMaterial({ color: 0xcfe6f2, roughness: 0.12, clearcoat: 0.9, clearcoatRoughness: 0.08, sheen: 0.7, sheenColor: new THREE.Color(0xe8f6ff), transparent: true, opacity: 0.94 });
    const sphere = new THREE.SphereGeometry(1, 28, 18);

    for (const seg of SEGMENTS) {
      if (!seg.disc) continue;
      const lowerRec = seg.lower === 'S1' ? recs.L5 : recs[seg.lower];
      const upperRec = recs[seg.upper];
      const lowerP = seg.lower === 'S1' ? null : vertebraParams(seg.lower);
      const upperP = vertebraParams(seg.upper);
      const oLo = (seg.lower === 'S1' ? upperRec.outlineTop : lowerRec.outlineTop).map(([x, z]) => [x * (seg.lower === 'S1' ? 0.98 : 1), z]);
      const oUp = upperRec.outlineTop;
      const lam = DETAILED.includes(seg.id) ? LAMELLAE : [1];
      const L = lam.length;
      const vcount = L * N * (M + 1);
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(vcount * 3), col = new Float32Array(vcount * 3), uv = new Float32Array(vcount * 2);
      for (let l = 0; l < L; l++) for (let j = 0; j <= M; j++) for (let i = 0; i < N; i++) {
        const v = (l * (M + 1) + j) * N + i;
        // fibras alternas: la lámina impar refleja la UV
        uv[v * 2] = (l % 2 ? -1 : 1) * (i / N) * 4 * (0.6 + 0.4 * lam[l]);
        uv[v * 2 + 1] = j / M;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const mat = this.makeAnnulusMat();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = 'disc:' + seg.id;
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // platillos cartilaginosos (abajo y arriba)
      const eg = new THREE.BufferGeometry();
      const epos = new Float32Array((N + 1) * 2 * 3);
      const eidx = [];
      for (let c = 0; c < 2; c++) {
        const base = c * (N + 1);
        for (let i = 0; i < N; i++) eidx.push(base + N, base + i, base + ((i + 1) % N));
      }
      eg.setAttribute('position', new THREE.BufferAttribute(epos, 3));
      eg.setIndex(eidx);
      const endplates = new THREE.Mesh(eg, this.endplateMat());
      endplates.frustumCulled = false;
      endplates.name = 'endplate:' + seg.id;
      const nucleus = new THREE.Mesh(sphere, this.nucleusMat.clone());
      nucleus.matrixAutoUpdate = false;
      nucleus.name = 'nucleus:' + seg.id;
      const blob = new THREE.Mesh(sphere, this.nucleusMat.clone());
      blob.matrixAutoUpdate = false;
      blob.visible = false;
      blob.name = 'hernia:' + seg.id;
      // "lengua" de material nuclear que atraviesa la fisura
      const tg = new THREE.BufferGeometry();
      const TS = 12, TR = 8;
      tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array((TS + 1) * (TR + 1) * 3), 3));
      const tidx = [];
      for (let a = 0; a < TS; a++) for (let b = 0; b < TR; b++) {
        const i0 = a * (TR + 1) + b, i1 = i0 + TR + 1;
        tidx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1);
      }
      tg.setIndex(tidx);
      const tongue = new THREE.Mesh(tg, blob.material);
      tongue.frustumCulled = false;
      tongue.visible = false;
      tongue.name = 'tongue:' + seg.id;
      const Hlo = seg.lower === 'S1' ? -0.6 : lowerP.bodyH;
      const Hup = upperP.bodyH;
      const W = (upperP.bodyW + (lowerP ? lowerP.bodyW : upperP.bodyW)) / 2;
      const D = (upperP.bodyD + (lowerP ? lowerP.bodyD : upperP.bodyD)) / 2;
      const d = {
        seg, mesh, endplates, nucleus, blob, tongue, oLo, oUp, Hlo, Hup, W, D, lam,
        lowerBone: seg.lower, upperBone: seg.upper,
        h0: new Float32Array(N), delta: new Float32Array(N),
        state: { nucleusShift: new THREE.Vector2(), compAnt: 0, compPost: 0, compL: 0, compR: 0, meanH: 0, push: 0, herniaCenter: new THREE.Vector3(), herniaR: 0, fissureWorld: new THREE.Vector3(), radial: new THREE.Vector3() },
        planes: [new THREE.Plane(), new THREE.Plane()],
      };
      const item = { kind: 'disc', key: 'disc:' + seg.id, id: seg.id, name: `Disco intervertebral ${seg.id}`, mesh, nucleus, disc: d };
      mesh.userData.item = item;
      endplates.userData.item = { ...item, key: 'endplate:' + seg.id, kind: 'endplate', name: `Platillos cartilaginosos ${seg.id}`, mesh: endplates };
      nucleus.userData.item = { ...item, key: 'nucleus:' + seg.id, kind: 'nucleus', name: `Núcleo pulposo ${seg.id}` };
      blob.userData.item = { ...item, key: 'hernia:' + seg.id, kind: 'hernia', name: `Material discal herniado ${seg.id}` };
      tongue.userData.item = blob.userData.item;
      d.item = item;
      this.group.add(mesh, endplates, nucleus, blob, tongue);
      this.discs.push(d);
    }
    this.byId = Object.fromEntries(this.discs.map((d) => [d.seg.id, d]));
    this._v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    this.captureRest();
    this.setPathology({});
  }

  endpoints(d, i, bot, top) {
    const mLo = this.rig.bones[d.lowerBone].matrixWorld;
    const mUp = this.rig.bones[d.upperBone].matrixWorld;
    const [xl, zl] = d.oLo[i];
    const [xu, zu] = d.oUp[i];
    bot.set(xl, d.Hlo / 2 - 0.5, zl).applyMatrix4(mLo);
    top.set(xu, -d.Hup / 2 + 0.5, zu).applyMatrix4(mUp);
  }

  captureRest() {
    const [bot, top] = this._v;
    for (const d of this.discs) for (let i = 0; i < N; i++) { this.endpoints(d, i, bot, top); d.h0[i] = bot.distanceTo(top); }
  }

  hAngle(d) { return d.side === 'L' ? ZONES[d.zone].angle : Math.PI * 2 - ZONES[d.zone].angle; }

  // índices: lámina exterior siempre; interiores sólo si se ve el interior; la fisura abre una cuña
  rebuildIndex(d) {
    const idx = [];
    const L = d.lam.length;
    const H = HERNIA[d.hern || 'none'];
    const breach = Math.min(L, H.breach || 0);
    const ha = this.hAngle(d);
    const half = 0.17;
    const show = this.interior || this.cutaway === d.seg.id || this.xray;
    for (let l = 0; l < (show ? L : 1); l++) {
      const torn = l >= L - breach; // las láminas internas se rompen primero
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
        if (torn && breach) {
          const th = ((i + 0.5) / N) * Math.PI * 2;
          let da = Math.abs(th - ha); da = Math.min(da, Math.PI * 2 - da);
          if (da < half * (1 + 0.15 * (L - 1 - l))) continue;
        }
        const a = (l * (M + 1) + j) * N + i, b = (l * (M + 1) + j) * N + ((i + 1) % N);
        const c = a + N, e = b + N;
        idx.push(a, c, b, b, c, e);
      }
    }
    d.mesh.geometry.setIndex(idx);
    d.endplates.visible = show && this.layerVisible;
  }

  setPathology(p) {
    this.pathology = p || {};
    for (const d of this.discs) {
      const pt = this.pathology[d.seg.id];
      const grade = pt?.grade || 1;
      const G = PFIRRMANN[grade];
      d.grade = grade;
      d.nucleus.material.color.setHex(G.nColor);
      d.blob.material.color.setHex(0xe8e2c4);
      d.aColor = new THREE.Color(G.aColor);
      d.hern = pt?.hern || 'none';
      d.zone = pt?.zone || 'paracentral';
      d.side = pt?.side || 'L';
      d.size = pt?.size ?? 1; // escala del material herniado (reabsorción)
      this.rig.discLoss[d.seg.id] = d.seg.disc * G.loss;
      this.rebuildIndex(d);
    }
  }

  setInterior(on) {
    if (this.interior === on) return;
    this.interior = on;
    for (const d of this.discs) this.rebuildIndex(d);
  }

  // corte en cuadrante del disco (y de sus dos vértebras, como en las láminas de los atlas)
  setCutaway(segId, boneMeshes = null) {
    this.cutaway = segId || null;
    for (const d of this.discs) {
      const on = d.seg.id === this.cutaway;
      for (const m of [d.mesh.material, d.endplates.material]) { m.clippingPlanes = on ? d.planes : null; m.needsUpdate = true; }
      this.rebuildIndex(d);
      if (boneMeshes) for (const b of [d.lowerBone === 'S1' ? 'sacrum' : d.lowerBone, d.upperBone]) {
        const bm = boneMeshes[b]?.mesh?.material;
        if (!bm) continue;
        bm.clippingPlanes = on ? d.planes : (bm.clippingPlanes && bm.clippingPlanes === d.planes ? null : bm.clippingPlanes);
        bm.clipIntersection = true;
        bm.needsUpdate = true;
      }
    }
  }

  update(load = 1, camera = null) {
    const [bot, top, rad, tmp, mid] = this._v;
    const qLo = new THREE.Quaternion(), qUp = new THREE.Quaternion(), qMid = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const cold = new THREE.Color(0x4f8fd6), neutral = new THREE.Color(0xe6e6e0), hot = new THREE.Color(0xe0412a);
    const granul = new THREE.Color(0xb3352a), flash = new THREE.Color(0xff5a1f);
    const cc = new THREE.Color();
    const cBot = new THREE.Vector3(), cTop = new THREE.Vector3(), lb = new THREE.Vector3(), lt = new THREE.Vector3();
    for (const d of this.discs) {
      const pos = d.mesh.geometry.attributes.position.array;
      const col = d.mesh.geometry.attributes.color.array;
      const mLo = this.rig.bones[d.lowerBone].matrixWorld;
      const mUp = this.rig.bones[d.upperBone].matrixWorld;
      mLo.decompose(tmp, qLo, s);
      mUp.decompose(tmp, qUp, s);
      qMid.slerpQuaternions(qLo, qUp, 0.5);
      cBot.set(0, d.Hlo / 2 - 0.5, 0).applyMatrix4(mLo);
      cTop.set(0, -d.Hup / 2 + 0.5, 0).applyMatrix4(mUp);
      // compresión por borde
      let cA = 0, cP = 0, cL = 0, cR = 0, hSum = 0;
      for (let i = 0; i < N; i++) {
        this.endpoints(d, i, bot, top);
        const h = bot.distanceTo(top);
        hSum += h;
        const del = d.h0[i] - h;
        d.delta[i] = del;
        const th = (i / N) * Math.PI * 2;
        cA += del * Math.max(0, Math.cos(th)); cP += del * Math.max(0, -Math.cos(th));
        cL += del * Math.max(0, Math.sin(th)); cR += del * Math.max(0, -Math.sin(th));
      }
      const norm = N / Math.PI;
      d.state.compAnt = cA / norm; d.state.compPost = cP / norm; d.state.compL = cL / norm; d.state.compR = cR / norm;
      d.state.meanH = hSum / N;
      const shiftZ = THREE.MathUtils.clamp(-(d.state.compAnt - d.state.compPost) * 0.38, -d.D * 0.08, d.D * 0.08);
      const shiftX = THREE.MathUtils.clamp(-(d.state.compL - d.state.compR) * 0.38, -d.W * 0.07, d.W * 0.07);
      d.state.nucleusShift.set(shiftX, shiftZ);
      const G = PFIRRMANN[d.grade || 1];
      const H = HERNIA[d.hern || 'none'];
      const hasH = d.hern !== 'none';
      const hAngle = hasH ? this.hAngle(d) : 0;
      const push = hasH ? shiftX * Math.sin(hAngle) + shiftZ * Math.cos(hAngle) : 0;
      const pushN = THREE.MathUtils.clamp(push / 0.8, -0.8, 1.6);
      d.state.push = pushN;
      const sizeK = d.size ?? 1;
      const hMag = H.mag * (1 + (d.hern === 'sequestration' ? 0 : 0.55 * pushN)) * (0.4 + 0.6 * sizeK);
      const degBulge = (d.grade >= 3 ? 0.4 : 0) + (d.grade >= 4 ? 0.5 : 0);
      const irreg = Math.max(0, d.grade - 2) * 0.55;
      const inflam = this.inflam[d.seg.id] || 0;
      const st = this.stress && this.stress.seg === d.seg.id ? this.stress : null;
      const L = d.lam.length;
      for (let i = 0; i < N; i++) {
        this.endpoints(d, i, bot, top);
        const [xl, zl] = d.oLo[i];
        rad.set(xl, 0, zl).applyQuaternion(qMid).normalize();
        const th = (i / N) * Math.PI * 2;
        let dA = Math.abs(th - hAngle); dA = Math.min(dA, Math.PI * 2 - dA);
        const lobe = hasH ? hMag * Math.exp(-((dA / H.sigma) ** 2)) : 0;
        let dS = 0;
        if (st) { dS = Math.abs(th - st.angle); dS = Math.min(dS, Math.PI * 2 - dS); }
        const stressK = st ? st.amount * Math.exp(-((dS / 0.5) ** 2)) : 0;
        const del = d.delta[i];
        const bul = Math.max(-0.5, 0.55 + 0.6 * del + degBulge);
        for (let l = 0; l < L; l++) {
          const f = d.lam[l];
          // borde de la lámina interior: interpolado hacia el centro del disco
          lb.copy(cBot).lerp(bot, f);
          lt.copy(cTop).lerp(top, f);
          const wob = l > 0 ? irreg * Math.sin(i * 1.9 + l * 2.3) * (1 - f * 0.6) : 0;
          for (let j = 0; j <= M; j++) {
            const t = j / M;
            const env = Math.pow(Math.sin(Math.PI * t), 0.75);
            const o = ((l * (M + 1) + j) * N + i) * 3;
            // las láminas internas de un disco degenerado tienden a abombarse hacia dentro
            const inward = l > 0 && d.grade >= 4 ? -0.8 * (d.grade - 3) * env : 0;
            tmp.copy(lb).lerp(lt, t).addScaledVector(rad, (bul * env) * Math.pow(f, 1.5) + lobe * Math.pow(Math.sin(Math.PI * t), 0.55) * Math.pow(f, 3) + wob * env + inward);
            pos[o] = tmp.x; pos[o + 1] = tmp.y; pos[o + 2] = tmp.z;
            if (this.pressureView) {
              const k = THREE.MathUtils.clamp((del / Math.max(1, d.h0[i])) * 6 * load + (load - 1) * 0.35, -1, 1);
              cc.copy(neutral).lerp(k > 0 ? hot : cold, Math.abs(k));
            } else {
              cc.copy(d.aColor || neutral);
              // las láminas internas son más claras y translúcidas, transición hacia el núcleo
              if (l > 0) cc.lerp(new THREE.Color(0xeef4f6), 0.12 * l);
              if (d.grade >= 4) cc.offsetHSL(0, 0, -0.04 * Math.sin(i * 1.7 + j + l));
              if (lobe > 0.5 && d.grade >= 3) cc.lerp(new THREE.Color(0xc9b27a), Math.min(1, lobe / 6) * 0.6);
              // tejido de granulación / neovascularización a lo largo de la fisura cuando hay inflamación
              if (hasH && inflam > 0) cc.lerp(granul, inflam * Math.exp(-((dA / 0.3) ** 2)) * 0.85);
            }
            if (stressK > 0.02) cc.lerp(flash, Math.min(1, stressK) * (0.35 + 0.65 * Math.pow(f, 2)));
            col[o] = cc.r; col[o + 1] = cc.g; col[o + 2] = cc.b;
          }
        }
      }
      const geo = d.mesh.geometry;
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      // platillos cartilaginosos
      const ep = d.endplates.geometry.attributes.position.array;
      for (let i = 0; i < N; i++) {
        this.endpoints(d, i, bot, top);
        lb.copy(cBot).lerp(bot, 0.94); lt.copy(cTop).lerp(top, 0.94);
        ep.set([lb.x, lb.y, lb.z], i * 3);
        ep.set([lt.x, lt.y, lt.z], (N + 1 + i) * 3);
      }
      ep.set([cBot.x, cBot.y, cBot.z], N * 3);
      ep.set([cTop.x, cTop.y, cTop.z], (2 * N + 1) * 3);
      d.endplates.geometry.attributes.position.needsUpdate = true;
      d.endplates.geometry.computeVertexNormals();
      // núcleo pulposo
      const center = cBot.clone().lerp(cTop, 0.5);
      center.add(new THREE.Vector3(0, 0, -d.D * 0.06).applyQuaternion(qMid));
      center.add(new THREE.Vector3(shiftX, 0, shiftZ).applyQuaternion(qMid));
      const hNow = d.state.meanH;
      const comp = THREE.MathUtils.clamp((d.seg.disc - hNow) / d.seg.disc, -0.3, 0.6);
      const ns = G.nucleus;
      const rx = d.W * 0.2 * ns * (1 + comp * 0.3), rz = d.D * 0.21 * ns * (1 + comp * 0.3), ry = Math.max(0.6, hNow * 0.3 * Math.sqrt(ns));
      d.nucleus.matrix.compose(center, qMid, s.set(rx, ry, rz));
      d.nucleus.matrixWorldNeedsUpdate = true;
      // material herniado y "lengua" a través de la fisura
      const i0 = Math.round((hAngle / (Math.PI * 2)) * N) % N;
      this.endpoints(d, i0, bot, top);
      const [xh, zh] = d.oLo[i0];
      const radH = new THREE.Vector3(xh, 0, zh).applyQuaternion(qMid).normalize();
      d.state.radial.copy(radH);
      const wall = bot.clone().lerp(top, 0.5);
      d.state.fissureWorld.copy(wall);
      if (H.blob > 0 && sizeK > 0.02) {
        d.blob.visible = this.layerVisible;
        const r = H.blob * (1 + 0.4 * Math.max(-0.5, pushN)) * (0.35 + 0.65 * sizeK);
        const c = wall.clone().addScaledVector(radH, hMag * 0.85 + r * 0.55);
        const sc = new THREE.Vector3(r * 1.05, r * (d.hern === 'extrusion' ? 1.5 : d.hern === 'sequestration' ? 1.2 : 0.75), r * 0.85);
        if (d.hern === 'sequestration') c.add(new THREE.Vector3(0, -(d.seg.disc * 0.6 + 6), 0).applyQuaternion(qMid));
        const qq = qMid.clone().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(xh, 0, zh).normalize()));
        d.blob.matrix.compose(c, qq, sc);
        d.blob.matrixWorldNeedsUpdate = true;
        d.state.herniaCenter.copy(c);
        d.state.herniaR = r;
        // lengua: desde el núcleo, por la fisura, hasta el material herniado (no en el secuestro)
        const showT = d.hern !== 'sequestration' && (this.interior || this.cutaway === d.seg.id || this.xray);
        d.tongue.visible = showT && this.layerVisible;
        if (showT) this.buildTongue(d, [center.clone().addScaledVector(radH, Math.min(rx, rz) * 0.7), cBot.clone().lerp(cTop, 0.5).lerp(wall, 0.72), wall.clone().addScaledVector(radH, hMag * 0.5), c], [2.2 * sizeK + 0.8, 1.8 * sizeK + 0.6, 2 * sizeK + 0.6, r * 0.6]);
      } else {
        d.blob.visible = false;
        d.tongue.visible = false;
        d.state.herniaR = 0;
        d.state.herniaCenter.copy(wall);
      }
    }
    if (camera) this.orientCut(camera);
  }

  // corte en cuadrante orientado hacia la cámara (se recalcula también al girar la vista)
  orientCut(camera) {
    const d = this.byId[this.cutaway];
    if (!d) return;
    const mLo = this.rig.bones[d.lowerBone].matrixWorld, mUp = this.rig.bones[d.upperBone].matrixWorld;
    const qLo = new THREE.Quaternion(), qUp = new THREE.Quaternion(), t = new THREE.Vector3(), s = new THREE.Vector3();
    mLo.decompose(t, qLo, s); mUp.decompose(t, qUp, s);
    const qMid = qLo.slerp(qUp, 0.5);
    const c0 = new THREE.Vector3(0, d.Hlo / 2, 0).applyMatrix4(mLo).lerp(new THREE.Vector3(0, -d.Hup / 2, 0).applyMatrix4(mUp), 0.5);
    const toCam = camera.position.clone().sub(c0);
    if (d.hern && d.hern !== 'none') {
      // un borde del corte pasa por la dirección de la fisura: se ve de perfil desde el núcleo hasta la hernia
      const ha = this.hAngle(d);
      const u = new THREE.Vector3(Math.sin(ha), 0, Math.cos(ha)).applyQuaternion(qMid);
      const w = new THREE.Vector3(Math.cos(ha), 0, -Math.sin(ha)).applyQuaternion(qMid);
      if (toCam.dot(w) < 0) w.negate();
      d.planes[0].setFromNormalAndCoplanarPoint(u.negate(), c0);
      d.planes[1].setFromNormalAndCoplanarPoint(w.negate(), c0);
    } else {
      const ex = new THREE.Vector3(1, 0, 0).applyQuaternion(qMid), ez = new THREE.Vector3(0, 0, 1).applyQuaternion(qMid);
      const sx = Math.sign(toCam.dot(ex)) || 1, sz = Math.sign(toCam.dot(ez)) || 1;
      d.planes[0].setFromNormalAndCoplanarPoint(ex.multiplyScalar(-sx), c0);
      d.planes[1].setFromNormalAndCoplanarPoint(ez.multiplyScalar(-sz), c0);
    }
  }

  // dirección (mundo) de la fisura y del lado anterior del corte, para encuadrar la cámara
  cutFrame(segId) {
    const d = this.byId[segId];
    const mLo = this.rig.bones[d.lowerBone].matrixWorld, mUp = this.rig.bones[d.upperBone].matrixWorld;
    const qLo = new THREE.Quaternion(), qUp = new THREE.Quaternion(), t = new THREE.Vector3(), s = new THREE.Vector3();
    mLo.decompose(t, qLo, s); mUp.decompose(t, qUp, s);
    const qMid = qLo.slerp(qUp, 0.5);
    const ha = d.hern && d.hern !== 'none' ? this.hAngle(d) : Math.PI - 0.42;
    const u = new THREE.Vector3(Math.sin(ha), 0, Math.cos(ha));
    const w = new THREE.Vector3(Math.cos(ha), 0, -Math.sin(ha));
    if (w.z < 0) w.negate();
    const c = new THREE.Vector3(0, d.Hlo / 2, 0).applyMatrix4(mLo).lerp(new THREE.Vector3(0, -d.Hup / 2, 0).applyMatrix4(mUp), 0.5);
    return { c, u: u.applyQuaternion(qMid), w: w.applyQuaternion(qMid), up: new THREE.Vector3(0, 1, 0).applyQuaternion(qMid) };
  }

  buildTongue(d, pts, radii) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const TS = 12, TR = 8;
    const arr = d.tongue.geometry.attributes.position.array;
    const up = new THREE.Vector3(0, 1, 0);
    for (let a = 0; a <= TS; a++) {
      const t = a / TS;
      const p = curve.getPoint(t), tan = curve.getTangent(t);
      let side = new THREE.Vector3().crossVectors(tan, up);
      if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
      side.normalize();
      const nrm = new THREE.Vector3().crossVectors(side, tan).normalize();
      const seg = t * (radii.length - 1);
      const k = Math.min(Math.floor(seg), radii.length - 2);
      const r = radii[k] + (radii[k + 1] - radii[k]) * (seg - k);
      for (let b = 0; b <= TR; b++) {
        const th = (b / TR) * Math.PI * 2;
        const q = p.clone().addScaledVector(side, Math.cos(th) * r).addScaledVector(nrm, Math.sin(th) * r * 0.75);
        arr.set([q.x, q.y, q.z], (a * (TR + 1) + b) * 3);
      }
    }
    d.tongue.geometry.attributes.position.needsUpdate = true;
    d.tongue.geometry.computeVertexNormals();
  }

  setXray(on) {
    this.xray = on;
    for (const d of this.discs) {
      const m = d.mesh.material;
      m.transparent = on;
      m.opacity = on ? 0.35 : 1;
      m.depthWrite = !on;
      m.needsUpdate = true;
      this.rebuildIndex(d);
    }
  }
}
