// Ejercicios animados de cuerpo entero. Cada ejercicio es una secuencia de poses (ángulos articulares en grados)
// que se interpolan en bucle. El cuerpo se apoya en el suelo buscando el punto más bajo de la piel.
// Las activaciones musculares son publicadas cuando hay EMG verificable (se indica la fuente) y cualitativas en el resto.
import * as THREE from 'three';
import { SEGMENTS, DEG } from '../anatomy/spine-data.js';
import { LUMBAR_SEGS, THORACIC_SEGS, CERVICAL_SEGS, DEFAULT_STATE } from './posture.js';

const SEG = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]));
export const FLOOR_Y = -935;

// pose base de cuerpo entero (todos los valores en grados)
const BASE = {
  body: [0, 0, 0], lum: 0, tho: 0, neck: 0, lumLat: 0, thoLat: 0, lumRot: 0, thoRot: 0, pel: 0,
  hipL: 0, hipR: 0, abdL: 0, abdR: 0, hrotL: 0, hrotR: 0, kneeL: 0, kneeR: 0, ankL: 0, ankR: 0,
  shFL: 0, shFR: 0, shAL: 0, shAR: 0, elbL: 0, elbR: 0, armComp: 0, act: 0.2, side: null, post: null,
};

// posturas de partida reutilizables
const QUAD = { armComp: 1, body: [80, 0, 0], hipL: 80, hipR: 80, kneeL: 90, kneeR: 90, ankL: -35, ankR: -35, shFL: 80, shFR: 80, shAL: 4, shAR: 4, elbL: 0, elbR: 0, neck: -8 };
const SUPINE_HOOK = { body: [-90, 0, 0], hipL: 45, hipR: 45, kneeL: 97, kneeR: 97, ankL: -38, ankR: -38, shAL: 18, shAR: 18, elbL: 10, elbR: 10 };
const PRONE = { body: [90, 0, 0], ankL: -40, ankR: -40, shFL: 0, shFR: 0, shAL: 70, shAR: 70, elbL: 115, elbR: 115, neck: -6 };
const STAND = { body: [0, 0, 0] };

// Fuentes cortas usadas en las fichas
const SRC = {
  ekstrom: 'Ekstrom et al., JOSPT 2007 (EMG de superficie, 30 adultos sanos)',
  okubo: 'Okubo et al., JOSPT 2010 (EMG de aguja)',
  mcgillPT: 'McGill, Phys Ther 1998; Axler y McGill, Med Sci Sports Exerc 1997',
  qual: 'estimación cualitativa (patrón descrito en la literatura, sin cifra verificada)',
};

// muscles: id del catálogo, nivel (0–1), lado: 'both' | 'same' (lado de la pierna que trabaja / lado de apoyo) | 'opp'
export const EXERCISES = [
  {
    id: 'catcamel', school: 'McGill', name: 'Gato–camello', latin: 'cat–camel',
    goal: 'Movilizar la columna con muy poca carga, como “aceite para las bisagras”.',
    how: ['En cuadrupedia, manos bajo los hombros y rodillas bajo las caderas.', 'Lleva la espalda hacia arriba (gato) llevando la cabeza hacia abajo, y luego deja que baje (camello) mirando ligeramente al frente.', 'Movimiento lento y suave, sin forzar el final del rango.'],
    dose: '5–8 ciclos lentos, como preparación. McGill insiste en que es para mover, no para estirar.',
    caution: 'Con un disco irritable, mantente en el rango que no aumente el dolor ni lo lleve a la pierna. Si la flexión periferializa, reduce el arco hacia esa dirección.',
    load: 'Carga muy baja según McGill; no encontré una cifra de compresión verificada.',
    cam: [0, 14], arms: true,
    keys: [
      { d: 0, pose: { ...QUAD } },
      { d: 2.4, hold: 0.4, pose: { lum: 20, tho: 14, neck: 8, act: 0.18 } },
      { d: 2.4, hold: 0.4, pose: { lum: -14, tho: -16, neck: -22, act: 0.15 } },
    ],
    muscles: [['rectus', 0.2, 'both'], ['eo', 0.15, 'both'], ['multifidus', 0.15, 'both'], ['longLumb', 0.15, 'both'], ['iliocLumb', 0.12, 'both']].map(([id, lv, lat]) => ({ id, lv, lat, src: SRC.qual })),
  },
  {
    id: 'curlup', school: 'McGill', name: 'Curl-up modificado', latin: 'modified curl-up',
    goal: 'Entrenar la resistencia del recto del abdomen y los oblicuos sin flexionar la columna lumbar.',
    how: ['Boca arriba, una rodilla doblada y la otra pierna estirada.', 'Manos bajo la zona lumbar para conservar su curva natural (no la aplastes contra el suelo).', 'Levanta solo un poco la cabeza y los hombros, como un bloque: el cuello no se dobla. Mantén unos segundos y baja.', 'Cambia la pierna doblada entre series.'],
    dose: 'Mantenciones de ~10 s en “pirámide invertida” (por ejemplo 5-3-1 repeticiones en series sucesivas, con descansos breves). Las cifras exactas varían entre fuentes (también se ve 6-4-2).',
    caution: 'El movimiento es mínimo: el objetivo es la contracción, no la altura. Evita la abdominal clásica, que flexiona la columna bajo carga.',
    load: 'Compresión L4-L5 publicada: ~1990 N, frente a 3350 N del abdominal con rodillas dobladas y 3506 N con piernas rectas (McGill 1998; cifras tomadas de fuentes secundarias).',
    compression: 1991,
    cam: [0, 22], arms: true,
    keys: [
      { d: 0, pose: { ...SUPINE_HOOK, hipR: 0, kneeR: 0, ankR: -20, shFL: -8, shFR: -8, shAL: 12, shAR: 12, elbL: 35, elbR: 35, act: 0.12 } },
      { d: 1.4, hold: 2.6, pose: { tho: 14, act: 1 } },
      { d: 1.2, hold: 0.8, pose: { tho: 0, act: 0.12 } },
    ],
    muscles: [['rectus', 0.6, 'both'], ['eo', 0.4, 'both'], ['io', 0.35, 'both'], ['ta', 0.2, 'both']].map(([id, lv, lat]) => ({ id, lv, lat, src: SRC.qual })),
  },
  {
    id: 'sidebridge', school: 'McGill', name: 'Plancha lateral (puente lateral)', latin: 'side bridge',
    goal: 'Resistencia del cuadrado lumbar y los oblicuos del lado de apoyo, con carga moderada sobre la columna.',
    how: ['De lado, apoyado en el antebrazo (codo bajo el hombro) y en las rodillas (versión inicial) o en los pies (avanzada).', 'Eleva la pelvis hasta que hombros, cadera y rodillas queden en línea.', 'Mantén y baja con control. Repite del otro lado.'],
    dose: 'Mantenciones de ~10 s en pirámide invertida. Empezar con apoyo en rodillas.',
    caution: 'Si el hombro duele, hay variantes contra la pared. Mantén la pelvis alineada: no la lleves hacia atrás.',
    load: 'McGill lo propone porque activa mucho el cuadrado lumbar con compresión moderada; las cifras de compresión que encontré no son lo bastante sólidas para mostrarlas.',
    cam: [90, 12], arms: true,
    keys: [
      { d: 0, pose: { body: [0, 0, 88], hipL: 25, hipR: 25, kneeL: 95, kneeR: 95, ankL: -20, ankR: -20, shAR: 84, elbR: 90, shFL: 0, shAL: 8, elbL: 70, lumLat: -10, thoLat: -6, act: 0.15, side: 'R' } },
      { d: 1.4, hold: 2.6, pose: { body: [0, 0, 72], shAR: 68, lumLat: 0, thoLat: 0, act: 1 } },
      { d: 1.3, hold: 0.8, pose: { body: [0, 0, 88], shAR: 84, lumLat: -10, thoLat: -6, act: 0.15 } },
    ],
    muscles: [
      { id: 'gmed', lv: 0.74, lat: 'same', src: SRC.ekstrom + ': 74 ± 30 % MVIC' },
      { id: 'ql', lv: 0.6, lat: 'same', src: SRC.qual },
      { id: 'eo', lv: 0.55, lat: 'same', src: SRC.qual },
      { id: 'io', lv: 0.5, lat: 'same', src: SRC.qual },
      { id: 'longLumb', lv: 0.3, lat: 'same', src: SRC.qual },
      { id: 'rectus', lv: 0.25, lat: 'both', src: SRC.qual },
    ],
  },
  {
    id: 'birddog', school: 'McGill', name: 'Perro de caza (bird dog)', latin: 'bird dog',
    goal: 'Coordinar extensores de cadera y espalda con el tronco quieto, con carga moderada.',
    how: ['En cuadrupedia, columna neutra.', 'Extiende a la vez el brazo y la pierna contrarios hasta la horizontal, sin girar la pelvis ni arquear la zona lumbar.', 'Mantén, vuelve y cambia de lado. McGill sugiere cerrar el puño y contraer, o “barrer” el suelo al volver.'],
    dose: 'Mantenciones de ~10 s en pirámide invertida, alternando lados.',
    caution: 'Si la pelvis rota o la espalda se arquea, reduce: solo la pierna o solo el brazo.',
    load: 'Compresión L4-L5 publicada: ~3000 N con brazo y pierna, menos con solo la pierna (McGill 1998; fuentes secundarias).',
    compression: 3000,
    cam: [0, 14], arms: true,
    keys: [
      { d: 0, pose: { ...QUAD, act: 0.2 } },
      { d: 1.4, hold: 2.4, pose: { hipR: -8, kneeR: 0, ankR: -10, shFL: 168, act: 1, side: 'R' } },
      { d: 1.2, hold: 0.5, pose: { ...QUAD, act: 0.2, side: null } },
      { d: 1.4, hold: 2.4, pose: { hipL: -8, kneeL: 0, ankL: -10, shFR: 168, act: 1, side: 'L' } },
      { d: 1.2, hold: 0.5, pose: { ...QUAD, act: 0.2, side: null } },
    ],
    muscles: [
      { id: 'gmax', lv: 0.56, lat: 'same', src: SRC.ekstrom + ': 56 % MVIC' },
      { id: 'multifidus', lv: 0.46, lat: 'both', src: SRC.ekstrom + ': 46 ± 21 % MVIC' },
      { id: 'longThor', lv: 0.36, lat: 'both', src: SRC.ekstrom + ': longísimo torácico 36 ± 18 % MVIC' },
      { id: 'longLumb', lv: 0.36, lat: 'both', src: SRC.ekstrom + ' (longísimo)' },
      { id: 'hamstrings', lv: 0.35, lat: 'same', src: SRC.qual },
      { id: 'trapezius', lv: 0.35, lat: 'opp', src: SRC.qual },
      { id: 'gmed', lv: 0.3, lat: 'opp', src: SRC.qual },
    ],
  },
  {
    id: 'hinge', school: 'McGill', name: 'Bisagra de cadera', latin: 'hip hinge',
    goal: 'Aprender a agacharse doblando las caderas y no la columna lumbar.',
    how: ['De pie, rodillas ligeramente flexionadas, manos sobre los muslos.', 'Lleva la pelvis hacia atrás como para cerrar una puerta con los glúteos; el tronco se inclina con la espalda neutra.', 'Vuelve empujando el suelo y contrayendo glúteos.'],
    dose: 'Series cortas de técnica (por ejemplo 5–10 repeticiones), antes de aplicarla a levantar objetos.',
    caution: 'Mira la pestaña Movimiento: con 15 kg, la espalda redonda flexiona mucho más la columna lumbar que la bisagra.',
    load: 'Depende de la carga y de la distancia del objeto al cuerpo. Usa el gesto “Bisagra de cadera” en Movimiento para comparar.',
    cam: [0, 10], arms: true,
    keys: [
      { d: 0, pose: { ...STAND, shFL: 6, shFR: 6, elbL: 8, elbR: 8, act: 0.1 } },
      { d: 1.8, hold: 1.2, pose: { pel: 52, lum: 6, tho: 4, neck: -12, hipL: 16, hipR: 16, kneeL: 32, kneeR: 32, ankL: 16, ankR: 16, shFL: 40, shFR: 40, elbL: 6, elbR: 6, act: 0.8 } },
      { d: 1.6, hold: 0.8, pose: { pel: 0, lum: 0, tho: 0, neck: 0, hipL: 0, hipR: 0, kneeL: 0, kneeR: 0, ankL: 0, ankR: 0, shFL: 6, shFR: 6, elbL: 8, elbR: 8, act: 0.1 } },
    ],
    muscles: [['gmax', 0.5, 'both'], ['hamstrings', 0.55, 'both'], ['longLumb', 0.45, 'both'], ['iliocLumb', 0.4, 'both'], ['multifidus', 0.4, 'both'], ['longThor', 0.35, 'both']].map(([id, lv, lat]) => ({ id, lv, lat, src: SRC.qual })),
  },
  {
    id: 'pressup', school: 'McKenzie', name: 'Extensión en prono (press-up)', latin: 'prone press-up',
    goal: 'Extensión lumbar repetida con los brazos y la espalda relajada; en la clínica se usa para buscar centralización.',
    how: ['Boca abajo, manos a la altura de los hombros.', 'Empuja con los brazos dejando la pelvis y la zona lumbar relajadas y apoyadas.', 'Sube hasta donde lo permita el dolor, pausa y baja. La progresión habitual es: tumbado boca abajo, luego apoyado en codos, luego con brazos estirados.'],
    dose: 'Series de ~10 repeticiones varias veces al día, según la respuesta del síntoma (es la lógica del método McKenzie).',
    caution: 'Detente si el dolor baja por la pierna (periferializa). Con un lateral shift marcado, McKenzie corrige primero el shift y después extiende. En estenosis o facetas irritadas la extensión puede empeorar.',
    load: 'No encontré cifras de compresión verificadas para este ejercicio.',
    cam: [0, 12], arms: true,
    keys: [
      { d: 0, pose: { ...PRONE, act: 0.05 } },
      { d: 2.0, hold: 1.2, pose: { body: [70, 0, 0], hipL: -20, hipR: -20, lum: -17, tho: -18, neck: -14, shFL: 28, shFR: 28, shAL: 14, shAR: 14, elbL: 18, elbR: 18, act: 0.25 } },
      { d: 1.8, hold: 0.8, pose: { ...PRONE, hipL: 0, hipR: 0, lum: 0, tho: 0, act: 0.05 } },
    ],
    muscles: [['latissimus', 0.25, 'both'], ['trapezius', 0.2, 'both'], ['longLumb', 0.08, 'both'], ['multifidus', 0.08, 'both']].map(([id, lv, lat]) => ({ id, lv, lat, src: SRC.qual })),
    notModeled: 'El trabajo lo hacen sobre todo tríceps, pectoral y deltoides, que no están en el modelo. La espalda debe quedar relajada.',
  },
  {
    id: 'standext', school: 'McKenzie', name: 'Extensión de pie', latin: 'standing extension',
    goal: 'Versión de la extensión que se puede hacer en cualquier parte, por ejemplo tras estar sentado.',
    how: ['De pie, pies separados, manos en la zona lumbar con los dedos hacia abajo.', 'Inclínate hacia atrás usando las manos como punto de apoyo, con las rodillas rectas.', 'Mantén un instante y vuelve.'],
    dose: '~10 repeticiones, según respuesta.',
    caution: 'Igual que el press-up: detente si el dolor baja a la pierna.',
    load: 'Sin cifras verificadas.',
    cam: [0, 8], arms: true,
    keys: [
      { d: 0, pose: { ...STAND, shFL: -38, shFR: -38, shAL: 22, shAR: 22, elbL: 100, elbR: 100, act: 0.1 } },
      { d: 1.8, hold: 1, pose: { lum: -16, tho: -10, pel: -6, neck: -10, act: 0.3 } },
      { d: 1.6, hold: 0.8, pose: { lum: 0, tho: 0, pel: 0, neck: 0, act: 0.1 } },
    ],
    muscles: [['rectus', 0.25, 'both'], ['eo', 0.2, 'both'], ['longLumb', 0.2, 'both'], ['multifidus', 0.2, 'both']].map(([id, lv, lat]) => ({ id, lv, lat, src: SRC.qual })),
  },
  {
    id: 'glide', school: 'McKenzie', name: 'Corrección del shift contra la pared', latin: 'side glide',
    goal: 'Corregir el desplazamiento lateral del tronco llevando la pelvis bajo los hombros.',
    how: ['De pie, de lado a una pared, con el hombro del lado al que se desplazaron los hombros apoyado y el codo doblado contra el cuerpo.', 'Con la otra mano en la cresta ilíaca, empuja la pelvis hacia la pared lentamente.', 'Mantén unos segundos, vuelve, repite. Después suele añadirse extensión de pie.'],
    dose: 'Repeticiones lentas, con varias series al día, según respuesta.',
    caution: 'En el único ensayo aleatorizado (n = 40), corregir el shift lo hizo desaparecer mejor que el control a 90 días, pero <strong>no mejoró más la discapacidad</strong> (Gillan et al., Eur Spine J 1998). Si el dolor de pierna aumenta, detente.',
    load: 'Sin cifras verificadas.',
    cam: [-90, 6], arms: true,
    keys: [
      { d: 0, pose: { ...STAND, post: { shift: 0.75, shiftKyphosis: 0.5 }, shAR: 4, elbR: 95, shFL: -15, shAL: 30, elbL: 95, act: 0.3 } },
      { d: 2.4, hold: 1.4, pose: { post: { shift: -0.1, shiftKyphosis: 0.15 }, act: 0.5 } },
      { d: 2.0, hold: 0.6, pose: { post: { shift: 0.75, shiftKyphosis: 0.5 }, act: 0.3 } },
    ],
    muscles: [['ql', 0.4, 'both'], ['eo', 0.35, 'both'], ['io', 0.3, 'both'], ['gmed', 0.35, 'both'], ['multifidus', 0.3, 'both']].map(([id, lv, lat]) => ({ id, lv, lat, src: SRC.qual })),
  },
  {
    id: 'bridge', school: 'Estabilización y otros', name: 'Puente de glúteos', latin: 'glute bridge',
    goal: 'Extensores de cadera con la columna neutra.',
    how: ['Boca arriba con las rodillas dobladas y los pies apoyados.', 'Eleva la pelvis empujando con los talones hasta alinear rodillas, caderas y hombros, sin arquear la zona lumbar.', 'Mantén y baja con control.'],
    dose: '8–12 repeticiones o mantenciones de 10 s.',
    caution: 'Si notas la zona lumbar trabajando más que los glúteos, sube menos.',
    load: 'Sin cifras de compresión verificadas.',
    cam: [0, 16], arms: true,
    keys: [
      { d: 0, pose: { ...SUPINE_HOOK, act: 0.1 } },
      { d: 1.6, hold: 1.8, pose: { body: [-112, 0, 0], hipL: 4, hipR: 4, kneeL: 104, kneeR: 104, ankL: -14, ankR: -14, act: 1 } },
      { d: 1.4, hold: 0.7, pose: { ...SUPINE_HOOK, act: 0.1 } },
    ],
    muscles: [
      { id: 'gmax', lv: 0.5, lat: 'both', src: SRC.qual },
      { id: 'hamstrings', lv: 0.45, lat: 'both', src: SRC.qual },
      { id: 'multifidus', lv: 0.4, lat: 'both', src: SRC.okubo + ': el multífido alcanzó su mayor activación en el puente' },
      { id: 'longLumb', lv: 0.3, lat: 'both', src: SRC.qual },
      { id: 'gmed', lv: 0.25, lat: 'both', src: SRC.qual },
    ],
  },
  {
    id: 'deadbug', school: 'Estabilización y otros', name: 'Bicho muerto (dead bug)', latin: 'dead bug',
    goal: 'Mover brazos y piernas mientras el tronco se mantiene estable.',
    how: ['Boca arriba, caderas y rodillas a 90° y brazos hacia el techo.', 'Extiende lentamente el brazo y la pierna contrarios sin que la zona lumbar se despegue ni se arquee.', 'Vuelve y cambia de lado.'],
    dose: '6–10 repeticiones lentas por lado.',
    caution: 'Si la zona lumbar se arquea, extiende menos la pierna.',
    load: 'No encontré estudios de EMG ni de compresión específicos de este ejercicio; las activaciones son cualitativas.',
    cam: [0, 18], arms: true,
    keys: [
      { d: 0, pose: { body: [-90, 0, 0], hipL: 90, hipR: 90, kneeL: 90, kneeR: 90, shFL: 90, shFR: 90, act: 0.35 } },
      { d: 1.6, hold: 1, pose: { hipR: 12, kneeR: 8, shFL: 168, act: 0.8, side: 'R' } },
      { d: 1.4, hold: 0.4, pose: { hipR: 90, kneeR: 90, shFL: 90, act: 0.35, side: null } },
      { d: 1.6, hold: 1, pose: { hipL: 12, kneeL: 8, shFR: 168, act: 0.8, side: 'L' } },
      { d: 1.4, hold: 0.4, pose: { hipL: 90, kneeL: 90, shFR: 90, act: 0.35, side: null } },
    ],
    muscles: [['rectus', 0.5, 'both'], ['eo', 0.45, 'both'], ['io', 0.4, 'both'], ['ta', 0.35, 'both'], ['psoas', 0.35, 'same'], ['iliacus', 0.3, 'same']].map(([id, lv, lat]) => ({ id, lv, lat, src: SRC.qual })),
  },
  {
    id: 'plank', school: 'Estabilización y otros', name: 'Plancha frontal', latin: 'front plank',
    goal: 'Resistencia de la pared abdominal.',
    how: ['Apoyado en antebrazos y puntas de los pies, cuerpo en línea recta.', 'Aprieta abdomen y glúteos (“bracing”), sin hundir ni elevar la pelvis.', 'Mantén y descansa.'],
    dose: 'Mantenciones cortas (~10 s) repetidas, mejor que una sola larga con mala técnica.',
    caution: 'Si la pelvis se hunde, apoya las rodillas.',
    load: 'Sin cifras de compresión verificadas. El transverso alcanzó su mayor activación en una variante de plancha con brazo y pierna contrarios elevados (Okubo et al. 2010).',
    cam: [0, 10], arms: true,
    keys: [
      { d: 0, pose: { body: [90, 0, 0], ankL: -40, ankR: -40, shFL: 70, shFR: 70, elbL: 95, elbR: 95, act: 0.1, neck: -6 } },
      { d: 1.4, hold: 3, pose: { body: [78, 0, 0], ankL: -10, ankR: -10, shFL: 78, shFR: 78, elbL: 90, elbR: 90, act: 1 } },
      { d: 1.2, hold: 0.8, pose: { body: [90, 0, 0], ankL: -40, ankR: -40, shFL: 70, shFR: 70, elbL: 95, elbR: 95, act: 0.1 } },
    ],
    muscles: [
      { id: 'rectus', lv: 0.55, lat: 'both', src: SRC.qual },
      { id: 'eo', lv: 0.5, lat: 'both', src: SRC.qual },
      { id: 'io', lv: 0.45, lat: 'both', src: SRC.qual },
      { id: 'ta', lv: 0.4, lat: 'both', src: SRC.okubo + ' (transverso, variante con brazo y pierna)' },
      { id: 'gmax', lv: 0.2, lat: 'both', src: SRC.qual },
    ],
  },
  {
    id: 'slider', school: 'Neural', name: 'Deslizamiento del nervio ciático', latin: 'sciatic nerve slider',
    goal: 'Mover el nervio ciático a lo largo de su trayecto sin tensarlo: se estira por un extremo mientras se afloja por el otro.',
    how: ['Sentado, espalda cómoda.', 'Estira la rodilla mientras llevas la cabeza hacia atrás (mirar arriba).', 'Dobla la rodilla mientras llevas la barbilla al pecho.', 'Movimiento suave y rítmico, sin llegar a reproducir el dolor.'],
    dose: '10–15 repeticiones suaves; según respuesta.',
    caution: 'Es un deslizador, no un tensor: no combines extender la rodilla con flexionar el cuello. Si aumenta el hormigueo o el dolor en la pierna, reduce el rango.',
    load: 'Evidencia: en dolor lumbar crónico, la movilización neural mejoró la discapacidad (−9,3 puntos en una escala de 0–50) y el dolor (−1,8 sobre 10) frente a comparadores (Basson et al., JOSPT 2017; 40 estudios). En radiculopatía lumbar, un metaanálisis de 20 ensayos encontró efectos grandes, pero con estudios pequeños y muy heterogéneos (Lin et al., Life 2023).',
    cam: [0, 8], arms: false, side: 'L', stool: true,
    keys: [
      { d: 0, pose: { post: { sit: 1, slump: 0.2 }, kneeL: 90, kneeR: 90, neck: 0, shFL: 30, shFR: 30, elbL: 70, elbR: 70, act: 0.2 } },
      { d: 1.8, hold: 0.5, pose: { kneeL: 15, ankL: 10, neck: -30, act: 0.5 } },
      { d: 1.8, hold: 0.5, pose: { kneeL: 95, ankL: 0, neck: 30, act: 0.2 } },
    ],
    muscles: [['hamstrings', 0.15, 'same'], ['psoas', 0.25, 'same'], ['iliacus', 0.25, 'same']].map(([id, lv, lat]) => ({ id, lv, lat, src: SRC.qual })),
    notModeled: 'El cuádriceps, que extiende la rodilla, no está en el modelo.',
  },
];

// compresión L4-L5 publicada para comparar (McGill 1998; Axler y McGill 1997), vía fuentes secundarias
export const PUBLISHED_COMPRESSION = [
  ['Curl-up', 1991], ['Perro de caza (brazo y pierna)', 3000], ['Abdominal con rodillas dobladas', 3350], ['Abdominal con piernas rectas', 3506], ['“Superman” boca abajo', 6000],
];

function distribute(out, ids, total, key) {
  if (!total) return;
  const romKey = key === 'flex' ? (total > 0 ? 'flex' : 'ext') : key;
  const ws = ids.map((id) => SEG[id].rom[romKey] || 0);
  const sum = ws.reduce((a, b) => a + b, 0) || 1;
  ids.forEach((id, i) => {
    const r = SEG[id].rom[romKey] || 0;
    out[id][key] += THREE.MathUtils.clamp(total * (ws[i] / sum), -r * 1.05, r * 1.05);
  });
}

export class ExerciseController {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.ex = null;
    this.t0 = 0;
    this.paused = false;
    this.pose = { ...BASE };
    // muestra de vértices de piel para apoyar el cuerpo en el suelo y encuadrar la cámara
    const skin = app.skin?.mesh;
    this.sample = [];
    if (skin) {
      const n = skin.geometry.attributes.position.count;
      for (let i = 0; i < 900; i++) this.sample.push(Math.floor((i * 7919.37) % n));
    }
    this.box = new THREE.Box3();
    // suelo
    const g = new THREE.CircleGeometry(1500, 64).rotateX(-Math.PI / 2);
    const m = new THREE.MeshStandardMaterial({ color: 0x8aa3a8, roughness: 1, transparent: true, opacity: 0.22, depthWrite: false });
    this.floor = new THREE.Mesh(g, m);
    this.floor.position.y = FLOOR_Y;
    this.floor.receiveShadow = true;
    this.floor.visible = false;
    this.floor.renderOrder = -1;
    const grid = new THREE.PolarGridHelper(1400, 8, 6, 64, 0x6f8a90, 0x6f8a90);
    grid.material.transparent = true; grid.material.opacity = 0.25; grid.material.depthWrite = false;
    grid.position.y = 0.5;
    this.floor.add(grid);
    app.scene.add(this.floor);
    // taburete para los ejercicios sentados
    const sm = new THREE.MeshStandardMaterial({ color: 0x9c8b78, roughness: 0.8, transparent: true, opacity: 0.55 });
    this.stool = new THREE.Mesh(new THREE.BoxGeometry(380, 1, 360), sm);
    this.stool.visible = false;
    this.stool.castShadow = true;
    app.scene.add(this.stool);
  }

  start(id) {
    const app = this.app;
    this.ex = EXERCISES.find((e) => e.id === id) || EXERCISES[0];
    this.active = true;
    this.paused = false;
    this.t0 = performance.now();
    // tiempos absolutos de cada clave
    let t = 0;
    let acc = { ...BASE, ...this.ex.keys[0].pose };
    this.track = this.ex.keys.map((k, i) => {
      if (i > 0) { acc = { ...acc, ...k.pose }; t += k.d; }
      const start = t; t += k.hold || 0;
      return { t0: start, t1: t, pose: { ...acc } };
    });
    this.period = t + (this.ex.keys[1]?.d || 1.5);
    app.posture.override = this;
    app.animator.stop();
    app.posture.set({ ...DEFAULT_STATE, gaze: 0 });
    this.floor.visible = true;
    this.stool.visible = !!this.ex.stool;
    app.plumb.visible = false;
    this.setShadowBounds(true);
    app.dirty = true;
  }

  stop() {
    const app = this.app;
    this.active = false;
    app.posture.override = null;
    app.posture.set({ ...DEFAULT_STATE });
    this.floor.visible = false;
    this.stool.visible = false;
    this.setShadowBounds(false);
    app.dirty = true;
  }

  setShadowBounds(wide) {
    const key = this.app.scene.children.find((c) => c.isDirectionalLight && c.castShadow);
    if (!key) return;
    Object.assign(key.shadow.camera, wide ? { left: -1100, right: 1100, top: 900, bottom: -1200 } : { left: -520, right: 520, top: 700, bottom: -500 });
    key.shadow.camera.updateProjectionMatrix();
  }

  time() {
    if (this.forceT !== undefined) return this.forceT;
    return this.paused ? this.pauseT : ((performance.now() - this.t0) / 1000) % this.period;
  }

  // caja que envuelve todo el ciclo, para que la cámara no corte el movimiento
  computeBounds() {
    const union = new THREE.Box3();
    for (let i = 0; i < 10; i++) {
      this.forceT = (i / 10) * this.period;
      this.app.posture.apply();
      union.union(this.box);
    }
    this.forceT = undefined;
    this.cycleBox = union;
    return union;
  }
  togglePause() {
    if (this.paused) { this.t0 = performance.now() - this.pauseT * 1000; this.paused = false; }
    else { this.pauseT = this.time(); this.paused = true; }
  }

  // pose interpolada en el instante t del ciclo
  sampleAt(t) {
    const tr = this.track;
    let i = tr.findIndex((k) => t < k.t0);
    let a, b, u;
    if (i === -1) { a = tr[tr.length - 1]; b = tr[0]; u = (t - a.t1) / Math.max(1e-3, this.period - a.t1); }
    else if (i === 0) { a = b = tr[0]; u = 1; }
    else { a = tr[i - 1]; b = tr[i]; u = t < a.t1 ? 0 : (t - a.t1) / Math.max(1e-3, b.t0 - a.t1); }
    u = THREE.MathUtils.clamp(u, 0, 1);
    const e = u * u * (3 - 2 * u);
    const p = {};
    for (const k of Object.keys(BASE)) {
      const va = a.pose[k], vb = b.pose[k];
      if (k === 'body') p.body = va.map((x, j) => x + (vb[j] - x) * e);
      else if (k === 'post') {
        p.post = null;
        if (va || vb) { p.post = {}; for (const kk of new Set([...Object.keys(va || {}), ...Object.keys(vb || {})])) { const x = va?.[kk] ?? vb[kk], y = vb?.[kk] ?? x; p.post[kk] = x + (y - x) * e; } }
      } else if (k === 'side') p.side = e < 0.5 ? a.pose.side : b.pose.side;
      else p[k] = va + (vb - va) * e;
    }
    this.phaseSide = u < 0.5 ? a.pose.side : b.pose.side;
    return p;
  }

  // llamado por PostureController.apply() antes de aplicar la pose al esqueleto
  pre(R, out) {
    const p = this.pose = this.sampleAt(this.time());
    if (p.post) Object.assign(this.app.posture.state, p.post);
    distribute(out, LUMBAR_SEGS, p.lum, 'flex');
    distribute(out, THORACIC_SEGS, p.tho, 'flex');
    distribute(out, CERVICAL_SEGS.filter((id) => id !== 'C0-C1'), p.neck * 0.75, 'flex');
    out['C0-C1'].flex += THREE.MathUtils.clamp(p.neck * 0.25, -SEG['C0-C1'].rom.ext, SEG['C0-C1'].rom.flex);
    distribute(out, LUMBAR_SEGS, p.lumLat, 'lat');
    distribute(out, THORACIC_SEGS, p.thoLat, 'lat');
    distribute(out, LUMBAR_SEGS, p.lumRot, 'rot');
    distribute(out, THORACIC_SEGS, p.thoRot, 'rot');
    R.pelvisTilt += p.pel;
    R.body.rx = p.body[0]; R.body.ry = p.body[1]; R.body.rz = p.body[2];
    R.body.x = 0; R.body.y = 0; R.body.z = 0;
    const sit = !!(p.post && p.post.sit > 0.5);
    R.hipFlex.L = (sit ? R.hipFlex.L : 0) + p.hipL; R.hipFlex.R = (sit ? R.hipFlex.R : 0) + p.hipR;
    R.hip.L.abd = p.abdL; R.hip.R.abd = p.abdR; R.hip.L.rot = p.hrotL; R.hip.R.rot = p.hrotR;
    R.knee.L = p.kneeL; R.knee.R = p.kneeR; R.ankle.L = p.ankL; R.ankle.R = p.ankR;
    // armComp: los brazos mantienen su ángulo respecto del suelo aunque el tórax se flexione (manos apoyadas)
    const comp = p.armComp * (p.lum + p.tho * 0.85);
    R.shoulder.L.flex = p.shFL + comp; R.shoulder.R.flex = p.shFR + comp; R.shoulder.L.abd = p.shAL; R.shoulder.R.abd = p.shAR;
    R.elbow.L = p.elbL; R.elbow.R = p.elbR;
  }

  // después de aplicar la pose: apoyar el punto más bajo de la piel en el suelo
  post(R) {
    const skin = this.app.skin?.mesh;
    if (!skin) return;
    const v = new THREE.Vector3();
    let minY = Infinity;
    this.box.makeEmpty();
    const pos = skin.geometry.attributes.position;
    for (const i of this.sample) {
      // getVertexPosition de SkinnedMesh ya aplica el esqueleto: partimos del atributo crudo
      v.fromBufferAttribute(pos, i);
      skin.applyBoneTransform(i, v);
      if (v.y < minY) minY = v.y;
      this.box.expandByPoint(v);
    }
    const dy = FLOOR_Y + 4 - minY;
    R.body.y = dy;
    R.applyPose();
    this.box.min.y += dy; this.box.max.y += dy;
    if (this.ex.stool) {
      const hipW = new THREE.Vector3().setFromMatrixPosition(R.bones.femurL.matrixWorld);
      const top = hipW.y - 105, hgt = top - FLOOR_Y;
      this.stool.scale.y = hgt;
      this.stool.position.set(0, FLOOR_Y + hgt / 2, hipW.z - 60);
    }
  }

  // activación muscular del ejercicio (se aplica después del modelo de pie)
  frame() {
    if (!this.active) return;
    const app = this.app, ex = this.ex, p = this.pose;
    const side = this.phaseSide || ex.side || null;
    const lvl = {};
    for (const m of ex.muscles) {
      for (const s of ['L', 'R']) {
        let k = 1;
        if (m.lat === 'same' && side) k = s === side ? 1 : 0.3;
        if (m.lat === 'opp' && side) k = s === side ? 0.3 : 1;
        lvl[m.id + s] = Math.max(lvl[m.id + s] || 0, m.lv * k * p.act);
      }
    }
    for (const mu of app.muscles) {
      const v = lvl[mu.id + mu.side] ?? 0.03;
      for (const s of mu.strands) { s.act = v; s.guard = 0; }
    }
  }

  // encuadre automático según la caja de la piel
  frameCamera(camera, free) {
    const b = this.cycleBox || this.box;
    const c = b.getCenter(new THREE.Vector3());
    const [az, el] = this.ex.cam;
    const dir = new THREE.Vector3(Math.cos(el * DEG) * Math.cos(az * DEG), Math.sin(el * DEG), Math.cos(el * DEG) * Math.sin(az * DEG));
    // proyectar las 8 esquinas sobre los ejes de la cámara para saber cuánto ocupa en pantalla
    const fwd = dir.clone().negate();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd);
    let hw = 0, hh = 0;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).sub(c);
      hw = Math.max(hw, Math.abs(p.dot(right)));
      hh = Math.max(hh, Math.abs(p.dot(up)));
    }
    const fullH = camera.view ? camera.view.fullHeight : (free?.h || 1);
    const fullW = camera.view ? camera.view.fullWidth : (free?.w || 1);
    // el campo vertical cubre toda la altura del lienzo; la zona libre es una fracción
    const fracH = free ? free.h / fullH : 1;
    const fracW = free ? free.w / fullW : 1;
    const tv = Math.tan((camera.fov * DEG) / 2);
    const th = tv * camera.aspect;
    const D = Math.max((hh + 130) / (tv * fracH), (hw + 150) / (th * fracW)) + Math.max(hw, hh) * 0.3;
    return [c.clone().addScaledVector(dir, D), c];
  }
}
