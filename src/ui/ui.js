// Interfaz: capas, pestañas (Explorar, Movimiento, Mi columna, Clase), selección y métricas en vivo
import { infoFor } from '../data/info.js';
import { LESSON } from '../data/lessons.js';
import { anglesChart, pressureBullet, dermatomeSVG, statusFor } from './charts.js';
import { PFIRRMANN, HERNIA, ZONES } from '../tissues/discs.js';
import { affectedRoot, WILKE } from '../sim/biomech.js';
import { DEFAULT_STATE } from '../sim/posture.js';

const $ = (s, r = document) => r.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const f1 = (v, d = 1) => (Math.abs(v) < 0.05 && d <= 1 ? '0' : v.toFixed(d)).replace('.', ',').replace(/^-0(,0+)?$/, '0');
const sgn = (v, d = 1) => (v > 0.05 ? '+' : '') + f1(v, d);
const KIND_LABEL = { bone: 'Hueso', muscle: 'Músculo', ligament: 'Ligamento', capsule: 'Cápsula articular', nerve: 'Sistema nervioso', dura: 'Meninges', disc: 'Disco intervertebral', nucleus: 'Disco intervertebral', hernia: 'Disco intervertebral', fascia: 'Fascia', skin: 'Piel' };
const KIND_COLOR = { bone: 'var(--bone)', muscle: 'var(--muscle)', ligament: 'var(--lig)', capsule: 'var(--lig)', nerve: 'var(--nerve)', dura: 'var(--disc)', disc: 'var(--disc)', nucleus: 'var(--disc)', hernia: 'var(--disc)', fascia: 'var(--lig)', skin: 'var(--bone)' };

const PRESETS = [
  { id: 'neutral', label: 'Neutro', keys: [{ t: 1, state: { ...DEFAULT_STATE } }] },
  { id: 'flex', label: 'Flexión', keys: [{ t: 2.4, state: { ...DEFAULT_STATE, flex: 0.9 } }] },
  { id: 'ext', label: 'Extensión', keys: [{ t: 2, state: { ...DEFAULT_STATE, flex: -0.9 } }] },
  { id: 'latR', label: 'Inclinación der.', keys: [{ t: 2, state: { ...DEFAULT_STATE, lat: 0.9 } }] },
  { id: 'latL', label: 'Inclinación izq.', keys: [{ t: 2, state: { ...DEFAULT_STATE, lat: -0.9 } }] },
  { id: 'rotR', label: 'Rotación der.', keys: [{ t: 2, state: { ...DEFAULT_STATE, rot: 0.9 } }] },
  { id: 'round', label: 'Levantar con espalda redonda', keys: [{ t: 2.4, state: { ...DEFAULT_STATE, flex: 0.75, hinge: 0, loadKg: 15 } }] },
  { id: 'hinge', label: 'Bisagra de cadera', keys: [{ t: 2.4, state: { ...DEFAULT_STATE, flex: 0.75, hinge: 1, loadKg: 15 } }] },
  { id: 'twist', label: 'Agacharse y girar', keys: [{ t: 2.4, state: { ...DEFAULT_STATE, flex: 0.55, rot: 0.7 } }] },
  { id: 'sit', label: 'Sentado erguido', keys: [{ t: 2, state: { ...DEFAULT_STATE, sit: 1, slump: 0 } }] },
  { id: 'slump', label: 'Sentado encorvado', keys: [{ t: 2, state: { ...DEFAULT_STATE, sit: 1, slump: 1 } }] },
  { id: 'shiftR', label: 'Lateral shift der.', keys: [{ t: 2.4, state: { ...DEFAULT_STATE, shift: 0.9 } }] },
  { id: 'shiftL', label: 'Lateral shift izq.', keys: [{ t: 2.4, state: { ...DEFAULT_STATE, shift: -0.9 } }] },
  { id: 'neckUp', label: 'Mirar arriba', keys: [{ t: 1.8, state: { ...DEFAULT_STATE, neckFlex: -0.9 } }] },
  { id: 'neckDown', label: 'Mirar el celular', keys: [{ t: 1.8, state: { ...DEFAULT_STATE, neckFlex: 0.8 } }] },
];

const VIEWS = [['postObl', 'Oblicua'], ['postFull', 'Posterior'], ['lateralMotion', 'Lateral'], ['antFull', 'Anterior'], ['lumbarPostObl', 'Lumbar'], ['l45Close', 'Disco L4-L5'], ['axialL45', 'Axial L4-L5'], ['neck', 'Cuello'], ['pelvis', 'Pelvis']];

const LAYER_DEFS = [
  { title: 'Huesos', rows: [['vertebrae', 'Vértebras', 'var(--bone)'], ['pelvis', 'Pelvis, sacro y cóccix', 'var(--bone)'], ['thorax', 'Costillas y esternón', 'var(--bone)'], ['skull', 'Cráneo', 'var(--bone)'], ['limbs', 'Fémur, escápula y húmero', 'var(--bone)']], opacity: 'bones' },
  { title: 'Discos y ligamentos', rows: [['discs', 'Discos intervertebrales', 'var(--disc)'], ['ligaments', 'Ligamentos y cápsulas', 'var(--lig)']] },
  { title: 'Sistema nervioso', rows: [['neural', 'Médula y raíces', 'var(--nerve)'], ['dura', 'Saco dural', 'var(--disc)'], ['peripheral', 'Nervios periféricos', 'var(--nerve)']] },
  { title: 'Músculos', rows: [['muscle2', 'Profundos (multífido, rotadores)', 'var(--muscle)'], ['muscle3', 'Erectores, cuadrado lumbar, psoas', 'var(--muscle)'], ['muscle4', 'Intermedios (romboides, esplenios)', 'var(--muscle)'], ['muscle5', 'Superficiales (trapecio, dorsal ancho)', 'var(--muscle)'], ['muscle6', 'Pared abdominal', 'var(--muscle)'], ['muscle7', 'Cadera (glúteos, piriforme)', 'var(--muscle)']], opacity: 'muscles' },
  { title: 'Fascia y piel', rows: [['fascia', 'Fascia toracolumbar', 'var(--lig)'], ['skin', 'Silueta corporal', 'var(--bone)']] },
];

export class UI {
  constructor(app) {
    this.app = app;
    this.tab = 'explore';
    this.lessonStep = 0;
    this.tooltip = $('#tooltip');
    this.side = $('#side-body');
    this.buildLayers();
    this.buildViews();
    this.bindTop();
    this.bindPointer();
    this.showTab('explore');
  }

  // ---------------- barra superior ----------------
  bindTop() {
    for (const b of document.querySelectorAll('.tabs button')) b.addEventListener('click', () => this.showTab(b.dataset.tab));
    $('#theme-btn').addEventListener('click', () => {
      const root = document.documentElement;
      const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      root.dataset.theme = cur === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('columna-theme', root.dataset.theme); } catch (e) { /* sin almacenamiento */ }
    });
    try { const t = localStorage.getItem('columna-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) { /* sin almacenamiento */ }
    $('#about-btn').addEventListener('click', () => { $('#about-body').innerHTML = ABOUT; $('#about').showModal(); });
    $('#about-close').addEventListener('click', () => $('#about').close());
    $('#mobile-toggle').addEventListener('click', () => { const open = $('#layers').classList.toggle('open'); $('#side').classList.toggle('collapsed', open); $('#side-collapse').textContent = open ? 'Mostrar' : 'Ocultar'; this.app.updateViewOffset(); });
    const col = $('#side-collapse');
    if (this.app.isMobile) col.hidden = false;
    col.addEventListener('click', () => { const s = $('#side'); s.classList.toggle('collapsed'); col.textContent = s.classList.contains('collapsed') ? 'Mostrar' : 'Ocultar'; $('#layers').classList.remove('open'); this.app.updateViewOffset(); });
  }

  showTab(tab) {
    this.tab = tab;
    for (const b of document.querySelectorAll('.tabs button')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    $('#side-title').textContent = { explore: 'Explorar', move: 'Movimiento', case: 'Mi columna', class: 'Clase' }[tab];
    $('#side').classList.remove('collapsed');
    $('#layers').classList.remove('open');
    if ($('#side-collapse')) $('#side-collapse').textContent = 'Ocultar';
    requestAnimationFrame(() => this.app.updateViewOffset());
    this.side.innerHTML = '';
    this.side.scrollTop = 0;
    if (tab === 'explore') this.renderExplore();
    if (tab === 'move') this.renderMove();
    if (tab === 'case') this.renderCase();
    if (tab === 'class') this.renderClass();
    this.updateMetrics();
  }

  // ---------------- capas ----------------
  buildLayers() {
    const app = this.app;
    const body = $('#layers-body');
    body.innerHTML = '';
    const dis = h(`<div class="group"><div class="slider"><label for="dissect">Disección</label><output id="dissect-out"></output><input type="range" id="dissect" min="0" max="7" step="1" value="3"><div class="ends"><span>Hueso</span><span>Superficie</span></div></div></div>`);
    body.append(dis);
    const DL = ['Solo hueso y discos', 'Ligamentos y nervios', 'Músculos profundos', 'Erectores y psoas', 'Capa intermedia', 'Capa superficial', 'Superficial', 'Todas las capas'];
    const upd = () => { $('#dissect-out').textContent = DL[+$('#dissect').value]; };
    $('#dissect', dis).addEventListener('input', (e) => {
      const d = +e.target.value;
      app.setDissection(d);
      app.layerState.ligaments = d >= 1; app.layerState.neural = d >= 1; app.layerState.peripheral = d >= 1;
      app.applyLayers();
      this.syncLayerChecks();
      upd();
    });
    upd();
    for (const g of LAYER_DEFS) {
      const sec = h(`<div class="group"><div class="eyebrow">${g.title}</div></div>`);
      for (const [key, label, color] of g.rows) {
        const row = h(`<div class="layer-row"><span class="swatch" style="background:${color}"></span><label><input type="checkbox" id="ly-${key}"> ${label}</label><span></span></div>`);
        const cb = $('input', row);
        cb.checked = !!app.layerState[key];
        cb.addEventListener('change', () => { app.layerState[key] = cb.checked; app.applyLayers(); });
        sec.append(row);
      }
      if (g.opacity) {
        const sl = h(`<div class="slider"><label for="op-${g.opacity}">Opacidad</label><output id="op-${g.opacity}-out">100 %</output><input type="range" id="op-${g.opacity}" min="0.12" max="1" step="0.01" value="1"></div>`);
        $('input', sl).addEventListener('input', (e) => { app.opacity[g.opacity] = +e.target.value; $(`#op-${g.opacity}-out`).textContent = Math.round(+e.target.value * 100) + ' %'; app.applyLayers(); });
        sec.append(sl);
      }
      if (g.title === 'Discos y ligamentos') {
        const x = h(`<div class="layer-row"><span></span><label><input type="checkbox" id="ly-xray"> Ver núcleo (disco translúcido)</label><span></span></div>`);
        $('input', x).addEventListener('change', (e) => { app.discs.setXray(e.target.checked); app.applyLayers(); });
        sec.append(x);
      }
      body.append(sec);
    }
    // cortes
    const cut = h(`<div class="group"><div class="eyebrow">Corte anatómico</div>
      <div class="seg" id="clip-mode"><button data-m="none" aria-pressed="true">Ninguno</button><button data-m="sagittal">Sagital</button><button data-m="axial">Axial</button><button data-m="coronal">Coronal</button></div>
      <div class="row"><label for="clip-level" class="hint">Nivel axial</label><select id="clip-level">${['L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1', 'T12-L1', 'T8-T9', 'C5-C6'].map((l) => `<option ${l === 'L4-L5' ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="slider"><label for="clip-off">Desplazar el plano</label><output id="clip-off-out">0 mm</output><input type="range" id="clip-off" min="-60" max="60" step="1" value="0"></div></div>`);
    body.append(cut);
    const setClip = (mode) => {
      for (const b of cut.querySelectorAll('#clip-mode button')) b.setAttribute('aria-pressed', String(b.dataset.m === (mode || app.clip.mode)));
      app.setClip({ mode: mode || app.clip.mode, level: $('#clip-level').value, offset: +$('#clip-off').value });
    };
    for (const b of cut.querySelectorAll('#clip-mode button')) b.addEventListener('click', () => {
      setClip(b.dataset.m);
      if (b.dataset.m === 'axial') app.view('axialL45');
      if (b.dataset.m === 'sagittal') app.view('sagittalCut');
    });
    $('#clip-level', cut).addEventListener('change', () => setClip());
    $('#clip-off', cut).addEventListener('input', (e) => { $('#clip-off-out').textContent = e.target.value + ' mm'; setClip(); });
    this.syncClip = () => { for (const b of cut.querySelectorAll('#clip-mode button')) b.setAttribute('aria-pressed', String(b.dataset.m === app.clip.mode)); $('#clip-level').value = app.clip.level; };
    // color
    const col = h(`<div class="group"><div class="eyebrow">Color de los tejidos</div><div class="seg" id="color-mode">
      <button data-c="anat" aria-pressed="true">Anatómico</button><button data-c="strain">Estiramiento</button><button data-c="activity">Actividad</button><button data-c="pressure">Presión discal</button></div></div>`);
    for (const b of col.querySelectorAll('button')) b.addEventListener('click', () => this.setColor(b.dataset.c));
    body.append(col);
    $('#reset-layers').addEventListener('click', () => {
      Object.assign(app.layerState, { vertebrae: true, pelvis: true, thorax: true, skull: true, limbs: true, discs: true, ligaments: true, neural: true, dura: true, peripheral: true, fascia: false, skin: false, muscle2: true, muscle3: true, muscle4: false, muscle5: false, muscle6: false, muscle7: false });
      app.opacity.bones = 1; app.opacity.muscles = 1;
      app.isolated = null;
      $('#dissect').value = 3; upd();
      app.discs.setXray(false); $('#ly-xray').checked = false;
      setClip('none');
      app.applyLayers();
      this.syncLayerChecks();
    });
  }

  syncLayerChecks() {
    for (const [k, v] of Object.entries(this.app.layerState)) { const c = $('#ly-' + k); if (c) c.checked = !!v; }
  }

  setColor(c) {
    this.app.setColorMode(c);
    for (const b of document.querySelectorAll('#color-mode button')) b.setAttribute('aria-pressed', String(b.dataset.c === c));
    const lg = $('#legend');
    const L = {
      strain: ['Músculos y ligamentos: estiramiento respecto de la postura neutra', 'linear-gradient(90deg,#ff8c1f,#bfbdb7 50%,#2e73f2)', 'Acortado', 'Alargado'],
      activity: ['Actividad muscular estimada (modelo cualitativo)', 'linear-gradient(90deg,#3b4248,#ff4019 60%,#ffd84d)', 'Reposo', 'Alta'],
      pressure: ['Discos: compresión local relativa', 'linear-gradient(90deg,#4f8fd6,#e6e6e0 50%,#e0412a)', 'Distensión', 'Compresión'],
    }[c];
    if (!L) { lg.hidden = true; return; }
    lg.innerHTML = `<span>${L[0]}</span><span class="bar" style="background:${L[1]}"></span><span class="ends"><span>${L[2]}</span><span>${L[3]}</span></span><span class="hint">Raíces: amarillo normal · naranja en tensión · rojo comprimida</span>`;
    lg.hidden = false;
  }

  buildViews() {
    const bar = $('#views');
    for (const [id, label] of VIEWS) {
      const b = h(`<button>${label}</button>`);
      b.addEventListener('click', () => {
        if (id === 'axialL45') { this.app.setClip({ mode: 'axial', level: 'L4-L5' }); this.syncClip(); }
        else if (this.app.clip.mode === 'axial') { this.app.setClip({ mode: 'none' }); this.syncClip(); }
        this.app.view(id);
      });
      bar.append(b);
    }
  }

  // ---------------- puntero: hover y clic ----------------
  bindPointer() {
    const app = this.app;
    const cv = app.renderer.domElement;
    const label = $('#hover-label');
    let down = null, last = 0, pending = null;
    cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    cv.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 6 && performance.now() - down.t < 600) {
        const it = app.picker.pick(e.clientX, e.clientY);
        app.select(it || null);
        if (it && this.tab !== 'explore' && this.tab !== 'class') this.showSelectionBanner(it);
      }
      down = null;
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || e.buttons) { label.hidden = true; return; }
      pending = e;
      const now = performance.now();
      if (now - last < 90) return;
      last = now;
      const it = app.picker.pick(pending.clientX, pending.clientY);
      if (!it) { label.hidden = true; cv.style.cursor = ''; return; }
      label.innerHTML = `${it.name}${it.latin ? ` <span class="latin">${it.latin}</span>` : ''}`;
      label.style.left = pending.clientX + 'px';
      label.style.top = pending.clientY + 'px';
      label.hidden = false;
      cv.style.cursor = 'pointer';
    });
    cv.addEventListener('pointerleave', () => { label.hidden = true; });
  }

  showSelectionBanner(it) {
    const old = $('#sel-banner');
    if (old) old.remove();
    const b = h(`<div class="card" id="sel-banner"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">${KIND_LABEL[it.kind] || ''}</div><strong>${it.name}</strong></div><button class="chip">Ver ficha</button></div></div>`);
    $('button', b).addEventListener('click', () => { this.showTab('explore'); });
    this.side.prepend(b);
  }

  // ---------------- Explorar ----------------
  renderExplore() {
    const app = this.app;
    const wrap = h(`<div class="group"></div>`);
    wrap.append(h(`<div id="item-card"></div>`));
    const list = h(`<div class="group"><label class="eyebrow" for="search">Buscar estructura</label><input type="search" id="search" placeholder="multífido, L5, ligamento amarillo…" autocomplete="off"><div class="struct-list" id="struct-list"></div></div>`);
    wrap.append(list);
    this.side.append(wrap);
    const render = (q = '') => {
      const L = $('#struct-list');
      L.innerHTML = '';
      const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      const nq = norm(q);
      const groups = {};
      const seen = new Set();
      for (const it of app.items) {
        if (it.kind === 'nucleus' || it.kind === 'hernia') continue;
        const nm = it.kind === 'muscle' ? it.name : it.name;
        const k = it.kind === 'muscle' ? it.id : it.key;
        if (seen.has(k)) continue;
        if (nq && !norm(nm + ' ' + (it.latin || '') + ' ' + it.key).includes(nq)) continue;
        seen.add(k);
        const g = KIND_LABEL[it.kind] || 'Otros';
        (groups[g] = groups[g] || []).push(it);
      }
      for (const [g, arr] of Object.entries(groups)) {
        L.append(h(`<div class="grp">${g}</div>`));
        for (const it of arr.slice(0, nq ? 60 : 40)) {
          const b = h(`<button><span class="swatch" style="background:${KIND_COLOR[it.kind]}"></span>${it.name}</button>`);
          b.addEventListener('click', () => { app.select(it, { focus: true }); });
          L.append(b);
        }
      }
      if (!L.children.length) L.append(h(`<div class="hint">Sin resultados. Prueba con otro nombre.</div>`));
    };
    $('#search').addEventListener('input', (e) => render(e.target.value));
    render();
    this.showItem(app.selected);
  }

  showItem(it) {
    const card = $('#item-card');
    if (!card) return;
    if (!it) {
      card.innerHTML = `<div class="card"><div class="eyebrow">Cómo usar</div><div class="prose"><p>Toca o haz clic en cualquier estructura del modelo para ver qué es, para qué sirve y qué le pasa cuando te mueves.</p><p>Arrastra para girar, rueda o pellizco para acercar, clic derecho o dos dedos para desplazar. Usa <strong>Capas</strong> para disecar y <strong>Corte</strong> para ver el interior como en una resonancia.</p><p>Si es tu primera vez, empieza por la pestaña <strong>Clase</strong>.</p></div></div>`;
      return;
    }
    const inf = infoFor(it) || {};
    const parts = [['Qué es', inf.what], ['Función', inf.func], ['En movimiento', inf.motion], ['Relevancia clínica', inf.clinic]].filter(([, v]) => v);
    card.innerHTML = '';
    const c = h(`<div class="card">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div style="min-width:0"><div class="eyebrow">${KIND_LABEL[it.kind] || ''}${it.side && it.side !== 'C' ? ' · ' + (it.side === 'L' ? 'izquierdo' : 'derecho') : ''}</div><h2 style="font-size:21px">${it.name}</h2>${it.latin ? `<div class="latin">${it.latin}</div>` : ''}</div></div>
      <div class="row"><button class="chip" id="it-focus">Centrar</button><button class="chip" id="it-iso" aria-pressed="${this.app.isolated === it}">${this.app.isolated === it ? 'Mostrar todo' : 'Aislar con huesos'}</button><button class="chip" id="it-clear">Quitar selección</button></div>
      <div class="prose">${parts.map(([k, v]) => `<p><strong>${k}.</strong> ${v}</p>`).join('') || '<p>Sin ficha detallada.</p>'}</div>
      <div id="it-live"></div></div>`);
    card.append(c);
    $('#it-focus', c).addEventListener('click', () => this.app.focusItem(it));
    $('#it-iso', c).addEventListener('click', () => { this.app.isolated = this.app.isolated === it ? null : it; this.app.applyLayers(); this.showItem(it); });
    $('#it-clear', c).addEventListener('click', () => { this.app.select(null); });
    this.updateItemLive();
  }

  updateItemLive() {
    const el = $('#it-live');
    const it = this.app.selected;
    if (!el || !it) return;
    let html = '';
    if (it.strands && (it.kind === 'muscle' || it.kind === 'ligament' || it.kind === 'nerve')) {
      const st = it.strands;
      const avg = st.reduce((a, s) => a + s.strain, 0) / st.length;
      const mx = st.reduce((a, s) => (Math.abs(s.strain) > Math.abs(a) ? s.strain : a), 0);
      html += `<dl class="kv"><dt>Cambio de longitud (promedio)</dt><dd>${sgn(avg * 100)} %</dd><dt>Fibra más exigida</dt><dd>${sgn(mx * 100)} %</dd>`;
      if (it.kind === 'muscle') html += `<dt>Actividad estimada</dt><dd>${Math.round((st[0].act || 0) * 100)} %</dd>`;
      if (it.root) { const c = this.app.compression[it.root + it.side]; html += `<dt>Índice de compresión</dt><dd>${c ? Math.round(c.idx * 100) + ' %' : '—'}</dd>`; }
      html += '</dl>';
    }
    if (it.kind === 'disc' || it.kind === 'nucleus' || it.kind === 'hernia') {
      const d = it.disc;
      const s = d.state;
      html += `<dl class="kv"><dt>Altura media actual</dt><dd>${f1(s.meanH)} mm</dd><dt>Compresión anterior / posterior</dt><dd>${sgn(s.compAnt)} / ${sgn(s.compPost)} mm</dd><dt>Desplazamiento del núcleo</dt><dd>${sgn(-d.state.nucleusShift.y)} mm atrás</dd><dt>Grado (simulado)</dt><dd>${PFIRRMANN[d.grade || 1].label}</dd></dl>`;
    }
    el.innerHTML = html;
  }

  // ---------------- Movimiento ----------------
  renderMove() {
    const app = this.app;
    const st = app.posture.state;
    const g1 = h(`<div class="group"><h3>Posturas y gestos</h3><div class="seg" id="presets"></div><div class="hint">Cada gesto se anima desde la postura actual. Puedes ajustar fino con los controles.</div></div>`);
    for (const p of PRESETS) {
      const b = h(`<button class="chip">${p.label}</button>`);
      b.addEventListener('click', () => { app.animator.play(p.keys, () => this.syncSliders()); this.animSync(); });
      $('#presets', g1).append(b);
    }
    this.side.append(g1);
    const sliders = [
      ['flex', 'Flexión ↔ extensión del tronco', -1, 1, 'Extensión', 'Flexión'],
      ['lat', 'Inclinación lateral', -1, 1, 'Izquierda', 'Derecha'],
      ['rot', 'Rotación', -1, 1, 'Izquierda', 'Derecha'],
      ['shift', 'Lateral shift (hombros)', -1, 1, 'Izquierda', 'Derecha'],
      ['hinge', 'Estrategia al agacharse', 0, 1, 'Espalda redonda', 'Bisagra de cadera'],
      ['sit', 'Sentarse', 0, 1, 'De pie', 'Sentado'],
      ['slump', 'Al estar sentado', 0, 1, 'Erguido', 'Encorvado'],
      ['neckFlex', 'Cuello: flexión ↔ extensión', -1, 1, 'Mirar arriba', 'Mirar abajo'],
      ['neckRot', 'Cuello: rotación', -1, 1, 'Izquierda', 'Derecha'],
      ['neckLat', 'Cuello: inclinación', -1, 1, 'Izquierda', 'Derecha'],
      ['loadKg', 'Carga en las manos', 0, 25, '0 kg', '25 kg'],
      ['bodyKg', 'Tu peso corporal', 40, 140, '40 kg', '140 kg'],
    ];
    const g2 = h(`<div class="group"><h3>Control fino</h3><div class="seg" id="region"><button data-r="all">Todo el cuerpo</button><button data-r="lumbar">Solo lumbar</button><button data-r="thoracic">Solo torácica</button><button data-r="cervical">Solo cervical</button></div></div>`);
    for (const b of g2.querySelectorAll('#region button')) {
      b.setAttribute('aria-pressed', String(b.dataset.r === st.region));
      b.addEventListener('click', () => { app.posture.set({ region: b.dataset.r }); for (const x of g2.querySelectorAll('#region button')) x.setAttribute('aria-pressed', String(x === b)); app.dirty = true; });
    }
    for (const [k, label, mn, mx, a, b] of sliders) {
      const step = k.endsWith('Kg') ? 1 : 0.01;
      const s = h(`<div class="slider"><label for="s-${k}">${label}</label><output id="s-${k}-out"></output><input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${step}" value="${st[k]}"><div class="ends"><span>${a}</span><span>${b}</span></div></div>`);
      $('input', s).addEventListener('input', (e) => { app.animator.stop(); app.posture.set({ [k]: +e.target.value }); app.dirty = true; this.syncSliders(); });
      g2.append(s);
    }
    this.side.append(g2);
    const g3 = h(`<div class="group" id="move-metrics">
      <h3>Qué está pasando</h3><div class="prose" id="narrative"></div>
      <div class="card"><div class="eyebrow">Ritmo lumbopélvico</div><dl class="kv" id="m-trunk"></dl></div>
      <div class="card"><div class="eyebrow">Carga en el disco L4-L5 (modelo estático)</div><dl class="kv" id="m-load"></dl><div id="m-bullet"></div><div class="cite">Las marcas son mediciones in vivo de Wilke et al. (Spine 1999) en una sola persona; pasa el cursor sobre ellas. El modelo usa un brazo extensor de 5,5 cm y presión ≈ 1,5 × fuerza / área (Nachemson). Error esperable alto: úsalo para comparar posturas.</div></div>
      <div class="card"><div class="eyebrow">Agujeros de conjunción (altura medida en el modelo)</div><dl class="kv" id="m-foramen"></dl><div class="cite">Referencia en cadáver: el área foraminal cae ~15 % en extensión y sube ~12 % en flexión (Inufusa et al., Spine 1996).</div></div>
      <div class="card"><div class="eyebrow">Raíces nerviosas: cambio de longitud del trayecto</div><dl class="kv" id="m-roots"></dl></div>
      <div class="card"><div class="eyebrow">Músculos con más actividad estimada</div><dl class="kv" id="m-muscles"></dl></div>
      <div class="card"><div class="eyebrow">Ángulo de cada segmento</div><svg class="viz" id="m-angles"></svg><div class="cite">Rangos por nivel: Pearcy 1984 (lumbar, in vivo) y White y Panjabi (torácica y cervical). Rojo = flexión o hacia la derecha; azul = extensión o hacia la izquierda.</div></div>
    </div>`);
    this.side.append(g3);
    this.syncSliders();
  }

  animSync() {
    const tick = () => { this.syncSliders(); if (this.app.animator.playing && this.tab === 'move') requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  syncSliders() {
    const st = this.app.posture.state;
    for (const k of Object.keys(st)) {
      const inp = $('#s-' + k);
      if (!inp) continue;
      if (document.activeElement !== inp) inp.value = st[k];
      const o = $('#s-' + k + '-out');
      if (o) o.textContent = k.endsWith('Kg') ? `${Math.round(st[k])} kg` : `${Math.round(st[k] * 100)} %`;
    }
  }

  // ---------------- Mi columna ----------------
  renderCase() {
    const app = this.app;
    const intro = h(`<div class="group"><h3>Simula tu discopatía</h3><div class="prose"><p>Elige el grado de degeneración y, si tu informe lo menciona, el tipo y la ubicación de la hernia. El modelo ajusta la altura del disco, el núcleo y el material herniado, e indica qué raíz queda comprometida y cómo cambia al moverte.</p></div>
      <div class="row"><button class="btn" id="ex-case">Cargar ejemplo</button><button class="btn ghost" id="clear-case">Disco sano</button></div></div>`);
    this.side.append(intro);
    $('#ex-case').addEventListener('click', () => { app.setPathology({ 'L4-L5': { grade: 4, hern: 'protrusion', zone: 'paracentral', side: 'L' }, 'L5-S1': { grade: 5, hern: 'none', zone: 'paracentral', side: 'L' }, 'L3-L4': { grade: 3, hern: 'none', zone: 'paracentral', side: 'L' } }); this.showTab('case'); this.focusDiscs(); });
    $('#clear-case').addEventListener('click', () => { app.setPathology({}); this.showTab('case'); });
    for (const seg of ['L3-L4', 'L4-L5', 'L5-S1']) {
      const p = app.pathology[seg] || { grade: 1, hern: 'none', zone: 'paracentral', side: 'L' };
      const card = h(`<div class="card"><div class="row" style="justify-content:space-between"><strong>Disco ${seg}</strong><button class="chip" data-look>Ver</button></div>
        <div class="eyebrow">Degeneración (Pfirrmann)</div><div class="seg" data-grade>${[1, 2, 3, 4, 5].map((g) => `<button data-g="${g}" aria-pressed="${p.grade === g}" title="${PFIRRMANN[g].label}">${['I', 'II', 'III', 'IV', 'V'][g - 1]}</button>`).join('')}</div>
        <div class="hint">${PFIRRMANN[p.grade || 1].label}</div>
        <div class="row"><select data-hern aria-label="Tipo de hernia en ${seg}">${Object.entries(HERNIA).map(([k, v]) => `<option value="${k}" ${p.hern === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
        <div class="row"><select data-zone aria-label="Zona de la hernia en ${seg}">${Object.entries(ZONES).map(([k, v]) => `<option value="${k}" ${p.zone === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
        <div class="seg" data-side><button data-s="L" aria-pressed="${p.side !== 'R'}">Izquierda</button><button data-s="R" aria-pressed="${p.side === 'R'}">Derecha</button></div></div></div>`);
      const upd = (patch) => { const cur = { ...(app.pathology[seg] || { grade: 1, hern: 'none', zone: 'paracentral', side: 'L' }), ...patch }; app.setPathology({ ...app.pathology, [seg]: cur }); this.showTab('case'); };
      for (const b of card.querySelectorAll('[data-g]')) b.addEventListener('click', () => upd({ grade: +b.dataset.g }));
      $('[data-hern]', card).addEventListener('change', (e) => upd({ hern: e.target.value }));
      $('[data-zone]', card).addEventListener('change', (e) => upd({ zone: e.target.value }));
      for (const b of card.querySelectorAll('[data-s]')) b.addEventListener('click', () => upd({ side: b.dataset.s }));
      $('[data-look]', card).addEventListener('click', () => { this.focusDiscs(); const it = app.itemByKey['disc:' + seg]; app.select(it, { focus: true }); });
      this.side.append(card);
    }
    const res = h(`<div class="group"><h3>Raíces comprometidas</h3><div id="case-roots"></div><div id="case-derm"></div>
      <div class="cite">Índice ilustrativo: combina el tipo de hernia con la migración del núcleo, el cambio de altura foraminal y la tensión de la raíz calculados en el modelo. Mapa de dermatomas aproximado: en la realidad se superponen y varían entre personas.</div></div>`);
    this.side.append(res);
    const shift = h(`<div class="group"><h3>Lateral shift</h3><div class="prose">
      <p>Prueba qué pasa en el modelo cuando el tronco se desplaza <strong>alejándose</strong> o <strong>acercándose</strong> al lado de la hernia. Observa la altura del foramen y el índice de compresión de la raíz.</p></div>
      <div class="row"><button class="chip" data-shift="away">Alejarse de la hernia</button><button class="chip" data-shift="toward">Hacia la hernia</button><button class="chip" data-shift="none">Neutro</button></div>
      <dl class="kv" id="shift-kv"></dl>
      <div class="card"><div class="eyebrow">Qué dice la evidencia</div><div class="prose"><ul>
      <li>Matsui et al., Spine 1998 (n = 40, cirugía): hernia en el lado convexo (tronco alejado) en el 80 %; los shifts se corrigieron tras la cirugía.</li>
      <li>Suk et al., Spine 2001 (n = 45): 67 % en el lado convexo; la posición de la hernia respecto de la raíz (axilar u hombro) no predijo la dirección.</li>
      <li>Porter y Miller, Spine 1986 (n = 100): la dirección no se relacionó con el lado de la ciática.</li></ul>
      <p>La causa sigue sin aclararse. El modelo muestra un efecto geométrico (el foramen del lado convexo se abre), que es solo una de las hipótesis.</p></div></div></div>`);
    for (const b of shift.querySelectorAll('[data-shift]')) b.addEventListener('click', () => {
      const p = Object.entries(app.pathology).find(([, v]) => v.hern && v.hern !== 'none');
      const side = p ? p[1].side : 'L';
      const dir = b.dataset.shift === 'none' ? 0 : (b.dataset.shift === 'away' ? 1 : -1) * (side === 'L' ? 1 : -1);
      app.animator.play([{ t: 2.2, state: { ...DEFAULT_STATE, shift: 0.9 * dir, shiftKyphosis: 0.5 } }]);
      app.view('postFull');
    });
    this.side.append(shift);
    this.side.append(h(`<div class="callout"><strong>Señales de alarma: consulta de urgencia</strong> si hay adormecimiento genital o “en silla de montar”, dificultad para orinar o pérdida del control de esfínteres, ciática en ambas piernas o debilidad que progresa.</div>`));
    this.side.append(h(`<div class="card"><div class="eyebrow">Para leer tu informe con perspectiva</div><div class="prose"><p>En personas sin dolor: degeneración discal en el 37 % a los 20 años y en el 96 % a los 80; protrusiones en el 29 % y 43 % (Brinjikji et al., AJNR 2015). Regresión espontánea observada: secuestro 96 %, extrusión 70 %, protrusión 41 %, abombamiento 13 % (Chiu et al., Clin Rehabil 2015).</p></div></div>`));
  }

  focusDiscs() {
    const app = this.app;
    app.setDissection(1);
    Object.assign(app.layerState, { ligaments: false, neural: true, peripheral: true, dura: false, discs: true, pelvis: false });
    app.applyLayers();
    this.syncLayerChecks();
    $('#dissect').value = 1; $('#dissect-out').textContent = 'Ligamentos y nervios';
    app.view('l45Lat');
  }

  // ---------------- Clase ----------------
  renderClass() {
    const i = this.lessonStep;
    const step = LESSON[i];
    const box = h(`<div class="group">
      <div class="lesson-nav"><span class="eyebrow">Paso ${i + 1} de ${LESSON.length}</span><div class="dots">${LESSON.map((_, j) => `<button aria-label="Paso ${j + 1}" aria-current="${j === i}" data-j="${j}"></button>`).join('')}</div></div>
      <h2 class="lesson-title">${step.title}</h2>
      <div class="prose" id="lesson-text">${step.html}</div>
      <div class="row"><button class="btn ghost" id="l-prev" ${i === 0 ? 'disabled' : ''}>Anterior</button><button class="btn" id="l-next">${i === LESSON.length - 1 ? 'Volver al inicio' : 'Siguiente'}</button><button class="chip" id="l-speak">Escuchar</button><button class="chip" id="l-replay">Repetir animación</button></div></div>`);
    this.side.append(box);
    $('#l-prev').addEventListener('click', () => this.goLesson(i - 1));
    $('#l-next').addEventListener('click', () => this.goLesson(i === LESSON.length - 1 ? 0 : i + 1));
    $('#l-replay').addEventListener('click', () => this.applyLesson(step, true));
    for (const d of box.querySelectorAll('.dots button')) d.addEventListener('click', () => this.goLesson(+d.dataset.j));
    const sp = $('#l-speak');
    if (!('speechSynthesis' in window)) sp.hidden = true;
    sp.addEventListener('click', () => {
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); sp.textContent = 'Escuchar'; return; }
      const u = new SpeechSynthesisUtterance(step.title + '. ' + $('#lesson-text').innerText);
      const v = speechSynthesis.getVoices().filter((x) => x.lang.startsWith('es'));
      u.voice = v.find((x) => /CL|419|MX|US/.test(x.lang)) || v[0] || null;
      u.lang = u.voice?.lang || 'es-ES';
      u.rate = 0.98;
      u.onend = () => { sp.textContent = 'Escuchar'; };
      speechSynthesis.speak(u);
      sp.textContent = 'Detener';
    });
    if (!this._lessonApplied || this._lessonApplied !== i) { this._lessonApplied = i; this.applyLesson(step, true); }
  }

  goLesson(i) {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    this.lessonStep = Math.max(0, Math.min(LESSON.length - 1, i));
    this._lessonApplied = null;
    this.showTab('class');
  }

  applyLesson(step, animate) {
    const app = this.app;
    const L = step.layers || {};
    const depth = L.muscles ?? 7;
    app.setDissection(depth);
    if (L.abdomen === false) app.layerState.muscle6 = false;
    Object.assign(app.layerState, {
      ligaments: L.ligaments ?? true, neural: L.nerves ?? true, peripheral: L.nerves ?? true, dura: L.dura ?? (L.nerves ?? true),
      discs: L.discs ?? true, skin: !!L.skin, fascia: !!L.fascia, vertebrae: true, pelvis: L.pelvis ?? true, skull: L.skull ?? true, thorax: true, limbs: true,
    });
    app.isolated = null;
    app.discs.setXray(!!L.discXray);
    const xr = $('#ly-xray'); if (xr) xr.checked = !!L.discXray;
    if (step.pathology) app.setPathology(step.pathology);
    app.applyLayers();
    this.syncLayerChecks();
    $('#dissect').value = depth; $('#dissect').dispatchEvent(new Event('input'));
    Object.assign(app.layerState, { ligaments: L.ligaments ?? true, neural: L.nerves ?? true, peripheral: L.nerves ?? true, dura: L.dura ?? (L.nerves ?? true) });
    app.applyLayers();
    this.syncLayerChecks();
    this.setColor(step.color || 'anat');
    app.setClip(step.clip ? { mode: step.clip.mode, level: step.clip.level || 'L4-L5', offset: 0 } : { mode: 'none' });
    this.syncClip();
    app.animator.stop();
    if (step.pose) app.posture.set(step.pose);
    else if (step.animate) app.posture.set({ ...DEFAULT_STATE });
    app.dirty = true;
    app.view(step.view);
    if (step.animate && animate) app.animator.play(step.animate);
    // resaltar estructuras
    app.select(null);
    if (step.highlight) {
      const it = app.itemByKey[step.highlight[0]];
      if (it) { app.selected = it; if (it.kind === 'bone' || it.kind === 'disc') it.mesh.material.userData.uniforms.uHighlight.value.setRGB(0.28, 0.18, 0.03); }
      for (const k of step.highlight.slice(1)) { const o = app.itemByKey[k]; if (o?.strands) for (const s of o.strands) s.hl = 1; }
      app._extraHL = step.highlight.slice(1).map((k) => app.itemByKey[k]).filter(Boolean);
      app.dirty = true;
    } else app._extraHL = [];
  }

  // ---------------- métricas en vivo ----------------
  updateMetrics() {
    const app = this.app;
    const m = app.biomech?.metrics;
    if (!m) return;
    const info = app.info || {};
    this.updateItemLive();
    if (this.tab === 'move' && $('#m-trunk')) {
      const st = app.posture.state;
      $('#m-trunk').innerHTML = st.sit ? `<dt>Flexión de cadera</dt><dd>${f1(app.rig.hipFlex.L)}°</dd><dt>Inclinación de la pelvis</dt><dd>${sgn(info.hip)}° ${info.hip < 0 ? '(retroversión)' : ''}</dd><dt>Columna lumbar (respecto de la lordosis de pie)</dt><dd>${sgn(info.lumbarFlex)}°</dd>`
        : `<dt>Tronco respecto de la vertical</dt><dd>${sgn(info.trunk)}°</dd><dt>Aporte lumbar</dt><dd>${sgn(info.lumbarFlex)}°</dd><dt>Aporte de cadera (pelvis)</dt><dd>${sgn(info.hip)}°</dd><dt>Torácica / cervical</dt><dd>${sgn(info.thoracicFlex)}° / ${sgn(info.cervicalFlex)}°</dd><dt>Rotación lumbar / torácica</dt><dd>${sgn(info.lumbarRot)}° / ${sgn(info.thoracicRot)}°</dd>`;
      $('#m-load').innerHTML = `<dt>Compresión estimada</dt><dd>${Math.round(m.comp)} N (≈ ${f1(m.comp / 9.81, 0)} kgf)</dd><dt>Momento flexor del tronco</dt><dd>${f1(m.M)} N·m</dd><dt>Fuerza de los extensores</dt><dd>${Math.round(m.Fm)} N</dd><dt>Cizalla anterior</dt><dd>${Math.round(m.shear)} N</dd>${app.frZone > 0.3 ? '<dt>Relajación-flexión</dt><dd>activa</dd>' : ''}`;
      pressureBullet($('#m-bullet'), m.mpa);
      const fr = (k) => `${f1(m.foramen[k])} mm (${sgn(app.biomech.foramenChange(k) * 100, 0)} %)`;
      $('#m-foramen').innerHTML = ['L3-L4', 'L4-L5', 'L5-S1'].map((s) => `<dt>${s} izq. / der.</dt><dd>${fr(s + 'L')} · ${fr(s + 'R')}</dd>`).join('');
      const R = (id) => { const n = app.nerves.find((x) => x.id === id); return n ? sgn(n.strands[0].strain * 100) + ' %' : '—'; };
      $('#m-roots').innerHTML = ['L4', 'L5', 'S1'].map((r) => `<dt>${r} izq. / der.</dt><dd>${R('root' + r + 'L')} · ${R('root' + r + 'R')}</dd>`).join('') + '<dt>Ciático izq. / der.</dt><dd>' + R('sciaticL') + ' · ' + R('sciaticR') + '</dd>';
      const acts = app.muscles.map((x) => ({ n: x.name + (x.side === 'L' ? ' izq.' : ' der.'), a: x.strands[0].act || 0 })).sort((a, b) => b.a - a.a).slice(0, 5);
      $('#m-muscles').innerHTML = acts.map((a) => `<dt>${a.n}</dt><dd>${Math.round(a.a * 100)} %</dd>`).join('');
      anglesChart($('#m-angles'), app.rig.segmentState, this.tooltip);
      $('#narrative').innerHTML = this.narrative(info, m);
    }
    if (this.tab === 'case' && $('#case-roots')) {
      const comp = Object.values(app.compression);
      const el = $('#case-roots');
      if (!comp.length) el.innerHTML = '<div class="hint">No hay hernias configuradas. Elige un tipo de hernia en algún disco.</div>';
      else el.innerHTML = comp.map((c) => {
        const s = statusFor(c.idx);
        const inf = infoFor({ root: c.root, kind: 'nerve' });
        return `<div class="card"><div class="row" style="justify-content:space-between"><strong>Raíz ${c.root} ${c.side === 'L' ? 'izquierda' : 'derecha'}</strong><span class="status"><i style="background:var(--${s.cls})"></i>${s.label} · ${Math.round(c.idx * 100)} %</span></div>
        <div class="hint">${HERNIA[c.hern].label.split(' (')[0]} ${ZONES[c.zone].label.toLowerCase()} en ${c.seg}. Empuje del núcleo hacia la hernia: ${sgn(c.push, 2)} · foramen ${sgn(c.forCh * 100, 0)} % · tensión de la raíz ${sgn(c.strain * 100)} %</div>
        <div class="prose" style="font-size:13px">${inf?.clinic?.split('. ').slice(-1)[0] || ''}</div></div>`;
      }).join('');
      const act = {};
      for (const c of comp) if (c.idx >= 0.08) (act[c.root] = act[c.root] || []).push(c.side);
      const key = JSON.stringify(act);
      if (this._derm !== key) { $('#case-derm').innerHTML = dermatomeSVG(act); this._derm = key; }
      const p = Object.entries(app.pathology).find(([, v]) => v.hern && v.hern !== 'none');
      if (p && $('#shift-kv')) {
        const [seg, v] = p;
        const c = app.compression[affectedRoot(seg, v.zone) + v.side];
        $('#shift-kv').innerHTML = `<dt>Shift actual</dt><dd>${sgn(app.posture.state.shift * 100, 0)} % (${app.posture.state.shift > 0.05 ? 'hombros a la derecha' : app.posture.state.shift < -0.05 ? 'hombros a la izquierda' : 'neutro'})</dd>
          <dt>Foramen ${seg} del lado de la hernia</dt><dd>${f1(m.foramen[seg + v.side] || 0)} mm (${sgn(app.biomech.foramenChange(seg + v.side) * 100, 0)} %)</dd>
          <dt>Índice de compresión ${c ? 'raíz ' + c.root : ''}</dt><dd>${c ? Math.round(c.idx * 100) + ' %' : '—'}</dd>`;
      } else if ($('#shift-kv')) $('#shift-kv').innerHTML = '<dt>Configura una hernia arriba para ver su efecto.</dt><dd></dd>';
    }
  }

  narrative(info, m) {
    const st = this.app.posture.state;
    const d = this.app.discs.byId['L4-L5'];
    const ns = d.state.nucleusShift;
    const out = [];
    const nuc = Math.abs(ns.y) > 0.25 ? `el núcleo de L4-L5 se desplaza ${f1(Math.abs(ns.y))} mm hacia ${ns.y < 0 ? 'atrás' : 'delante'}` : 'el núcleo de L4-L5 queda centrado';
    if (st.sit > 0.5) out.push(`<p><strong>Sentado ${st.slump > 0.5 ? 'encorvado' : 'erguido'}.</strong> La pelvis rota hacia atrás (${f1(Math.abs(info.hip))}°) y la lordosis lumbar se aplana ${f1(info.lumbarFlex)}°; ${nuc}.</p>`);
    else if (st.flex > 0.05) out.push(`<p><strong>Flexión.</strong> De ${f1(info.trunk)}° de inclinación del tronco, ${f1(info.lumbarFlex)}° vienen de la columna lumbar y ${f1(info.hip)}° de la cadera${st.hinge > 0.5 ? ' (bisagra de cadera: la columna se mantiene más neutra)' : ''}. Los discos se comprimen por delante y ${nuc}. Las raíces y el ciático se alargan.${this.app.frZone > 0.3 ? ' Estás en la zona de <strong>relajación-flexión</strong>: los erectores reducen su actividad y ligamentos, fascia y disco sostienen el tronco.' : ' Los erectores trabajan alargándose para frenar el descenso.'}</p>`);
    else if (st.flex < -0.05) out.push(`<p><strong>Extensión.</strong> Las facetas posteriores se cargan y los agujeros de conjunción se cierran; ${nuc}. Los abdominales controlan el movimiento.</p>`);
    if (Math.abs(st.lat) > 0.05) { const r = st.lat > 0; out.push(`<p><strong>Inclinación a la ${r ? 'derecha' : 'izquierda'}.</strong> El cuadrado lumbar y los erectores ${r ? 'izquierdos' : 'derechos'} se alargan y frenan; los discos se abomban en el lado ${r ? 'derecho' : 'izquierdo'} y los forámenes de ese lado se estrechan.</p>`); }
    if (Math.abs(st.rot) > 0.05) { const r = st.rot > 0; out.push(`<p><strong>Rotación a la ${r ? 'derecha' : 'izquierda'}.</strong> La columna lumbar solo aporta ${f1(Math.abs(info.lumbarRot))}°; el tórax ${f1(Math.abs(info.thoracicRot))}°. Trabajan el oblicuo externo ${r ? 'izquierdo' : 'derecho'} y el interno ${r ? 'derecho' : 'izquierdo'}.</p>`); }
    if (Math.abs(st.shift) > 0.05) out.push(`<p><strong>Lateral shift ${st.shift > 0 ? 'derecho' : 'izquierdo'}.</strong> Los segmentos L3-S1 se inclinan hacia ${st.shift > 0 ? 'la derecha' : 'la izquierda'} y los superiores compensan para mantener el tórax vertical. El lado ${st.shift > 0 ? 'izquierdo' : 'derecho'} queda convexo: sus forámenes se abren.</p>`);
    if (st.loadKg > 0) out.push(`<p>Con ${Math.round(st.loadKg)} kg en las manos la compresión estimada en L4-L5 sube a ${Math.round(m.comp)} N.</p>`);
    if (!out.length) out.push(`<p><strong>Postura neutra de pie.</strong> Compresión estimada en L4-L5 de ${Math.round(m.comp)} N (${f1(m.mpa, 2)} MPa; referencia medida: 0,50 MPa). Elige un gesto o mueve los controles.</p>`);
    return out.join('');
  }
}

const ABOUT = `
<p><strong>Qué es este modelo.</strong> Un atlas 3D construido por procedimiento a partir de medidas anatómicas medias de adulto (morfometría vertebral, alturas discales, curvaturas sagitales con pendiente sacra de 40° y una plomada de C7 dentro de lo normal). Los huesos se modelaron con campos de distancia y los tejidos blandos se unen a ellos para deformarse al mover cada segmento.</p>
<p><strong>Cómo se mueve.</strong> Cada segmento tiene su rango de movimiento publicado: lumbar según Pearcy et al. (Spine 1984) y Pearcy y Tibrewal (Spine 1984), in vivo; torácico y cervical según los valores representativos de White y Panjabi (Clinical Biomechanics of the Spine, 2ª ed., 1990). La flexión de pie sigue el ritmo lumbopélvico medido por Esola et al. (Spine 1996): 111° en total, 41,6° lumbares. Se incluyen acoplamientos inclinación–rotación (cervical al mismo lado; lumbar alto al contrario).</p>
<p><strong>Qué es cálculo y qué es esquema.</strong></p>
<ul>
<li>Geométrico (sale del modelo): longitud de músculos, ligamentos y raíces; altura de los forámenes; compresión de cada borde del disco y migración del núcleo.</li>
<li>Modelo estático simplificado: compresión en L4-L5 con masas segmentarias de Dempster/Winter, brazo extensor de 5,5 cm y presión ≈ 1,5 × fuerza / área. Sirve para comparar posturas; puede errar en ±30–50 %.</li>
<li>Cualitativo: la actividad muscular estimada sigue patrones EMG clásicos (relajación-flexión según Kippers y Parker 1984; oblicuos cruzados en la rotación), no una simulación muscular.</li>
<li>Ilustrativo: el índice de compresión radicular. No mide tu raíz.</li>
</ul>
<p><strong>Límites.</strong> Es una anatomía media: tu columna puede diferir en tamaño, curvas y variantes. La forma de los huesos está simplificada. No sustituye una resonancia, ni la exploración ni el criterio de tu equipo tratante.</p>
<p><strong>Referencias principales</strong></p>
<ul class="cite">
<li>Wilke HJ et al. New in vivo measurements of pressures in the intervertebral disc in daily life. Spine 1999;24:755–62.</li>
<li>Pearcy M, Portek I, Shepherd J. Three-dimensional x-ray analysis of normal movement in the lumbar spine. Spine 1984;9:294–7. Pearcy MJ, Tibrewal SB. Spine 1984;9:582–7.</li>
<li>White AA, Panjabi MM. Clinical Biomechanics of the Spine. 2ª ed. Lippincott, 1990.</li>
<li>Esola MA et al. Analysis of lumbar spine and hip motion during forward bending. Spine 1996;21:71–8.</li>
<li>Kippers V, Parker AW. Posture related to myoelectric silence of erectores spinae during trunk flexion. Spine 1984;9:740–5.</li>
<li>Inufusa A et al. Anatomic changes of the spinal canal and intervertebral foramen associated with flexion-extension movement. Spine 1996;21:2412–20.</li>
<li>Pfirrmann CW et al. Magnetic resonance classification of lumbar intervertebral disc degeneration. Spine 2001;26:1873–8.</li>
<li>Fardon DF et al. Lumbar disc nomenclature: version 2.0. Spine J 2014;14:2525–45.</li>
<li>Brinjikji W et al. Systematic literature review of imaging features of spinal degeneration in asymptomatic populations. AJNR 2015;36:811–6.</li>
<li>Chiu CC et al. The probability of spontaneous regression of lumbar herniated disc. Clin Rehabil 2015;29:184–95.</li>
<li>Matsui H et al. Sciatic scoliosis in lumbar disc herniation. Spine 1998;23:338–42. Suk KS et al. Spine 2001;26:667–71. Porter RW, Miller CG. Back pain and trunk list. Spine 1986;11:596–600.</li>
<li>Macintosh JE, Bogduk N et al. The morphology of the human lumbar multifidus. Clin Biomech 1986;1:196–204.</li>
<li>Deyo RA, Mirza SK. Herniated lumbar intervertebral disk. N Engl J Med 2016;374:1763–72.</li>
</ul>`;
