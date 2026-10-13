// Tensión neural: cómo la posición de la pierna, la columna y el cuello tira de las raíces lumbares.
// El tracto raíz → ciático → tibial se comporta como un cordón continuo que primero recupera su holgura
// y luego se tensa; la tensión se transmite a las raíces L5 y S1 (y menos a L4 y S2), que se deslizan
// en el foramen. Con la raíz irritada, el umbral para sentir dolor baja: por eso la elevación de la
// pierna recta reproduce la ciática antes. Modelo didáctico: las longitudes salen de la geometría del
// modelo; la holgura y los umbrales están calibrados para reproducir el comportamiento clínico descrito.
import * as THREE from 'three';

// cuánto de la tensión del ciático llega a cada raíz
const COUPLING = { L4: 0.35, L5: 1, S1: 1, S2: 0.6, S3: 0.3 };
// Calibración (medida en este modelo): el tracto se alarga ~1,1 % a 20° de elevación, ~3,2 % a 60° y ~4 % a 80°.
// La holgura se recupera en los primeros ~20°; con una raíz irritada el dolor aparece hacia los 40°, y una raíz
// sana no llega a doler en todo el recorrido (solo tiran los isquiotibiales). En cadáveres, las raíces apenas se
// desplazan antes de ~60° (Gilbert et al., Spine 2007): la tensión precede al deslizamiento.
export const SLACK = 0.012;
const GAIN = 1.6;
export const ROOT_THRESHOLD = { healthy: 0.06, irritated: 0.015 }; // tensión de la raíz a partir de la cual duele

export class NeuralModel {
  constructor(app) {
    this.app = app;
    this.chain = { L: 0, R: 0 }; // deformación del tracto ciático-tibial (longitud actual / reposo − 1)
    this.fibChain = { L: 0, R: 0 };
    this.cord = 0;
    this.tension = {}; // 'L5L' → tensión transmitida
    this.enabled = true;
  }

  items() {
    if (this._items) return this._items;
    const n = this.app.nerves;
    this._items = {
      sciatic: { L: n.find((x) => x.id === 'sciaticL'), R: n.find((x) => x.id === 'sciaticR') },
      cord: n.find((x) => x.id === 'cord'),
      roots: n.filter((x) => x.root && COUPLING[x.root] !== undefined),
    };
    return this._items;
  }

  // se llama después de registry.update() (longitudes geométricas ya calculadas)
  update() {
    const it = this.items();
    for (const side of ['L', 'R']) {
      const sc = it.sciatic[side];
      if (!sc) continue;
      const [main, , tibial, fibular] = sc.strands;
      const dl = (st) => (st ? st.len - st.restLen : 0);
      const rl = (st) => (st ? st.restLen : 0);
      this.chain[side] = (dl(main) + dl(tibial)) / Math.max(1, rl(main) + rl(tibial));
      this.fibChain[side] = (dl(main) + dl(fibular)) / Math.max(1, rl(main) + rl(fibular));
    }
    this.cord = it.cord ? Math.max(0, it.cord.strands[0].strain) : 0;
    for (const r of it.roots) {
      const side = r.side, other = side === 'L' ? 'R' : 'L';
      const own = Math.max(0, Math.max(this.chain[side], this.fibChain[side] * 0.6) - SLACK);
      // elevación de la pierna contraria: arrastra el saco dural; tira más de la raíz cuando la hernia es grande
      const big = ['extrusion', 'sequestration'].includes(this.app.compression?.[r.root + side]?.hern);
      const cross = Math.max(0, this.chain[other] - SLACK) * (big ? 0.5 : 0.3);
      const t = this.enabled ? COUPLING[r.root] * GAIN * (own + cross) + 0.5 * this.cord : 0;
      this.tension[r.root + side] = t;
      for (const s of r.strands) s.tension = t;
    }
  }

  // carga mecánica total sobre la raíz: su propio estiramiento (flexión de la columna) + la tensión transmitida
  load(root, side) {
    const r = this.items().roots.find((x) => x.root === root && x.side === side);
    if (!r) return 0;
    return Math.max(0, r.strands[0].strain) + (this.tension[root + side] || 0);
  }

  // umbral de dolor de la raíz: más bajo cuanto más irritada (compresión e inflamación)
  threshold(root, side) {
    const c = this.app.compression?.[root + side]?.idx || 0;
    const inflam = this.app.rootIrritation?.[root + side] || 0;
    const irr = THREE.MathUtils.clamp(Math.max(c * 1.6, inflam), 0, 1);
    return THREE.MathUtils.lerp(ROOT_THRESHOLD.healthy, ROOT_THRESHOLD.irritated, irr);
  }
}
