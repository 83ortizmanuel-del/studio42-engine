/* Pruebas del servidor: pedidos del Closer y panel de control (login, datos, estados, cambios con Claude). */
const vm = require('vm'), fs = require('fs'), path = require('path');
const { entorno } = require('./_simulador.js');
let ok = 0;
const check = (cond, msg) => { if (!cond) { console.error('✘ ' + msg); process.exit(1); } ok++; console.log('✓ ' + msg); };

function montar(props, ia) {
  const repo = { files: {}, commits: [] };
  repo.files['c/ankara-kebab.json'] = fs.readFileSync(path.join(__dirname, '..', 'c', 'ankara-kebab.json'), 'utf8');
  const { ctx } = entorno(props, repo, ia || (() => ({ code: 500, body: '' })));
  const hojas = {};
  const nuevaHoja = () => { const filas = []; return { filas, getLastRow: () => filas.length, appendRow: (r) => filas.push(r.slice()), setFrozenRows() {},
    getDataRange: () => ({ getValues: () => filas.map((r) => r.slice()) }),
    getRange: (f, c) => ({ setValue: (v) => { filas[f - 1][c - 1] = v; } }) }; };
  ctx.SpreadsheetApp = { getActive: () => ({ getSheetByName: (n) => hojas[n] || null, insertSheet: (n) => (hojas[n] = nuevaHoja()) }) };
  const store = Object.assign({}, props);
  ctx.PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => (k in store ? store[k] : null), setProperty: (k, v) => { store[k] = v; } }) };
  const mem = {};
  ctx.CacheService = { getScriptCache: () => ({ get: (k) => mem[k] || null, put: (k, v) => { mem[k] = String(v); }, remove: (k) => { delete mem[k]; } }) };
  // GitHub: listado de la carpeta c/
  const fetchBase = ctx.UrlFetchApp.fetch;
  ctx.UrlFetchApp.fetch = (url, o) => {
    if (/\/contents\/c\?ref=/.test(url)) return { getResponseCode: () => 200, getContentText: () => JSON.stringify(Object.keys(repo.files).filter((f) => f.startsWith('c/')).map((f) => ({ name: f.slice(2), type: 'file' }))) };
    return fetchBase(url, o);
  };
  const post = (d) => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(d) }, parameter: {} }).s);
  return { ctx, repo, hojas, post, mem };
}
const PROPS = { GITHUB_TOKEN: 'ghp_FAKE', ANTHROPIC_API_KEY: 'sk-ant-FAKE', CLOSERS: 'MO001', PANEL_CLAVE: 'clave-segura' };

/* ---- Cálculo de pedidos ---- */
const t = montar(PROPS);
const calc = (p, c, promo) => vm.runInContext('pedidoCalcular_', t.ctx)(p, c, promo);
let r = calc('iman', { display: 1, llavero: 5 });
check(r.base === 208.7 && r.total === 252.53, 'Imán + 3 llaveros extra = 208,70 € + IVA = 252,53 €');
r = calc('dominio', { llavero: 30 });
check(r.lineas.find((l) => l.pieza === 'llavero').extra === 5 && r.base === 648.5, 'Dominio con 30 llaveros: cobra solo los 5 de más');
r = calc('multiplicador', { llavero: 3 });
check(r.lineas.find((l) => l.pieza === 'llavero').unidades === 10 && r.base === 349, 'no se puede bajar de lo incluido en el pack');
r = calc('ninguno', { camiseta: 4, display: 1 });
check(r.aConsultar && r.base === 49, 'camisetas a consultar no suman y lo avisan');
r = calc('hackeado', { llavero: 2 });
check(r.pack === 'ninguno' && r.base === 39.8, 'pack desconocido → solo piezas');
r = calc('prueba', { llavero: 1 }, true);
check(r.llaverosRegalo === 2 && r.base === 89, 'promo lanzamiento: 2 llaveros de regalo sin coste');

/* ---- El catálogo del formulario coincide con el del servidor ---- */
const html = fs.readFileSync(path.join(__dirname, '..', 'v', 'closer', 'index.html'), 'utf8');
const catCloser = vm.runInNewContext('(' + html.match(/const CATALOGO = (\{[\s\S]*?\n {8}\});/)[1] + ')');
const catServer = vm.runInContext('CATALOGO', t.ctx);
check(JSON.stringify(catCloser) === JSON.stringify(catServer), 'precios y packs del formulario = los del servidor');

/* ---- Guardar pedido ---- */
r = t.post({ accion: 'pedido_guardar', closer_id: 'XX9', slug: 'ankara-kebab', pack: 'iman', cantidades: {} });
check(!r.ok && /no autorizado/.test(r.error), 'pedido de un Closer no autorizado → rechazado');
r = t.post({ accion: 'pedido_guardar', closer_id: 'MO001', slug: 'ankara-kebab', cliente: 'Ankara <b>Kebab</b>', pack: 'iman', cantidades: { display: 1, llavero: 5 }, notas: 'turnos' });
check(r.ok && /^P\d+-[0-9A-F]{4}$/.test(r.pedido.id), 'pedido guardado con ID ' + (r.pedido && r.pedido.id));
const fila = t.hojas.Pedidos.filas[1];
check(fila[3] === 'Ankara Kebab' && fila[8] === 252.53 && fila[9] === 'Por despachar', 'hoja Pedidos: cliente limpio, total y estado «Por despachar»');
r = t.post({ accion: 'pedido_guardar', closer_id: 'MO001', slug: 'ankara-kebab', pack: 'ninguno', cantidades: {} });
check(!r.ok && /vacío/.test(r.error), 'pedido vacío → rechazado');

/* ---- Panel: acceso ---- */
r = t.post({ accion: 'panel_datos', token: 'inventado' });
check(!r.ok && r.sesion === false, 'sin sesión no se ve nada');
r = t.post({ accion: 'panel_login', clave: 'mala' });
check(!r.ok && /incorrecta/.test(r.error), 'contraseña incorrecta');
r = t.post({ accion: 'panel_login', clave: 'clave-segura' });
check(r.ok && r.token.length > 30, 'contraseña correcta → sesión');
const token = r.token;
const t2 = montar({ GITHUB_TOKEN: 'x' });
check(/PANEL_CLAVE/.test(t2.post({ accion: 'panel_login', clave: 'loquesea' }).error), 'sin PANEL_CLAVE avisa de cómo crearla');
const t3 = montar(PROPS); t3.ctx.CacheService.getScriptCache().put('panelfail', '10');
check(/Demasiados/.test(t3.post({ accion: 'panel_login', clave: 'clave-segura' }).error), 'bloquea 15 min tras 10 intentos fallidos');

/* ---- Panel: datos y estados ---- */
r = t.post({ accion: 'panel_datos', token });
check(r.ok && r.clientes.includes('ankara-kebab') && r.pedidos.length === 1 && r.pedidos[0].calc.total === 252.53, 'panel ve clientes y pedidos con su importe');
r = t.post({ accion: 'panel_pedido_estado', token, id: r.pedidos[0].id, estado: 'Grabado' });
check(r.ok && t.hojas.Pedidos.filas[1][9] === 'Grabado', 'cambiar estado a «Grabado» se guarda en la hoja');
check(!t.post({ accion: 'panel_pedido_estado', token, id: 'x', estado: 'Robado' }).ok, 'estado inventado → rechazado');

/* ---- Panel: cambios con Claude ---- */
const iaOps = (obj) => () => ({ code: 200, body: { content: [{ type: 'text', text: 'Aquí tienes:\n' + JSON.stringify(obj) }] } });
let tc = montar(PROPS, iaOps({ resumen: 'Acento dorado.', operaciones: [{ op: 'set', ruta: 'colorAcento', valor: '#D4A537' }] }));
let tk = tc.post({ accion: 'panel_login', clave: 'clave-segura' }).token;
r = tc.post({ accion: 'panel_cambio', token: tk, slug: 'ankara-kebab', instruccion: 'pon el acento dorado' });
check(r.ok && r.propuesta.colorAcento === '#D4A537' && r.resumen === 'Acento dorado.', 'Claude propone un cambio y vuelve la vista previa');
check(JSON.parse(tc.repo.files['c/ankara-kebab.json']).colorAcento !== '#D4A537', 'la propuesta NO se publica sola');
r = tc.post({ accion: 'panel_publicar', token: tk, slug: 'ankara-kebab' });
check(r.ok && JSON.parse(tc.repo.files['c/ankara-kebab.json']).colorAcento === '#D4A537', 'al publicar se escribe en GitHub');
check(!tc.post({ accion: 'panel_publicar', token: tk, slug: 'ankara-kebab' }).ok, 'no se puede publicar dos veces la misma propuesta');

const nb = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'c', 'ankara-kebab.json'), 'utf8')).secciones[0].botones.length;
tc = montar(PROPS, iaOps({ resumen: 'Botón nuevo', operaciones: [{ op: 'insertar', ruta: 'secciones.0.botones', indice: 0, valor: { tipo: 'whatsapp', nombre: 'Pedir <script>x</script>para llevar', icono: 'chat', mensaje: 'Hola' } }] }));
tk = tc.post({ accion: 'panel_login', clave: 'clave-segura' }).token;
r = tc.post({ accion: 'panel_cambio', token: tk, slug: 'ankara-kebab', instruccion: 'añade botón para llevar' });
check(r.ok && r.propuesta.secciones[0].botones.length === nb + 1 && !/<script>/.test(r.propuesta.secciones[0].botones[0].nombre), 'insertar botón funciona y quita HTML');

tc = montar(PROPS, iaOps({ resumen: 'x', operaciones: [{ op: 'set', ruta: 'colorAcento', valor: 'rojo' }] }));
tk = tc.post({ accion: 'panel_login', clave: 'clave-segura' }).token;
r = tc.post({ accion: 'panel_cambio', token: tk, slug: 'ankara-kebab', instruccion: 'rojo' });
check(!r.ok && /rompería/.test(r.error), 'un cambio que rompe la landing se rechaza');

tc = montar(PROPS, iaOps({ resumen: 'x', operaciones: [{ op: 'set', ruta: '_generado', valor: true }] }));
tk = tc.post({ accion: 'panel_login', clave: 'clave-segura' }).token;
check(!tc.post({ accion: 'panel_cambio', token: tk, slug: 'ankara-kebab', instruccion: 'marca generado' }).ok, 'no puede tocar campos protegidos');

tc = montar(PROPS, iaOps({ resumen: 'No sé qué teléfono poner. Dime el número.', operaciones: [] }));
tk = tc.post({ accion: 'panel_login', clave: 'clave-segura' }).token;
r = tc.post({ accion: 'panel_cambio', token: tk, slug: 'ankara-kebab', instruccion: 'cambia el teléfono' });
check(r.ok && r.sinCambios && /número/.test(r.resumen), 'si falta información, Claude pregunta en vez de inventar');

tc = montar(PROPS, () => ({ code: 529, body: 'overloaded' }));
tk = tc.post({ accion: 'panel_login', clave: 'clave-segura' }).token;
check(/Claude no respondió/.test(tc.post({ accion: 'panel_cambio', token: tk, slug: 'ankara-kebab', instruccion: 'algo' }).error), 'si Claude falla, avisa sin tocar nada');

console.log('\n' + ok + ' comprobaciones correctas');
