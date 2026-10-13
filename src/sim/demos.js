// Demostraciones de cuerpo entero para la sección "Mi caso": examen neurológico, marcha, tareas de la mañana,
// estar sentado y la espondilolistesis en flexión y extensión. Usan el mismo motor que los ejercicios.
// Los ángulos de la marcha siguen las curvas clásicas de cadera, rodilla y tobillo; la actividad muscular de
// la marcha sigue el patrón EMG descrito en los textos de análisis de la marcha (intensidades ilustrativas).

const TAU = Math.PI * 2;
// campana periódica en la fase del ciclo
export const bump = (t, c, w) => { let d = Math.abs(t - c); d = Math.min(d, 1 - d); return Math.exp(-((d / w) ** 2)); };

// ángulos de una pierna en su propia fase (0 = apoyo del talón)
function leg(t, mode) {
  let hip = 10 + 20 * Math.cos(TAU * t); // ~30° al apoyar el talón, ~−10° al despegar
  let knee = 4 + 14 * bump(t, 0.14, 0.07) + 56 * bump(t, 0.72, 0.11);
  let ank = -6 * bump(t, 0.07, 0.05) + 9 * bump(t, 0.42, 0.13) - 17 * bump(t, 0.62, 0.06) + 2 * bump(t, 0.86, 0.08);
  if (mode === 'heels') { ank = 22; knee += 4; hip *= 0.75; } // sobre los talones: punta del pie arriba todo el ciclo
  if (mode === 'toes') { ank = -32 + 4 * Math.cos(TAU * t); knee = 6 + 30 * bump(t, 0.72, 0.12); hip *= 0.7; } // de puntillas
  return { hip, knee, ank };
}

function gaitPose(ph, mode) {
  const R = leg(ph, mode), L = leg((ph + 0.5) % 1, mode);
  const c = Math.cos(TAU * ph), s = Math.sin(TAU * ph);
  return {
    hipR: R.hip, kneeR: R.knee, ankR: R.ank, hipL: L.hip, kneeL: L.knee, ankL: L.ank,
    // brazos en oposición a las piernas
    shFR: 3 - 15 * c, shFL: 3 + 15 * c, shAL: 6, shAR: 6, elbR: 16 + 7 * (1 + c), elbL: 16 + 7 * (1 - c),
    // pelvis: rota hacia delante con la pierna que avanza y cae del lado que oscila; el tórax contrarrota
    pelRot: -4 * c, thoRot: 3 * c, pelList: -3 * s, lumLat: 2.5 * s,
    neck: -4, act: 1,
  };
}

// actividad muscular de la marcha según la fase de cada pierna (0 = apoyo del talón de ese lado)
const GAIT_MUSCLES = [
  { id: 'gmax', lv: 1, fn: (t) => 0.35 * bump(t, 0.05, 0.08) + 0.15 * bump(t, 0.96, 0.04) },
  { id: 'gmed', lv: 1, fn: (t) => 0.42 * bump(t, 0.16, 0.12) },
  { id: 'hamstrings', lv: 1, fn: (t) => 0.38 * bump(t, 0.92, 0.07) + 0.22 * bump(t, 0.03, 0.05) },
  { id: 'quadriceps', lv: 1, fn: (t) => 0.35 * bump(t, 0.08, 0.07) + 0.12 * bump(t, 0.95, 0.04) },
  { id: 'tibAnt', lv: 1, fn: (t) => 0.4 * bump(t, 0.03, 0.05) + 0.25 * bump(t, 0.75, 0.14) },
  { id: 'ehl', lv: 1, fn: (t) => 0.3 * bump(t, 0.03, 0.05) + 0.2 * bump(t, 0.75, 0.14) },
  { id: 'gastroc', lv: 1, fn: (t) => 0.55 * bump(t, 0.42, 0.11) },
  { id: 'soleus', lv: 1, fn: (t) => 0.5 * bump(t, 0.38, 0.13) },
  { id: 'psoas', lv: 1, fn: (t) => 0.3 * bump(t, 0.62, 0.08) },
  { id: 'iliacus', lv: 1, fn: (t) => 0.28 * bump(t, 0.62, 0.08) },
  // erectores: dos descargas por ciclo, en cada apoyo de talón
  { id: 'longLumb', lv: 1, fn: (t) => 0.3 * bump(t, 0.02, 0.06) + 0.22 * bump(t, 0.52, 0.06) },
  { id: 'iliocLumb', lv: 1, fn: (t) => 0.26 * bump(t, 0.02, 0.06) + 0.2 * bump(t, 0.52, 0.06) },
  { id: 'multifidus', lv: 1, fn: (t) => 0.28 * bump(t, 0.02, 0.06) + 0.2 * bump(t, 0.52, 0.06) },
  { id: 'eo', lv: 1, fn: (t) => 0.12 + 0.06 * Math.cos(TAU * t) },
  { id: 'io', lv: 1, fn: (t) => 0.12 - 0.06 * Math.cos(TAU * t) },
];

const HEEL_MUSCLES = [
  { id: 'tibAnt', lv: 1, fn: () => 0.85 }, { id: 'ehl', lv: 1, fn: () => 0.7 },
  ...GAIT_MUSCLES.filter((m) => !['tibAnt', 'ehl', 'gastroc', 'soleus'].includes(m.id)),
];
const TOE_MUSCLES = [
  { id: 'gastroc', lv: 1, fn: (t) => 0.7 + 0.2 * bump(t, 0.4, 0.2) }, { id: 'soleus', lv: 1, fn: (t) => 0.75 + 0.15 * bump(t, 0.4, 0.2) },
  ...GAIT_MUSCLES.filter((m) => !['tibAnt', 'ehl', 'gastroc', 'soleus'].includes(m.id)),
];

export function gaitDemo(mode = 'normal') {
  return {
    id: 'gait-' + mode,
    name: mode === 'heels' ? 'Caminar sobre los talones' : mode === 'toes' ? 'Caminar de puntillas' : 'Caminar',
    period: mode === 'normal' ? 1.1 : 1.3,
    fn: (ph) => gaitPose(ph, mode),
    cam: [mode === 'normal' ? 20 : 35, 8],
    muscles: mode === 'heels' ? HEEL_MUSCLES : mode === 'toes' ? TOE_MUSCLES : GAIT_MUSCLES,
    layers: { muscles: [2, 3, 7, 8], skin: true },
  };
}

// Elevación de la pierna recta (Lasègue): el examinador sube la pierna con la rodilla extendida.
// `cross`: se eleva la pierna sana (prueba cruzada).
export function slrDemo(side = 'L', cross = false) {
  const leg = cross ? (side === 'L' ? 'R' : 'L') : side;
  const k = (o) => Object.fromEntries(Object.entries(o).map(([key, v]) => [key.replace('§', leg), v]));
  return {
    id: cross ? 'slr-cross' : 'slr',
    name: cross ? 'Elevación de la pierna recta cruzada' : 'Elevación de la pierna recta',
    side, leg, test: 'slr',
    cam: [leg === 'L' ? 0 : 180, 14],
    keys: [
      { d: 0, hold: 0.6, pose: k({ body: [-90, 0, 0], 'hip§': 0, shAL: 10, shAR: 10, act: 0.05, 'ank§': -8 }) },
      { d: 5.5, hold: 1.4, pose: k({ 'hip§': 82 }) },
      { d: 2.4, hold: 0.8, pose: k({ 'hip§': 0 }) },
    ],
    muscles: [],
    layers: { muscles: [7, 8], nerves: true, skin: true },
  };
}

// Slump: sentado, se suman flexión de la columna, del cuello, extensión de rodilla y del tobillo
export function slumpDemo(side = 'L') {
  return {
    id: 'slump', name: 'Prueba de slump', side, leg: side, test: 'slump', stool: true,
    cam: [side === 'L' ? 0 : 180, 10],
    keys: [
      { d: 0, hold: 0.6, pose: { post: { sit: 1, slump: 0 }, kneeL: 90, kneeR: 90, shFL: 20, shFR: 20, elbL: 60, elbR: 60, act: 0.1 } },
      { d: 2, hold: 0.5, pose: { post: { sit: 1, slump: 1 }, lum: 10, tho: 14 } },
      { d: 1.6, hold: 0.5, pose: { neck: 38 } },
      { d: 2.2, hold: 1.2, pose: { ['knee' + side]: 12, ['ank' + side]: 12 } },
      { d: 1.4, hold: 1, pose: { neck: -10 } }, // al extender el cuello el síntoma neural baja
      { d: 2, hold: 0.6, pose: { post: { sit: 1, slump: 0 }, lum: 0, tho: 0, neck: 0, ['knee' + side]: 90, ['ank' + side]: 0 } },
    ],
    muscles: [{ id: 'quadriceps', lv: 0.4, lat: 'only' }],
    layers: { muscles: [8], nerves: true, skin: true },
  };
}

// Abducción de cadera de lado (fuerza del glúteo medio: raíz L5)
export function hipAbdDemo(side = 'L') {
  const top = side; // de lado sobre el lado contrario, la pierna de arriba es la que se examina
  const rz = top === 'L' ? 90 : -90;
  return {
    id: 'hipabd', name: 'Abducción de cadera (glúteo medio, L5)', side, cam: [90, 20],
    keys: [
      { d: 0, hold: 0.5, pose: { body: [0, 0, rz], ['abd' + (top === 'L' ? 'R' : 'L')]: 0, kneeL: 10, kneeR: 25, ['hip' + (top === 'L' ? 'R' : 'L')]: 20, shAL: 20, shAR: 20, elbL: 90, elbR: 90, act: 0.1, side: top } },
      { d: 1.4, hold: 1.4, pose: { ['abd' + top]: 32, act: 1 } },
      { d: 1.2, hold: 0.6, pose: { ['abd' + top]: 0, act: 0.1 } },
    ],
    muscles: [{ id: 'gmed', lv: 0.8, lat: 'only' }, { id: 'ql', lv: 0.25, lat: 'only' }],
    layers: { muscles: [3, 7], skin: true },
  };
}

// Reflejo rotuliano (L4): sentado con las piernas colgando, golpe en el tendón y breve extensión
export function kneeReflexDemo(side = 'L') {
  return {
    id: 'knee-reflex', name: 'Reflejo rotuliano (L4)', side, stool: true, cam: [side === 'L' ? 10 : 170, 6],
    keys: [
      { d: 0, hold: 1, pose: { post: { sit: 1, slump: 0 }, kneeL: 90, kneeR: 90, ankL: -10, ankR: -10, shFL: 10, shFR: 10, elbL: 40, elbR: 40, act: 0.05, side } },
      { d: 0.12, hold: 0.05, pose: { ['knee' + side]: 68, act: 1 } },
      { d: 0.35, hold: 1.2, pose: { ['knee' + side]: 90, act: 0.05 } },
    ],
    muscles: [{ id: 'quadriceps', lv: 0.9, lat: 'only' }],
    layers: { muscles: [8], nerves: true, skin: true },
  };
}

// Ponerse los calcetines al levantarse: (A) doblando la columna; (B) pie sobre la rodilla contraria, espalda neutra
export function socksDemo(mode = 'flex') {
  const base = { post: { sit: 1, slump: 0 }, kneeL: 90, kneeR: 90, shFL: 10, shFR: 10, elbL: 30, elbR: 30, act: 0.1 };
  if (mode === 'flex') {
    return {
      id: 'socks-flex', name: 'Calcetines doblando la espalda', stool: true, cam: [-20, 10], measure: 'lumbar',
      keys: [
        { d: 0, hold: 0.6, pose: base },
        { d: 1.8, hold: 2.2, pose: { post: { sit: 1, slump: 1 }, lum: 16, tho: 18, neck: 22, hipR: 18, kneeR: 112, ankR: 6, shFL: 62, shFR: 66, elbL: 12, elbR: 12, act: 0.35 } },
        { d: 1.6, hold: 0.6, pose: base },
      ],
      muscles: [{ id: 'longLumb', lv: 0.3, lat: 'both' }, { id: 'iliocLumb', lv: 0.25, lat: 'both' }],
      layers: { muscles: [2, 3], skin: true },
    };
  }
  return {
    id: 'socks-hinge', name: 'Calcetines con el pie sobre la rodilla', stool: true, cam: [-20, 10], measure: 'lumbar',
    keys: [
      { d: 0, hold: 0.6, pose: base },
      { d: 1.8, hold: 2.2, pose: { pel: 14, lum: 0, tho: 4, neck: 10, hipR: 14, abdR: 34, hrotR: 46, kneeR: 120, ankR: -6, shFL: 46, shFR: 40, elbL: 50, elbR: 46, act: 0.3 } },
      { d: 1.6, hold: 0.6, pose: base },
    ],
    muscles: [{ id: 'longLumb', lv: 0.25, lat: 'both' }, { id: 'multifidus', lv: 0.25, lat: 'both' }],
    layers: { muscles: [2, 3], skin: true },
  };
}

// Sentado: erguido → encorvado mantenido → pararse y extender
export function sittingDemo() {
  return {
    id: 'sitting', name: 'Sentado mucho rato y la pausa', stool: true, cam: [0, 8], measure: 'lumbar',
    keys: [
      { d: 0, hold: 1.2, pose: { post: { sit: 1, slump: 0 }, kneeL: 90, kneeR: 90, shFL: 30, shFR: 30, elbL: 80, elbR: 80, act: 0.1 } },
      { d: 2.2, hold: 3, pose: { post: { sit: 1, slump: 1 }, tho: 6, neck: 14 } },
      { d: 2.4, hold: 1.4, pose: { post: { sit: 0, slump: 0 }, kneeL: 0, kneeR: 0, tho: 0, neck: 0, shFL: -30, shFR: -30, shAL: 20, shAR: 20, elbL: 95, elbR: 95 } },
      { d: 1.4, hold: 1.4, pose: { lum: -14, tho: -6, neck: -8, act: 0.3 } },
      { d: 1.2, hold: 0.6, pose: { lum: 0, tho: 0, neck: 0 } },
      { d: 2.4, hold: 0.4, pose: { post: { sit: 1, slump: 0 }, kneeL: 90, kneeR: 90, shFL: 30, shFR: 30, shAL: 0, shAR: 0, elbL: 80, elbR: 80, act: 0.1 } },
    ],
    muscles: [{ id: 'longLumb', lv: 0.3, lat: 'both' }, { id: 'multifidus', lv: 0.3, lat: 'both' }, { id: 'rectus', lv: 0.2, lat: 'both' }],
    layers: { muscles: [2, 3], skin: true },
  };
}

// Espondilolistesis: de pie en flexión y extensión, y acostado (como en la resonancia)
export function listhesisDemo(mode = 'standing') {
  if (mode === 'lying') {
    return {
      id: 'listhesis-lying', name: 'De pie y acostado', cam: [0, 4],
      keys: [
        { d: 0, hold: 1.6, pose: { body: [0, 0, 0] } },
        { d: 2.6, hold: 2.4, pose: { body: [-90, 0, 0] } },
        { d: 2.6, hold: 0.8, pose: { body: [0, 0, 0] } },
      ],
      muscles: [], layers: { muscles: [], nerves: true },
    };
  }
  return {
    id: 'listhesis-flex', name: 'Flexión y extensión de pie', cam: [0, 4],
    keys: [
      { d: 0, hold: 1, pose: { shFL: 4, shFR: 4 } },
      { d: 2.2, hold: 1.4, pose: { pel: 34, lum: 34, tho: 12, neck: 14, shFL: 30, shFR: 30 } },
      { d: 2, hold: 0.4, pose: { pel: 0, lum: 0, tho: 0, neck: 0, shFL: 4, shFR: 4 } },
      { d: 1.8, hold: 1.4, pose: { pel: -6, lum: -16, tho: -6, neck: -10, shFL: -20, shFR: -20, shAL: 18, shAR: 18, elbL: 90, elbR: 90 } },
      { d: 1.8, hold: 0.4, pose: { pel: 0, lum: 0, tho: 0, neck: 0, shFL: 4, shFR: 4, shAL: 0, shAR: 0, elbL: 0, elbR: 0 } },
    ],
    muscles: [], layers: { muscles: [], nerves: true },
  };
}
