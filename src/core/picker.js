// Selección por GPU: renderiza un píxel con un color por estructura (funciona con mallas deformadas y cortes)
import * as THREE from 'three';

export class Picker {
  constructor(renderer, scene, camera, items) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType });
    this.buf = new Uint8Array(4);
    this.items = [];
    this.meshToId = new Map();
    this.mats = new Map();
    this.register(items);
  }
  register(items) {
    for (const it of items) {
      const meshes = [it.mesh];
      for (const m of meshes) {
        if (!m || this.meshToId.has(m)) continue;
        const id = this.items.length + 1;
        this.items.push(it);
        this.meshToId.set(m, id);
        const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
        mat.color.setRGB((id & 255) / 255, ((id >> 8) & 255) / 255, ((id >> 16) & 255) / 255, THREE.LinearSRGBColorSpace);
        this.mats.set(m, mat);
      }
    }
  }
  pick(clientX, clientY) {
    const r = this.renderer;
    const canvas = r.domElement;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    const dpr = r.getPixelRatio();
    const saved = [];
    this.scene.traverse((o) => {
      if (!o.isMesh) return;
      const pm = this.mats.get(o);
      if (pm) { saved.push([o, o.material, o.visible]); o.material = pm; }
      else if (o.visible) { saved.push([o, o.material, true]); o.visible = false; }
    });
    const bg = this.scene.background;
    this.scene.background = null;
    const prevTarget = r.getRenderTarget();
    const prevClear = r.getClearColor(new THREE.Color());
    const prevAlpha = r.getClearAlpha();
    const shadow = r.shadowMap.enabled;
    r.shadowMap.enabled = false;
    const v = this.camera.view;
    const base = v && v.enabled ? { ...v } : null;
    const ox = base ? base.offsetX : 0, oy = base ? base.offsetY : 0;
    this.camera.setViewOffset(rect.width * dpr, rect.height * dpr, Math.floor((x + ox) * dpr), Math.floor((y + oy) * dpr), 1, 1);
    r.setRenderTarget(this.target);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(this.scene, this.camera);
    r.readRenderTargetPixels(this.target, 0, 0, 1, 1, this.buf);
    if (base) this.camera.setViewOffset(base.fullWidth, base.fullHeight, base.offsetX, base.offsetY, base.width, base.height); else this.camera.clearViewOffset();
    r.setRenderTarget(prevTarget);
    r.setClearColor(prevClear, prevAlpha);
    r.shadowMap.enabled = shadow;
    this.scene.background = bg;
    for (const [o, m, v] of saved) { o.material = m; o.visible = v; }
    const id = this.buf[0] | (this.buf[1] << 8) | (this.buf[2] << 16);
    return id > 0 ? this.items[id - 1] || null : null;
  }
}
