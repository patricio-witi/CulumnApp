// Fascia toracolumbar (capa posterior): lámina que cubre los erectores entre las espinosas y el rafe lateral
import * as THREE from 'three';

const COLS_X = [-88, -76, -60, -40, -20, 0, 20, 40, 60, 76, 88];
const COLS_Z = [38, 24, 13, 6, 0, -3, 0, 6, 13, 24, 38]; // relativo a la punta de la espinosa (+ = anterior)
const LEVELS = ['T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];

export function buildFascia(registry, resolver) {
  const rig = registry.rig;
  const rows = [];
  for (const v of LEVELS) {
    const rec = resolver.rec(v);
    const lm = rec.landmarks;
    const y = v[0] === 'L' ? lm.tpTipL[1] : lm.spTip[1] + 10;
    const z0 = lm.spTip[2] - 4;
    const narrow = v[0] === 'T' ? 0.82 : 1;
    rows.push(COLS_X.map((x, j) => resolver.resolve({ mesh: v, p: [x * narrow, y, z0 + COLS_Z[j] * narrow] })));
  }
  // fila sacra / cresta ilíaca
  const sac = ['pelvis.crest6R', 'pelvis.crest7R', 'pelvis.crest8R', 'pelvis.PSISR', 'sacrum.dorsalLat2R', 'sacrum.dorsal2', 'sacrum.dorsalLat2L', 'pelvis.PSISL', 'pelvis.crest8L', 'pelvis.crest7L', 'pelvis.crest6L'];
  rows.push(sac.map((s, j) => resolver.resolve({ at: s, offset: [0, 0, j === 5 ? -6 : -9], space: 'world' })));
  // geometría con filas intermedias interpoladas
  const SUB = 4;
  const pos = [], nrm = [], uv = [], si = [], sw = [];
  const bi = registry.boneIndex;
  const nCols = COLS_X.length;
  const SUBC = 3;
  const cols = (nCols - 1) * SUBC + 1;
  let rCount = 0;
  for (let r = 0; r < rows.length - 1; r++) {
    for (let k = 0; k < (r === rows.length - 2 ? SUB + 1 : SUB); k++) {
      const t = k / SUB;
      for (let c = 0; c < cols; c++) {
        const cj = Math.min(Math.floor(c / SUBC), nCols - 2);
        const ct = c / SUBC - cj;
        const a0 = rows[r][cj].rest.clone().lerp(rows[r][cj + 1].rest, ct);
        const a1 = rows[r + 1][cj].rest.clone().lerp(rows[r + 1][cj + 1].rest, ct);
        const p = a0.lerp(a1, t);
        pos.push(p.x, p.y, p.z);
        nrm.push(0, 0, -1);
        uv.push(c / (cols - 1) * 3, (r + t) * 0.8);
        const b0 = bi[rows[r][cj].bone], b1 = bi[rows[r + 1][cj].bone];
        const w = t * t * (3 - 2 * t);
        si.push(b0, b1, 0, 0);
        sw.push(b0 === b1 ? 1 : 1 - w, b0 === b1 ? 0 : w, 0, 0);
      }
      rCount++;
    }
  }
  const idx = [];
  for (let r = 0; r < rCount - 1; r++) for (let c = 0; c < cols - 1; c++) {
    const a = r * cols + c, b = a + cols;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  const tex = fasciaTexture();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xe9eef2, roughness: 0.28, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.3,
    clearcoat: 0.6, clearcoatRoughness: 0.2, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide,
    map: tex, bumpMap: tex, bumpScale: 0.6,
  });
  mat.userData.uniforms = {};
  const mesh = new THREE.SkinnedMesh(g, mat);
  mesh.bind(registry.skeleton, new THREE.Matrix4());
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  mesh.name = 'tlf';
  const item = { kind: 'fascia', key: 'tlf', id: 'tlf', name: 'Fascia toracolumbar (capa posterior)', latin: 'fascia thoracolumbalis', mesh };
  mesh.userData.item = item;
  return [item];
}

function fasciaTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#d8dee2';
  g.fillRect(0, 0, 256, 256);
  // láminas superficial y profunda con fibras cruzadas
  for (const [col, ang] of [['rgba(255,255,255,0.55)', 0.5], ['rgba(150,165,175,0.35)', -0.5]]) {
    g.strokeStyle = col;
    g.lineWidth = 1.6;
    for (let x = -256; x < 512; x += 7) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 256 * ang, 256); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
