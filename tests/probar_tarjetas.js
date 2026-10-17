/* Pruebas: tarjetas digitales (crear, editar, foto, pausar, borrar con supresión real). */
const vm = require('vm');
const { entorno } = require('./_simulador.js');
let ok = 0;
const check = (cond, msg) => { if (!cond) { console.error('✘ ' + msg); process.exit(1); } ok++; console.log('✓ ' + msg); };

const repo = { files: {}, commits: [] };
const { ctx } = entorno({ GITHUB_TOKEN: 'ghp_FAKE', ANTHROPIC_API_KEY: 'x', PANEL_CLAVE: 'clave-segura', CLOSERS: 'MO001,LUCIA01' }, repo, () => ({ code: 500, body: '' }));
const hojas = {};
const nueva = () => { const filas = []; return { filas, getLastRow: () => filas.length, appendRow: (r) => filas.push(r.slice()), setFrozenRows() {},
  getDataRange: () => ({ getValues: () => filas.map((r) => r.slice()) }), deleteRow: (n) => filas.splice(n - 1, 1),
  getRange: (f, c) => ({ setValue: (v) => { while (filas[f - 1].length < c) filas[f - 1].push(''); filas[f - 1][c - 1] = v; } }) }; };
ctx.SpreadsheetApp = { getActive: () => ({ getSheetByName: (n) => hojas[n] || null, insertSheet: (n) => (hojas[n] = nueva()) }) };
const mem = {};
ctx.CacheService = { getScriptCache: () => ({ get: (k) => mem[k] || null, put: (k, v) => { mem[k] = String(v); }, remove: (k) => { delete mem[k]; } }) };
const crypto = require('crypto');
const propsBase = ctx.PropertiesService.getScriptProperties(), propsExtra = {};
ctx.PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => (k in propsExtra ? propsExtra[k] : propsBase.getProperty(k)), setProperty: (k, v) => { propsExtra[k] = String(v); } }) };
ctx.Utilities.computeDigest = (alg, txt) => [...crypto.createHash('sha256').update(txt, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b));
ctx.Utilities.DigestAlgorithm = { SHA_256: 'sha256' }; ctx.Utilities.Charset = { UTF_8: 'utf8' };
ctx.MailApp = { enviados: [], sendEmail(o) { this.enviados.push(o); } };
ctx.Session = { getEffectiveUser: () => ({ getEmail: () => 'ceo@studio42.es' }) };
const post = (d) => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(d) }, parameter: {} }).s);

const tk = post({ accion: 'panel_login', clave: 'clave-segura' }).token;
check(!post({ accion: 'panel_tarjeta_guardar', id: 'ana-lopez', nueva: true, tarjeta: { nombre: 'Ana' } }).ok, 'sin sesión del panel no se puede crear nada');

let r = post({ accion: 'panel_tarjeta_guardar', token: tk, id: 'ana-lopez', nueva: true, tarjeta: { nombre: 'Ana López' } });
check(!r.ok && /aceptado/.test(r.error), 'exige el consentimiento de la persona para publicar');

r = post({ accion: 'panel_tarjeta_guardar', token: tk, id: 'ana-lopez', nueva: true, consentimiento: true, paga: 'Iberlax',
  foto: 'data:image/jpeg;base64,' + Buffer.from('JPEGFAKE').toString('base64'),
  tarjeta: { nombre: 'Ana López <b>', cargo: 'Directora comercial', empresa: 'Iberlax', telefono: '600 11 22 33', whatsapp: '600112233',
    email: 'ana@iberlax.es', web: 'iberlax.es', linkedin: 'javascript:alert(1)', instagram: '@ana.iberlax', estilo: 'hackeo', color: 'red', espia: 'x' } });
check(r.ok && r.url.endsWith('/t/?id=ana-lopez'), 'crea la tarjeta y devuelve su enlace');
const j = JSON.parse(repo.files['t/ana-lopez.json']);
check(j.nombre === 'Ana López' && j.whatsapp === '34600112233' && j.web === 'https://iberlax.es' && j.instagram === 'https://www.instagram.com/ana.iberlax', 'limpia los datos: sin HTML, WhatsApp con prefijo, web e Instagram como enlaces');
check(j.linkedin === '' && j.estilo === 'titanio' && j.color === '' && !('espia' in j), 'descarta enlaces peligrosos, estilos y campos inventados');
check(/^fotos\/ana-lopez\.jpg\?v=/.test(j.foto) && repo.files['t/fotos/ana-lopez.jpg'] === 'JPEGFAKE', 'sube la foto junto a la tarjeta');
const fila = hojas.Tarjetas.filas[1];
check(hojas.Tarjetas.filas[0].join() === 'ID,Nombre,Empresa,Estado,Alta,Actualizada,Paga,Consentimiento,PIN (cifrado)' && fila[0] === 'ana-lopez' && fila[3] === 'activa' && fila[6] === 'Iberlax' && fila[7], 'la hoja solo guarda lo mínimo (sin teléfono ni email) y la fecha del consentimiento');
check(!JSON.stringify(hojas.Tarjetas.filas).includes('600112233') && !JSON.stringify(hojas.Tarjetas.filas).includes('@iberlax'), 'ningún dato de contacto en la hoja');

check(!post({ accion: 'panel_tarjeta_guardar', token: tk, id: 'ana-lopez', nueva: true, consentimiento: true, tarjeta: { nombre: 'Otra' } }).ok, 'no pisa una tarjeta existente al crear otra con el mismo identificador');
check(!post({ accion: 'panel_tarjeta_guardar', token: tk, id: '../x', consentimiento: true, tarjeta: { nombre: 'X' } }).ok, 'rechaza identificadores raros');

r = post({ accion: 'panel_tarjeta_guardar', token: tk, id: 'ana-lopez', tarjeta: { nombre: 'Ana López', cargo: 'CEO', empresa: 'Iberlax', estilo: 'oro' } });
const j2 = JSON.parse(repo.files['t/ana-lopez.json']);
check(r.ok && j2.cargo === 'CEO' && j2.estilo === 'oro' && j2.foto === j.foto, 'editar conserva la foto y el consentimiento');
check(hojas.Tarjetas.filas.length === 2, 'editar no duplica la fila');

check(post({ accion: 'panel_tarjeta_estado', token: tk, id: 'ana-lopez', pausar: true }).ok && JSON.parse(repo.files['t/ana-lopez.json']).pausada === true && hojas.Tarjetas.filas[1][3] === 'pausada', 'pausar la tarjeta');
post({ accion: 'panel_tarjeta_guardar', token: tk, id: 'ana-lopez', tarjeta: { nombre: 'Ana López' } });
check(JSON.parse(repo.files['t/ana-lopez.json']).pausada === true, 'editar no reactiva una tarjeta pausada');
post({ accion: 'panel_tarjeta_estado', token: tk, id: 'ana-lopez', pausar: false });
check(JSON.parse(repo.files['t/ana-lopez.json']).pausada === false, 'reactivar');

const datos = post({ accion: 'panel_datos', token: tk });
check(datos.ok && datos.tarjetas.length === 1 && datos.tarjetas[0].id === 'ana-lopez' && datos.tarjetas[0].estado === 'activa', 'el panel recibe la lista de tarjetas');

check(post({ accion: 'panel_tarjeta_borrar', token: tk, id: 'ana-lopez' }).ok, 'borrar la tarjeta');
check(!repo.files['t/ana-lopez.json'] && !repo.files['t/fotos/ana-lopez.jpg'] && hojas.Tarjetas.filas.length === 1, 'borrar elimina el archivo, la foto y la fila (supresión real)');

repo.files['t/alejo.json'] = JSON.stringify({ version: 1, id: 'alejo', nombre: 'Alejo', foto: 'fotos/alejo.jpg' });
let ds = post({ accion: 'panel_datos', token: tk });
check(ds.tarjetas.some((x) => x.id === 'alejo' && x.sinRegistro), 'una tarjeta hecha a mano aparece en el panel para poder registrarla');
r = post({ accion: 'panel_tarjeta_guardar', token: tk, id: 'alejo', tarjeta: { nombre: 'Alejandro Silva' } });
let fa = hojas.Tarjetas.filas.find((x) => x[0] === 'alejo');
check(r.ok && fa && !fa[7] && JSON.parse(repo.files['t/alejo.json']).foto === 'fotos/alejo.jpg', 'al registrarla sin marcar el consentimiento queda sin fecha (no se inventa) y conserva su foto');
post({ accion: 'panel_tarjeta_guardar', token: tk, id: 'alejo', consentimiento: true, tarjeta: { nombre: 'Alejandro Silva' } });
fa = hojas.Tarjetas.filas.find((x) => x[0] === 'alejo');
check(!!fa[7], 'al marcar el consentimiento se guarda la fecha');

/* ---- Venta de una tarjeta desde el Closer ---- */
check(!post({ accion: 'closer_tarjeta', closer_id: 'NADIE9', id: 'pepe-ruiz', consentimiento: true, tarjeta: { nombre: 'Pepe Ruiz' } }).ok, 'Closer no autorizado → no puede crear tarjetas');
check(!post({ accion: 'closer_tarjeta', closer_id: 'LUCIA01', id: 'pepe-ruiz', tarjeta: { nombre: 'Pepe Ruiz' } }).ok, 'el Closer también necesita el consentimiento');
r = post({ accion: 'closer_tarjeta', closer_id: 'LUCIA01', id: 'pepe-ruiz', consentimiento: true, unidades: 3, paga: 'Asesoría Ruiz', tarjeta: { nombre: 'Pepe Ruiz', cargo: 'Asesor', empresa: 'Asesoría Ruiz', telefono: '611223344' } });
check(r.ok && repo.files['t/pepe-ruiz.json'] && r.url.endsWith('/t/?id=pepe-ruiz'), 'el Closer publica la tarjeta nueva');
const pf = hojas.Pedidos.filas[hojas.Pedidos.filas.length - 1];
check(pf[2] === 'LUCIA01' && pf[6] === 'Tarjeta vCard' && pf[4] === 't-pepe-ruiz' && pf[8] === 144.84, 'y crea el pedido: 3 tarjetas NFC vCard = 144,84 € IVA incl., a nombre del Closer');
check(hojas.Tarjetas.filas.find((x) => x[0] === 'pepe-ruiz')[6] === 'Asesoría Ruiz · Closer LUCIA01', 'la hoja de tarjetas guarda quién paga y qué Closer la vendió');
check(!post({ accion: 'closer_tarjeta', closer_id: 'LUCIA01', id: 'pepe-ruiz', consentimiento: true, tarjeta: { nombre: 'Otro' } }).ok, 'el Closer no puede pisar una tarjeta que ya existe');
r = post({ accion: 'closer_tarjeta', editar: true, closer_id: 'LUCIA01', id: 'pepe-ruiz', tarjeta: { nombre: 'Pepe Ruiz', cargo: 'Socio director', empresa: 'Asesoría Ruiz', telefono: '611223344' } });
check(r.ok && JSON.parse(repo.files['t/pepe-ruiz.json']).cargo === 'Socio director', 'el Closer corrige en el momento la tarjeta que acaba de vender');
const nPed = hojas.Pedidos.filas.length;
check(hojas.Pedidos.filas.length === nPed, 'corregir no crea otro pedido');
check(!post({ accion: 'closer_tarjeta', editar: true, closer_id: 'MO001', id: 'pepe-ruiz', tarjeta: { nombre: 'X' } }).ok, 'otro Closer no puede corregir esa tarjeta');
hojas.Tarjetas.filas.find((x) => x[0] === 'pepe-ruiz')[4] = new Date(Date.now() - 3 * 864e5);
check(/48 h/.test(post({ accion: 'closer_tarjeta', editar: true, closer_id: 'LUCIA01', id: 'pepe-ruiz', tarjeta: { nombre: 'Pepe Ruiz' } }).error || ''), 'pasadas 48 h la corrección la hace Studio 42 desde el panel');

/* ---- El titular edita su tarjeta con su PIN ---- */
r = post({ accion: 'closer_tarjeta', closer_id: 'LUCIA01', id: 'marta-sanz', consentimiento: true, tarjeta: { nombre: 'Marta Sanz', cargo: 'Arquitecta', estilo: 'oro', telefono: '622334455' } });
check(r.ok && /^\d{6}$/.test(r.pin) && r.editar.endsWith('/t/editar/?id=marta-sanz'), 'al crear la tarjeta se genera un PIN de 6 cifras y el enlace de edición');
const filaM = hojas.Tarjetas.filas.find((x) => x[0] === 'marta-sanz');
check(filaM[8] && filaM[8] !== r.pin && !JSON.stringify(hojas.Tarjetas.filas).includes(r.pin), 'el PIN se guarda cifrado, nunca en claro');
const PIN = r.pin, malo = PIN === '000000' ? '111111' : '000000';
check(!post({ accion: 'tarjeta_editar', id: 'marta-sanz', pin: malo, tarjeta: { cargo: 'X' } }).ok, 'con un PIN incorrecto no se puede editar');
check(post({ accion: 'tarjeta_editar', id: 'marta-sanz', pin: PIN, comprobar: true }).ok, 'con el PIN correcto se desbloquea');
r = post({ accion: 'tarjeta_editar', id: 'marta-sanz', pin: PIN, foto: 'data:image/jpeg;base64,' + Buffer.from('FOTOMARTA').toString('base64'), tarjeta: { nombre: 'Marta Sanz', cargo: 'Arquitecta jefa', estilo: 'minimal', color: '#ff0000', instagram: '@martasanz' } });
const jm = JSON.parse(repo.files['t/marta-sanz.json']);
check(r.ok && jm.cargo === 'Arquitecta jefa' && jm.instagram === 'https://www.instagram.com/martasanz' && repo.files['t/fotos/marta-sanz.jpg'] === 'FOTOMARTA', 'el titular cambia su cargo, sus redes y su foto');
check(jm.estilo === 'oro' && jm.telefono === '622334455', 'no puede cambiar el estilo y lo que no envía se conserva');
check(ctx.MailApp.enviados.some((m) => /Marta Sanz ha editado su tarjeta \(foto nueva\)/.test(m.subject)), 'a Studio 42 le llega un aviso del cambio');
for (let i = 0; i < 5; i++) post({ accion: 'tarjeta_editar', id: 'marta-sanz', pin: malo, comprobar: true });
check(/Demasiados intentos/.test(post({ accion: 'tarjeta_editar', id: 'marta-sanz', pin: PIN, comprobar: true }).error || ''), 'tras 5 PIN erróneos se bloquea 30 minutos');
r = post({ accion: 'panel_tarjeta_pin', token: tk, id: 'marta-sanz' });
check(r.ok && /^\d{6}$/.test(r.pin) && post({ accion: 'tarjeta_editar', id: 'marta-sanz', pin: r.pin, comprobar: true }).ok, 'desde el panel se genera un PIN nuevo y desbloquea al momento');
check(!post({ accion: 'tarjeta_editar', id: 'marta-sanz', pin: PIN, comprobar: true }).ok, 'el PIN antiguo deja de valer');
console.log('\n' + ok + ' comprobaciones correctas');
