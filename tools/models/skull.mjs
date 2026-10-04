// Cráneo simplificado (marco: articulación atlanto-occipital; +Y craneal, +Z anterior)
import { U, SU, SSUB, SI, smax, sphere, ellipsoid, capsule, limb, chain, roundBox, ellCylinder, roundCone, roughen, add, mul, norm } from '../sdf.mjs';
import { Landmarks, frameY, mx } from './common.mjs';

export function buildSkull() {
  const L = new Landmarks();
  const mir = (f) => (x, y, z) => f(Math.abs(x), y, z);
  // bóveda (cáscara de ~6 mm)
  const vaultO = ellipsoid([0, 64, 6], [71, 70, 93]);
  const vaultI = ellipsoid([0, 64, 6], [64.5, 63.5, 86.5]);
  let vault = SSUB(2, vaultO, vaultI);
  // base: plano nucal inclinado y fosa media
  const baseCut = (x, y, z) => -(y + 0.36 * (z + 20) + 4);
  vault = (function (v) { return (x, y, z) => smax(v(x, y, z), z < 30 ? baseCut(x, y, z) : -(y + 14), 4); })(vault);
  // suelo de la fosa craneal posterior (porción basilar y escamas)
  const floor = SU(6,
    roundBox([0, 8, -10], [42, 6, 34], frameY(norm([0, 1, 0.3]), [0, 0, 1]), 5),
    limb([0, 4, 10], [0, 30, 40], [12, 8], [10, 7]), // clivus
    mir(ellipsoid([40, 18, 8], [20, 14, 26])), // peñascos temporales
  );
  // cara: maxilar, cigomáticos, órbitas, nariz
  const maxilla = roundBox([0, 14, 74], [33, 24, 20], frameY(norm([0, 1, -0.15]), [0, 0, 1]), 9);
  const alveolar = ellipsoid([0, -6, 70], [29, 10, 27]);
  const zyg = mir(SU(4, ellipsoid([47, 33, 72], [11, 13, 11]), limb([52, 33, 62], [63, 29, 14], [3, 5.5], [3, 5])));
  const brow = ellipsoid([0, 62, 92], [52, 14, 10]);
  const nasal = limb([0, 50, 98], [0, 30, 108], [6, 3], [9, 2.5], [0, 0, 1]);
  let face = SU(7, maxilla, alveolar, brow);
  face = SU(5, face, zyg, nasal);
  face = SSUB(3, face, mir(ellipsoid([33, 47, 96], [17, 16, 22])));
  face = SSUB(2.5, face, ellipsoid([0, 25, 104], [11, 17, 14]));
  // mandíbula
  const mand = mir(SU(4,
    chain([[0, -42, 86], [24, -36, 72], [41, -30, 44], [47, -26, 12]], [[6, 12], [5.5, 12], [5, 12], [5, 11]], [0, 1, 0], 3),
    chain([[47, -26, 12], [49, -4, 10], [49.5, 13, 9]], [[5, 13], [4.5, 12], [5, 6]], [0, 0, 1], 3),
    limb([47, -2, 18], [45, 14, 30], [3, 6], [2, 4], [0, 0, 1]),
    ellipsoid([49.5, 15, 9], [8, 5, 5]),
  ));
  const chin = ellipsoid([0, -44, 89], [14, 10, 6]);
  // dientes (incisivos/caninos/premolares/molares simplificados)
  const teeth = [];
  for (let i = 0; i < 8; i++) {
    const a = (i + 0.5) / 8;
    const ang = a * 1.35;
    const x = Math.sin(ang) * 27, z = 70 + Math.cos(ang) * 25 - a * 6;
    const r = i < 3 ? [3, 5, 2.4] : [4.2, 4.5, 4.6];
    teeth.push(ellipsoid([x, -16, z], r));
    teeth.push(ellipsoid([x * 0.96, -22, z - 2], r));
  }
  const teethF = mir(U(...teeth));
  // mastoides, cóndilos occipitales, protuberancia
  const mastoid = mir(roundCone([52, 20, -4], [50, 2, 0], 9, 4.5));
  const condyles = mir(ellipsoid([20, 1.2, -1.5], [5.6, 5, 10.5], frameY(norm([-0.25, 1, 0]), [0, 0, 1])));
  const inion = ellipsoid([0, 25, -87], [7, 5, 4]);
  const nuchal = mir(chain([[0, 27, -86], [26, 31, -78], [46, 30, -54], [54, 24, -24]], [[2.5, 2.5], [2.6, 2.6], [2.4, 2.4], [2.6, 2.6]], [0, 1, 0], 2));
  let f = SU(6, vault, floor);
  f = SU(6, f, face);
  f = SU(4, f, mastoid, condyles, inion, nuchal);
  f = U(f, mand, chin, teethF);
  // agujero magno y conductos auditivos
  f = SSUB(2, f, ellCylinder([0, 2, -8], 15, 18, 14));
  f = SSUB(1.5, f, mir(capsule([58, 22, 8], [72, 22, 8], 4.2)));
  const cart = U(mir(SI(0.5, ellipsoid([20, 1.2, -1.5], [6.2, 5.6, 11]), (x, y, z) => y - 1)));
  const sdf = roughen((x, y, z) => Math.min(f(x, y, z), cart(x, y, z) + 0.2), 0.18, 0.2);
  L.set('inion', [0, 25, -91]);
  L.setLR('nuchalMid', [24, 31, -82]);
  L.setLR('nuchalLat', [46, 30, -58]);
  L.setLR('mastoid', [51, 6, -2]);
  L.setLR('nuchalInf', [18, 14, -62]);
  L.setLR('occipLow', [10, 8, -40]);
  L.set('foramenMagnum', [0, 2, -8]);
  L.setLR('condyle', [20, -2, -1.5]);
  L.set('vertex', [0, 134, 6]);
  L.set('nasion', [0, 50, 100]);
  L.set('chin', [0, -48, 92]);
  return { sdf, cartilage: cart, landmarks: L.pts, bmin: [-80, -60, -104], bmax: [80, 140, 116], rgb: [234, 224, 203] };
}
