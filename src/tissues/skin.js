// Silueta corporal translúcida (piel): campo de distancia mallado en el navegador y "pegado" al esqueleto
import * as THREE from 'three';
import { SU, ellipsoid, capsule, roundCone, SSUB, meshSDF } from '../../tools/sdf.mjs';
import { VERTEBRAE } from '../anatomy/spine-data.js';

function bodySDF() {
  const mir = (f) => (x, y, z) => f(Math.abs(x), y, z);
  return SSUB(10,
    SU(55,
      ellipsoid([0, 45, -8], [170, 118, 122]),
      mir(ellipsoid([72, 6, -78], [82, 92, 66])),
      ellipsoid([0, 225, 4], [134, 118, 104]),
      ellipsoid([0, 190, 52], [118, 92, 72]),
      ellipsoid([0, 425, 14], [158, 150, 118]),
      capsule([-178, 512, -16], [178, 512, -16], 54),
      roundCone([0, 560, -6], [0, 680, 12], 64, 54),
      ellipsoid([0, 772, 12], [80, 98, 102]),
      mir(roundCone([102, -40, 0], [100, -430, 2], 88, 56)),
      mir(roundCone([196, 505, -16], [204, 300, -16], 50, 40)),
    ),
    capsule([0, 130, -132], [0, 500, -150], 9),
  );
}

export function buildSkin(rig, bonesJson, registry) {
  const f = bodySDF();
  const { positions, indices } = meshSDF(f, [-270, -460, -220], [270, 880, 200], 9);
  // suavizado laplaciano simple
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
  // pesos: columna por altura, pelvis, fémures, hombros y cráneo
  const bi = registry.boneIndex;
  const chain = ['S1', ...VERTEBRAE];
  const centers = chain.map((b) => new THREE.Vector3().setFromMatrixPosition(rig.restWorld[b]));
  const skullY = new THREE.Vector3().setFromMatrixPosition(rig.restWorld.skull).y;
  const si = new Uint16Array(vc * 4), sw = new Float32Array(vc * 4);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let v = 0; v < vc; v++) {
    const x = positions[v * 3], y = positions[v * 3 + 1];
    const w = {};
    const add = (b, k) => { if (k > 1e-4) w[b] = (w[b] || 0) + k; };
    // tronco: interpolación entre las dos vértebras más cercanas en altura
    let k = 0;
    while (k < centers.length - 2 && centers[k + 1].y < y) k++;
    const t = Math.min(1, Math.max(0, (y - centers[k].y) / (centers[k + 1].y - centers[k].y)));
    let trunk = 1;
    const leg = ss(-30, -150, y) * ss(20, 60, Math.abs(x));
    const arm = ss(150, 185, Math.abs(x)) * ss(560, 500, y);
    const head = ss(skullY - 25, skullY + 20, y);
    const pelvisW = ss(140, 60, y);
    const spare = 1 - Math.min(1, leg + arm + head);
    add(x > 0 ? 'femurL' : 'femurR', leg);
    add(x > 0 ? 'shoulderL' : 'shoulderR', arm);
    add('skull', head * (1 - arm));
    trunk = Math.max(0, spare);
    add('pelvis', trunk * pelvisW);
    const tr = trunk * (1 - pelvisW);
    add(chain[k], tr * (1 - t));
    add(chain[k + 1], tr * t);
    const ent = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const tot = ent.reduce((a, e) => a + e[1], 0) || 1;
    ent.forEach(([b, kk], j) => { si[v * 4 + j] = bi[b]; sw[v * 4 + j] = kk / tot; });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  g.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xd9a487, roughness: 0.5, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.FrontSide, sheen: 0.6, sheenColor: new THREE.Color(0xffd6c2) });
  mat.userData.uniforms = {};
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);
      gl_FragColor.a = clamp(opacity * 0.35 + fres * 0.55, 0.0, 0.85);`);
  };
  mat.customProgramCacheKey = () => 'skin';
  const mesh = new THREE.SkinnedMesh(g, mat);
  mesh.bind(registry.skeleton, new THREE.Matrix4());
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  mesh.name = 'skin';
  const item = { kind: 'skin', key: 'skin', id: 'skin', name: 'Silueta corporal (piel)', latin: 'cutis', mesh };
  mesh.userData.item = item;
  return item;
}
