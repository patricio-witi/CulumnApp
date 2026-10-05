// Carga de las mallas óseas precalculadas y material de hueso (con cartílago y corte esponjoso)
import * as THREE from 'three';

import { MeshoptDecoder as WasmDecoder } from 'meshoptimizer/decoder';
import { MeshoptDecoder as RefDecoder } from '../../node_modules/meshoptimizer/meshopt_decoder_reference.js';

// El decodificador WebAssembly es más rápido; si el entorno bloquea WebAssembly, se usa la versión en JavaScript puro.
let MeshoptDecoder = RefDecoder;
async function pickDecoder() {
  try {
    if (typeof WebAssembly !== 'object' || !WasmDecoder.supported) return;
    await Promise.race([WasmDecoder.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
    MeshoptDecoder = WasmDecoder;
  } catch (e) {
    console.warn('WebAssembly no disponible; usando decodificador JS', e?.message);
  }
}

export async function loadBoneData(base = 'assets/', onProgress) {
  const [json, bin] = await Promise.all([
    fetch(base + 'bones.json').then((r) => { if (!r.ok) throw new Error('No se pudo cargar bones.json'); return r.json(); }),
    (typeof window !== 'undefined' && window.__BONES_B64)
      ? fetch(base + window.__BONES_B64).then((r) => { if (!r.ok) throw new Error('No se pudo cargar los huesos'); return r.text(); }).then(b64ToBuffer)
      : fetchWithProgress(base + 'bones.bin', onProgress),
  ]);
  await pickDecoder();
  return { json, bin };
}

function b64ToBuffer(txt) {
  const bin = atob(txt.trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

async function fetchWithProgress(url, onProgress) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('No se pudo cargar ' + url);
  const total = +r.headers.get('content-length') || 0;
  if (!r.body || !total || !onProgress) return r.arrayBuffer();
  const reader = r.body.getReader();
  const out = new Uint8Array(total);
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.set(value, got);
    got += value.length;
    onProgress(got / total);
  }
  return out.buffer;
}

export function makeGeometry(rec, bin) {
  const g = new THREE.BufferGeometry();
  const vc = rec.vertexCount;
  const src = new Uint8Array(bin);
  const vb = new Uint8Array(vc * 16);
  MeshoptDecoder.decodeVertexBuffer(vb, vc, 16, src.subarray(rec.vb[0], rec.vb[0] + rec.vb[1]));
  const idx32 = new Uint32Array(rec.indexCount);
  MeshoptDecoder.decodeIndexBuffer(new Uint8Array(idx32.buffer), rec.indexCount, 4, src.subarray(rec.ib[0], rec.ib[0] + rec.ib[1]));
  const q = new Uint16Array(vb.buffer);
  const pos = new Float32Array(vc * 3);
  for (let v = 0; v < vc; v++) for (let k = 0; k < 3; k++) pos[v * 3 + k] = rec.bmin[k] + (q[v * 8 + k] / 65535) * rec.ext[k];
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ib = new THREE.InterleavedBuffer(new Int8Array(vb.buffer), 16);
  g.setAttribute('normal', new THREE.InterleavedBufferAttribute(ib, 3, 8, true));
  const cb = new THREE.InterleavedBuffer(vb, 16);
  g.setAttribute('color', new THREE.InterleavedBufferAttribute(cb, 3, 12, true));
  g.setAttribute('cart', new THREE.InterleavedBufferAttribute(cb, 1, 15, true));
  g.setIndex(new THREE.BufferAttribute(vc < 65536 ? Uint16Array.from(idx32) : idx32, 1));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

// Parches de shader compartidos: color sRGB→lineal, cartílago brillante, tapa de corte con trabéculas
export const CAP_GLSL = /* glsl */`
float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x),mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;

export function boneMaterial(opts = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.58,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.6,
    sheen: 0.25,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(0xfff2dc),
    side: THREE.DoubleSide,
    ...opts,
  });
  m.userData.uniforms = {
    uCapColor: { value: new THREE.Color(0xc9a27f) },
    uHighlight: { value: new THREE.Color(0, 0, 0) },
    uXray: { value: 0 },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, m.userData.uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float cart;\nvarying float vCart;\nvarying vec3 vWPos;')
      .replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_COLOR\n vColor.rgb = pow(vColor.rgb, vec3(2.2));\n#endif\n vCart = cart;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vCart;\nvarying vec3 vWPos;\nuniform vec3 uCapColor;\nuniform vec3 uHighlight;\nuniform float uXray;\n' + CAP_GLSL)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.22, vCart);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uHighlight;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        if (!gl_FrontFacing) {
          // hueso esponjoso cortado: trabéculas claras y espacios medulares rojizos (valores ya en sRGB)
          float n = vnoise(vWPos * 1.5) * 0.55 + vnoise(vWPos * 3.4) * 0.45;
          float trab = smoothstep(0.38, 0.6, n);
          vec3 cap = mix(vec3(0.72, 0.45, 0.38), vec3(0.95, 0.89, 0.78), trab);
          gl_FragColor = vec4(cap, gl_FragColor.a);
        }`);
  };
  m.customProgramCacheKey = () => 'bone-v2';
  return m;
}

const NAMES = {
  sacrum: 'Sacro', coccyx: 'Cóccix', pelvis: 'Coxales (ilion, isquion y pubis)', skull: 'Cráneo', sternum: 'Esternón',
  femurL: 'Fémur izquierdo', femurR: 'Fémur derecho', scapulaL: 'Escápula izquierda', scapulaR: 'Escápula derecha',
  clavicleL: 'Clavícula izquierda', clavicleR: 'Clavícula derecha', humerusL: 'Húmero izquierdo', humerusR: 'Húmero derecho',
  forearmL: 'Radio y cúbito izquierdos', forearmR: 'Radio y cúbito derechos', handL: 'Mano izquierda', handR: 'Mano derecha',
  tibiaL: 'Tibia y peroné izquierdos', tibiaR: 'Tibia y peroné derechos', footL: 'Pie izquierdo', footR: 'Pie derecho',
};
export function boneLabel(name) {
  if (NAMES[name]) return NAMES[name];
  const m = /^rib([LR])(\d+)$/.exec(name);
  if (m) return `Costilla ${m[2]} ${m[1] === 'L' ? 'izquierda' : 'derecha'}`;
  const r = { L: 'lumbar', T: 'torácica', C: 'cervical' }[name[0]];
  if (name === 'C1') return 'Atlas (C1)';
  if (name === 'C2') return 'Axis (C2)';
  return `Vértebra ${r} ${name}`;
}

// Hueso del rig al que se ancla cada malla
export function rigBoneFor(rec) {
  if (rec.frame === 'world') {
    if (rec.name === 'pelvis') return 'pelvis';
    if (rec.name.startsWith('femur')) return rec.name;
    if (rec.name === 'sternum') return 'sternum';
    const m = /^(humerus|forearm|hand|tibia|foot)([LR])$/.exec(rec.name);
    if (m) return (m[1] === 'hand' ? 'forearm' : m[1]) + m[2];
    if (/(scapula|clavicle)L/.test(rec.name)) return 'shoulderL';
    if (/(scapula|clavicle)R/.test(rec.name)) return 'shoulderR';
  }
  if (rec.name === 'sacrum' || rec.name === 'coccyx') return 'S1';
  if (rec.name.startsWith('rib')) return rec.frame; // T1..T12
  return rec.frame;
}
