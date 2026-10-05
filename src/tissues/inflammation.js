// Nube inflamatoria: partículas que representan mediadores químicos (TNF-α, IL-1β, IL-6, PLA2…)
// liberados alrededor del material discal herniado, de la raíz irritada o de una faceta inflamada.
// Es una representación didáctica: no se trata de partículas físicas a escala.
import * as THREE from 'three';

const VS = /* glsl */`
  attribute vec3 offset;
  attribute float seed;
  uniform vec3 uCenter;
  uniform vec3 uAxis;
  uniform float uRadius;
  uniform float uSpread;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSize;
  varying float vA;
  varying float vHot;
  void main() {
    // las partículas respiran y se difunden lentamente; algunas se alinean con la raíz (uAxis)
    float t = uTime * (0.25 + 0.35 * fract(seed * 7.13));
    vec3 drift = vec3(sin(t + seed * 6.28), cos(t * 0.8 + seed * 3.1), sin(t * 0.6 + seed * 9.4)) * 0.35;
    float along = (fract(seed * 3.7) - 0.5) * 2.0 * uSpread;
    vec3 p = uCenter + (offset + drift) * uRadius + uAxis * along;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + seed * 12.0);
    vA = uIntensity * pulse * (1.0 - smoothstep(0.6, 1.6, length(offset)));
    vHot = fract(seed * 13.7);
    gl_PointSize = uSize * (0.6 + 0.8 * fract(seed * 5.3)) * (300.0 / -mv.z);
  }`;
const FS = /* glsl */`
  varying float vA;
  varying float vHot;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    vec3 col = mix(vec3(1.0, 0.22, 0.08), vec3(1.0, 0.75, 0.25), vHot * 0.6);
    gl_FragColor = vec4(col, soft * vA * 0.55);
  }`;

export class InflammationFX {
  constructor(scene, count = 700) {
    this.group = new THREE.Group();
    this.group.name = 'inflamación';
    scene.add(this.group);
    this.sites = [];
    const g = new THREE.BufferGeometry();
    const off = new Float32Array(count * 3), seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // distribución gaussiana aproximada
      const u = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      off.set([u(), u(), u()], i * 3);
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('offset', new THREE.BufferAttribute(off, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    this.geo = g;
  }
  site(key) {
    let s = this.sites.find((x) => x.key === key);
    if (s) return s;
    const uniforms = {
      uCenter: { value: new THREE.Vector3() }, uAxis: { value: new THREE.Vector3(0, 1, 0) },
      uRadius: { value: 8 }, uSpread: { value: 0 }, uTime: { value: 0 }, uIntensity: { value: 0 }, uSize: { value: 9 },
    };
    const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(this.geo, m);
    pts.frustumCulled = false;
    pts.renderOrder = 20;
    this.group.add(pts);
    s = { key, pts, uniforms };
    this.sites.push(s);
    return s;
  }
  set(key, { center, axis, radius = 8, spread = 0, intensity = 1, size = 9 }) {
    const s = this.site(key);
    s.uniforms.uCenter.value.copy(center);
    if (axis) s.uniforms.uAxis.value.copy(axis).normalize();
    s.uniforms.uRadius.value = radius;
    s.uniforms.uSpread.value = spread;
    s.uniforms.uIntensity.value = intensity;
    s.uniforms.uSize.value = size;
    s.pts.visible = intensity > 0.01;
  }
  clear() { for (const s of this.sites) { s.uniforms.uIntensity.value = 0; s.pts.visible = false; } }
  tick(t) { for (const s of this.sites) s.uniforms.uTime.value = t; }
}
