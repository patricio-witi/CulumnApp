// Captura de pantalla de la web con Chromium sin interfaz (para revisión visual)
// Uso: node tools/shot.mjs out.png "[js a evaluar antes de capturar]" [ancho] [alto]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
const [out = 'shot.png', code = '', w = '1400', h = '900'] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream', '.css': 'text/css' };
const root = process.env.ROOT || 'docs';
const server = createServer((req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${port}/?shot`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', null, { timeout: 120000 }).catch(() => logs.push('timeout esperando __ready'));
if (code) await page.evaluate(code);
await page.evaluate('window.__app && __app.render()');
await page.waitForTimeout(500);
await page.screenshot({ path: out, timeout: 120000 });
console.log(logs.filter((l) => !l.includes('GPU stall')).slice(0, 30).join('\n'));
await browser.close();
server.close();
