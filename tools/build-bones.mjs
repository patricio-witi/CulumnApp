// Genera las mallas óseas a partir de los modelos SDF y las empaqueta en docs/assets/bones.bin + bones.json
// Uso: node tools/build-bones.mjs [filtro]
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { meshSDF, projectToSurface, sdfNormals, sdfAO, fbm, clamp } from './sdf.mjs';
import { buildVertebra, buildSacrum } from './models/vertebra.mjs';
import { buildPelvis, buildFemur } from './models/pelvis.mjs';
import { buildRibs, buildSternum } from './models/thorax.mjs';
import { buildSkull } from './models/skull.mjs';
import { buildShoulder } from './models/shoulder.mjs';
import { buildLimb } from './models/limbs.mjs';
import { VERTEBRAE, computeRestPose, frameToWorld } from '../src/anatomy/spine-data.js';

const OUT_DIR = new URL('../docs/assets/', import.meta.url);
const filter = process.argv[2] ? new RegExp(process.argv[2]) : null;
const REST = computeRestPose();

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const BONE_RGB = [232, 220, 197];
const CART_RGB = [196, 214, 222];

function processMesh(name, sdf, cartSdf, bmin, bmax, voxel, targetTris, opts = {}) {
  const t0 = Date.now();
  const { positions, indices, evals } = meshSDF(sdf, bmin, bmax, voxel);
  projectToSurface(sdf, positions, voxel, 2);
  // simplificación
  let idx = indices;
  let pos = positions;
  if (idx.length / 3 > targetTris) {
    const [simp] = MeshoptSimplifier.simplify(idx, pos, 3, targetTris * 3, opts.err ?? 0.004, ['Prune']);
    idx = simp;
  }
  // compactar vértices
  const remap = new Int32Array(pos.length / 3).fill(-1);
  const np = [];
  const ni = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) {
    const v = idx[i];
    if (remap[v] < 0) { remap[v] = np.length / 3; np.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); }
    ni[i] = remap[v];
  }
  pos = new Float32Array(np);
  // eliminar triángulos degenerados
  const clean = [];
  for (let i = 0; i < ni.length; i += 3) {
    const a = ni[i], b = ni[i + 1], c = ni[i + 2];
    if (a !== b && b !== c && a !== c) clean.push(a, b, c);
  }
  idx = new Uint32Array(clean);
  const nrm = sdfNormals(sdf, pos, voxel * 0.35);
  const ao = sdfAO(sdf, pos, nrm, opts.aoStep ?? voxel * 2.2, 5);
  const vc = pos.length / 3;
  const col = new Uint8Array(vc * 4);
  for (let v = 0; v < vc; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let isCart = false;
    if (cartSdf) {
      const dc = cartSdf(x, y, z);
      isCart = dc < voxel * 0.6;
    }
    const base = isCart ? CART_RGB : (opts.rgb || BONE_RGB);
    const nz = fbm(x * 0.08, y * 0.08, z * 0.08, 3) * 0.09 + fbm(x * 0.5, y * 0.5, z * 0.5, 2) * 0.035;
    const a = ao[v];
    const shade = clamp((0.62 + 0.38 * a) * (1 + nz), 0, 1.2);
    // tono algo más cálido en cavidades
    col[v * 4] = clamp(Math.round(base[0] * shade + (1 - a) * 6), 0, 255);
    col[v * 4 + 1] = clamp(Math.round(base[1] * shade - (1 - a) * 4), 0, 255);
    col[v * 4 + 2] = clamp(Math.round(base[2] * shade - (1 - a) * 14), 0, 255);
    col[v * 4 + 3] = isCart ? 255 : 0; // canal alfa = marca de cartílago (brillo)
  }
  const nI8 = new Int8Array(vc * 4);
  for (let v = 0; v < vc; v++) {
    nI8[v * 4] = Math.round(nrm[v * 3] * 127);
    nI8[v * 4 + 1] = Math.round(nrm[v * 3 + 1] * 127);
    nI8[v * 4 + 2] = Math.round(nrm[v * 3 + 2] * 127);
  }
  console.log(`${name.padEnd(12)} ${String(vc).padStart(6)} v ${String(idx.length / 3).padStart(6)} t  ${((Date.now() - t0) / 1000).toFixed(1)}s  (${(evals / 1e6).toFixed(1)}M evals)`);
  return { pos, nrm: nI8, col, idx };
}

const jobs = [];
// Vértebras
for (const id of VERTEBRAE) {
  const cervical = id[0] === 'C';
  const lumbar = id[0] === 'L';
  jobs.push({
    name: id, frame: id, group: 'vertebra',
    make: () => buildVertebra(id),
    voxel: cervical ? 0.42 : lumbar ? 0.6 : 0.5,
    tris: cervical ? 7000 : lumbar ? 11000 : 8500,
  });
}
jobs.push({ name: 'sacrum', frame: 'S1', group: 'pelvis', make: () => buildSacrum(), voxel: 0.75, tris: 16000 });
jobs.push({ name: 'coccyx', frame: 'S1', group: 'pelvis', make: () => { const s = buildSacrum(); return { sdf: s.coccyx.sdf, bmin: s.coccyx.bmin, bmax: s.coccyx.bmax, landmarks: {} }; }, voxel: 0.5, tris: 3000 });
jobs.push({ name: 'pelvis', frame: 'world', group: 'pelvis', make: () => buildPelvis(), voxel: 1.1, tris: 30000, aoStep: 3 });
jobs.push({ name: 'femurL', frame: 'world', group: 'limb', make: () => buildFemur(1), voxel: 1.0, tris: 9000, aoStep: 2.5 });
jobs.push({ name: 'femurR', frame: 'world', group: 'limb', make: () => buildFemur(-1), voxel: 1.0, tris: 9000, aoStep: 2.5 });
jobs.push({ name: 'skull', frame: 'skull', group: 'skull', make: () => buildSkull(), voxel: 1.0, tris: 26000, aoStep: 3 });
jobs.push({ name: 'sternum', frame: 'world', group: 'thorax', make: () => buildSternum(), voxel: 0.8, tris: 6000 });
for (const side of [1, -1]) {
  const s = side > 0 ? 'L' : 'R';
  for (let k = 1; k <= 12; k++) {
    jobs.push({ name: `rib${s}${k}`, frame: `T${k}`, group: 'rib', make: () => buildRibs(k, side), voxel: 0.8, tris: 2400 });
  }
  jobs.push({ name: `scapula${s}`, frame: 'world', group: 'shoulder', make: () => buildShoulder('scapula', side), voxel: 0.8, tris: 9000 });
  jobs.push({ name: `clavicle${s}`, frame: 'world', group: 'shoulder', make: () => buildShoulder('clavicle', side), voxel: 0.7, tris: 4000 });
  jobs.push({ name: `humerus${s}`, frame: 'world', group: 'arm', make: () => buildShoulder('humerus', side), voxel: 0.9, tris: 9000 });
  jobs.push({ name: `forearm${s}`, frame: 'world', group: 'arm', make: () => buildLimb('forearm', side), voxel: 0.8, tris: 6000 });
  jobs.push({ name: `hand${s}`, frame: 'world', group: 'arm', make: () => buildLimb('hand', side), voxel: 0.7, tris: 6000 });
  jobs.push({ name: `tibia${s}`, frame: 'world', group: 'leg', make: () => buildLimb('tibia', side), voxel: 1.0, tris: 9000, aoStep: 2.5 });
  jobs.push({ name: `foot${s}`, frame: 'world', group: 'leg', make: () => buildLimb('foot', side), voxel: 0.8, tris: 7000 });
}

// Cargar resultados previos para regenerar sólo lo filtrado
let prev = null;
const jsonPath = new URL('bones.json', OUT_DIR);
const binPath = new URL('bones.bin', OUT_DIR);
if (filter && existsSync(jsonPath) && existsSync(binPath)) {
  prev = { json: JSON.parse(readFileSync(jsonPath, 'utf8')), bin: readFileSync(binPath) };
}

const results = [];
for (const job of jobs) {
  if (filter && !filter.test(job.name)) {
    const old = prev?.json.bones.find((b) => b.name === job.name);
    if (old && prev.json.version === 2) {
      const buf = prev.bin;
      const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      const vb = new Uint8Array(old.vertexCount * 16);
      MeshoptDecoder.decodeVertexBuffer(vb, old.vertexCount, 16, u8.subarray(old.vb[0], old.vb[0] + old.vb[1]));
      const ib = new Uint32Array(old.indexCount);
      MeshoptDecoder.decodeIndexBuffer(new Uint8Array(ib.buffer), old.indexCount, 4, u8.subarray(old.ib[0], old.ib[0] + old.ib[1]));
      const dv = new DataView(vb.buffer);
      const pos = new Float32Array(old.vertexCount * 3), nrm = new Int8Array(old.vertexCount * 4), col = new Uint8Array(old.vertexCount * 4);
      for (let v = 0; v < old.vertexCount; v++) {
        for (let k = 0; k < 3; k++) pos[v * 3 + k] = old.bmin[k] + (dv.getUint16(v * 16 + k * 2, true) / 65535) * old.ext[k];
        for (let k = 0; k < 4; k++) { nrm[v * 4 + k] = dv.getInt8(v * 16 + 8 + k); col[v * 4 + k] = dv.getUint8(v * 16 + 12 + k); }
      }
      results.push({ job, model: { landmarks: old.landmarks, outlineTop: old.outlineTop, meta: old.meta }, mesh: { pos, nrm, col, idx: ib } });
    }
    continue;
  }
  const model = job.make();
  const mesh = processMesh(job.name, model.sdf, model.cartilage, model.bmin, model.bmax, job.voxel, job.tris, { aoStep: job.aoStep, rgb: model.rgb });
  results.push({ job, model, mesh });
}

// Empaquetar: vértices intercalados (pos Uint16 cuantizada + normal Int8 + color RGBA) comprimidos con meshopt
const chunks = [];
let offset = 0;
const pushBytes = (bytes) => {
  const pad = (4 - (bytes.byteLength % 4)) % 4;
  const start = offset;
  chunks.push(bytes);
  if (pad) chunks.push(new Uint8Array(pad));
  offset += bytes.byteLength + pad;
  return [start, bytes.byteLength];
};
const bones = [];
for (const { job, model, mesh } of results) {
  const vc = mesh.pos.length / 3;
  const bmin = [Infinity, Infinity, Infinity], bmax = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < vc; v++) for (let k = 0; k < 3; k++) { const x = mesh.pos[v * 3 + k]; if (x < bmin[k]) bmin[k] = x; if (x > bmax[k]) bmax[k] = x; }
  const ext = bmax.map((b, k) => Math.max(1e-3, b - bmin[k]));
  const STRIDE = 16;
  const vb = new Uint8Array(vc * STRIDE);
  const dv = new DataView(vb.buffer);
  for (let v = 0; v < vc; v++) {
    for (let k = 0; k < 3; k++) dv.setUint16(v * STRIDE + k * 2, Math.round(((mesh.pos[v * 3 + k] - bmin[k]) / ext[k]) * 65535), true);
    for (let k = 0; k < 4; k++) dv.setInt8(v * STRIDE + 8 + k, mesh.nrm[v * 4 + k]);
    for (let k = 0; k < 4; k++) dv.setUint8(v * STRIDE + 12 + k, mesh.col[v * 4 + k]);
  }
  const encV = MeshoptEncoder.encodeVertexBuffer(vb, vc, STRIDE);
  const idx32 = Uint32Array.from(mesh.idx);
  const encI = MeshoptEncoder.encodeIndexBuffer(new Uint8Array(idx32.buffer), idx32.length, 4);
  bones.push({
    name: job.name, frame: job.frame, group: job.group,
    vertexCount: vc, indexCount: idx32.length,
    bmin: bmin.map((x) => +x.toFixed(4)), ext: ext.map((x) => +x.toFixed(4)),
    vb: pushBytes(encV), ib: pushBytes(encI),
    landmarks: model.landmarks || {},
    outlineTop: model.outlineTop ? model.outlineTop.map((p) => p.map((v) => Math.round(v * 100) / 100)) : undefined,
    meta: model.meta,
  });
  results.find((r) => r.job === job).packed = { vb, idx32 };
}
mkdirSync(OUT_DIR, { recursive: true });
const total = new Uint8Array(offset);
let o = 0;
for (const c of chunks) { total.set(c, o); o += c.byteLength; }
writeFileSync(binPath, total);
writeFileSync(jsonPath, JSON.stringify({ version: 2, bones }));
console.log(`\nbones.bin ${(offset / 1e6).toFixed(2)} MB, ${bones.length} mallas`);
