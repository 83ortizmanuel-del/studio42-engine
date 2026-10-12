/* Studio 42 · para las landings hechas a medida (fuera del motor c/).
   1) Pausa: si estado/<slug>.json dice {"pausada": true}, tapa la página con un aviso.
   2) Contador anónimo (opcional, data-contar="1"): visita y tipo de botón. Sin cookies ni datos personales.
   Uso:  <script src="/js/s42-medida.js" data-slug="la-sucursal" data-nombre="La Sucursal" data-contar="1" defer></script> */
(function () {
  var s = document.currentScript; if (!s) return;
  var slug = (s.getAttribute('data-slug') || '').toLowerCase();
  var nombre = s.getAttribute('data-nombre') || '';
  var contar = s.getAttribute('data-contar') === '1';
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyBX3u7pctH4FdbpHzyH11eXv0sbzMm1Xs6-aO9vMVE-QeCnz1CkuPFHBN7RobM9NPw/exec';
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) return;
  var q = new URLSearchParams(location.search);
  var prueba = q.get('preview') || q.get('debug') || /^(localhost|127\.)/.test(location.hostname);
  var pieza = (q.get('k') || q.get('sede') || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 20);

  function ev(tipo) {
    if (!contar || prueba) return;
    try {
      var cuerpo = JSON.stringify({ accion: 'ev', c: slug, k: pieza, t: tipo });
      if (!(navigator.sendBeacon && navigator.sendBeacon(SCRIPT_URL, new Blob([cuerpo], { type: 'text/plain' }))))
        fetch(SCRIPT_URL, { method: 'POST', body: cuerpo, mode: 'no-cors', keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  function tipoDe(u, el) {
    u = String(u || '');
    if (/writereview|g\.page\/r|search\.google\.com\/local/.test(u)) return 'resena';
    if (/wa\.me|whatsapp/.test(u)) return el && /gerencia|responsable|incidencia/i.test(el.textContent || '') ? 'gerencia' : 'whatsapp';
    if (/^tel:/.test(u)) return 'llamada';
    if (/google\.[a-z.]+\/maps|maps\.app|maps\.google/.test(u)) return 'ruta';
    if (/^https?:/.test(u)) return 'enlace';
    return '';
  }
  window.S42 = { contar: ev, tipoDe: tipoDe };
  if (contar) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      var t = tipoDe(a.getAttribute('href'), a); if (t) ev(t);
    }, true);
    ev('vista');
  }

  function pausar() {
    var d = document.createElement('div');
    d.setAttribute('role', 'alert');
    d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:#09080a;color:#f5f1e8;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center';
    var t = document.createElement('div'); t.style.maxWidth = '340px';
    var h = document.createElement('p'); h.style.cssText = 'font-size:20px;font-weight:700;margin:0 0 10px';
    h.textContent = (nombre ? 'El espacio digital de ' + nombre : 'Este espacio digital') + ' está en pausa temporalmente.';
    var p = document.createElement('p'); p.style.cssText = 'margin:0;color:#a39d93'; p.textContent = 'Disculpa las molestias. Vuelve a intentarlo más tarde.';
    t.append(h, p); d.append(t); document.body.appendChild(d);
    document.documentElement.style.overflow = 'hidden';
  }
  var base = new URL('../', s.src);
  fetch(new URL('estado/' + slug + '.json', base).href + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j && j.pausada === true && !prueba) { if (document.body) pausar(); else document.addEventListener('DOMContentLoaded', pausar); } })
    .catch(function () {});
})();
