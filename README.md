# Columna 3D

Atlas 3D interactivo de la columna vertebral, pensado para entender una discopatía y los episodios de *lateral shift*. Permite disecar capa por capa (hueso, discos, ligamentos, nervios, músculos profundos, erectores, capas superficiales, fascia y piel), mover la columna con rangos de movimiento publicados y ver qué ocurre en cada estructura.

## Qué incluye

- **Esqueleto completo de la columna**: 24 vértebras con cuerpo, pedículos, láminas, apófisis y carillas articulares con cartílago; sacro, cóccix, pelvis, costillas, esternón, cráneo, fémures y cintura escapular.
- **Discos deformables**: el anillo fibroso se abomba donde se comprime y el núcleo pulposo migra hacia el lado que se abre. Degeneración de Pfirrmann I–V (pérdida de altura, deshidratación) y hernias según la nomenclatura de Fardon 2014 (abombamiento, protrusión, extrusión, secuestro; zona central, paracentral, foraminal o extraforaminal).
- **Sistema nervioso**: médula y cono medular, saco dural, cauda equina con cada raíz L1–S4 recorriendo receso lateral y foramen (con su ganglio), intercostales, plexo braquial, ciático, femoral, obturador, occipital mayor y ramos mediales.
- **Ligamentos**: longitudinal anterior y posterior, amarillo, interespinosos, supraespinoso, nucal, iliolumbares, sacroilíacos, sacrotuberoso, sacroespinoso, cápsulas facetarias, transverso del atlas y alares.
- **Músculos** (fascículo a fascículo, anclados a sus inserciones): multífido, rotadores, interespinosos, intertransversos, semiespinosos, suboccipitales, longísimo e iliocostal (porciones lumbares y torácicas con la aponeurosis del erector), espinoso, cuadrado lumbar, psoas, ilíaco, esplenios, serratos posteriores, romboides, elevador de la escápula, trapecio, dorsal ancho, glúteos, piriforme y pared abdominal.
- **Movimiento**: flexión con ritmo lumbopélvico, extensión, inclinación y rotación con acoplamientos, bisagra de cadera frente a espalda redonda, sedestación erguida y encorvada, lateral shift, movimientos del cuello y carga en las manos.
- **Métricas en vivo**: ángulo de cada segmento, compresión y presión estimadas en L4-L5 (comparadas con las mediciones de Wilke 1999), altura de los forámenes, tensión de las raíces, migración del núcleo y actividad muscular estimada.
- **Mi columna**: configura tu discopatía y ve qué raíz queda comprometida, su dermatoma y cómo cambia con cada postura y con el lateral shift.
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
- `src/sim/` – control de postura y biomecánica.
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

## Límites

Es una anatomía media construida por procedimiento, no la columna de una persona concreta. La compresión discal sale de un modelo estático simplificado (error esperable de ±30–50 %); la actividad muscular es cualitativa y el índice de compresión radicular es ilustrativo. No sustituye la resonancia, la exploración clínica ni el criterio del equipo tratante.
