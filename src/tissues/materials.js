// Materiales de tejidos blandos con textura de fibras procedural y coloreado por estado
import * as THREE from 'three';
import { CAP_GLSL } from '../core/bones.js';

function fiberNormalMap(kind = 'muscle') {
  const W = 256, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  // altura: haces de fibras a lo largo de u (x); variación a lo largo de v (y)
  const hgt = new Float32Array(W * H);
  let seed = kind === 'muscle' ? 7 : kind === 'nerve' ? 11 : 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const bands = kind === 'muscle' ? 34 : kind === 'nerve' ? 14 : 60;
  const phases = Array.from({ length: 8 }, () => rnd() * 6.28);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / H, u = x / W;
    const wob = Math.sin(u * 6.28 * 2 + phases[0]) * 0.012 + Math.sin(u * 6.28 * 5 + phases[1]) * 0.006;
    const b = (v + wob) * bands;
    let h = 0.5 + 0.5 * Math.cos(b * 6.28);
    h = Math.pow(h, kind === 'ligament' ? 0.6 : 1.4);
    const fine = 0.5 + 0.5 * Math.sin((v + wob * 0.5) * bands * 4.1 * 6.28 + Math.sin(u * 40) * 0.4);
    hgt[y * W + x] = h * 0.75 + fine * 0.25;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const dy = hgt[((y + 1) % H) * W + x] - hgt[((y - 1 + H) % H) * W + x];
    const dx = hgt[y * W + ((x + 1) % W)] - hgt[y * W + ((x - 1 + W) % W)];
    const n = new THREE.Vector3(-dx * 1.5, -dy * 1.5, 1).normalize();
    img.data[i * 4] = (n.x * 0.5 + 0.5) * 255;
    img.data[i * 4 + 1] = (n.y * 0.5 + 0.5) * 255;
    img.data[i * 4 + 2] = (n.z * 0.5 + 0.5) * 255;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

let MAPS = null;
function maps() {
  if (!MAPS) MAPS = { muscle: fiberNormalMap('muscle'), ligament: fiberNormalMap('ligament'), nerve: fiberNormalMap('nerve') };
  return MAPS;
}

// uniforms compartidos por todos los tejidos
export const tissueUniforms = {
  uStrandTex: { value: null },
  uStrandMax: { value: 2048 },
  uMode: { value: 0 }, // 0 anatómico, 1 estiramiento, 2 actividad
  uTime: { value: 0 },
};

export function tissueMaterial(kind, opts = {}) {
  const base = {
    muscle: { roughness: 0.48, metalness: 0, normalScale: new THREE.Vector2(0.55, 0.55), sheen: 0.4, sheenColor: new THREE.Color(0xff9a8a), sheenRoughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.35 },
    ligament: { roughness: 0.32, metalness: 0, normalScale: new THREE.Vector2(0.4, 0.4), sheen: 0.6, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25 },
    nerve: { roughness: 0.38, metalness: 0, normalScale: new THREE.Vector2(0.5, 0.5), sheen: 0.5, sheenColor: new THREE.Color(0xfff3c0), sheenRoughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.3 },
    fascia: { roughness: 0.3, metalness: 0, normalScale: new THREE.Vector2(0.3, 0.3), sheen: 0.8, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 },
  }[kind];
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    normalMap: maps()[kind === 'fascia' ? 'ligament' : kind],
    side: THREE.DoubleSide,
    ...base,
    ...opts,
  });
  m.userData.kind = kind;
  m.userData.uniforms = { uHighlight: { value: new THREE.Color(0, 0, 0) }, uCapColor: { value: new THREE.Color(kind === 'muscle' ? 0x7d2620 : kind === 'nerve' ? 0xc9a43a : 0xd8d2c4) } };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, tissueUniforms, m.userData.uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float sid;
        uniform sampler2D uStrandTex;
        uniform float uStrandMax;
        varying vec4 vState;
        varying vec3 vWPos;`)
      .replace('#include <color_vertex>', `#include <color_vertex>
        vState = texture2D(uStrandTex, vec2((sid + 0.5) / uStrandMax, 0.5));`)
      .replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec4 vState;
        varying vec3 vWPos;
        uniform float uMode;
        uniform float uTime;
        uniform vec3 uHighlight;
        uniform vec3 uCapColor;
        ${CAP_GLSL}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float strain = vState.x;
          float act = vState.y;
          float hl = vState.z;
          float comp = vState.w;
          ${kind === 'nerve' ? `
          // nervio: tensión (naranja) y compresión (rojo pulsante)
          float tens = smoothstep(0.015, 0.09, strain);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.45, 0.08), tens * 0.75);
          float pulse = 0.65 + 0.35 * sin(uTime * 5.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.08, 0.05), clamp(comp, 0.0, 1.0) * pulse);
          ` : `
          if (uMode > 0.5 && uMode < 1.5) {
            vec3 cLong = vec3(0.18, 0.45, 0.95);
            vec3 cShort = vec3(1.0, 0.55, 0.12);
            float s = clamp(strain / 0.12, -1.0, 1.0);
            vec3 neutral = diffuseColor.rgb * 0.55 + vec3(0.25);
            diffuseColor.rgb = s > 0.0 ? mix(neutral, cLong, s) : mix(neutral, cShort, -s);
          } else if (uMode > 1.5) {
            vec3 cool = diffuseColor.rgb * 0.35 + vec3(0.18, 0.2, 0.24);
            vec3 hot = mix(vec3(1.0, 0.25, 0.1), vec3(1.0, 0.85, 0.3), smoothstep(0.6, 1.0, act));
            diffuseColor.rgb = mix(cool, hot, smoothstep(0.02, 0.9, act));
          }
          `}
          diffuseColor.rgb += hl * vec3(0.25, 0.22, 0.05);
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += uHighlight + vState.z * vec3(0.32, 0.22, 0.04);
        ${kind === 'nerve' ? 'totalEmissiveRadiance += vec3(0.6, 0.04, 0.02) * clamp(vState.w, 0.0, 1.0) * (0.6 + 0.4 * sin(uTime * 5.0));' : ''}
        ${kind === 'muscle' ? 'if (uMode > 1.5) totalEmissiveRadiance += vec3(0.35, 0.08, 0.02) * smoothstep(0.3, 1.0, vState.y);' : ''}`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        if (!gl_FrontFacing) {
          float n = vnoise(vWPos * 1.6);
          gl_FragColor = vec4(uCapColor * (0.75 + 0.35 * n), gl_FragColor.a);
        }`);
  };
  m.customProgramCacheKey = () => 'tissue-' + kind + (opts.transparent ? '-t' : '');
  return m;
}
