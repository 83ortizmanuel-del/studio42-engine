#!/usr/bin/env python3
"""Comprueba que las reglas de los asistentes de Iberlax dan el mismo resultado que el motor antiguo."""
import http.server, os, re, socketserver, sys, threading
from playwright.sync_api import sync_playwright
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=RAIZ, **k)
    def log_message(s, *a): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), Q); P = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

# (botón, {paso: opción}, texto esperado en el resultado)
CASOS = [
 ("Diagnóstico de Fatiga", {"Antigüedad del colchón": "Menos de 3 años (Óptimo)", "Sensación al despertar": "Descanso reparador / Sin molestias"}, "favorable"),
 ("Diagnóstico de Fatiga", {"Antigüedad del colchón": "De 4 a 7 años (Desgaste progresivo)", "Sensación al despertar": "Descanso reparador / Sin molestias"}, "intermedia"),
 ("Diagnóstico de Fatiga", {"Antigüedad del colchón": "Menos de 3 años (Óptimo)", "Sensación al despertar": "Leve pesadez o rigidez lumbar"}, "intermedia"),
 ("Diagnóstico de Fatiga", {"Antigüedad del colchón": "De 8 a 10 años (Límite de vida útil)", "Sensación al despertar": "Descanso reparador / Sin molestias"}, "crítica"),
 ("Diagnóstico de Fatiga", {"Antigüedad del colchón": "Menos de 3 años (Óptimo)", "Sensación al despertar": "Noto hueco o deformación visible"}, "crítica"),
 ("Diagnóstico de Fatiga", {"Antigüedad del colchón": "De 4 a 7 años (Desgaste progresivo)", "Sensación al despertar": "Puntos de presión o molestia cervical/espalda"}, "crítica"),
 ("Test Ergonómico", {"Postura de descanso": "De lado", "Complexión / peso": "70-90 kg", "Medida deseada": "150x190"}, "media adaptable"),
 ("Test Ergonómico", {"Postura de descanso": "De lado", "Complexión / peso": "Menos de 70 kg", "Medida deseada": "150x190"}, "media-suave"),
 ("Test Ergonómico", {"Postura de descanso": "Boca arriba", "Complexión / peso": "Menos de 70 kg", "Medida deseada": "150x190"}, "alta"),
 ("Test Ergonómico", {"Postura de descanso": "Boca abajo", "Complexión / peso": "Más de 90 kg", "Medida deseada": "180x200"}, "alta"),
 ("Logística", {"Zona de entrega": "Logroño Centro / Casco", "Acceso al edificio": "Con ascensor / Planta baja", "Retirada de usado": "Sí, retirar colchón antiguo"}, "bonificado"),
 ("Logística", {"Zona de entrega": "Rioja / Otras localidades", "Acceso al edificio": "Con ascensor / Planta baja", "Retirada de usado": "Sí, retirar colchón antiguo"}, "interurbana"),
 ("Logística", {"Zona de entrega": "Rioja / Otras localidades", "Acceso al edificio": "Escalera (3º o superior)", "Retirada de usado": "No, solo entrega nuevo"}, "2 operarios"),
]
mal = 0
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page()
    pg.route(re.compile(r"^https?://(?!127\.0\.0\.1)"), lambda r: r.fulfill(status=404, body="no"))
    pg.goto("http://127.0.0.1:%d/c/index.html?cod=iberlax" % P)
    pg.wait_for_selector("#dynamic-menu .app-btn")
    for boton, sel, esperado in CASOS:
        pg.locator("#dynamic-menu button.app-btn", has_text=boton).first.click()
        for paso, op in sel.items():
            pg.locator("#modal-overlay .campo", has_text=paso).locator(".pill", has_text=op).first.click()
        res = pg.inner_text("#modal-overlay .resultado").lower()
        ok = esperado in res
        mal += (not ok)
        print("✓" if ok else "✗", boton, list(sel.values()), "→", res.replace("\n", " ")[:70])
        pg.keyboard.press("Escape")
    b.close()
sys.exit(1 if mal else 0)
