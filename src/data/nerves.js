// Sistema nervioso: médula espinal, saco dural, raíces (con ganglio de la raíz dorsal), cauda equina y nervios periféricos
const A = (at, offset) => (offset ? { at, offset } : at);
const W = (at, offset) => ({ at, offset, space: 'world' });
const V = (a, b, t, bone, offset) => ({ via: [a, b, t], bone, offset });

export const NERVE_YELLOW = 0xe7c45a;
const LUMBAR = ['L1', 'L2', 'L3', 'L4', 'L5'];

export function cordDef() {
  const lv = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1'];
  const rad = { C1: [6, 4.6], C2: [6, 4.4], C3: [6.3, 4.3], C4: [6.8, 4.3], C5: [7, 4.3], C6: [6.8, 4.2], C7: [6.2, 4.2], T1: [5.4, 4.1], T6: [4.6, 4], T10: [4.7, 4.1], T11: [5, 4.2], T12: [5.1, 4.3], L1: [3.4, 3.1] };
  const pts = [A('skull.foramenMagnum', [0, 14, 2])], r = [[7.5, 6.5]];
  let last = [6, 4.5];
  for (const v of lv) {
    pts.push(A(v + '.canal', v === 'C1' ? [0, 0, 2] : [0, 0, v[0] === 'T' ? 1.5 : 0.5]));
    last = rad[v] || last;
    r.push(last);
  }
  pts.push(A('L1.canal', [0, -9, -1])); r.push([1.8, 1.8]);
  pts.push(A('L2.canal', [0, 4, -2])); r.push([0.7, 0.7]);
  return { pts, r, up: [0, 0, -1], color: 0xf0e6c8, seg: 6 };
}

export function filumDef() {
  return { pts: [A('L2.canal', [0, 4, -2]), A('L3.canal', [0, 0, -3]), A('L5.canal', [0, 0, -3]), A('sacrum.canalTop', [0, -14, 6])], r: [0.5, 0.5], up: [0, 0, -1], color: 0xf0e6c8 };
}

export function duraDef() {
  const lv = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];
  const pts = [A('skull.foramenMagnum', [0, 6, 0])], r = [[12, 10]];
  for (const v of lv) {
    pts.push(A(v + '.canal', [0, 0, v[0] === 'T' ? 0.8 : 0]));
    r.push(v[0] === 'C' ? [9.5, 7] : v[0] === 'T' ? [7.4, 6.6] : [9.2, 7.2]);
  }
  pts.push(A('sacrum.canalTop', [0, -10, 4])); r.push([7, 5]);
  pts.push(A('sacrum.canalTop', [0, -26, 10])); r.push([2.5, 2.2]);
  return { pts, r, up: [0, 0, -1], color: 0xc9d6e2, seg: 5 };
}

// Raíz con trayecto: médula/cono → canal → receso lateral → foramen (ganglio) → salida
function lumbarRoot(name, s, order) {
  const x = s === 'L' ? 1 : -1;
  const k = LUMBAR.indexOf(name);
  const pts = [A('L1.canal', [x * (1.2 + order * 0.35), -6 - order * 0.4, -1.5])];
  const r = [[1.1, 1.1]];
  // desciende por el canal hasta el nivel de su vaina dural (un nivel por encima de su foramen)
  for (let j = 1; j < k; j++) {
    pts.push(A(LUMBAR[j] + '.canal', [x * (2.5 + order * 0.55 + j * 0.4), 0, -1.5 - order * 0.25]));
    r.push([1.25, 1.25]);
  }
  if (k >= 1) {
    pts.push(A(name + '.canal', [x * 6.5, 9, 1]));
    r.push([1.5, 1.4]);
  }
  pts.push(A(name + '.recess' + s, [0, 0, 1])); r.push([1.7, 1.6]);
  pts.push(A(name + '.pedBot' + s, [-x * 1, -3.2, 3.5])); r.push([2.2, 2]);
  pts.push(A(name + '.foramen' + s, [x * 1, 0, 2])); r.push([3.6, 3]); // ganglio de la raíz dorsal
  pts.push(A(name + '.foramen' + s, [x * 11, -7, 12])); r.push([2.3, 2.1]);
  // continuación hacia su plexo (L1: iliohipogástrico; L2: se une al femoral)
  if (name === 'L1') { pts.push(A('L2.lat' + s, [x * 34, -6, 24])); r.push([1.8, 1.7]); pts.push(A('L3.body', [x * 92, -10, 40])); r.push([1.5, 1.4]); pts.push(A('pelvis.crest2' + s, [-x * 4, 12, 18])); r.push([1.2, 1.2]); }
  if (name === 'L2') { pts.push(A('L3.lat' + s, [x * 22, 0, 18])); r.push([2, 1.9]); pts.push(A('L4.lat' + s, [x * 24, -4, 18])); r.push([2.2, 2]); }
  return { pts, r, up: [0, 0, -1], color: NERVE_YELLOW, seg: 6 };
}

function sacralRoot(n, s, order) {
  const x = s === 'L' ? 1 : -1;
  const pts = [A('L1.canal', [x * (1.4 + order * 0.3), -7, -2])];
  const r = [[1, 1]];
  for (let j = 1; j < 5; j++) { pts.push(A(LUMBAR[j] + '.canal', [x * (1.5 + order * 0.6), 0, -3 - order * 0.3])); r.push([1.15, 1.15]); }
  pts.push(A('sacrum.canalTop', [x * (3 + order), -4 - n * 6, 3 + n * 2])); r.push([1.3, 1.3]);
  pts.push(A(`sacrum.aforS${n}${s}`, [-x * 3, 4, -10])); r.push([2.8, 2.5]);
  pts.push(A(`sacrum.aforS${n}${s}`, [x * 1, -1, 2])); r.push([2, 1.8]);
  pts.push(A(`sacrum.aforS${n}${s}`, [x * 12, -6, 12])); r.push([1.9, 1.8]);
  return { pts, r, up: [0, 0, -1], color: NERVE_YELLOW, seg: 5 };
}

function thoracicRoot(k, s) {
  const x = s === 'L' ? 1 : -1;
  const v = 'T' + k;
  const pts = [A(v + '.canal', [x * 3.5, 1, 1]), A(v + '.foramen' + s, [0, 0, 1]), A(v + '.foramen' + s, [x * 8, -2, -2])];
  const r = [[1.1, 1.1], [2.6, 2.3], [1.6, 1.6]];
  const rib = `rib${s}${k}`;
  for (const lm of ['angle', 'postLat', 'lat', 'antLat']) { pts.push(A(`${rib}.${lm}`, [0, -7, 3])); r.push([1.3, 1.2]); }
  return { pts, r, up: [0, 1, 0], color: NERVE_YELLOW, seg: 4 };
}

function cervicalRoot(k, s) {
  const x = s === 'L' ? 1 : -1;
  if (k === 8) {
    return { pts: [A('C7.canal', [x * 4, -6, 1]), A('C7.foramenBelow' + s, [0, 0, 1]), A('C7.foramenBelow' + s, [x * 14, -6, 6]), A('clavicle' + s + '.mid', [-x * 6, -22, -18])], r: [[1.3, 1.3], [2.8, 2.6], [2.4, 2.2], [2.2, 2.2]], up: [0, 0, -1], color: NERVE_YELLOW };
  }
  const v = 'C' + Math.max(k, 2);
  if (k === 1) {
    return { pts: [A('C1.canal', [x * 4, 8, 2]), A('C1.postArch' + s, [0, 6, 2]), A('C1.postArch' + s, [x * 6, 9, -10])], r: [[1, 1], [1.6, 1.6], [1, 1]], up: [0, 0, -1], color: NERVE_YELLOW };
  }
  const pts = [A(v + '.canal', [x * 4, 6, 1]), A(v + '.foramen' + s, [0, 0, 1]), A(v + '.tpTip' + s, [x * 4, 4, -1])];
  const r = [[1.3, 1.3], [2.6, 2.4], [2.2, 2]];
  if (k >= 5) { pts.push(A('clavicle' + s + '.mid', [-x * (14 - (k - 5) * 3), -14 - (k - 5) * 2, -16])); r.push([2.2, 2]); }
  else { pts.push(A(v + '.tpTip' + s, [x * 16, -10, 10])); r.push([1.4, 1.4]); }
  return { pts, r, up: [0, 0, -1], color: NERVE_YELLOW };
}

export function nerveCatalog() {
  const out = [];
  out.push({ id: 'cord', name: 'Médula espinal', latin: 'medulla spinalis', side: 'C', kind: 'nerve', fas: [cordDef(), filumDef()] });
  out.push({ id: 'dura', name: 'Saco dural (duramadre) y líquido cefalorraquídeo', latin: 'dura mater spinalis', side: 'C', kind: 'dura', fas: [duraDef()] });
  for (const s of ['L', 'R']) {
    const x = s === 'L' ? 1 : -1;
    const sideName = s === 'L' ? 'izquierda' : 'derecha';
    LUMBAR.forEach((n, i) => out.push({ id: `root${n}${s}`, root: n, name: `Raíz ${n} ${sideName}`, latin: `radix ${n}`, side: s, kind: 'nerve', fas: [lumbarRoot(n, s, 5 - i)] }));
    [1, 2, 3, 4].forEach((n) => out.push({ id: `rootS${n}${s}`, root: 'S' + n, name: `Raíz S${n} ${sideName}`, latin: `radix S${n}`, side: s, kind: 'nerve', fas: [sacralRoot(n, s, 4 - n)] }));
    out.push({ id: `thoracic${s}`, name: `Nervios torácicos e intercostales (${sideName})`, latin: 'nn. intercostales', side: s, kind: 'nerve', fas: Array.from({ length: 12 }, (_, i) => thoracicRoot(i + 1, s)) });
    out.push({ id: `cervical${s}`, name: `Raíces cervicales y plexo braquial (${sideName})`, latin: 'plexus brachialis', side: s, kind: 'nerve', fas: [1, 2, 3, 4, 5, 6, 7, 8].map((k) => cervicalRoot(k, s)) });
    // Nervio occipital mayor (ramo dorsal de C2)
    out.push({ id: `occipital${s}`, name: `Nervio occipital mayor (${sideName})`, latin: 'n. occipitalis major', side: s, kind: 'nerve', fas: [{ pts: [A('C2.foramen' + s, [0, 0, -2]), A('C2.spTip', [x * 16, 4, 4]), A('skull.nuchalInf' + s, [x * 6, 8, -12]), A('skull.nuchalMid' + s, [x * 4, 30, -10])], r: [[1.4, 1.4], [1.5, 1.5], [1.3, 1.3], [1, 1]], up: [0, 0, -1], color: NERVE_YELLOW }] });
    // Tronco lumbosacro y nervio ciático (L4–S3)
    const exit = 'pelvis.sciaticExit' + s;
    const sciatic = {
      pts: [
        A('sacrum.aforS2' + s, [x * 22, -6, 14]),
        A(exit, [x * 6, 8, 6]),
        A(exit, [x * 4, -6, -6]),
        A('femur' + s + '.GTpost', [-x * 30, -26, -14]),
        A('femur' + s + '.asperaUp', [-x * 6, 0, -26]),
        A('femur' + s + '.asperaMid', [-x * 6, 0, -28]),
        A('femur' + s + '.popliteal', [0, 0, 0]),
      ],
      r: [[5, 3.4], [7, 3.6], [7.5, 3.6], [6.5, 3.6], [5.5, 3.6], [5, 3.6], [4.5, 3.4]], up: [0, 0, -1], color: NERVE_YELLOW, seg: 8,
    };
    const trunk = { pts: [A('L4.foramen' + s, [x * 11, -7, 12]), A('L5.foramen' + s, [x * 13, -6, 14]), A('sacrum.alaTop' + s, [-x * 8, -6, 18]), A('sacrum.aforS1' + s, [x * 18, -8, 14]), A('sacrum.aforS2' + s, [x * 22, -6, 14])], r: [[2.4, 2.2], [3.2, 3], [3.6, 3.2], [4.2, 3.4], [5, 3.4]], up: [0, 0, 1], color: NERVE_YELLOW };
    out.push({ id: `sciatic${s}`, name: `Nervio ciático y tronco lumbosacro (${sideName})`, latin: 'n. ischiadicus', side: s, kind: 'nerve', fas: [sciatic, trunk] });
    // Femoral (L2–L4) y obturador
    const femoral = { pts: [A('L3.foramen' + s, [x * 12, -8, 12]), A('L4.lat' + s, [x * 24, -4, 18]), A('L5.lat' + s, [x * 32, -10, 22]), A('pelvis.iliopectineal' + s, [x * 20, 14, 2]), A('femur' + s + '.head', [x * 4, -40, 46]), A('femur' + s + '.head', [x * 12, -120, 40])], r: [[2.4, 2.2], [3, 2.8], [3.4, 3], [3.6, 2.8], [3.2, 2.4], [2.6, 2]], up: [0, 0, 1], color: NERVE_YELLOW };
    const obtur = { pts: [A('L4.lat' + s, [x * 22, -6, 16]), A('L5.lat' + s, [x * 18, -14, 12]), A('sacrum.ala1' + s, [-x * 4, -14, 30]), A('pelvis.obturator' + s, [-x * 8, 14, 0]), A('pelvis.obturator' + s, [x * 4, -10, 10])], r: [[1.8, 1.8], [2, 2], [2, 2], [2, 2], [1.6, 1.6]], up: [0, 0, 1], color: NERVE_YELLOW };
    out.push({ id: `femoral${s}`, name: `Nervios femoral y obturador (${sideName})`, latin: 'n. femoralis, n. obturatorius', side: s, kind: 'nerve', fas: [femoral, obtur] });
    // Ramos mediales de los ramos dorsales lumbares: inervan facetas y multífido
    const med = [];
    for (let i = 0; i < 4; i++) {
      const v = LUMBAR[i], w = LUMBAR[i + 1];
      med.push({ pts: [A(v + '.foramen' + s, [0, 0, -2]), A(w + '.tpRoot' + s, [x * 1, 6, -6]), A(w + '.mamm' + s, [-x * 3, -6, -5]), A(w + '.lam' + s, [x * 4, -6, -10])], r: [0.9, 0.9], up: [0, 0, -1], color: NERVE_YELLOW });
    }
    out.push({ id: `medialBranch${s}`, name: `Ramos mediales lumbares (${sideName})`, latin: 'rr. mediales rami dorsalis', side: s, kind: 'nerve', fas: med });
  }
  return out;
}
