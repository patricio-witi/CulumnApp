// Discos intervertebrales deformables (CPU): el anillo fibroso se abomba donde se comprime,
// el núcleo pulposo migra hacia el lado que se abre, y la patología altera altura, color y forma.
import * as THREE from 'three';
import { SEGMENTS, vertebraParams } from '../anatomy/spine-data.js';
import { CAP_GLSL } from '../core/bones.js';

const N = 48; // puntos del contorno
const M = 10; // anillos en altura

export const PFIRRMANN = {
  1: { loss: 0, nucleus: 1.0, nColor: 0xcfe6f2, aColor: 0xe7ebe9, label: 'I · normal' },
  2: { loss: 0.02, nucleus: 0.95, nColor: 0xc4d9e2, aColor: 0xe4e6e0, label: 'II · cambios mínimos' },
  3: { loss: 0.12, nucleus: 0.8, nColor: 0xb9c2bf, aColor: 0xdcd8c8, label: 'III · degeneración moderada' },
  4: { loss: 0.3, nucleus: 0.62, nColor: 0xb2a98e, aColor: 0xd2c7a8, label: 'IV · degeneración avanzada' },
  5: { loss: 0.58, nucleus: 0.42, nColor: 0x8f7f63, aColor: 0xc4b48d, label: 'V · disco colapsado' },
};

export const HERNIA = {
  none: { mag: 0, sigma: 0.3, blob: 0, label: 'Sin hernia' },
  bulge: { mag: 2.2, sigma: 0.95, blob: 0, label: 'Abombamiento (>25 % de la circunferencia)' },
  protrusion: { mag: 3.6, sigma: 0.3, blob: 3.2, label: 'Protrusión (base más ancha que la cúpula)' },
  extrusion: { mag: 4.2, sigma: 0.24, blob: 5.2, label: 'Extrusión (cúpula más ancha que la base)' },
  sequestration: { mag: 2.8, sigma: 0.22, blob: 4.6, label: 'Secuestro (fragmento libre)' },
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
  // láminas con fibras cruzadas a ±30°
  for (let lam = 0; lam < 2; lam++) {
    g.strokeStyle = lam ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)';
    g.lineWidth = 2;
    const slope = lam ? 0.58 : -0.58;
    for (let x = -W; x < W * 2; x += 9) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + H / slope, H);
      g.stroke();
    }
  }
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
    const recs = Object.fromEntries(bonesJson.bones.map((b) => [b.name, b]));
    const bump = annulusTexture();
    this.makeAnnulusMat = () => {
      const m = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, vertexColors: true, roughness: 0.35, clearcoat: 0.35, clearcoatRoughness: 0.3,
        sheen: 0.5, sheenColor: new THREE.Color(0xffffff), bumpMap: bump, bumpScale: 0.6, side: THREE.DoubleSide,
      });
      m.userData.uniforms = { uHighlight: { value: new THREE.Color(0, 0, 0) }, uCapColor: { value: new THREE.Color(0xdedad0) } };
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, m.userData.uniforms);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform vec3 uHighlight;\nuniform vec3 uCapColor;\n' + CAP_GLSL)
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uHighlight;')
          .replace('#include <dithering_fragment>', `#include <dithering_fragment>
            if (!gl_FrontFacing) {
              float ring = 0.5 + 0.5 * sin(length(vWPos.xz) * 2.6);
              gl_FragColor = vec4(uCapColor * (0.82 + 0.18 * ring), gl_FragColor.a);
            }`);
      };
      m.customProgramCacheKey = () => 'annulus';
      return m;
    };
    this.layerVisible = true;
    this.nucleusMat = new THREE.MeshPhysicalMaterial({ color: 0xcfe6f2, roughness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.1, transmission: 0, sheen: 0.6, sheenColor: new THREE.Color(0xe8f6ff) });
    const sphere = new THREE.SphereGeometry(1, 28, 18);

    for (const seg of SEGMENTS) {
      if (!seg.disc) continue;
      const lowerRec = seg.lower === 'S1' ? recs.L5 : recs[seg.lower];
      const upperRec = recs[seg.upper];
      const lowerP = seg.lower === 'S1' ? null : vertebraParams(seg.lower);
      const upperP = vertebraParams(seg.upper);
      const oLo = (seg.lower === 'S1' ? upperRec.outlineTop : lowerRec.outlineTop).map(([x, z]) => [x * (seg.lower === 'S1' ? 0.98 : 1), z]);
      const oUp = upperRec.outlineTop;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * (M + 1) * 3);
      const col = new Float32Array(N * (M + 1) * 3);
      const uv = new Float32Array(N * (M + 1) * 2);
      const idx = [];
      for (let j = 0; j <= M; j++) for (let i = 0; i < N; i++) {
        uv[(j * N + i) * 2] = i / N * 4;
        uv[(j * N + i) * 2 + 1] = j / M;
        if (j < M) {
          const a = j * N + i, b = j * N + ((i + 1) % N), c = (j + 1) * N + i, d = (j + 1) * N + ((i + 1) % N);
          idx.push(a, c, b, b, c, d);
        }
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setIndex(idx);
      const mesh = new THREE.Mesh(geo, this.makeAnnulusMat());
      mesh.name = 'disc:' + seg.id;
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const nucleus = new THREE.Mesh(sphere, this.nucleusMat.clone());
      nucleus.matrixAutoUpdate = false;
      nucleus.name = 'nucleus:' + seg.id;
      const blob = new THREE.Mesh(sphere, this.nucleusMat.clone());
      blob.matrixAutoUpdate = false;
      blob.visible = false;
      blob.name = 'hernia:' + seg.id;
      const Hlo = seg.lower === 'S1' ? -0.6 : lowerP.bodyH;
      const Hup = upperP.bodyH;
      const W = (upperP.bodyW + (lowerP ? lowerP.bodyW : upperP.bodyW)) / 2;
      const D = (upperP.bodyD + (lowerP ? lowerP.bodyD : upperP.bodyD)) / 2;
      const d = {
        seg, mesh, nucleus, blob, oLo, oUp, Hlo, Hup, W, D,
        lowerBone: seg.lower, upperBone: seg.upper,
        h0: new Float32Array(N), delta: new Float32Array(N),
        state: { nucleusShift: new THREE.Vector2(), compAnt: 0, compPost: 0, compL: 0, compR: 0, meanH: 0, herniaCenter: new THREE.Vector3(), herniaR: 0 },
      };
      const item = { kind: 'disc', key: 'disc:' + seg.id, id: seg.id, name: `Disco intervertebral ${seg.id}`, mesh, nucleus, disc: d };
      mesh.userData.item = item;
      nucleus.userData.item = { ...item, key: 'nucleus:' + seg.id, kind: 'nucleus', name: `Núcleo pulposo ${seg.id}` };
      blob.userData.item = { ...item, key: 'hernia:' + seg.id, kind: 'hernia', name: `Material discal herniado ${seg.id}` };
      d.item = item;
      this.group.add(mesh, nucleus, blob);
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

  setPathology(p) {
    this.pathology = p || {};
    for (const d of this.discs) {
      const pt = this.pathology[d.seg.id];
      const grade = pt?.grade || 1;
      const G = PFIRRMANN[grade];
      d.grade = grade;
      d.nucleus.material.color.setHex(G.nColor);
      d.blob.material.color.setHex(G.nColor).offsetHSL(0, 0, -0.05);
      d.aColor = new THREE.Color(G.aColor);
      d.hern = pt?.hern || 'none';
      d.zone = pt?.zone || 'paracentral';
      d.side = pt?.side || 'L';
      this.rig.discLoss[d.seg.id] = d.seg.disc * G.loss;
    }
  }

  update(load = 1) {
    const [bot, top, rad, tmp, mid] = this._v;
    const qLo = new THREE.Quaternion(), qUp = new THREE.Quaternion(), qMid = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const cold = new THREE.Color(0x4f8fd6), neutral = new THREE.Color(0xe6e6e0), hot = new THREE.Color(0xe0412a);
    const cc = new THREE.Color();
    for (const d of this.discs) {
      const pos = d.mesh.geometry.attributes.position.array;
      const col = d.mesh.geometry.attributes.color.array;
      const mLo = this.rig.bones[d.lowerBone].matrixWorld;
      const mUp = this.rig.bones[d.upperBone].matrixWorld;
      mLo.decompose(tmp, qLo, s);
      mUp.decompose(tmp, qUp, s);
      qMid.slerpQuaternions(qLo, qUp, 0.5);
      // compresión por borde
      let cA = 0, cP = 0, cL = 0, cR = 0, hSum = 0;
      for (let i = 0; i < N; i++) {
        this.endpoints(d, i, bot, top);
        const h = bot.distanceTo(top);
        hSum += h;
        const del = d.h0[i] - h;
        d.delta[i] = del;
        const th = (i / N) * Math.PI * 2; // 0 = anterior, π/2 = izquierda
        cA += del * Math.max(0, Math.cos(th)); cP += del * Math.max(0, -Math.cos(th));
        cL += del * Math.max(0, Math.sin(th)); cR += del * Math.max(0, -Math.sin(th));
      }
      const norm = N / Math.PI;
      d.state.compAnt = cA / norm; d.state.compPost = cP / norm; d.state.compL = cL / norm; d.state.compR = cR / norm;
      d.state.meanH = hSum / N;
      // migración del núcleo (mm, en el plano del disco): hacia el lado que se abre
      const shiftZ = THREE.MathUtils.clamp(-(d.state.compAnt - d.state.compPost) * 1.1, -d.D * 0.18, d.D * 0.18);
      const shiftX = THREE.MathUtils.clamp(-(d.state.compL - d.state.compR) * 1.1, -d.W * 0.16, d.W * 0.16);
      d.state.nucleusShift.set(shiftX, shiftZ);
      const G = PFIRRMANN[d.grade || 1];
      const H = HERNIA[d.hern || 'none'];
      const hAngle = d.hern !== 'none' ? (d.side === 'L' ? ZONES[d.zone].angle : Math.PI * 2 - ZONES[d.zone].angle) : 0;
      // empuje del núcleo hacia la hernia (protrusiones contenidas cambian con la postura)
      const push = d.hern !== 'none' ? shiftX * Math.sin(hAngle) + shiftZ * Math.cos(hAngle) : 0;
      const pushN = THREE.MathUtils.clamp(push / 2.2, -0.8, 1.6);
      d.state.push = pushN;
      const hMag = H.mag * (1 + (d.hern === 'sequestration' ? 0 : 0.55 * pushN));
      const degBulge = (d.grade >= 3 ? 0.4 : 0) + (d.grade >= 4 ? 0.5 : 0);
      for (let i = 0; i < N; i++) {
        this.endpoints(d, i, bot, top);
        const [xl, zl] = d.oLo[i];
        rad.set(xl, 0, zl).applyQuaternion(qMid).normalize();
        const th = (i / N) * Math.PI * 2;
        let dA = Math.abs(th - hAngle);
        dA = Math.min(dA, Math.PI * 2 - dA);
        const lobe = d.hern !== 'none' ? hMag * Math.exp(-((dA / H.sigma) ** 2)) : 0;
        const del = d.delta[i];
        const bul = Math.max(-0.5, 0.55 + 0.6 * del + degBulge);
        for (let j = 0; j <= M; j++) {
          const t = j / M;
          const env = Math.pow(Math.sin(Math.PI * t), 0.75);
          const o = (j * N + i) * 3;
          tmp.copy(bot).lerp(top, t).addScaledVector(rad, bul * env + lobe * Math.pow(Math.sin(Math.PI * t), 0.55));
          pos[o] = tmp.x; pos[o + 1] = tmp.y; pos[o + 2] = tmp.z;
          // color: presión local (vista de presión) o color del anillo según degeneración
          if (this.pressureView) {
            const k = THREE.MathUtils.clamp((del / Math.max(1, d.h0[i])) * 6 * load + (load - 1) * 0.35, -1, 1);
            cc.copy(neutral).lerp(k > 0 ? hot : cold, Math.abs(k));
          } else {
            cc.copy(d.aColor || neutral);
            if (d.grade >= 4) cc.offsetHSL(0, 0, -0.04 * Math.sin(i * 1.7 + j));
            if (lobe > 0.5 && d.grade >= 3) cc.lerp(new THREE.Color(0xc9b27a), Math.min(1, lobe / 6) * 0.6);
          }
          col[o] = cc.r; col[o + 1] = cc.g; col[o + 2] = cc.b;
        }
      }
      d.mesh.geometry.attributes.position.needsUpdate = true;
      d.mesh.geometry.attributes.color.needsUpdate = true;
      d.mesh.geometry.computeVertexNormals();
      d.mesh.geometry.computeBoundingSphere();
      // núcleo pulposo
      const cBot = tmp.set(0, d.Hlo / 2, -d.D * 0.06).applyMatrix4(mLo).clone();
      const cTop = mid.set(0, -d.Hup / 2, -d.D * 0.06).applyMatrix4(mUp).clone();
      const center = cBot.lerp(cTop, 0.5);
      const off = new THREE.Vector3(shiftX, 0, shiftZ).applyQuaternion(qMid);
      center.add(off);
      const hNow = d.state.meanH;
      const comp = THREE.MathUtils.clamp((d.seg.disc - hNow) / d.seg.disc, -0.3, 0.6);
      const ns = G.nucleus;
      const rx = d.W * 0.2 * ns * (1 + comp * 0.3), rz = d.D * 0.21 * ns * (1 + comp * 0.3), ry = Math.max(0.6, hNow * 0.3 * Math.sqrt(ns));
      d.nucleus.matrix.compose(center, qMid, s.set(rx, ry, rz));
      d.nucleus.matrixWorldNeedsUpdate = true;
      // material herniado
      if (H.blob > 0) {
        d.blob.visible = this.layerVisible;
        const i = Math.round((hAngle / (Math.PI * 2)) * N) % N;
        this.endpoints(d, i, bot, top);
        const [xl, zl] = d.oLo[i];
        rad.set(xl, 0, zl).applyQuaternion(qMid).normalize();
        const wall = bot.clone().lerp(top, 0.5);
        const r = H.blob * (1 + 0.4 * Math.max(-0.5, pushN)) * (d.hern === 'sequestration' ? 1 : 1);
        const c = wall.addScaledVector(rad, hMag * 0.75 + r * 0.35);
        const sc = new THREE.Vector3(r * 1.05, r * (d.hern === 'extrusion' ? 1.5 : d.hern === 'sequestration' ? 1.2 : 0.75), r * 0.85);
        if (d.hern === 'sequestration') c.add(new THREE.Vector3(0, -(d.seg.disc * 0.6 + 6), 0).applyQuaternion(qMid));
        const qq = qMid.clone().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(xl, 0, zl).normalize()));
        d.blob.matrix.compose(c, qq, sc);
        d.blob.matrixWorldNeedsUpdate = true;
        d.state.herniaCenter.copy(c);
        d.state.herniaR = r;
      } else {
        d.blob.visible = false;
        d.state.herniaR = 0;
      }
    }
  }

  setXray(on) {
    this.xray = on;
    for (const d of this.discs) {
      const m = d.mesh.material;
      m.transparent = on;
      m.opacity = on ? 0.3 : 1;
      m.depthWrite = !on;
      m.needsUpdate = true;
    }
  }
}
