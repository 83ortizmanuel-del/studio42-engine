/* Pruebas: planes, enlace de pago Stripe, sincronización, pausa por impago, estadísticas e informe mensual. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const { entorno } = require('./_simulador.js');
let ok = 0;
const check = (cond, msg) => { if (!cond) { console.error('✘ ' + msg); process.exit(1); } ok++; console.log('✓ ' + msg); };

function montar(props, stripeMock) {
  const repo = { files: {}, commits: [] };
  repo.files['c/ankara-kebab.json'] = fs.readFileSync(path.join(__dirname, '..', 'c', 'ankara-kebab.json'), 'utf8');
  const { ctx } = entorno(props, repo, () => ({ code: 500, body: '' }));
  const hojas = {};
  const nueva = () => { const filas = []; return { filas, getLastRow: () => filas.length, appendRow: (r) => filas.push(r.slice()), setFrozenRows() {},
    getDataRange: () => ({ getValues: () => filas.map((r) => r.slice()) }), getRange: (f, c) => ({ setValue: (v) => { while (filas[f - 1].length < c) filas[f - 1].push(''); filas[f - 1][c - 1] = v; } }) }; };
  ctx.SpreadsheetApp = { getActive: () => ({ getSheetByName: (n) => hojas[n] || null, insertSheet: (n) => (hojas[n] = nueva()) }) };
  const store = Object.assign({}, props);
  ctx.PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => (k in store ? store[k] : null), setProperty: (k, v) => { store[k] = v; } }) };
  const mem = {};
  ctx.CacheService = { getScriptCache: () => ({ get: (k) => mem[k] || null, put: (k, v) => { mem[k] = String(v); }, remove: (k) => { delete mem[k]; } }) };
  const mails = []; ctx.MailApp = { sendEmail: (o) => mails.push(o) };
  ctx.Utilities.formatDate = (d, tz, f) => (f === 'MMMM yyyy' ? 'septiembre 2026' : '20261012');
  const llamadas = [];
  const base = ctx.UrlFetchApp.fetch;
  ctx.UrlFetchApp.fetch = (url, o) => {
    if (url.startsWith('https://api.stripe.com/v1/')) {
      llamadas.push({ url, o });
      const r = stripeMock(url.replace('https://api.stripe.com/v1/', ''), o || {});
      return { getResponseCode: () => r.code || 200, getContentText: () => JSON.stringify(r.body) };
    }
    return base(url, o);
  };
  const post = (d) => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(d) }, parameter: {} }).s);
  return { ctx, repo, hojas, post, store, mails, llamadas, mem };
}
const dec = (q) => Object.fromEntries(String(q).split('&').map((x) => x.split('=').map(decodeURIComponent)));
const PROPS = { GITHUB_TOKEN: 'ghp_FAKE', ANTHROPIC_API_KEY: 'x', CLOSERS: 'MO001', PANEL_CLAVE: 'clave-segura' };

/* ---- Precios ---- */
let t = montar(PROPS, () => ({ body: {} }));
const pp = (a, b) => vm.runInContext('precioPlan_', t.ctx)(a, b);
check(pp('pro', 'mensual') === 39 && pp('pro', 'trimestral') === 111.15 && pp('pro', 'anual') === 390, 'Pro: 39 / 111,15 / 390 €');
check(pp('esencial', 'anual') === 190 && pp('multisede', 'trimestral') === 225.15 && pp('clinica', 'mensual') === 29, 'Esencial, Multi-sede y Clínica bien calculados');
const html = fs.readFileSync(path.join(__dirname, '..', 'condiciones.html'), 'utf8');
check(['54,15 €', '111,15 €', '225,15 €', '82,65 €', '190 €', '390 €', '790 €', '290 €'].every((x) => html.includes(x)), 'las condiciones publicadas muestran los mismos precios');
const web = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
check(/data-m="19"/.test(web) && /data-m="39"/.test(web) && /data-m="79"/.test(web) && !/Pago único/.test(web), 'la portada muestra los planes y ya no promete «pago único»');

/* ---- Pedido con plan, sin Stripe ---- */
let r = t.post({ accion: 'pedido_guardar', closer_id: 'MO001', slug: 'ankara-kebab', cliente: 'Ankara', pack: 'iman', cantidades: { llavero: 2 }, plan: 'pro', periodo: 'mensual', email: 'a@b.es' });
check(r.ok && r.pago && r.pago.sinStripe && /aún no está activado/.test(r.pago.error), 'sin Stripe: el pedido se guarda y avisa de cobro manual');
check(t.hojas.Suscripciones.filas[1][0] === 'ankara-kebab' && t.hojas.Suscripciones.filas[1][4] === 'pendiente de pago' && r.pedido.suscripcion.mesesGratis === 2, 'queda la suscripción «pendiente de pago» con 2 meses gratis (Imán)');

/* ---- Crear productos en Stripe ---- */
let n = 0;
t = montar(Object.assign({ STRIPE_SECRET_KEY: 'sk_test_x' }, PROPS), (ruta, o) => {
  if (ruta === 'products') return { body: { id: 'prod_' + (++n) } };
  if (ruta === 'prices') { const p = dec(o.payload); return { body: { id: 'price_' + p['metadata[plan]'] + '_' + p['metadata[periodo]'], amount: p.unit_amount } }; }
  return { code: 404, body: {} };
});
vm.runInContext('CREAR_PRODUCTOS_STRIPE', t.ctx)();
const precios = JSON.parse(t.store.STRIPE_PRECIOS);
check(Object.keys(precios).length === 12, 'crea 12 precios en Stripe (4 planes × 3 periodos)');
const proAnual = t.llamadas.find((x) => /prices/.test(x.url) && /metadata%5Bplan%5D=pro&metadata%5Bperiodo%5D=anual/.test(x.o.payload));
check(proAnual && dec(proAnual.o.payload).unit_amount === '47190' && dec(proAnual.o.payload)['recurring[interval]'] === 'year', 'Pro anual = 471,90 € IVA incl., cobro anual');
const proTri = t.llamadas.find((x) => /metadata%5Bplan%5D=pro&metadata%5Bperiodo%5D=trimestral/.test(x.o.payload || ''));
check(dec(proTri.o.payload)['recurring[interval_count]'] === '3', 'trimestral = cada 3 meses');
vm.runInContext('CREAR_PRODUCTOS_STRIPE', t.ctx)();
check(t.llamadas.filter((x) => /prices/.test(x.url)).length === 12 && t.llamadas.filter((x) => /products/.test(x.url)).length === 4, 'si se ejecuta dos veces no duplica productos ni precios');

/* ---- Enlace de pago ---- */
let sesion = null;
t = montar(Object.assign({ STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_PRECIOS: JSON.stringify(precios) }, PROPS), (ruta, o) => {
  if (ruta === 'checkout/sessions') { sesion = dec(o.payload); return { body: { id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' } }; }
  return { code: 404, body: {} };
});
r = t.post({ accion: 'pedido_guardar', closer_id: 'MO001', slug: 'ankara-kebab', cliente: 'Ankara', pack: 'iman', cantidades: { display: 1, llavero: 5 }, plan: 'pro', periodo: 'mensual', email: 'no-es-un-email' });
check(r.ok && r.pago.url === 'https://checkout.stripe.com/c/pay/cs_1', 'devuelve el enlace de pago de Stripe');
check(sesion.mode === 'subscription' && sesion['line_items[0][price]'] === 'price_pro_mensual', 'la suscripción es Pro mensual');
check(sesion['line_items[1][price_data][unit_amount]'] === '25253', 'cobra hoy la apertura: 252,53 € (IVA incl.)');
check(sesion['subscription_data[trial_period_days]'] === '60', 'la cuota empieza tras los 2 meses gratis del pack');
check(sesion['subscription_data[metadata][slug]'] === 'ankara-kebab' && sesion.client_reference_id === 'ankara-kebab', 'el pago queda ligado al cliente');
check(!('customer_email' in sesion), 'un email no válido no se envía a Stripe');
r = t.post({ accion: 'pedido_guardar', closer_id: 'MO001', slug: 'ankara-kebab', pack: 'ninguno', cantidades: {}, plan: 'esencial', periodo: 'anual', email: 'bien@ejemplo.es' });
check(r.ok && sesion['line_items[0][price]'] === 'price_esencial_anual' && !sesion['line_items[1][price_data][unit_amount]'] && !sesion['subscription_data[trial_period_days]'] && sesion.customer_email === 'bien@ejemplo.es', 'solo suscripción: sin apertura ni meses gratis, con email');

/* ---- Sincronización y pausa automática ---- */
let estadoStripe = 'past_due';
t = montar(Object.assign({ STRIPE_SECRET_KEY: 'sk_test_x' }, PROPS), (ruta) => {
  if (ruta.startsWith('subscriptions')) return { body: { has_more: false, data: [
    { id: 'sub_1', status: estadoStripe, metadata: { slug: 'ankara-kebab', plan: 'pro', periodo: 'mensual' }, customer: { email: 'a@ankara.es' }, current_period_end: 1767225600 },
    { id: 'sub_0', status: 'canceled', metadata: { slug: 'ankara-kebab', plan: 'esencial', periodo: 'mensual' }, customer: { email: 'a@ankara.es' } }] } };
  return { code: 404, body: {} };
});
vm.runInContext('SINCRONIZAR_STRIPE', t.ctx)();
let fila = t.hojas.Suscripciones.filas[1];
check(fila[4] === 'impagada' && fila[5] === 'a@ankara.es' && fila[8] === 'sub_1', 'sincroniza: Pro impagada con su email (ignora la antigua cancelada)');
check(!JSON.parse(t.repo.files['c/ankara-kebab.json']).pausada, 'con un solo cobro fallido NO se pausa todavía');
estadoStripe = 'unpaid'; vm.runInContext('SINCRONIZAR_STRIPE', t.ctx)();
check(JSON.parse(t.repo.files['c/ankara-kebab.json']).pausada === true && t.hojas.Suscripciones.filas[1][9] === 'pausada por impago', 'si sigue sin pagar: landing en pausa automáticamente');
estadoStripe = 'active'; vm.runInContext('SINCRONIZAR_STRIPE', t.ctx)();
check(!JSON.parse(t.repo.files['c/ankara-kebab.json']).pausada && t.hojas.Suscripciones.filas[1][9] === 'activa', 'al pagar: se reactiva sola');

/* ---- Pausa manual desde el panel ---- */
const tk = t.post({ accion: 'panel_login', clave: 'clave-segura' }).token;
r = t.post({ accion: 'panel_pausar', token: tk, slug: 'ankara-kebab', pausar: true });
check(r.ok && JSON.parse(t.repo.files['c/ankara-kebab.json']).pausada === true && t.hojas.Suscripciones.filas[1][9] === 'pausada', 'pausar a mano desde el panel');
vm.runInContext('SINCRONIZAR_STRIPE', t.ctx)();
check(JSON.parse(t.repo.files['c/ankara-kebab.json']).pausada === true, 'una pausa manual no la deshace la sincronización');
t.post({ accion: 'panel_pausar', token: tk, slug: 'ankara-kebab', pausar: false });
check(!JSON.parse(t.repo.files['c/ankara-kebab.json']).pausada, 'reactivar a mano');

/* ---- Estadísticas ---- */
['vista', 'vista', 'vista', 'resena', 'whatsapp', 'gerencia'].forEach((tp, i) => t.post({ accion: 'ev', c: 'ankara-kebab', k: i < 2 ? 'L01' : 'mostrador', t: tp }));
check(!t.post({ accion: 'ev', c: 'ankara-kebab', t: 'hackeo' }).ok && !t.post({ accion: 'ev', c: '../x', t: 'vista' }).ok, 'rechaza tipos o clientes inventados');
check(t.hojas.Eventos.filas.length === 7 && t.hojas.Eventos.filas[1].length === 4, 'guarda solo fecha, cliente, pieza y tipo (nada personal)');
const st = vm.runInContext('estadisticas_', t.ctx)(new Date(Date.now() - 86400000), new Date(Date.now() + 86400000))['ankara-kebab'];
check(st.vista === 3 && st.resena === 1 && st.piezas.L01 === 2 && st.piezas.MOSTRADOR === 1, 'suma visitas, reseñas y toques por pieza');
t.mem['evc_ankara-kebab_20261012'] = '3000';
check(!t.post({ accion: 'ev', c: 'ankara-kebab', t: 'vista' }).ok, 'tope de 3.000 avisos por cliente y día');
r = t.post({ accion: 'panel_datos', token: tk });
check(r.ok && r.estadisticas['ankara-kebab'].vista === 3 && r.suscripciones[0].plan === 'pro' && r.stripe === true, 'el panel recibe estadísticas y suscripciones');

/* ---- Informe mensual ---- */
const hoy = new Date(), mesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15);
t.hojas.Eventos.filas.slice(1).forEach((f) => { f[0] = mesPasado; });
vm.runInContext('INFORME_MENSUAL', t.ctx)();
check(t.mails.length === 1 && t.mails[0].to === 'a@ankara.es' && /3 visitas/.test(t.mails[0].subject) && /L01/.test(t.mails[0].htmlBody), 'el día 1 envía el informe con sus números y la pieza estrella');

/* ---- Motor: pausa y contador ---- */
const motor = fs.readFileSync(path.join(__dirname, '..', 'c', 'index.html'), 'utf8');
check(/d\.pausada === true/.test(motor) && /sendBeacon/.test(motor) && !/document\.cookie/.test(motor), 'el motor muestra la pausa y cuenta sin cookies');

console.log('\n' + ok + ' comprobaciones correctas');
