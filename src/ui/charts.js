// Gráficos SVG ligeros: ángulos por nivel (múltiplos pequeños divergentes), barra de presión con referencias,
// y mapa de dermatomas esquemático.
import { SEGMENTS } from '../anatomy/spine-data.js';
import { WILKE } from '../sim/biomech.js';

const ORDER = [...SEGMENTS].reverse(); // de C0-C1 (arriba) a L5-S1 (abajo)
const fmt = (v, d = 1) => (Math.abs(v) < 0.05 ? '0' : v.toFixed(d)).replace('.', ',');

export function anglesChart(svg, segState, tooltip) {
  const W = 360, rowH = 10, top = 30, left = 44, gap = 10;
  const colW = (W - left - gap * 2) / 3;
  const H = top + ORDER.length * rowH + 6;
  const cols = [
    { key: 'flex', title: 'Flexión / extensión', max: 20, neg: 'ext.', pos: 'flex.' },
    { key: 'lat', title: 'Inclinación', max: 12, neg: 'izq.', pos: 'der.' },
    { key: 'rot', title: 'Rotación', max: 40, neg: 'izq.', pos: 'der.' },
  ];
  if (!svg._built) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Ángulo de cada segmento vertebral en la postura actual');
    let html = '';
    cols.forEach((c, ci) => {
      const x0 = left + ci * (colW + gap);
      const zx = x0 + colW / 2;
      html += `<text class="title" x="${zx}" y="10" text-anchor="middle">${c.title}</text>`;
      html += `<text x="${x0}" y="22">${c.neg}</text><text x="${x0 + colW}" y="22" text-anchor="end">${c.pos}</text>`;
      html += `<text x="${zx}" y="22" text-anchor="middle">±${c.max}°</text>`;
      html += `<line class="zero" x1="${zx}" x2="${zx}" y1="${top - 3}" y2="${H - 4}"/>`;
    });
    ORDER.forEach((s, i) => {
      const y = top + i * rowH;
      const reg = s.id.startsWith('L') || s.id === 'L5-S1' ? 'L' : s.id.startsWith('T') ? 'T' : 'C';
      if (i % 1 === 0) html += `<text class="lvl" x="${left - 6}" y="${y + rowH - 2.5}" text-anchor="end">${s.id}</text>`;
      if (i > 0 && reg !== (ORDER[i - 1].id.startsWith('L') ? 'L' : ORDER[i - 1].id.startsWith('T') ? 'T' : 'C')) html += `<line class="axis" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`;
      cols.forEach((c, ci) => { html += `<rect data-s="${s.id}" data-c="${ci}" rx="2" y="${y + 1.5}" height="${rowH - 3}" x="0" width="0"/>`; });
      html += `<rect class="hit" data-row="${s.id}" x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"/>`;
    });
    svg.innerHTML = html;
    svg._built = true;
    svg.addEventListener('pointermove', (e) => {
      const r = e.target.closest('[data-row]');
      if (!r) { tooltip.hidden = true; return; }
      const id = r.dataset.row;
      const st = svg._state[id];
      tooltip.innerHTML = `<strong>${id}</strong><br>Flexión ${fmt(st.flex)}° · Inclinación ${fmt(st.lat)}° · Rotación ${fmt(st.rot)}°<br><span class="cite">(+ = flexión / derecha)</span>`;
      tooltip.hidden = false;
      tooltip.style.left = e.clientX + 14 + 'px';
      tooltip.style.top = e.clientY + 14 + 'px';
    });
    svg.addEventListener('pointerleave', () => { tooltip.hidden = true; });
  }
  svg._state = segState;
  for (const rect of svg.querySelectorAll('rect[data-s]')) {
    const st = segState[rect.dataset.s];
    const ci = +rect.dataset.c;
    const c = cols[ci];
    const v = st[c.key];
    const x0 = left + ci * (colW + gap);
    const zx = x0 + colW / 2;
    const len = Math.min(1, Math.abs(v) / c.max) * (colW / 2);
    rect.setAttribute('x', v >= 0 ? zx : zx - len);
    rect.setAttribute('width', Math.max(0, len));
    rect.setAttribute('fill', v >= 0 ? 'var(--pos)' : 'var(--neg)');
  }
}

export function pressureBullet(el, mpa) {
  const max = 3;
  const W = 340, H = 64, x0 = 8, x1 = W - 8;
  const sx = (v) => x0 + (Math.min(v, max) / max) * (x1 - x0);
  if (!el._built) {
    let html = `<svg class="viz" viewBox="0 0 ${W} ${H}" role="img" aria-label="Presión discal estimada en L4-L5 comparada con mediciones de referencia">`;
    html += `<rect x="${x0}" y="22" width="${x1 - x0}" height="12" rx="3" fill="var(--mid)"/>`;
    html += `<rect id="pb-bar" x="${x0}" y="22" height="12" rx="3" fill="var(--accent)"/>`;
    for (const r of WILKE) html += `<line x1="${sx(r.mpa)}" x2="${sx(r.mpa)}" y1="18" y2="38" stroke="var(--fg-2)" stroke-width="1.2"><title>${r.label}: ${fmt(r.mpa, 2)} MPa (Wilke 1999)</title></line>`;
    for (let v = 0; v <= max; v += 0.5) html += `<text x="${sx(v)}" y="52" text-anchor="middle">${fmt(v, 1)}</text>`;
    html += `<text x="${x1}" y="62" text-anchor="end">MPa</text>`;
    html += `<text id="pb-val" class="title" x="${x0}" y="12"></text></svg>`;
    el.innerHTML = html;
    el._built = true;
  }
  el.querySelector('#pb-bar').setAttribute('width', Math.max(2, sx(mpa) - x0));
  const near = WILKE.reduce((a, b) => (Math.abs(b.mpa - mpa) < Math.abs(a.mpa - mpa) ? b : a));
  el.querySelector('#pb-val').textContent = `Modelo: ${fmt(mpa, 2)} MPa · referencia más cercana: ${near.label} (${fmt(near.mpa, 2)})`;
}

// ---------- Dermatomas (esquema aproximado) ----------
const HW = (y) => (y < 150 ? 30 - (y / 150) * 11 : y < 275 ? 18 - ((y - 150) / 125) * 7 : 11 + ((y - 275) / 25) * 3);
const CX = (y) => 50 - (y / 300) * 4;
function region(u0, u1, y0, y1, mirrorX, ox) {
  const pts = [];
  const N = 8;
  for (let i = 0; i <= N; i++) { const y = y0 + ((y1 - y0) * i) / N; pts.push([CX(y) - HW(y) + 2 * HW(y) * u0, y]); }
  for (let i = N; i >= 0; i--) { const y = y0 + ((y1 - y0) * i) / N; pts.push([CX(y) - HW(y) + 2 * HW(y) * u1, y]); }
  return pts.map(([x, y]) => `${(ox + (mirrorX ? 100 - x : x)).toFixed(1)},${(y + 16).toFixed(1)}`).join(' ');
}
const ZONES_FRONT = { L2: [[0, 1, 0, 60]], L3: [[0, 1, 60, 140], [0, 0.5, 140, 162]], L4: [[0, 0.45, 162, 300]], L5: [[0.45, 0.85, 152, 300]], S1: [[0.85, 1, 240, 300]] };
const ZONES_BACK = { L3: [[0, 0.35, 90, 150]], S2: [[0.3, 0.7, 0, 150]], L4: [[0, 0.3, 160, 260]], L5: [[0.7, 1, 150, 240]], S1: [[0.3, 1, 240, 300], [0.4, 0.75, 160, 240]] };
const ROOT_COLORS = { L2: '#8a9aa0', L3: '#7aa5a1', L4: '#2a78d6', L5: '#eb6834', S1: '#1baf7a', S2: '#9085e9' };

export function dermatomeSVG(active = {}) {
  // active: { L5: ['L'], S1: ['R'] }
  const legs = [
    { title: 'Delante', zones: ZONES_FRONT, legs: [{ side: 'R', ox: 0, mirror: true }, { side: 'L', ox: 72, mirror: false }] },
    { title: 'Detrás', zones: ZONES_BACK, legs: [{ side: 'L', ox: 176, mirror: true }, { side: 'R', ox: 248, mirror: false }] },
  ];
  let s = `<svg class="viz" viewBox="0 0 350 336" role="img" aria-label="Mapa esquemático de dermatomas de las piernas">`;
  for (const view of legs) {
    s += `<text class="title" x="${view.legs[0].ox + 86}" y="10" text-anchor="middle">${view.title}</text>`;
    for (const leg of view.legs) {
      s += `<polygon points="${region(0, 1, 0, 300, leg.mirror, leg.ox)}" fill="var(--mid)" stroke="var(--line)"/>`;
      for (const [root, rs] of Object.entries(view.zones)) {
        const on = (active[root] || []).includes(leg.side);
        for (const r of rs) s += `<polygon points="${region(r[0], r[1], r[2], r[3], leg.mirror, leg.ox)}" fill="${ROOT_COLORS[root]}" fill-opacity="${on ? 0.95 : 0.16}" stroke="var(--panel-solid)" stroke-width="1"><title>${root}</title></polygon>`;
      }
      s += `<text x="${leg.ox + 50}" y="334" text-anchor="middle">${leg.side === 'L' ? 'Izq.' : 'Der.'}</text>`;
    }
  }
  s += '</svg>';
  const legend = Object.entries(ROOT_COLORS).map(([r, c]) => `<span class="status"><i style="background:${c}"></i>${r}</span>`).join(' ');
  return s + `<div class="row" style="gap:10px">${legend}</div>`;
}

export function statusFor(idx) {
  if (idx < 0.08) return { cls: 'good', label: 'Sin contacto relevante' };
  if (idx < 0.3) return { cls: 'warning', label: 'Contacto leve' };
  if (idx < 0.6) return { cls: 'serious', label: 'Compresión moderada' };
  return { cls: 'critical', label: 'Compresión marcada' };
}
