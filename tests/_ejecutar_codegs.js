#!/usr/bin/env node
/* Ejecuta el doPost REAL de Code.gs contra una carpeta que hace de repositorio.
   stdin: {"datos": {...}, "repoDir": "/ruta", "ia": "ok"|"caida"}   stdout: la respuesta JSON del script. */
const fs = require('fs'), path = require('path');
const { entorno, PROPS, iaOK, PROPUESTA, MAPS_OK } = require('./_simulador');
const vm = require('vm');
let entrada = '';
process.stdin.on('data', (d) => (entrada += d)).on('end', () => {
  const { datos, repoDir, ia } = JSON.parse(entrada);
  const repo = { files: {}, commits: [] };
  const cdir = path.join(repoDir, 'c');
  fs.mkdirSync(cdir, { recursive: true });
  fs.readdirSync(cdir).filter((f) => f.endsWith('.json')).forEach((f) => (repo.files['c/' + f] = fs.readFileSync(path.join(cdir, f), 'utf8')));
  const antes = Object.assign({}, repo.files);
  const gemini = ia === 'caida' ? () => ({ code: 503, body: 'caído' }) : iaOK(PROPUESTA);
  const { ctx } = entorno(Object.assign({ GOOGLE_MAPS_API_KEY: 'AIza_FAKE' }, PROPS), repo, gemini, MAPS_OK);
  const r = vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(datos) }, parameter: {} });
  Object.keys(repo.files).forEach((k) => { if (repo.files[k] !== antes[k]) fs.writeFileSync(path.join(repoDir, k), repo.files[k]); });
  process.stdout.write(r.s);
});
