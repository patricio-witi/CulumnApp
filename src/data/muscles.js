// Catálogo de músculos (lado izquierdo; el derecho se genera por simetría).
// Cada fascículo se define con puntos de anclaje sobre landmarks óseos reales.
// Capas: 2 profunda, 3 erectores/QL/psoas, 4 intermedia, 5 superficial, 6 pared abdominal, 7 cadera.

const LUMBAR = ['L1', 'L2', 'L3', 'L4', 'L5'];
const THOR = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const SPINE = [...['C2', 'C3', 'C4', 'C5', 'C6', 'C7'], ...THOR, ...LUMBAR];
const below = (v, n = 1) => SPINE[SPINE.indexOf(v) + n];
const A = (at, offset) => (offset ? { at, offset } : at);
const W = (at, offset) => ({ at, offset, space: 'world' });
const V = (a, b, t, bone, offset) => ({ via: [a, b, t], bone, offset });

const RED = 0x9e3029, RED2 = 0x8f2b25, RED3 = 0xa83b31, DEEP = 0x842822;

function multifidus() {
  const fas = [];
  const targets = {
    L1: [A('L3.mammL', [0, 0, -2]), A('L4.mammL', [0, 0, -2]), A('L5.mammL', [0, 2, -2])],
    L2: [A('L4.mammL', [-1, 0, -4]), A('L5.mammL', [-1, 0, -4]), A('sacrum.dorsalLat1L', [0, 4, -6])],
    L3: [A('L5.mammL', [-2, -3, -6]), A('sacrum.dorsalLat1L', [-2, -4, -8]), A('sacrum.dorsalLat2L', [2, 4, -8])],
    L4: [A('sacrum.dorsalLat1L', [-5, -8, -10]), A('sacrum.dorsalLat2L', [0, 0, -10]), A('pelvis.PSISL', [-4, 6, 6])],
    L5: [A('sacrum.dorsalLat2L', [-6, -6, -12]), A('sacrum.dorsalLat3L', [-2, 2, -10]), A('pelvis.PSISL', [-6, -8, 10])],
  };
  for (const v of LUMBAR) {
    targets[v].forEach((ins, i) => {
      const org = A(v + '.spBot', [3.2 + i * 0.6, 1 + i * 1.5, 2 - i * 2]);
      const nxt = below(v) || null;
      const pts = [org];
      if (nxt && i < 2) pts.push(V(org, ins, 0.45, nxt, [2 + i, 0, -3 - i * 1.5]));
      else pts.push(V(org, ins, 0.45, null, [2 + i, 0, -3 - i * 1.5]));
      pts.push(ins);
      fas.push({ pts, r: [[3.6, 4.2], [5.2 + i * 0.4, 5.6], [3.2, 3.6]], tendon: [0.12, 0.1], up: [0, 0, -1], belly: 1.1 });
    });
  }
  // multífido torácico y cervical (más delgado)
  for (let k = 3; k <= 12; k++) {
    const org = A(`T${k}.tpMidL`, [-2, 2, -5]);
    const up2 = SPINE[SPINE.indexOf('T' + k) - 3];
    if (!up2) continue;
    fas.push({ pts: [org, V(org, A(up2 + '.spBase', [3, -3, -4]), 0.5, SPINE[SPINE.indexOf('T' + k) - 1], [1, 0, -3]), A(up2 + '.spBase', [3, -3, -4])], r: [2.4, 2.8], tendon: [0.15, 0.15], up: [0, 0, -1] });
  }
  for (const [o, i] of [['C7', 'C4'], ['C6', 'C3'], ['C5', 'C2'], ['C4', 'C2']]) {
    const org = A(o + '.pillarL', [0, 0, -5]);
    fas.push({ pts: [org, A(i + '.spBase', [3, -2, -5])], r: [2.6, 3], tendon: [0.15, 0.15], up: [0, 0, -1] });
  }
  return fas;
}

function rotatores() {
  const fas = [];
  for (let k = 2; k <= 12; k++) {
    const v = 'T' + k, u = 'T' + (k - 1);
    fas.push({ pts: [A(v + '.tpRootL', [1, 3, -4]), A(u + '.lamBotL', [1, 2, -2])], r: [1.6, 1.8], tendon: [0.2, 0.2], up: [0, 0, -1] });
    if (k >= 3) fas.push({ pts: [A(v + '.tpRootL', [3, 2, -5]), A('T' + (k - 2) + '.spBase', [2.5, -2, 1])], r: [1.8, 2], tendon: [0.2, 0.2], up: [0, 0, -1] });
  }
  return fas;
}

function interspinales() {
  const fas = [];
  const pairs = [['L4', 'L5'], ['L3', 'L4'], ['L2', 'L3'], ['L1', 'L2'], ['T12', 'L1'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'], ['C5', 'C6'], ['C6', 'C7']];
  for (const [u, l] of pairs) {
    const c = l[0] === 'C';
    fas.push({ pts: [c ? A(u + '.spMid', [2.4, -3, 0]) : A(u + '.spBot', [2.6, 0, -3]), c ? A(l + '.spMid', [2.4, 3, 0]) : A(l + '.spTop', [2.6, 0, -3])], r: [2, c ? 3 : 4], tendon: [0.15, 0.15], up: [1, 0, 0] });
  }
  return fas;
}

function intertransversarii() {
  const fas = [];
  for (const [u, l] of [['L1', 'L2'], ['L2', 'L3'], ['L3', 'L4'], ['L4', 'L5']]) {
    fas.push({ pts: [A(u + '.tpMidL', [4, -2, 0]), A(l + '.tpMidL', [4, 2, 0])], r: [3.5, 1.8], tendon: [0.15, 0.15], up: [0, 0, 1] });
    fas.push({ pts: [A(u + '.accL', [0, -1, -1]), A(l + '.mammL', [1, 0, 1])], r: [1.6, 1.6], tendon: [0.2, 0.2], up: [0, 0, -1] });
  }
  return fas;
}

function semispinalis() {
  const thoracis = [], cervicis = [], capitis = [];
  for (const [o, i] of [['T6', 'C7'], ['T7', 'T1'], ['T8', 'T2'], ['T9', 'T3'], ['T10', 'T4']]) {
    const org = A(o + '.tpTipL', [-4, 2, -6]);
    const ins = A(i + '.spMid', [3.5, 0, 0]);
    thoracis.push({ pts: [org, V(org, ins, 0.5, SPINE[SPINE.indexOf(o) - 3], [0, 0, -5]), ins], r: [3, 3.4], tendon: [0.25, 0.25], up: [0, 0, -1] });
  }
  for (const [o, i] of [['T1', 'C5'], ['T2', 'C4'], ['T3', 'C3'], ['T4', 'C2'], ['T5', 'C2']]) {
    const org = A(o + '.tpTipL', [-4, 2, -7]);
    const ins = A(i + '.spMid', [3.5, 0, 0]);
    cervicis.push({ pts: [org, V(org, ins, 0.5, SPINE[SPINE.indexOf(o) - 3], [0, 0, -5]), ins], r: [3.6, 4], tendon: [0.2, 0.25], up: [0, 0, -1] });
  }
  for (const [o, i, off] of [['T4', 'occipLowL', [6, 10, -6]], ['T2', 'nuchalInfL', [0, 6, -4]], ['C7', 'nuchalInfL', [6, 2, -4]], ['C5', 'occipLowL', [8, 2, -8]], ['C4', 'nuchalInfL', [12, -2, -4]]]) {
    const org = o[0] === 'T' ? A(o + '.tpTipL', [-6, 2, -8]) : A(o + '.pillarL', [0, 0, -6]);
    const ins = A('skull.' + i, off);
    capitis.push({ pts: [org, V(org, ins, 0.35, 'C6', [0, 0, -12]), V(org, ins, 0.7, 'C3', [0, 0, -14]), ins], r: [[3, 3], [6, 5.5], [6.5, 6], [4, 3]], tendon: [0.15, 0.12], up: [0, 0, -1] });
  }
  return { thoracis, cervicis, capitis };
}

// Erector de la columna: porciones lumbares (Bogduk) y torácicas con su aponeurosis
function erector() {
  const longLumb = [], iliocLumb = [], longThor = [], iliocThor = [], iliocThoracis = [], spinalis = [], longCerv = [], longCap = [], iliocCerv = [];
  const crestIns = { L1: A('pelvis.crest7L', [4, -6, 6]), L2: A('pelvis.crest8L', [6, -4, 6]), L3: A('pelvis.crest8L', [-2, -8, 8]), L4: A('pelvis.PSISL', [6, 4, 8]), L5: A('pelvis.PSISL', [2, -6, 10]) };
  LUMBAR.forEach((v, i) => {
    const org = A(v + '.accL', [1, 0, -3]);
    const ins = crestIns[v];
    const pts = [org];
    LUMBAR.slice(i + 1).forEach((w, j, arr) => pts.push(V(org, ins, (j + 1) / (arr.length + 1), w, [4 + j * 2, 0, -8])));
    pts.push(ins);
    longLumb.push({ pts, r: pts.map((_, j) => (j === 0 || j === pts.length - 1 ? [3.5, 3.5] : [6, 6])), tendon: [0.1, 0.12], up: [0, 0, -1], color: RED });
  });
  const icIns = { L1: A('pelvis.crest5L', [-4, -6, 4]), L2: A('pelvis.crest6L', [-2, -6, 4]), L3: A('pelvis.crest6L', [-12, -8, -2]), L4: A('pelvis.crest7L', [-4, -8, 2]) };
  ['L1', 'L2', 'L3', 'L4'].forEach((v, i) => {
    const org = A(v + '.tpTipL', [-2, 0, -2]);
    const ins = icIns[v];
    const pts = [org];
    LUMBAR.slice(i + 1).forEach((w, j, arr) => pts.push(V(org, ins, (j + 1) / (arr.length + 1), w, [6, 0, -10])));
    pts.push(ins);
    iliocLumb.push({ pts, r: pts.map((_, j) => (j === 0 || j === pts.length - 1 ? [3.5, 3.5] : [7, 6.5])), tendon: [0.08, 0.12], up: [0, 0, -1], color: RED });
  });
  // Longísimo torácico (porción torácica): vientres torácicos, tendones largos que forman la aponeurosis del erector
  const ltIns = ['L2.spMid', 'L3.spMid', 'L4.spMid', 'L5.spMid', 'sacrum.dorsal1', 'sacrum.dorsal2', 'sacrum.dorsalLat2L', 'sacrum.dorsalLat3L', 'pelvis.PSISL', 'pelvis.PSISL', 'pelvis.crest8L', 'pelvis.crest8L'];
  THOR.forEach((v, i) => {
    if (i < 1) return;
    const org = { lerp: [`rib${'L'}${i + 1}.tubercle`, `ribL${i + 1}.angle`, 0.5] };
    const insName = ltIns[i];
    const ins = A(insName, insName.includes('sp') || insName.includes('dorsal') ? [4 + i * 0.6, 0, -6] : [-2 - (i - 8) * 3, 2, 8]);
    const pts = [org];
    const chain = [...THOR.slice(i + 1), ...LUMBAR];
    chain.forEach((w, j) => {
      if (w[0] === 'T') pts.push(A(w + '.tpTipL', [-2 - j * 0.3, 0, -9]));
      else pts.push(A(w + '.spMid', [10 + i * 1.6, 0, -6 - i * 0.4]));
    });
    pts.push(ins);
    const n = pts.length;
    longThor.push({ pts, r: pts.map((_, j) => { const a = j / (n - 1); return a < 0.5 ? [5.5, 5.5] : [3, 1.4]; }), tendon: [0.04, 0.48], taper: [0.4, 0.45], up: [0, 0, -1], color: RED3 });
  });
  // Iliocostal lumbar (porción torácica): de los ángulos costales 5-12 a la cresta ilíaca
  const icThIns = ['pelvis.crest4L', 'pelvis.crest5L', 'pelvis.crest5L', 'pelvis.crest6L', 'pelvis.crest6L', 'pelvis.crest7L', 'pelvis.crest7L', 'pelvis.crest8L'];
  for (let k = 5; k <= 12; k++) {
    const org = A(`ribL${k}.post`, [0, 0, -4]);
    const ins = A(icThIns[k - 5], [0, -4, 6]);
    const pts = [org];
    for (let j = k + 1; j <= 12; j++) pts.push(A(`ribL${j}.post`, [-2 + (j - k) * -0.5, 0, -8]));
    ['L1', 'L2', 'L3', 'L4'].forEach((w) => pts.push(A(w + '.tpTipL', [6 + (12 - k) * 2.4, 0, -14])));
    pts.push(ins);
    const n = pts.length;
    iliocThor.push({ pts, r: pts.map((_, j) => { const a = j / (n - 1); return a < 0.45 ? [5.2, 4.8] : [3, 1.4]; }), tendon: [0.05, 0.42], taper: [0.4, 0.5], up: [0, 0, -1], color: RED3 });
  }
  // Iliocostal torácico
  for (let k = 1; k <= 6; k++) {
    const org = A(`ribL${k + 6}.angle`, [6, 2, -5]);
    const ins = k === 1 ? A('C7.tpPostL', [0, 0, -2]) : A(`ribL${k}.angle`, [4, 0, -5]);
    const pts = [org];
    for (let j = k + 5; j > k; j--) pts.push(A(`ribL${j}.angle`, [8, 0, -11]));
    pts.push(ins);
    iliocThoracis.push({ pts, r: pts.map((_, j) => (j === 0 || j === pts.length - 1 ? [2.5, 2.5] : [4.2, 4])), tendon: [0.15, 0.2], up: [0, 0, -1], color: RED2 });
  }
  // Espinoso torácico
  for (const [o, i] of [['L2', 'T8'], ['L1', 'T6'], ['T12', 'T4'], ['T11', 'T2']]) {
    const org = A(o + '.spTip', [3.5, 4, 4]);
    const ins = A(i + '.spTip', [3.5, 2, 4]);
    const pts = [org];
    const iu = SPINE.indexOf(i), io = SPINE.indexOf(o);
    for (let j = io - 1; j > iu; j--) pts.push(A(SPINE[j] + '.spTip', [5.5, 4, 3]));
    pts.push(ins);
    spinalis.push({ pts, r: pts.map((_, j) => (j === 0 || j === pts.length - 1 ? [2, 2.4] : [3.4, 4])), tendon: [0.2, 0.2], up: [1, 0, 0], color: RED2 });
  }
  // Cuello: longísimo cervical y de la cabeza, iliocostal cervical
  for (const [o, i] of [['T1', 'C6'], ['T2', 'C5'], ['T3', 'C4'], ['T4', 'C3'], ['T5', 'C2']]) {
    const org = A(o + '.tpTipL', [-3, 0, -4]);
    const ins = A(i + (i === 'C2' ? '.tpTipL' : '.tpPostL'), [0, 0, -2]);
    longCerv.push({ pts: [org, V(org, ins, 0.5, 'C7', [6, 0, -8]), ins], r: [[2.4, 2.4], [4, 4], [2.2, 2.2]], tendon: [0.2, 0.25], up: [0, 0, -1], color: RED2 });
  }
  for (const [o, off] of [['T3', [-4, 0, -3]], ['T1', [-4, 0, -3]], ['C6', [2, 0, -2]], ['C4', [2, 0, -2]]]) {
    const org = o[0] === 'T' ? A(o + '.tpTipL', off) : A(o + '.pillarL', off);
    const ins = A('skull.mastoidL', [-4, 4, -8]);
    longCap.push({ pts: [org, V(org, ins, 0.4, 'C5', [8, 0, -6]), V(org, ins, 0.75, 'C2', [6, 0, -6]), ins], r: [[2.4, 2.4], [3.8, 3.8], [3.8, 3.8], [2.2, 2.2]], tendon: [0.15, 0.2], up: [0, 0, -1], color: RED2 });
  }
  for (const [k, c] of [[3, 'C6'], [4, 'C5'], [5, 'C4'], [6, 'C4']]) {
    const org = A(`ribL${k}.angle`, [4, 4, -6]);
    const ins = A(c + '.tpPostL', [0, 0, -2]);
    iliocCerv.push({ pts: [org, V(org, ins, 0.5, 'T1', [12, 0, -10]), ins], r: [[2.2, 2.2], [3.6, 3.4], [2, 2]], tendon: [0.2, 0.25], up: [0, 0, -1], color: RED2 });
  }
  return { longLumb, iliocLumb, longThor, iliocThor, iliocThoracis, spinalis, longCerv, longCap, iliocCerv };
}

function suboccipital() {
  return {
    rcpMajor: [{ pts: [A('C2.spTip', [4, 4, 2]), A('skull.nuchalInfL', [12, -4, 8])], r: [3, 4.2], tendon: [0.1, 0.15], up: [0, 0, -1] }],
    rcpMinor: [{ pts: [A('C1.postTub', [3, 2, 3]), A('skull.occipLowL', [-2, 4, -10])], r: [2.4, 3.6], tendon: [0.1, 0.15], up: [0, 0, -1] }],
    ociInf: [{ pts: [A('C2.spTip', [5, 2, 6]), A('C1.tpTipL', [-2, -2, -3])], r: [4, 4.5], tendon: [0.12, 0.12], up: [0, 1, 0] }],
    ociSup: [{ pts: [A('C1.tpTipL', [-1, 3, -3]), A('skull.nuchalInfL', [24, 0, 10])], r: [3, 3.4], tendon: [0.12, 0.15], up: [0, 0, -1] }],
  };
}

function splenius() {
  const capitis = [], cervicis = [];
  for (const [o, off, ins] of [['C4', [3, 0, -14], [-6, 10, -6]], ['C6', [3, 0, -12], [0, 4, -4]], ['T1', [4, 0, -3], [6, -2, -2]], ['T3', [4, 0, -3], [8, -6, 0]]]) {
    const org = A(o + '.spTip', off);
    const insP = A('skull.mastoidL', ins);
    capitis.push({ pts: [org, V(org, insP, 0.45, 'C5', [12, 0, -10]), V(org, insP, 0.78, 'C2', [6, 0, -10]), insP], r: [[5, 1.8], [8, 3], [8, 3.2], [5, 2.5]], tendon: [0.15, 0.1], up: [0, 0, -1], color: RED3 });
  }
  for (const [o, ins] of [['T4', 'C1.tpTipL'], ['T5', 'C2.tpTipL'], ['T6', 'C3.tpPostL']]) {
    const org = A(o + '.spTip', [4, 0, -2]);
    const insP = A(ins, [0, 0, -3]);
    cervicis.push({ pts: [org, V(org, insP, 0.4, 'T1', [14, 0, -10]), V(org, insP, 0.75, 'C5', [10, 0, -10]), insP], r: [[3.5, 1.5], [5, 2.6], [4.5, 2.6], [2.5, 2]], tendon: [0.18, 0.15], up: [0, 0, -1], color: RED3 });
  }
  return { capitis, cervicis };
}

function serratusPost() {
  const inf = [], sup = [];
  [['T11', 9], ['T12', 10], ['L1', 11], ['L2', 12]].forEach(([o, k]) => {
    const org = A(o + '.spTip', [3, 0, -4]);
    const ins = A(`ribL${k}.postLat`, [6, -4, -6]);
    inf.push({ pts: [org, V(org, ins, 0.5, o, [0, 0, -10]), ins], r: [[5, 1], [9, 1.6], [8, 1.6]], tendon: [0.35, 0.05], up: [0, 0, -1], color: RED3 });
  });
  [['C7', 2], ['T1', 3], ['T2', 4], ['T3', 5]].forEach(([o, k]) => {
    const org = A(o + '.spTip', [3, 0, -4]);
    const ins = A(`ribL${k}.post`, [8, 0, -6]);
    sup.push({ pts: [org, V(org, ins, 0.5, 'T2', [0, 0, -10]), ins], r: [[5, 1], [7, 1.5], [7, 1.5]], tendon: [0.35, 0.05], up: [0, 0, -1], color: RED3 });
  });
  return { inf, sup };
}

function shoulderMuscles() {
  const rhMinor = [], rhMajor = [], levator = [], trap = [], lat = [];
  for (const [o, ins] of [['C6', 'medUp'], ['C7', 'spineRoot']]) {
    const org = A(o + '.spTip', [3, 0, -6]);
    const insP = A('scapulaL.' + ins, [-3, 0, -4]);
    rhMinor.push({ pts: [org, V(org, insP, 0.5, 'T2', [0, 0, -6]), insP], r: [[6, 2], [8, 3.4], [6, 3]], tendon: [0.12, 0.06], up: [0, 0, -1], color: RED });
  }
  for (const [o, t] of [['T2', 0.15], ['T3', 0.4], ['T4', 0.65], ['T5', 0.92]]) {
    const org = A(o + '.spTip', [3, 0, -6]);
    const insP = { lerp: ['scapulaL.spineRoot', 'scapulaL.IA', t], offset: [-4, 0, -4] };
    rhMajor.push({ pts: [org, V(org, insP, 0.5, 'T4', [0, 0, -7]), insP], r: [[7, 2.2], [10, 3.8], [8, 3.2]], tendon: [0.1, 0.05], up: [0, 0, -1], color: RED });
  }
  for (const v of ['C1', 'C2', 'C3', 'C4']) {
    const org = v === 'C1' || v === 'C2' ? A(v + '.tpTipL', [0, 0, -2]) : A(v + '.tpPostL', [0, 0, -2]);
    const insP = A('scapulaL.SA', [-2, 4, 0]);
    levator.push({ pts: [org, V(org, insP, 0.5, 'C6', [8, 0, -4]), insP], r: [[3, 3], [5.5, 5], [4, 3.6]], tendon: [0.15, 0.1], up: [0, 0, -1], color: RED });
  }
  // Trapecio: descendente, transverso y ascendente
  const tr = [
    [A('skull.nuchalMidL', [4, 2, -2]), A('clavicleL.lat3', [0, 6, -4]), 'C3', [16, -4, -16]],
    [A('C2.spTip', [3, 0, -18]), A('clavicleL.lat3', [12, 6, -8]), 'C5', [18, 0, -18]],
    [A('C4.spTip', [3, 0, -20]), A('clavicleL.lateral', [0, 6, -4]), 'C6', [16, 2, -18]],
    [A('C6.spTip', [3, 0, -16]), A('scapulaL.acromion', [-6, 6, -4]), 'C7', [14, 6, -16]],
    [A('C7.spTip', [3, 0, -6]), A('scapulaL.acromion', [-18, 6, -10]), 'T1', [10, 4, -14]],
    [A('T1.spTip', [3, 0, -6]), A('scapulaL.spineLat', [0, 4, -8]), 'T2', [8, 2, -12]],
    [A('T3.spTip', [3, 0, -6]), A('scapulaL.spineMid', [6, 2, -8]), 'T3', [6, 0, -12]],
    [A('T5.spTip', [3, 0, -6]), A('scapulaL.spineMid', [-10, -2, -8]), 'T5', [4, 0, -10]],
    [A('T7.spTip', [3, 0, -6]), A('scapulaL.spineRoot', [8, -2, -8]), 'T6', [4, 0, -10]],
    [A('T9.spTip', [3, 0, -6]), A('scapulaL.spineRoot', [2, -4, -8]), 'T8', [6, 0, -10]],
    [A('T11.spTip', [3, 0, -6]), A('scapulaL.spineRoot', [-2, -6, -6]), 'T9', [8, 0, -12]],
    [A('T12.spTip', [3, 0, -6]), A('scapulaL.spineRoot', [-6, -8, -5]), 'T10', [8, 0, -12]],
  ];
  tr.forEach(([o, i, mid, off], j) => {
    const lower = j >= 7;
    trap.push({ pts: [o, V(o, i, 0.45, mid, off), i], r: [[9, 1.3], [17, 2.6], [10, 2.2]], tendon: [lower ? 0.18 : 0.1, 0.1], up: [0, 0, -1], color: RED3, superficial: true });
  });
  // Dorsal ancho: origen aponeurótico (fascia toracolumbar) en lumbar
  const lo = [
    [A('T7.spTip', [3, 0, -8]), 'ribL7.postLat', 0.05],
    [A('T9.spTip', [3, 0, -8]), 'ribL8.postLat', 0.08],
    [A('T11.spTip', [3, 0, -8]), 'ribL9.postLat', 0.12],
    [A('L1.spTip', [3, 0, -10]), 'ribL10.postLat', 0.3],
    [A('L3.spTip', [3, 0, -12]), 'ribL11.lat', 0.42],
    [A('L5.spTip', [3, 0, -14]), 'ribL11.lat', 0.5],
    [A('sacrum.dorsal2', [6, 0, -16]), 'ribL12.lat', 0.5],
    [A('pelvis.crest7L', [0, 2, -10]), 'ribL12.lat', 0.35],
    [A('pelvis.crest5L', [6, 4, -6]), 'ribL11.antLat', 0.15],
    [A('ribL11.lat', [6, 0, -4]), 'ribL9.lat', 0.04],
  ];
  lo.forEach(([o, rib, ap], j) => {
    const ins = A('humerusL.groove', [-2, -4 + j * 0.8, -2]);
    const v1 = A(rib, [12, 0, -14]);
    const v2 = A('scapulaL.latMid', [22 - j * 0.6, -30 + j * 1.5, -6]);
    lat.push({ pts: [o, v1, v2, ins], r: [[11, 1.2], [15, 2.4], [10, 3.2], [4, 2]], tendon: [ap, 0.08], taper: [0.75, 0.5], up: [0, 0, -1], color: RED3, superficial: true });
  });
  return { rhMinor, rhMajor, levator, trap, lat };
}

function qlPsoas() {
  const ql = [], psoas = [], iliacus = [];
  const c = 'pelvis.qlCrestL';
  ql.push({ pts: [A(c, [10, 4, 6]), A('ribL12.mid12', [0, -4, 4])], r: [8, 4.5], tendon: [0.1, 0.12], up: [0, 0, 1], color: RED });
  ql.push({ pts: [A(c, [22, 2, 10]), A('ribL12.lat', [-4, -4, 4])], r: [7, 4], tendon: [0.1, 0.12], up: [0, 0, 1], color: RED });
  ql.push({ pts: [A('pelvis.iliolumbarCrestL', [6, 4, 10]), A('ribL12.angle', [6, -4, 6])], r: [6, 4], tendon: [0.1, 0.12], up: [0, 0, 1], color: RED });
  for (const v of ['L1', 'L2', 'L3', 'L4']) ql.push({ pts: [A(c, [-4, 2, 6]), A(v + '.tpTipL', [0, 0, 3])], r: [4.5, 3.4], tendon: [0.08, 0.14], up: [0, 0, 1], color: RED2 });
  for (const v of ['L2', 'L3', 'L4']) ql.push({ pts: [A(v + '.tpTipL', [2, 0, 3]), A('ribL12.mid12', [-6, -3, 5])], r: [3.6, 3], tendon: [0.14, 0.1], up: [0, 0, 1], color: RED2 });
  // Psoas mayor: desde cuerpos/discos T12–L4 y transversas → trocánter menor
  const orgs = [['T12', 'latBotL', [2, -2, 2]], ['L1', 'latBotL', [3, -2, 3]], ['L2', 'latBotL', [4, -2, 4]], ['L3', 'latBotL', [4, -2, 5]], ['L4', 'latBotL', [4, -2, 6]], ['L1', 'tpMidL', [-4, -3, 8]], ['L3', 'tpMidL', [-6, -3, 8]]];
  orgs.forEach(([v, lm, off], j) => {
    const org = A(v + '.' + lm, off);
    const pts = [org];
    const idx = LUMBAR.indexOf(v);
    for (let k = Math.max(idx + 1, 0); k < 5; k++) pts.push(A(LUMBAR[k] + '.latL', [10 + (k - idx) * 3 + (j > 4 ? 6 : 0), -4, 10 + (k - idx) * 2]));
    pts.push(A('sacrum.ala1L', [-6 + (j % 3) * 3, 18, 26]));
    pts.push(A('pelvis.iliopectinealL', [6 + (j % 3) * 2, 12, -6]));
    pts.push(A('femurL.head', [-4, -26, 34]));
    pts.push(A('femurL.LT', [0, 2, 4]));
    const n = pts.length;
    psoas.push({ pts, r: pts.map((_, k) => { const a = k / (n - 1); return a < 0.12 ? [4, 4] : a < 0.75 ? [8.5, 8.5] : [5, 5]; }), tendon: [0.04, 0.25], taper: [0.5, 0.4], up: [0, 0, 1], color: RED });
  });
  for (const [lm, off] of [['iliacFossaL', [0, 0, 0]], ['iliacFossaPostL', [0, 0, 0]], ['iliacFossaLowL', [0, 0, 0]], ['crest2L', [-14, -8, -4]], ['crest3L', [-16, -10, 0]]]) {
    const org = A('pelvis.' + lm, off);
    iliacus.push({ pts: [org, A('pelvis.iliopectinealL', [18, 8, -4]), A('femurL.head', [-2, -28, 34]), A('femurL.LT', [3, 3, 4])], r: [[9, 3], [8, 5], [6, 5], [3.5, 3.5]], tendon: [0.04, 0.2], up: [-0.7, 0, 0.5], color: RED });
  }
  return { ql, psoas, iliacus };
}

function hipMuscles() {
  const piri = [], gmed = [], gmax = [];
  for (const [o, off] of [['aforS2L', [10, 0, -2]], ['aforS3L', [8, 0, -2]]]) {
    const org = A('sacrum.' + o, off);
    piri.push({ pts: [org, A('pelvis.sciaticExitL', [10, 22, 2]), A('femurL.GTtip', [-8, -4, -6])], r: [[6, 4], [8, 6], [3.5, 3]], tendon: [0.05, 0.22], up: [0, 1, 0], color: RED });
  }
  for (const [lm, off] of [['glutealPostL', [0, 0, 0]], ['glutealMidL', [0, 0, 0]], ['glutealAntL', [0, 0, 0]], ['crest3L', [4, -12, -2]]]) {
    const org = A('pelvis.' + lm, off);
    const ins = A('femurL.GTlat', [-2, 4, 0]);
    gmed.push({ pts: [org, V(org, ins, 0.5, 'pelvis', [12, 0, 0]), ins], r: [[11, 5], [12, 7], [5, 3]], tendon: [0.04, 0.2], up: [1, 0, 0], color: RED });
  }
  for (const [o, off] of [['pelvis.crest8L', [0, -4, -6]], ['pelvis.PSISL', [6, -10, -8]], ['sacrum.dorsalLat3L', [8, 0, -8]], ['sacrum.dorsalLat4L', [8, 0, -8]], ['sacrum.dorsalLat5L', [6, -4, -6]]]) {
    const org = A(o, off);
    const ins = A('femurL.gluteal', [8, 4, -4]);
    gmax.push({ pts: [org, V(org, ins, 0.45, 'pelvis', [18, 0, -30]), V(org, ins, 0.8, 'femurL', [8, 0, -22]), ins], r: [[9, 4], [14, 9], [13, 8], [6, 3]], tendon: [0.05, 0.15], up: [0, 0, -1], color: RED3, superficial: true });
  }
  return { piri, gmed, gmax };
}

function abdominals() {
  const rect = [], eo = [], io = [], ta = [];
  // Recto del abdomen: del pubis a cartílagos 5-7 y xifoides; intersecciones tendinosas
  for (const [ins, x] of [['sternum.xiphoid', 14], ['ribL6.end', 30], ['ribL5.end', 44]]) {
    const org = A('pelvis.pubicTubL', [-8 + x * 0.2, 6, 2]);
    const insP = A(ins, ins.includes('xiph') ? [12, 0, 6] : [-4, -2, 8]);
    const pts = [org, A('L5.antMid', [x * 0.7 + 8, -10, 96]), A('L3.antMid', [x * 0.8 + 10, 0, 112]), A('L1.antMid', [x * 0.9 + 10, 0, 118]), insP];
    rect.push({ pts, r: [[6, 3], [10, 4], [12, 4.5], [12, 4.5], [10, 3]], tendon: [0.04, 0.04], bands: [0.42, 0.62, 0.8], up: [0, 0, 1], color: RED3 });
  }
  // Oblicuo externo (fibras hacia abajo y adelante)
  for (let k = 5; k <= 12; k++) {
    const org = A(`ribL${k}.${k >= 10 ? 'lat' : 'antLat'}`, [6, 0, 4]);
    const ins = k >= 10 ? A(`pelvis.crest${k - 9}L`, [4, 4, 2]) : A('L3.antMid', [24, -30 + (k - 5) * -6, 110]);
    eo.push({ pts: [org, V(org, ins, 0.5, 'L1', k >= 10 ? [16, 0, 4] : [10, 0, 14]), ins], r: [[8, 2.4], [10, 3], [8, 2]], tendon: [0.03, k >= 10 ? 0.08 : 0.45], up: [1, 0, 0.6], color: RED3 });
  }
  // Oblicuo interno (fibras hacia arriba y adelante)
  for (const [o, ins] of [['crest1L', 'ribL10.end'], ['crest2L', 'ribL11.end'], ['crest3L', 'ribL12.end'], ['crest1L', 'L2.antMid']]) {
    const org = A('pelvis.' + o, [-2, 0, 0]);
    const insP = ins.startsWith('L2') ? A(ins, [22, 0, 112]) : A(ins, [0, -4, 0]);
    io.push({ pts: [org, V(org, insP, 0.5, 'L3', [12, 0, 10]), insP], r: [[8, 2.4], [10, 3], [8, 2]], tendon: [0.04, ins.startsWith('L2') ? 0.4 : 0.06], up: [1, 0, 0.6], color: RED2 });
  }
  // Transverso del abdomen: fibras horizontales desde la fascia toracolumbar
  for (const v of ['L1', 'L2', 'L3', 'L4']) {
    const y = 0;
    const pts = [A(v + '.tpTipL', [24, y, -16]), A(v + '.body', [110, y, -10]), A(v + '.body', [122, y, 40]), A(v + '.body', [86, y, 92]), A(v + '.body', [30, y, 112]), A(v + '.body', [4, y, 114])];
    ta.push({ pts, r: [[1.4, 9], [2.2, 12], [2.6, 12], [2.2, 12], [1.4, 11], [1.1, 10]], tendon: [0.12, 0.35], up: [0, 1, 0], color: RED2 });
  }
  return { rect, eo, io, ta };
}

export function muscleCatalog() {
  const m = multifidus();
  const e = erector();
  const s = semispinalis();
  const so = suboccipital();
  const sp = splenius();
  const spi = serratusPost();
  const sh = shoulderMuscles();
  const qp = qlPsoas();
  const hp = hipMuscles();
  const ab = abdominals();
  return [
    { id: 'multifidus', name: 'Multífido', latin: 'm. multifidus', layer: 2, fas: m, color: DEEP },
    { id: 'rotatores', name: 'Rotadores', latin: 'mm. rotatores', layer: 2, fas: rotatores(), color: DEEP },
    { id: 'interspinales', name: 'Interespinosos', latin: 'mm. interspinales', layer: 2, fas: interspinales(), color: DEEP },
    { id: 'intertransversarii', name: 'Intertransversos', latin: 'mm. intertransversarii', layer: 2, fas: intertransversarii(), color: DEEP },
    { id: 'semispinalisT', name: 'Semiespinoso torácico', latin: 'm. semispinalis thoracis', layer: 2, fas: s.thoracis, color: DEEP },
    { id: 'semispinalisC', name: 'Semiespinoso cervical', latin: 'm. semispinalis cervicis', layer: 2, fas: s.cervicis, color: DEEP },
    { id: 'semispinalisCap', name: 'Semiespinoso de la cabeza', latin: 'm. semispinalis capitis', layer: 3, fas: s.capitis, color: RED2 },
    { id: 'rcpMajor', name: 'Recto posterior mayor de la cabeza', latin: 'm. rectus capitis posterior major', layer: 2, fas: so.rcpMajor, color: DEEP },
    { id: 'rcpMinor', name: 'Recto posterior menor de la cabeza', latin: 'm. rectus capitis posterior minor', layer: 2, fas: so.rcpMinor, color: DEEP },
    { id: 'ociInf', name: 'Oblicuo inferior de la cabeza', latin: 'm. obliquus capitis inferior', layer: 2, fas: so.ociInf, color: DEEP },
    { id: 'ociSup', name: 'Oblicuo superior de la cabeza', latin: 'm. obliquus capitis superior', layer: 2, fas: so.ociSup, color: DEEP },
    { id: 'longLumb', name: 'Longísimo lumbar', latin: 'm. longissimus thoracis pars lumborum', layer: 3, fas: e.longLumb },
    { id: 'iliocLumb', name: 'Iliocostal lumbar', latin: 'm. iliocostalis lumborum pars lumborum', layer: 3, fas: e.iliocLumb },
    { id: 'longThor', name: 'Longísimo torácico', latin: 'm. longissimus thoracis pars thoracis', layer: 3, fas: e.longThor },
    { id: 'iliocThor', name: 'Iliocostal lumbar (porción torácica)', latin: 'm. iliocostalis lumborum pars thoracis', layer: 3, fas: e.iliocThor },
    { id: 'iliocThoracis', name: 'Iliocostal torácico', latin: 'm. iliocostalis thoracis', layer: 3, fas: e.iliocThoracis },
    { id: 'spinalis', name: 'Espinoso torácico', latin: 'm. spinalis thoracis', layer: 3, fas: e.spinalis },
    { id: 'longCerv', name: 'Longísimo cervical', latin: 'm. longissimus cervicis', layer: 3, fas: e.longCerv },
    { id: 'longCap', name: 'Longísimo de la cabeza', latin: 'm. longissimus capitis', layer: 3, fas: e.longCap },
    { id: 'iliocCerv', name: 'Iliocostal cervical', latin: 'm. iliocostalis cervicis', layer: 3, fas: e.iliocCerv },
    { id: 'ql', name: 'Cuadrado lumbar', latin: 'm. quadratus lumborum', layer: 3, fas: qp.ql },
    { id: 'psoas', name: 'Psoas mayor', latin: 'm. psoas major', layer: 3, fas: qp.psoas },
    { id: 'iliacus', name: 'Ilíaco', latin: 'm. iliacus', layer: 3, fas: qp.iliacus },
    { id: 'spleniusCap', name: 'Esplenio de la cabeza', latin: 'm. splenius capitis', layer: 4, fas: sp.capitis },
    { id: 'spleniusCerv', name: 'Esplenio del cuello', latin: 'm. splenius cervicis', layer: 4, fas: sp.cervicis },
    { id: 'serratusPI', name: 'Serrato posterior inferior', latin: 'm. serratus posterior inferior', layer: 4, fas: spi.inf },
    { id: 'serratusPS', name: 'Serrato posterior superior', latin: 'm. serratus posterior superior', layer: 4, fas: spi.sup },
    { id: 'rhomboidMinor', name: 'Romboides menor', latin: 'm. rhomboideus minor', layer: 4, fas: sh.rhMinor },
    { id: 'rhomboidMajor', name: 'Romboides mayor', latin: 'm. rhomboideus major', layer: 4, fas: sh.rhMajor },
    { id: 'levator', name: 'Elevador de la escápula', latin: 'm. levator scapulae', layer: 4, fas: sh.levator },
    { id: 'trapezius', name: 'Trapecio', latin: 'm. trapezius', layer: 5, fas: sh.trap },
    { id: 'latissimus', name: 'Dorsal ancho', latin: 'm. latissimus dorsi', layer: 5, fas: sh.lat },
    { id: 'piriformis', name: 'Piriforme', latin: 'm. piriformis', layer: 7, fas: hp.piri },
    { id: 'gmed', name: 'Glúteo medio', latin: 'm. gluteus medius', layer: 7, fas: hp.gmed },
    { id: 'gmax', name: 'Glúteo mayor', latin: 'm. gluteus maximus', layer: 7, fas: hp.gmax },
    { id: 'rectus', name: 'Recto del abdomen', latin: 'm. rectus abdominis', layer: 6, fas: ab.rect },
    { id: 'eo', name: 'Oblicuo externo', latin: 'm. obliquus externus abdominis', layer: 6, fas: ab.eo },
    { id: 'io', name: 'Oblicuo interno', latin: 'm. obliquus internus abdominis', layer: 6, fas: ab.io },
    { id: 'ta', name: 'Transverso del abdomen', latin: 'm. transversus abdominis', layer: 6, fas: ab.ta },
  ];
}
