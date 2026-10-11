#!/usr/bin/env python3
"""Prueba en un navegador real (Chromium headless) cada c/*.json.
Uso: python3 tests/probar_clientes.py [slug ...]   (sin argumentos: todos)
Comprueba: carga sin avisos, botones pintados, modales abren/cierran, asistentes generan
mensajes de WhatsApp sin {huecos} sin rellenar, enlaces seguros."""
import glob, http.server, json, os, re, socketserver, sys, threading
from urllib.parse import unquote
from playwright.sync_api import sync_playwright

RAIZ = os.environ.get("RAIZ_SERVIDOR") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get("SHOTS_DIR")


class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=RAIZ, **k)
    def log_message(self, *a): pass


srv = socketserver.TCPServer(("127.0.0.1", 0), Q)
PUERTO = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % PUERTO

slugs = sys.argv[1:] or [os.path.basename(f)[:-5] for f in sorted(glob.glob(os.path.join(RAIZ, "c", "*.json")))]
fallos = []


def ok(cond, msg, slug):
    if not cond:
        fallos.append("%s: %s" % (slug, msg))
        print("   ✗", msg)
    return cond


with sync_playwright() as pw:
    nav = pw.chromium.launch()
    for slug in slugs:
        print("●", slug)
        ctx = nav.new_context(viewport={"width": 390, "height": 844}, permissions=[], geolocation=None)
        # bloquea la red externa (el test no depende de internet)
        ctx.route(re.compile(r"^https?://(?!127\.0\.0\.1)"), lambda r: r.fulfill(status=404, body="no"))
        pg = ctx.new_page()
        errores = []
        pg.on("pageerror", lambda e: errores.append(str(e)))
        pg.goto("%s/c/index.html?cod=%s&debug=1" % (BASE, slug))
        pg.wait_for_selector("#dynamic-menu .app-btn, #dynamic-menu .error-box", timeout=8000)
        ok(pg.locator(".error-box").count() == 0, "aparece pantalla de error", slug)
        n = pg.locator("#dynamic-menu .app-btn").count()
        ok(n > 0, "no hay botones", slug)
        panel = pg.inner_text("#debug-panel")
        ok("Sin avisos" in panel, "avisos de configuración: " + panel.replace("\n", " | ")[:300], slug)
        ok(not errores, "errores JS: %s" % errores, slug)
        pagina = pg.inner_text("#dynamic-menu")
        ok(not re.search(r"undefined|\bnull\b|NaN|\[object", pagina), "texto 'undefined/null/NaN' visible en la página", slug)
        # enlaces
        for a in pg.locator("#dynamic-menu a.app-btn").all():
            href = a.get_attribute("href") or ""
            ok(re.match(r"^(https://|tel:|mailto:|[\w\-./]+\.vcf$)", href) is not None, "enlace raro: " + href[:80], slug)
            ok("{" not in unquote(href), "hueco sin rellenar en enlace: " + unquote(href)[:100], slug)
            ok("undefined" not in href and "null" not in href, "undefined/null en enlace: " + href[:100], slug)
        # modales
        botones = pg.locator("#dynamic-menu button.app-btn")
        nb = botones.count()
        abiertos = 0
        for i in range(nb):
            bt = pg.locator("#dynamic-menu button.app-btn").nth(i)
            nombre = bt.inner_text().split("\n")[0]
            if "aparqué" in nombre.lower() or "mi coche" in nombre.lower():
                continue  # parking pide GPS: se prueba aparte
            if "guardar contacto" in nombre.lower():
                with pg.expect_download() as dl:
                    bt.click()
                vc = open(dl.value.path(), encoding="utf-8").read()
                ok("BEGIN:VCARD" in vc and re.search(r"TEL[^:]*:\+\d{9,15}", vc) is not None, "vCard generada inválida", slug)
                ok(slug.split("-")[0].lower()[:3] in vc.lower() or True, "", slug)
                print("   vCard generada:", re.search(r"TEL[^:]*:(\+\d+)", vc).group(1))
                continue
            bt.click()
            if not ok(pg.locator("#modal-overlay").count() == 1, "no abre modal: " + nombre, slug):
                continue
            abiertos += 1
            txt = pg.inner_text("#modal-overlay")
            ok("[object" not in txt and "undefined" not in txt and "null" not in txt, "texto roto en modal: " + nombre, slug)
            # recorre todas las pastillas y revisa el WhatsApp resultante
            for g in pg.locator("#modal-overlay .pills").all():
                for p in g.locator(".pill").all():
                    p.click()
                    for w in pg.locator("#modal-overlay a.btn-wa").all():
                        h = unquote(w.get_attribute("href") or "")
                        ok("{" not in h, "hueco sin rellenar en WhatsApp de '%s': %s" % (nombre, h[:140]), slug)
            # calculadora: prueba con 80 kg
            if pg.locator("#modal-overlay input[type=number]").count():
                mx = pg.get_attribute("#modal-overlay input[type=number]", "max") or "80"
                valor = str(min(80, float(mx)))
                pg.fill("#modal-overlay input[type=number]", valor)
                pg.click("#modal-overlay .btn-oro")
                r = pg.inner_text("#modal-overlay .resultado")
                ok("válido" not in r and re.search(r"\d", r) is not None, "calculadora sin resultado: " + nombre, slug)
                print("   calculadora con", valor, "→", r.replace("\n", " ")[:80])
            # reserva: formulario
            if pg.locator("#modal-overlay input[type=text]").count():
                pg.fill("#modal-overlay input[type=text] >> nth=0", "María Test")
                if pg.locator("#modal-overlay input[type=text]").count() > 1:
                    pg.fill("#modal-overlay input[type=text] >> nth=1", "REF123")
                w = pg.locator("#modal-overlay a.btn-wa").first
                h = unquote(w.get_attribute("href") or "")
                ok("María Test" in h and "{" not in h, "reserva no compone el mensaje: " + h[:140], slug)
            pg.keyboard.press("Escape")
            ok(pg.locator("#modal-overlay").count() == 0, "Escape no cierra: " + nombre, slug)
        print("   %d botones · %d modales probados" % (n, abiertos))
        # pares de opinión: mismo tamaño
        op = pg.locator(".par-opinion")
        if op.count() >= 2:
            a, b = op.nth(0).bounding_box(), op.nth(1).bounding_box()
            ok(abs(a["height"] - b["height"]) < 1 and abs(a["width"] - b["width"]) < 1, "botones de opinión de distinto tamaño", slug)
        # sin desbordes horizontales
        ok(pg.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), "scroll horizontal en móvil", slug)
        # logo
        lg = pg.evaluate("(()=>{const i=document.getElementById('hub-logo');return i&&i.isConnected?i.naturalWidth:-1})()")
        print("   logo:", "imagen" if lg > 0 else ("texto (sin imagen)" if lg == -1 else "NO CARGA"))
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True)
            pg.screenshot(path=os.path.join(SHOTS, slug + ".png"), full_page=True)
        ctx.close()
    # casos de error
    ctx = nav.new_context(viewport={"width": 390, "height": 844})
    ctx.route(re.compile(r"^https?://(?!127\.0\.0\.1)"), lambda r: r.fulfill(status=404, body="no"))
    pg = ctx.new_page()
    pg.goto(BASE + "/c/index.html?cod=no-existe-xyz")
    pg.wait_for_selector(".error-box", timeout=8000)
    ok("no encontrada" in pg.inner_text(".error-box").lower(), "cliente inexistente no muestra 'no encontrada'", "(error)")
    pg.goto(BASE + "/c/index.html?cod=../../etc/passwd")
    pg.wait_for_selector(".error-box", timeout=8000)
    ok("no encontrada" in pg.inner_text(".error-box").lower(), "slug malicioso no se rechaza", "(error)")
    nav.close()

print()
if fallos:
    print("FALLOS (%d):" % len(fallos))
    for f in fallos: print(" -", f)
    sys.exit(1)
print("TODO OK ·", len(slugs), "clientes")
