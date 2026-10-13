// Contenido de "Mi caso": hipótesis, desencadenantes, indicaciones. Las cifras provienen de resúmenes verificados;
// cuando un dato solo se encontró en una fuente secundaria se dice en el texto.

// ---------------------------------------------------------------------------------------------
// Qué te puede estar pasando: cuatro mecanismos compatibles con crisis repetidas en L4-L5
export const HYPOTHESES = [
  {
    id: 'radicular',
    title: 'Hernia o protrusión que irrita la raíz L5',
    short: 'Raíz irritada',
    what: `<p>Material del disco L4-L5 (una protrusión o una extrusión) toca la <strong>raíz L5</strong> en el receso lateral y la inflama. La raíz irritada descarga de forma anormal y el dolor se siente en la pierna, en la franja de su dermatoma: cara externa de la pierna y dorso del pie.</p>`,
    fits: `<p>En 40 operados por hernia con shift, la hernia estaba del lado convexo (el tronco se aleja de ella) en el 80 %, y la inclinación bajó de 10,7° a 2,7° tras la cirugía (Matsui, Spine 1998). Que el shift desaparezca al descomprimir sugiere que, cuando hay hernia, la raíz irritada participa en él. Pero en 100 pacientes de Porter y Miller el lado del shift no se relacionó con el lado de la ciática: el lado sirve como pista, no como diagnóstico.</p>`,
    confirm: `<ul>
      <li><strong>Elevación de la pierna recta:</strong> sensible pero poco específica (sensibilidad 0,92; especificidad 0,28). Si es negativa, una hernia que comprima es menos probable.</li>
      <li><strong>Elevación cruzada</strong> (subir la pierna sana reproduce el dolor de la otra): al revés, sensibilidad 0,28 y especificidad 0,90. Si es positiva, la hernia es bastante probable (Cochrane 2010; datos de series quirúrgicas).</li>
      <li><strong>Prueba de slump:</strong> sensibilidad 0,84 en un estudio de 75 pacientes (Majlesi 2008; dato de fuente secundaria).</li>
      <li><strong>Fuerza y reflejos:</strong> dificultad para caminar sobre los talones o levantar el dedo gordo, y debilidad para separar la cadera si es severa (L5).</li>
      <li><strong>Resonancia:</strong> debe mostrar el material tocando la raíz del <em>mismo lado y nivel</em> que tus síntomas.</li></ul>`,
    implies: `<p>Si se confirma y las crisis se repiten pese a un tratamiento bien hecho, es la situación en que la cirugía (microdiscectomía) tiene más respaldo. Ver Indicaciones, paso 6.</p>`,
    demos: ['slr', 'slrCross', 'slump', 'heels', 'hipabd'],
  },
  {
    id: 'discogenic',
    title: 'Disco fisurado doloroso (dolor discogénico)',
    short: 'Disco doloroso',
    what: `<p>El dolor nace en el propio disco: una <strong>fisura del anillo</strong> por la que crecen vasos y fibras nerviosas. En un disco sano, solo el tercio externo del anillo tiene nervios. En discos de pacientes operados por dolor crónico, las fibras llegaron al tercio interno en el 46 % de las muestras y al núcleo en el 22 %, y en ninguna muestra de control (Freemont, Lancet 1997).</p>`,
    fits: `<p>Cada carga en flexión abre la fisura y presiona fibras sensibilizadas. Una crisis aguda con defensa muscular puede producir un shift sin que haya una raíz comprimida.</p>`,
    confirm: `<ul>
      <li><strong>No hay una prueba simple.</strong></li>
      <li><strong>Centralización:</strong> frente a la discografía tuvo sensibilidad del 40 % y especificidad del 94 % (Laslett 2005; dato de fuente secundaria). Cuando el dolor centraliza con movimientos repetidos, el origen discal es más probable.</li>
      <li><strong>Resonancia:</strong> puede mostrar la fisura o cambios Modic, pero ambos aparecen también en personas sin dolor.</li></ul>`,
    implies: `<p>Ejercicio y control de la carga son la base. La fusión no fue claramente mejor que una rehabilitación intensiva con enfoque cognitivo (paso 6).</p>`,
    demos: ['fibers', 'sitting', 'socksFlex'],
  },
  {
    id: 'listhesis',
    title: 'Inestabilidad: espondilolistesis degenerativa L4-L5',
    short: 'Inestabilidad',
    what: `<p>Con la degeneración del disco y de las facetas, <strong>L4 puede deslizarse hacia delante sobre L5</strong>.</p>
      <ul><li>Es más frecuente en mujeres: 8,4 % frente a 2,7 % en hombres (Jacobsen 2007; dato de fuente secundaria).</li>
      <li>Aumenta con la edad (Kalichman, Spine 2009).</li>
      <li>L4-L5 se afecta de 6 a 9 veces más que otros niveles.</li></ul>`,
    fits: `<p>Un segmento que se desliza más al cargar puede irritar raíces y facetas una y otra vez. El deslizamiento estrecha el canal (las dos raíces L5 que bajan) y el foramen (la raíz L4 que sale), sobre todo de pie. En el modelo puedes medirlo.</p>`,
    confirm: `<ul>
      <li><strong>Síntomas típicos:</strong> pesadez o dolor en las piernas al estar de pie o caminar, que alivia al sentarse o inclinarse hacia delante. En estenosis lumbar, "sin dolor sentado" tuvo un cociente de probabilidad positivo de 7,4 y "mejora al inclinarse hacia delante" de 6,4 (Suri, JAMA 2010).</li>
      <li><strong>Radiografías de pie en flexión y extensión:</strong> buscan un deslizamiento que cambia con el movimiento. No hay consenso sobre el corte; los más usados son >3 mm o >10°.</li>
      <li><strong>La resonancia acostada puede no verla:</strong> en 416 pacientes, el 28 % de los deslizamientos vistos en radiografías dinámicas no se veía en la resonancia (Segebarth 2015).</li></ul>`,
    implies: `<p>Si hay una listesis inestable con síntomas, la conversación quirúrgica es distinta (descompresión con o sin fusión). Sin radiografías de pie, esta posibilidad no se puede descartar.</p>`,
    demos: ['listFlex', 'listLying', 'walk'],
  },
  {
    id: 'facet',
    title: 'Articulación facetaria L4-L5 inflamada',
    short: 'Faceta',
    what: `<p>La faceta es una articulación sinovial, con cápsula inervada por los ramos mediales. Con la pérdida de altura del disco carga más, y una sinovitis o una distensión de la cápsula dan dolor somático local y referido a la nalga.</p>`,
    fits: `<p>Puede dar crisis de dolor lumbar con bloqueo antiálgico. Para un shift marcado y repetido es menos típica que la hernia.</p>`,
    confirm: `<ul>
      <li><strong>Exploración:</strong> no hay signos clínicos fiables.</li>
      <li><strong>Bloqueos anestésicos:</strong> son lo que se usa para confirmar.</li>
      <li><strong>Radiofrecuencia de los ramos mediales:</strong> no mostró un beneficio clínicamente importante frente al ejercicio solo (MINT, JAMA 2017).</li></ul>`,
    implies: `<p>Ejercicio y manejo de la carga. Desconfía de procedimientos repetidos sin respaldo.</p>`,
    demos: ['facetExt'],
  },
];

// Tus síntomas → qué hipótesis apoyan (no es un diagnóstico: ayuda a preparar la consulta)
export const SYMPTOMS = [
  { id: 'legBelowKnee', label: 'El dolor baja por la pierna, por debajo de la rodilla', supports: { radicular: 'el dolor radicular suele bajar de la rodilla en una franja estrecha', listhesis: 'sobre todo si aparece en ambas piernas al caminar' } },
  { id: 'tingling', label: 'Hormigueo o adormecimiento en la pierna o el pie', supports: { radicular: 'la raíz irritada altera la sensibilidad de su dermatoma', listhesis: 'el canal estrecho comprime las raíces que bajan' } },
  { id: 'weakness', label: 'Debilidad: tropiezas con la punta del pie o te cuesta caminar sobre los talones', supports: { radicular: 'la raíz L5 mueve el tibial anterior y el extensor del dedo gordo', listhesis: 'puede comprimir las dos raíces L5' } },
  { id: 'sittingBending', label: 'Empeora sentado o al agacharte', supports: { radicular: 'la flexión empuja el núcleo hacia la hernia y tensa la raíz', discogenic: 'la flexión carga la fisura del anillo' } },
  { id: 'standingWalking', label: 'Empeora de pie o caminando y alivia al sentarte o inclinarte hacia delante', supports: { listhesis: 'es el patrón de la estenosis: en flexión el canal se agranda', facet: 'de pie, con la lordosis, las facetas cargan más' } },
  { id: 'extension', label: 'Empeora al arquear la espalda hacia atrás o al girar', supports: { facet: 'la extensión con giro comprime la faceta', listhesis: 'la extensión estrecha el canal y el foramen' } },
  { id: 'backOnly', label: 'El dolor se queda en la espalda o la nalga, sin bajar de la rodilla', supports: { discogenic: 'el dolor discal es somático referido, difuso', facet: 'el dolor facetario también es local y referido' } },
  { id: 'suddenBend', label: 'El shift aparece de golpe después de agacharte o levantar algo', supports: { radicular: 'un desplazamiento del material discal puede irritar la raíz', discogenic: 'la fisura se carga y se inflama' } },
  { id: 'mornings', label: 'Las crisis empiezan más por la mañana o tras estar mucho rato sentado', supports: { discogenic: 'el disco amanece más hidratado y soporta peor la flexión', radicular: 'la flexión mantenida empuja el núcleo hacia atrás' } },
  { id: 'centralizes', label: 'Con ciertos movimientos repetidos el dolor se retira hacia la espalda', supports: { discogenic: 'la centralización se asocia a origen discal', radicular: 'es frecuente en hernias contenidas' } },
  { id: 'bothLegs', label: 'Molestias en las dos piernas', supports: { listhesis: 'un canal estrecho afecta las raíces de ambos lados' } },
];

// Exploración neurológica (resumen de StatPearls; fuentes secundarias)
export const MYOTOMES = [
  { root: 'L4', strength: 'Extender la rodilla; subir la punta del pie', reflex: 'Rotuliano', skin: 'Cara interna de la pierna', demo: 'kneeReflex' },
  { root: 'L5', strength: 'Levantar el dedo gordo; caminar sobre los talones; separar la cadera (si es severa)', reflex: 'Sin reflejo fiable', skin: 'Cara externa de la pierna y dorso del pie', demo: 'heels' },
  { root: 'S1', strength: 'Ponerse de puntillas', reflex: 'Aquíleo', skin: 'Planta y borde externo del pie', demo: 'toes' },
];

export const DEMO_INFO = {
  slr: { title: 'Elevación de la pierna recta', text: `<p>El examinador sube tu pierna estirada.</p>
    <ul><li><strong>Primero se recupera la holgura</strong> del nervio, y luego la tensión llega a las raíces L5 y S1.</li>
    <li><strong>Raíz irritada:</strong> duele antes; en el modelo, entre los 40 y los 50° con una protrusión, y antes con una extrusión.</li>
    <li><strong>Raíz sana:</strong> no duele; solo tiran los isquiotibiales.</li></ul>
    <p>En cadáveres, las raíces apenas se desplazan antes de ~60° (Gilbert, Spine 2007). La tensión llega antes que el deslizamiento.</p>
    <p>En 12 pacientes operados, el flujo de sangre dentro de la raíz cayó entre un 40 y un 98 % en el ángulo que reproducía su ciática, y se normalizó al quitar la hernia (Kobayashi 2003).</p>
    <p><strong>Para diferenciar</strong>, sube la punta del pie o flexiona el cuello: si el síntoma aumenta, es neural. Los isquiotibiales no cambian con el cuello. Subir la punta del pie redujo en ~4–5° el ángulo al que aparecían los síntomas (Boyd 2010; dato de fuente secundaria).</p>` },
  slrCross: { title: 'Elevación cruzada', text: `<p>Se sube la pierna <strong>sana</strong>. Arrastra el saco dural y, si la hernia es grande o está en la axila de la raíz, tira de la raíz afectada (enseñanza clásica).</p>
    <p>Lo que está verificado es su precisión: especificidad 0,88–0,90 y sensibilidad ~0,28. En el modelo, solo es positiva con extrusión: cámbiala en la tarjeta de "Raíz irritada".</p>` },
  slump: { title: 'Prueba de slump', text: `<p>Sentado, se suman uno a uno: flexión del tronco, flexión del cuello, extensión de la rodilla y punta del pie arriba. Cada paso tensa más el sistema nervioso.</p>
    <p>Es positiva si reproduce <em>tu</em> dolor y si este baja al extender el cuello. Una tirantez detrás de la rodilla es normal.</p>` },
  heels: { title: 'Caminar sobre los talones (L4–L5)', text: `<p>Exige al tibial anterior y al extensor del dedo gordo, que reciben inervación de L4 y L5. Si no logras mantener la punta del pie arriba, sugiere afectación de L5 (o de L4).</p>` },
  toes: { title: 'Caminar de puntillas (S1)', text: `<p>Exige a los gemelos y al sóleo, que reciben inervación de S1. La debilidad de S1 se acompaña a menudo de un reflejo aquíleo disminuido.</p>` },
  hipabd: { title: 'Separar la cadera de lado (L5)', text: `<p>El glúteo medio recibe inervación sobre todo de L5. Su debilidad aparece en compresiones severas de L5 y hace que la pelvis caiga al caminar.</p>` },
  kneeReflex: { title: 'Reflejo rotuliano (L4)', text: `<p>Un golpe en el tendón bajo la rótula estira el cuádriceps, y la médula responde con una contracción breve.</p>
    <p>Si L4 está comprimida, el reflejo se debilita. L5 no tiene un reflejo fiable. S1 se explora con el aquíleo.</p>` },
  walk: { title: 'Caminar', text: `<p>Caminar es la intervención con mejor respaldo concreto para prevenir recaídas (WalkBack, Lancet 2024). El modelo usa las curvas clásicas de cadera, rodilla y tobillo.</p>
    <p>Los erectores y el multífido se activan dos veces por ciclo, en cada apoyo del talón. El glúteo medio sostiene la pelvis en el apoyo.</p>
    <p>Con una estenosis por listesis, caminar de pie mucho rato puede dar pesadez en las piernas que alivia al sentarse.</p>` },
  socksFlex: { title: 'Calcetines doblando la espalda', text: `<p>Así se lleva la columna lumbar a flexión casi máxima justo al levantarse, cuando el disco está más hidratado.</p>` },
  socksHinge: { title: 'Calcetines con el pie sobre la rodilla', text: `<p>El pie sube a ti: cadera en rotación externa, espalda casi neutra. Compara la flexión lumbar y el empuje del núcleo con la otra forma.</p>` },
  sitting: { title: 'Sentado mucho rato y la pausa', text: `<p>Sentado encorvado, el núcleo se desplaza hacia atrás. La pausa consiste en ponerse de pie y extender la espalda unas veces antes de volver a sentarse o de cargar peso.</p>` },
  fibers: { title: 'Fibras nerviosas en la fisura', text: `<p>Corte del disco con la fisura. Las líneas amarillas representan las fibras que crecen hacia dentro a lo largo de ella. En un disco sano solo llegan al tercio externo (Freemont, Lancet 1997).</p>` },
  listFlex: { title: 'Listesis en flexión y extensión', text: `<p>Corte sagital como una radiografía lateral. Mira el deslizamiento de L4 sobre L5, el diámetro del canal y la altura del foramen: el deslizamiento aumenta al flexionar, pero el canal se agranda; en extensión el canal se estrecha.</p>` },
  listLying: { title: 'De pie y acostado', text: `<p>Al acostarte, la carga desaparece y el deslizamiento disminuye. Por eso una resonancia acostada puede no mostrarlo: en un estudio, el 28 % de los deslizamientos vistos en radiografías dinámicas no se veía en la resonancia (Segebarth 2015).</p>` },
  facetExt: { title: 'Extensión con giro', text: `<p>Arquear la espalda y girar comprime la faceta del lado hacia el que giras. Mira la nube inflamatoria sobre la faceta L4-L5 y la carga facetaria estimada.</p>` },
};

// ---------------------------------------------------------------------------------------------
// Por qué vuelve
export const RECUR_INTRO = `<p><strong>Recaer es lo habitual.</strong> En 250 personas recién recuperadas, el 69 % volvió a tener dolor en un año y el 40 % una crisis que limitó su actividad. Haber tenido más de 2 episodios previos fue uno de los predictores (da Silva, J Physiother 2019).</p>
<p>Abajo puedes ver, crisis a crisis, lo que la investigación describe que va cambiando. Cada elemento tiene respaldo, pero el ritmo con que avanza en el modelo es una ilustración.</p>`;

export const RECUR_ITEMS = [
  { id: 'fissure', title: 'La fisura avanza', text: `<p>Las láminas internas del anillo se rompen primero, y la fisura avanza hacia fuera con la flexión repetida bajo carga (Callaghan y McGill, Clin Biomech 2001). Cuando llega al borde externo, deja pasar núcleo: es la protrusión.</p>` },
  { id: 'nerves', title: 'Más fibras nerviosas dentro del disco', text: `<p>En discos dolorosos, las fibras crecen hasta el tercio interno y el núcleo (Freemont 1997). Cargas que antes no dolían empiezan a doler.</p>` },
  { id: 'multifidus', title: 'El multífido se achica de ese lado', text: `<p>En 24 de 26 personas con dolor lumbar de un lado, el multífido era más pequeño del lado de los síntomas y al nivel afectado (Hides, Spine 1994).</p>
    <p>En un ensayo pequeño de 39 personas, 4 semanas de ejercicio específico se asociaron a unas dos veces menos recaídas a los 3 años (Hides, Spine 2001; según la revisión que lo resume).</p>` },
  { id: 'root', title: 'La raíz queda sensibilizada', text: `<p>Una raíz irritada de forma crónica descarga de forma sostenida ante estímulos que en una raíz sana producen solo una descarga breve (Howe, Pain 1977). En el modelo, su umbral para doler en la elevación de la pierna baja con cada crisis.</p>` },
  { id: 'guard', title: 'Defensa y evitación', text: `<p>Tras una crisis es natural proteger la espalda. Si esa defensa se mantiene (tensión constante, no moverse, dormir mal), baja la capacidad y sube la sensibilidad. Es lo que trabaja la terapia cognitivo-funcional (RESTORE, Lancet 2023).</p>` },
];

export const TRIGGERS_CHART = [
  // Steffens et al., Arthritis Care Res 2015: riesgo transitorio de iniciar una crisis (estudio de casos cruzados, n = 999)
  { label: 'Distracción durante la tarea', or: 25, lo: 3.4, hi: 184.5 },
  { label: 'Postura forzada', or: 8, lo: 5.5, hi: 11.8 },
  { label: 'Carga pesada (a los 40 años)', or: 6, lo: null, hi: null, note: '13,6 a los 20 años; 2,7 a los 60' },
  { label: 'Manejar personas o animales', or: 5.8, lo: 2.3, hi: 15 },
  { label: 'Cansancio', or: 3.7, lo: 2.2, hi: 6.3 },
  { label: 'Actividad física moderada o intensa', or: 2.7, lo: null, hi: null },
];

export const DAY_TEXT = `<p><strong>El disco por la mañana.</strong></p>
<ul><li>Durante la noche, sin carga, los discos absorben agua, y por la mañana mides ~1 % más: 14 mm en promedio (Leatt 1986).</li>
<li>En resonancia, los discos lumbares pierden entre un 6 y un 8 % de altura de la mañana a la tarde (12 adultos jóvenes; Martin 2022).</li>
<li>En un estudio, el 60 % de la pérdida del día ocurrió entre las 6 y las 10 de la mañana.</li></ul>
<p>Un disco hidratado es más rígido a la flexión:</p>
<ul><li>Temprano en la mañana, las tensiones de flexión se estimaron ~300 % más altas en el disco y ~80 % en los ligamentos, y la flexión lumbar gana ~5° a lo largo del día (Adams, Spine 1987; modelo de laboratorio).</li>
<li>Controlar la flexión temprano en la mañana redujo el dolor en un ensayo de 85 personas (Snook, Spine 1998).</li></ul>`;

export const SITTING_TEXT = `<p><strong>Sentado mucho rato.</strong></p>
<ul><li>Estar sentado más de 5 h al día predijo recaídas (da Silva 2019).</li>
<li>La presión en el disco casi no subió al sentarse relajado (0,46 MPa, frente a 0,50 de pie), pero sí con flexión máxima (0,83 MPa) (Wilke 1999, una persona con disco sano).</li>
<li>Tras ~20 minutos de flexión completa, los tejidos pasivos "ceden" (fluencia) y la recuperación tras descansar no es inmediata (McGill y Brown 1992; dato de fuente secundaria).</li></ul>
<p>Por eso conviene pausar, ponerse de pie y extender la espalda antes de cargar peso.</p>`;

// ---------------------------------------------------------------------------------------------
// Indicaciones
export const PREVENTION_CHART = [
  { label: 'Ejercicio + educación', est: 0.55, lo: 0.41, hi: 0.74, src: 'Steffens, JAMA Intern Med 2016 (21 ensayos, 30 850 personas); certeza moderada' },
  { label: 'Ejercicio solo', est: 0.65, lo: 0.5, hi: 0.86, src: 'Steffens 2016; certeza baja o muy baja' },
  { label: 'Ejercicio (otra revisión)', est: 0.67, lo: 0.53, hi: 0.85, src: 'Shiri, Am J Epidemiol 2018 (8 ensayos)' },
  { label: 'Caminar (WalkBack)', est: 0.72, lo: 0.6, hi: 0.85, src: 'Pocovi, Lancet 2024 (701 personas); cociente de riesgos instantáneos' },
  { label: 'Ejercicio + educación (TOPS)', est: 1.09, lo: 0.7, hi: 1.8, src: 'de Campos, JOSPT 2021 (111 personas)' },
  { label: 'Educación sola', est: 1.03, lo: null, hi: null, src: 'Steffens 2016' },
];

export const MEDS = [
  { opt: 'Antiinflamatorios (AINE)', res: '−7/100 de dolor frente a placebo; efecto pequeño, bajo el mínimo importante (Cochrane 2020)' },
  { opt: 'Paracetamol', res: 'Igual que placebo: 17 frente a 16 días hasta recuperarse (PACE, Lancet 2014)' },
  { opt: 'Opioides', res: 'No mejores que placebo a las 6 semanas; el doble de riesgo de mal uso al año, 20 % frente a 10 % (OPAL, Lancet 2023)' },
  { opt: 'Pregabalina (ciática)', res: 'Sin beneficio y con más efectos adversos (PRECISE, NEJM 2017)' },
  { opt: 'Prednisona oral (ciática)', res: 'Algo mejor la función (6–7 puntos de ODI), sin alivio del dolor de pierna; el doble de efectos adversos (JAMA 2015)' },
  { opt: 'Infiltración epidural de corticoides', res: '−5/100 en dolor de pierna a corto plazo (Cochrane 2020); sirve de puente, no previene' },
];

export const STEPS = [
  {
    id: 'eval', n: 1, title: 'Precisar qué está fallando',
    html: `<p>Consulta con un <strong>fisiatra</strong> o un <strong>traumatólogo o neurocirujano de columna</strong>, y con un <strong>kinesiólogo</strong> formado en MDT (McKenzie) o en terapia cognitivo-funcional. Lleva tus resonancias y tu registro de crisis.</p>
      <p>En la pestaña <em>Qué me pasa</em> están las cuatro posibilidades, los exámenes que las distinguen y la lista de preguntas para la consulta.</p>`,
    demos: [],
  },
  {
    id: 'exercise', n: 2, title: 'Reducir las recaídas: ejercicio sostenido y caminar',
    html: `<ul><li><strong>Es la intervención con mejor respaldo,</strong> pero su efecto se pierde si dejas de hacerlo. En la revisión de Steffens, el efecto duró el primer año; después se redujo (ejercicio con educación) o desapareció (ejercicio solo).</li>
      <li><strong>No todo programa funciona:</strong> el ensayo TOPS no mostró efecto.</li>
      <li><strong>Ningún tipo de ejercicio ha demostrado ser claramente superior.</strong> Elige el que puedas mantener, progresivo y supervisado al inicio.</li>
      <li><strong>Si tus crisis son de ciática,</strong> el ejercicio estructurado no fue mejor que el consejo de mantenerse activo (Fernandez, Spine 2015).</li></ul>`,
    demos: ['walk'],
  },
  {
    id: 'triggers', n: 3, title: 'Manejar tus desencadenantes',
    html: `<ul><li><strong>Mañanas:</strong> evita la flexión forzada o con carga en las primeras horas tras levantarte. Ponte los calcetines con el pie sobre la rodilla o en una silla.</li>
      <li><strong>Sentado:</strong> levántate cada 30–45 min (regla práctica, no medida) y extiende la espalda unas veces antes de cargar peso.</li>
      <li><strong>Levantar peso, una verdad incómoda:</strong> enseñar técnica de levantamiento no previno el dolor (Cochrane 2011: 9 ensayos, 20 101 personas), y flexionar más al levantar no resultó ser un factor de riesgo (Saraceni, JOSPT 2020; evidencia de baja calidad).
        <ul><li>Lo razonable es evitar <em>tu</em> combinación gatillo (flexión con giro y carga, temprano, con cansancio o distracción) y subir tu capacidad de carga poco a poco.</li></ul></li>
      <li><strong>Distracción y cansancio:</strong> las crisis se concentraron tras tareas hechas distraído (por ejemplo, girar para tomar algo mientras hablas) y con cansancio.</li></ul>`,
    demos: ['socksFlex', 'socksHinge', 'sitting'],
  },
  {
    id: 'crisis', n: 4, title: 'Un plan de crisis, acordado antes con tu médico',
    html: `<ol>
      <li><strong>Actúa a la primera señal:</strong> rigidez de un lado o dificultad para enderezarte.</li>
      <li><strong>Mantente activo dentro de lo tolerable,</strong> con caminatas cortas y frecuentes. Reposar en cama no ayuda: en dolor lumbar agudo, mantenerse activo fue algo mejor, y en ciática no hubo diferencia (Cochrane 2010).</li>
      <li><strong>Autocorrección McKenzie:</strong> deslizamiento lateral contra la pared y luego extensión, solo si el dolor se centraliza. Detente si baja a la pierna. Corrige el shift, pero en el único ensayo no mejoró la discapacidad (Gillan 1998).</li>
      <li><strong>Fármacos:</strong> según la tabla, decididos con tu médico.</li>
      <li><strong>Consulta pronto</strong> si en 48–72 h no mejoras, o si aparece debilidad o adormecimiento nuevo.</li></ol>`,
    demos: ['glide'],
  },
  {
    id: 'chronic', n: 5, title: 'Si ya se volvió crónico',
    html: `<ul><li><strong>Terapia cognitivo-funcional:</strong> en 492 personas con dolor lumbar crónico incapacitante, mejoró la discapacidad 4,6 puntos en la escala RMDQ (0–24) frente al tratamiento habitual, con efecto similar al año y menor costo (RESTORE, Lancet 2023). Trabaja la rigidez protectora, la exposición gradual a lo que evitas, el sueño y el estrés.</li>
      <li><strong>Tensión con McGill:</strong> McGill propone tensar el abdomen para proteger. No hay comparación directa entre ambos enfoques.
        <ul><li>Mi lectura: usa las estrategias protectoras durante las crisis, pero no hagas de la rigidez permanente la meta.</li></ul></li>
      <li><strong>Ánimo:</strong> el dolor crónico y el ánimo bajo se alimentan mutuamente. Pedir que te evalúen no significa que el dolor sea "psicológico".</li>
      <li><strong>Tabaco y peso, si aplican:</strong> fumar se asoció a más dolor lumbar nuevo (OR 1,31) y la obesidad también (OR 1,53; el sobrepeso solo, no) (Shiri 2010). Son asociaciones, no pruebas de que cambiarlos prevenga crisis.</li></ul>`,
    demos: [],
  },
  {
    id: 'surgery', n: 6, title: 'Cuándo considerar cirugía',
    html: `<p><strong>Con hernia que comprime una raíz y dolor de pierna, si las crisis siguen pese a un buen tratamiento:</strong></p>
      <ul><li><strong>Ciática de 6–12 semanas:</strong> operar alivió antes (mediana de 4 frente a 12 semanas; dato de fuente secundaria). Al año, el 95 % se había recuperado en ambos grupos, y el 44 % de los no operados terminó operándose (Peul, NEJM 2007).</li>
      <li><strong>Ciática de 4–12 meses:</strong> el dolor de pierna a los 6 meses fue de 2,8 con cirugía frente a 5,2 sin ella (Bailey, NEJM 2020; 128 personas).</li>
      <li><strong>El shift:</strong> en operados con shift que se recuperaron, la inclinación bajó de 10,7° a 2,7° (Matsui 1998).</li>
      <li><strong>Riesgo:</strong> la hernia vuelve en el mismo nivel en el 12 % a 5 años, con reoperación en el 7,5 % (Geere 2023; 733 personas).</li></ul>
      <p><strong>Si lo principal es dolor de espalda por degeneración, sin raíz comprimida:</strong> la fusión no fue claramente mejor que la rehabilitación intensiva.</p>
      <ul><li>−4 puntos de ODI (Fairbank, BMJ 2005).</li>
      <li>Sin diferencia en Brox (Spine 2003), con un 18 % de complicaciones tempranas.</li>
      <li>Sin diferencia a 11 años (Mannion, Spine J 2013).</li>
      <li>La prótesis discal no superó claramente el mínimo importante (Hellum, BMJ 2011).</li></ul>
      <p><strong>No vale la pena:</strong></p>
      <ul><li>Antibióticos por cambios Modic: −1,6 puntos frente a un mínimo importante de 4 (AIM, BMJ 2019).</li>
      <li>Radiofrecuencia (MINT, JAMA 2017).</li>
      <li>Fajas o plantillas para prevenir.</li></ul>`,
    demos: [],
  },
];

export const PLAN_12 = [
  { phase: 'Semanas 0–2', items: [
    ['eval', 'Consulta médica con las preguntas de "Qué me pasa"'],
    ['diary', 'Empezar el registro de crisis'],
    ['crisisPlan', 'Acordar un plan de crisis con tu médico'],
    ['walkDaily', 'Caminar a diario lo que toleres'],
  ] },
  { phase: 'Semanas 2–12', items: [
    ['mdt', 'Aprender tu dirección de alivio y la autocorrección del shift'],
    ['strength', 'Fuerza progresiva 2–3 veces por semana (bisagra, puente, plancha lateral, perro de caza, remo, sentadilla a cajón)'],
    ['walk30', 'Subir la caminata hacia 30 min, 5 veces por semana'],
    ['mornings', 'Controlar la flexión por las mañanas'],
    ['pacing', 'Evitar el patrón de hacer mucho los días buenos y pagarlo después'],
  ] },
  { phase: 'Desde el mes 3', items: [
    ['maintain', 'Mantenimiento permanente 2–3 veces por semana'],
    ['checkpoint', 'Punto de control: si las crisis siguen igual o persiste el dolor de pierna, pedir opinión quirúrgica'],
  ] },
];

export const QUESTIONS = [
  '¿Mi dolor es radicular? ¿Qué raíz?',
  '¿La resonancia concuerda en nivel y lado con mis síntomas?',
  '¿Tengo signos neurológicos (fuerza, reflejos, sensibilidad)?',
  '¿Puedo tener una espondilolistesis? ¿Corresponden radiografías de pie en flexión y extensión?',
  '¿Qué significa el lado hacia el que se va mi shift?',
  '¿Qué plan de crisis me recomienda: qué tomar y cuándo consultar?',
  'Si las crisis siguen, ¿en qué momento conversamos de cirugía?',
  '¿Me recomienda un kinesiólogo con formación en MDT o en terapia cognitivo-funcional?',
];

export const RED_FLAGS = `<strong>Urgencias:</strong> adormecimiento genital o "en silla de montar", dificultad para orinar o pérdida del control de la orina o las heces, ciática en ambas piernas, debilidad que avanza (por ejemplo, no poder caminar sobre los talones), fiebre o pérdida de peso sin explicación.`;

export const LIMITS = `<p><strong>Límites:</strong></p>
<ul><li>No encontré datos sobre la recurrencia del lateral shift en particular. Incluso medirlo es difícil: el acuerdo entre evaluadores es moderado.</li>
<li>Los ensayos de prevención se hicieron en dolor lumbar inespecífico, no en discopatía severa con shift.</li>
<li>Este modelo no puede examinarte: todo depende de una evaluación clínica.</li></ul>`;
