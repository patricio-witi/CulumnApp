// Esqueleto articulado: jerarquía pelvis → sacro → L5 → … → C1 → cráneo, con pivotes en cada disco.
import * as THREE from 'three';
import { VERTEBRAE, SEGMENTS, computeRestPose, DEG } from '../anatomy/spine-data.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _qa = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);
const AZ = new THREE.Vector3(0, 0, 1);

function frameMatrix(f) {
  return new THREE.Matrix4().compose(new THREE.Vector3(...f.pos), new THREE.Quaternion().setFromAxisAngle(AX, f.phi * DEG), new THREE.Vector3(1, 1, 1));
}

export class SpineRig {
  constructor() {
    this.rest = computeRestPose();
    this.root = new THREE.Group();
    this.root.name = 'rig';
    this.bones = {}; // nombre → THREE.Bone (marcos anatómicos)
    this.joints = {}; // segmento → Object3D pivote
    this.restWorld = {}; // nombre → Matrix4 en reposo (coordenadas del rig)

    // Pelvis (origen en el eje de caderas)
    const pelvis = new THREE.Bone();
    pelvis.name = 'pelvis';
    this.root.add(pelvis);
    this.bones.pelvis = pelvis;
    this.restWorld.pelvis = new THREE.Matrix4();

    // Fémures (pivote en la cabeza femoral)
    for (const [name, x] of [['femurL', 87], ['femurR', -87]]) {
      const b = new THREE.Bone();
      b.name = name;
      b.position.set(x, 0, 0);
      this.root.add(b);
      this.bones[name] = b;
      this.restWorld[name] = new THREE.Matrix4().makeTranslation(x, 0, 0);
    }

    // Sacro (marco S1)
    const s1 = new THREE.Bone();
    s1.name = 'S1';
    const mS1 = frameMatrix(this.rest.frames.S1);
    mS1.decompose(s1.position, s1.quaternion, s1.scale);
    pelvis.add(s1);
    this.bones.S1 = s1;
    this.restWorld.S1 = mS1.clone();

    // Cadena vertebral
    for (const seg of SEGMENTS) {
      const lower = this.bones[seg.lower];
      const mLo = this.restWorld[seg.lower];
      const upperName = seg.upper;
      const mUp = frameMatrix(this.rest.frames[upperName]);
      const pivotW = new THREE.Vector3(...this.rest.segs[seg.id].pivot);
      const pivotLocal = pivotW.clone().applyMatrix4(mLo.clone().invert());
      const joint = new THREE.Object3D();
      joint.name = 'joint:' + seg.id;
      joint.position.copy(pivotLocal);
      lower.add(joint);
      const mJoint = mLo.clone().multiply(new THREE.Matrix4().makeTranslation(pivotLocal.x, pivotLocal.y, pivotLocal.z));
      const local = mJoint.clone().invert().multiply(mUp);
      const b = new THREE.Bone();
      b.name = upperName;
      local.decompose(b.position, b.quaternion, b.scale);
      joint.add(b);
      joint.userData.restUpper = { p: b.position.clone(), q: b.quaternion.clone() };
      this.bones[upperName] = b;
      this.joints[seg.id] = joint;
      this.restWorld[upperName] = mUp;
    }

    // Huesos "mezclados": siguen el promedio de varias vértebras torácicas
    this.blended = {
      shoulderL: { from: ['T2', 'T3', 'T4', 'T5', 'T6'], w: [0.15, 0.25, 0.25, 0.2, 0.15] },
      shoulderR: { from: ['T2', 'T3', 'T4', 'T5', 'T6'], w: [0.15, 0.25, 0.25, 0.2, 0.15] },
      sternum: { from: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'], w: [0.08, 0.12, 0.16, 0.18, 0.18, 0.16, 0.12] },
    };
    for (const name of Object.keys(this.blended)) {
      const b = new THREE.Bone();
      b.name = name;
      this.root.add(b);
      this.bones[name] = b;
      this.restWorld[name] = new THREE.Matrix4();
    }
    this.restInv = {};
    for (const [k, m] of Object.entries(this.restWorld)) this.restInv[k] = m.clone().invert();

    this.root.updateMatrixWorld(true);
    this.boneList = Object.values(this.bones);
    this.segmentState = {};
    for (const seg of SEGMENTS) this.segmentState[seg.id] = { flex: 0, lat: 0, rot: 0, settle: 0, shift: 0 };
    this.pelvisTilt = 0; // + = anteversión (rotación anterior de la pelvis)
    this.pelvisRot = 0;
    this.pelvisList = 0;
    this.hipFlex = { L: 0, R: 0 };
    this.discLoss = {}; // segmento → mm de pérdida de altura
  }

  // matriz del rig (coordenadas locales del root) de un hueso
  rigMatrix(name, target = new THREE.Matrix4()) {
    const b = this.bones[name];
    // root.matrixWorld puede no ser identidad; calculamos relativo al root
    target.copy(this.root.matrixWorld).invert().multiply(b.matrixWorld);
    return target;
  }

  applyPose() {
    // Pelvis: rotación alrededor del eje bicoxofemoral
    const pel = this.bones.pelvis;
    pel.quaternion.setFromAxisAngle(AX, this.pelvisTilt * DEG);
    _qa.setFromAxisAngle(AY, -this.pelvisRot * DEG);
    pel.quaternion.premultiply(_qa);
    _qa.setFromAxisAngle(AZ, this.pelvisList * DEG);
    pel.quaternion.premultiply(_qa);
    for (const side of ['L', 'R']) {
      this.bones['femur' + side].quaternion.setFromAxisAngle(AX, -this.hipFlex[side] * DEG);
    }
    for (const seg of SEGMENTS) {
      const j = this.joints[seg.id];
      const st = this.segmentState[seg.id];
      // flexión (X), inclinación lateral (Z, + = derecha), rotación axial (Y, + = derecha)
      _q.setFromAxisAngle(AX, st.flex * DEG);
      _qa.setFromAxisAngle(AZ, st.lat * DEG);
      _q.premultiply(_qa);
      _qa.setFromAxisAngle(AY, -st.rot * DEG);
      _q.premultiply(_qa);
      j.quaternion.copy(_q);
      // asentamiento (pérdida de altura discal) y traslación lateral
      const ur = j.userData.restUpper;
      const b = this.bones[seg.upper];
      const loss = (this.discLoss[seg.id] || 0) + (st.settle || 0);
      b.position.copy(ur.p);
      b.position.y -= loss * 0.98;
      b.position.x += st.shift || 0;
    }
    this.root.updateMatrixWorld(true);
    this.updateBlended();
  }

  updateBlended() {
    const rootInv = _m.copy(this.root.matrixWorld).invert();
    for (const [name, cfg] of Object.entries(this.blended)) {
      // promedio de las transformaciones delta (actual · reposo⁻¹)
      const pos = new THREE.Vector3();
      const q = new THREE.Quaternion(0, 0, 0, 0);
      let first = null;
      cfg.from.forEach((v, i) => {
        const cur = rootInv.clone().multiply(this.bones[v].matrixWorld);
        const delta = cur.multiply(this.restInv[v]);
        const p = new THREE.Vector3(), qq = new THREE.Quaternion(), s = new THREE.Vector3();
        delta.decompose(p, qq, s);
        if (!first) first = qq.clone();
        if (first.dot(qq) < 0) qq.set(-qq.x, -qq.y, -qq.z, -qq.w);
        pos.addScaledVector(p, cfg.w[i]);
        q.x += qq.x * cfg.w[i]; q.y += qq.y * cfg.w[i]; q.z += qq.z * cfg.w[i]; q.w += qq.w * cfg.w[i];
      });
      q.normalize();
      const b = this.bones[name];
      b.position.copy(pos);
      b.quaternion.copy(q);
      b.updateMatrixWorld(true);
    }
  }

  worldPoint(boneName, local, target = new THREE.Vector3()) {
    return target.set(local[0], local[1], local[2]).applyMatrix4(this.bones[boneName].matrixWorld);
  }
  // punto dado en coordenadas de reposo del rig → posición actual
  restPointToWorld(boneName, restPos, target = new THREE.Vector3()) {
    return target.copy(restPos).applyMatrix4(this.restInv[boneName]).applyMatrix4(this.bones[boneName].matrixWorld);
  }
}

export const RIG_ORDER = ['pelvis', 'S1', ...VERTEBRAE, 'skull'];
