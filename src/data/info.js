// Fichas de estructuras: qué es, función, comportamiento en el movimiento y relevancia clínica.
// Redactadas como explicaría un docente de anatomía; no sustituyen una evaluación médica.

export const INFO = {
  // ---------- Huesos ----------
  lumbar: {
    what: 'Las cinco vértebras lumbares son las más grandes de la columna: cuerpos anchos en forma de riñón, pedículos gruesos, apófisis espinosas horizontales en forma de hacha y transversas largas y finas.',
    func: 'Soportan el peso de todo el tronco. El conjunto cuerpo-disco carga la mayor parte de la compresión; las articulaciones facetarias asumen una fracción menor que aumenta en extensión y cuando el disco pierde altura.',
    motion: 'Sus carillas articulares son casi sagitales: permiten bien la flexión y la extensión, algo de inclinación lateral y muy poca rotación (1–2° por nivel). Por eso girar con carga se concentra en pocos grados y estresa el anillo fibroso.',
    clinic: 'L4-L5 y L5-S1 concentran alrededor del 95 % de las hernias lumbares (Deyo y Mirza, NEJM 2016): son los niveles más móviles en flexión y los que más carga reciben.',
  },
  thoracic: {
    what: 'Doce vértebras con cuerpo en forma de corazón, apófisis espinosas largas e inclinadas hacia abajo como tejas, y carillas para articularse con las costillas.',
    func: 'Forman, junto con las costillas y el esternón, la caja torácica, que protege corazón y pulmones y da rigidez a la región.',
    motion: 'Las carillas están en el plano frontal: permiten rotación (unos 8° por nivel en la parte alta) pero la flexión y la extensión quedan limitadas por las costillas y las espinosas imbricadas.',
    clinic: 'Las hernias torácicas son raras. La charnela toracolumbar (T11-L1) concentra cambios de movimiento y es sitio frecuente de fracturas por compresión.',
  },
  cervical: {
    what: 'Siete vértebras pequeñas con agujeros transversos por donde sube la arteria vertebral, procesos unciformes en el borde superior del cuerpo y espinosas cortas, bífidas de C3 a C6.',
    func: 'Sostienen y orientan la cabeza (unos 4–5 kg) y protegen la médula cervical, de la que salen los nervios de los brazos.',
    motion: 'Carillas inclinadas unos 45°: la inclinación lateral va siempre acoplada a rotación hacia el mismo lado. Es la región más móvil de la columna.',
    clinic: 'Las raíces cervicales salen POR ENCIMA de la vértebra de su mismo número (la raíz C6 sale entre C5 y C6); C8 sale entre C7 y T1.',
  },
  C1: {
    what: 'El atlas no tiene cuerpo: es un anillo con dos masas laterales que reciben los cóndilos del occipital.',
    func: 'Sostiene el cráneo. La articulación occipitoatloidea permite sobre todo el gesto de “sí”.',
    motion: 'Flexoextensión de la cabeza (unos 25° en total entre occipital y C1).',
    clinic: 'El ligamento transverso mantiene la odontoides de C2 pegada al arco anterior; su lesión vuelve inestable la unión craneocervical.',
  },
  C2: {
    what: 'El axis tiene la apófisis odontoides (el “diente”), que sube y actúa como pivote dentro del anillo del atlas.',
    func: 'Eje de rotación de la cabeza.',
    motion: 'Entre C1 y C2 ocurre cerca de la mitad de toda la rotación cervical (unos 40° a cada lado).',
    clinic: 'Su ramo dorsal forma el nervio occipital mayor, implicado en cefaleas de origen cervical.',
  },
  sacrum: {
    what: 'Cinco vértebras fusionadas en forma de cuña. Su platillo superior (S1) está inclinado hacia delante: la pendiente sacra media ronda 40°.',
    func: 'Transmite el peso de la columna a la pelvis a través de las articulaciones sacroilíacas. Por sus agujeros salen las raíces sacras que forman el nervio ciático.',
    motion: 'Prácticamente se mueve con la pelvis (la articulación sacroilíaca tiene solo unos pocos grados de movilidad).',
    clinic: 'La inclinación del sacro define cuánta lordosis lumbar necesita la persona para estar erguida (incidencia pélvica).',
  },
  coccyx: { what: 'Tres a cinco segmentos rudimentarios al final del sacro.', func: 'Inserción de ligamentos y del suelo pélvico; apoyo al sentarse inclinado hacia atrás.', motion: 'Mínimo.', clinic: '' },
  pelvis: {
    what: 'Los dos huesos coxales (ilion, isquion y pubis fusionados) forman con el sacro el anillo pélvico.',
    func: 'Base de la columna y unión con los fémures por la cadera. En la cresta ilíaca se insertan el cuadrado lumbar, los erectores, los oblicuos y el dorsal ancho.',
    motion: 'Al agacharse, la pelvis rota sobre las cabezas femorales (anteversión): en una flexión completa de pie, unos 69° vienen de la cadera y unos 42° de la columna lumbar (Esola et al., Spine 1996).',
    clinic: 'Si la cadera o los isquiotibiales están rígidos, la flexión se “roba” de la columna lumbar y el disco trabaja más.',
  },
  femur: { what: 'Hueso del muslo; su cabeza encaja en el acetábulo de la pelvis.', func: 'Recibe el psoas-ilíaco en el trocánter menor y los glúteos en el trocánter mayor.', motion: 'Al sentarse, la cadera se flexiona unos 90° y la pelvis tiende a rotar hacia atrás, aplanando la lordosis.', clinic: '' },
  rib: { what: 'Costillas: arcos óseos que se articulan atrás con los cuerpos y las transversas torácicas.', func: 'Protegen el tórax y anclan músculos respiratorios y del tronco.', motion: 'Acompañan a su vértebra; los cartílagos costales permiten que el tórax se deforme al moverse y al respirar.', clinic: '' },
  sternum: { what: 'Hueso plano anterior: manubrio, cuerpo y apéndice xifoides.', func: 'Cierra la caja torácica por delante.', motion: '', clinic: '' },
  skull: { what: 'Cráneo (simplificado en este modelo).', func: 'En la línea nucal y la mastoides se insertan trapecio, esplenio, semiespinoso y suboccipitales.', motion: '', clinic: '' },
  scapula: { what: 'Escápula u omóplato, apoyada sobre la parrilla costal posterior.', func: 'Base de inserción del trapecio, romboides, elevador de la escápula y parte del dorsal ancho.', motion: '', clinic: '' },
  clavicle: { what: 'Clavícula.', func: 'Une el miembro superior al esternón; inserción del trapecio superior.', motion: '', clinic: '' },
  humerus: { what: 'Húmero (porción proximal).', func: 'En su corredera bicipital se inserta el dorsal ancho, que conecta el brazo con la fascia toracolumbar y la pelvis.', motion: '', clinic: '' },

  // ---------- Disco ----------
  disc: {
    what: 'El disco intervertebral es un cojinete sin vasos sanguíneos en el adulto: un anillo fibroso de 15 a 25 láminas concéntricas con fibras cruzadas a unos ±30°, que encierra un núcleo pulposo gelatinoso rico en agua y proteoglicanos. Se nutre por difusión a través de los platillos vertebrales.',
    func: 'Reparte la carga: el núcleo, casi incompresible, convierte la compresión en tensión en las fibras del anillo. También permite y limita el movimiento entre vértebras.',
    motion: 'En flexión se comprime por delante y se estira por detrás: el núcleo tiende a desplazarse hacia atrás. En extensión ocurre lo contrario. Al inclinarse, el anillo se abomba en el lado cóncavo y el núcleo migra hacia el lado convexo. En la rotación, solo la mitad de las fibras (las orientadas en esa dirección) resisten, por eso la combinación flexión + rotación es la más exigente.',
    clinic: '“Discopatía” es un término amplio de imagen: incluye deshidratación (disco “negro” en resonancia), pérdida de altura, fisuras del anillo, abombamientos y hernias. La escala de Pfirrmann (I–V) gradúa la degeneración en la secuencia T2. Importante: en personas SIN dolor la degeneración discal aparece en el 37 % a los 20 años y en el 96 % a los 80 (Brinjikji et al., AJNR 2015), así que la imagen sola no explica el dolor.',
  },
  nucleus: {
    what: 'Núcleo pulposo: gel con 70–90 % de agua en el joven, que se deshidrata con la edad y la degeneración.',
    func: 'Actúa como un cojín hidráulico: la presión intradiscal medida en L4-L5 es de unos 0,5 MPa de pie y 1,1 MPa inclinado hacia delante (Wilke et al., Spine 1999; una sola persona).',
    motion: 'En el modelo verás que migra hacia el lado que se abre: hacia atrás en flexión, hacia delante en extensión, hacia el lado convexo al inclinarte.',
    clinic: 'En un disco con fisura radial, la flexión repetida o mantenida puede empujar material nuclear por la fisura hacia atrás y a un lado (posterolateral), donde el ligamento longitudinal posterior es más débil.',
  },
  hernia: {
    what: 'Material discal desplazado más allá del borde del disco. Nomenclatura 2.0 (Fardon et al., 2014): abombamiento (>25 % de la circunferencia, no es hernia), protrusión (base más ancha que la cúpula), extrusión (cúpula más ancha que la base) y secuestro (fragmento separado).',
    func: '',
    motion: 'Una protrusión contenida cambia con la postura: en el modelo crece en flexión y se reduce en extensión. Los fragmentos libres no responden así.',
    clinic: 'Las hernias grandes suelen reabsorberse: se observa regresión en el 96 % de los secuestros, 70 % de las extrusiones, 41 % de las protrusiones y 13 % de los abombamientos (Chiu et al., Clin Rehabil 2015).',
  },

  // ---------- Ligamentos ----------
  ALL: { what: 'Ligamento longitudinal anterior: banda ancha y fuerte por delante de los cuerpos vertebrales, del sacro al atlas.', func: 'Frena la extensión.', motion: 'Se tensa al arquear la espalda hacia atrás y se relaja en flexión.', clinic: '' },
  PLL: { what: 'Ligamento longitudinal posterior: recorre la cara posterior de los cuerpos, dentro del canal. En la zona lumbar es estrecho sobre los cuerpos y se ensancha solo un poco sobre los discos.', func: 'Frena la flexión y refuerza la parte posterior del disco.', motion: 'Se tensa en flexión.', clinic: 'Como no cubre las esquinas posterolaterales del disco lumbar, las hernias tienden a salir justo ahí, al lado del ligamento: zona paracentral o subarticular, donde pasa la raíz que baja.' },
  flavum: { what: 'Ligamento amarillo: une las láminas por dentro del canal. Es el ligamento con más elastina del cuerpo (por eso es amarillo).', func: 'Cierra el canal por detrás y, al ser elástico, no se pliega hacia dentro en extensión cuando está sano.', motion: 'Se estira en flexión. Con la pérdida de altura del disco se pliega y engrosa.', clinic: 'Su engrosamiento, junto con la hipertrofia facetaria y el abombamiento discal, produce estenosis del canal y del receso lateral.' },
  interspinous: { what: 'Ligamentos interespinosos: láminas finas entre apófisis espinosas.', func: 'Limitan la separación de las espinosas.', motion: 'Se tensan al final de la flexión.', clinic: '' },
  supraspinous: { what: 'Ligamento supraespinoso: cordón que une las puntas de las espinosas (en lo lumbar suele terminar en L4-L5).', func: 'Último freno pasivo de la flexión.', motion: 'En la flexión completa, cuando los erectores “se apagan” (relajación-flexión), estos ligamentos y la fascia sostienen el tronco.', clinic: '' },
  nuchae: { what: 'Ligamento nucal: lámina fibrosa en la línea media del cuello, de C7 al occipital.', func: 'Inserción del trapecio y esplenios; limita la flexión cervical.', motion: '', clinic: '' },
  iliolumbar: { what: 'Ligamento iliolumbar: bandas gruesas de las transversas de L5 (y L4) a la cresta ilíaca.', func: 'Ancla L5 a la pelvis y limita su inclinación, rotación y deslizamiento anterior.', motion: 'Se tensa en la inclinación lateral hacia el lado contrario.', clinic: 'Explica en parte por qué L5-S1 tiene poca inclinación lateral (~1–2° por lado).' },
  sacroiliacPost: { what: 'Ligamentos sacroilíacos posteriores: unen la espina ilíaca posterosuperior al sacro.', func: 'Estabilizan la articulación sacroilíaca.', motion: '', clinic: '' },
  sacrotuberous: { what: 'Ligamento sacrotuberoso: del sacro a la tuberosidad isquiática.', func: 'Frena la nutación del sacro; parte del glúteo mayor se origina en él.', motion: '', clinic: '' },
  sacrospinous: { what: 'Ligamento sacroespinoso: del borde del sacro a la espina isquiática.', func: 'Delimita los agujeros ciáticos mayor y menor; por el mayor sale el nervio ciático.', motion: '', clinic: '' },
  facetCaps: { what: 'Cápsulas de las articulaciones facetarias (cigapofisarias): articulaciones sinoviales con cartílago, entre la apófisis articular inferior de una vértebra y la superior de la siguiente.', func: 'Guían el movimiento y soportan parte de la carga, sobre todo en extensión y rotación.', motion: 'En extensión e inclinación hacia un lado las carillas de ese lado se comprimen; en flexión se deslizan y abren.', clinic: 'Están inervadas por los ramos mediales. Cuando el disco pierde altura, las facetas cargan más y se artrosan: es uno de los motivos de dolor al arquear la espalda.' },
  atlasTransverse: { what: 'Ligamento transverso del atlas: banda que pasa por detrás de la odontoides.', func: 'Mantiene la odontoides contra el arco anterior de C1 y protege la médula.', motion: '', clinic: '' },
  alar: { what: 'Ligamentos alares: de la punta de la odontoides a los cóndilos occipitales.', func: 'Limitan la rotación y la inclinación de la cabeza.', motion: 'Se tensan al girar la cabeza.', clinic: '' },

  // ---------- Sistema nervioso ----------
  cord: { what: 'Médula espinal: va del agujero magno hasta el cono medular, que en el adulto termina aproximadamente en L1-L2. Tiene dos engrosamientos: cervical (brazos) y lumbar (piernas).', func: 'Conduce las órdenes motoras y la sensibilidad entre el cerebro y el cuerpo.', motion: 'En flexión el canal se alarga varios milímetros y la médula y las raíces se tensan; en extensión se acortan y se pliegan.', clinic: 'Por debajo de L2 ya no hay médula: hay raíces flotando en el líquido (cauda equina). Por eso una hernia lumbar comprime raíces, no la médula.' },
  dura: { what: 'Saco dural (duramadre) lleno de líquido cefalorraquídeo; se extiende hasta S2.', func: 'Envuelve y amortigua la médula y la cauda equina. Cada raíz sale envuelta en una manga dural.', motion: '', clinic: 'Una hernia central grande puede comprimir varias raíces a la vez (síndrome de cauda equina): es una urgencia.' },
  root: { what: 'Raíz nerviosa espinal. En la zona lumbar, cada raíz baja dentro del saco dural, sale por su manga, recorre el receso lateral bajo el pedículo y atraviesa el agujero de conjunción, donde está su ganglio sensitivo (el engrosamiento que ves).', func: 'Lleva la información de un dermatoma (zona de piel) y las órdenes a un miotoma (grupo muscular).', motion: 'En el modelo cambia de color cuando su trayecto se alarga (tensión, naranja) y cuando una hernia la comprime (rojo pulsante). La flexión del tronco tensa las raíces lumbosacras; la extensión estrecha el agujero de conjunción.', clinic: 'Regla clave en lo lumbar: una hernia paracentral/subarticular en L4-L5 comprime la raíz que baja (L5); una hernia foraminal o extraforaminal en L4-L5 comprime la que sale (L4).' },
  rootL4: { clinic: 'L4: sensibilidad en la cara interna de la pierna y el tobillo; fuerza del cuádriceps y del tibial anterior; reflejo rotuliano.' },
  rootL5: { clinic: 'L5: sensibilidad en la cara externa de la pierna, el dorso del pie y el dedo gordo; fuerza para levantar el dedo gordo y el pie (talones) y abducir la cadera; sin reflejo fiable.' },
  rootS1: { clinic: 'S1: sensibilidad en el borde externo del pie, el dedo pequeño y la planta; fuerza para ponerse de puntillas; reflejo aquíleo.' },
  thoracicNerves: { what: 'Nervios torácicos: cada uno sale bajo su vértebra y sigue el borde inferior de su costilla (nervio intercostal).', func: 'Inervan la piel y los músculos del tórax y del abdomen.', motion: '', clinic: '' },
  cervicalNerves: { what: 'Raíces cervicales; de C5 a T1 forman el plexo braquial que va al brazo.', func: 'Movimiento y sensibilidad del miembro superior.', motion: 'La extensión con rotación hacia un lado cierra el agujero de conjunción de ese lado.', clinic: '' },
  occipital: { what: 'Nervio occipital mayor (ramo dorsal de C2).', func: 'Sensibilidad de la nuca y el cuero cabelludo.', motion: '', clinic: 'Atraviesa el semiespinoso y el trapecio; su irritación da dolor occipital.' },
  sciatic: { what: 'Nervio ciático: el más grueso del cuerpo, formado por las raíces L4 a S3. Sale de la pelvis por el agujero ciático mayor, por debajo del músculo piriforme.', func: 'Inerva la parte posterior del muslo y toda la pierna y el pie.', motion: 'En el modelo verás que al flexionar la cadera (agacharse, sentarse con la pierna estirada) su recorrido detrás de la cadera se alarga y se tensa: es la base de la prueba de elevación de la pierna recta.', clinic: '“Ciática” describe dolor en su territorio; en la mayoría de los casos el origen es una raíz (L5 o S1) irritada por un disco, no el nervio en la nalga.' },
  femoral: { what: 'Nervios femoral (L2–L4) y obturador.', func: 'Cuádriceps, flexión de cadera y sensibilidad de la cara anterior e interna del muslo.', motion: 'El femoral se tensa con la extensión de cadera y la flexión de rodilla.', clinic: 'Una hernia alta (L2-L3, L3-L4) puede dar dolor en la cara anterior del muslo.' },
  medialBranch: { what: 'Ramos mediales de los ramos dorsales lumbares: pequeños nervios que cruzan la base de la apófisis transversa.', func: 'Inervan las articulaciones facetarias y el multífido.', motion: '', clinic: 'Son el objetivo de los bloqueos y radiofrecuencias facetarias.' },

  // ---------- Músculos ----------
  multifidus: { what: 'Multífido: el músculo más medial y profundo de la espalda lumbar. Sus fascículos nacen en las espinosas y bajan 2 a 5 niveles hasta las apófisis mamilares, el sacro y la cresta ilíaca (Macintosh y Bogduk).', func: 'Controla la posición de cada segmento (sobre todo en extensión y frente a la rotación). Cada fascículo depende de un solo nivel de inervación.', motion: 'Trabaja al volver de la flexión y en la rotación hacia el lado contrario (los oblicuos producen el giro; el multífido estabiliza).', clinic: 'Tras episodios de dolor lumbar se ha descrito atrofia e infiltración grasa del multífido en el nivel afectado.' },
  rotatores: { what: 'Rotadores: pequeños fascículos de la transversa a la lámina de la vértebra de encima (uno o dos niveles).', func: 'Más que mover, informan de la posición (propiocepción): tienen alta densidad de husos musculares.', motion: '', clinic: '' },
  interspinales: { what: 'Interespinosos: pares de pequeños músculos entre espinosas vecinas.', func: 'Propiocepción y control fino de la extensión.', motion: '', clinic: '' },
  intertransversarii: { what: 'Intertransversos: entre transversas y entre apófisis accesorias y mamilares.', func: 'Control fino de la inclinación lateral.', motion: '', clinic: '' },
  semispinalisT: { what: 'Semiespinoso torácico.', func: 'Extensión y rotación contralateral de la columna torácica.', motion: '', clinic: '' },
  semispinalisC: { what: 'Semiespinoso cervical.', func: 'Extensión cervical; muy importante para mantener la lordosis del cuello.', motion: '', clinic: '' },
  semispinalisCap: { what: 'Semiespinoso de la cabeza: el gran músculo vertical de la nuca, de las transversas torácicas altas al occipital.', func: 'Extiende la cabeza.', motion: 'Trabaja mucho al mirar el celular con la cabeza inclinada hacia delante.', clinic: '' },
  rcpMajor: { what: 'Recto posterior mayor de la cabeza (suboccipital).', func: 'Extiende y rota la cabeza.', motion: '', clinic: '' },
  rcpMinor: { what: 'Recto posterior menor de la cabeza.', func: 'Extensión fina de la cabeza; tiene conexiones con la duramadre.', motion: '', clinic: '' },
  ociInf: { what: 'Oblicuo inferior de la cabeza: de la espinosa de C2 a la transversa de C1.', func: 'Gira el atlas (y la cabeza) hacia su lado.', motion: '', clinic: '' },
  ociSup: { what: 'Oblicuo superior de la cabeza.', func: 'Extiende e inclina la cabeza.', motion: '', clinic: '' },
  longLumb: { what: 'Longísimo lumbar (porción lumbar del longísimo torácico): fascículos desde las apófisis accesorias y transversas lumbares hasta la espina ilíaca posterosuperior.', func: 'Extiende la columna lumbar y, por su orientación oblicua, tira de las vértebras hacia atrás (contrarresta el deslizamiento anterior).', motion: 'Trabaja de forma excéntrica al agacharse y concéntrica al volver.', clinic: '' },
  iliocLumb: { what: 'Iliocostal lumbar (porción lumbar): de las puntas de las transversas L1–L4 a la cresta ilíaca.', func: 'Extensión e inclinación lateral; controla la inclinación hacia el lado contrario.', motion: '', clinic: '' },
  longThor: { what: 'Longísimo torácico (porción torácica): vientres en el tórax y tendones largos que bajan hasta las espinosas lumbares y el sacro formando la aponeurosis del erector de la columna.', func: 'Extiende la columna actuando sobre toda la región lumbar como una “cuerda de arco”.', motion: 'Al final de la flexión completa los erectores suelen quedar eléctricamente silenciosos (fenómeno de relajación-flexión, alrededor de los dos tercios de la flexión máxima del tronco; Kippers y Parker 1984): la carga pasa a ligamentos y fascia.', clinic: '' },
  iliocThor: { what: 'Iliocostal lumbar (porción torácica): de los ángulos de las costillas inferiores a la cresta ilíaca y el sacro.', func: 'Extensión e inclinación lateral del tronco.', motion: '', clinic: '' },
  iliocThoracis: { what: 'Iliocostal torácico: une las costillas inferiores con las superiores.', func: 'Extensión e inclinación del tórax.', motion: '', clinic: '' },
  spinalis: { what: 'Espinoso torácico: el haz más medial del erector, de espinosa a espinosa.', func: 'Extensión de la columna torácica.', motion: '', clinic: '' },
  longCerv: { what: 'Longísimo cervical.', func: 'Extensión e inclinación del cuello.', motion: '', clinic: '' },
  longCap: { what: 'Longísimo de la cabeza: hasta la apófisis mastoides.', func: 'Extiende la cabeza y la gira hacia su lado.', motion: '', clinic: '' },
  iliocCerv: { what: 'Iliocostal cervical.', func: 'Extensión e inclinación del cuello.', motion: '', clinic: '' },
  ql: { what: 'Cuadrado lumbar: lámina cuadrilátera entre la cresta ilíaca, la 12ª costilla y las transversas lumbares, profunda a los erectores.', func: 'Inclina el tronco hacia su lado (o eleva la pelvis) y, trabajando a ambos lados, estabiliza la columna lumbar en el plano frontal. Fija la 12ª costilla al respirar.', motion: 'Al inclinarte a la derecha, el cuadrado lumbar izquierdo se alarga y frena el movimiento.', clinic: 'Es uno de los músculos que pueden participar en la defensa muscular asimétrica durante un episodio de dolor con lateral shift; esto es una hipótesis plausible, no un mecanismo demostrado.' },
  psoas: { what: 'Psoas mayor: nace de los cuerpos y discos de T12 a L5 y de las transversas, y llega al trocánter menor del fémur pasando por delante de la cadera.', func: 'Flexor principal de la cadera. Sobre la columna produce compresión axial importante y participa en la estabilidad lumbar.', motion: 'Se estira al extender la cadera (de pie, la pierna atrás) y se acorta sentado. Las raíces del plexo lumbar y el nervio femoral pasan a través de él.', clinic: 'Al estar unido a los discos lumbares, su contracción intensa aumenta la carga de compresión sobre ellos.' },
  iliacus: { what: 'Ilíaco: llena la fosa ilíaca y se une al tendón del psoas.', func: 'Flexión de cadera.', motion: '', clinic: '' },
  spleniusCap: { what: 'Esplenio de la cabeza: músculo plano en vendaje sobre la nuca.', func: 'Extiende la cabeza y la gira hacia su lado.', motion: '', clinic: '' },
  spleniusCerv: { what: 'Esplenio del cuello.', func: 'Extensión y rotación del cuello.', motion: '', clinic: '' },
  serratusPI: { what: 'Serrato posterior inferior: lámina delgada de las espinosas T11–L2 a las últimas costillas.', func: 'Desciende las costillas inferiores (función respiratoria discutida).', motion: '', clinic: '' },
  serratusPS: { what: 'Serrato posterior superior.', func: 'Eleva las costillas superiores.', motion: '', clinic: '' },
  rhomboidMinor: { what: 'Romboides menor.', func: 'Retrae y eleva la escápula.', motion: '', clinic: '' },
  rhomboidMajor: { what: 'Romboides mayor.', func: 'Retrae la escápula hacia la columna.', motion: '', clinic: '' },
  levator: { what: 'Elevador de la escápula: de las transversas C1–C4 al ángulo superior de la escápula.', func: 'Eleva la escápula e inclina el cuello.', motion: '', clinic: 'Frecuente punto de tensión en dolor cervical.' },
  trapezius: { what: 'Trapecio: gran músculo superficial en forma de rombo, del occipital y las espinosas C7–T12 a la clavícula, el acromion y la espina de la escápula.', func: 'Mueve y estabiliza la escápula; su porción superior también extiende el cuello.', motion: '', clinic: '' },
  latissimus: { what: 'Dorsal ancho: el músculo más extenso de la espalda. Nace de las espinosas T7–L5 y del sacro mediante la fascia toracolumbar, de la cresta ilíaca y de las últimas costillas, y se inserta en el húmero.', func: 'Extiende, aduce y rota el brazo hacia dentro. A través de la fascia toracolumbar conecta el brazo con la pelvis y el glúteo mayor del lado contrario.', motion: 'Su origen lumbar es aponeurótico (blanco en el modelo): tensa la fascia toracolumbar.', clinic: '' },
  piriformis: { what: 'Piriforme: de la cara anterior del sacro al trocánter mayor, atravesando el agujero ciático mayor.', func: 'Rotador externo de la cadera.', motion: '', clinic: 'El nervio ciático sale justo debajo (a veces lo atraviesa): la irritación en esa zona puede imitar una ciática de origen discal.' },
  gmed: { what: 'Glúteo medio.', func: 'Abductor de cadera: mantiene la pelvis nivelada al apoyarse en una pierna.', motion: '', clinic: 'Lo inerva la raíz L5 (vía nervio glúteo superior): su debilidad es un signo de radiculopatía L5.' },
  gmax: { what: 'Glúteo mayor.', func: 'Extensor potente de la cadera: es el motor principal para levantarse de una flexión con bisagra de cadera.', motion: 'Al agacharse trabaja de forma excéntrica junto con los isquiotibiales.', clinic: 'Conecta con el dorsal ancho del lado opuesto a través de la fascia toracolumbar.' },
  rectus: { what: 'Recto del abdomen, con sus intersecciones tendinosas.', func: 'Flexiona el tronco y controla la extensión.', motion: 'Se estira al arquearse hacia atrás.', clinic: '' },
  eo: { what: 'Oblicuo externo: fibras hacia abajo y adelante (“manos en los bolsillos”).', func: 'Rotación del tronco hacia el lado contrario, flexión e inclinación.', motion: 'Girar a la derecha usa el oblicuo externo izquierdo y el interno derecho.', clinic: '' },
  io: { what: 'Oblicuo interno: fibras perpendiculares a las del externo.', func: 'Rotación hacia su mismo lado; tensa la fascia toracolumbar.', motion: '', clinic: '' },
  ta: { what: 'Transverso del abdomen: la capa más profunda, con fibras horizontales que nacen de la fascia toracolumbar.', func: 'Aumenta la presión intraabdominal y tensa la fascia toracolumbar como un corsé.', motion: 'Suele activarse antes de mover un brazo o una pierna (control anticipatorio).', clinic: 'Se ha descrito retraso en su activación en personas con dolor lumbar, aunque la importancia clínica de este hallazgo es discutida.' },
};

export function infoFor(item) {
  if (!item) return null;
  const id = item.id || '';
  if (item.kind === 'bone') {
    const n = item.key;
    if (n === 'C1' || n === 'C2') return INFO[n];
    if (/^L\d/.test(n)) return INFO.lumbar;
    if (/^T\d/.test(n)) return INFO.thoracic;
    if (/^C\d/.test(n)) return INFO.cervical;
    if (n.startsWith('rib')) return INFO.rib;
    for (const k of ['sacrum', 'coccyx', 'pelvis', 'skull', 'sternum']) if (n === k) return INFO[k];
    for (const k of ['femur', 'scapula', 'clavicle', 'humerus']) if (n.startsWith(k)) return INFO[k];
  }
  if (item.kind === 'disc') return INFO.disc;
  if (item.kind === 'nucleus') return INFO.nucleus;
  if (item.kind === 'hernia') return INFO.hernia;
  if (item.root) {
    const extra = INFO['root' + item.root];
    return { ...INFO.root, clinic: INFO.root.clinic + (extra ? ' ' + extra.clinic : '') };
  }
  const base = id.replace(/[LR]$/, '');
  if (item.kind === 'nerve' && (base === 'thoracic' || base === 'cervical')) return INFO[base + 'Nerves'];
  for (const k of [id, base, base.replace(/^(thoracic|cervical|occipital|sciatic|femoral|medialBranch).*/, '$1')]) if (INFO[k]) return INFO[k];
  return null;
}
