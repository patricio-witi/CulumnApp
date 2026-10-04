// Varias capturas en una sola carga. Uso: node tools/shots.mjs prefijo '[["nombre","js"],...]' [w] [h]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
const [prefix, list, w = '900', h = '800'] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const root = process.env.ROOT || 'docs';
const server = createServer((req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
if (process.env.NOWASM) await page.addInitScript(() => { delete window.WebAssembly; });
page.on('console', (m) => { if (m.type() !== 'log' || process.env.LOG) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${server.address().port}/?shot${process.env.Q || ''}`);
await page.waitForFunction('window.__ready === true', null, { timeout: 120000 }).catch(() => logs.push('timeout __ready'));
for (const [name, code] of JSON.parse(list)) {
  try { await page.evaluate(code); await page.evaluate('__app.render()'); } catch (e) { logs.push('eval error ' + e.message); }
  await page.screenshot({ path: `${prefix}${name}.png`, timeout: 120000 });
}
console.log(logs.slice(0, 40).join('\n'));
await browser.close(); server.close();
