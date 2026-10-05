// Simulador de un episodio clínico: de la mala fuerza a la resolución.
// Combina la geometría del modelo (cargas, forámenes, migración del núcleo, tensión de raíces)
// con un modelo didáctico de inflamación, dolor y defensa muscular. Los valores de dolor son
// ilustrativos: sirven para entender mecanismos, no para predecir lo que sentirá una persona.
import * as THREE from 'three';
import { DEFAULT_STATE } from './posture.js';

export const STRUCTURES = {
  rootL5: { label: 'Disco L4-L5 → raíz L5 (hernia paracentral; lo más frecuente)', seg: 'L4-L5', zone: 'paracentral', root: 'L5', kind: 'radicular' },
  rootL4f: { label: 'Disco L4-L5 → raíz L4 (hernia foraminal)', seg: 'L4-L5', zone: 'foraminal', root: 'L4', kind: 'radicular' },
  rootL4p: { label: 'Disco L3-L4 → raíz L4 (hernia paracentral)', seg: 'L3-L4', zone: 'paracentral', root: 'L4', kind: 'radicular' },
  rootS1: { label: 'Disco L5-S1 → raíz S1 (hernia paracentral)', seg: 'L5-S1', zone: 'paracentral', root: 'S1', kind: 'radicular' },
  discL45: { label: 'Disco L4-L5 inflamado sin compresión radicular (dolor discogénico)', seg: 'L4-L5', zone: 'paracentral', root: null, kind: 'discogenic' },
  facetL45: { label: 'Articulación facetaria L4-L5 inflamada', seg: 'L4-L5', zone: 'paracentral', root: null, kind: 'facet' },
};

const N = { ...DEFAULT_STATE };

// Parámetros por etapa: tamaño de la hernia, inflamación, edema, sensibilización, defensa y shift
export const STAGES = [
  { id: 'basal', time: 'Antes del episodio', title: 'Un disco vulnerable', p: { size: 0, inflam: 0, edema: 0, sens: 0, guard: 0, shift: 0 } },
  { id: 'event', time: 'Instante 0', title: 'La mala fuerza', p: { size: 1, inflam: 0, edema: 0, sens: 0, guard: 0.2, shift: 0 } },
  { id: 'inflam', time: 'Minutos a horas', title: 'Inflamación química', p: { size: 1, inflam: 0.85, edema: 0.7, sens: 0.3, guard: 0.3, shift: 0 } },
  { id: 'pain', time: 'Horas a días', title: 'Cómo se genera y se propaga el dolor', p: { size: 1, inflam: 1, edema: 0.9, sens: 0.8, guard: 0.45, shift: 0 } },
  { id: 'shift', time: 'Horas a días', title: 'Defensa muscular y lateral shift', p: { size: 1, inflam: 1, edema: 0.9, sens: 0.85, guard: 1, shift: 0.85 } },
  { id: 'moves', time: 'Días', title: 'Qué pasa al moverte', p: { size: 1, inflam: 0.8, edema: 0.7, sens: 0.75, guard: 0.7, shift: 0.6 } },
  { id: 'resolve', time: 'Semanas a meses', title: 'Resolución', p: { size: 0.35, inflam: 0.15, edema: 0.1, sens: 0.2, guard: 0.1, shift: 0 } },
];

export class EpisodeController {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.cfg = { structure: 'rootL5', side: 'L', hern: 'protrusion', grade: 4, shiftDir: 'away' };
    this.stage = 0;
    this.p = { ...STAGES[0].p };
    this.target = { ...STAGES[0].p };
    this.t0 = 0;
    this.move = null; // prueba de movimiento activa en la etapa 5
    this.out = { radicular: 0, somatic: 0, extent: 0, score: 0, comp: 0, facetLoad: 0 };
  }

  get S() { return STRUCTURES[this.cfg.structure]; }

  start() {
    this.active = true;
    this.goto(this.stage);
  }

  stop() {
    const app = this.app;
    this.active = false;
    app.fx.clear();
    app.plumb.visible = false;
    app.layerFilter = null;
    app.discs.inflam = {};
    app.discs.stress = null;
    app.discs.setCutaway(null, app.bones);
    for (const it of app.items) if (it.strands) for (const s of it.strands) { s.signal = 0; s.edema = 0; s.guard = 0; }
    const P = app.skin?.pain;
    if (P) { P.uPainAL.value.set(0, 0, 0, 0); P.uPainBL.value.set(0, 0, 0, 0); P.uPainAR.value.set(0, 0, 0, 0); P.uPainBR.value.set(0, 0, 0, 0); }
    app.opacity.bones = 1;
    app.applyLayers();
    app.dirty = true;
  }

  // patología según la estructura elegida y el tamaño actual del material herniado
  pathology(size) {
    const S = this.S, c = this.cfg;
    const p = {};
    const hern = S.kind === 'radicular' ? (size > 0.02 ? c.hern : 'fissure') : S.kind === 'discogenic' ? 'fissure' : 'none';
    p[S.seg] = { grade: c.grade, hern, zone: S.zone, side: c.side, size: Math.max(0.02, size) };
    return p;
  }

  goto(i) {
    const app = this.app;
    this.stage = Math.max(0, Math.min(STAGES.length - 1, i));
    const st = STAGES[this.stage];
    this.target = { ...st.p };
    if (this.S.kind !== 'radicular') { this.target.edema *= 0.2; }
    this.from = { ...this.p };
    this.t0 = performance.now();
    this.move = null;
    const S = this.S, c = this.cfg;
    // capas y vista por etapa
    const L = app.layerState;
    const setL = (o) => { Object.assign(L, o); };
    app.discs.stress = null;
    app.discs.setCutaway(null, app.bones);
    app.layerFilter = null;
    setL({ skin: false, fascia: false, arms: false, legs: true });
    if (st.id === 'basal') {
      app.setDissection(0); setL({ ligaments: false, neural: true, peripheral: false, dura: false, pelvis: true });
      app.opacity.bones = 1;
      app.discs.setCutaway(S.seg, app.bones);
      // sólo la raíz relacionada, para que no tape el corte
      app.layerFilter = (it) => it.kind !== 'nerve' || it.id === 'cord' || (S.root ? it.root === S.root && it.side === c.side : false);
    } else if (st.id === 'event') {
      app.setDissection(0); setL({ ligaments: false, neural: true, peripheral: false, dura: false, pelvis: true });
      app.opacity.bones = 1;
    } else if (st.id === 'inflam') {
      app.setDissection(0); setL({ ligaments: false, neural: true, peripheral: false, dura: true, pelvis: false });
      app.opacity.bones = 0.45;
    } else if (st.id === 'pain') {
      app.setDissection(0); setL({ ligaments: false, neural: true, peripheral: true, dura: false, pelvis: true, skin: true });
      app.opacity.bones = 0.6;
    } else if (st.id === 'shift' || st.id === 'moves') {
      app.setDissection(3); setL({ ligaments: false, neural: true, peripheral: true, dura: false, pelvis: true, skin: true });
      app.opacity.bones = 1;
    } else {
      app.setDissection(0); setL({ ligaments: false, neural: true, peripheral: false, dura: true, pelvis: false });
      app.opacity.bones = 0.6;
    }
    app.applyLayers();
    app.ui.syncLayerChecks?.();
    // postura de la etapa
    app.animator.stop();
    if (st.id === 'event') {
      app.posture.set({ ...N });
      app.ui.setColor('pressure');
      app.animator.play([
        { t: 1.2, state: { ...N, flex: 0.35 } },
        { t: 1.9, state: { ...N, flex: 0.82, rot: 0.5 * (c.side === 'L' ? -1 : 1), loadKg: 20 } },
        { t: 3.2, state: { ...N, flex: 0.82, rot: 0.5 * (c.side === 'L' ? -1 : 1), loadKg: 20 } },
        { t: 4.6, state: { ...N, flex: 0.2, loadKg: 0 } },
      ]);
    } else {
      app.ui.setColor(st.id === 'shift' ? 'activity' : 'anat');
      const dir = this.shiftSign();
      if (st.id === 'shift') app.animator.play([{ t: 2.6, state: { ...N, shift: 0.85 * dir, shiftKyphosis: 0.6 } }]);
      else if (st.id === 'moves') app.animator.play([{ t: 1.2, state: { ...N, shift: 0.6 * dir, shiftKyphosis: 0.5 } }]);
      else app.animator.play([{ t: 1, state: { ...N } }]);
    }
    // vista
    const views = { basal: 'discCut', event: 'lateralAff', inflam: 'rootObl', pain: 'painLeg', shift: 'shiftPost', moves: 'painLeg', resolve: 'rootObl' };
    app.plumb.visible = st.id === 'shift' || st.id === 'moves';
    app.episodeSeg = S.seg;
    app.view(views[st.id]);
    app.dirty = true;
  }

  // dirección del shift en la convención de McKenzie (+ = hombros a la derecha)
  shiftSign() {
    const away = this.cfg.shiftDir === 'away';
    // alejarse de una lesión izquierda = hombros hacia la derecha
    const s = this.cfg.side === 'L' ? 1 : -1;
    return away ? s : -s;
  }

  testMove(kind) {
    const app = this.app;
    const dir = this.shiftSign();
    this.move = kind;
    const base = { ...N, shift: 0.6 * dir, shiftKyphosis: 0.5 };
    const k = {
      flex: [{ t: 2, state: { ...base, flex: 0.7, shift: 0.3 * dir } }],
      ext: [{ t: 2, state: { ...base, flex: -0.7, shift: 0.3 * dir } }],
      glide: [{ t: 2.4, state: { ...N, shift: -0.15 * dir, shiftKyphosis: 0.2 } }],
      sit: [{ t: 2, state: { ...base, sit: 1, slump: 0.8, shift: 0.3 * dir } }],
      neutral: [{ t: 1.4, state: base }],
    }[kind];
    app.animator.play(k);
    const lateral = kind === 'flex' || kind === 'ext' || kind === 'sit';
    app.plumb.visible = !lateral;
    app.view(lateral ? 'lateralAff' : 'painLeg');
  }

  // se llama en cada paso de simulación (después de calcular compresiones)
  frame() {
    if (!this.active) return;
    const app = this.app;
    const u = Math.min(1, (performance.now() - this.t0) / 1800);
    const e = u * u * (3 - 2 * u);
    for (const k of Object.keys(this.target)) this.p[k] = this.from[k] + (this.target[k] - this.from[k]) * e;
    const P = this.p, S = this.S, c = this.cfg;
    const st = STAGES[this.stage];
    // tamaño de la hernia: en la etapa del evento crece durante el esfuerzo
    let size = P.size;
    if (st.id === 'event') {
      const tt = (performance.now() - this.t0) / 1000;
      size = THREE.MathUtils.smoothstep(tt, 1.9, 3.1);
    }
    const key = JSON.stringify(this.pathology(size));
    if (key !== this._pkey) { this._pkey = key; app.setPathology(this.pathology(size)); }
    const d = app.discs.byId[S.seg];
    app.discs.inflam = { [S.seg]: P.inflam };
    // punto de tensión en el anillo durante la mala fuerza
    if (st.id === 'event') {
      const m = app.biomech.metrics;
      const amount = THREE.MathUtils.clamp((m.comp - 1500) / 2500, 0, 1);
      app.discs.stress = { seg: S.seg, angle: app.discs.hAngle(d), amount };
    } else app.discs.stress = null;
    // compresión radicular (índice geométrico del modelo)
    const rootKey = S.root ? S.root + c.side : null;
    const comp = rootKey && app.compression[rootKey] ? app.compression[rootKey].idx : 0;
    // carga facetaria: extensión + inclinación y rotación hacia el lado de la faceta
    const ps = app.posture.state;
    const sideSgn = c.side === 'L' ? -1 : 1; // inclinación/rotación hacia la izquierda es negativa
    const facetLoad = THREE.MathUtils.clamp(Math.max(0, -ps.flex) * 0.8 + Math.max(0, ps.lat * sideSgn) * 0.5 + Math.max(0, ps.rot * sideSgn) * 0.3 + 0.15, 0, 1);
    // dolor radicular: compresión × inflamación × sensibilización
    let rad = 0, som = 0;
    if (S.kind === 'radicular') {
      rad = THREE.MathUtils.clamp((0.55 * comp + 0.5 * P.inflam * (0.4 + comp)) * (0.55 + 0.45 * P.sens), 0, 1);
      som = THREE.MathUtils.clamp(0.25 * P.inflam + 0.25 * Math.max(0, d.state.push) * P.inflam, 0, 0.8);
    } else if (S.kind === 'discogenic') {
      const press = THREE.MathUtils.clamp((app.biomech.metrics.mpa - 0.3) / 1.2, 0, 1);
      som = THREE.MathUtils.clamp(P.inflam * (0.35 + 0.65 * press) * (0.6 + 0.4 * P.sens), 0, 1);
    } else {
      som = THREE.MathUtils.clamp(P.inflam * (0.25 + 0.75 * facetLoad) * (0.6 + 0.4 * P.sens), 0, 1);
    }
    const extent = rad > 0.02 ? THREE.MathUtils.clamp(0.42 + 0.62 * rad, 0.42, 1) : 0;
    const fk = S.seg + c.side;
    const forCh = app.biomech.foramenPairs[fk] ? app.biomech.foramenChange(fk) : 0;
    this.out = { radicular: rad, somatic: som, extent, comp, facetLoad, forCh, push: d.state.push, score: Math.round(10 * Math.max(rad, som * 0.85)) };
    // referencia para comparar las pruebas de movimiento: la postura de la etapa ya asentada
    if (!this.move && !app.animator.playing && performance.now() - this.t0 > 2000) this.baseOut = { ...this.out };
    // mapa de dolor en la piel
    const Pn = app.skin?.pain;
    if (Pn) {
      const A = new THREE.Vector4(), B = new THREE.Vector4();
      const idx = { L4: 2, L5: 3 }[S.root];
      if (idx !== undefined) A.setComponent(idx, rad);
      if (S.root === 'S1') B.x = rad;
      B.z = som; B.w = extent;
      const Z = new THREE.Vector4(0, 0, 0, 0);
      if (c.side === 'L') { Pn.uPainAL.value.copy(A); Pn.uPainBL.value.copy(B); Pn.uPainAR.value.copy(Z); Pn.uPainBR.value.set(0, 0, som * 0.25, 0); }
      else { Pn.uPainAR.value.copy(A); Pn.uPainBR.value.copy(B); Pn.uPainAL.value.copy(Z); Pn.uPainBL.value.set(0, 0, som * 0.25, 0); }
    }
    // señales, edema y defensa en las fibras
    for (const n of app.nerves) for (const s of n.strands) { s.signal = 0; s.edema = 0; }
    const rootItem = S.root ? app.nerves.find((n) => n.root === S.root && n.side === c.side) : null;
    if (rootItem) for (const s of rootItem.strands) { s.signal = rad; s.edema = P.edema; }
    const cord = app.nerves.find((n) => n.id === 'cord');
    if (cord) cord.strands[0].signal = Math.max(rad, som) * 0.8;
    if (S.kind === 'facet' || S.kind === 'discogenic') {
      const mb = app.nerves.find((n) => n.id === 'medialBranch' + c.side);
      if (mb && S.kind === 'facet') for (const s of mb.strands) s.signal = som;
    }
    const concave = this.shiftSign() > 0 ? 'R' : 'L'; // con hombros a la derecha, el lado derecho lumbar bajo queda cóncavo
    for (const mu of app.muscles) {
      const g = ['multifidus', 'longLumb', 'iliocLumb', 'ql', 'longThor', 'iliocThor'].includes(mu.id) ? P.guard * (mu.side === concave ? 1 : 0.45) : 0;
      for (const s of mu.strands) { s.guard = g; s.act = Math.max(s.act, g * 0.85); }
    }
    // nube inflamatoria
    const fx = app.fx;
    if (P.inflam > 0.02) {
      if (S.kind === 'facet') {
        const f = app.resolver.resolve(`L5.facetInf${c.side}`);
        const w = f.local.clone().applyMatrix4(app.rig.bones[f.bone].matrixWorld);
        fx.set('a', { center: w, radius: 7, intensity: P.inflam, size: 8 });
        fx.set('b', { center: w, radius: 0, intensity: 0 });
      } else {
        const center = d.state.herniaR > 0 ? d.state.herniaCenter : d.state.fissureWorld;
        fx.set('a', { center, radius: S.kind === 'radicular' ? 7 : 5, intensity: P.inflam, size: 8 });
        if (rootItem) {
          // a lo largo de la raíz, cerca del foramen
          const a = rootItem.strands[0].anchors;
          const near = a.reduce((best, x) => { const p = x.cur || x.rest; return p.distanceTo(center) < best.d ? { p, d: p.distanceTo(center) } : best; }, { p: center, d: 1e9 }).p;
          fx.set('b', { center: near.clone().lerp(center, 0.3), radius: 5, intensity: P.inflam * 0.8, spread: 10, axis: new THREE.Vector3(0, 1, 0), size: 7 });
        } else fx.set('b', { center, radius: 0, intensity: 0 });
      }
    } else fx.clear();
  }
}

// ---------------------------------------------------------------------------------------------
// Textos académicos por etapa. Las citas están verificadas al nivel de resumen.
export function stageText(stageId, S, cfg, out) {
  const side = cfg.side === 'L' ? 'izquierda' : 'derecha';
  const root = S.root;
  const rad = S.kind === 'radicular';
  const T = {
    basal: `<p>Partimos de un disco <strong>${S.seg}</strong> con degeneración grado ${cfg.grade} de Pfirrmann. Corté un cuadrante del disco y de sus vértebras para que veas el interior: las <strong>láminas del anillo fibroso</strong> (con fibras que alternan su inclinación), el <strong>núcleo pulposo</strong> y los <strong>platillos cartilaginosos</strong> que lo separan del hueso.</p>
<p>Con la degeneración el núcleo pierde agua y proteoglicanos, la presión deja de repartirse de forma uniforme y aparecen <strong>fisuras</strong>, que suelen empezar en las láminas internas y avanzar hacia fuera. Una fisura radial ya está dibujada aquí, todavía contenida por las láminas externas.</p>
<p>Clave para entender el dolor: en un disco sano solo el <strong>tercio externo del anillo</strong> (unos 3 mm) tiene terminaciones nerviosas, ramas del nervio sinuvertebral y de los ramos comunicantes grises (Yoshizawa et al., J Pathol 1980; Bogduk et al., J Anat 1981). En discos de pacientes operados por dolor lumbar crónico se encontraron fibras nerviosas hasta el <strong>tercio interno del anillo en el 46 %</strong> de las muestras y hasta el <strong>núcleo en el 22 %</strong>, y en ninguna de las muestras de control (Freemont et al., Lancet 1997).</p>`,
    event: `<p>Simulo levantar <strong>20 kg con la columna flexionada y girada</strong> hacia el lado contrario a la lesión. En el panel, la compresión estimada en L4-L5 supera el <strong>límite de acción de 3400 N</strong> de la guía NIOSH de 1981, que la ecuación revisada de NIOSH mantiene como criterio biomecánico (Waters et al., Ergonomics 1993). La combinación de flexión y rotación concentra la tensión en el <strong>anillo posterolateral</strong>, marcada con un destello naranja.</p>
<p>Qué dice la investigación sobre el mecanismo (todo en especímenes, no en personas vivas):</p>
<ul><li>De 61 segmentos de cadáver comprimidos en <strong>hiperflexión</strong>, 26 (43 %) fallaron con un prolapso posterior del núcleo. Los más vulnerables fueron discos lumbares bajos, algo degenerados, de personas de 40 a 50 años (Adams y Hutton, Spine 1982).</li>
<li>La <strong>flexión–extensión repetida</strong> (hasta 86 400 ciclos) con compresión moderada produjo hernias progresivas en columnas porcinas: el núcleo avanza por fisuras de dentro hacia fuera (Callaghan y McGill, Clin Biomech 2001).</li>
<li>La <strong>rotación sola</strong> no inició ninguna hernia. Sumada a la flexión repetida, deslaminó el anillo en el 67,5 % de los especímenes (Marshall y McGill, Clin Biomech 2010). Con flexión más una rotación pequeña bastó menos presión en el núcleo para abrir fisuras radiales (Veres et al., Eur Spine J 2010).</li>
<li>Con <strong>compresión pura</strong>, lo primero que suele fallar es el <strong>platillo vertebral</strong> (microfractura), no el anillo. La resistencia a compresión de un segmento lumbar es muy variable: media 6,1 kN en hombres y 4,0 kN en mujeres, y baja con la edad (Jäger, EXCLI J 2018).</li>
<li>La <strong>cizalla</strong> también cuenta: los límites propuestos son 1000 N ocasional y 700 N repetida (Gallagher y Marras, Clin Biomech 2012).</li></ul>
<p>En el modelo, el núcleo empujado hacia atrás atraviesa la fisura y aparece una ${cfg.hern === 'extrusion' ? 'extrusión' : cfg.hern === 'sequestration' ? 'hernia secuestrada' : 'protrusión'}${rad ? ` cerca de la raíz ${root} ${side}` : ''}. En la vida real casi nunca es un único gesto: suele ser la última gota sobre un disco ya fisurado.</p>`,
    inflam: rad ? `<p>Ahora la raíz <strong>${root} ${side}</strong> se hincha (edema) y la rodea una nube que representa <strong>mediadores inflamatorios</strong>. El núcleo pulposo está aislado del sistema inmune desde el desarrollo; cuando sale al espacio epidural actúa como un tejido extraño.</p>
<ul><li>Aplicar núcleo pulposo sobre raíces nerviosas, <strong>sin comprimirlas</strong>, produjo cambios estructurales y de conducción en cerdos (Olmarker et al., Spine 1993): la química importa tanto como la presión.</li>
<li>En el tejido herniado se midieron niveles muy altos de <strong>fosfolipasa A2</strong> (Saal et al., Spine 1990), y el <strong>TNF-α</strong> reproduce buena parte del daño (Olmarker y Larsson, Spine 1998). También participan IL-1β, IL-6 y factor de crecimiento nervioso.</li>
<li>El edema y la congestión venosa dentro de la raíz empeoran su nutrición y la vuelven más sensible a la tensión y a la presión.</li></ul>
<p>El borde de la fisura se tiñe de rojo: representa tejido de granulación con vasos y fibras nerviosas nuevas.</p>`
      : S.kind === 'discogenic'
        ? `<p>La fisura del anillo se inflama: aparecen <strong>tejido de granulación, vasos y fibras nerviosas</strong> que crecen hacia el interior del disco (Freemont et al., Lancet 1997). Los mediadores inflamatorios sensibilizan esas terminaciones, de modo que cargas que antes eran indoloras (estar sentado, inclinarse) pasan a doler. No hay raíz comprimida.</p>`
        : `<p>La <strong>articulación facetaria ${S.seg} ${side}</strong> es sinovial: tiene cápsula, cartílago y membrana sinovial inervados por los <strong>ramos mediales</strong>. Con la pérdida de altura del disco carga más; una sinovitis o una distensión capsular producen dolor somático local y referido.</p>`,
    pain: rad ? `<p>Sigue el recorrido del dolor (pulsos amarillos): nace en la raíz <strong>${root}</strong> y su ganglio, entra en la médula por el asta dorsal y asciende hacia el cerebro.</p>
<ul><li><strong>Dolor radicular</strong>: lo producen <strong>descargas ectópicas</strong> en una raíz o ganglio inflamados. Comprimir una raíz sana produce una descarga breve y luego silencio; la raíz crónicamente irritada o el ganglio, en cambio, descargan de forma sostenida (Howe, Loeser y Calvin, Pain 1977). En pacientes operados a los que se dejó un hilo alrededor de la raíz, tirar del hilo de la raíz afectada reproducía la ciática; tirar del de una raíz sana dolía mucho menos (Smyth y Wright, J Bone Joint Surg 1958). Se siente como un latigazo o corriente en una <strong>banda estrecha</strong> que suele pasar bajo la rodilla. En la piel lo verás como una franja roja con pulsos, siguiendo el dermatoma de ${root}.</li>
<li><strong>Dolor somático referido</strong>: viene del disco, las facetas o los músculos. Es profundo, sordo, difuso, mal localizado y suele quedarse por encima de la rodilla (zona naranja en la zona lumbar, la nalga y el muslo). Ojo: “bajo la rodilla = radicular” es una regla práctica, no un criterio; el dolor somático referido también puede bajar.</li>
<li><strong>Radiculopatía</strong> no es lo mismo que dolor: es pérdida de función por bloqueo de la conducción (adormecimiento, debilidad, reflejo disminuido). Puede existir con o sin dolor (Bogduk, Pain 2009).</li></ul>
<p>Con el dolor persistente, las neuronas del asta dorsal pueden <strong>sensibilizarse</strong> y amplificar la señal (sensibilización central): por eso el dolor no siempre es proporcional al tamaño de la hernia.</p>`
      : `<p>El dolor de esta lesión es <strong>somático referido</strong>: llega a la médula por las mismas neuronas que reciben la información de la zona lumbar, la nalga y el muslo, y el cerebro no puede distinguir el origen exacto. Por eso es profundo, sordo, difuso y suele quedarse por encima de la rodilla. No sigue un dermatoma y no hay pérdida de fuerza ni de reflejos (Bogduk, Pain 2009).</p>`,
    shift: `<p>El tronco se desplaza ${cfg.shiftDir === 'away' ? 'alejándose del lado lesionado' : 'hacia el lado lesionado'} y los músculos profundos (multífido, erectores y cuadrado lumbar) entran en <strong>defensa</strong> (brillo rojo pulsante, más intenso en el lado cóncavo).</p>
<p><strong>Lo observado</strong>: en series quirúrgicas la hernia estaba en el lado <strong>convexo</strong> (el tronco se alejaba de ella) en el 80 % (Matsui et al., Spine 1998; n = 40) y en el 67 % (Suk et al., Spine 2001; n = 45), y la mayoría de los shifts desapareció al descomprimir la raíz. La regla “hernia lateral a la raíz → te alejas; axilar → te acercas” <strong>no se confirmó</strong>.</p>
<p><strong>Corregirlo no es lo mismo que mejorar</strong>: en el único ensayo aleatorizado (n = 40), la técnica de McKenzie corrigió el shift mejor que el tratamiento control a los 90 días, pero la discapacidad (Oswestry) no mejoró más (Gillan et al., Eur Spine J 1998). La evidencia es de muy baja calidad.</p>
<p><strong>Hipótesis</strong> (ninguna demostrada): (1) postura antiálgica que abre el foramen y el receso del lado afectado y reduce la presión o tensión sobre la raíz; (2) material discal desplazado de forma asimétrica que bloquea mecánicamente el retorno a la línea media; (3) espasmo protector asimétrico.</p>
${rad && out ? `<p class="cite">En el modelo ahora: foramen ${S.seg} del lado afectado ${out.forCh > 0 ? '+' : ''}${Math.round(out.forCh * 100)} % respecto de la postura sana, empuje del núcleo hacia la hernia ${out.push.toFixed(2).replace('.', ',')}, índice de compresión de ${root} ${Math.round(out.comp * 100)} %. La inclinación abre el foramen del lado convexo, pero la pérdida de lordosis que acompaña al shift empuja el núcleo hacia atrás. El modelo <strong>no</strong> reproduce un beneficio antiálgico claro del shift: no contiene el mecanismo que lo explicaría, coherente con que ese mecanismo siga sin demostrarse.</p>` : ''}`,
    moves: `<p>Prueba los movimientos de abajo y observa el mapa de dolor:</p>
<ul><li>Si el dolor se <strong>extiende hacia la pierna</strong> (periferialización), el movimiento está aumentando la irritación de la raíz.</li>
<li>Si el dolor <strong>se retira hacia la zona lumbar</strong> (centralización), suele ser buena señal. En una revisión de 62 estudios se observó en el 44 % de los pacientes (74 % en dolor agudo, 42 % en subagudo o crónico) y 21 de 23 estudios la asociaron a mejor pronóstico (May y Aina, Man Ther 2012).</li></ul>
<p>En el modelo, con una hernia posterior, la <strong>flexión</strong> y el <strong>sentado encorvado</strong> empujan el núcleo hacia la hernia y tensan la raíz (más dolor y más distal). La <strong>extensión</strong> y la <strong>corrección del shift</strong> lo alejan y tienden a centralizar, aunque la extensión cierra el foramen. Ojo: este resultado sale de las reglas del modelo (migración del núcleo medida en cadáver), así que no es una prueba independiente. En la clínica la respuesta varía: en la revisión de May y Aina hubo una preferencia direccional en el 70 % de los pacientes, y no siempre es la extensión. En una estenosis foraminal o una faceta irritada la extensión puede empeorar.</p>
<p class="cite">Indicador ilustrativo: dolor ${out ? out.score : '—'}/10 · extensión distal ${out && out.extent ? Math.round(out.extent * 100) + ' %' : '—'}.</p>`,
    resolve: `<p>En semanas o meses la inflamación cede y, en muchos casos, el material herniado <strong>se reabsorbe</strong>: los macrófagos lo digieren y aparecen vasos nuevos alrededor. Las hernias más grandes y expuestas se reabsorben más: se observa regresión en el 96 % de los secuestros, 70 % de las extrusiones, 41 % de las protrusiones y 13 % de los abombamientos (Chiu et al., Clin Rehabil 2015).</p>
<p>El shift suele corregirse cuando la raíz se desinflama. El disco degenerado sigue ahí: la imagen puede mejorar menos que los síntomas, y eso es esperable. Mantenerse activo dentro de lo tolerable y el ejercicio progresivo forman parte del tratamiento habitual (ver la pestaña <strong>Ejercicios</strong>).</p>
<div class="callout">Consulta de urgencia si aparece adormecimiento en la zona genital o “en silla de montar”, dificultad para orinar o controlar esfínteres, ciática en ambas piernas o debilidad que progresa.</div>`,
  };
  return T[stageId];
}
