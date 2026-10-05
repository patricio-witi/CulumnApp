// Fibras deformables: tubos de sección elíptica a lo largo de una spline anclada a varios huesos.
// Cada vértice se "pega" (skinning) a los huesos de los puntos de control vecinos, de modo que
// el tejido se estira, acorta y curva al mover la columna.
import * as THREE from 'three';

const _v = new THREE.Vector3();

export class StrandRegistry {
  constructor(rig, resolver, max = 2048) {
    this.rig = rig;
    this.resolver = resolver;
    this.strands = [];
    this.max = max;
    // fila 0: estiramiento, actividad, resaltado, compresión · fila 1: señal de dolor, edema, defensa muscular
    this.data = new Float32Array(max * 4 * 2);
    this.tex = new THREE.DataTexture(this.data, max, 2, THREE.RGBAFormat, THREE.FloatType);
    this.tex.needsUpdate = true;
    this.boneIndex = Object.fromEntries(rig.boneList.map((b, i) => [b.name, i]));
    this.skeleton = new THREE.Skeleton(rig.boneList);
  }

  // def: { pts:[anchor...], r:[[w,h]...] | [w,h], up:[x,y,z] | 'perPoint', tendon:[a,b], seg:int, radial:int,
  //        color, tendonColor, ao: bool, taper: [a,b] }
  build(def) {
    const P = def.pts.map((s) => this.resolver.resolve(s));
    const id = this.strands.length;
    const restPts = P.map((a) => a.rest.clone());
    let restLen = 0;
    for (let i = 1; i < restPts.length; i++) restLen += restPts[i].distanceTo(restPts[i - 1]);
    const strand = { id, def, anchors: P, restLen, len: restLen, strain: 0, act: 0, hl: 0 };
    this.strands.push(strand);
    return strand;
  }

  // Genera la geometría de varias fibras en un solo BufferGeometry con skinning
  geometry(strands, opts = {}) {
    const radial = opts.radial ?? 10;
    const pos = [], nrm = [], uv = [], col = [], si = [], sw = [], sid = [], idx = [];
    const tmpColor = new THREE.Color();
    for (const st of strands) {
      const def = st.def;
      const P = st.anchors.map((a) => a.rest);
      const n = P.length;
      const perSpan = def.seg ?? Math.max(3, Math.round(st.restLen / (n - 1) / (opts.step ?? 6.5)));
      const curve = new THREE.CatmullRomCurve3(P, false, 'centripetal', 0.5);
      const R = typeof def.r[0] === 'number' ? P.map(() => def.r) : def.r;
      const samples = [];
      const total = (n - 1) * perSpan;
      for (let i = 0; i <= total; i++) {
        const span = Math.min(Math.floor(i / perSpan), n - 2);
        const f = i / perSpan - span;
        const t = i / total;
        samples.push({ t, span, f, p: curve.getPoint(t), tan: curve.getTangent(t) });
      }
      // longitud acumulada
      let acc = 0;
      samples.forEach((s, i) => { if (i) acc += s.p.distanceTo(samples[i - 1].p); s.s = acc; });
      const L = acc || 1;
      // vector "arriba" de referencia (normal del aplanamiento)
      let upFn;
      if (def.normals) {
        const N = def.normals.map((nv, i) => (Array.isArray(nv) ? this.resolver.restDir(st.anchors[i].bone, nv) : nv));
        upFn = (s) => N[s.span].clone().lerp(N[s.span + 1], s.f).normalize();
      } else {
        const up = new THREE.Vector3(...(def.up || [0, 0, -1])).normalize();
        upFn = () => up;
      }
      const [ta, tb] = def.tendon || [0, 0];
      const [pa, pb] = def.taper || [0.3, 0.3];
      const base = new THREE.Color(def.color ?? 0xa83a32);
      const tend = new THREE.Color(def.tendonColor ?? 0xd8d0bf);
      const start = pos.length / 3;
      let prevSide = null;
      for (const s of samples) {
        const a = s.s / L;
        // perfil: vientre muscular con tendones afinados en los extremos
        let k = 1;
        let tw = 0;
        if (ta > 0 && a < ta) { const u = a / ta; k = pa + (1 - pa) * smooth(u); tw = 1 - smooth(u); }
        if (tb > 0 && a > 1 - tb) { const u = (1 - a) / tb; k = Math.min(k, pb + (1 - pb) * smooth(u)); tw = Math.max(tw, 1 - smooth(u)); }
        if (def.endTaper) k *= Math.min(1, 0.55 + 0.45 * Math.min(a, 1 - a) * 8);
        if (def.bands) for (const b of def.bands) tw = Math.max(tw, Math.exp(-(((a - b) / 0.018) ** 2)) * 0.85);
        const r0 = R[s.span], r1 = R[s.span + 1];
        const fe = smooth(s.f);
        let w = (r0[0] + (r1[0] - r0[0]) * fe) * k;
        let h = (r0[1] + (r1[1] - r0[1]) * fe) * (ta || tb ? Math.max(k, 0.55) : k);
        if (def.belly) { const bb = Math.sin(Math.PI * a); w *= 0.75 + 0.25 * bb + (def.belly - 1) * bb; h *= 0.75 + 0.25 * bb + (def.belly - 1) * bb; }
        const T = s.tan;
        let side = new THREE.Vector3().crossVectors(T, upFn(s));
        if (side.lengthSq() < 1e-6) side = prevSide ? prevSide.clone() : new THREE.Vector3(1, 0, 0);
        side.normalize();
        if (prevSide && side.dot(prevSide) < 0) side.negate();
        prevSide = side;
        const N = new THREE.Vector3().crossVectors(side, T).normalize();
        // pesos de skinning: huesos de los puntos de control vecinos
        const b0 = this.boneIndex[st.anchors[s.span].bone];
        const b1 = this.boneIndex[st.anchors[s.span + 1].bone];
        const w1 = b0 === b1 ? 0 : fe;
        tmpColor.copy(base).lerp(tend, tw);
        for (let j = 0; j <= radial; j++) {
          const th = (j / radial) * Math.PI * 2;
          const c = Math.cos(th), sn = Math.sin(th);
          const px = s.p.x + side.x * c * w + N.x * sn * h;
          const py = s.p.y + side.y * c * w + N.y * sn * h;
          const pz = s.p.z + side.z * c * w + N.z * sn * h;
          pos.push(px, py, pz);
          _v.set(side.x * c * h + N.x * sn * w, side.y * c * h + N.y * sn * w, side.z * c * h + N.z * sn * w).normalize();
          nrm.push(_v.x, _v.y, _v.z);
          uv.push(s.s / 18, j / radial);
          col.push(tmpColor.r, tmpColor.g, tmpColor.b);
          si.push(b0, b1, 0, 0);
          sw.push(1 - w1, w1, 0, 0);
          sid.push(st.id);
        }
      }
      const rows = samples.length;
      for (let i = 0; i < rows - 1; i++) {
        for (let j = 0; j < radial; j++) {
          const a = start + i * (radial + 1) + j;
          const b = a + radial + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
      // tapas en los extremos
      for (const end of [0, rows - 1]) {
        const s = samples[end];
        const ci = pos.length / 3;
        pos.push(s.p.x, s.p.y, s.p.z);
        const tn = s.tan.clone().multiplyScalar(end === 0 ? -1 : 1);
        nrm.push(tn.x, tn.y, tn.z);
        uv.push(s.s / 18, 0.5);
        const lastCol = col.slice(col.length - 3);
        col.push(...lastCol);
        const b0 = this.boneIndex[st.anchors[s.span].bone];
        const b1 = this.boneIndex[st.anchors[s.span + 1].bone];
        const w1 = b0 === b1 ? 0 : smooth(s.f);
        si.push(b0, b1, 0, 0); sw.push(1 - w1, w1, 0, 0); sid.push(st.id);
        for (let j = 0; j < radial; j++) {
          const a = start + end * (radial + 1) + j;
          if (end === 0) idx.push(ci, a + 1, a); else idx.push(ci, a, a + 1);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    g.setAttribute('sid', new THREE.Float32BufferAttribute(sid, 1));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }

  mesh(strands, material, opts = {}) {
    const g = this.geometry(strands, opts);
    const m = new THREE.SkinnedMesh(g, material);
    m.bind(this.skeleton, new THREE.Matrix4());
    m.frustumCulled = false;
    m.castShadow = opts.castShadow ?? true;
    m.receiveShadow = true;
    m.userData.strands = strands;
    return m;
  }

  // Recalcula longitudes actuales (para deformación y estado de cada fibra)
  update() {
    for (const st of this.strands) {
      let L = 0, prev = null;
      for (const a of st.anchors) {
        const p = a.cur || (a.cur = new THREE.Vector3());
        p.copy(a.local).applyMatrix4(this.rig.bones[a.bone].matrixWorld);
        if (prev) L += p.distanceTo(prev);
        prev = p;
      }
      st.len = L;
      st.strain = L / st.restLen - 1;
      const i = st.id * 4;
      this.data[i] = st.strain;
      this.data[i + 1] = st.act;
      this.data[i + 2] = st.hl;
      this.data[i + 3] = st.extra || 0;
      const j = (this.max + st.id) * 4;
      this.data[j] = st.signal || 0;
      this.data[j + 1] = st.edema || 0;
      this.data[j + 2] = st.guard || 0;
    }
    this.tex.needsUpdate = true;
  }
}

function smooth(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
