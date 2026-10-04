// Empaqueta la web: src/ → docs/ (GitHub Pages) y dist-artifact/ (página sin esqueleto HTML)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';

const watch = process.argv.includes('--dev');
await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'esm',
  minify: !watch,
  sourcemap: false,
  target: ['es2022'],
  outfile: 'docs/app.js',
  legalComments: 'none',
  alias: { 'three/addons': './node_modules/three/examples/jsm' },
  logLevel: 'info',
});

const page = readFileSync('src/page.html', 'utf8');
// Versión completa para GitHub Pages
const full = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${page.match(/<title>[\s\S]*?<\/title>/)[0]}
<meta name="description" content="Atlas 3D interactivo de la columna: vértebras, discos, ligamentos, nervios y músculos, con simulación de movimientos y discopatía.">
${page.replace(/<title>[\s\S]*?<\/title>/, '').match(/<link[^>]*>/g)?.join('\n') ?? ''}
${page.match(/<style>[\s\S]*?<\/style>/)[0]}
</head>
<body>
${page.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<link[^>]*>/g, '').replace(/<style>[\s\S]*?<\/style>/, '').trim()}
</body>
</html>
`;
writeFileSync('docs/index.html', full);
mkdirSync('dist-artifact/assets', { recursive: true });
writeFileSync('dist-artifact/index.html', page);
copyFileSync('docs/app.js', 'dist-artifact/app.js');
for (const f of ['bones.bin', 'bones.json']) if (existsSync('docs/assets/' + f)) copyFileSync('docs/assets/' + f, 'dist-artifact/assets/' + f);
writeFileSync('docs/.nojekyll', '');
console.log('ok: docs/ y dist-artifact/');
