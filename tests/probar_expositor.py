#!/usr/bin/env python3
"""Hoja de impresión del expositor (v/expositor/): el QR impreso se lee con una cámara y abre
exactamente el enlace de la pieza; los enlaces que no son de Studio 42 se rechazan.
Uso: python3 tests/probar_expositor.py   (necesita: pip install playwright opencv-python-headless)"""
import http.server, os, socketserver, sys, tempfile, threading, urllib.parse
import cv2, numpy as np
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=RAIZ, **k)
    def log_message(s, *a): pass
srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Q); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % srv.server_address[1]

fallos = []
def ok(c, m):
    print("   " + ("✓" if c else "✗"), m)
    if not c: fallos.append(m)

def leer_qr(png):
    img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
    texto, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
    return texto

CASOS = [
    ("display", "https://studio42.es/c/?cod=ankara-kebab&k=MOSTRADOR-QR"),
    ("display", "https://studio42.es/c/?cod=ankara-kebab&k=DISPLAY2-QR"),
    ("mesa",    "https://studio42.es/c/?cod=ankara-kebab&k=MESA05&mesa=5"),
]
salida = tempfile.mkdtemp(prefix="s42arte_")

with sync_playwright() as pw:
    nav = pw.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
    pag = nav.new_page(device_scale_factor=3)
    for fmt, enlace in CASOS:
        print("•", fmt, enlace)
        pag.goto(BASE + "/v/expositor/?f=" + fmt + "&qr=" + urllib.parse.quote(enlace, safe=""))
        pag.wait_for_selector(".hoja ." + "marco svg", timeout=15000)
        pag.wait_for_function("[...document.images].every(i => i.complete)")
        ok(pag.locator(".hoja").first.get_attribute("class").endswith(fmt), "formato " + fmt)
        ok("ANKARA" in pag.title().upper(), "usa los datos del comercio (título: %s)" % pag.title())
        leido = leer_qr(pag.locator(".marco").screenshot())
        ok(leido == enlace, "el QR (con logo en el centro) se lee y abre el enlace exacto: %r" % leido)
        nombre = os.path.join(salida, enlace.split("k=")[1].split("&")[0] + ".png")
        pag.locator(".hoja").screenshot(path=nombre)
        mm = pag.evaluate("(() => { const r = document.querySelector('.hoja').getBoundingClientRect(); return [r.width, r.height].map(x => Math.round(x * 25.4 / 96)); })()")
        ok(mm == ([148, 105] if fmt == "display" else [80, 80]), "tamaño real %s mm" % mm)
        if fmt == "mesa": ok(pag.locator(".num").inner_text() == "Mesa 5", "número de mesa impreso")

    for malo in ["https://otra-web.com/c/?cod=ankara-kebab", "https://studio42.es/otra/?cod=x", "javascript:alert(1)", ""]:
        pag.goto(BASE + "/v/expositor/?qr=" + urllib.parse.quote(malo, safe=""))
        pag.wait_for_selector(".aviso", timeout=5000)
        ok(pag.locator(".marco").count() == 0, "rechaza el enlace %r" % malo)
    nav.close()

print("\nCapturas en", salida)
print("\n" + ("TODO OK" if not fallos else "FALLOS: %d" % len(fallos)))
sys.exit(1 if fallos else 0)
