// Biblioteca mínima de campos de distancia con signo (SDF) + mallador "surface nets".
// Cada primitiva es una función (x, y, z) => distancia (mm). Negativo = dentro del hueso.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------- vectores ----------
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mirrorX = (p) => [-p[0], p[1], p[2]];

// base ortonormal con eje principal "u" y vector de referencia "up"
export function basis(u, up = [0, 1, 0]) {
  u = norm(u);
  let e1 = cross(up, u);
  if (len(e1) < 1e-6) e1 = cross([1, 0, 0], u);
  e1 = norm(e1);
  const e2 = norm(cross(u, e1));
  return [e1, u, e2]; // columnas: x, y(eje), z
}

// ---------- operaciones ----------
export const U = (...fs) => (x, y, z) => { let d = Infinity; for (const f of fs) { const v = f(x, y, z); if (v < d) d = v; } return d; };
export function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export function smax(a, b, k) { return -smin(-a, -b, k); }
export const SU = (k, ...fs) => (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < fs.length; i++) d = smin(d, fs[i](x, y, z), k); return d; };
export const SUB = (a, b) => (x, y, z) => Math.max(a(x, y, z), -b(x, y, z));
export const SSUB = (k, a, b) => (x, y, z) => smax(a(x, y, z), -b(x, y, z), k);
export const I = (a, b) => (x, y, z) => Math.max(a(x, y, z), b(x, y, z));
export const SI = (k, a, b) => (x, y, z) => smax(a(x, y, z), b(x, y, z), k);
export const offset = (f, r) => (x, y, z) => f(x, y, z) - r;
export const shell = (f, t) => (x, y, z) => Math.abs(f(x, y, z)) - t;
export const mirror = (f) => (x, y, z) => f(Math.abs(x), y, z); // simetría bilateral (define el lado x>0)
export const flipX = (f) => (x, y, z) => f(-x, y, z);

// Transforma una primitiva: centro c, matriz de base B (3 columnas como vectores)
export function place(f, c, B) {
  const [e1, e2, e3] = B;
  return (x, y, z) => {
    const px = x - c[0], py = y - c[1], pz = z - c[2];
    return f(px * e1[0] + py * e1[1] + pz * e1[2], px * e2[0] + py * e2[1] + pz * e2[2], px * e3[0] + py * e3[1] + pz * e3[2]);
  };
}

// ---------- primitivas ----------
export const sphere = (c, r) => (x, y, z) => Math.hypot(x - c[0], y - c[1], z - c[2]) - r;

export function ellipsoid(c, r, B = null) {
  const f = (x, y, z) => {
    const k0 = Math.hypot(x / r[0], y / r[1], z / r[2]);
    const k1 = Math.hypot(x / (r[0] * r[0]), y / (r[1] * r[1]), z / (r[2] * r[2]));
    return k1 === 0 ? -Math.min(r[0], r[1], r[2]) : (k0 * (k0 - 1)) / k1;
  };
  if (B) return place(f, c, B);
  return (x, y, z) => f(x - c[0], y - c[1], z - c[2]);
}

export function capsule(a, b, r) {
  const ba = sub(b, a);
  const bb = dot(ba, ba) || 1e-9;
  return (x, y, z) => {
    const px = x - a[0], py = y - a[1], pz = z - a[2];
    const h = clamp((px * ba[0] + py * ba[1] + pz * ba[2]) / bb, 0, 1);
    return Math.hypot(px - ba[0] * h, py - ba[1] * h, pz - ba[2] * h) - r;
  };
}

// Cono redondeado (iq): esferas de radio r1 en a y r2 en b unidas tangencialmente
export function roundCone(a, b, r1, r2) {
  const ba = sub(b, a);
  const l2 = dot(ba, ba);
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  return (x, y, z) => {
    const pa = [x - a[0], y - a[1], z - a[2]];
    const yv = dot(pa, ba);
    const zv = yv - l2;
    const xv = [pa[0] * l2 - ba[0] * yv, pa[1] * l2 - ba[1] * yv, pa[2] * l2 - ba[2] * yv];
    const x2 = dot(xv, xv);
    const y2 = yv * yv * l2;
    const z2 = zv * zv * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zv) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yv) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yv * rr) * il2 - r1;
  };
}

// "Miembro": segmento con sección elíptica que puede afinarse.
// rA=[ancho, alto] en a, rB en b; "up" orienta el eje del alto.
export function limb(a, b, rA, rB = rA, up = [0, 1, 0]) {
  const ab = sub(b, a);
  const L = len(ab);
  const u = mul(ab, 1 / (L || 1));
  let e1 = cross(up, u);
  if (len(e1) < 1e-6) e1 = cross([0, 0, 1], u);
  e1 = norm(e1);
  const e2 = norm(cross(u, e1));
  return (x, y, z) => {
    const px = x - a[0], py = y - a[1], pz = z - a[2];
    const along = px * u[0] + py * u[1] + pz * u[2];
    const t = clamp(along / L, 0, 1);
    const rw = rA[0] + (rB[0] - rA[0]) * t;
    const rh = rA[1] + (rB[1] - rA[1]) * t;
    const rm = Math.min(rw, rh);
    const ax = along - t * L;
    const q1 = px * e1[0] + py * e1[1] + pz * e1[2];
    const q2 = px * e2[0] + py * e2[1] + pz * e2[2];
    return (Math.hypot(q1 / rw, q2 / rh, ax / rm) - 1) * rm;
  };
}

// Cadena de miembros a lo largo de una polilínea, con radios por punto
export function chain(points, radii, up = [0, 1, 0], k = 0) {
  const fs = [];
  for (let i = 0; i < points.length - 1; i++) fs.push(limb(points[i], points[i + 1], radii[i], radii[i + 1], up));
  return k > 0 ? SU(k, ...fs) : U(...fs);
}

export function roundBox(c, half, B = null, r = 0) {
  const f = (x, y, z) => {
    const qx = Math.abs(x) - half[0] + r, qy = Math.abs(y) - half[1] + r, qz = Math.abs(z) - half[2] + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  };
  if (B) return place(f, c, B);
  return (x, y, z) => f(x - c[0], y - c[1], z - c[2]);
}

// Cilindro con eje en la base dada (eje Y local), radio r, semialtura h
export function cylinder(c, r, h, B = null, round = 0) {
  const f = (x, y, z) => {
    const dx = Math.hypot(x, z) - r + round, dy = Math.abs(y) - h + round;
    return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - round;
  };
  if (B) return place(f, c, B);
  return (x, y, z) => f(x - c[0], y - c[1], z - c[2]);
}

// Cilindro elíptico (eje Y local)
export function ellCylinder(c, rx, rz, h, B = null, round = 0) {
  const f = (x, y, z) => {
    const k0 = Math.hypot(x / rx, z / rz);
    const k1 = Math.hypot(x / (rx * rx), z / (rz * rz));
    const d2 = k1 === 0 ? -Math.min(rx, rz) : (k0 * (k0 - 1)) / k1;
    const dx = d2 + round, dy = Math.abs(y) - h + round;
    return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - round;
  };
  if (B) return place(f, c, B);
  return (x, y, z) => f(x - c[0], y - c[1], z - c[2]);
}

export function torus(c, R, r, B = null) {
  const f = (x, y, z) => Math.hypot(Math.hypot(x, z) - R, y) - r;
  if (B) return place(f, c, B);
  return (x, y, z) => f(x - c[0], y - c[1], z - c[2]);
}

export const halfSpace = (p0, n) => { n = norm(n); return (x, y, z) => (x - p0[0]) * n[0] + (y - p0[1]) * n[1] + (z - p0[2]) * n[2]; };

// Polígono 2D (iq): distancia con signo a un polígono cerrado
export function polygon2D(pts) {
  return (px, py) => {
    let d = (px - pts[0][0]) ** 2 + (py - pts[0][1]) ** 2;
    let s = 1;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i++) {
      const ex = pts[j][0] - pts[i][0], ey = pts[j][1] - pts[i][1];
      const wx = px - pts[i][0], wy = py - pts[i][1];
      const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
      const bx = wx - ex * t, by = wy - ey * t;
      d = Math.min(d, bx * bx + by * by);
      const c1 = py >= pts[i][1], c2 = py < pts[j][1], c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  };
}

// Placa: polígono 2D extruido (grosor t) en un plano definido por origen y base [e1,e2,n]
export function plate(origin, B, pts2d, t, round = 0.8) {
  const poly = polygon2D(pts2d);
  return (x, y, z) => {
    const px = x - origin[0], py = y - origin[1], pz = z - origin[2];
    const u = px * B[0][0] + py * B[0][1] + pz * B[0][2];
    const v = px * B[1][0] + py * B[1][1] + pz * B[1][2];
    const w = px * B[2][0] + py * B[2][1] + pz * B[2][2];
    const d2 = poly(u, v) + round;
    const dw = Math.abs(w) - t / 2 + round;
    return Math.min(Math.max(d2, dw), 0) + Math.hypot(Math.max(d2, 0), Math.max(dw, 0)) - round;
  };
}

// ---------- ruido (Perlin mejorado) ----------
const perm = new Uint8Array(512);
(() => {
  const p = [];
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
})();
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function grad(h, x, y, z) {
  const hh = h & 15;
  const u = hh < 8 ? x : y;
  const v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z;
  return ((hh & 1) === 0 ? u : -u) + ((hh & 2) === 0 ? v : -v);
}
export function noise3(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
  const l = (a, b, t) => a + t * (b - a);
  return l(
    l(l(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), l(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
    l(l(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), l(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
    w,
  );
}
export function fbm(x, y, z, oct = 3) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); a *= 0.5; f *= 2.03; }
  return s;
}
export const roughen = (f, amp, freq) => (x, y, z) => {
  const d = f(x, y, z);
  if (d > amp * 4) return d;
  return d + amp * fbm(x * freq, y * freq, z * freq, 2);
};

// ---------- mallado: surface nets con evaluación dispersa por bloques ----------
export function meshSDF(f, bmin, bmax, voxel) {
  const nx = Math.ceil((bmax[0] - bmin[0]) / voxel) + 3;
  const ny = Math.ceil((bmax[1] - bmin[1]) / voxel) + 3;
  const nz = Math.ceil((bmax[2] - bmin[2]) / voxel) + 3;
  const ox = bmin[0] - voxel, oy = bmin[1] - voxel, oz = bmin[2] - voxel;
  const N = nx * ny * nz;
  const vals = new Float32Array(N);
  const B = 6;
  const rBlock = Math.sqrt(3) * (B / 2) * voxel;
  let evals = 0;
  for (let bz = 0; bz < nz; bz += B) for (let by = 0; by < ny; by += B) for (let bx = 0; bx < nx; bx += B) {
    const ex = Math.min(bx + B, nx), ey = Math.min(by + B, ny), ez = Math.min(bz + B, nz);
    const cx = ox + ((bx + ex - 1) / 2) * voxel, cy = oy + ((by + ey - 1) / 2) * voxel, cz = oz + ((bz + ez - 1) / 2) * voxel;
    const dc = f(cx, cy, cz);
    evals++;
    if (Math.abs(dc) > rBlock * 1.6 + voxel * 2) {
      for (let k = bz; k < ez; k++) for (let j = by; j < ey; j++) for (let i = bx; i < ex; i++) vals[i + nx * (j + ny * k)] = dc;
      continue;
    }
    for (let k = bz; k < ez; k++) for (let j = by; j < ey; j++) for (let i = bx; i < ex; i++) {
      vals[i + nx * (j + ny * k)] = f(ox + i * voxel, oy + j * voxel, oz + k * voxel);
      evals++;
    }
  }
  // borde exterior siempre "fuera"
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) {
      const id = i + nx * (j + ny * k);
      if (vals[id] < voxel) vals[id] = voxel;
    }
  }
  const cellIndex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const pos = [];
  const cid = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const corner = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const v = vals[i + corner[c][0] + nx * (j + corner[c][1] + ny * (k + corner[c][2]))];
      cv[c] = v;
      if (v < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, cnt = 0;
    for (const [a, b] of edges) {
      const va = cv[a], vb = cv[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      sx += corner[a][0] + (corner[b][0] - corner[a][0]) * t;
      sy += corner[a][1] + (corner[b][1] - corner[a][1]) * t;
      sz += corner[a][2] + (corner[b][2] - corner[a][2]) * t;
      cnt++;
    }
    cellIndex[cid(i, j, k)] = pos.length / 3;
    pos.push(ox + (i + sx / cnt) * voxel, oy + (j + sy / cnt) * voxel, oz + (k + sz / cnt) * voxel);
  }
  const idx = [];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, d, c, a, c, b);
    else idx.push(a, b, c, a, c, d);
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v0 = vals[i + nx * (j + ny * k)];
    const inside = v0 < 0;
    if (i < nx - 1 && j > 0 && k > 0 && j < ny - 1 && k < nz - 1) {
      const v1 = vals[i + 1 + nx * (j + ny * k)];
      if ((v1 < 0) !== inside) quad(cellIndex[cid(i, j - 1, k - 1)], cellIndex[cid(i, j, k - 1)], cellIndex[cid(i, j, k)], cellIndex[cid(i, j - 1, k)], !inside);
    }
    if (j < ny - 1 && i > 0 && k > 0 && i < nx - 1 && k < nz - 1) {
      const v1 = vals[i + nx * (j + 1 + ny * k)];
      if ((v1 < 0) !== inside) quad(cellIndex[cid(i - 1, j, k - 1)], cellIndex[cid(i - 1, j, k)], cellIndex[cid(i, j, k)], cellIndex[cid(i, j, k - 1)], !inside);
    }
    if (k < nz - 1 && i > 0 && j > 0 && i < nx - 1 && j < ny - 1) {
      const v1 = vals[i + nx * (j + ny * (k + 1))];
      if ((v1 < 0) !== inside) quad(cellIndex[cid(i - 1, j - 1, k)], cellIndex[cid(i, j - 1, k)], cellIndex[cid(i, j, k)], cellIndex[cid(i - 1, j, k)], !inside);
    }
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx), evals };
}

export function gradient(f, x, y, z, h) {
  return [
    f(x + h, y, z) - f(x - h, y, z),
    f(x, y + h, z) - f(x, y - h, z),
    f(x, y, z + h) - f(x, y, z - h),
  ];
}

export function projectToSurface(f, positions, voxel, iters = 2) {
  const h = voxel * 0.3;
  for (let i = 0; i < positions.length; i += 3) {
    let x = positions[i], y = positions[i + 1], z = positions[i + 2];
    for (let it = 0; it < iters; it++) {
      const d = f(x, y, z);
      const g = gradient(f, x, y, z, h);
      const gl2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (gl2 < 1e-12) break;
      const gl = Math.sqrt(gl2);
      let step = d / gl * (2 * h) / 1; // g está escalado por 2h
      step = clamp(step, -voxel * 0.5, voxel * 0.5);
      x -= (g[0] / gl) * step; y -= (g[1] / gl) * step; z -= (g[2] / gl) * step;
    }
    positions[i] = x; positions[i + 1] = y; positions[i + 2] = z;
  }
}

export function sdfNormals(f, positions, h) {
  const n = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const g = norm(gradient(f, positions[i], positions[i + 1], positions[i + 2], h));
    n[i] = g[0]; n[i + 1] = g[1]; n[i + 2] = g[2];
  }
  return n;
}

// Oclusión ambiental aproximada evaluando el SDF a lo largo de la normal
export function sdfAO(f, positions, normals, step, samples = 5) {
  const ao = new Float32Array(positions.length / 3);
  for (let v = 0; v < ao.length; v++) {
    const i = v * 3;
    let occ = 0, w = 1;
    for (let s = 1; s <= samples; s++) {
      const hh = s * step;
      const d = f(positions[i] + normals[i] * hh, positions[i + 1] + normals[i + 1] * hh, positions[i + 2] + normals[i + 2] * hh);
      occ += w * Math.max(0, hh - d) / hh;
      w *= 0.6;
    }
    ao[v] = clamp(1 - occ * 0.55, 0.25, 1);
  }
  return ao;
}
