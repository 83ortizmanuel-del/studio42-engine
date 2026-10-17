#!/usr/bin/env node
/* Prueba tools/generar-fichas.js en una carpeta temporal (no toca el repo).
   Uso: node tests/probar_fichas.js */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const GEN = path.join(__dirname, "..", "tools", "generar-fichas.js");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fichas-"));
let fallos = 0;
const ok = (cond, msg) => { console.log((cond ? "✓ " : "✗ ") + msg); if (!cond) fallos++; };
const escribe = (rel, obj) => { const f = path.join(tmp, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof obj === "string" ? obj : JSON.stringify(obj)); };
const lee = (rel) => fs.readFileSync(path.join(tmp, rel), "utf8");
const existe = (rel) => fs.existsSync(path.join(tmp, rel));
const corre = (...a) => { try { return { rc: 0, out: execFileSync("node", [GEN, "--raiz", tmp, ...a]).toString() }; } catch (e) { return { rc: e.status, out: String(e.stdout) }; } };

const base = { nombre: "Bar <Prueba>", secciones: [{ botones: [{ tipo: "whatsapp", nombre: "Pedir", descripcion: "Por WhatsApp" }, { tipo: "parking", nombre: "Aparcar" }] }], whatsapp: "https://wa.me/34600111222" };
const ficha = { tipo: "BarOrPub", direccion: "Calle Mayor 1", cp: "26001", ciudad: "Logroño", horario: ["Mo-Fr 09:00-14:00"] };

escribe("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://studio42.es/</loc></url>\n</urlset>\n');
escribe("c/bar-prueba.json", Object.assign({}, base, { ficha }));
escribe("c/sin-ficha.json", base);
escribe("c/en-pausa.json", Object.assign({}, base, { ficha, pausada: true }));
escribe("c/ocupado.json", Object.assign({}, base, { ficha }));
escribe("ocupado/index.html", "<p>landing a medida</p>");

let r = corre();
ok(r.rc === 0, "el generador termina bien");
const html = lee("bar-prueba/index.html");
ok(html.includes("<title>Bar &lt;Prueba&gt; en Logroño (26001)</title>"), "título con nombre escapado, ciudad y CP");
ok(html.includes('<link rel="canonical" href="https://studio42.es/bar-prueba/">'), "canonical propio");
ok(html.includes('href="/c/?cod=bar-prueba"'), "botón que abre la app de siempre");
ok(!html.includes("<Prueba>"), "no se cuela HTML del JSON");
const ld = JSON.parse(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/.exec(html)[1]);
ok(ld["@type"] === "BarOrPub" && ld.address.postalCode === "26001" && ld.address.addressLocality === "Logroño", "schema con tipo, CP y ciudad");
ok(ld.telephone === "+34600111222", "teléfono sacado del WhatsApp");
ok(html.includes("Lunes a viernes: 09:00 a 14:00"), "horario legible");
ok(html.includes("Pedir") && !html.includes("Aparcar"), "lista de servicios sin botones genéricos");
ok(!existe("sin-ficha") && !existe("en-pausa"), "sin ficha o en pausa no hay página");
ok(lee("ocupado/index.html") === "<p>landing a medida</p>", "no pisa una carpeta que ya existía");
ok(/aviso|⚠/.test(r.out) && r.out.includes("ocupado"), "avisa del choque de nombres");
const mapa = lee("sitemap.xml");
ok(mapa.includes("<loc>https://studio42.es/bar-prueba/</loc>") && mapa.includes("<loc>https://studio42.es/</loc>"), "sitemap con la ficha y lo de antes");
ok(!mapa.includes("ocupado/") && !mapa.includes("en-pausa/"), "sitemap sin las que se saltan");

ok(corre("--comprobar").rc === 0, "segunda pasada: sin cambios (idempotente)");

escribe("c/bar-prueba.json", Object.assign({}, base, { ficha, pausada: true }));
ok(corre("--comprobar").rc === 1, "--comprobar detecta que habría cambios");
corre();
ok(!existe("bar-prueba"), "al pausar el cliente se borra su página");
ok(!lee("sitemap.xml").includes("bar-prueba"), "y sale del sitemap");

fs.rmSync(tmp, { recursive: true, force: true });
console.log(fallos ? fallos + " fallo(s)" : "Todo bien.");
process.exit(fallos ? 1 : 0);
