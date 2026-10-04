// Clase guiada: cada paso fija cámara, capas, postura, patología y modo de color.
// layers: { bones, discs, ligaments, nerves, dura, muscles: profundidad 0–7, abdomen, hip }
const NEUTRAL = { flex: 0, lat: 0, rot: 0, shift: 0, sit: 0, slump: 0, hinge: 0, neckFlex: 0, neckLat: 0, neckRot: 0, region: 'all', loadKg: 0 };

export const LESSON = [
  {
    title: 'La columna: un mástil con tres curvas',
    view: 'lateralFull',
    layers: { muscles: 0, ligaments: false, nerves: false, discs: true },
    pose: NEUTRAL,
    html: `<p>Bienvenido. Vamos a recorrer tu espalda de afuera hacia adentro y luego a moverla. Primero, la forma general: vista de lado, la columna no es recta. Tiene <strong>tres curvas</strong> que se compensan: lordosis cervical (cóncava hacia atrás), cifosis torácica y lordosis lumbar.</p>
<p>Esas curvas permiten que la cabeza quede equilibrada sobre las caderas gastando poca energía muscular. En este modelo la plomada de C7 cae unos 2 cm por delante del borde posterior del sacro, dentro de lo normal.</p>
<p>Abajo, el <strong>sacro</strong> está inclinado unos 40° (pendiente sacra). Cuanto más inclinado está, más lordosis lumbar se necesita para estar erguido.</p>
<p class="cite">Arrastra para girar, rueda o pellizco para acercar. Toca cualquier estructura para ver su ficha.</p>`,
  },
  {
    title: 'La vértebra lumbar, pieza por pieza',
    view: 'l4Close',
    layers: { muscles: 0, ligaments: false, nerves: false, discs: true },
    pose: NEUTRAL,
    highlight: ['L4'],
    html: `<p>Esta es <strong>L4</strong>. Tiene dos mitades con funciones distintas:</p>
<ul><li><strong>Por delante, el cuerpo vertebral</strong>: un cilindro de hueso esponjoso con corteza fina, hecho para soportar compresión.</li>
<li><strong>Por detrás, el arco</strong>: dos pedículos (los “puentes”), dos láminas que cierran el canal, la apófisis espinosa (lo que palpas en la espalda), dos transversas laterales y cuatro apófisis articulares que forman las <strong>articulaciones facetarias</strong> con las vértebras vecinas.</li></ul>
<p>El hueco central es el <strong>canal vertebral</strong>. Entre el pedículo de una vértebra y el de la siguiente queda el <strong>agujero de conjunción</strong> (foramen), por donde sale cada raíz nerviosa.</p>
<p>Las carillas lumbares miran hacia los lados, casi en el plano sagital: dejan flexionar y extender, pero bloquean la rotación.</p>`,
  },
  {
    title: 'El disco: anillo fibroso y núcleo pulposo',
    view: 'l45Close',
    layers: { muscles: 0, ligaments: false, nerves: false, discs: true, discXray: true },
    pose: NEUTRAL,
    highlight: ['disc:L4-L5'],
    html: `<p>Entre dos cuerpos vertebrales está el <strong>disco</strong>. Lo hice semitransparente para que veas el <strong>núcleo pulposo</strong> (la esfera brillante), un gel rico en agua, ligeramente desplazado hacia atrás.</p>
<p>Alrededor, el <strong>anillo fibroso</strong>: 15 a 25 láminas con fibras cruzadas en ángulos alternos, como una llanta radial. Cuando cargas peso, el núcleo empuja hacia afuera y las fibras del anillo trabajan en tensión.</p>
<p>El disco adulto casi no tiene vasos: se nutre por difusión a través de los platillos. Por eso repara lento y se deshidrata con los años.</p>
<p>Fíjate en la altura: el disco L4-L5 mide unos 11–12 mm en su centro y es de los más altos de la columna.</p>`,
  },
  {
    title: 'Ligamentos y articulaciones facetarias',
    view: 'lumbarPostObl',
    layers: { muscles: 0, ligaments: true, nerves: false, discs: true },
    pose: NEUTRAL,
    highlight: ['PLL', 'flavum'],
    html: `<p>Los ligamentos son las cuerdas pasivas que frenan el movimiento al final del recorrido:</p>
<ul><li><strong>Longitudinal anterior</strong>: ancho, por delante de los cuerpos. Frena la extensión.</li>
<li><strong>Longitudinal posterior</strong>: dentro del canal, detrás de los cuerpos. En lo lumbar es <strong>estrecho</strong> y deja descubiertas las esquinas posterolaterales del disco: justo por ahí salen la mayoría de las hernias.</li>
<li><strong>Amarillo</strong>: elástico, entre las láminas. Se engrosa con la degeneración y puede estrechar el canal.</li>
<li><strong>Interespinosos y supraespinoso</strong>: entre y sobre las espinosas. Frenan la flexión completa.</li></ul>
<p>Las <strong>cápsulas facetarias</strong> (traslúcidas) envuelven articulaciones sinoviales verdaderas, con cartílago (azulado en el modelo) e inervadas por los ramos mediales.</p>`,
  },
  {
    title: 'Médula, cauda equina y raíces',
    view: 'nerveObl',
    layers: { muscles: 0, ligaments: false, nerves: true, dura: true, discs: true },
    pose: NEUTRAL,
    highlight: ['rootL5L', 'rootL4L'],
    html: `<p>La <strong>médula espinal</strong> termina en el cono medular, alrededor de L1-L2. Más abajo, dentro del saco dural (la envoltura translúcida), solo hay raíces: la <strong>cauda equina</strong>.</p>
<p>Cada raíz lumbar baja, sale de su manga dural, recorre el <strong>receso lateral</strong> bajo el pedículo y atraviesa el foramen. El engrosamiento que ves en el foramen es el <strong>ganglio de la raíz dorsal</strong>, muy sensible a la compresión y a la inflamación.</p>
<p>Ahora la regla más importante para entender tu resonancia, con L4-L5 como ejemplo:</p>
<ul><li>La raíz <strong>L4</strong> (resaltada) <strong>sale</strong> por el foramen L4-L5.</li>
<li>La raíz <strong>L5</strong> <strong>pasa por detrás</strong> del disco L4-L5 camino a su foramen (L5-S1).</li></ul>
<p>Por eso una hernia paracentral en L4-L5 suele afectar a L5, y una foraminal en L4-L5 a L4.</p>`,
  },
  {
    title: 'Músculos profundos: el multífido',
    view: 'lumbarPostObl',
    layers: { muscles: 2, ligaments: false, nerves: false, discs: true },
    pose: NEUTRAL,
    highlight: ['multifidusL', 'multifidusR'],
    html: `<p>Pegado a las espinosas está el <strong>multífido</strong>. Sus fascículos nacen en cada espinosa y bajan de 2 a 5 niveles hasta las apófisis mamilares, el sacro y la cresta ilíaca. Cada fascículo depende de un solo nivel de inervación.</p>
<p>Más que grandes movimientos, controla la posición de cada vértebra, sobre todo al volver de la flexión y al resistir la rotación.</p>
<p>En la profundidad hay músculos diminutos (rotadores, interespinosos, intertransversos) con muchos husos musculares: funcionan casi como sensores de posición.</p>
<p class="cite">Tras episodios de dolor lumbar se ha descrito atrofia del multífido en el nivel afectado; el ejercicio dirigido puede recuperarlo, pero eso lo debe pautar tu equipo tratante.</p>`,
  },
  {
    title: 'Erectores, cuadrado lumbar y psoas',
    view: 'postObl',
    layers: { muscles: 3, ligaments: false, nerves: false, discs: true },
    pose: NEUTRAL,
    highlight: ['qlL', 'qlR', 'psoasL', 'psoasR'],
    html: `<p>Encima del multífido están los <strong>erectores de la columna</strong>: longísimo e iliocostal. Sus porciones lumbares van de las vértebras a la pelvis. Las torácicas tienen vientres en el tórax y <strong>tendones largos</strong> (en blanco) que bajan formando la aponeurosis del erector.</p>
<p>Lateralmente, el <strong>cuadrado lumbar</strong> une la cresta ilíaca con la 12ª costilla y las transversas: controla la inclinación lateral y nivela la pelvis.</p>
<p>Por delante de las transversas está el <strong>psoas</strong>, que nace de los cuerpos y discos lumbares y va al fémur. Las raíces del plexo lumbar viajan dentro de él.</p>`,
  },
  {
    title: 'Capas superficiales',
    view: 'postFull',
    layers: { muscles: 7, ligaments: false, nerves: false, discs: true },
    pose: NEUTRAL,
    html: `<p>Por encima: romboides, serratos posteriores, esplenios y, en la superficie, <strong>trapecio</strong> y <strong>dorsal ancho</strong>. El origen lumbar del dorsal ancho es una lámina tendinosa que se funde con la <strong>fascia toracolumbar</strong>, que conecta el brazo con la pelvis y el glúteo mayor del lado contrario.</p>
<p>Por delante, la pared abdominal (recto, oblicuos y transverso) trabaja con la fascia como un corsé. En la cadera, glúteos y piriforme; el <strong>nervio ciático</strong> sale justo bajo el piriforme.</p>
<p>Usa el panel de <strong>Capas</strong> (o el control de disección) para quitar capas cuando quieras.</p>`,
  },
  {
    title: 'Flexión: agacharse hacia delante',
    view: 'lateralMotion',
    layers: { muscles: 3, ligaments: false, nerves: true, discs: true },
    color: 'strain',
    animate: [{ t: 2.5, state: { ...NEUTRAL, flex: 0.85 } }],
    html: `<p>Mira cómo se reparte el movimiento: al agacharte para tocar los pies, unos <strong>42° vienen de la columna lumbar y unos 69° de la cadera</strong> (Esola et al., Spine 1996). Al inicio domina la columna; al final, la pelvis.</p>
<p>El color muestra <strong>estiramiento</strong>: azul = músculo alargado, naranja = acortado. Los erectores se alargan mientras frenan el descenso.</p>
<p>En cada disco lumbar la parte anterior se comprime y la posterior se abre: el <strong>núcleo migra hacia atrás</strong>. El canal se alarga y las raíces lumbosacras se <strong>tensan</strong> (se tiñen de naranja).</p>
<p>Al final del recorrido, los erectores suelen “apagarse” (relajación-flexión) y la carga pasa a ligamentos, fascia y disco.</p>`,
  },
  {
    title: 'Extensión: arquear hacia atrás',
    view: 'lumbarLat',
    layers: { muscles: 0, ligaments: true, nerves: true, discs: true },
    color: 'anat',
    animate: [{ t: 2.2, state: { ...NEUTRAL, flex: -0.9 } }],
    html: `<p>En extensión ocurre lo contrario: el disco se comprime atrás y se abre delante, y el <strong>núcleo se desplaza hacia delante</strong>.</p>
<p>Atrás, las <strong>articulaciones facetarias se comprimen</strong> y el <strong>foramen se estrecha</strong>: en estudios en cadáver su área cae alrededor de un 15 % en extensión y aumenta un 12 % en flexión (Inufusa et al., Spine 1996). El panel de Movimiento muestra la altura foraminal medida en este modelo.</p>
<p>Por eso hay personas a las que arquearse les alivia (el núcleo se aleja de una protrusión posterior) y otras a las que les duele (facetas cargadas o forámenes estrechos). La respuesta es individual.</p>`,
  },
  {
    title: 'Inclinación lateral',
    view: 'postLumbar',
    layers: { muscles: 3, ligaments: false, nerves: true, discs: true },
    color: 'strain',
    animate: [{ t: 2, state: { ...NEUTRAL, lat: 0.9 } }],
    html: `<p>Al inclinarte a la derecha, el <strong>cuadrado lumbar y los erectores izquierdos se alargan</strong> (azul) y frenan el movimiento.</p>
<p>En el disco, el anillo se abomba en el lado cóncavo (derecho) y el núcleo migra hacia el lado convexo (izquierdo). Los forámenes del lado cóncavo se cierran y los del lado convexo se abren.</p>
<p>En la columna lumbar la inclinación se acopla con un poco de rotación, y L5-S1 casi no se inclina (1–2° por lado), sujeta por los ligamentos iliolumbares.</p>`,
  },
  {
    title: 'Rotación',
    view: 'topDown',
    layers: { muscles: 6, ligaments: false, nerves: false, discs: true },
    color: 'activity',
    animate: [{ t: 2, state: { ...NEUTRAL, rot: 0.9 } }],
    html: `<p>La rotación ocurre sobre todo en el tórax (unos 8° por nivel arriba) y en el cuello (C1-C2 aporta casi la mitad). La columna lumbar rota solo <strong>1–2° por nivel</strong>: las carillas casi sagitales chocan entre sí.</p>
<p>El color muestra la <strong>actividad estimada</strong>: girar a la derecha usa el <strong>oblicuo externo izquierdo y el interno derecho</strong>; el multífido estabiliza.</p>
<p>En el anillo, solo la mitad de las láminas (las orientadas en la dirección del giro) resisten la torsión. Por eso <strong>flexionar y girar a la vez con carga</strong> es la combinación más exigente para el disco.</p>`,
  },
  {
    title: 'Discopatía: qué cambia en el disco',
    view: 'l45Lat',
    layers: { muscles: 0, ligaments: true, nerves: true, discs: true },
    color: 'anat',
    animate: [{ t: 1, state: { ...NEUTRAL } }],
    pathology: { 'L4-L5': { grade: 4, hern: 'bulge', zone: 'central', side: 'L' }, 'L5-S1': { grade: 5, hern: 'none' } },
    html: `<p>Simulo aquí <strong>L4-L5 en grado IV</strong> y <strong>L5-S1 en grado V</strong> de Pfirrmann. El disco degenerado pierde agua (el núcleo se oscurece y achica), pierde altura y su anillo se abomba y fisura.</p>
<p>Al perder altura, las vértebras se acercan: los <strong>forámenes se estrechan</strong>, el ligamento amarillo se pliega y las facetas cargan más. Eso explica por qué una discopatía avanzada puede dar dolor al estar mucho tiempo de pie o arqueado.</p>
<p><strong>Para leer tu resonancia con calma:</strong> en personas sin dolor, la degeneración discal aparece en el 37 % a los 20 años y en el 96 % a los 80, y las protrusiones en el 29 % y 43 % (Brinjikji et al., AJNR 2015). La imagen describe la estructura; los síntomas y la exploración clínica dicen cuánto pesa cada hallazgo.</p>`,
  },
  {
    title: 'Hernia y raíz: por qué cambia con la postura',
    view: 'axialL45',
    layers: { muscles: 3, ligaments: true, nerves: true, discs: true },
    clip: { mode: 'axial', level: 'L4-L5' },
    pathology: { 'L4-L5': { grade: 4, hern: 'protrusion', zone: 'paracentral', side: 'L' }, 'L5-S1': { grade: 5 } },
    animate: [{ t: 1.6, state: { ...NEUTRAL, flex: 0.6 } }, { t: 3.6, state: { ...NEUTRAL, flex: -0.6 } }, { t: 5, state: { ...NEUTRAL } }],
    html: `<p>Corte axial en L4-L5, como una imagen de resonancia vista desde arriba. Hay una <strong>protrusión paracentral izquierda</strong> que se acerca a la <strong>raíz L5 izquierda</strong> (la raíz se pone roja cuando el índice de compresión sube).</p>
<p>La animación hace flexión y luego extensión: en flexión el núcleo empuja hacia atrás y la protrusión crece; en extensión retrocede. En una hernia <strong>contenida</strong> esto es plausible y es la base de la “preferencia direccional” que algunos pacientes notan. En un fragmento libre (secuestro) no ocurre.</p>
<p class="cite">El índice de compresión es ilustrativo: combina el tipo de hernia con la migración del núcleo, el cambio foraminal y la tensión de la raíz calculados en el modelo. No mide la compresión real de tu raíz.</p>`,
  },
  {
    title: 'Lateral shift: el tronco desplazado',
    view: 'postFull',
    layers: { muscles: 3, ligaments: false, nerves: true, discs: true, skin: true },
    clip: { mode: 'none' },
    pathology: { 'L4-L5': { grade: 4, hern: 'protrusion', zone: 'paracentral', side: 'L' }, 'L5-S1': { grade: 5 } },
    animate: [{ t: 2.5, state: { ...NEUTRAL, shift: 0.9, shiftKyphosis: 0.6 } }],
    html: `<p>El <strong>lateral shift</strong> (escoliosis ciática o antiálgica) es un desplazamiento del tronco sobre la pelvis: los hombros quedan corridos a un lado y la persona no puede corregirlo voluntariamente. McKenzie lo nombra por hacia dónde van los hombros; aquí, <strong>shift derecho</strong>.</p>
<p>En el modelo: los segmentos L3-S1 se inclinan a la derecha y los superiores compensan hacia la izquierda para que el tórax quede vertical, con algo de pérdida de lordosis. El lado izquierdo (donde está la hernia) queda <strong>convexo</strong> y su foramen se abre.</p>
<p><strong>Lo que dice la evidencia:</strong></p>
<ul><li>En series quirúrgicas, la hernia estaba en el lado convexo (el tronco se aleja de ella) en el 80 % (Matsui et al., Spine 1998; n = 40) y en el 67 % (Suk et al., Spine 2001; n = 45). La mayoría de los shifts desaparecieron tras descomprimir la raíz.</li>
<li>La regla clásica de “hernia lateral a la raíz → te alejas; axilar → te acercas” <strong>no se confirmó</strong> (Porter y Miller 1986; Suk 2001).</li>
<li>Por qué ocurre sigue sin estar demostrado: se proponen descompresión de la raíz, desplazamiento asimétrico del material discal y defensa muscular asimétrica.</li></ul>
<p class="cite">Corregir un shift con maniobras debe hacerlo o enseñarlo un profesional que te haya evaluado.</p>`,
  },
  {
    title: 'Sentarse y levantar peso',
    view: 'lateralMotion',
    layers: { muscles: 3, ligaments: false, nerves: true, discs: true, skin: false },
    color: 'pressure',
    pathology: {},
    animate: [{ t: 2, state: { ...NEUTRAL, sit: 1, slump: 0 } }, { t: 4, state: { ...NEUTRAL, sit: 1, slump: 1 } }, { t: 6, state: { ...NEUTRAL, sit: 0, slump: 0, flex: 0.75, hinge: 0, loadKg: 15 } }, { t: 8.5, state: { ...NEUTRAL, flex: 0.75, hinge: 1, loadKg: 15 } }],
    html: `<p>La animación pasa por: sentado erguido → sentado encorvado → levantar 15 kg con la espalda redonda → levantar con <strong>bisagra de cadera</strong>. Los discos se colorean por presión relativa.</p>
<p>Referencias medidas con un sensor dentro del disco L4-L5 (Wilke et al., Spine 1999, <strong>una sola persona</strong>): de pie 0,50 MPa; sentado relajado 0,46; sentado muy encorvado 0,83; inclinado hacia delante 1,10; levantar 20 kg con espalda redonda 2,3 frente a 1,7 con rodillas flexionadas.</p>
<p>El panel de Movimiento estima la compresión con un modelo estático simplificado. Sirve para comparar posturas, no para dar un número exacto. Una revisión de 2022 encontró que estar sentado no siempre carga más que estar de pie, sobre todo en discos degenerados: ninguna postura es “prohibida”; importan la dosis, la variación y la tolerancia individual.</p>`,
  },
  {
    title: 'Señales de alarma y qué preguntar',
    view: 'nerveObl',
    layers: { muscles: 0, ligaments: false, nerves: true, dura: true, discs: true },
    color: 'anat',
    animate: [{ t: 1.2, state: { ...NEUTRAL } }],
    html: `<div class="callout"><strong>Consulta de urgencia</strong> si aparece: adormecimiento en la zona genital o “de silla de montar”, dificultad para orinar o pérdida del control de esfínteres, ciática en ambas piernas o debilidad que empeora (pie que cae, no poder ponerse de puntillas). Son señales de posible compresión de la cauda equina.</div>
<p>Preguntas útiles para tu equipo tratante:</p>
<ul><li>¿Qué nivel y qué raíz explican mis síntomas, y coincide con la exploración?</li>
<li>¿Mi hernia es contenida o es un fragmento libre? ¿Hay estenosis foraminal?</li>
<li>¿Tengo una preferencia direccional (posturas que centralizan o alivian el dolor)?</li>
<li>Si vuelvo a hacer un lateral shift, ¿qué hago y qué evito?</li></ul>
<p class="cite">Esta herramienta es educativa: el modelo es una aproximación anatómica media, no tu columna.</p>`,
  },
];
