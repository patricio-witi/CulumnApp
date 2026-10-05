// Resolución de puntos de anclaje anatómicos: 'L4.spTip', 'pelvis.PSISL', 'ribL12.mid12', etc.
import * as THREE from 'three';
import { rigBoneFor } from '../core/bones.js';

export class AnchorResolver {
  constructor(rig, bonesJson) {
    this.rig = rig;
    this.recs = Object.fromEntries(bonesJson.bones.map((b) => [b.name, b]));
  }
  rec(mesh) {
    const r = this.recs[mesh];
    if (!r) throw new Error('Malla desconocida: ' + mesh);
    return r;
  }
  // Devuelve { bone, rest: Vector3 (coordenadas de reposo del rig), local: Vector3 (en el hueso del rig) }
  resolve(spec) {
    if (spec && spec.isResolved) return spec;
    let mesh, key, offset = [0, 0, 0], raw = null, space = 'local';
    if (typeof spec === 'string') [mesh, key] = spec.split('.');
    else {
      ({ offset = [0, 0, 0], space = 'local' } = spec);
      if (spec.at) [mesh, key] = spec.at.split('.');
      else { mesh = spec.mesh; raw = spec.p; }
      if (spec.via) {
        const a = this.resolve(spec.via[0]), b = this.resolve(spec.via[1]);
        const t = spec.via[2] ?? 0.5;
        const bone = spec.bone || (t < 0.5 ? a.bone : b.bone);
        const rest = a.rest.clone().lerp(b.rest, t).add(new THREE.Vector3(...offset));
        return this._make(bone, rest);
      }
      if (spec.lerp) {
        const a = this.resolve(spec.lerp[0]), b = this.resolve(spec.lerp[1]);
        const t = spec.lerp[2] ?? 0.5;
        const bone = t < 0.5 ? a.bone : b.bone;
        const rest = a.rest.clone().lerp(b.rest, t).add(new THREE.Vector3(...offset));
        return this._make(bone, rest);
      }
    }
    const rec = this.rec(mesh);
    const bone = rigBoneFor(rec);
    let p;
    if (raw) p = raw;
    else {
      p = rec.landmarks[key];
      if (!p) throw new Error(`Landmark ${mesh}.${key} no existe`);
    }
    const local = new THREE.Vector3(...p);
    if (space === 'local') local.add(new THREE.Vector3(...offset));
    let rest;
    if (rec.frame === 'world') rest = local.clone();
    else rest = local.clone().applyMatrix4(this.rig.restWorld[bone]);
    if (space === 'world') rest.add(new THREE.Vector3(...offset));
    return this._make(bone, rest);
  }
  _make(bone, rest) {
    return { isResolved: true, bone, rest, local: rest.clone().applyMatrix4(this.rig.restInv[bone]) };
  }
  // dirección local de un hueso → dirección en reposo del rig
  restDir(bone, d) {
    const m = new THREE.Matrix3().setFromMatrix4(this.rig.restWorld[bone]);
    return new THREE.Vector3(...d).applyMatrix3(m).normalize();
  }
}

// Espejo izquierda↔derecha de una especificación de anclaje
export function mirrorSpec(spec) {
  const swapKey = (s) => {
    let [mesh, key] = s.split('.');
    mesh = mesh.replace(/^(rib|scapula|clavicle|humerus|femur|tibia|foot|forearm|hand)L/, '$1§').replace(/^(rib|scapula|clavicle|humerus|femur|tibia|foot|forearm|hand)R/, '$1L').replace('§', 'R');
    if (key) key = key.replace(/L$/, '§').replace(/R$/, 'L').replace('§', 'R');
    return key ? mesh + '.' + key : mesh;
  };
  if (typeof spec === 'string') return swapKey(spec);
  const o = { ...spec };
  if (o.at) o.at = swapKey(o.at);
  if (o.mesh) o.mesh = swapKey(o.mesh);
  if (o.p) o.p = [-o.p[0], o.p[1], o.p[2]];
  if (o.offset) o.offset = [-o.offset[0], o.offset[1], o.offset[2]];
  if (o.lerp) o.lerp = [mirrorSpec(o.lerp[0]), mirrorSpec(o.lerp[1]), o.lerp[2]];
  if (o.via) o.via = [mirrorSpec(o.via[0]), mirrorSpec(o.via[1]), o.via[2]];
  if (o.bone) o.bone = o.bone.replace(/^(shoulder|femur|tibia|foot|humerus|forearm)L$/, '$1§').replace(/^(shoulder|femur|tibia|foot|humerus|forearm)R$/, '$1L').replace('§', 'R');
  if (o.n) o.n = [-o.n[0], o.n[1], o.n[2]];
  return o;
}
