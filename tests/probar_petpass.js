/* Pruebas del servidor Pet Pass (apps-script/Code.gs): activar, PIN, bloqueo, campos limpios. */
const vm = require('vm'), crypto = require('crypto');
const { entorno } = require('./_simulador.js');
let ok = 0;
const check = (cond, msg) => { if (!cond) { console.error('✘ ' + msg); process.exit(1); } ok++; console.log('✓ ' + msg); };

function montar(props) {
  const repo = { files: {}, commits: [] };
  const { ctx } = entorno(props || { GITHUB_TOKEN: 'ghp_FAKE' }, repo, () => ({ code: 500, body: '' }));
  // Hoja de cálculo real en memoria y servicios que faltan en el simulador base
  const filas = [];
  const hoja = {
    getLastRow: () => filas.length, appendRow: (r) => filas.push(r.slice()), setFrozenRows() {},
    getDataRange: () => ({ getValues: () => filas.map((r) => r.slice()) }),
    getRange: (f, c) => ({ setValue: (v) => { while (filas[f - 1].length < c) filas[f - 1].push(''); filas[f - 1][c - 1] = v; } })
  };
  ctx.SpreadsheetApp = { getActive: () => ({ getSheetByName: (n) => (n === 'PetPass' && filas.length ? hoja : null), insertSheet: () => hoja }) };
  const store = Object.assign({}, props || { GITHUB_TOKEN: 'ghp_FAKE' });
  ctx.PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => (k in store ? store[k] : null), setProperty: (k, v) => { store[k] = v; } }) };
  ctx.Utilities.computeDigest = (alg, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b));
  ctx.Utilities.DigestAlgorithm = { SHA_256: 'sha256' }; ctx.Utilities.Charset = { UTF_8: 'utf8' };
  let n = 0; ctx.Utilities.getUuid = () => 'uuid-' + (++n);
  const post = (d) => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(d) }, parameter: {} }).s);
  return { ctx, repo, filas, post, store };
}

const t = montar();
const fichaOK = { nombre: 'Luna', tipo: 'gato', contactoTelefono: '+34 600 111 222', alertas: ['Miedo a ruidos'], foto: 'javascript:alert(1)',
  vet: { clinica: '<b>Clínica</b>' }, extra: 'no debe pasar', vacunas: [{ nombre: 'Rabia', fecha: '2026-10-12' }] };

let r = t.post({ accion: 'pet_estado', slug: 'pdesconoc' });
check(r.ok && r.estado === 'desconocida', 'chapa sin registrar → desconocida');
r = t.post({ accion: 'pet_guardar', slug: 'pdesconoc', pin: '1234', ficha: fichaOK });
check(!r.ok && /no está registrada/.test(r.error), 'no se puede activar una chapa sin registrar');

vm.runInContext('CREAR_CHAPAS_PET', t.ctx)();
check(t.filas.length === 11, 'CREAR_CHAPAS_PET crea 10 chapas + cabecera');
const slug = t.filas[1][0];
check(/^p[a-z2-9]{7}$/.test(slug) && t.filas[1][1] === 'libre', 'slug aleatorio y estado libre (' + slug + ')');
check(/\/pets\/\?id=p/.test(t.filas[1][3]), 'la hoja guarda la URL para grabar la chapa');

r = t.post({ accion: 'pet_estado', slug });
check(r.ok && r.estado === 'libre', 'chapa nueva → libre');
r = t.post({ accion: 'pet_guardar', slug, pin: '12', ficha: fichaOK });
check(!r.ok && /PIN/.test(r.error), 'rechaza PIN de menos de 4 números');
r = t.post({ accion: 'pet_guardar', slug, pin: '2580', ficha: { nombre: 'Sin tel' } });
check(!r.ok && /teléfono/.test(r.error), 'exige un teléfono de contacto');

r = t.post({ accion: 'pet_guardar', slug, pin: '2580', ficha: fichaOK });
check(r.ok, 'activa la chapa y publica la ficha');
const pub = JSON.parse(t.repo.files['pets/' + slug + '.json']);
check(pub.nombre === 'Luna' && pub.tipo === 'gato', 'ficha publicada en pets/<slug>.json');
check(!('pinHash' in pub) && !JSON.stringify(pub).includes('2580'), 'el PIN NO se publica');
check(pub.foto === '' && !('extra' in pub), 'descarta foto no válida y campos desconocidos');
check(!/[<>]/.test(pub.vet.clinica), 'quita etiquetas HTML');
check(t.filas[1][1] === 'activa' && /^[0-9a-f]{64}$/.test(t.filas[1][7]), 'hoja: estado activa + PIN cifrado');

r = t.post({ accion: 'pet_estado', slug });
check(r.estado === 'activa', 'chapa activada → activa');
r = t.post({ accion: 'pet_verificar', slug, pin: '2580' });
check(r.ok && !r.libre, 'PIN correcto desbloquea la edición');
r = t.post({ accion: 'pet_guardar', slug, pin: '9999', ficha: Object.assign({}, fichaOK, { nombre: 'Hackeada' }) });
check(!r.ok && /incorrecto/.test(r.error), 'con PIN incorrecto no se puede modificar');
check(JSON.parse(t.repo.files['pets/' + slug + '.json']).nombre === 'Luna', 'la ficha sigue intacta');

r = t.post({ accion: 'pet_guardar', slug, pin: '2580', ficha: Object.assign({}, fichaOK, { modoPerdida: { activo: true, mensaje: 'Se perdió', recompensa: '50 €' } }) });
check(r.ok && JSON.parse(t.repo.files['pets/' + slug + '.json']).modoPerdida.activo === true, 'el dueño activa el modo mascota perdida');

for (let i = 0; i < 4; i++) t.post({ accion: 'pet_verificar', slug, pin: '0000' });
r = t.post({ accion: 'pet_verificar', slug, pin: '2580' });
check(!r.ok && /intentos/.test(r.error), 'tras 5 fallos bloquea la chapa 15 minutos (incluso con el PIN bueno)');

const slug2 = t.filas[2][0];
r = t.post({ accion: 'pet_verificar', slug: slug2, pin: '1111' });
check(r.ok && r.libre, 'en una chapa libre, "Editar" lleva a activar');
r = t.post({ accion: 'pet_guardar', slug: '../etc', pin: '1234', ficha: fichaOK });
check(!r.ok, 'rechaza códigos de chapa con caracteres raros');
r = t.post({ accion: 'buscar', q: 'x' });
check(r && typeof r === 'object', 'las acciones del Closer siguen respondiendo');

const t2 = montar({});
vm.runInContext('CREAR_CHAPAS_PET', t2.ctx)();
r = t2.post({ accion: 'pet_guardar', slug: t2.filas[1][0], pin: '1234', ficha: fichaOK });
check(!r.ok && /GITHUB_TOKEN/.test(r.error), 'sin GITHUB_TOKEN avisa claramente');

console.log('\n' + ok + ' comprobaciones correctas');
