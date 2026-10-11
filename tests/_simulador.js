/* Simulador compartido: servicios de Apps Script + GitHub en memoria + Gemini guionizado. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.resolve(__dirname, '..');

function entorno(props, repo, gemini) {
  const log = { fetch: [], hoja: [] };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => { const m = {}; return { get: (k) => m[k] || null, put: (k, v) => { m[k] = v; } }; } },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ s, setMimeType() { return this; } }) },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: () => ({ getLastRow: () => 1, appendRow: (f) => log.hoja.push(f), setFrozenRows() {} }), insertSheet: () => null }) },
    Utilities: {
      formatDate: () => '2026101200', getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      base64Encode: (b) => Buffer.from(b).toString('base64'), base64Decode: (s) => [...Buffer.from(s, 'base64')],
      newBlob: (x) => ({ getBytes: () => [...Buffer.from(x, 'utf8')], getDataAsString: () => Buffer.from(x).toString('utf8') })
    },
    UrlFetchApp: {
      fetch(url, o) {
        o = o || {}; log.fetch.push({ url, method: o.method || 'get' });
        const resp = (code, body) => ({ getResponseCode: () => code, getContentText: () => (typeof body === 'string' ? body : JSON.stringify(body)) });
        if (url.startsWith('https://api.github.com/repos/') && url.includes('/contents/')) {
          const ruta = decodeURIComponent(url.split('/contents/')[1].split('?')[0]);
          if (repo.__token_malo) return resp(403, { message: 'Resource not accessible' });
          if ((o.method || 'get') === 'get') {
            if (!(ruta in repo.files)) return resp(404, { message: 'Not Found' });
            return resp(200, { sha: 'sha-' + repo.files[ruta].length, content: Buffer.from(repo.files[ruta]).toString('base64') });
          }
          const b = JSON.parse(o.payload);
          repo.files[ruta] = Buffer.from(b.content, 'base64').toString('utf8');
          repo.commits.push({ ruta, mensaje: b.message, rama: b.branch });
          return resp(201, { ok: true });
        }
        if (url.startsWith('https://generativelanguage.googleapis.com/')) {
          log.geminiHeaders = o.headers; log.geminiBody = JSON.parse(o.payload); log.geminiUrl = url;
          const r = gemini(log.geminiBody);
          return resp(r.code, r.body);
        }
        throw new Error('URL inesperada: ' + url);
      }
    }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
  return { ctx, log };
}

const PROPS = { GITHUB_TOKEN: 'ghp_FAKE', GEMINI_API_KEY: 'AIza_FAKE', CLOSERS: 'MO001,MEL001' };
const iaOK = (obj) => () => ({ code: 200, body: { candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] } });
const post = (ctx, d) => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(d) }, parameter: {} }).s);
const PROPUESTA = {
  subtitulo: 'Tu pelo, tu cita, sin esperas', textoBadge: 'agenda activa', tituloSeccion: 'Reserva y ahorra tiempo',
  botones: [
    { tipo: 'asistente', nombre: 'Reservar mi cita en 3 toques', descripcion: 'Elige servicio, día y franja', icono: 'calendar',
      titulo: 'Reserva de cita', intro: 'Elige y te confirmamos por WhatsApp.',
      pasos: [{ titulo: 'Servicio', opciones: ['Corte', 'Color', 'Peinado'] }, { titulo: 'Día', opciones: ['Hoy', 'Mañana', 'Esta semana'] }, { titulo: 'Franja', opciones: ['Mañana', 'Tarde'], defecto: 'Tarde' }],
      resultado: { etiqueta: 'Duración orientativa', reglas: [{ si: { Servicio: ['Color'] }, titulo: 'Reserva 2 horas', texto: 'El color necesita más tiempo.' }], porDefecto: { titulo: 'Reserva 1 hora' } },
      botonTexto: 'Pedir cita por WhatsApp', mensaje: 'Hola {negocio}, quiero cita:\n- {Servicio}\n- {Día}\n- {Franja}\n{resultado}' },
    { tipo: 'info', nombre: 'Política de cancelación', icono: 'clock', titulo: 'Cancelar o mover', tarjetas: [{ nivel: 'aviso', titulo: 'Avísanos con tiempo', texto: 'Si no puedes venir, escríbenos para liberar tu hueco.' }],
      acciones: [{ texto: 'Mover mi cita', whatsapp: true, mensaje: 'Hola {negocio}, necesito mover mi cita.' }] },
    { tipo: 'calculadora', nombre: 'Calculadora de tiempo', icono: 'calculator', campo: { etiqueta: 'Nº de servicios', unidad: 'servicios', min: 1, max: 10 }, opciones: [{ texto: 'Estándar', factor: 45 }], resultado: { texto: 'Tiempo', unidad: 'min', decimales: 0 } }
  ]
};


module.exports = { entorno, PROPS, iaOK, PROPUESTA, RAIZ };
