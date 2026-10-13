# Columna 3D

Atlas 3D interactivo de la columna vertebral, pensado para entender una discopatía y los episodios de *lateral shift*. Permite disecar capa por capa (hueso, discos, ligamentos, nervios, músculos profundos, erectores, capas superficiales, fascia y piel), mover la columna con rangos de movimiento publicados y ver qué ocurre en cada estructura.

## Qué incluye

- **Esqueleto completo**: 24 vértebras con cuerpo, pedículos, láminas, apófisis y carillas articulares con cartílago; sacro, cóccix, pelvis, costillas, esternón, cráneo, cintura escapular y extremidades (fémur, tibia y peroné, pie, húmero, radio y cúbito, mano) articuladas.
- **Discos deformables**: el anillo fibroso, con sus láminas y platillos, se abomba donde se comprime y el núcleo pulposo migra hacia el lado que se abre. Corte en cuadrante del disco y de sus vértebras orientado según la fisura, para ver el núcleo atravesando el anillo hasta la hernia. Degeneración de Pfirrmann I–V (pérdida de altura, deshidratación) y hernias según la nomenclatura de Fardon 2014 (abombamiento, protrusión, extrusión, secuestro; zona central, paracentral, foraminal o extraforaminal).
- **Sistema nervioso**: médula y cono medular, saco dural, cauda equina con cada raíz L1–S4 recorriendo receso lateral y foramen (con su ganglio), intercostales, plexo braquial, ciático, femoral, obturador, occipital mayor y ramos mediales.
- **Ligamentos**: longitudinal anterior y posterior, amarillo, interespinosos, supraespinoso, nucal, iliolumbares, sacroilíacos, sacrotuberoso, sacroespinoso, cápsulas facetarias, transverso del atlas y alares.
- **Músculos** (fascículo a fascículo, anclados a sus inserciones): multífido, rotadores, interespinosos, intertransversos, semiespinosos, suboccipitales, longísimo e iliocostal (porciones lumbares y torácicas con la aponeurosis del erector), espinoso, cuadrado lumbar, psoas, ilíaco, esplenios, serratos posteriores, romboides, elevador de la escápula, trapecio, dorsal ancho, glúteos, piriforme y pared abdominal.
- **Movimiento**: flexión con ritmo lumbopélvico, extensión, inclinación y rotación con acoplamientos, bisagra de cadera frente a espalda redonda, sedestación erguida y encorvada, lateral shift, movimientos del cuello y carga en las manos.
- **Métricas en vivo**: ángulo de cada segmento, compresión y presión estimadas en L4-L5 (comparadas con las mediciones de Wilke 1999), altura de los forámenes, tensión de las raíces, migración del núcleo y actividad muscular estimada.
- **Mi caso**, para entender los episodios repetidos de lateral shift en L4-L5:
  - *Qué me pasa*: cuatro hipótesis en 3D (raíz irritada por el disco, dolor del propio disco con fibras nerviosas en la fisura, espondilolistesis que se desliza con la carga y faceta), qué encaja con cada una, cómo se confirma y qué implica. Incluye exploraciones animadas: elevación de la pierna recta (también la cruzada, con el pie hacia arriba o el cuello flexionado), slump, marcha sobre talones y puntillas, abducción de cadera, reflejo rotuliano, y la listesis en flexión, extensión, de pie y acostado. También una lista de síntomas que marca qué hipótesis apoya cada uno.
  - *Por qué vuelve*: progresión crisis a crisis (fisura, fibras nerviosas, multífido más pequeño, raíz sensibilizada, defensa), desencadenantes con sus odds ratios, el disco por la mañana (hora del día ajustable), ponerse calcetines doblando la espalda frente a con el pie sobre la rodilla, y estar sentado mucho rato.
  - *Indicaciones*: prevención con su efecto (forest plot), qué hacer en una crisis, medicamentos, dolor persistente, cuándo considerar cirugía, plan de 12 semanas, planificador de caminatas, preguntas para el médico y señales de urgencia.
  - *Registro*: diario privado de crisis con patrones y exportación a CSV y a un resumen para el médico.
  - *Mi disco*: configura tu discopatía (Pfirrmann, hernia, deslizamiento) y ve qué raíz queda comprometida, su dermatoma y cómo cambia con cada postura y con el lateral shift.
- **Tensión neural**: el tracto raíz–ciático–tibial se alarga con la cadera, la rodilla, el tobillo y el cuello, y transmite la tensión a las raíces. Con una raíz irritada, el umbral de dolor baja.
- **Episodio** paso a paso para una lesión elegida (hernia hacia L4, L5 o S1, disco inflamado sin compresión o faceta): la mala fuerza con su carga frente a los límites publicados, la inflamación química (edema de la raíz y nube de mediadores), el dolor radicular frente al somático referido dibujado en la piel, la defensa muscular y el lateral shift con plomada, pruebas de movimiento (centralización o periferialización) y la resolución.
- **Ejercicios animados** de cuerpo entero con los músculos coloreados según su actividad: gato–camello, curl-up modificado, plancha lateral, perro de caza y bisagra de cadera (McGill); extensión en prono, extensión de pie y corrección del shift (McKenzie); puente de glúteos, bicho muerto, plancha frontal y deslizamiento del ciático. Cada uno con técnica, dosis, precauciones, carga publicada cuando existe y resumen de la evidencia.
- **Vista explosionada** de las capas musculares.
- **Clase guiada** de 17 pasos con cámara, capas y animaciones, y lectura en voz alta.
- **Cortes** sagital, coronal y axial (este último orientado como una resonancia).

## Cómo verla

La web compilada está en `docs/`. Se puede publicar con GitHub Pages (Settings → Pages → Deploy from a branch → carpeta `/docs`) o servir localmente:

```bash
npx http-server docs -p 8080
# abrir http://localhost:8080
```

Necesita un navegador con WebGL 2.

## Desarrollo

```bash
npm install
npm run bones   # regenera las mallas óseas (docs/assets/bones.bin) desde los modelos SDF (~4 min)
npm run build   # empaqueta src/ en docs/app.js y docs/index.html
```

- `tools/models/` – modelos óseos como campos de distancia, parametrizados con medidas anatómicas medias.
- `tools/build-bones.mjs` – mallado (surface nets), simplificación y compresión con meshoptimizer.
- `src/anatomy/spine-data.js` – dimensiones por nivel, curvaturas en reposo y rangos de movimiento.
- `src/core/` – esqueleto articulado, carga de huesos y selección por GPU.
- `src/tissues/` – fibras deformables (músculos, ligamentos, nervios), discos, fascia y piel.
- `src/sim/` – control de postura, biomecánica, tensión neural, ejercicios y demostraciones clínicas.
- `src/data/` – catálogos anatómicos, fichas y la clase guiada.
- `src/ui/` – interfaz y gráficos.

## Fuentes principales

- Wilke et al., *Spine* 1999 – presión intradiscal in vivo (un solo sujeto).
- Pearcy et al., *Spine* 1984; Pearcy y Tibrewal, *Spine* 1984 – movilidad lumbar por nivel.
- White y Panjabi, *Clinical Biomechanics of the Spine*, 2.ª ed., 1990 – movilidad torácica y cervical.
- Esola et al., *Spine* 1996 – ritmo lumbopélvico.
- Kippers y Parker, *Spine* 1984 – relajación-flexión.
- Inufusa et al., *Spine* 1996 – cambios del foramen en flexión y extensión.
- Pfirrmann et al., *Spine* 2001; Fardon et al., *Spine J* 2014.
- Brinjikji et al., *AJNR* 2015; Chiu et al., *Clin Rehabil* 2015.
- Matsui et al., *Spine* 1998; Suk et al., *Spine* 2001; Porter y Miller, *Spine* 1986 – lateral shift.
- Macintosh y Bogduk, *Clin Biomech* 1986 – multífido.
- Dolor e inflamación: Bogduk et al., *J Anat* 1981; Freemont et al., *Lancet* 1997; Olmarker et al., *Spine* 1993; Saal et al., *Spine* 1990; Howe et al., *Pain* 1977; Smyth y Wright, *JBJS* 1958; Bogduk, *Pain* 2009.
- Mecánica de la lesión: Adams y Hutton, *Spine* 1982; Callaghan y McGill, *Clin Biomech* 2001; Marshall y McGill, *Clin Biomech* 2010; Veres et al., *Eur Spine J* 2010; NIOSH 1981 y Waters et al., *Ergonomics* 1993; Gallagher y Marras, *Clin Biomech* 2012; Jäger, *EXCLI J* 2018.
- Shift y centralización: May y Aina, *Man Ther* 2012; Gillan et al., *Eur Spine J* 1998.
- Ejercicio: McGill, *Low Back Disorders* (2016) y *Back Mechanic* (2015); McKenzie, *Treat Your Own Back*; McGill, *Phys Ther* 1998; Ekstrom et al., *JOSPT* 2007; Okubo et al., *JOSPT* 2010; Kavcic et al., *Spine* 2004; Grenier y McGill, *Arch Phys Med Rehabil* 2007; Hodges y Richardson, *Spine* 1996; Hayden et al., *Cochrane* 2021; Lam et al., *JOSPT* 2018; Fernandez et al., *Spine* 2015; Basson et al., *JOSPT* 2017.

- Mi caso, diagnóstico: van der Windt et al., *Cochrane* 2010; Majlesi et al., *J Clin Rheumatol* 2008; Gilbert et al., *Spine* 2007; Kobayashi et al., *Spine* 2003; Laslett et al., *Spine J* 2005; Jacobsen et al., *Spine* 2007; Kalichman et al., *Spine* 2009; Suri et al., *JAMA* 2010; Segebarth et al., *J Spinal Disord Tech* 2015; Juch et al. (MINT), *JAMA* 2017.
- Mi caso, recurrencia: da Silva et al., *J Physiother* 2019; Steffens et al., *Arthritis Care Res* 2015; Callaghan y McGill, *Clin Biomech* 2001; Hides et al., *Spine* 1994 y 2001; Leatt et al., *Br J Sports Med* 1986; Adams et al., *Spine* 1987; Snook et al., *Spine* 1998; McGill y Brown, *Clin Biomech* 1992.
- Mi caso, indicaciones: Steffens et al., *JAMA Intern Med* 2016; Shiri et al., *Am J Epidemiol* 2018; Pocovi et al. (WalkBack), *Lancet* 2024; de Campos et al. (TOPS), *JOSPT* 2021; Verbeek et al., *Cochrane* 2011; Saraceni et al., *JOSPT* 2020; Dahm et al., *Cochrane* 2010; van der Gaag et al., *Cochrane* 2020; Williams et al. (PACE), *Lancet* 2014; Jones et al. (OPAL), *Lancet* 2023; Mathieson et al. (PRECISE), *NEJM* 2017; Goldberg et al., *JAMA* 2015; Oliveira et al., *Cochrane* 2020; Kent et al. (RESTORE), *Lancet* 2023; Peul et al., *NEJM* 2007; Bailey et al., *NEJM* 2020; Geere et al., *Bone Joint J* 2023; Fairbank et al., *BMJ* 2005; Brox et al., *Spine* 2003; Mannion et al., *Spine J* 2013; Hellum et al., *BMJ* 2011; Bråten et al. (AIM), *BMJ* 2019.

## Límites

Es una anatomía media construida por procedimiento, no la columna de una persona concreta. La compresión discal sale de un modelo estático simplificado (error esperable de ±30–50 %); la actividad muscular es cualitativa salvo donde se cita EMG publicado, y el índice de compresión radicular es ilustrativo. En la pestaña Episodio, la intensidad y la extensión del dolor son didácticas. En el modelo, el lateral shift no muestra un beneficio antiálgico: el modelo no incluye el mecanismo que lo explicaría, que tampoco está demostrado.

En Mi caso, los ángulos a los que una prueba se vuelve positiva, el ritmo con que avanza la degeneración entre crisis y el deslizamiento de la listesis son calibraciones didácticas, no mediciones de tu columna. El ligamento amarillo no está modelado como volumen. El registro de crisis es privado: en claude.ai se guarda en el espacio privado de cada persona y, en GitHub Pages, solo en el navegador.

No sustituye la resonancia, la exploración clínica ni el criterio del equipo tratante.
