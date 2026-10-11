#!/usr/bin/env node
/* Prueba de apps-script/Code.gs SIN Google ni GitHub: se simulan los servicios de Apps Script,
   GitHub (archivos en memoria) y Gemini (respuestas guionizadas).
   Uso: node tests/probar_appsscript.js [carpeta_salida]
   Escribe los JSON generados en <carpeta_salida>/c/ para validarlos y renderizarlos después. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const RAIZ = path.resolve(__dirname, '..');
const SALIDA = process.argv[2] ? path.resolve(process.argv[2]) : null;

const { entorno, PROPS, iaOK, PROPUESTA } = require('./_simulador');
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
function flujo(titulo, { repo, gemini, datos, props, comprobar }) {
  const r = repo || { files: {}, commits: [] };
  const { ctx, log } = entorno(props || PROPS, r, gemini || iaOK(PROPUESTA));
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
  const { res, repo, log } = flujo('Flujo feliz: Gemini bien → JSON publicado en c/<slug>.json', {
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
      assert.strictEqual(log.geminiHeaders['x-goog-api-key'], 'AIza_FAKE');
      assert.ok(!log.geminiUrl.includes('AIza'), 'la clave no va en la URL');
      assert.ok(log.hoja.length === 1 && log.hoja[0][5] === 'PUBLICADO');
    }
  });
  guardarSalida('peluqueria-sol-luna', repo);
}

flujo('Gemini caído (500) → se publica la interfaz básica igualmente', {
  gemini: () => ({ code: 500, body: 'boom' }),
  comprobar(res, repo) {
    assert.strictEqual(res.ok, true); assert.strictEqual(res.ia, false);
    assert.ok(res.avisos.join(' ').includes('Gemini'));
    const j = JSON.parse(repo.files['c/peluqueria-sol-luna.json']);
    assert.strictEqual(j.secciones[0].botones[0].tipo, 'whatsapp');
  }
});
flujo('Gemini devuelve basura (no JSON) → interfaz básica', {
  gemini: () => ({ code: 200, body: { candidates: [{ content: { parts: [{ text: 'Lo siento, no puedo.' }] } }] } }),
  comprobar(res) { assert.strictEqual(res.ok, true); assert.strictEqual(res.ia, false); }
});
flujo('Gemini con ```json y texto extra de cercas → se acepta', {
  gemini: () => ({ code: 200, body: { candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(PROPUESTA) + '\n```' }] } }] } }),
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

console.log('\n' + pasados + ' comprobaciones correctas' + (process.exitCode ? ' · CON FALLOS' : ''));
