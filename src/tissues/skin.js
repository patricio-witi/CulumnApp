// Silueta corporal translúcida (piel) con brazos y piernas completos.
// Cada vértice guarda a qué dermatoma pertenece para dibujar el mapa de dolor:
//  - dolor radicular: banda estrecha siguiendo el dermatoma de la raíz irritada, con pulsos "eléctricos";
//  - dolor referido somático: zona difusa en zona lumbar, nalga y muslo, sin límites nítidos.
import * as THREE from 'three';
import { SU, ellipsoid, capsule, roundCone, sphere, SSUB, meshSDF } from '../../tools/sdf.mjs';
import { VERTEBRAE } from '../anatomy/spine-data.js';

function bodySDF() {
  const mir = (f) => (x, y, z) => f(Math.abs(x), y, z);
  return SSUB(10,
    SU(48,
      ellipsoid([0, 45, -8], [170, 118, 122]),
      mir(ellipsoid([72, 6, -78], [82, 92, 66])),
      ellipsoid([0, 225, 4], [134, 118, 104]),
      ellipsoid([0, 190, 52], [118, 92, 72]),
      ellipsoid([0, 425, 14], [158, 150, 118]),
      capsule([-178, 512, -16], [178, 512, -16], 54),
      roundCone([0, 560, -6], [0, 680, 12], 64, 54),
      ellipsoid([0, 772, 12], [80, 98, 102]),
      // piernas
      mir(roundCone([102, -40, 0], [98, -440, 4], 88, 54)),
      mir(sphere([97, -446, 8], 50)),
      mir(roundCone([97, -455, -6], [90, -835, -4], 52, 34)),
      mir(ellipsoid([97, -575, -24], [46, 95, 44])),
      mir(sphere([90, -862, -2], 33)),
      mir(ellipsoid([86, -902, 44], [42, 26, 104])),
      // brazos
      mir(roundCone([196, 505, -16], [200, 240, -20], 50, 38)),
      mir(sphere([198, 222, -22], 36)),
      mir(roundCone([200, 205, -18], [205, -10, -12], 38, 26)),
      mir(ellipsoid([204, -92, 0], [16, 72, 42])),
    ),
    capsule([0, 130, -132], [0, 500, -150], 9),
  );
}

// Ejes de las extremidades (lado izquierdo) para calcular la orientación alrededor del miembro
const LEG = [[-20, 100, 0], [-446, 97, 2], [-862, 90, -10]];
function legCenter(y) {
  if (y > LEG[0][0]) return [LEG[0][1], LEG[0][2]];
  for (let i = 0; i < LEG.length - 1; i++) {
    const [y0, x0, z0] = LEG[i], [y1, x1, z1] = LEG[i + 1];
    if (y <= y0 && y >= y1) { const t = (y0 - y) / (y0 - y1); return [x0 + (x1 - x0) * t, z0 + (z1 - z0) * t]; }
  }
  return [88, 40];
}
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const band = (x, a, b, soft) => ss(a - soft, a + soft, x) * (1 - ss(b - soft, b + soft, x));
// ángulo en grados en (-180, 180]: 0 lateral, 90 anterior, ±180 medial, -90 posterior
const angBand = (phi, a, b, soft = 18) => {
  // intervalo [a, b] en grados (puede cruzar ±180)
  const norm = (v) => ((v % 360) + 540) % 360 - 180;
  const p = norm(phi);
  let lo = norm(a), hi = norm(b);
  if (hi < lo) hi += 360;
  let q = p; if (q < lo - 90) q += 360;
  return ss(lo - soft, lo + soft, q) * (1 - ss(hi - soft, hi + soft, q));
};

function dermatomes(x, y, z) {
  // devuelve [L2, L3, L4, L5, S1, S2, espalda/nalga, legT]
  const ax = Math.abs(x);
  const out = [0, 0, 0, 0, 0, 0, 0, 0];
  // región lumbar y glútea (dolor somático referido)
  const backZone = band(y, -95, 235, 40) * ss(-20, -70, z) * (1 - ss(150, 200, ax));
  out[6] = backZone;
  if (y > -25 || ax < 22) return out;
  const legT = Math.min(1, Math.max(0, (-y - 20) / 905));
  out[7] = legT;
  let phi;
  const foot = y < -870;
  if (!foot) {
    const [cx, cz] = legCenter(y);
    phi = Math.atan2(z - cz, ax - cx) * 180 / Math.PI;
  }
  if (foot) {
    const medial = 1 - ss(78, 96, ax);
    const sole = 1 - ss(-918, -905, y);
    const heel = 1 - ss(-40, -10, z);
    out[2] = medial * (1 - sole) * band(z, -20, 80, 20) * 0.9; // L4: borde medial del pie
    out[3] = (1 - sole) * band(z, 30, 170, 20) * (1 - ss(96, 108, ax)); // L5: dorso y dedo gordo
    out[4] = Math.max(sole, heel, ss(98, 110, ax)); // S1: borde lateral, planta y talón
    // nalga/muslo posterior del somático no llega al pie
    return out;
  }
  out[0] = band(legT, 0.03, 0.28, 0.04) * angBand(phi, 15, 150);
  out[1] = band(legT, 0.24, 0.52, 0.04) * angBand(phi, 60, 200);
  out[2] = band(legT, 0.48, 0.99, 0.03) * angBand(phi, 100, 205);
  out[3] = band(legT, 0.5, 0.99, 0.03) * angBand(phi, -15, 100);
  out[4] = band(legT, 0.56, 1.0, 0.03) * angBand(phi, -115, -15);
  out[5] = band(legT, 0.04, 0.55, 0.04) * angBand(phi, -150, -40);
  // dolor somático: nalga y muslo posterior (difuso, por encima de la rodilla)
  out[6] = Math.max(out[6], (1 - ss(0.12, 0.42, legT)) * angBand(phi, -175, 10, 40) * 0.85);
  return out;
}

export function buildSkin(rig, bonesJson, registry) {
  const f = bodySDF();
  const { positions, indices } = meshSDF(f, [-280, -950, -230], [280, 880, 215], 9);
  const vc = positions.length / 3;
  const nb = Array.from({ length: vc }, () => new Set());
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i + 1], c = indices[i + 2];
    nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b);
  }
  for (let it = 0; it < 3; it++) {
    const np = positions.slice();
    for (let v = 0; v < vc; v++) {
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const u of nb[v]) { sx += positions[u * 3]; sy += positions[u * 3 + 1]; sz += positions[u * 3 + 2]; n++; }
      if (!n) continue;
      np[v * 3] = positions[v * 3] * 0.4 + (sx / n) * 0.6;
      np[v * 3 + 1] = positions[v * 3 + 1] * 0.4 + (sy / n) * 0.6;
      np[v * 3 + 2] = positions[v * 3 + 2] * 0.4 + (sz / n) * 0.6;
    }
    positions.set(np);
  }
  // pesos de skinning
  const bi = registry.boneIndex;
  const chain = ['S1', ...VERTEBRAE];
  const centers = chain.map((b) => new THREE.Vector3().setFromMatrixPosition(rig.restWorld[b]));
  const skullY = new THREE.Vector3().setFromMatrixPosition(rig.restWorld.skull).y;
  const si = new Uint16Array(vc * 4), sw = new Float32Array(vc * 4);
  const dA = new Float32Array(vc * 4), dB = new Float32Array(vc * 4), sideA = new Float32Array(vc);
  for (let v = 0; v < vc; v++) {
    const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    const ax = Math.abs(x), S = x > 0 ? 'L' : 'R';
    const w = {};
    const add = (b, k) => { if (k > 1e-4) w[b] = (w[b] || 0) + k; };
    let k = 0;
    while (k < centers.length - 2 && centers[k + 1].y < y) k++;
    const t = Math.min(1, Math.max(0, (y - centers[k].y) / (centers[k + 1].y - centers[k].y)));
    const leg = ss(-30, -150, y) * ss(20, 60, ax);
    const arm = ss(150, 185, ax) * ss(560, 500, y);
    const head = ss(skullY - 25, skullY + 20, y);
    const pelvisW = ss(140, 60, y);
    // pierna: muslo → fémur; pantorrilla → tibia; pie → pie
    const shank = ss(-420, -470, y), footW = ss(-840, -880, y);
    add('femur' + S, leg * (1 - shank));
    add('tibia' + S, leg * shank * (1 - footW));
    add('foot' + S, leg * shank * footW);
    // brazo: hombro → húmero → antebrazo
    const upper = ss(500, 455, y), fore = ss(250, 200, y);
    add('shoulder' + S, arm * (1 - upper));
    add('humerus' + S, arm * upper * (1 - fore));
    add('forearm' + S, arm * upper * fore);
    add('skull', head * (1 - arm));
    const trunk = Math.max(0, 1 - Math.min(1, leg + arm + head));
    add('pelvis', trunk * pelvisW);
    const tr = trunk * (1 - pelvisW);
    add(chain[k], tr * (1 - t));
    add(chain[k + 1], tr * t);
    const ent = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const tot = ent.reduce((a, e) => a + e[1], 0) || 1;
    ent.forEach(([b, kk], j) => { si[v * 4 + j] = bi[b]; sw[v * 4 + j] = kk / tot; });
    const d = dermatomes(x, y, z);
    dA.set([d[0], d[1], d[2], d[3]], v * 4);
    dB.set([d[4], d[5], d[6], d[7]], v * 4);
    sideA[v] = x > 0 ? 1 : -1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  g.setAttribute('dermA', new THREE.BufferAttribute(dA, 4));
  g.setAttribute('dermB', new THREE.BufferAttribute(dB, 4));
  g.setAttribute('sideF', new THREE.BufferAttribute(sideA, 1));
  g.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xd9a487, roughness: 0.5, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.FrontSide, sheen: 0.6, sheenColor: new THREE.Color(0xffd6c2) });
  const pain = {
    uPainAL: { value: new THREE.Vector4() }, uPainBL: { value: new THREE.Vector4(0, 0, 0, 0) },
    uPainAR: { value: new THREE.Vector4() }, uPainBR: { value: new THREE.Vector4(0, 0, 0, 0) },
    uTime: { value: 0 },
  };
  mat.userData.uniforms = pain;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, pain);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 dermA;\nattribute vec4 dermB;\nattribute float sideF;\nvarying vec4 vDA;\nvarying vec4 vDB;\nvarying float vSide;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vDA = dermA; vDB = dermB; vSide = sideF;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec4 vDA; varying vec4 vDB; varying float vSide;
        uniform vec4 uPainAL; uniform vec4 uPainBL; uniform vec4 uPainAR; uniform vec4 uPainBR; uniform float uTime;`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);
        float a = clamp(opacity * 0.35 + fres * 0.55, 0.0, 0.85);
        vec4 pA = vSide > 0.0 ? uPainAL : uPainAR;
        vec4 pB = vSide > 0.0 ? uPainBL : uPainBR;
        float legT = vDB.w;
        float extent = pB.w;
        float reach = 1.0 - smoothstep(extent - 0.04, extent + 0.04, legT);
        float rad = (dot(vDA, pA) + vDB.x * pB.x + vDB.y * pB.y) * reach;
        float wave = 0.55 + 0.45 * pow(0.5 + 0.5 * sin(legT * 46.0 - uTime * 7.0), 3.0);
        float som = vDB.z * pB.z * (0.82 + 0.18 * sin(uTime * 1.6));
        vec3 cRad = vec3(1.0, 0.12, 0.32);
        vec3 cSom = vec3(1.0, 0.48, 0.12);
        float r = clamp(rad * wave * 1.6, 0.0, 1.0), s = clamp(som * 2.3, 0.0, 1.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, cSom, s * 0.85);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, cRad, r * 0.9);
        gl_FragColor.a = max(a, max(r * 0.9, s * 0.75));`);
  };
  mat.customProgramCacheKey = () => 'skin-pain';
  const mesh = new THREE.SkinnedMesh(g, mat);
  mesh.bind(registry.skeleton, new THREE.Matrix4());
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  mesh.name = 'skin';
  const item = { kind: 'skin', key: 'skin', id: 'skin', name: 'Silueta corporal (piel)', latin: 'cutis', mesh, pain };
  mesh.userData.item = item;
  return item;
}
