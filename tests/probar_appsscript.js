#!/usr/bin/env node
/* Prueba de apps-script/Code.gs SIN Google ni GitHub: se simulan los servicios de Apps Script,
   GitHub (archivos en memoria) Claude y Google Maps (respuestas guionizadas).
   Uso: node tests/probar_appsscript.js [carpeta_salida]
   Escribe los JSON generados en <carpeta_salida>/c/ para validarlos y renderizarlos después. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const RAIZ = path.resolve(__dirname, '..');
const SALIDA = process.argv[2] ? path.resolve(process.argv[2]) : null;

const { entorno, PROPS, iaOK, iaTexto, PROPUESTA, MAPS_OK, PLACE_ID } = require('./_simulador');
const post = (ctx, d) => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(d) }, parameter: {} }).s);

const base = { closer_id: 'MO001', nombre: 'Peluquería Sol & Luna', sector: 'Belleza y Estética', whatsapp: '600 11 22 33',
  fricciones: ['Citas canceladas a última hora sin previo aviso', 'Pocas valoraciones en Google'], color: '#c026d3',
  instagram: '@peluqueria.solyluna', google: 'https://g.page/r/CaBcDeFgHiJkLmnO/review', bizum: '600112233', peticion: 'abc12345def' };

let pasados = 0;
const t = (nombre, fn) => { try { fn(); pasados++; console.log('✓', nombre); } catch (e) { console.log('✗', nombre, '\n   ', e.message); process.exitCode = 1; } };

/* ---------- utilidades puras ---------- */
{
  const { ctx } = entorno(PROPS, { files: {}, commits: [] }, iaOK(PROPUESTA));
  const f = (n, ...a) => vm.runInContext(n, ctx)(...a);
  t('slug: acentos, símbolos y longitud', () => {
    assert.strictEqual(f('slugify_', 'Peluquería Sol & Luna'), 'peluqueria-sol-luna');
    assert.strictEqual(f('slugify_', '  ¡Café   Ñandú!  '), 'cafe-nandu');
    assert.ok(f('slugify_', 'A'.repeat(80)).length <= 40);
    assert.ok(/^[a-z0-9_-]{1,40}$/.test(f('slugify_', 'Clínica Dental Ruiz Mazo — Logroño 2026')));
  });
  t('WhatsApp: formatos españoles e internacionales', () => {
    assert.strictEqual(f('normalizarWhatsApp_', '600 11 22 33'), '34600112233');
    assert.strictEqual(f('normalizarWhatsApp_', '+34 600112233'), '34600112233');
    assert.strictEqual(f('normalizarWhatsApp_', '0034600112233'), '34600112233');
    assert.strictEqual(f('normalizarWhatsApp_', 'https://wa.me/584140344533?text=hola'), '584140344533');
    assert.strictEqual(f('normalizarWhatsApp_', '+58 414 0344533'), '584140344533');
    assert.strictEqual(f('normalizarWhatsApp_', '12345'), '');
    assert.strictEqual(f('normalizarWhatsApp_', 'hola'), '');
  });
  t('Google: ficha válida, place id, portada de Maps rechazada, dominio ajeno rechazado', () => {
    assert.ok(f('normalizarGoogle_', 'https://g.page/r/abc/review').url);
    assert.strictEqual(f('normalizarGoogle_', 'ChIJ7xPNJJ6rWg0RWllatpjaQ38').url, 'https://search.google.com/local/writereview?placeid=ChIJ7xPNJJ6rWg0RWllatpjaQ38');
    assert.strictEqual(f('normalizarGoogle_', 'https://maps.google.com').url, '');
    assert.strictEqual(f('normalizarGoogle_', 'https://www.google.com/maps').url, '');
    assert.strictEqual(f('normalizarGoogle_', 'https://evil.example/writereview').url, '');
    assert.strictEqual(f('normalizarGoogle_', 'javascript:alert(1)').url, '');
    assert.strictEqual(f('normalizarGoogle_', '').url, '');
  });
  t('Redes: usuario, @usuario y URL; dominio ajeno rechazado', () => {
    assert.strictEqual(f('normalizarRed_', '@zombie_livetattoo', 'instagram.com'), 'https://www.instagram.com/zombie_livetattoo');
    assert.strictEqual(f('normalizarRed_', 'https://instagram.com/x.y', 'instagram.com'), 'https://instagram.com/x.y');
    assert.strictEqual(f('normalizarRed_', 'https://evil.com/instagram.com', 'instagram.com'), '');
    assert.strictEqual(f('normalizarRed_', 'a b c', 'instagram.com'), '');
  });
  t('Acento oscuro se aclara hasta ser legible', () => {
    const a = f('acentoLegible_', '#190610');
    assert.ok(f('luminancia_', a) >= 0.18, a);
    assert.strictEqual(f('acentoLegible_', '#ffffff'), '#ffffff');
  });
}

/* ---------- flujo completo ---------- */
function flujo(titulo, { repo, gemini, datos, props, maps, comprobar }) {
  const r = repo || { files: {}, commits: [] };
  const { ctx, log } = entorno(props || PROPS, r, gemini || iaOK(PROPUESTA), maps);
  const res = post(ctx, datos || base);
  t(titulo, () => comprobar(res, r, log, ctx));
  return { res, repo: r, log };
}
const guardarSalida = (slug, repo) => {
  if (!SALIDA || !repo.files['c/' + slug + '.json']) return;
  fs.mkdirSync(path.join(SALIDA, 'c'), { recursive: true });
  fs.writeFileSync(path.join(SALIDA, 'c', slug + '.json'), repo.files['c/' + slug + '.json']);
};

{
  const { res, repo, log } = flujo('Flujo feliz: Claude bien → JSON publicado en c/<slug>.json', {
    comprobar(res, repo, log) {
      assert.strictEqual(res.ok, true, JSON.stringify(res));
      assert.strictEqual(res.slug, 'peluqueria-sol-luna');
      assert.strictEqual(res.url, 'https://studio42.es/c/?cod=peluqueria-sol-luna');
      assert.strictEqual(res.ia, true);
      assert.strictEqual(repo.commits.length, 1);
      assert.strictEqual(repo.commits[0].rama, 'main');
      const j = JSON.parse(repo.files['c/peluqueria-sol-luna.json']);
      assert.strictEqual(j._peticion, 'abc12345def');
      assert.strictEqual(j._generado, true);
      assert.strictEqual(j.whatsapp, 'https://wa.me/34600112233');
      assert.strictEqual(j.datosPago.bizum, '600112233');
      assert.strictEqual(j.secciones[0].botones.length, 3);
      assert.strictEqual(j.secciones[0].botones[0].destacado, true);
      const op = j.secciones[3].botones[0];
      assert.ok(op.urlGoogle && op.whatsappGerencia, 'opinión con las dos vías');
      assert.ok(!JSON.stringify(j).includes('Pocas valoraciones'), 'las fricciones privadas no se publican');
      assert.ok(!/"undefined"|"null"|\bundefined\b|NaN/.test(JSON.stringify(j)), 'aparece undefined/null/NaN como texto en el JSON');
      assert.strictEqual(log.iaHeaders['x-api-key'], 'sk-ant-FAKE');
      assert.strictEqual(log.iaHeaders['anthropic-version'], '2023-06-01');
      assert.strictEqual(log.iaBody.model, 'claude-sonnet-5-5');
      assert.ok(!log.iaUrl.includes('sk-ant'), 'la clave no va en la URL');
      assert.ok(typeof log.iaBody.system === 'string' && log.iaBody.messages[0].role === 'user');
      assert.ok(log.hoja.length === 1 && log.hoja[0][5] === 'PUBLICADO');
    }
  });
  guardarSalida('peluqueria-sol-luna', repo);
}

flujo('Claude caído (500) → se publica el paquete base del sector igualmente', {
  gemini: () => ({ code: 500, body: 'boom' }),
  comprobar(res, repo) {
    assert.strictEqual(res.ok, true); assert.strictEqual(res.ia, false);
    assert.ok(res.avisos.join(' ').includes('Claude'));
    const j = JSON.parse(repo.files['c/peluqueria-sol-luna.json']);
    assert.strictEqual(j.secciones[0].botones[0].tipo, 'asistente', 'paquete base del sector (Belleza)');
    assert.ok(/Servicio/.test(JSON.stringify(j.secciones[0].botones[0].pasos)));
  }
});
flujo('Claude devuelve basura (no JSON) → paquete base', {
  gemini: () => ({ code: 200, body: { content: [{ type: 'text', text: 'Lo siento, no puedo.' }] } }),
  comprobar(res) { assert.strictEqual(res.ok, true); assert.strictEqual(res.ia, false); }
});
flujo('Claude con ```json y texto alrededor → se acepta', {
  gemini: () => iaTexto('Aquí tienes:\n```json\n' + JSON.stringify(PROPUESTA) + '\n```\nEspero que sirva.'),
  comprobar(res) { assert.strictEqual(res.ok, true); assert.strictEqual(res.ia, true); }
});

{
  const hostil = {
    subtitulo: '<img src=x onerror=alert(1)>' + 'x'.repeat(200), textoBadge: 'ok',
    botones: [
      { tipo: 'enlace', nombre: 'Phishing', url: 'https://evil.example' },
      { tipo: 'whatsapp', nombre: 'WA <b>raro</b>', icono: '../../etc/passwd', numeroWhatsapp: '34666666666', mensaje: 'Hola {negocio} {numero_falso} {__proto__} <script>x</script>' },
      { tipo: 'asistente', nombre: 'Asist', pasos: [{ titulo: 'Paso {x}', opciones: ['A', 'A', 'B', '{c}'] }, { titulo: 'Solo una', opciones: ['X'] }], resultado: { reglas: [{ si: { Inventado: ['Z'] }, titulo: 'no' }, { si: { 'Paso x': ['A'] }, titulo: 'Sí' }] }, mensaje: 'Elegí {Paso x} y {Otro}' },
      { tipo: 'calculadora', nombre: 'Calc', campo: { etiqueta: 'N' }, opciones: [{ texto: 'a', factor: -3 }, { texto: 'b', factor: 'x' }], resultado: {} },
      { tipo: 'info', nombre: 'Info', tarjetas: [{ nivel: 'peligro', texto: 'hola <script>' }], acciones: [{ texto: 'Ir', url: 'javascript:alert(1)' }, { texto: 'Mapa', maps: 'farmacia 24h' }] },
      { tipo: 'reserva_cita', nombre: 'No permitido' }, { tipo: 'opinion', nombre: 'No permitido' }
    ]
  };
  const { res, repo } = flujo('IA hostil: tipos no permitidos, URLs, HTML, llaves y placeholders inventados se filtran', {
    gemini: iaOK(hostil),
    comprobar(res, repo) {
      assert.strictEqual(res.ok, true, JSON.stringify(res));
      const j = JSON.parse(repo.files['c/peluqueria-sol-luna.json']);
      const bs = j.secciones[0].botones;
      const tipos = bs.map((b) => b.tipo);
      assert.deepStrictEqual([...tipos].sort(), ['asistente', 'info', 'whatsapp']);
      assert.ok(!tipos.includes('enlace') && !tipos.includes('reserva_cita') && !tipos.includes('opinion'));
      const texto = JSON.stringify(j);
      assert.ok(!/<script|onerror|<b>|javascript:|evil\.example|666666666|__proto__|numero_falso|passwd/i.test(texto), 'contenido peligroso: ' + texto.match(/<script|onerror|<b>|javascript:|evil\.example|666666666|__proto__|numero_falso|passwd/i));
      assert.ok(j.subtitulo.length <= 70);
      const wa = bs.find((b) => b.tipo === 'whatsapp');
      assert.strictEqual(wa.mensaje, 'Hola {negocio} x');
      assert.ok(!('icono' in wa), 'icono inválido eliminado');
      const as = bs.find((b) => b.tipo === 'asistente');
      assert.strictEqual(as.pasos.length, 1);
      assert.deepStrictEqual(as.pasos[0].opciones, ['A', 'B', 'c']);
      assert.ok(!/\{Otro\}/.test(as.mensaje), 'placeholder inventado eliminado');
      assert.strictEqual(as.resultado.reglas.length, 1);
      assert.ok(!bs.some((b) => b.tipo === 'calculadora'), 'calculadora con factores inválidos descartada');
      const inf = bs.find((b) => b.tipo === 'info');
      assert.strictEqual(inf.tarjetas[0].nivel, 'info');
      assert.deepStrictEqual(inf.acciones.map((a) => Object.keys(a).sort().join()), ['maps,texto']);
    }
  });
  guardarSalida('peluqueria-sol-luna-hostil', { files: {} });
}

flujo('No pisa a un cliente real existente (sin _generado)', {
  repo: { files: { 'c/ankara-kebab.json': '{"nombre":"ANKARA KEBAB"}' }, commits: [] },
  datos: Object.assign({}, base, { nombre: 'Ankara Kebab' }),
  comprobar(res, repo) { assert.strictEqual(res.ok, false); assert.ok(/Ya existe/.test(res.error)); assert.strictEqual(repo.commits.length, 0); }
});
flujo('Sí actualiza una demo generada antes (_generado: true) sin duplicar', {
  repo: { files: { 'c/peluqueria-sol-luna.json': '{"nombre":"x","_generado":true}' }, commits: [] },
  comprobar(res, repo) { assert.strictEqual(res.ok, true); assert.strictEqual(repo.commits.length, 1); assert.strictEqual(JSON.parse(repo.files['c/peluqueria-sol-luna.json'])._peticion, 'abc12345def'); }
});
flujo('Closer no autorizado', { datos: Object.assign({}, base, { closer_id: 'HACKER' }), comprobar(res, repo) { assert.strictEqual(res.ok, false); assert.ok(/no autorizado/.test(res.error)); assert.strictEqual(repo.commits.length, 0); } });
flujo('WhatsApp inválido → mensaje claro y nada publicado', { datos: Object.assign({}, base, { whatsapp: '123' }), comprobar(res, repo) { assert.strictEqual(res.ok, false); assert.ok(/WhatsApp/.test(res.error)); assert.strictEqual(repo.commits.length, 0); } });
flujo('Nombre reservado (index) rechazado', { datos: Object.assign({}, base, { nombre: 'Index' }), comprobar(res) { assert.strictEqual(res.ok, false); } });
flujo('Token de GitHub sin permiso → error comprensible', { repo: { files: {}, commits: [], __token_malo: true }, comprobar(res) { assert.strictEqual(res.ok, false); assert.ok(/token/.test(res.error)); } });
flujo('Sin claves configuradas → error claro', { props: {}, comprobar(res) { assert.strictEqual(res.ok, false); assert.ok(/GITHUB_TOKEN/.test(res.error)); } });
flujo('Formulario antiguo (nombre_sector, urlencoded) sigue funcionando', {
  datos: { closer_id: 'MO001', nombre_sector: 'Bar Pepe / Hostelería y Restauración', whatsapp: '655443322', fricciones: 'Carta QR no carga | Faltan reseñas', branding: '#0070F3 // Neón', logo_extra: 'https://drive.google.com/file/d/xyz' },
  comprobar(res, repo) {
    assert.strictEqual(res.ok, true, JSON.stringify(res));
    assert.strictEqual(res.slug, 'bar-pepe');
    const j = JSON.parse(repo.files['c/bar-pepe.json']);
    assert.ok(!j.logo, 'logo de Drive descartado');
    assert.ok(res.avisos.some((a) => /Drive/.test(a)));
    assert.strictEqual(j.colorAcento, '#0070f3');
  }
});
flujo('Sin enlace de Google: solo queda la vía privada y se avisa', {
  datos: Object.assign({}, base, { google: 'https://maps.google.com' }),
  comprobar(res, repo) {
    assert.strictEqual(res.ok, true);
    const op = JSON.parse(repo.files['c/peluqueria-sol-luna.json']).secciones[3].botones[0];
    assert.ok(!op.urlGoogle && op.whatsappGerencia);
    assert.ok(res.avisos.some((a) => /portada de Maps/.test(a)));
  }
});

/* ---------- Google Maps: buscador, Place ID y reseña directa ---------- */
const PM = Object.assign({}, PROPS, { GOOGLE_MAPS_API_KEY: 'AIza_FAKE_MAPS' });
const WR = 'https://search.google.com/local/writereview?placeid=' + PLACE_ID;

{
  const { ctx, log } = entorno(PM, { files: {}, commits: [] }, iaOK(PROPUESTA), MAPS_OK);
  const r = post(ctx, { accion: 'buscar', closer_id: 'MO001', consulta: 'sol y luna alcobendas' });
  t('Buscador: devuelve candidatos limpios (descarta ids inválidos) y no filtra la clave', () => {
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    assert.strictEqual(r.resultados.length, 1);
    const x = r.resultados[0];
    assert.strictEqual(x.id, PLACE_ID); assert.strictEqual(x.sector, 'Belleza y Estética');
    assert.strictEqual(x.whatsapp, '34600112233'); assert.strictEqual(x.web, 'https://solyluna.example');
    assert.strictEqual(log.mapsHeaders['X-Goog-Api-Key'], 'AIza_FAKE_MAPS');
    assert.ok(!JSON.stringify(r).includes('AIza'), 'la clave de Maps nunca viaja al navegador');
    assert.ok(log.mapsUrl.startsWith('https://places.googleapis.com/') && !log.mapsUrl.includes('AIza'));
  });
  t('Buscador: closer no autorizado, consulta corta y sin clave de Maps', () => {
    assert.strictEqual(post(ctx, { accion: 'buscar', closer_id: 'HACKER', consulta: 'abc def' }).ok, false);
    assert.strictEqual(post(ctx, { accion: 'buscar', closer_id: 'MO001', consulta: 'a' }).ok, false);
    const { ctx: c2 } = entorno(PROPS, { files: {}, commits: [] }, iaOK(PROPUESTA), MAPS_OK);
    const r2 = post(c2, { accion: 'buscar', closer_id: 'MO001', consulta: 'peluquería' });
    assert.strictEqual(r2.ok, false); assert.strictEqual(r2.codigo, 'sin_maps');
  });
  t('Buscador: error de Google → mensaje claro (no revienta)', () => {
    const { ctx: c3 } = entorno(PM, { files: {}, commits: [] }, iaOK(PROPUESTA), { buscar: () => ({ code: 403, body: 'denied' }), detalle: () => ({ code: 500, body: '' }) });
    const r3 = post(c3, { accion: 'buscar', closer_id: 'MO001', consulta: 'peluquería sol' });
    assert.strictEqual(r3.ok, false); assert.ok(/Google Maps/.test(r3.error));
  });
  t('Buscador: tope de búsquedas por hora', () => {
    const { ctx: c4 } = entorno(Object.assign({ MAX_BUSQUEDAS_HORA: '2' }, PM), { files: {}, commits: [] }, iaOK(PROPUESTA), MAPS_OK);
    const q = () => post(c4, { accion: 'buscar', closer_id: 'MO001', consulta: 'peluquería sol' }).ok;
    assert.deepStrictEqual([q(), q(), q()], [true, true, false]);
  });
}

flujo('Maps: Place ID → reseña directa (writereview), horario, llamar y cómo llegar con datos reales', {
  props: PM, maps: MAPS_OK,
  datos: Object.assign({}, base, { place_id: PLACE_ID, google: '', web: '', whatsapp: '600112233' }),
  comprobar(res, repo, log) {
    assert.strictEqual(res.ok, true, JSON.stringify(res));
    assert.strictEqual(res['reseña_directa'], true);
    const j = JSON.parse(repo.files['c/peluqueria-sol-luna.json']);
    const op = j.secciones[3].botones[0];
    assert.strictEqual(op.urlGoogle, WR, 'abre directo la ventana de reseña');
    assert.ok(op.whatsappGerencia, 'siempre hay vía privada igual de visible');
    assert.ok(!/estrella|rating|puntuaci/i.test(JSON.stringify(op)), 'sin filtrado por estrellas');
    const contacto = j.secciones[1].botones;
    const por = (n) => contacto.find((b) => b.nombre === n);
    assert.strictEqual(por('Llamar ahora').url, 'tel:+34916112233');
    assert.strictEqual(por('Cómo llegar').url, 'https://maps.google.com/?cid=123456789');
    assert.strictEqual(por('Nuestra web').url, 'https://solyluna.example', 'web tomada de Maps');
    const h = por('Horario');
    assert.strictEqual(h.tarjetas[0].items.length, 3); assert.strictEqual(h.tarjetas[0].items[0].etiqueta, 'lunes');
    assert.ok(!JSON.stringify(j).includes('AIza'), 'la clave de Maps no se publica');
    assert.ok(/Ficha de Google Maps → tipos: hair_care/.test(log.iaBody.messages[0].content), 'Claude recibe el contexto del negocio');
  }
});
flujo('Maps: el Place ID manda sobre un enlace pegado a mano (y se avisa)', {
  props: PM, maps: MAPS_OK,
  datos: Object.assign({}, base, { place_id: PLACE_ID }),
  comprobar(res, repo) {
    assert.strictEqual(JSON.parse(repo.files['c/peluqueria-sol-luna.json']).secciones[3].botones[0].urlGoogle, WR);
    assert.ok(res.avisos.some((a) => /se ignoró/.test(a)));
  }
});
flujo('Maps: sin WhatsApp en el formulario se usa el móvil de Maps solo si es móvil (y se avisa)', {
  props: PM,
  maps: Object.assign({}, MAPS_OK, { detalle: (id) => { const r = MAPS_OK.detalle(id); r.body.internationalPhoneNumber = '+34 611 22 33 44'; return r; } }),
  datos: Object.assign({}, base, { place_id: PLACE_ID, whatsapp: '' }),
  comprobar(res, repo) {
    assert.strictEqual(res.ok, true, JSON.stringify(res));
    assert.strictEqual(JSON.parse(repo.files['c/peluqueria-sol-luna.json']).whatsapp, 'https://wa.me/34611223344');
    assert.ok(res.avisos.some((a) => /tomó del teléfono móvil/.test(a)));
  }
});
flujo('Maps: con teléfono fijo y sin WhatsApp → error (un fijo no es WhatsApp)', {
  props: PM, maps: MAPS_OK, datos: Object.assign({}, base, { place_id: PLACE_ID, whatsapp: '' }),
  comprobar(res, repo) { assert.strictEqual(res.ok, false); assert.ok(/WhatsApp/.test(res.error)); assert.strictEqual(repo.commits.length, 0); }
});
flujo('Maps: Place ID inexistente → sin botón de Google, aviso claro, se publica igual', {
  props: PM, maps: MAPS_OK, datos: Object.assign({}, base, { place_id: 'ChIJ_no_existe_000000000000', google: '' }),
  comprobar(res, repo) {
    assert.strictEqual(res.ok, true);
    const op = JSON.parse(repo.files['c/peluqueria-sol-luna.json']).secciones[3].botones[0];
    assert.ok(!op.urlGoogle && op.whatsappGerencia);
    assert.ok(res.avisos.some((a) => /No se encontró ese negocio/.test(a)));
  }
});
flujo('Maps caído (500) → se usa el Place ID igualmente y se avisa', {
  props: PM, maps: { buscar: () => ({ code: 500, body: '' }), detalle: () => ({ code: 500, body: '' }) },
  datos: Object.assign({}, base, { place_id: PLACE_ID, google: '' }),
  comprobar(res, repo) {
    assert.strictEqual(res.ok, true);
    assert.strictEqual(JSON.parse(repo.files['c/peluqueria-sol-luna.json']).secciones[3].botones[0].urlGoogle, WR);
    assert.ok(res.avisos.some((a) => /Google Maps/.test(a)));
  }
});
flujo('Place ID con formato raro (inyección) se ignora', {
  props: PM, maps: MAPS_OK, datos: Object.assign({}, base, { place_id: 'x"><script>alert(1)</script>', google: '' }),
  comprobar(res, repo) {
    assert.strictEqual(res.ok, true);
    assert.ok(!/script|writereview/.test(repo.files['c/peluqueria-sol-luna.json']));
  }
});
flujo('Maps: Claude puede proponer botones pero no inventar horarios ni enlaces de reseña', {
  props: PM, maps: MAPS_OK, gemini: iaOK({ subtitulo: 'x', botones: [
    { tipo: 'enlace', nombre: 'Reseña falsa', url: 'https://search.google.com/local/writereview?placeid=FALSO' },
    { tipo: 'whatsapp', nombre: 'Hola', mensaje: 'Hola {negocio}' }] }),
  datos: Object.assign({}, base, { place_id: PLACE_ID, google: '' }),
  comprobar(res, repo) {
    const txt = repo.files['c/peluqueria-sol-luna.json'];
    assert.ok(!txt.includes('FALSO'));
    assert.strictEqual((txt.match(/writereview/g) || []).length, 1);
  }
});

/* ---------- Sectores ---------- */
{
  const { ctx } = entorno(PROPS, { files: {}, commits: [] }, iaOK(PROPUESTA));
  const f = (n, ...a) => vm.runInContext(n, ctx)(...a);
  const sectores = vm.runInContext('Object.keys(SECTORES)', ctx);
  t('Sectores: 17 disponibles y cada paquete base pasa el filtro y el validador', () => {
    assert.strictEqual(sectores.length, 17);
    sectores.forEach((sec) => {
      const bs = f('botonesBaseSector_', sec);
      assert.strictEqual(bs[0].tipo, 'asistente', sec);
      assert.ok(bs[0].pasos[0].opciones.length >= 2, sec);
      const msg = bs[0].mensaje; assert.ok(!/\{\}/.test(msg) && msg.includes('{' + bs[0].pasos[0].titulo + '}'), sec + ': ' + msg);
    });
    assert.strictEqual(f('botonesBaseSector_', 'Otros (Escuela de buceo)')[0].nombre, 'Pedir información o cita');
  });
  t('Sectores: tipos de Google → sector del formulario', () => {
    const c = (...tipos) => f('sectorDesdeTipos_', tipos);
    assert.strictEqual(c('restaurant', 'food'), 'Hostelería y Restauración');
    assert.strictEqual(c('dentist', 'health'), 'Dental y Odontología');
    assert.strictEqual(c('veterinary_care'), 'Veterinaria y Mascotas');
    assert.strictEqual(c('car_repair'), 'Automoción y Talleres');
    assert.strictEqual(c('lodging'), 'Hoteles y Alojamiento');
    assert.strictEqual(c('gym'), 'Fitness y Deporte');
    assert.strictEqual(c('locksmith'), 'Hogar y Reformas');
    assert.strictEqual(c('clothing_store', 'store'), 'Comercio y Retail');
    assert.strictEqual(c('establishment'), '');
  });
}

console.log('\n' + pasados + ' comprobaciones correctas' + (process.exitCode ? ' · CON FALLOS' : ''));
