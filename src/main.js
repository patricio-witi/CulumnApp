import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SpineRig } from './core/rig.js';
import { loadBoneData, makeGeometry, boneMaterial, rigBoneFor, boneLabel } from './core/bones.js';
import { AnchorResolver } from './tissues/anchors.js';
import { StrandRegistry } from './tissues/strands.js';
import { tissueUniforms } from './tissues/materials.js';
import { buildMuscles } from './tissues/muscles.js';
import { buildTissueSet } from './tissues/build.js';
import { buildFascia } from './tissues/fascia.js';
import { buildSkin } from './tissues/skin.js';
import { ligamentCatalog } from './data/ligaments.js';
import { nerveCatalog } from './data/nerves.js';
import { DiscSystem } from './tissues/discs.js';
import { PostureController, PostureAnimator } from './sim/posture.js';
import { Biomech, estimateActivation, compressionIndex, affectedRoot } from './sim/biomech.js';
import { Picker } from './core/picker.js';
import { UI } from './ui/ui.js';

const SHOT = location.search.includes('shot');
const isMobile = matchMedia('(max-width: 820px)').matches || /Mobi|Android/i.test(navigator.userAgent);
const loadMsg = document.getElementById('loading-msg');
const loadBar = document.getElementById('loading-bar');
const progress = (msg, f) => { if (loadMsg) loadMsg.textContent = msg; if (loadBar) loadBar.style.width = Math.round(f * 100) + '%'; };
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

const app = { THREE, isMobile, dirty: true };
window.__app = app;

async function boot() {
  const el = document.getElementById('viewport');
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(32, el.clientWidth / el.clientHeight, 5, 20000);
  camera.position.set(-900, 520, -1250);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 330, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 60;
  controls.maxDistance = 3200;
  controls.update();
  const key = new THREE.DirectionalLight(0xfff1e0, 2.0);
  key.position.set(-700, 1100, -600);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -520, right: 520, top: 700, bottom: -500, near: 100, far: 3500 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 1.2;
  key.target.position.set(0, 250, 0);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xc6dcff, 0.7);
  fill.position.set(800, 300, 700);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(300, 600, 1200);
  scene.add(fill, rim, new THREE.HemisphereLight(0xe2eaff, 0x3a2d24, 0.45));
  Object.assign(app, { renderer, scene, camera, controls, el });

  progress('Cargando huesos…', 0.08);
  const data = await loadBoneData('assets/', (f) => progress('Cargando huesos…', 0.08 + f * 0.25));
  progress('Articulando la columna…', 0.35);
  await nextFrame();
  const rig = new SpineRig();
  scene.add(rig.root);
  const items = [];
  const bones = {};
  for (const rec of data.json.bones) {
    if (!rec.vertexCount) continue;
    const g = makeGeometry(rec, data.bin);
    const mat = boneMaterial();
    const mesh = new THREE.Mesh(g, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = rec.name;
    const bname = rigBoneFor(rec);
    if (rec.frame === 'world') { mesh.matrixAutoUpdate = false; mesh.matrix.copy(rig.restInv[bname]); }
    rig.bones[bname].add(mesh);
    const group = /^[LTC]\d+$/.test(rec.name) ? 'vertebrae' : /pelvis|sacrum|coccyx/.test(rec.name) ? 'pelvis' : /rib|sternum/.test(rec.name) ? 'thorax' : rec.name === 'skull' ? 'skull' : 'limbs';
    const item = { kind: 'bone', key: rec.name, id: rec.name, name: boneLabel(rec.name), group, mesh, rec };
    mesh.userData.item = item;
    bones[rec.name] = item;
    items.push(item);
  }
  rig.applyPose();
  const resolver = new AnchorResolver(rig, data.json);
  const registry = new StrandRegistry(rig, resolver);
  tissueUniforms.uStrandTex.value = registry.tex;
  progress('Insertando músculos…', 0.5);
  await nextFrame();
  const muscles = buildMuscles(registry);
  for (const m of muscles) { m.group = 'muscle' + m.layer; scene.add(m.mesh); items.push(m); }
  progress('Tendiendo ligamentos y nervios…', 0.7);
  await nextFrame();
  const ligaments = buildTissueSet(registry, ligamentCatalog(), 'ligament');
  for (const l of ligaments) { l.group = 'ligaments'; scene.add(l.mesh); items.push(l); }
  const nerves = buildTissueSet(registry, nerveCatalog(), 'nerve');
  for (const n of nerves) { n.group = n.id === 'dura' ? 'dura' : /^(cord|root)/.test(n.id) ? 'neural' : 'peripheral'; scene.add(n.mesh); items.push(n); }
  const fascia = buildFascia(registry, resolver);
  for (const f of fascia) { f.group = 'fascia'; scene.add(f.mesh); items.push(f); }
  progress('Hidratando discos…', 0.82);
  await nextFrame();
  const discs = new DiscSystem(rig, data.json);
  rig.root.add(discs.group);
  for (const d of discs.discs) {
    const it = d.item;
    it.group = 'discs';
    items.push(it);
    const nIt = d.nucleus.userData.item; nIt.group = 'discs'; nIt.mesh = d.nucleus; items.push(nIt);
    const hIt = d.blob.userData.item; hIt.group = 'discs'; hIt.mesh = d.blob; items.push(hIt);
  }
  const skin = buildSkin(rig, data.json, registry);
  if (skin) { skin.group = 'skin'; scene.add(skin.mesh); items.push(skin); }
  const posture = new PostureController(rig);
  const animator = new PostureAnimator(posture);
  const biomech = new Biomech(rig, discs, registry, resolver, { muscles, nerves });
  Object.assign(app, { rig, data, items, bones, resolver, registry, muscles, ligaments, nerves, fascia, discs, skin, posture, animator, biomech });
  app.itemByKey = Object.fromEntries(items.map((i) => [i.key, i]));
  app.colorMode = 'anat';
  app.pathology = {};
  app.selected = null;
  app.compression = {};

  // ---------- simulación ----------
  app.simulate = () => {
    const info = posture.apply();
    discs.update(1);
    registry.update();
    const st = posture.state;
    const frRelax = st.sit ? 0 : THREE.MathUtils.smoothstep(st.flex, 0.62, 0.82);
    const m = biomech.compute(st, frRelax);
    const { A, frZone } = estimateActivation(info, m, st);
    for (const mu of muscles) { const v = A[mu.key] ?? 0.04; for (const s of mu.strands) s.act = v; }
    // compresión de raíces por hernias
    const comp = {};
    for (const n of nerves) if (n.root) for (const s of n.strands) s.extra = 0;
    for (const [segId, p] of Object.entries(app.pathology)) {
      if (!p || !p.hern || p.hern === 'none') continue;
      const d = discs.byId[segId];
      const root = affectedRoot(segId, p.zone);
      const sides = p.zone === 'central' ? ['L', 'R'] : [p.side];
      for (const side of sides) {
        const rootItem = nerves.find((n) => n.root === root && n.side === side);
        const strain = rootItem ? rootItem.strands[0].strain : 0;
        const fk = segId + side;
        const forCh = biomech.foramenPairs[fk] ? biomech.foramenChange(fk) : 0;
        const idx = compressionIndex(p.hern, p.zone, { push: d.state.push, foramenChange: forCh, rootStrain: strain, gradeFactor: p.zone === 'central' ? -0.35 : 0 });
        comp[root + side] = { idx, seg: segId, root, side, zone: p.zone, hern: p.hern, push: d.state.push, forCh, strain };
        if (rootItem) for (const s of rootItem.strands) s.extra = idx;
      }
    }
    app.compression = comp;
    for (const it of items) if (it.strands) { const on = it === app.selected || (app._extraHL && app._extraHL.includes(it)); for (const s of it.strands) s.hl = on ? 1 : 0; }
    registry.update();
    app.info = info;
    app.frZone = frZone;
    app.metricsDirty = true;
  };

  // ---------- capas ----------
  app.layerState = {
    vertebrae: true, pelvis: true, thorax: true, skull: true, limbs: true,
    discs: true, ligaments: true, neural: true, dura: true, peripheral: true, fascia: false, skin: false,
    muscle2: true, muscle3: true, muscle4: false, muscle5: false, muscle6: false, muscle7: false,
  };
  app.opacity = { bones: 1, muscles: 1 };
  app.isolated = null;
  app.applyLayers = () => {
    for (const it of items) {
      if (it.kind === 'nucleus' || it.kind === 'hernia') continue;
      let v = app.layerState[it.group] ?? true;
      if (app.isolated) v = it === app.isolated || it.kind === 'bone';
      it.mesh.visible = v;
    }
    discs.layerVisible = app.layerState.discs || app.isolated?.kind === 'disc';
    for (const d of discs.discs) d.nucleus.visible = discs.layerVisible && (!app.isolated || app.isolated === d.item);
    setOpacity();
    app.dirty = true;
  };
  const setOpacity = () => {
    const ob = app.opacity.bones, om = app.opacity.muscles;
    for (const it of Object.values(bones)) {
      const m = it.mesh.material;
      const t = ob < 0.99;
      if (m.transparent !== t) { m.transparent = t; m.needsUpdate = true; }
      m.opacity = ob; m.depthWrite = !t;
    }
    const mm = muscles[0]?.mesh.material;
    if (mm) {
      const t = om < 0.99;
      if (mm.transparent !== t) { mm.transparent = t; mm.needsUpdate = true; }
      mm.opacity = om; mm.depthWrite = !t;
    }
  };
  app.setDissection = (depth) => {
    for (let l = 2; l <= 7; l++) app.layerState['muscle' + l] = l <= depth && !(l === 6 && depth < 7);
    if (depth >= 7) app.layerState.muscle6 = true;
    app.applyLayers();
  };

  // ---------- color ----------
  app.setColorMode = (mode) => {
    app.colorMode = mode;
    tissueUniforms.uMode.value = mode === 'strain' ? 1 : mode === 'activity' ? 2 : 0;
    discs.pressureView = mode === 'pressure';
    app.dirty = true;
  };

  // ---------- patología ----------
  app.setPathology = (p) => {
    app.pathology = JSON.parse(JSON.stringify(p || {}));
    discs.setPathology(app.pathology);
    app.applyLayers();
    app.dirty = true;
  };

  // ---------- cortes ----------
  app.clip = { mode: 'none', level: 'L4-L5', offset: 0 };
  app.setClip = (c) => {
    Object.assign(app.clip, c);
    const { mode, level, offset } = app.clip;
    if (mode === 'none') renderer.clippingPlanes = [];
    else if (mode === 'sagittal') renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -offset)];
    else if (mode === 'coronal') renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), offset + app.spinePoint('L3').z)];
    else if (mode === 'axial') {
      const d = discs.byId[level];
      const n = new THREE.Vector3(0, 1, 0);
      const c0 = new THREE.Vector3();
      if (d) {
        const q = new THREE.Quaternion();
        rig.bones[d.lowerBone].getWorldQuaternion(q);
        const q2 = new THREE.Quaternion();
        rig.bones[d.upperBone].getWorldQuaternion(q2);
        q.slerp(q2, 0.5);
        n.set(0, 1, 0).applyQuaternion(q);
        d.mesh.geometry.computeBoundingSphere();
        c0.copy(d.mesh.geometry.boundingSphere.center).addScaledVector(n, offset);
      }
      const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(n, c0);
      renderer.clippingPlanes = [pl];
    }
  };

  // ---------- cámara ----------
  app.spinePoint = (bone, local = [0, 0, 0]) => new THREE.Vector3(...local).applyMatrix4(rig.bones[bone].matrixWorld);
  let tween = null;
  app.flyTo = (pos, target, dur = 1000) => {
    if (SHOT || matchMedia('(prefers-reduced-motion: reduce)').matches) dur = 0;
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), dur };
    if (!dur) { camera.position.copy(pos); controls.target.copy(target); tween = null; controls.update(); }
  };
  app.view = (name) => {
    if (app.dirty) { app.simulate(); app.dirty = false; }
    const P = (b, l) => app.spinePoint(b, l);
    const R = (b, l = [0, 0, 0]) => new THREE.Vector3(...l).applyMatrix4(rig.restWorld[b]);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const views = {
      postFull: () => { const t = R('T12', [0, -40, 0]); return [t.clone().add(V(-300, 160, -1850)), t]; },
      lateralFull: () => { const t = R('T12', [0, -20, 40]); return [t.clone().add(V(-2300, 160, 140)), t]; },
      lateralMotion: () => { const t = R('S1', [0, 80, 0]).add(V(0, 0, 320)); return [t.clone().add(V(-2600, 300, 180)), t]; },
      frontObl: () => { const t = R('T12', [0, -30, 30]); return [t.clone().add(V(-950, 380, 1350)), t]; },
      antFull: () => { const t = R('T12'); return [t.clone().add(V(320, 140, 1850)), t]; },
      postObl: () => { const t = R('T12', [0, 20, 0]); return [t.clone().add(V(-1080, 520, -1500)), t]; },
      lumbarPostObl: () => { const t = P('L3', [0, 0, -20]); return [t.clone().add(V(-300, 190, -420)), t]; },
      postLumbar: () => { const t = P('L2', [0, -20, -20]); return [t.clone().add(V(-80, 140, -760)), t]; },
      lumbarLat: () => { const t = P('L3', [0, 0, -10]); return [t.clone().add(V(-520, 50, 30)), t]; },
      l4Close: () => { const t = P('L4', [0, 0, -18]); return [t.clone().add(V(-230, 190, -240)), t]; },
      l45Close: () => { const t = P('L4', [0, -20, 0]); return [t.clone().add(V(-170, 80, 150)), t]; },
      l45Lat: () => { const t = P('L4', [0, -22, -6]); return [t.clone().add(V(-330, 120, 70)), t]; },
      nerveObl: () => { const t = P('L4', [0, 0, -10]); return [t.clone().add(V(-340, 180, -320)), t]; },
      axialL45: () => {
        const d = discs.byId[app.clip.mode === 'axial' ? app.clip.level : 'L4-L5'] || discs.byId['L4-L5'];
        const q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
        rig.bones[d.lowerBone].getWorldQuaternion(q); rig.bones[d.upperBone].getWorldQuaternion(q2); q.slerp(q2, 0.5);
        const n = V(0, 1, 0).applyQuaternion(q), fwd = V(0, 0, 1).applyQuaternion(q);
        d.mesh.geometry.computeBoundingSphere();
        const t = d.mesh.geometry.boundingSphere.center.clone().addScaledVector(fwd, -22);
        return [t.clone().addScaledVector(n, -330).addScaledVector(fwd, 58), t];
      },
      topDown: () => { const t = R('T8'); return [t.clone().add(V(-140, 1100, -520)), t]; },
      neck: () => { const t = P('C4'); return [t.clone().add(V(-340, 90, -300)), t]; },
      pelvis: () => { const t = R('S1', [0, -40, 0]); return [t.clone().add(V(-440, 180, -560)), t]; },
      sagittalCut: () => { const t = R('L2', [0, 0, -10]); return [t.clone().add(V(-820, 60, 40)), t]; },
    };
    const v = (views[name] || views.postObl)();
    app.flyTo(v[0], v[1]);
  };
  app.focusItem = (it) => {
    const box = new THREE.Box3();
    if (it.kind === 'bone' || it.kind === 'disc' || it.kind === 'nucleus' || it.kind === 'hernia') {
      it.mesh.geometry.computeBoundingBox();
      box.copy(it.mesh.geometry.boundingBox).applyMatrix4(it.mesh.matrixWorld);
    } else if (it.strands) {
      for (const s of it.strands) for (const a of s.anchors) box.expandByPoint(a.cur || a.rest);
    } else return;
    const c = box.getCenter(new THREE.Vector3());
    const r = Math.max(60, box.getSize(new THREE.Vector3()).length() * 0.9);
    const dir = camera.position.clone().sub(controls.target).normalize();
    app.flyTo(c.clone().addScaledVector(dir, r * 2.1), c);
  };

  // ---------- selección ----------
  const picker = new Picker(renderer, scene, camera, items);
  app.picker = picker;
  app.select = (it, { focus = false } = {}) => {
    if (app.selected?.kind === 'bone' || app.selected?.kind === 'disc') setHL(app.selected, 0);
    app.selected = it;
    if (it && (it.kind === 'bone' || it.kind === 'disc')) setHL(it, 1);
    if (it && focus) app.focusItem(it);
    app.dirty = true;
    app.ui?.showItem(it);
  };
  function setHL(it, on) {
    const u = it.mesh.material.userData.uniforms;
    if (u?.uHighlight) u.uHighlight.value.setRGB(on ? 0.28 : 0, on ? 0.18 : 0, on ? 0.03 : 0);
  }

  app.updateViewOffset = () => {
    const W = el.clientWidth, H = el.clientHeight;
    let ox = 0, oy = 0;
    const sp = document.getElementById('side').getBoundingClientRect();
    if (!matchMedia('(max-width: 820px)').matches) {
      const lp = document.getElementById('layers').getBoundingClientRect();
      const left = lp.width ? lp.right : 0, right = sp.width ? sp.left : W;
      ox = (left + right) / 2 - W / 2;
    } else {
      const top = 100, bottom = sp.height ? sp.top : H - 60;
      oy = (top + bottom) / 2 - H / 2;
    }
    app.viewOffsetX = ox;
    if (Math.abs(ox) > 1 || Math.abs(oy) > 1) camera.setViewOffset(W, H, -ox, -oy, W, H); else camera.clearViewOffset();
    document.documentElement.style.setProperty('--free-center', `${W / 2 + ox}px`);
  };
  // ---------- interfaz ----------
  app.ui = new UI(app);
  app.applyLayers();
  app.simulate();
  progress('Listo', 1);
  const loading = document.getElementById('loading');
  loading.style.opacity = '0';
  setTimeout(() => loading.remove(), 650);
  app.updateViewOffset();
  app.view('postObl');

  // ---------- bucle ----------
  let lastUI = 0;
  const loop = (now) => {
    const anim = animator.tick(now);
    if (anim || app.dirty) { app.simulate(); app.dirty = false; }
    if (app.clip.mode === 'axial' && (anim || app.metricsDirty)) app.setClip({});
    tissueUniforms.uTime.value = now / 1000;
    if (tween) {
      const u = Math.min(1, (now - tween.start) / tween.dur);
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      camera.position.lerpVectors(tween.p0, tween.p1, e);
      controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (u >= 1) tween = null;
    }
    controls.update();
    renderer.render(scene, camera);
    if (app.metricsDirty && now - lastUI > 120) { app.ui.updateMetrics(); app.metricsDirty = false; lastUI = now; }
  };
  const resize = () => {
    renderer.setSize(el.clientWidth, el.clientHeight);
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
    app.updateViewOffset();
  };
  addEventListener('resize', resize);
  app.render = () => { app.simulate(); if (app.clip.mode === 'axial') app.setClip({}); if (tween) { camera.position.copy(tween.p1); controls.target.copy(tween.t1); tween = null; } controls.update(); renderer.render(scene, camera); app.ui.syncSliders(); app.ui.updateMetrics(); };
  app.setView = (p, t) => { camera.position.set(...p); controls.target.set(...t); controls.update(); };
  if (!SHOT) renderer.setAnimationLoop(loop);
  window.__ready = true;
}

boot().catch((e) => {
  console.error(e);
  const m = document.getElementById('loading-msg');
  if (m) m.textContent = 'No se pudo iniciar el visor 3D: ' + e.message + '. Prueba con un navegador actualizado con WebGL activado.';
});
