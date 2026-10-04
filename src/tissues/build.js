// Construcción genérica de tejidos (ligamentos, nervios) a partir de catálogos ya lateralizados
import * as THREE from 'three';
import { tissueMaterial } from './materials.js';

export function buildTissueSet(registry, catalog, kindDefault) {
  const out = [];
  const mats = {};
  const matFor = (kind) => {
    if (mats[kind]) return mats[kind];
    if (kind === 'dura') {
      const m = tissueMaterial('fascia', { transparent: true, opacity: 0.28, depthWrite: false, color: 0xd7e4f0 });
      m.side = THREE.FrontSide;
      return (mats[kind] = m);
    }
    if (kind === 'capsule') return (mats[kind] = tissueMaterial('ligament', { transparent: true, opacity: 0.55, depthWrite: false }));
    return (mats[kind] = tissueMaterial(kind === 'nerve' ? 'nerve' : 'ligament'));
  };
  for (const item of catalog) {
    const kind = item.kind || (item.group === 'capsule' ? 'capsule' : kindDefault);
    const strands = [];
    for (const f of item.fas) {
      try { strands.push(registry.build(f)); } catch (e) { console.warn(item.id, e.message); }
    }
    if (!strands.length) continue;
    const mesh = registry.mesh(strands, matFor(kind), { radial: kind === 'nerve' ? 7 : 8, step: kind === 'dura' ? 8 : 6, castShadow: kind !== 'dura' && kind !== 'capsule' });
    mesh.name = item.id;
    if (kind === 'dura' || kind === 'capsule') mesh.renderOrder = 2;
    const rec = { ...item, kind: kind === 'dura' || kind === 'capsule' ? kind : kindDefault === 'ligament' ? 'ligament' : 'nerve', key: item.id, mesh, strands };
    mesh.userData.item = rec;
    out.push(rec);
  }
  return out;
}
