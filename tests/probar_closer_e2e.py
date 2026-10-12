#!/usr/bin/env python3
"""Recorrido completo SIN internet: formulario del Closer → doPost real de Code.gs (simulado Google/GitHub/Claude)
→ archivo c/<slug>.json → interfaz renderizada por el motor. Uso: python3 tests/probar_closer_e2e.py"""
import http.server, json, os, re, shutil, socketserver, subprocess, sys, tempfile, threading
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITIO = tempfile.mkdtemp(prefix="s42site_")
os.makedirs(SITIO + "/v/closer"); os.makedirs(SITIO + "/c")
shutil.copy(RAIZ + "/v/closer/index.html", SITIO + "/v/closer/index.html")
shutil.copy(RAIZ + "/studio42-logo.png", SITIO + "/studio42-logo.png")
shutil.copy(RAIZ + "/c/index.html", SITIO + "/c/index.html")
shutil.copy(RAIZ + "/c/ankara-kebab.json", SITIO + "/c/ankara-kebab.json")  # cliente real que NO se debe pisar

class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=SITIO, **k)
    def log_message(s, *a): pass
    def end_headers(s): s.send_header("Cache-Control", "no-store"); super().end_headers()
srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Q); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % srv.server_address[1]

fallos = []
def ok(c, m):
    print("   " + ("✓" if c else "✗"), m)
    if not c: fallos.append(m)

def ejecutar(datos, ia="ok"):
    p = subprocess.run(["node", RAIZ + "/tests/_ejecutar_codegs.js"], input=json.dumps({"datos": datos, "repoDir": SITIO, "ia": ia}),
                       capture_output=True, text=True, timeout=30)
    if p.returncode: raise RuntimeError(p.stderr)
    return p.stdout

def preparar(ctx, modo="normal", ia="ok"):
    def handler(route):
        datos = json.loads(route.request.post_data)
        salida = ejecutar(datos, ia)
        if modo == "respuesta_ilegible":
            route.abort("failed")   # el servidor lo procesó, pero el navegador no puede leer la respuesta
        else:
            route.fulfill(status=200, content_type="application/json", body=salida, headers={"access-control-allow-origin": "*"})
    ctx.route(re.compile(r"^https://script\.google\.com/"), handler)

def rellenar(pg, nombre, **k):
    pg.fill("#nombre_comercio", nombre)
    pg.select_option("#sector_select", k.get("sector", "Belleza y Estética"))
    pg.wait_for_selector(".chip-friccion")
    pg.locator(".chip-friccion").nth(0).click(); pg.locator(".chip-friccion").nth(2).click()
    pg.fill("#fricciones_extra", "Me preguntan precios por privado y no reservan")
    pg.fill("#whatsapp", k.get("wa", "600 11 22 33"))
    pg.fill("#google", k.get("google", "https://g.page/r/CaBcDeFgHiJk/review"))
    pg.locator("details.mas summary").click()
    pg.fill("#instagram", "@peluqueria.solyluna"); pg.fill("#bizum", "600112233")
    pg.fill("#color-picker", "#c026d3")

with sync_playwright() as pw:
    nav = pw.chromium.launch()
    def nuevo(modo="normal", ia="ok"):
        ctx = nav.new_context(viewport={"width": 390, "height": 844}); preparar(ctx, modo, ia)
        pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        return ctx, pg, errs

    print("● 1) Camino feliz")
    ctx, pg, errs = nuevo()
    pg.goto(BASE + "/v/closer/?cod=MEL001")
    ok("theme-melina" in pg.get_attribute("body", "class"), "tema rosa para MEL001")
    ok("melina" in pg.inner_text("#badge-closer-text").lower(), "badge de Melina")
    rellenar(pg, "Peluquería Sol & Luna")
    pg.click("#btn-enviar")
    pg.wait_for_selector("a.btn-fin.principal", timeout=20000)
    href = pg.get_attribute("a.btn-fin.principal", "href")
    ok(href.endswith("/c/?cod=peluqueria-sol-luna"), "enlace final correcto: " + href)
    ok(os.path.exists(SITIO + "/c/peluqueria-sol-luna.json"), "JSON creado en c/")
    ok(not errs, "sin errores JS en el formulario %s" % errs)
    pg2 = ctx.new_page(); errs2 = []; pg2.on("pageerror", lambda e: errs2.append(str(e)))
    pg2.goto(href + "&debug=1"); pg2.wait_for_selector("#dynamic-menu .app-btn")
    ok("Sin avisos" in pg2.inner_text("#debug-panel"), "la interfaz generada no tiene avisos de configuración")
    ok(pg2.locator("#client-name").inner_text() == "PELUQUERÍA SOL & LUNA", "nombre en cabecera")
    pg2.locator("#dynamic-menu button.app-btn", has_text="Reservar mi cita").click()
    ok(pg2.locator("#modal-overlay").count() == 1, "el botón a medida abre su ventana")
    w = pg2.locator("#modal-overlay a.btn-wa").first.get_attribute("href")
    ok(w.startswith("https://wa.me/34600112233?text=") and "%7B" not in w, "mensaje de WhatsApp compuesto con el número del formulario")
    ok(pg2.locator(".par-opinion").count() == 2, "bloque de opinión con las dos vías")
    ok(not errs2, "sin errores JS en la interfaz")
    pg2.screenshot(path=os.environ.get("SHOT", tempfile.gettempdir() + "/e2e_modal.png"))
    ctx.close()

    print("● 2) Nombre de un cliente real → error claro y datos conservados")
    ctx, pg, errs = nuevo()
    pg.goto(BASE + "/v/closer/"); rellenar(pg, "Ankara Kebab"); pg.click("#btn-enviar")
    pg.wait_for_selector(".error-msg", timeout=15000)
    ok("Ya existe" in pg.inner_text(".error-msg"), "mensaje: " + pg.inner_text(".error-msg")[:70])
    pg.click("text=Corregir datos")
    ok(pg.input_value("#nombre_comercio") == "Ankara Kebab" and pg.input_value("#whatsapp") == "600 11 22 33", "el formulario conserva lo escrito")
    ok(json.load(open(SITIO + "/c/ankara-kebab.json"))["nombre"] == "ANKARA KEBAB" and "_generado" not in json.load(open(SITIO + "/c/ankara-kebab.json")), "el cliente real no se tocó")
    ctx.close()

    print("● 3) El navegador no puede leer la respuesta (CORS/red) → espera y confirma sola")
    ctx, pg, errs = nuevo("respuesta_ilegible")
    pg.goto(BASE + "/v/closer/"); rellenar(pg, "Taller Rápido Norte", sector="Automoción y Talleres"); pg.click("#btn-enviar")
    pg.wait_for_selector("a.btn-fin.principal", timeout=25000)
    ok(pg.get_attribute("a.btn-fin.principal", "href").endswith("cod=taller-rapido-norte"), "detecta la publicación por el código de petición")
    ctx.close()

    print("● 4) Claude caído → interfaz básica + aviso al closer")
    ctx, pg, errs = nuevo(ia="caida")
    pg.goto(BASE + "/v/closer/"); rellenar(pg, "Bar Sin IA", sector="Hostelería y Restauración"); pg.click("#btn-enviar")
    pg.wait_for_selector("a.btn-fin.principal", timeout=20000)
    ok("interfaz básica" in pg.inner_text("#zona-avisos"), "avisa de que se publicó la versión básica")
    ctx.close()

    print("● 5) Validación del formulario (sin WhatsApp)")
    ctx, pg, errs = nuevo(); msgs = []
    pg.on("dialog", lambda d: (msgs.append(d.message), d.dismiss()))
    pg.goto(BASE + "/v/closer/"); pg.fill("#nombre_comercio", "Sin Telefono"); pg.select_option("#sector_select", "Otros"); pg.fill("#sector_otro_input", "Buceo"); pg.click("#btn-enviar")
    ok(any("WhatsApp" in m for m in msgs) and not os.path.exists(SITIO + "/c/sin-telefono.json"), "no envía sin WhatsApp")
    ctx.close()

    print("● 6) Buscador de Google Maps → Place ID → reseña directa")
    ctx, pg, errs = nuevo()
    pg.goto(BASE + "/v/closer/")
    pg.fill("#maps_consulta", "sol y luna alcobendas"); pg.click("#btn-buscar")
    pg.wait_for_selector(".maps-item", timeout=10000)
    ok(pg.locator(".maps-item").count() == 1 and "Alcobendas" in pg.inner_text(".maps-item"), "lista un candidato con su dirección")
    pg.click(".maps-item")
    ok(pg.input_value("#nombre_comercio") == "Peluquería Sol & Luna", "rellena el nombre")
    ok(pg.input_value("#sector_select") == "Belleza y Estética", "elige el sector según Google")
    ok(pg.input_value("#whatsapp") == "34600112233" and pg.input_value("#web") == "https://solyluna.example", "propone WhatsApp y web")
    ok(pg.input_value("#place_id").startswith("ChIJ") and "reseña directa" in pg.inner_text("#maps-ok").lower(), "guarda el Place ID y lo confirma")
    ok(not pg.is_visible("#nombre_comercio") and not pg.is_visible("#google"), "esconde nombre y enlace de reseñas (ya vienen de Maps)")
    pg.wait_for_selector(".chip-friccion"); pg.locator(".chip-friccion").nth(0).click()
    pg.click("#btn-enviar")
    pg.wait_for_selector("a.btn-fin.principal", timeout=20000)
    j = json.load(open(SITIO + "/c/peluqueria-sol-luna.json"))
    ok(j["secciones"][3]["botones"][0]["urlGoogle"] == "https://search.google.com/local/writereview?placeid=ChIJ7xPNJJ6rWg0RWllatpjaQ38", "la interfaz publicada abre la reseña directa")
    ok(not errs, "sin errores JS %s" % errs)
    ctx.close()

    print("● 7) Maps no configurado → mensaje claro, el formulario sigue en modo manual")
    ctx = nav.new_context(viewport={"width": 390, "height": 844}); pg = ctx.new_page()
    ctx.route(re.compile(r"^https://script\.google\.com/"), lambda r: r.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"},
              body=json.dumps({"ok": False, "codigo": "sin_maps", "error": "El buscador de Google Maps no está configurado todavía. Rellena los datos a mano."})))
    pg.goto(BASE + "/v/closer/"); pg.fill("#maps_consulta", "cualquier cosa"); pg.click("#btn-buscar")
    pg.wait_for_function("document.getElementById('maps-msg').textContent.length > 0")
    ok("no está configurado" in pg.inner_text("#maps-msg") and pg.locator("#nombre_comercio").is_enabled(), "avisa y permite escribir a mano")
    ctx.close()

    print("● 8) Los 17 sectores del formulario existen y muestran fricciones")
    ctx, pg, errs = nuevo(); pg.goto(BASE + "/v/closer/")
    valores = pg.eval_on_selector_all("#sector_select option:not([disabled])", "o => o.map(x => x.value)")
    ok(len(valores) == 17, "17 sectores en el desplegable (%d)" % len(valores))
    sin = []
    for v in valores:
        pg.select_option("#sector_select", v)
        if v != "Otros" and pg.locator(".chip-friccion").count() < 3: sin.append(v)
    ok(not sin, "todos los sectores traen al menos 3 fricciones sugeridas %s" % sin)
    ctx.close()
    nav.close()

shutil.rmtree(SITIO, ignore_errors=True)
print()
if fallos: print("FALLOS:", *fallos, sep="\n - "); sys.exit(1)
print("TODO OK · recorrido completo")
