// Pestaña "Mi caso": qué te puede estar pasando (4 mecanismos con 3D y exploración), por qué vuelven las crisis,
// indicaciones con su evidencia y un registro personal de crisis. Cada escena 3D se monta sobre el mismo motor
// (patología del disco, listesis, tensión neural, hidratación) y se desmonta al salir.
import * as THREE from 'three';
import { HYPOTHESES, SYMPTOMS, MYOTOMES, DEMO_INFO, RECUR_INTRO, RECUR_ITEMS, TRIGGERS_CHART, DAY_TEXT, SITTING_TEXT, PREVENTION_CHART, MEDS, STEPS, PLAN_12, QUESTIONS, RED_FLAGS, LIMITS } from '../data/case-content.js';
import { forestPlot, orChart, iconArrays, barList, timeline } from './case-charts.js';
import { PersonalStore } from './store.js';
import { slrDemo, slumpDemo, gaitDemo, hipAbdDemo, kneeReflexDemo, socksDemo, sittingDemo, listhesisDemo } from '../sim/demos.js';
import { EXERCISES } from '../sim/exercises.js';
import { DEFAULT_STATE } from '../sim/posture.js';

const $ = (s, r = document) => r.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const f1 = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d).replace('.', ',') : '—');
const sgn = (v, d = 0) => (v > 0 ? '+' : '') + f1(v, d);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SUBS = [['what', 'Qué me pasa'], ['why', 'Por qué vuelve'], ['todo', 'Indicaciones'], ['diary', 'Registro'], ['disk', 'Mi disco']];
const LUMBAR = ['L5-S1', 'L4-L5', 'L3-L4', 'L2-L3', 'L1-L2'];
const TRIGGER_LABELS = {
  heavy: 'Carga pesada', bendTwist: 'Flexión con giro', sitting: 'Sentado más de 5 h', morning: 'Primeras horas del día',
  tired: 'Cansancio', distracted: 'Distracción', sleep: 'Dormí mal', stress: 'Estrés alto', sport: 'Deporte o esfuerzo', other: 'Otro',
};
const LEG_LABELS = { none: 'No bajó a la pierna', buttock: 'Nalga', thigh: 'Muslo', knee: 'Hasta la rodilla', calf: 'Pantorrilla', foot: 'Pie' };

export class CaseUI {
  constructor(ui) {
    this.ui = ui;
    this.app = ui.app;
    this.store = new PersonalStore();
    this.sub = 'what';
    this.side = 'L';
    this.hyp = null; // hipótesis en 3D
    this.demoKey = null;
    this.recurN = 1;
    this.hour = 7;
    this.hernType = 'protrusion';
    this.slr = { pos: null, prev: 0 };
    this.store.onChange(() => { if (this.ui.tab === 'case' && (this.sub === 'diary' || this.sub === 'todo' || this.sub === 'what')) this.refreshPersonal(); });
  }

  // ------------------------------------------------------------------ entrada / salida
  render(container) {
    this.root = container;
    if (!this.saved) this.saved = JSON.parse(JSON.stringify(this.app.pathology || {}));
    const sideCfg = Object.values(this.saved).find((p) => p && p.side);
    if (sideCfg && !this._sideSet) { this.side = sideCfg.side; this._sideSet = true; }
    const nav = h(`<div class="subnav" role="tablist" aria-label="Secciones de Mi caso">${SUBS.map(([id, l]) => `<button role="tab" data-sub="${id}" aria-selected="${id === this.sub}">${l}</button>`).join('')}</div>`);
    for (const b of nav.querySelectorAll('button')) b.addEventListener('click', () => this.go(b.dataset.sub));
    container.append(nav);
    const body = h('<div class="group" id="case-body"></div>');
    container.append(body);
    this.body = body;
    if (this.sub === 'what') this.renderWhat();
    if (this.sub === 'why') this.renderWhy();
    if (this.sub === 'todo') this.renderTodo();
    if (this.sub === 'diary') this.renderDiary();
    if (this.sub === 'disk') { this.leaveScene(true); this.ui.renderDiskConfig(body); }
    if (!this._entered && this.sub !== 'disk') { this._entered = true; if (this.sub === 'what' && !this.hyp) this.setHypothesis('radicular'); }
  }

  go(sub) {
    if (sub === this.sub) return;
    this.sub = sub;
    if (sub === 'disk') this.leaveScene(true);
    if (sub === 'what' && !this.hyp) this.setHypothesis('radicular');
    if (sub === 'why' && !this.whyScene) this.setRecurrence(this.recurN);
    this.ui.showTab('case');
  }

  // al salir de la pestaña: se restaura la columna configurada por la persona
  leave() {
    this.leaveScene(true);
    this._entered = false;
  }

  leaveScene(restore) {
    this.resetScene();
    this.hyp = null;
    this.whyScene = null;
    this.demoKey = null;
    if (restore && this.saved) { this.app.setPathology(this.saved); this.saved = null; }
    this.app.focusSide = null;
    this.app.follow = null;
    this.ui.setColor('anat');
    this.ui.resetLayers?.();
  }

  resetScene() {
    const app = this.app;
    if (app.exercise.active) app.exercise.stop();
    app.layerFilter = null;
    app.discs.ingrowth = {};
    app.discs.morning = 0;
    app.rig.discHydration = {};
    app.rootIrritation = {};
    app.caseHook = null;
    app._extraHL = [];
    app.follow = null;
    for (const n of app.nerves) for (const s of n.strands) { s.signal = 0; s.edema = 0; }
    for (const m of app.muscles) for (const s of m.strands) { s.edema = 0; s.guard = 0; }
    app.fx.clear();
    app.plumb.visible = false;
    app.discs.stress = null;
    app.discs.inflam = {};
    app.discs.setCutaway(null, app.bones);
    app.discs.setXray(false);
    if (app.clip.mode !== 'none') { app.setClip({ mode: 'none', offset: 0 }); this.ui.syncClip?.(); }
    const P = app.skin?.pain;
    if (P) for (const k of ['uPainAL', 'uPainBL', 'uPainAR', 'uPainBR']) P[k].value.set(0, 0, 0, 0);
    app.opacity.bones = 1;
    app.animator.stop();
    app.posture.set({ ...DEFAULT_STATE });
    this.ui.setColor('anat');
    app.dirty = true;
  }

  grade() { return this.saved?.['L4-L5']?.grade || 4; }

  layers(o) {
    const app = this.app;
    app.setDissection(o.depth ?? 0);
    Object.assign(app.layerState, { vertebrae: true, pelvis: true, thorax: true, skull: true, limbs: true, discs: true, legs: true, arms: false, ligaments: false, neural: true, dura: false, peripheral: false, fascia: false, skin: false }, o.set || {});
    if (o.muscles) for (let l = 2; l <= 8; l++) app.layerState['muscle' + l] = o.muscles.includes(l);
    app.isolated = null;
    app.applyLayers();
    this.ui.syncLayerChecks();
  }

  // ------------------------------------------------------------------ escenas: hipótesis
  setHypothesis(id) {
    const app = this.app, side = this.side, g = this.grade();
    this.resetScene();
    this.hyp = id;
    this.demoKey = null;
    app.focusSide = side;
    app.episodeSeg = 'L4-L5';
    const path = { ...(this.saved || {}) };
    if (id === 'radicular') {
      path['L4-L5'] = { grade: g, hern: this.hernType, zone: 'paracentral', side, size: 1 };
      app.setPathology(path);
      app.rootIrritation = { ['L5' + side]: this.hernType === 'extrusion' ? 1 : 0.8 };
      this.layers({ depth: 0, set: { neural: true, dura: true, peripheral: true } });
      app.opacity.bones = 0.55;
      app.applyLayers();
      app.caseHook = () => this.hookRadicular();
      app.view('rootObl');
    } else if (id === 'discogenic') {
      path['L4-L5'] = { grade: g, hern: 'fissure', zone: 'paracentral', side };
      app.setPathology(path);
      app.discs.ingrowth = { 'L4-L5': 1 };
      this.layers({ depth: 0, set: { neural: true } });
      app.discs.setCutaway('L4-L5', app.bones);
      app.layerFilter = (it) => it.kind !== 'nerve' || it.id === 'cord' || (it.root === 'L5' && it.side === side);
      app.applyLayers();
      app.caseHook = () => this.hookSomatic(0.45);
      app.view('discCut');
    } else if (id === 'listhesis') {
      path['L4-L5'] = { grade: g, hern: 'none', zone: 'paracentral', side, slip: { base: 5, dyn: 2.4 } };
      app.setPathology(path);
      this.layers({ depth: 0, set: { neural: true, dura: true } });
      this.startDemo('listFlex');
      return;
    } else if (id === 'facet') {
      path['L4-L5'] = { grade: Math.min(g, 3), hern: 'none', zone: 'paracentral', side };
      app.setPathology(path);
      this.layers({ depth: 2, set: { neural: true, ligaments: true } });
      this.startDemo('facetExt');
      return;
    }
    app.dirty = true;
  }

  // ------------------------------------------------------------------ escenas: por qué vuelve
  setRecurrence(n) {
    const app = this.app, side = this.side, g = this.grade();
    this.resetScene();
    this.whyScene = 'recur';
    this.recurN = n;
    this.demoKey = null;
    app.focusSide = side;
    app.episodeSeg = 'L4-L5';
    const step = [null,
      { hern: 'fissure', breachExtra: 0, size: 1, ing: 0.34 },
      { hern: 'fissure', breachExtra: 1, size: 1, ing: 0.55 },
      { hern: 'protrusion', breachExtra: 1, size: 0.55, ing: 0.75 },
      { hern: 'protrusion', breachExtra: 1, size: 0.8, ing: 0.9 },
      { hern: 'protrusion', breachExtra: 1, size: 1, ing: 1 }][n];
    const path = { ...(this.saved || {}) };
    path['L4-L5'] = { grade: g, hern: step.hern, zone: 'paracentral', side, size: step.size, breachExtra: step.breachExtra };
    app.setPathology(path);
    app.discs.ingrowth = { 'L4-L5': step.ing };
    const k = (n - 1) / 4;
    app.rootIrritation = { ['L5' + side]: 0.25 + 0.6 * k };
    this.layers({ depth: 2, set: { neural: true } });
    app.discs.setCutaway('L4-L5', app.bones);
    app.layerFilter = (it) => it.kind !== 'nerve' || it.id === 'cord' || (it.root === 'L5' && it.side === side);
    app.applyLayers();
    const mf = app.muscles.find((m) => m.id === 'multifidus' && m.side === side);
    const atrophy = mf ? mf.strands.slice(9, 15) : [];
    app.caseHook = () => {
      // multífido más pequeño del lado de los síntomas a ese nivel, defensa que no se apaga y raíz que descarga en reposo
      for (const s of atrophy) s.edema = -0.55 * k;
      for (const m of app.muscles) if (['multifidus', 'longLumb', 'iliocLumb', 'ql'].includes(m.id)) for (const s of m.strands) s.guard = 0.22 * k * (m.side === side ? 1 : 0.6);
      const r = app.nerves.find((x) => x.root === 'L5' && x.side === side);
      if (r) for (const s of r.strands) s.signal = 0.1 + 0.3 * k;
    };
    app.view(this.recurCam || 'discCut');
  }

  setDay(hour) {
    const app = this.app;
    this.hour = hour;
    // tras levantarse (~6:30) el disco pierde altura rápido: ~60 % de la pérdida en las primeras 4 h
    const m = THREE.MathUtils.clamp(Math.exp(-(hour - 6.5) / 5), 0, 1);
    this.morning = m;
    app.discs.morning = m;
    for (const id of LUMBAR) {
      const seg = app.discs.byId[id]?.seg;
      if (seg) app.rig.discHydration[id] = seg.disc * 0.07 * (m - 0.35);
    }
    // por la mañana la flexión lumbar alcanza ~5° menos (Adams 1987)
    if (app.exercise.active && this.demoKey === 'bend') app.exercise.mods = { lum: -5 * m };
    app.dirty = true;
  }

  // ------------------------------------------------------------------ demostraciones
  demoDef(key) {
    const s = this.side;
    switch (key) {
      case 'slr': return slrDemo(s, false);
      case 'slrCross': return slrDemo(s, true);
      case 'slump': return slumpDemo(s);
      case 'heels': return gaitDemo('heels');
      case 'toes': return gaitDemo('toes');
      case 'walk': return gaitDemo('normal');
      case 'hipabd': return hipAbdDemo(s);
      case 'kneeReflex': return kneeReflexDemo(s);
      case 'socksFlex': return socksDemo('flex');
      case 'socksHinge': return socksDemo('hinge');
      case 'sitting': return sittingDemo();
      case 'listFlex': return listhesisDemo('standing');
      case 'listLying': return listhesisDemo('lying');
      case 'facetExt': return {
        id: 'facet-ext', name: 'Extensión con giro', cam: [s === 'L' ? -40 : -140, 10],
        keys: [
          { d: 0, hold: 0.8, pose: { shFL: 4, shFR: 4 } },
          { d: 2, hold: 1.6, pose: { pel: -6, lum: -16, tho: -6, lumRot: s === 'L' ? -4 : 4, thoRot: s === 'L' ? -16 : 16, lumLat: s === 'L' ? -6 : 6, neck: -8, shFL: -20, shFR: -20, shAL: 18, shAR: 18, elbL: 90, elbR: 90 } },
          { d: 1.8, hold: 0.6, pose: { pel: 0, lum: 0, tho: 0, lumRot: 0, thoRot: 0, lumLat: 0, neck: 0, shFL: 4, shFR: 4, shAL: 0, shAR: 0, elbL: 0, elbR: 0 } },
        ],
        muscles: [{ id: 'multifidus', lv: 0.3, lat: 'both' }, { id: 'longLumb', lv: 0.3, lat: 'both' }],
      };
      case 'bend': return {
        id: 'bend', name: 'Inclinarse hacia delante', cam: [0, 8],
        keys: [
          { d: 0, hold: 1, pose: { shFL: 4, shFR: 4 } },
          { d: 2, hold: 1.4, pose: { pel: 30, lum: 30, tho: 10, neck: 12, shFL: 40, shFR: 40 } },
          { d: 1.8, hold: 0.6, pose: { pel: 0, lum: 0, tho: 0, neck: 0, shFL: 4, shFR: 4 } },
        ],
        muscles: [{ id: 'longLumb', lv: 0.4, lat: 'both' }, { id: 'iliocLumb', lv: 0.35, lat: 'both' }, { id: 'hamstrings', lv: 0.2, lat: 'both' }],
      };
      case 'glide': { const ex = EXERCISES.find((e) => e.id === 'glide'); return { ...ex }; }
      default: return null;
    }
  }

  startDemo(key) {
    const app = this.app, side = this.side;
    const def = this.demoDef(key);
    if (!def) {
      if (key === 'fibers') { this.setHypothesis('discogenic'); this.refreshNow(); }
      return;
    }
    const keepPath = this.hyp || this.whyScene;
    if (!keepPath) {
      this.resetScene();
      // sin escena previa: raíz L5 irritada por una protrusión, para que las pruebas tengan algo que mostrar
      const path = { ...(this.saved || {}) };
      path['L4-L5'] = { grade: this.grade(), hern: this.hernType, zone: 'paracentral', side, size: 1 };
      app.setPathology(path);
      app.rootIrritation = { ['L5' + side]: this.hernType === 'extrusion' ? 1 : 0.8 };
    } else {
      // mantener la patología de la escena y limpiar lo demás
      if (app.exercise.active) app.exercise.stop();
      app.caseHook = null;
      app.layerFilter = null;
      app.follow = null;
      app.fx.clear();
      const P = app.skin?.pain;
      if (P) for (const k of ['uPainAL', 'uPainBL', 'uPainAR', 'uPainBR']) P[k].value.set(0, 0, 0, 0);
      for (const n of app.nerves) for (const s of n.strands) { s.signal = 0; s.edema = 0; }
      app.discs.setCutaway(null, app.bones);
      if (app.clip.mode !== 'none') { app.setClip({ mode: 'none', offset: 0 }); this.ui.syncClip?.(); }
      app.applyLayers();
    }
    this.demoKey = key;
    this.slr = { pos: null, prev: 0, peak: 0 };
    app.focusSide = side;
    const L = def.layers || {};
    const lay = { depth: 0, set: { skin: !!L.skin, neural: true, peripheral: !!L.nerves, dura: false, arms: true, legs: true }, muscles: L.muscles || [] };
    if (key === 'listFlex' || key === 'listLying') lay.set = { ...lay.set, skin: false, dura: true, arms: false };
    if (key === 'facetExt') { lay.muscles = []; lay.set = { ...lay.set, skin: false, ligaments: true, arms: false }; }
    if (key === 'hipabd') lay.set = { ...lay.set, skin: false };
    if (key === 'bend') { lay.muscles = []; lay.set = { ...lay.set, skin: false, arms: false }; }
    this.layers(lay);
    app.exercise.start(def);
    const usesStrain = key === 'slr' || key === 'slrCross' || key === 'slump';
    this.ui.setColor(key.startsWith('list') || key === 'facetExt' ? 'anat' : usesStrain ? 'strain' : key === 'bend' || key.startsWith('socks') || key === 'sitting' ? 'pressure' : 'activity');
    if (key.startsWith('socks')) { app.discs.morning = 1; this.morning = 1; }
    if (key === 'bend') this.setDay(this.hour);
    // demostración "de cerca": la listesis se ve en un corte sagital que sigue a L4
    if (key === 'listFlex' || key === 'listLying') {
      app.setClip({ mode: 'sagittal', offset: 0 }); this.ui.syncClip?.();
      app.exercise.computeBounds();
      app.simulate();
      app.view('listLat');
      app.follow = { bone: 'L4', local: [0, -20, -12] };
    } else if (key === 'bend') {
      // de cerca y de lado, siguiendo a L4, para ver el color de los discos
      app.exercise.computeBounds();
      app.simulate();
      app.view('discLat');
      app.follow = { bone: 'L4', local: [0, -10, 0] };
    } else if (key === 'facetExt') {
      app.exercise.computeBounds();
      app.simulate();
      const f = app.resolver.resolve(`L4.facetInf${side}`);
      app.caseHook = () => {
        const w = f.local.clone().applyMatrix4(app.rig.bones[f.bone].matrixWorld);
        const load = this.facetLoad();
        app.fx.set('a', { center: w, radius: 7, intensity: 0.35 + 0.65 * load, size: 8 });
        this.hookSomatic(0.25 + 0.5 * load);
      };
      app.view('lumbarSide');
      app.follow = { bone: 'L4', local: [0, -20, -20] };
    } else {
      app.exercise.computeBounds();
      app.simulate();
      app.view('exercise');
      if (def.test) app.caseHook = () => this.hookTest(def);
      else if (key === 'heels' || key === 'toes' || key === 'hipabd' || key === 'kneeReflex') {
        const root = { heels: 'L5', toes: 'S1', hipabd: 'L5', kneeReflex: 'L4' }[key];
        app._extraHL = app.nerves.filter((n) => n.root === root);
      }
    }
    app.dirty = true;
    this.refreshNow();
  }

  facetLoad() {
    const st = this.app.posture.state, R = this.app.rig.segmentState['L4-L5'];
    const sgn = this.side === 'L' ? -1 : 1;
    return THREE.MathUtils.clamp(Math.max(0, -R.flex) / 2.2 * 0.6 + Math.max(0, sgn * R.rot) / 1.5 * 0.25 + Math.max(0, sgn * R.lat) / 3 * 0.25 + (st.flex < 0 ? 0.1 : 0), 0, 1);
  }

  // ------------------------------------------------------------------ ganchos por fotograma
  painMap(side, { L4 = 0, L5 = 0, S1 = 0, som = 0, extent = 0 }) {
    const P = this.app.skin?.pain;
    if (!P) return;
    const A = new THREE.Vector4(0, 0, L4, L5), B = new THREE.Vector4(S1, 0, som, extent);
    const Z = new THREE.Vector4(0, 0, 0, 0);
    if (side === 'L') { P.uPainAL.value.copy(A); P.uPainBL.value.copy(B); P.uPainAR.value.copy(Z); P.uPainBR.value.copy(Z); }
    else { P.uPainAR.value.copy(A); P.uPainBR.value.copy(B); P.uPainAL.value.copy(Z); P.uPainBL.value.copy(Z); }
  }

  hookRadicular() {
    const app = this.app, side = this.side;
    const c = app.compression['L5' + side]?.idx || 0;
    const rad = THREE.MathUtils.clamp(0.25 + 0.9 * c, 0, 1);
    this.painMap(side, { L5: rad, som: 0.2, extent: 0.55 + 0.4 * rad });
    const r = app.nerves.find((x) => x.root === 'L5' && x.side === side);
    if (r) for (const s of r.strands) { s.signal = rad * 0.8; s.edema = 0.5; }
    const d = app.discs.byId['L4-L5'];
    app.fx.set('a', { center: d.state.herniaR > 0 ? d.state.herniaCenter : d.state.fissureWorld, radius: 6, intensity: 0.7, size: 7 });
  }

  hookSomatic(level) {
    this.painMap(this.side, { som: level, extent: 0 });
  }

  // elevación de la pierna recta y slump: dolor cuando la carga de la raíz supera su umbral
  hookTest(def) {
    const app = this.app, side = def.side, leg = def.leg;
    const loadL5 = app.neural.load('L5', side), loadS1 = app.neural.load('S1', side);
    const load = Math.max(loadL5, loadS1);
    const th = app.neural.threshold('L5', side);
    const irr = app.rootIrritation['L5' + side] || 0;
    const positive = irr > 0.3 && load > th;
    const angle = def.test === 'slr' ? app.rig.hipFlex[leg] : 90 - app.rig.knee[leg];
    const rising = angle > this.slr.prev + 0.05;
    if (angle < 4) this.slr.pos = null;
    if (positive && rising && this.slr.pos == null) this.slr.pos = angle;
    this.slr.prev = angle;
    const pain = positive ? THREE.MathUtils.clamp(0.35 + (load - th) / (th * 2.5), 0, 1) : 0;
    this.slr.pain = pain; this.slr.load = load; this.slr.th = th; this.slr.angle = angle;
    this.painMap(side, { L5: pain, S1: pain * 0.6, som: pain * 0.25, extent: pain ? 0.55 + 0.45 * pain : 0 });
    for (const r of app.nerves) if ((r.root === 'L5' || r.root === 'S1') && r.side === side) for (const s of r.strands) s.signal = pain;
  }

  // ------------------------------------------------------------------ Qué me pasa
  renderWhat() {
    const b = this.body;
    b.append(h(`<div class="prose"><p><strong>Cuatro mecanismos pueden producir crisis repetidas con shift en L4-L5.</strong> Pueden coexistir, y solo una evaluación clínica con examen e imágenes puede decir cuál pesa más en ti. Elige uno para verlo en 3D.</p></div>`));
    b.append(this.sidePicker());
    const grid = h(`<div class="hyp-grid">${HYPOTHESES.map((x) => `<button class="hyp" data-h="${x.id}" aria-pressed="${this.hyp === x.id}"><strong>${x.short}</strong><small>${x.title}</small><span class="hyp-match" data-match="${x.id}"></span></button>`).join('')}</div>`);
    for (const btn of grid.querySelectorAll('[data-h]')) btn.addEventListener('click', () => { this.setHypothesis(btn.dataset.h); this.ui.showTab('case'); });
    b.append(grid);
    b.append(h('<div id="case-now"></div>'));
    const H = HYPOTHESES.find((x) => x.id === this.hyp);
    if (H) {
      const card = h(`<div class="card"><div class="eyebrow">Mecanismo</div><h3>${H.title}</h3><div class="prose">${H.what}
        <p><strong>Cómo encaja con crisis repetidas.</strong></p>${H.fits}
        <p><strong>Cómo se confirma o descarta.</strong></p>${H.confirm}
        <p><strong>Qué implica.</strong></p>${H.implies}</div>
        ${H.id === 'radicular' ? `<div class="row"><span class="hint">Material discal</span><div class="seg" id="hern-type"><button data-ht="protrusion" aria-pressed="${this.hernType === 'protrusion'}">Protrusión</button><button data-ht="extrusion" aria-pressed="${this.hernType === 'extrusion'}">Extrusión</button></div></div>` : ''}
        <div class="eyebrow">Ver en 3D</div><div class="seg">${H.demos.map((d) => `<button data-demo="${d}" aria-pressed="${this.demoKey === d}">${DEMO_INFO[d]?.title || d}</button>`).join('')}</div></div>`);
      for (const btn of card.querySelectorAll('[data-demo]')) btn.addEventListener('click', () => this.startDemo(btn.dataset.demo));
      for (const btn of card.querySelectorAll('[data-ht]')) btn.addEventListener('click', () => {
        this.hernType = btn.dataset.ht;
        const demo = this.demoKey;
        this.setHypothesis('radicular');
        if (demo) this.startDemo(demo);
        this.ui.showTab('case');
      });
      b.append(card);
    }
    // síntomas → hipótesis
    const sym = this.store.get('symptoms') || {};
    const sc = h(`<div class="card"><div class="eyebrow">Tus síntomas</div><div class="prose" style="font-size:13px"><p>Marca lo que te pasa. Cada marca señala qué mecanismos lo explican y por qué. No es un diagnóstico: sirve para preparar la consulta.</p></div>
      <div class="checks">${SYMPTOMS.map((s) => `<label><input type="checkbox" data-sym="${s.id}" ${sym[s.id] ? 'checked' : ''}> ${s.label}</label>`).join('')}</div><div id="sym-out" class="prose" style="font-size:13px"></div></div>`);
    for (const cb of sc.querySelectorAll('[data-sym]')) cb.addEventListener('change', () => { const cur = { ...(this.store.get('symptoms') || {}) }; cur[cb.dataset.sym] = cb.checked; this.store.set('symptoms', cur); this.updateSymptoms(); });
    b.append(sc);
    // exploración
    const ex = h(`<div class="card"><div class="eyebrow">El examen que lo aclara</div>
      <table class="mtab"><tr><th>Raíz</th><th>Fuerza</th><th>Reflejo</th><th>Piel</th></tr>${MYOTOMES.map((m) => `<tr><td><button class="chip" data-demo="${m.demo}">${m.root}</button></td><td>${m.strength}</td><td>${m.reflex}</td><td>${m.skin}</td></tr>`).join('')}</table>
      <div class="seg">${['slr', 'slrCross', 'slump', 'heels', 'toes', 'hipabd', 'kneeReflex'].map((d) => `<button data-demo="${d}" aria-pressed="${this.demoKey === d}">${DEMO_INFO[d].title}</button>`).join('')}</div>
      <div class="cite">Raíces y músculos según StatPearls (fuente secundaria). Heel walking evalúa L4–L5 y la marcha de puntillas, S1.</div></div>`);
    for (const btn of ex.querySelectorAll('[data-demo]')) btn.addEventListener('click', () => this.startDemo(btn.dataset.demo));
    b.append(ex);
    // preguntas para la consulta
    const qs = this.store.get('questions') || {};
    const q = h(`<div class="card"><div class="eyebrow">Lleva a tu consulta</div><div class="checks">${QUESTIONS.map((x, i) => `<label><input type="checkbox" data-q="${i}" ${qs[i] ? 'checked' : ''}> ${x}</label>`).join('')}</div>
      <div class="row"><button class="chip" id="q-dl">Descargar preguntas y registro</button></div></div>`);
    for (const cb of q.querySelectorAll('[data-q]')) cb.addEventListener('change', () => { const cur = { ...(this.store.get('questions') || {}) }; cur[cb.dataset.q] = cb.checked; this.store.set('questions', cur); });
    $('#q-dl', q).addEventListener('click', () => this.exportSummary());
    b.append(q);
    b.append(h(`<div class="callout">${RED_FLAGS}</div>`));
    this.updateSymptoms();
    this.renderNow();
  }

  sidePicker() {
    const el = h(`<div class="row"><span class="hint">Lado de tus síntomas</span><div class="seg" id="case-side"><button data-s="L" aria-pressed="${this.side === 'L'}">Izquierdo</button><button data-s="R" aria-pressed="${this.side === 'R'}">Derecho</button></div></div>`);
    for (const b of el.querySelectorAll('button')) b.addEventListener('click', () => {
      this.side = b.dataset.s; this._sideSet = true;
      if (this.demoKey) this.startDemo(this.demoKey);
      else if (this.hyp) this.setHypothesis(this.hyp);
      else if (this.whyScene) this.setRecurrence(this.recurN);
      this.ui.showTab('case');
    });
    return el;
  }

  updateSymptoms() {
    const out = $('#sym-out');
    const sym = this.store.get('symptoms') || {};
    const reasons = {};
    for (const s of SYMPTOMS) if (sym[s.id]) for (const [hid, why] of Object.entries(s.supports)) (reasons[hid] = reasons[hid] || []).push(why);
    for (const H of HYPOTHESES) {
      const m = document.querySelector(`[data-match="${H.id}"]`);
      if (m) m.textContent = reasons[H.id] ? `Coincide con ${reasons[H.id].length} de lo que marcaste` : '';
    }
    if (!out) return;
    const any = Object.keys(reasons).length;
    out.innerHTML = any ? HYPOTHESES.filter((H) => reasons[H.id]).map((H) => `<p><strong>${H.short}:</strong> ${reasons[H.id].map(esc).join('; ')}.</p>`).join('') : '';
  }

  // ------------------------------------------------------------------ Por qué vuelve
  renderWhy() {
    const b = this.body;
    b.append(h(`<div class="prose">${RECUR_INTRO}</div>`));
    b.append(this.sidePicker());
    const sl = h(`<div class="card"><div class="slider"><label for="recur-n">Después de la crisis número</label><output id="recur-out">${this.recurN}</output><input type="range" id="recur-n" min="1" max="5" step="1" value="${this.recurN}"><div class="ends"><span>1.ª</span><span>5.ª</span></div></div>
      <div class="row"><button class="chip" data-cam="discCut">Disco por dentro</button><button class="chip" data-cam="lumbarSide">Músculos y raíz</button><button class="chip" data-demo="slr">Probar la pierna recta ahora</button></div>
      <div class="prose" style="font-size:13px">${RECUR_ITEMS.map((x) => `<p><strong>${x.title}.</strong> ${x.text.replace(/^<p>|<\/p>$/g, '')}</p>`).join('')}</div></div>`);
    $('#recur-n', sl).addEventListener('input', (e) => { $('#recur-out').textContent = e.target.value; this.setRecurrence(+e.target.value); this.renderNow(); });
    for (const btn of sl.querySelectorAll('[data-cam]')) btn.addEventListener('click', () => { if (this.whyScene !== 'recur') this.setRecurrence(this.recurN); this.recurCam = btn.dataset.cam; this.app.view(btn.dataset.cam); });
    $('[data-demo]', sl).addEventListener('click', () => { if (this.whyScene !== 'recur') this.setRecurrence(this.recurN); this.startDemo('slr'); });
    b.append(sl);
    b.append(h('<div id="case-now"></div>'));
    // ciclo
    b.append(h(`<figure class="card cycle">${cycleSVG()}${cycleLegend()}<figcaption class="cite">Cada crisis deja la raíz y el disco más sensibles, la protección prolongada reduce la capacidad y una carga cada vez menor basta para la siguiente. Los números marcan dónde actúa cada indicación.</figcaption></figure>`));
    // desencadenantes
    const tr = h(`<div class="card"><div class="eyebrow">Qué gatilla una crisis</div><div class="prose" style="font-size:13px"><p>En 999 personas, el riesgo de empezar una crisis subió en las horas siguientes a estas situaciones (Steffens, Arthritis Care Res 2015). La mayoría empezó entre las 7:00 y el mediodía. El alcohol y el sexo no se asociaron.</p></div><div id="or-chart"></div>
      <div class="cite">Odds ratio de un estudio de casos cruzados: compara la hora previa a la crisis con otros momentos de la misma persona. Un ×8 no significa que esa postura sea peligrosa siempre, sino que las crisis tienden a empezar justo después.</div></div>`);
    b.append(tr);
    orChart($('#or-chart', tr), TRIGGERS_CHART, this.ui.tooltip);
    // hora del día
    const day = h(`<div class="card"><div class="eyebrow">Mañana y tarde</div><div class="prose" style="font-size:13px">${DAY_TEXT}</div>
      <div class="slider"><label for="hour">Hora del día</label><output id="hour-out">${this.hour}:00</output><input type="range" id="hour" min="6" max="23" step="0.5" value="${this.hour}"><div class="ends"><span>Al levantarse</span><span>Noche</span></div></div>
      <div class="row"><button class="chip" data-demo="bend">Inclinarse hacia delante</button><button class="chip" data-demo="socksFlex">Calcetines doblando la espalda</button><button class="chip" data-demo="socksHinge">Calcetines con el pie sobre la rodilla</button></div></div>`);
    $('#hour', day).addEventListener('input', (e) => { const v = +e.target.value; $('#hour-out').textContent = `${Math.floor(v)}:${v % 1 ? '30' : '00'}`; if (this.demoKey !== 'bend') this.startDemo('bend'); this.setDay(v); });
    for (const btn of day.querySelectorAll('[data-demo]')) btn.addEventListener('click', () => { this.whyScene = null; this.startDemo(btn.dataset.demo); });
    b.append(day);
    const sit = h(`<div class="card"><div class="eyebrow">Sentado</div><div class="prose" style="font-size:13px">${SITTING_TEXT}</div><div class="row"><button class="chip" data-demo="sitting">Ver: sentado mucho rato y la pausa</button></div></div>`);
    $('[data-demo]', sit).addEventListener('click', () => { this.whyScene = null; this.startDemo('sitting'); });
    b.append(sit);
    b.append(h(`<div class="cite">La progresión de una crisis a otra que ves en 3D es didáctica: cada elemento tiene respaldo, pero el ritmo con que avanza es una ilustración.</div>`));
    this.renderNow();
  }

  // ------------------------------------------------------------------ Indicaciones
  renderTodo() {
    const b = this.body;
    b.append(h(`<div class="prose"><p><strong>Ninguna indicación ha demostrado evitar las recaídas por completo.</strong> Lo que sí tiene evidencia es bajar su riesgo, acortar las crisis y, si hay una raíz comprimida, tratar la causa. Cada paso trae su fuente y, cuando aplica, una demostración en 3D.</p></div>`));
    for (const st of STEPS) {
      const d = h(`<details class="card step" ${st.n <= 2 ? 'open' : ''}><summary><span class="stepn">${st.n}</span> ${st.title}</summary><div class="prose" style="font-size:13.5px">${st.html}</div><div class="step-extra"></div>
        ${st.demos.length ? `<div class="seg">${st.demos.map((k) => `<button data-demo="${k}">${DEMO_INFO[k]?.title || (k === 'glide' ? 'Corrección del shift contra la pared' : k)}</button>`).join('')}</div>` : ''}</details>`);
      for (const btn of d.querySelectorAll('[data-demo]')) btn.addEventListener('click', () => { this.hyp = null; this.whyScene = null; this.startDemo(btn.dataset.demo); });
      const extra = $('.step-extra', d);
      if (st.id === 'exercise') {
        extra.append(h(`<div class="eyebrow">Riesgo de recaída frente a no hacerlo (menos de 1 = menos recaídas)</div>`));
        const fp = h('<div></div>'); extra.append(fp);
        forestPlot(fp, PREVENTION_CHART, this.ui.tooltip);
        extra.append(h(`<div class="eyebrow">En 100 personas durante un año</div>`));
        const ia = h('<div></div>'); extra.append(ia);
        iconArrays(ia, { label: 'Sin programa', n: 40 }, { label: 'Ejercicio + educación', n: 22 });
        extra.append(h(`<div class="cite">Ilustración aproximada que combina estudios distintos: 40 de cada 100 tuvieron una recaída limitante en un año en la cohorte de da Silva (2019); con un riesgo relativo de 0,55 serían unas 22.</div>`));
        extra.append(this.walkPlanner());
      }
      if (st.id === 'crisis') {
        extra.append(h(`<table class="mtab"><tr><th>Opción</th><th>Qué mostró</th></tr>${MEDS.map((m) => `<tr><td>${m.opt}</td><td>${m.res}</td></tr>`).join('')}</table>`));
      }
      b.append(d);
    }
    // plan de 12 semanas
    const plan = this.store.get('plan') || {};
    const pc = h(`<div class="card"><div class="eyebrow">Plan de 12 semanas (para acordar con tu equipo)</div>${PLAN_12.map((ph) => `<div class="plan-ph"><strong>${ph.phase}</strong><div class="checks">${ph.items.map(([id, l]) => `<label><input type="checkbox" data-plan="${id}" ${plan[id] ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>`).join('')}
      <div class="cite">Regla práctica para progresar (no validada específicamente): avanza si el dolor no baja a la pierna y a la mañana siguiente estás como siempre; si no, retrocede un paso.</div><div class="hint" id="store-status"></div></div>`);
    for (const cb of pc.querySelectorAll('[data-plan]')) cb.addEventListener('change', () => { const cur = { ...(this.store.get('plan') || {}) }; cur[cb.dataset.plan] = cb.checked; this.store.set('plan', cur); });
    b.append(pc);
    b.append(h(`<div class="callout">${RED_FLAGS}</div>`));
    b.append(h(`<div class="prose" style="font-size:13px">${LIMITS}</div>`));
    this.storeStatus();
    this.renderNow();
  }

  walkPlanner() {
    const w = this.store.get('walk') || { minutes: 10, days: 3 };
    const el = h(`<div class="card inner"><div class="eyebrow">Tu progresión de caminata</div>
      <div class="row"><label class="hint">Hoy camino sin molestias <input type="number" id="w-min" min="2" max="90" value="${w.minutes}" style="width:4.5em"> min,</label>
      <label class="hint"><input type="number" id="w-days" min="1" max="7" value="${w.days}" style="width:3.5em"> días por semana</label></div>
      <div id="w-out" class="prose" style="font-size:13px"></div>
      <div class="cite">La meta de WalkBack fue ≥30 min, 5 veces por semana, al sexto mes, con 6 sesiones de apoyo de un kinesiólogo. El ritmo de +10 % semanal es una regla práctica de progresión, no del ensayo.</div></div>`);
    const upd = () => {
      const m = Math.max(2, +$('#w-min', el).value || 10), d = Math.min(7, Math.max(1, +$('#w-days', el).value || 3));
      const now = m * d, goal = 150;
      const weeks = now >= goal ? 0 : Math.ceil(Math.log(goal / now) / Math.log(1.1));
      const rows = [];
      for (let wk = 0; wk <= Math.min(weeks, 26); wk += Math.max(1, Math.ceil(weeks / 6))) {
        const total = Math.min(goal, now * Math.pow(1.1, wk));
        const days = Math.min(5, Math.max(d, Math.round(total / 30) || d));
        rows.push(`<tr><td>Semana ${wk + 1}</td><td>${Math.round(total / days)} min × ${days} días</td></tr>`);
      }
      if (weeks && rows.length && !rows[rows.length - 1].includes('30 min × 5')) rows.push(`<tr><td>Semana ${weeks + 1}</td><td>30 min × 5 días</td></tr>`);
      $('#w-out', el).innerHTML = weeks ? `<p>Subiendo un 10 % por semana llegarías a 30 min × 5 días en unas <strong>${weeks} semanas</strong>${weeks > 26 ? ' (más de 6 meses: ajusta con tu kinesiólogo)' : ''}.</p><table class="mtab">${rows.join('')}</table>` : '<p>Ya cumples la meta de WalkBack. Mantenerla es lo que protege.</p>';
    };
    for (const id of ['#w-min', '#w-days']) $(id, el).addEventListener('change', () => { this.store.set('walk', { minutes: +$('#w-min', el).value, days: +$('#w-days', el).value }); upd(); });
    upd();
    return el;
  }

  // ------------------------------------------------------------------ Registro
  renderDiary() {
    const b = this.body;
    const now = new Date(); now.setSeconds(0, 0);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const form = h(`<form class="card diary" id="diary-form"><div class="eyebrow">Anotar una crisis</div>
      <label>Inicio <input type="datetime-local" name="start" value="${local}" required></label>
      <div class="row"><span class="hint">Hombros desplazados hacia</span><div class="seg" data-name="shift"><button type="button" data-v="L">Izquierda</button><button type="button" data-v="R">Derecha</button><button type="button" data-v="none" aria-pressed="true">Sin shift</button></div></div>
      <label>¿Hasta dónde bajó el dolor? <select name="leg">${Object.entries(LEG_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <div class="row"><span class="hint">Pierna</span><div class="seg" data-name="legSide"><button type="button" data-v="L">Izquierda</button><button type="button" data-v="R">Derecha</button><button type="button" data-v="both">Ambas</button></div></div>
      <div class="eyebrow">Qué pasó en las 24–48 h previas</div>
      <div class="checks two">${Object.entries(TRIGGER_LABELS).map(([k, v]) => `<label><input type="checkbox" name="trig" value="${k}"> ${v}</label>`).join('')}</div>
      <div class="row"><label>Intensidad máxima <input type="number" name="intensity" min="0" max="10" value="6" style="width:3.5em">/10</label><label>Duración <input type="number" name="days" min="0" max="120" placeholder="—" style="width:3.5em"> días</label></div>
      <label>Qué ayudó <input type="text" name="helped" maxlength="200" placeholder="caminar, corrección del shift, calor…"></label>
      <label>Notas <input type="text" name="notes" maxlength="300"></label>
      <div class="row"><button class="btn" type="submit">Guardar crisis</button><span class="hint" id="store-status"></span></div></form>`);
    const pick = {};
    for (const seg of form.querySelectorAll('.seg[data-name]')) for (const btn of seg.querySelectorAll('button')) btn.addEventListener('click', () => {
      pick[seg.dataset.name] = btn.dataset.v;
      for (const x of seg.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === btn));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const entry = {
        id: Date.now().toString(36), start: fd.get('start'), shift: pick.shift || 'none', leg: fd.get('leg'), legSide: pick.legSide || null,
        triggers: fd.getAll('trig'), intensity: Math.min(10, Math.max(0, +fd.get('intensity') || 0)), days: fd.get('days') ? +fd.get('days') : null,
        helped: String(fd.get('helped') || '').slice(0, 200), notes: String(fd.get('notes') || '').slice(0, 300),
      };
      if (!entry.start) return;
      const diary = [...(this.store.get('diary') || []), entry].sort((a, c) => new Date(c.start) - new Date(a.start));
      this.store.set('diary', diary);
      form.reset();
    });
    b.append(form);
    b.append(h(`<div class="card"><div class="eyebrow">Tus patrones</div><div id="diary-patterns"></div></div>`));
    b.append(h(`<div class="card"><div class="eyebrow">Crisis anotadas</div><div id="diary-list"></div>
      <div class="row"><button class="chip" id="d-csv">Descargar CSV</button><button class="chip" id="d-sum">Descargar resumen para la consulta</button></div></div>`));
    $('#d-csv').addEventListener('click', () => this.exportCSV());
    $('#d-sum').addEventListener('click', () => this.exportSummary());
    this.refreshPersonal();
  }

  refreshPersonal() {
    this.storeStatus();
    if (this.sub === 'what') this.updateSymptoms();
    if (this.sub !== 'diary') return;
    const diary = this.store.get('diary') || [];
    const list = $('#diary-list');
    if (list) {
      list.replaceChildren();
      if (!diary.length) list.append(h('<div class="hint">Todavía no hay crisis anotadas. Con 3 o 4 suelen aparecer patrones.</div>'));
      for (const e of diary.slice().sort((a, c) => new Date(c.start) - new Date(a.start))) {
        const d = new Date(e.start);
        const row = h(`<div class="drow"><div><strong></strong><div class="hint"></div></div><button class="chip" aria-label="Borrar">Borrar</button></div>`);
        $('strong', row).textContent = d.toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        $('.hint', row).textContent = [`intensidad ${e.intensity}/10`, e.days != null ? `${e.days} días` : null, e.shift !== 'none' ? `hombros a la ${e.shift === 'L' ? 'izquierda' : 'derecha'}` : 'sin shift', LEG_LABELS[e.leg] || '', e.triggers.map((t) => TRIGGER_LABELS[t]).join(', '), e.helped ? 'ayudó: ' + e.helped : null].filter(Boolean).join(' · ');
        $('button', row).addEventListener('click', () => {
          if (!confirm('¿Borrar esta crisis del registro?')) return;
          this.store.set('diary', diary.filter((x) => x.id !== e.id));
        });
        list.append(row);
      }
    }
    const pat = $('#diary-patterns');
    if (!pat) return;
    pat.replaceChildren();
    if (diary.length < 2) { pat.append(h('<div class="hint">Anota al menos 2 crisis para ver intervalos; con 3 o 4, patrones de horario y desencadenantes.</div>')); return; }
    const sorted = diary.slice().sort((a, c) => new Date(a.start) - new Date(c.start));
    const gaps = sorted.slice(1).map((e, i) => (new Date(e.start) - new Date(sorted[i].start)) / 86400000);
    const med = gaps.slice().sort((a, c) => a - c)[Math.floor(gaps.length / 2)];
    let trend = '';
    if (gaps.length >= 4) {
      const last = gaps.slice(-2).reduce((a, c) => a + c, 0) / 2, prev = gaps.slice(0, -2).reduce((a, c) => a + c, 0) / (gaps.length - 2);
      trend = last < prev * 0.75 ? 'Las últimas crisis están llegando <strong>más seguido</strong> que antes.' : last > prev * 1.33 ? 'Las últimas crisis están llegando <strong>más espaciadas</strong> que antes.' : 'El intervalo entre crisis se mantiene parecido.';
    }
    const legBelow = diary.filter((e) => ['calf', 'foot'].includes(e.leg)).length;
    const shiftL = diary.filter((e) => e.shift === 'L').length, shiftR = diary.filter((e) => e.shift === 'R').length;
    pat.append(h(`<div class="prose" style="font-size:13px"><p><strong>${diary.length} crisis</strong>; mediana de <strong>${Math.round(med)} días</strong> entre una y otra. ${trend}</p>
      <p>Dolor bajo la rodilla en ${legBelow} de ${diary.length}.${shiftL + shiftR ? ` Hombros a la izquierda ${shiftL} veces y a la derecha ${shiftR}.` : ''}</p></div>`));
    const tl = h('<div></div>'); pat.append(tl); timeline(tl, diary, this.ui.tooltip);
    const bins = [['Madrugada (0–6 h)', 0, 6], ['Primeras horas (6–10 h)', 6, 10], ['Mediodía (10–14 h)', 10, 14], ['Tarde (14–19 h)', 14, 19], ['Noche (19–24 h)', 19, 24]];
    const hours = diary.map((e) => new Date(e.start).getHours());
    pat.append(h('<div class="eyebrow">Hora de inicio</div>'));
    const hb = h('<div></div>'); pat.append(hb);
    barList(hb, bins.map(([label, a, c]) => ({ label, v: hours.filter((x) => x >= a && x < c).length })), this.ui.tooltip);
    const counts = Object.entries(TRIGGER_LABELS).map(([k, label]) => ({ label, v: diary.filter((e) => e.triggers.includes(k)).length })).filter((r) => r.v).sort((a, c) => c.v - a.v);
    if (counts.length) {
      pat.append(h('<div class="eyebrow">Qué precedió a las crisis</div>'));
      const tb = h('<div></div>'); pat.append(tb);
      barList(tb, counts, this.ui.tooltip);
    }
  }

  storeStatus() {
    const s = $('#store-status');
    if (!s) return;
    s.textContent = this.store.mode === 'db' ? (this.store.error ? 'No se pudo guardar: inténtalo de nuevo.' : 'Se guarda en tu espacio privado de este artifact (nadie más lo ve).') : 'Se guarda solo en este navegador: descarga una copia de vez en cuando.';
  }

  csv() {
    const rows = [['inicio', 'hombros_hacia', 'dolor_hasta', 'pierna', 'desencadenantes', 'intensidad', 'dias', 'que_ayudo', 'notas']];
    for (const e of this.store.get('diary') || []) rows.push([e.start, e.shift, e.leg, e.legSide || '', e.triggers.join('|'), e.intensity, e.days ?? '', e.helped, e.notes]);
    return rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  async exportCSV() { await this.store.download('registro-crisis.csv', '﻿' + this.csv(), 'text/csv'); }

  async exportSummary() {
    const diary = (this.store.get('diary') || []).slice().sort((a, c) => new Date(a.start) - new Date(c.start));
    const sym = this.store.get('symptoms') || {};
    const qs = this.store.get('questions') || {};
    const lines = ['# Resumen para la consulta', '', `Generado el ${new Date().toLocaleDateString('es')}.`, ''];
    const marked = SYMPTOMS.filter((s) => sym[s.id]).map((s) => '- ' + s.label);
    if (marked.length) lines.push('## Síntomas', ...marked, '');
    if (diary.length) {
      const gaps = diary.slice(1).map((e, i) => Math.round((new Date(e.start) - new Date(diary[i].start)) / 86400000));
      lines.push('## Crisis', `${diary.length} crisis registradas${gaps.length ? `; días entre crisis: ${gaps.join(', ')}` : ''}.`, '');
      for (const e of diary) lines.push(`- ${new Date(e.start).toLocaleString('es')}: intensidad ${e.intensity}/10${e.days != null ? `, ${e.days} días` : ''}; ${e.shift !== 'none' ? `hombros a la ${e.shift === 'L' ? 'izquierda' : 'derecha'}` : 'sin shift'}; dolor: ${LEG_LABELS[e.leg]}${e.legSide ? ` (${{ L: 'izquierda', R: 'derecha', both: 'ambas' }[e.legSide]})` : ''}; antes: ${e.triggers.map((t) => TRIGGER_LABELS[t]).join(', ') || '—'}${e.helped ? `; ayudó: ${e.helped}` : ''}${e.notes ? `; notas: ${e.notes}` : ''}`);
      lines.push('');
    }
    lines.push('## Preguntas', ...QUESTIONS.map((q, i) => `- [${qs[i] ? 'x' : ' '}] ${q}`), '');
    await this.store.download('resumen-consulta.md', lines.join('\n'), 'text/markdown');
  }

  // ------------------------------------------------------------------ tarjeta "Ahora en 3D" y lecturas en vivo
  renderNow() {
    const host = $('#case-now');
    if (!host) return;
    host.replaceChildren();
    const key = this.demoKey;
    const info = key ? DEMO_INFO[key] || (key === 'glide' ? { title: 'Corrección del shift contra la pared', text: '<p>Deslizamiento lateral de la pelvis bajo los hombros y luego extensión. Solo si el dolor se centraliza.</p>' } : key === 'bend' ? { title: 'Inclinarse hacia delante', text: '<p>Mueve la hora del día: por la mañana el disco hidratado soporta tensiones de flexión mucho mayores (color más intenso) y la flexión alcanza unos grados menos.</p>' } : null) : null;
    const title = info ? info.title : this.hyp ? HYPOTHESES.find((x) => x.id === this.hyp).title : this.whyScene === 'recur' ? `Tras la crisis n.º ${this.recurN}` : null;
    if (!title) return;
    const card = h(`<div class="card now"><div class="row" style="justify-content:space-between"><div class="eyebrow">Ahora en 3D</div>${key ? '<button class="chip" id="now-pause">Pausar</button>' : ''}</div><h3>${title}</h3>${info ? `<div class="prose" style="font-size:13px">${info.text}</div>` : ''}<dl class="kv" id="now-kv"></dl><div id="now-ctl" class="row"></div></div>`);
    host.append(card);
    const X = this.app.exercise;
    $('#now-pause', card)?.addEventListener('click', (e) => { X.togglePause(); e.target.textContent = X.paused ? 'Reanudar' : 'Pausar'; });
    if (key === 'slr' || key === 'slrCross') {
      const ctl = $('#now-ctl', card);
      const leg = X.ex?.leg;
      for (const [label, mod] of [['Subir la punta del pie', { ['ank' + leg]: 26 }], ['Flexionar el cuello', { neck: 40 }]]) {
        const btn = h(`<button class="chip" aria-pressed="false">${label}</button>`);
        btn.addEventListener('click', () => {
          const on = btn.getAttribute('aria-pressed') !== 'true';
          btn.setAttribute('aria-pressed', String(on));
          const mods = { ...X.mods };
          for (const [k, v] of Object.entries(mod)) { if (on) mods[k] = v; else delete mods[k]; }
          X.mods = mods; this.app.dirty = true;
        });
        ctl.append(btn);
      }
    }
    this.update();
  }

  refreshNow() { if (this.ui.tab === 'case') { this.renderNow(); for (const b of document.querySelectorAll('[data-demo]')) b.setAttribute('aria-pressed', String(b.dataset.demo === this.demoKey)); for (const b of document.querySelectorAll('[data-h]')) b.setAttribute('aria-pressed', String(b.dataset.h === this.hyp)); } }

  update() {
    const kv = $('#now-kv');
    if (!kv) return;
    const app = this.app, m = app.biomech.metrics, side = this.side, key = this.demoKey;
    const rows = [];
    const d = app.discs.byId['L4-L5'];
    const lumFlex = LUMBAR.reduce((a, id) => a + app.rig.segmentState[id].flex, 0);
    if (key === 'slr' || key === 'slrCross' || key === 'slump') {
      const S = this.slr;
      rows.push([key === 'slump' ? 'Extensión de la rodilla' : 'Elevación de la pierna', `${f1(S.angle || 0, 0)}°`]);
      rows.push([`Tensión sobre L5 ${side === 'L' ? 'izq.' : 'der.'}`, `${f1((S.load || 0) * 100, 1)} (umbral ${f1((S.th || 0) * 100, 1)})`]);
      rows.push(['Resultado', S.pos != null ? `<strong>reproduce el dolor desde ~${f1(S.pos, 0)}°</strong>` : (app.rootIrritation['L5' + side] || 0) > 0.3 ? 'aún no reproduce dolor' : 'raíz sana: solo tirantez']);
      const ham = app.muscles.find((x) => x.id === 'hamstrings' && x.side === (app.exercise.ex?.leg || side));
      if (ham) rows.push(['Estiramiento de isquiotibiales', `${sgn(ham.strands[0].strain * 100, 0)} %`]);
    } else if (key === 'listFlex' || key === 'listLying' || this.hyp === 'listhesis') {
      const slip = app.rig.slipNow['L4-L5'] || 0;
      rows.push(['Deslizamiento de L4 sobre L5', `${f1(slip, 1)} mm (${f1((slip / (d.D || 45)) * 100, 0)} % del platillo)`]);
      rows.push(['Canal central L4-L5 (hueso)', `${f1(m.canal?.['L4-L5'], 1)} mm (${sgn(app.biomech.canalChange('L4-L5') * 100)} %)`]);
      rows.push([`Foramen L4-L5 ${side === 'L' ? 'izq.' : 'der.'}`, `${f1(m.foramen['L4-L5' + side], 1)} mm (${sgn(app.biomech.foramenChange('L4-L5' + side) * 100)} %)`]);
      const cL = app.compression['L5L']?.idx || 0, cR = app.compression['L5R']?.idx || 0;
      rows.push(['Compresión de las raíces L5 (izq. / der.)', `${Math.round(cL * 100)} % / ${Math.round(cR * 100)} %`]);
      rows.push(['Nota', 'el canal se mide entre hueso y hueso; el índice de compresión suma el pliegue del ligamento amarillo en extensión']);
      rows.push(['Posición', app.rig.body.rx < -45 ? 'acostado (como en la resonancia)' : 'de pie']);
    } else if (key === 'bend' || key === 'socksFlex' || key === 'socksHinge' || key === 'sitting') {
      rows.push(['Flexión lumbar', `${f1(lumFlex, 0)}°`]);
      rows.push(['Núcleo de L4-L5', `${f1(Math.abs(d.state.nucleusShift.y), 1)} mm ${d.state.nucleusShift.y < 0 ? 'hacia atrás' : 'hacia delante'}`]);
      if (key === 'bend') {
        rows.push(['Hora', `${Math.floor(this.hour)}:${this.hour % 1 ? '30' : '00'}`]);
        rows.push(['Altura del disco L4-L5', `${f1(d.state.meanH, 1)} mm (${sgn(app.rig.discHydration['L4-L5'] || 0, 1)} por hidratación)`]);
        rows.push(['Tensión de flexión del disco frente a la tarde', `×${f1(1 + 3 * (this.morning || 0) - 3 * 0.2, 1)}`]);
      }
      if (key.startsWith('socks')) rows.push(['Momento', 'al levantarse (disco hidratado)']);
    } else if (key === 'facetExt' || this.hyp === 'facet') {
      rows.push(['Carga facetaria estimada', `${Math.round(this.facetLoad() * 100)} %`]);
    } else if (this.hyp === 'radicular') {
      const c = app.compression['L5' + side];
      rows.push(['Índice de compresión de L5', c ? `${Math.round(c.idx * 100)} %` : '—']);
      rows.push(['Empuje del núcleo hacia la hernia', f1(d.state.push, 2)]);
    } else if (this.hyp === 'discogenic' || this.whyScene === 'recur') {
      const dep = app.discs.ingrowth['L4-L5'] || 0;
      rows.push(['Fibras nerviosas en el disco', dep < 0.4 ? 'tercio externo (como en un disco sano)' : dep < 0.8 ? 'hasta el tercio interno' : 'hasta el núcleo']);
      if (this.whyScene === 'recur') {
        const k = (this.recurN - 1) / 4;
        rows.push(['Multífido L4-L5 del lado afectado', k ? `más pequeño (ilustrativo, −${Math.round(30 * k)} % de sección)` : 'sin cambios']);
        rows.push(['Umbral de la raíz L5', `${Math.round((1 - app.neural.threshold('L5', side) / 0.06) * 100)} % más bajo que sano`]);
      }
    } else if (key === 'heels' || key === 'toes' || key === 'hipabd' || key === 'kneeReflex' || key === 'walk') {
      const ids = { heels: ['tibAnt', 'ehl'], toes: ['gastroc', 'soleus'], hipabd: ['gmed'], kneeReflex: ['quadriceps'], walk: ['gmed', 'gmax', 'longLumb'] }[key];
      for (const id of ids) {
        const mu = app.muscles.find((x) => x.id === id && x.side === side);
        if (mu) rows.push([mu.name + (side === 'L' ? ' izq.' : ' der.'), `actividad ${Math.round((mu.strands[0].act || 0) * 100)} %`]);
      }
      const root = { heels: 'L4–L5', toes: 'S1', hipabd: 'L5', kneeReflex: 'L4', walk: '—' }[key];
      if (root !== '—') rows.push(['Raíz que se explora', root]);
    }
    kv.innerHTML = rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
  }
}

// Ciclo de las recaídas: el mecanismo en anillo; los números en color de acento marcan dónde actúa cada indicación
const CYCLE_FIXES = ['Plan de crisis: corta la inflamación temprano', 'Cirugía, solo si hay una raíz comprimida', 'Terapia cognitivo-funcional: soltar la defensa', 'Ejercicio y caminar: recuperar capacidad', 'Evitar tu gatillo mientras ganas margen'];
function cycleSVG() {
  const W = 380, H = 322, cx = 190, cy = 160, R = 118, nw = 116, nh = 40;
  const nodes = [
    ['Crisis', 'shift y dolor', -90, 32],
    ['Raíz y disco', 'inflamados, sensibles', -18, 20],
    ['Defensa, evitación', 'mal dormir', 54, 22],
    ['Menos capacidad', 'multífido, tolerancia', 126, 22],
    ['Umbral más bajo', 'fisura, nervios', 198, 20],
  ];
  const verbs = [['inflama', 'middle'], ['protege', 'middle'], ['desacondiciona', 'middle'], ['menos margen', 'middle'], ['basta menos carga', 'inner']];
  const P = (a, r = R) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ciclo de las recaídas: crisis, raíz y disco sensibles, defensa y evitación, menos capacidad, umbral más bajo, y vuelta a la crisis" style="width:100%;height:auto;color:var(--fg)">
    <defs><marker id="cyc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`;
  const mids = [];
  nodes.forEach((n, i) => {
    const nx = nodes[(i + 1) % nodes.length];
    let a0 = n[2] + n[3], a1 = nx[2] - nx[3];
    if (a1 < a0) a1 += 360;
    const [x0, y0] = P(a0), [x1, y1] = P(a1);
    s += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="1.6" marker-end="url(#cyc-arrow)" opacity="0.75"/>`;
    const am = (a0 + a1) / 2;
    mids.push(am);
    // la última etiqueta va por dentro del anillo: por fuera no cabe junto al borde izquierdo
    let [lx, ly] = verbs[i][1] === 'inner' ? P(am, R - 30) : P(am, R + 24);
    s += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.72" font-style="italic">${verbs[i][0]}</text>`;
  });
  nodes.forEach(([t1, t2, a]) => {
    const [x, y] = P(a);
    s += `<rect x="${(x - nw / 2).toFixed(1)}" y="${(y - nh / 2).toFixed(1)}" width="${nw}" height="${nh}" rx="8" fill="var(--raised)" stroke="currentColor" stroke-opacity="0.35"/>`;
    s += `<text x="${x.toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="currentColor">${t1}</text>`;
    s += `<text x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="currentColor" opacity="0.72">${t2}</text>`;
  });
  // marcas numeradas: sobre la flecha (1, 5) o en la esquina del recuadro (2, 3, 4)
  const badge = (x, y, n) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="var(--accent)"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--accent-ink)">${n}</text>`;
  const [b1x, b1y] = P(mids[0]);
  s += badge(b1x, b1y, 1);
  for (const [i, n] of [[1, 2], [2, 3], [3, 4]]) { const [x, y] = P(nodes[i][2]); s += badge(x + nw / 2 - 4, y - nh / 2 - 2, n); }
  const [b5x, b5y] = P(mids[4]);
  s += badge(b5x, b5y, 5);
  return s + '</svg>';
}

function cycleLegend() {
  return `<ol class="cycle-legend">${CYCLE_FIXES.map((t, i) => `<li><span class="stepn">${i + 1}</span>${t}</li>`).join('')}</ol>`;
}
