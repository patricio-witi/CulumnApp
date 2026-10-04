// Construye las mallas musculares (izquierda y derecha) a partir del catálogo
import { mirrorSpec } from './anchors.js';
import { tissueMaterial } from './materials.js';
import { muscleCatalog } from '../data/muscles.js';

export function buildMuscles(registry) {
  const out = [];
  const mat = tissueMaterial('muscle');
  for (const mus of muscleCatalog()) {
    for (const side of ['L', 'R']) {
      const strands = [];
      for (const f of mus.fas) {
        const def = side === 'L' ? f : {
          ...f,
          pts: f.pts.map(mirrorSpec),
          up: f.up ? [-f.up[0], f.up[1], f.up[2]] : undefined,
        };
        def.color = def.color ?? mus.color ?? 0xa8362f;
        try { strands.push(registry.build(def)); } catch (e) { console.warn(mus.id, e.message); }
      }
      if (!strands.length) continue;
      const mesh = registry.mesh(strands, mat, { radial: mus.layer >= 5 ? 7 : 8, step: mus.layer >= 5 ? 9 : 6.5 });
      mesh.name = `${mus.id}${side}`;
      const item = { kind: 'muscle', id: mus.id, key: mesh.name, side, name: mus.name, latin: mus.latin, layer: mus.layer, mesh, strands };
      mesh.userData.item = item;
      out.push(item);
    }
  }
  return out;
}
