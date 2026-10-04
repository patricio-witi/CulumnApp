// Ligamentos de la columna y de la pelvis
const A = (at, offset) => (offset ? { at, offset } : at);
const V = (a, b, t, bone, offset) => ({ via: [a, b, t], bone, offset });

const BODIES = ['C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];
const WHITE = 0xe2dccd, YELLOW = 0xd9b54a, CAPS = 0xd8d4c8;

function halfWidth(v, kind) {
  const r = v[0];
  if (kind === 'ALL') return r === 'L' ? 12 : r === 'T' ? 8.5 : 6;
  return r === 'L' ? 4.2 : r === 'T' ? 4.5 : 6;
}

export function ligamentCatalog() {
  const out = [];
  // Longitudinal anterior
  {
    const pts = [A('sacrum.promontory', [0, -6, 2.2])], r = [[16, 1.3]], normals = [[0, 0.3, 1]];
    for (const v of [...BODIES].reverse()) {
      pts.push(A(v + '.antMid', [0, 0, 1.4]));
      r.push([halfWidth(v, 'ALL'), 0.8]);
      normals.push([0, 0, 1]);
    }
    pts.push(A('C1.antTub', [0, 0, 0.5])); r.push([6, 1]); normals.push([0, 0, 1]);
    out.push({ id: 'ALL', name: 'Ligamento longitudinal anterior', latin: 'lig. longitudinale anterius', group: 'lig', side: 'C', fas: [{ pts, r, normals, color: WHITE, seg: 6 }] });
  }
  // Longitudinal posterior: estrecho sobre los cuerpos, más ancho (dentado) sobre los discos
  {
    const pts = [A('sacrum.canalTop', [0, 2, 7.5])], r = [[3, 0.9]], normals = [[0, 0, -1]];
    for (const v of [...BODIES].reverse()) {
      const reg = v[0];
      pts.push(A(v + '.postBot', [0, -2.5, -0.9])); r.push([halfWidth(v, 'PLL') * (reg === 'L' ? 1.9 : 1.5), 0.9]); normals.push([0, 0, -1]);
      pts.push(A(v + '.postMid', [0, 0, -0.9])); r.push([halfWidth(v, 'PLL'), 0.9]); normals.push([0, 0, -1]);
      if (v !== 'C2') { pts.push(A(v + '.postTop', [0, 2.5, -0.9])); r.push([halfWidth(v, 'PLL') * (reg === 'L' ? 1.9 : 1.5), 0.9]); normals.push([0, 0, -1]); }
    }
    out.push({ id: 'PLL', name: 'Ligamento longitudinal posterior', latin: 'lig. longitudinale posterius', group: 'lig', side: 'C', fas: [{ pts, r, normals, color: WHITE, seg: 4 }] });
  }
  // Ligamento amarillo (por nivel, ambos lados)
  {
    const fas = [];
    const pairs = [];
    for (let i = 0; i < BODIES.length - 1; i++) pairs.push([BODIES[i], BODIES[i + 1]]);
    for (const [u, l] of pairs) {
      for (const s of ['L', 'R']) {
        const sx = s === 'L' ? 1 : -1;
        const top = u[0] === 'C' ? A(u + '.lam' + s, [-sx * 1.5, -5, 2.5]) : A(u + '.lamBot' + s, [-sx * 1, 1, 2.6]);
        const bot = l[0] === 'C' ? A(l + '.lam' + s, [-sx * 1.5, 5, 2.5]) : A(l + '.lamTop' + s, [-sx * 1, -1, 2.6]);
        fas.push({ pts: [top, bot], r: l[0] === 'L' ? [6, 1.8] : [4.5, 1.3], up: [0, 0, -1], color: YELLOW, seg: 5 });
      }
    }
    out.push({ id: 'flavum', name: 'Ligamento amarillo', latin: 'lig. flavum', group: 'lig', side: 'C', fas });
  }
  // Interespinosos y supraespinoso
  {
    const fas = [];
    for (const [u, l] of [['T10', 'T11'], ['T11', 'T12'], ['T12', 'L1'], ['L1', 'L2'], ['L2', 'L3'], ['L3', 'L4'], ['L4', 'L5']]) {
      fas.push({ pts: [A(u + '.spBot', [0, 0, 2]), A(l + '.spTop', [0, 0, 2])], r: [7.5, 1.1], up: [1, 0, 0], color: WHITE, seg: 4 });
    }
    out.push({ id: 'interspinous', name: 'Ligamentos interespinosos', latin: 'ligg. interspinalia', group: 'lig', side: 'C', fas });
    const pts = [];
    for (const v of ['L4', 'L3', 'L2', 'L1', 'T12', 'T11', 'T10', 'T9', 'T8', 'T7', 'T6', 'T5', 'T4', 'T3', 'T2', 'T1', 'C7']) pts.push(A(v + '.spTip', [0, 0, -3.2]));
    out.push({ id: 'supraspinous', name: 'Ligamento supraespinoso', latin: 'lig. supraspinale', group: 'lig', side: 'C', fas: [{ pts, r: [2.6, 1.6], up: [0, 0, -1], color: WHITE }] });
    out.push({ id: 'nuchae', name: 'Ligamento nucal', latin: 'lig. nuchae', group: 'lig', side: 'C', fas: [{ pts: [A('C7.spTip', [0, 2, -3]), A('C5.spTip', [0, 0, -10]), A('C3.spTip', [0, 2, -14]), A('C2.spTip', [0, 4, -13]), A('skull.inion', [0, -6, 8])], r: [[3, 1], [9, 0.9], [11, 0.9], [11, 0.9], [5, 1]], up: [1, 0, 0], color: WHITE }] });
  }
  // Ligamentos de la región lumbosacra y pélvica
  for (const s of ['L', 'R']) {
    const x = s === 'L' ? 1 : -1;
    out.push({ id: 'iliolumbar' + s, name: 'Ligamento iliolumbar', latin: 'lig. iliolumbale', group: 'lig', side: s, fas: [
      { pts: [A('L5.tpTip' + s, [x * 2, 0, 0]), A('pelvis.iliolumbarCrest' + s, [-x * 2, -2, 6])], r: [5.5, 3], up: [0, 0, -1], color: WHITE },
      { pts: [A('L5.tpTip' + s, [0, -3, 2]), A('pelvis.auricular' + s, [-x * 4, 18, 4])], r: [4, 2.6], up: [0, 0, -1], color: WHITE },
      { pts: [A('L4.tpTip' + s, [x * 2, 0, 0]), A('pelvis.crest8' + s, [0, -8, 10])], r: [3, 2], up: [0, 0, -1], color: WHITE },
    ] });
    out.push({ id: 'sacroiliacPost' + s, name: 'Ligamentos sacroilíacos posteriores', latin: 'ligg. sacroiliaca posteriora', group: 'lig', side: s, fas: [
      { pts: [A('pelvis.PSIS' + s, [-x * 4, 0, 6]), A('sacrum.dorsalLat1' + s, [x * 2, -2, -6])], r: [6, 2.4], up: [0, 0, -1], color: WHITE },
      { pts: [A('pelvis.PSIS' + s, [-x * 3, -10, 6]), A('sacrum.dorsalLat2' + s, [x * 2, 0, -6])], r: [6, 2.4], up: [0, 0, -1], color: WHITE },
      { pts: [A('pelvis.PSIS' + s, [-x * 2, -16, 4]), A('sacrum.dorsalLat3' + s, [x * 3, 0, -6])], r: [5, 2.2], up: [0, 0, -1], color: WHITE },
    ] });
    out.push({ id: 'sacrotuberous' + s, name: 'Ligamento sacrotuberoso', latin: 'lig. sacrotuberale', group: 'lig', side: s, fas: [
      { pts: [A('sacrum.dorsalLat4' + s, [x * 4, 0, -4]), V('sacrum.dorsalLat4' + s, 'pelvis.ischialTub' + s, 0.5, 'pelvis', [x * 4, 0, -6]), A('pelvis.ischialTub' + s, [-x * 6, 6, 2])], r: [[8, 2.4], [5, 3], [7, 3]], up: [x * 0.6, 0, -0.8], color: WHITE },
      { pts: [A('pelvis.PSIS' + s, [-x * 2, -20, 2]), A('pelvis.ischialTub' + s, [-x * 4, 8, 0])], r: [[5, 2], [4, 2.6]], up: [x * 0.6, 0, -0.8], color: WHITE },
    ] });
    out.push({ id: 'sacrospinous' + s, name: 'Ligamento sacroespinoso', latin: 'lig. sacrospinale', group: 'lig', side: s, fas: [
      { pts: [A('sacrum.ala5' + s, [x * 2, 2, 0]), A('pelvis.ischialSpine' + s, [-x * 2, 0, 0])], r: [[7, 2], [3.5, 2]], up: [0, 1, 0.3], color: WHITE },
    ] });
    // Cápsulas articulares facetarias (lumbares y cervicales)
    const caps = [];
    for (const [u, l] of [['T12', 'L1'], ['L1', 'L2'], ['L2', 'L3'], ['L3', 'L4'], ['L4', 'L5']]) {
      caps.push({ pts: [A(l + '.sap' + s, [0, 2, -2]), A(u + '.iap' + s, [0, -2, 0])], r: [7.5, 7], up: [0, 0, -1], color: CAPS, seg: 5 });
    }
    caps.push({ pts: [A('sacrum.sap' + s, [0, 2, -2]), A('L5.iap' + s, [0, -2, 0])], r: [7.5, 7], up: [0, 0, -1], color: CAPS, seg: 5 });
    for (const [u, l] of [['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'], ['C5', 'C6'], ['C6', 'C7']]) {
      caps.push({ pts: [A(l + '.facetSup' + s, [0, -3, 3]), A(l + '.facetSup' + s, [0, 4, -3])], r: [7.5, 6], up: [0, 0, -1], color: CAPS, seg: 4 });
    }
    out.push({ id: 'facetCaps' + s, name: 'Cápsulas de las articulaciones facetarias', latin: 'capsulae articulares zygapophysiales', group: 'capsule', side: s, fas: caps });
  }
  // Ligamento transverso del atlas y ligamentos alares
  out.push({ id: 'atlasTransverse', name: 'Ligamento transverso del atlas', latin: 'lig. transversum atlantis', group: 'lig', side: 'C', fas: [
    { pts: [A('C1.latMassL', [-7, 0, -4]), A('C1.body', [0, 0, -7]), A('C1.latMassR', [7, 0, -4])], r: [2.2, 4], up: [0, 0, -1], color: WHITE },
  ] });
  out.push({ id: 'alar', name: 'Ligamentos alares', latin: 'ligg. alaria', group: 'lig', side: 'C', fas: [
    { pts: [A('C2.densTip', [2, 0, 0]), A('skull.condyleL', [-5, 2, 2])], r: [2.2, 2.2], up: [0, 0, -1], color: WHITE },
    { pts: [A('C2.densTip', [-2, 0, 0]), A('skull.condyleR', [5, 2, 2])], r: [2.2, 2.2], up: [0, 0, -1], color: WHITE },
  ] });
  return out;
}
