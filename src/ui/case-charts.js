// Gráficos de la sección "Mi caso". Una sola serie por gráfico (color de acento; gris = sin efecto demostrado),
// marcas finas, rejilla en hilo, etiquetas con tokens de texto, tooltip al pasar o enfocar, y tabla equivalente.
const NS = 'http://www.w3.org/2000/svg';
const fmt = (v, d = 2) => v.toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: d });

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
}
function txt(parent, x, y, s, cls = '', anchor = 'start') {
  const t = el('text', { x, y, class: cls, 'text-anchor': anchor }, parent);
  t.textContent = s;
  return t;
}
function bindTip(node, tooltip, lines) {
  const show = (x, y) => {
    tooltip.replaceChildren();
    lines.forEach((ln, i) => { const d = document.createElement(i === 0 ? 'strong' : 'div'); d.textContent = ln; if (i === 0) d.style.display = 'block'; tooltip.append(d); });
    tooltip.style.left = Math.min(innerWidth - 300, x + 14) + 'px';
    tooltip.style.top = y + 14 + 'px';
    tooltip.hidden = false;
  };
  node.setAttribute('tabindex', '0');
  node.addEventListener('pointermove', (e) => show(e.clientX, e.clientY));
  node.addEventListener('pointerleave', () => { tooltip.hidden = true; });
  node.addEventListener('focus', () => { const r = node.getBoundingClientRect(); show(r.left + r.width / 2, r.top + r.height / 2); });
  node.addEventListener('blur', () => { tooltip.hidden = true; });
}
function tableView(rows, head) {
  const d = document.createElement('details');
  d.className = 'tview';
  const s = document.createElement('summary'); s.textContent = 'Ver como tabla'; d.append(s);
  const t = document.createElement('table');
  const tr = document.createElement('tr');
  for (const h of head) { const th = document.createElement('th'); th.textContent = h; tr.append(th); }
  t.append(tr);
  for (const r of rows) {
    const row = document.createElement('tr');
    for (const c of r) { const td = document.createElement('td'); td.textContent = c; row.append(td); }
    t.append(row);
  }
  d.append(t);
  return d;
}

// Forest plot en escala logarítmica: cada fila = etiqueta arriba, estimación puntual + intervalo de confianza debajo
export function forestPlot(container, rows, tooltip, { min = 0.35, max = 2.2, ref = 1, better = 'Menos recaídas', worse = 'Más recaídas', valueLabel = 'RR' } = {}) {
  container.replaceChildren();
  const W = 360, left = 8, right = 44, rowH = 36, top = 22;
  const H = top + rows.length * rowH + 22;
  const x = (v) => left + ((Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))) * (W - left - right);
  const svg = el('svg', { class: 'viz', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Efecto de cada intervención sobre el riesgo de recaída' }, container);
  for (const t of [0.4, 0.6, 0.8, 1, 1.5, 2]) {
    if (t < min || t > max) continue;
    el('line', { x1: x(t), x2: x(t), y1: top - 4, y2: H - 18, class: t === ref ? 'zero' : 'axis' }, svg);
    txt(svg, x(t), H - 6, fmt(t, 1), '', 'middle');
  }
  txt(svg, x(ref) - 6, top - 10, '← ' + better, '', 'end');
  txt(svg, x(ref) + 6, top - 10, worse + ' →', '', 'start');
  rows.forEach((r, i) => {
    const y0 = top + i * rowH, y = y0 + 24;
    const sig = r.hi != null && r.hi < ref;
    const g = el('g', { class: 'mark' }, svg);
    el('rect', { x: 0, y: y0, width: W, height: rowH, fill: 'transparent' }, g);
    txt(g, left, y0 + 11, r.label, 'lvl');
    const col = sig ? 'var(--accent)' : 'var(--muted)';
    if (r.lo != null) el('line', { x1: x(Math.max(min, r.lo)), x2: x(Math.min(max, r.hi)), y1: y, y2: y, stroke: col, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: x(r.est), cy: y, r: 5, fill: col, stroke: 'var(--panel-solid)', 'stroke-width': 2 }, g);
    txt(g, W - right + 6, y + 3.5, fmt(r.est), 'num');
    bindTip(g, tooltip, [`${valueLabel} ${fmt(r.est)}${r.lo != null ? ` (IC 95 % ${fmt(r.lo)}–${fmt(r.hi)})` : ''}`, r.label, r.src || '']);
  });
  container.append(tableView(rows.map((r) => [r.label, fmt(r.est), r.lo != null ? `${fmt(r.lo)}–${fmt(r.hi)}` : '—', r.src || '']), ['Intervención', valueLabel, 'IC 95 %', 'Fuente']));
}

// Odds ratios de los desencadenantes, escala logarítmica desde 1; etiqueta sobre cada fila
export function orChart(container, rows, tooltip) {
  container.replaceChildren();
  const W = 360, left = 8, right = 16, rowH = 34, top = 6, min = 1, max = 200;
  const H = top + rows.length * rowH + 20;
  const x = (v) => left + ((Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))) * (W - left - right);
  const svg = el('svg', { class: 'viz', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Cuánto aumenta el riesgo de iniciar una crisis cada situación' }, container);
  for (const t of [1, 2, 5, 10, 25, 50, 100, 200]) {
    el('line', { x1: x(t), x2: x(t), y1: top, y2: H - 16, class: t === 1 ? 'zero' : 'axis' }, svg);
    txt(svg, x(t), H - 4, String(t), '', 'middle');
  }
  rows.forEach((r, i) => {
    const y0 = top + i * rowH, y = y0 + 23;
    const g = el('g', { class: 'mark' }, svg);
    el('rect', { x: 0, y: y0, width: W, height: rowH, fill: 'transparent' }, g);
    txt(g, left, y0 + 11, `${r.label} · ×${fmt(r.or, 1)}`, 'lvl');
    if (r.lo != null) el('line', { x1: x(r.lo), x2: x(Math.min(max, r.hi)), y1: y, y2: y, stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: x(r.or), cy: y, r: 5, fill: 'var(--accent)', stroke: 'var(--panel-solid)', 'stroke-width': 2 }, g);
    bindTip(g, tooltip, [`×${fmt(r.or, 1)}${r.lo != null ? ` (IC 95 % ${fmt(r.lo, 1)}–${fmt(r.hi, 1)})` : ' (intervalo no disponible)'}`, r.label, r.note || 'Steffens et al., Arthritis Care Res 2015']);
  });
  container.append(tableView(rows.map((r) => [r.label, fmt(r.or, 1), r.lo != null ? `${fmt(r.lo, 1)}–${fmt(r.hi, 1)}` : '—']), ['Situación', 'Odds ratio', 'IC 95 %']));
}

// Dos matrices de 100 personas: sin y con programa
export function iconArrays(container, a, b) {
  container.replaceChildren();
  const W = 360, cell = 13, gap = 3, block = 10 * (cell + gap);
  const H = block + 40;
  const svg = el('svg', { class: 'viz', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${a.n} de 100 frente a ${b.n} de 100` }, container);
  [a, b].forEach((g, k) => {
    const ox = k * (block + 26) + 4;
    txt(svg, ox, 12, g.label, 'title');
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), c = i % 10;
      el('rect', { x: ox + c * (cell + gap), y: 20 + r * (cell + gap), width: cell, height: cell, rx: 3, fill: i < g.n ? 'var(--accent)' : 'var(--line)' }, svg);
    }
    txt(svg, ox, H - 2, `${g.n} de 100 recaen`, 'num');
  });
  container.append(tableView([[a.label, String(a.n)], [b.label, String(b.n)]], ['Grupo', 'Personas con recaída limitante en un año (de 100)']));
}

// Barras horizontales de una sola serie (registro)
export function barList(container, rows, tooltip, { unit = '' } = {}) {
  container.replaceChildren();
  if (!rows.length) return;
  const W = 360, left = 168, right = 36, rowH = 22, top = 4;
  const H = top + rows.length * rowH + 4;
  const max = Math.max(1, ...rows.map((r) => r.v));
  const svg = el('svg', { class: 'viz', viewBox: `0 0 ${W} ${H}`, role: 'img' }, container);
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    const g = el('g', { class: 'mark' }, svg);
    el('rect', { x: 0, y, width: W, height: rowH, fill: 'transparent' }, g);
    txt(g, left - 8, y + rowH / 2 + 3.5, r.label, 'lvl', 'end');
    const w = Math.max(r.v ? 4 : 0, ((W - left - right) * r.v) / max);
    if (w) el('path', { d: `M${left},${y + 5} h${w - 4} a4,4 0 0 1 4,4 v${rowH - 18} a4,4 0 0 1 -4,4 h${-(w - 4)} z`, fill: 'var(--accent)' }, g);
    txt(g, left + w + 6, y + rowH / 2 + 3.5, String(r.v) + unit, 'num');
    bindTip(g, tooltip, [`${r.v}${unit}`, r.label]);
  });
  container.append(tableView(rows.map((r) => [r.label, String(r.v)]), ['Categoría', 'Crisis']));
}

// Línea de tiempo de crisis: un punto por crisis, con los días entre una y otra
export function timeline(container, entries, tooltip) {
  container.replaceChildren();
  if (entries.length < 1) return;
  const W = 360, H = 64, pad = 16;
  const ts = entries.map((e) => new Date(e.start).getTime());
  const t0 = Math.min(...ts), t1 = Math.max(...ts, t0 + 86400000 * 30);
  const x = (t) => pad + ((t - t0) / (t1 - t0)) * (W - 2 * pad);
  const svg = el('svg', { class: 'viz', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Crisis en el tiempo' }, container);
  el('line', { x1: pad, x2: W - pad, y1: 30, y2: 30, class: 'axis' }, svg);
  const sorted = entries.slice().sort((a, b) => new Date(a.start) - new Date(b.start));
  sorted.forEach((e, i) => {
    const t = new Date(e.start).getTime();
    const g = el('g', { class: 'mark' }, svg);
    el('circle', { cx: x(t), cy: 30, r: 12, fill: 'transparent' }, g);
    el('circle', { cx: x(t), cy: 30, r: 5, fill: 'var(--accent)', stroke: 'var(--panel-solid)', 'stroke-width': 2 }, g);
    const d = new Date(e.start);
    const lines = [d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }), `Intensidad ${e.intensity ?? '—'}/10 · ${e.days ? e.days + ' días' : 'duración sin registrar'}`];
    if (i > 0) lines.push(`${Math.round((t - new Date(sorted[i - 1].start).getTime()) / 86400000)} días desde la anterior`);
    bindTip(g, tooltip, lines);
  });
  txt(svg, pad, 56, new Date(t0).toLocaleDateString('es', { month: 'short', year: 'numeric' }));
  txt(svg, W - pad, 56, new Date(t1).toLocaleDateString('es', { month: 'short', year: 'numeric' }), '', 'end');
}
