#!/usr/bin/env node
/*
 * Genera una página estática por cliente para que Google la pueda leer:
 *   c/<slug>.json  (con bloque "ficha")  →  <slug>/index.html  +  entrada en sitemap.xml
 *
 * Por qué: la landing c/?cod=<slug> pinta todo con JavaScript y Google la ve como
 * una página de Studio 42. Esta página lleva el nombre, la dirección, el código
 * postal y el schema LocalBusiness en el HTML, y un botón que abre la app de siempre.
 *
 * También lee fichas/<slug>.json: clientes con web a medida (sin c/<slug>.json), como
 * las sedes de La Sucursal. Llevan "app" (la ruta que abre el botón) y "servicios".
 *
 * Uso:  node tools/generar-fichas.js            (escribe en la raíz del repo)
 *       node tools/generar-fichas.js --raiz DIR (otra carpeta, para pruebas)
 *       node tools/generar-fichas.js --comprobar (no escribe; sale con 1 si algo cambiaría)
 *
 * Reglas:
 *  - Solo clientes con "ficha" y sin "pausada", "redirigir" ni "ficha.indexar": false.
 *  - Nunca pisa una carpeta que no haya creado este script (p. ej. nutrition-planet/).
 *  - Borra las páginas que creó antes si el cliente ya no cumple las reglas.
 *  - La salida no lleva fechas de generación: si nada cambia, git no ve cambios.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DOMINIO = "https://studio42.es";
const MARCA = "<!-- generado por tools/generar-fichas.js: no editar a mano -->";
const SITEMAP_INI = "<!-- fichas:inicio (lo rellena tools/generar-fichas.js) -->";
const SITEMAP_FIN = "<!-- fichas:fin -->";
const SLUG_OK = /^[a-z0-9][a-z0-9-]{1,60}$/;

const args = process.argv.slice(2);
const iRaiz = args.indexOf("--raiz");
const RAIZ = path.resolve(iRaiz >= 0 ? args[iRaiz + 1] : path.join(__dirname, ".."));
const COMPROBAR = args.includes("--comprobar");

/* ------------------------------- utilidades ------------------------------- */
const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const limpio = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const hexOk = (c, def) => (/^#[0-9a-fA-F]{6}$/.test(c || "") ? c : def);
const recorta = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");

function urlLogo(logo) {
    if (!logo) return "";
    if (/^https:\/\//.test(logo)) return logo;
    if (/^\/[\w\-./]+$/.test(logo) && !logo.includes("..")) return DOMINIO + logo;
    if (/^[\w\-./]+$/.test(logo) && !logo.includes("..")) return DOMINIO + "/c/" + logo.replace(/^\.?\//, "");
    return "";
}
function digitos(s) { return String(s || "").replace(/[^0-9]/g, ""); }
function urlWhatsapp(w) {
    if (!w) return "";
    if (/^https:\/\/wa\.me\//.test(w)) return w.split("?")[0];
    let n = digitos(w);
    if (n.length === 9) n = "34" + n;
    return n.length >= 9 ? "https://wa.me/" + n : "";
}
function telefonoE164(f, d) {
    const t = f.telefono || d.telefono;
    if (t) {
        let n = digitos(t);
        if (n.length === 9) n = "34" + n;
        return "+" + n;
    }
    const wa = urlWhatsapp(d.whatsapp);
    return wa ? "+" + digitos(wa) : "";
}
function telefonoVisible(e164) {
    const m = /^\+34(\d{3})(\d{3})(\d{3})$/.exec(e164);
    return m ? m[1] + " " + m[2] + " " + m[3] : e164;
}

const DIAS = { Mo: "lunes", Tu: "martes", We: "miércoles", Th: "jueves", Fr: "viernes", Sa: "sábado", Su: "domingo" };
/* ["Tu-Sa 10:00-14:00", "Tu-Sa 16:00-21:00"] → ["Martes a sábado: 10:00 a 14:00 y 16:00 a 21:00"] */
function horarioLegible(lineas) {
    const grupos = new Map();
    for (const linea of lineas) {
        const [dias, horas] = linea.split(" ");
        if (!grupos.has(dias)) grupos.set(dias, []);
        grupos.get(dias).push(horas.replace("-", " a "));
    }
    return [...grupos].map(([dias, horas]) => {
        const txt = dias.split(",").map((t) => t.split("-").map((d) => DIAS[d]).join(" a ")).join(", ");
        return txt.charAt(0).toUpperCase() + txt.slice(1) + ": " + horas.join(" y ");
    });
}

function fechaGit(archivo) {
    try {
        const f = execFileSync("git", ["log", "-1", "--format=%cs", "--", archivo], { cwd: RAIZ, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
    } catch (e) { /* sin git: usamos la fecha del archivo */ }
    return fs.statSync(archivo).mtime.toISOString().slice(0, 10);
}

/* Lo que ofrece el negocio, sacado de sus botones (texto real para Google). */
function servicios(d) {
    if (Array.isArray(d.servicios)) {
        return d.servicios.map((s) => ({ nombre: limpio(s && s.nombre), descripcion: limpio(s && s.descripcion) }))
            .filter((s) => s.nombre).slice(0, 12);
    }
    const vistos = new Set();
    const out = [];
    for (const s of d.secciones || []) {
        for (const b of (s && s.botones) || []) {
            const nombre = limpio(b.nombre);
            if (!nombre || ["llaves", "parking", "vcard", "opinion"].includes(b.tipo)) continue;
            const clave = nombre.toLowerCase();
            if (vistos.has(clave)) continue;
            vistos.add(clave);
            out.push({ nombre, descripcion: limpio(b.descripcion) });
        }
    }
    return out.slice(0, 12);
}

/* --------------------------------- página --------------------------------- */
function pagina(slug, d) {
    const f = d.ficha;
    const nombre = limpio(d.nombre);
    const categoria = limpio(f.categoria);
    const ciudad = limpio(f.ciudad);
    const cp = f.cp;
    const direccion = limpio(f.direccion);
    const url = DOMINIO + "/" + slug + "/";
    const app = d.app || "/c/?cod=" + encodeURIComponent(slug);
    const logo = urlLogo(d.logo);
    const tel = telefonoE164(f, d);
    const wa = urlWhatsapp(d.whatsapp);
    const acento = hexOk(d.colorAcento, "#00E5FF");
    const fondoLogo = /^#[0-9a-fA-F]{6}$|^transparent$/.test(d.fondoLogo || "") ? d.fondoLogo : "#0b0c10";
    const lista = servicios(d);
    const HORA = /^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?(,(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?)* [0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]$/;
    f.horario = (Array.isArray(f.horario) ? f.horario : []).filter((h) => HORA.test(h));

    const titulo = recorta(nombre + (categoria ? " · " + categoria : "") + " en " + ciudad + " (" + cp + ")", 70);
    const descripcion = recorta(limpio(f.descripcion) ||
        (nombre + (categoria ? ", " + categoria.toLowerCase() : "") + " en " + direccion + ", " + cp + " " + ciudad + "." +
         (limpio(d.subtitulo) ? " " + limpio(d.subtitulo) + "." : "") +
         (lista.length ? " " + lista.slice(0, 3).map((s) => s.nombre).join(", ") + "." : "")), 160);

    const ld = {
        "@context": "https://schema.org",
        "@type": f.tipo || "LocalBusiness",
        "@id": url + "#negocio",
        name: nombre,
        url: url,
        description: descripcion,
        address: {
            "@type": "PostalAddress",
            streetAddress: direccion,
            postalCode: cp,
            addressLocality: ciudad,
            addressRegion: f.provincia || undefined,
            addressCountry: "ES",
        },
        telephone: tel || undefined,
        email: f.email || undefined,
        image: logo || undefined,
        logo: logo || undefined,
        geo: typeof f.lat === "number" && typeof f.lng === "number" ? { "@type": "GeoCoordinates", latitude: f.lat, longitude: f.lng } : undefined,
        hasMap: f.mapsUrl || undefined,
        openingHours: f.horario && f.horario.length ? f.horario : undefined,
        priceRange: f.precio || undefined,
        sameAs: [f.web, f.mapsUrl].concat(f.redes || []).filter(Boolean),
    };
    if (!ld.sameAs.length) delete ld.sameAs;
    const ldTexto = JSON.stringify(ld, null, 2).replace(/</g, "\\u003c");

    const mapa = f.mapsUrl || ("https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(nombre + ", " + direccion + ", " + cp + " " + ciudad));

    const contacto = [
        tel ? `<a class="boton" href="tel:${esc(tel)}">Llamar · ${esc(telefonoVisible(tel))}</a>` : "",
        wa ? `<a class="boton" href="${esc(wa)}" rel="noopener">WhatsApp</a>` : "",
        `<a class="boton" href="${esc(mapa)}" rel="noopener">Cómo llegar</a>`,
        f.web ? `<a class="boton" href="${esc(f.web)}" rel="noopener">Web</a>` : "",
    ].filter(Boolean).join("\n        ");

    return `<!DOCTYPE html>
${MARCA}
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0d0f13">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${esc(url)}">
${logo ? `<meta property="og:image" content="${esc(logo)}">\n` : ""}<meta name="geo.region" content="ES">
<meta name="geo.placename" content="${esc(ciudad)}">
<link rel="icon" href="${esc(logo || "/img/logo.webp")}">
<script type="application/ld+json">
${ldTexto}
</script>
<style>
  :root { --acento: ${acento}; --fondo: #0d0f13; --superficie: #171a20; --texto: #f3f4f6; --suave: #a1a7b3; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; background: var(--fondo); color: var(--texto); line-height: 1.5; padding: 24px 16px 48px; }
  main { max-width: 560px; margin: 0 auto; }
  .logo { width: 112px; height: 112px; object-fit: contain; border-radius: 24px; background: ${fondoLogo}; padding: 10px; display: block; margin: 0 auto 16px; }
  h1 { font-size: 1.7rem; line-height: 1.2; text-align: center; }
  .sub { color: var(--suave); text-align: center; margin-top: 6px; }
  .abrir { display: block; text-align: center; margin: 22px 0; padding: 16px; border-radius: 16px; background: var(--acento); color: #0d0f13; font-weight: 700; font-size: 1.1rem; text-decoration: none; }
  section { background: var(--superficie); border-radius: 18px; padding: 18px; margin-top: 14px; }
  h2 { font-size: 1rem; color: var(--acento); margin-bottom: 8px; }
  address { font-style: normal; }
  .botones { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .boton { flex: 1 1 140px; text-align: center; padding: 11px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12); color: var(--texto); text-decoration: none; }
  ul { list-style: none; }
  li + li { margin-top: 10px; }
  li span { display: block; color: var(--suave); font-size: .92rem; }
  footer { text-align: center; color: var(--suave); font-size: .85rem; margin-top: 28px; }
  footer a { color: var(--suave); }
</style>
</head>
<body>
<main>
  <header>
    ${logo ? `<img class="logo" src="${esc(logo)}" alt="Logo de ${esc(nombre)}" width="112" height="112">` : ""}
    <h1>${esc(nombre)}</h1>
    <p class="sub">${esc([categoria, limpio(d.subtitulo)].filter(Boolean).join(" · ") || ciudad)}</p>
  </header>

  <a class="abrir" href="${esc(app)}">Abrir la app de ${esc(nombre)}</a>
${limpio(f.descripcion) ? `
  <section>
    <h2>Sobre nosotros</h2>
    <p>${esc(limpio(f.descripcion))}</p>
  </section>
` : ""}
  <section>
    <h2>Dónde estamos</h2>
    <address>
      ${esc(nombre)}<br>
      ${esc(direccion)}<br>
      ${esc(cp)} ${esc(ciudad)}${f.provincia && f.provincia !== ciudad ? " (" + esc(f.provincia) + ")" : ""}
    </address>
    <div class="botones">
        ${contacto}
    </div>
  </section>
${f.horario && f.horario.length ? `
  <section>
    <h2>Horario</h2>
    <ul>
      ${horarioLegible(f.horario).map((h) => `<li>${esc(h)}</li>`).join("\n      ")}
    </ul>
  </section>
` : ""}${lista.length ? `
  <section>
    <h2>${Array.isArray(d.servicios) ? "Servicios" : "Qué puedes hacer desde la app"}</h2>
    <ul>
      ${lista.map((s) => `<li>${esc(s.nombre)}${s.descripcion ? `<span>${esc(s.descripcion)}</span>` : ""}</li>`).join("\n      ")}
    </ul>
  </section>
` : ""}
  <footer>Página creada por <a href="${DOMINIO}/">Studio 42</a> · Identidad inteligente para comercios</footer>
</main>
</body>
</html>
`;
}

/* -------------------------------- principal -------------------------------- */
function principal() {
    const dirC = path.join(RAIZ, "c");
    const cambios = [];
    const avisos = [];
    const escribir = (archivo, texto) => {
        const antes = fs.existsSync(archivo) ? fs.readFileSync(archivo, "utf8") : null;
        if (antes === texto) return;
        cambios.push(path.relative(RAIZ, archivo));
        if (!COMPROBAR) { fs.mkdirSync(path.dirname(archivo), { recursive: true }); fs.writeFileSync(archivo, texto); }
    };
    const esNuestra = (slug) => {
        const f = path.join(RAIZ, slug, "index.html");
        return fs.existsSync(f) && fs.readFileSync(f, "utf8").includes(MARCA);
    };

    const generadas = [];
    const fuentes = [];
    for (const dir of [dirC, path.join(RAIZ, "fichas")]) {
        if (!fs.existsSync(dir)) continue;
        for (const n of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) fuentes.push(path.join(dir, n));
    }
    const usados = new Set();
    for (const archivo of fuentes) {
        const nombre = path.relative(RAIZ, archivo);
        const slug = path.basename(archivo, ".json");
        if (usados.has(slug)) { avisos.push(nombre + ": ya hay otro cliente con el nombre " + slug + ", se salta"); continue; }
        let d;
        try { d = JSON.parse(fs.readFileSync(archivo, "utf8")); } catch (e) { avisos.push(nombre + ": JSON no válido, se salta"); continue; }
        const f = d.ficha;
        if (!f || typeof f !== "object") continue;
        if (f.indexar === false || d.pausada === true || d.redirigir) continue;
        if (d.app !== undefined && !(typeof d.app === "string" && /^\/(?!\/)[\w\-\/.?=&%]*$/.test(d.app))) {
            avisos.push(nombre + ": \"app\" debe ser una ruta del propio sitio (empieza por /), se salta"); continue;
        }
        if (!SLUG_OK.test(slug)) { avisos.push(slug + ": el nombre del archivo no vale como dirección web, se salta"); continue; }
        if (!limpio(d.nombre) || !limpio(f.direccion) || !/^[0-9]{5}$/.test(f.cp || "") || !limpio(f.ciudad)) {
            avisos.push(slug + ": a la ficha le falta nombre, dirección, CP o ciudad, se salta"); continue;
        }
        const destino = path.join(RAIZ, slug);
        if (fs.existsSync(destino) && !esNuestra(slug)) {
            avisos.push(slug + ": ya existe la carpeta /" + slug + "/ y no la creó este script, no se toca"); continue;
        }
        escribir(path.join(destino, "index.html"), pagina(slug, d));
        usados.add(slug);
        generadas.push({ slug, fecha: fechaGit(archivo) });
    }

    // Páginas que generamos antes y ya no tocan (cliente en pausa, sin ficha, borrado…).
    const vivas = new Set(generadas.map((g) => g.slug));
    for (const ent of fs.readdirSync(RAIZ, { withFileTypes: true })) {
        if (!ent.isDirectory() || ent.name.startsWith(".") || vivas.has(ent.name) || !esNuestra(ent.name)) continue;
        const carpeta = path.join(RAIZ, ent.name);
        cambios.push(path.relative(RAIZ, path.join(carpeta, "index.html")) + " (borrada)");
        if (!COMPROBAR) {
            fs.unlinkSync(path.join(carpeta, "index.html"));
            if (!fs.readdirSync(carpeta).length) fs.rmdirSync(carpeta);
        }
    }

    // Sitemap: solo se reescribe el bloque entre las marcas; el resto queda igual.
    const rutaMapa = path.join(RAIZ, "sitemap.xml");
    if (fs.existsSync(rutaMapa)) {
        const mapa = fs.readFileSync(rutaMapa, "utf8");
        const bloque = SITEMAP_INI + "\n" + generadas.map((g) =>
            `  <url><loc>${DOMINIO}/${g.slug}/</loc><lastmod>${g.fecha}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`).join("") +
            "  " + SITEMAP_FIN;
        let nuevo;
        const i = mapa.indexOf(SITEMAP_INI), j = mapa.indexOf(SITEMAP_FIN);
        if (i >= 0 && j > i) nuevo = mapa.slice(0, i) + bloque + mapa.slice(j + SITEMAP_FIN.length);
        else nuevo = mapa.replace("</urlset>", "  " + bloque + "\n</urlset>");
        escribir(rutaMapa, nuevo);
    } else {
        avisos.push("no hay sitemap.xml en la raíz, no se añade nada");
    }

    for (const a of avisos) console.log("⚠ " + a);
    console.log(generadas.length + " página(s) de cliente: " + (generadas.map((g) => "/" + g.slug + "/").join(", ") || "ninguna"));
    if (cambios.length) console.log((COMPROBAR ? "Cambiaría:\n  " : "Cambiado:\n  ") + cambios.join("\n  "));
    else console.log("Sin cambios.");
    if (COMPROBAR && cambios.length) process.exit(1);
}

principal();
