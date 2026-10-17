/* ==========================================================
   MESSINA FILM — script compartido (sitio + EPK)
   Edita CONFIG con el WhatsApp y correo reales.
   ========================================================== */
const CONFIG = {
  marca: "Messina Film",
  whatsapp: "584124094371", // número con código de país (58 = Venezuela), sin + ni espacios
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- HUD del visor: timecode corriendo ---------- */
function initHud() {
  const tc = document.getElementById("hud-tc");
  if (!tc) return;
  const start = performance.now();
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const el = (performance.now() - start) / 1000;
    tc.textContent = `TC ${pad(Math.floor(el / 3600))}:${pad(Math.floor(el / 60) % 60)}:${pad(Math.floor(el) % 60)}:${pad(Math.floor((el % 1) * 30))}`;
  };
  tick();
  if (!reduceMotion) setInterval(tick, 1000 / 30);
}

/* ---------- Reel de portada ----------
   Alterna las tomas con tres transiciones (fundido, barrido con destello rojo
   y zoom). Si una toma tiene data-video, reproduce ese clip en lugar de la foto. */
function initHeroReel() {
  const reel = document.querySelector(".hero-reel");
  const bar = document.querySelector(".hero-progress");
  if (!reel || !bar) return;
  const slides = [...reel.querySelectorAll(".slide")];
  const now = document.getElementById("hud-now");
  const cam = document.getElementById("hud-cam");
  const FX = ["zoom", "wipe", "fade"];
  const DUR = 6000;
  bar.style.setProperty("--dur", `${DUR}ms`);

  slides.forEach((s) => {
    if (!s.dataset.video) return;
    const img = s.querySelector("img");
    const v = document.createElement("video");
    Object.assign(v, { muted: true, playsInline: true, loop: true, preload: "metadata", src: s.dataset.video });
    v.setAttribute("muted", "");
    if (img) { v.poster = img.src; img.remove(); }
    s.prepend(v);
  });

  bar.innerHTML = slides.map((s) => `<button type="button" aria-label="Ver toma de ${s.dataset.name}"><i></i></button>`).join("");
  const segs = [...bar.children];
  let i = 0, timer = null;

  const preload = (s) => { const img = s?.querySelector("img"); if (img) img.loading = "eager"; };

  function show(n) {
    const prev = slides[i];
    i = (n + slides.length) % slides.length;
    const cur = slides[i];
    if (prev !== cur) {
      prev.classList.remove("active", ...FX);
      prev.classList.add("leaving");
      setTimeout(() => prev.classList.remove("leaving"), 1500);
      prev.querySelector("video")?.pause();
    }
    cur.classList.remove("active", "leaving", ...FX);
    void cur.offsetWidth; // reinicia la animación
    cur.classList.add("active", FX[i % FX.length]);
    const v = cur.querySelector("video");
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    preload(slides[(i + 1) % slides.length]);

    if (now) {
      now.classList.add("swap");
      setTimeout(() => { now.textContent = `${cur.dataset.name} · ${cur.dataset.place}`.toUpperCase(); now.classList.remove("swap"); }, 300);
    }
    if (cam) cam.textContent = String(i + 1).padStart(2, "0");
    segs.forEach((g, k) => { g.classList.toggle("done", k < i); g.classList.remove("on"); });
    void segs[i].offsetWidth;
    segs[i].classList.add("on");
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!reduceMotion && !document.hidden) timer = setTimeout(() => show(i + 1), DUR);
  }

  segs.forEach((g, k) => g.addEventListener("click", () => show(k)));
  // En segundo plano se pausa; al volver, la toma actual corre su tiempo completo
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearTimeout(timer); return; }
    segs[i].classList.remove("on"); void segs[i].offsetWidth; segs[i].classList.add("on");
    schedule();
  });
  // primera toma sin transición, ya visible al cargar
  slides[0].classList.add("active");
  preload(slides[1]);
  segs[0].classList.add("on");
  schedule();
}

/* ---------- Navegación ---------- */
function initNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  if (toggle && links) {
    const close = () => { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "Menú"; };
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Cerrar" : "Menú";
    });
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  }
}

/* ---------- Modal de video ----------
   En el hosting propio (página abierta directamente) el video se reproduce
   dentro del modal. Dentro de una vista previa embebida, donde YouTube e
   Instagram no se pueden incrustar, muestra la imagen y abre el video aparte. */
const CAN_EMBED = window.self === window.top;
const PLAY_ICON = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="currentColor"/></svg>';

function link(href, text, primary) {
  const a = document.createElement("a");
  a.className = primary ? "btn btn-primary" : "btn";
  a.href = href; a.textContent = text;
  if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
  return a;
}

let closeLightbox = () => {};

function initLightbox() {
  const dlg = document.getElementById("lightbox");
  if (!dlg) return null;
  const frame = dlg.querySelector(".frame");
  const actions = dlg.querySelector(".lb-actions");

  function open({ img, alt, title, desc, meta, yt, ig, embed }) {
    const ytUrl = yt && `https://www.youtube.com/watch?v=${yt}`;
    const igUrl = ig && `https://www.instagram.com/${ig}/`;
    const vertical = embed === "ig";
    frame.classList.toggle("vertical", vertical);
    frame.replaceChildren();
    if (CAN_EMBED && (embed === "yt" || embed === "ig")) {
      // La miniatura queda de fondo mientras carga el reproductor
      const poster = document.createElement("img");
      poster.src = img; poster.alt = "";
      const f = document.createElement("iframe");
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      // YouTube necesita saber desde qué web se abre el video (si no, muestra "Error 153")
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.title = title;
      f.src = embed === "yt"
        ? `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(location.origin)}`
        : `https://www.instagram.com/${ig}/embed/`;
      frame.append(poster, f);
    } else {
      const i = document.createElement("img");
      i.src = img; i.alt = alt || "";
      const hint = document.createElement("a");
      hint.className = "play-hint";
      hint.href = embed === "ig" ? igUrl : ytUrl;
      hint.target = "_blank"; hint.rel = "noopener";
      hint.setAttribute("aria-label", "Reproducir video");
      hint.innerHTML = `<i>${PLAY_ICON}</i>`;
      frame.append(i, hint);
    }
    dlg.querySelector("h3").textContent = title;
    dlg.querySelector(".desc").textContent = desc || "";
    dlg.querySelector(".lb-meta").textContent = meta || "";
    actions.replaceChildren();
    if (ytUrl) actions.append(link(ytUrl, "Ver en YouTube", true));
    if (igUrl) actions.append(link(igUrl, "Ver teaser en Instagram"));
    const contact = link(dlg.dataset.contact || "#contacto", "Quiero un set así");
    contact.addEventListener("click", () => closeLightbox());
    actions.append(contact);
    dlg.showModal();
  }

  // Quitar el reproductor detiene el audio al instante
  const stop = () => frame.querySelectorAll("iframe").forEach((f) => f.remove());
  const close = () => { stop(); dlg.close(); };
  dlg.addEventListener("close", stop); // también al cerrar con la tecla Esc
  dlg.querySelector(".close").addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  closeLightbox = close;
  return open;
}

/* ---------- Portafolio, tomas aéreas y locaciones ---------- */
function initPortfolio() {
  const open = initLightbox();
  const reels = [...document.querySelectorAll(".reel")];

  document.querySelectorAll(".filter").forEach((btn) => btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    const f = btn.dataset.filter;
    reels.forEach((r) => { r.hidden = f !== "todo" && !(r.dataset.cat || "").split(" ").includes(f); });
  }));

  if (!open) return;
  const fromReel = (r) => ({
    img: r.querySelector("img").src, alt: r.querySelector("img").alt,
    title: r.querySelector("h3").textContent, desc: r.dataset.desc, meta: r.dataset.meta,
    yt: r.dataset.yt, embed: "yt",
  });
  reels.forEach((r) => r.addEventListener("click", () => open(fromReel(r))));

  document.querySelectorAll(".shot").forEach((s) => s.addEventListener("click", () => open({
    img: s.querySelector("img").src, alt: s.querySelector("img").alt,
    title: s.dataset.title, desc: s.dataset.desc, meta: s.dataset.meta,
    // Instagram no permite incrustar reels de forma confiable: se reproduce el set
    // (que abre con las tomas de drone) y el teaser queda como enlace.
    yt: s.dataset.yt, ig: s.dataset.ig, embed: "yt",
  })));

  document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => {
    const r = document.querySelector(`.reel[data-yt="${b.dataset.open}"]`);
    if (r) open(fromReel(r));
  }));
}

/* ---------- Enlaces "Cotizar" que eligen el servicio ---------- */
function initServiceLinks() {
  const sel = document.getElementById("q-servicio");
  if (!sel) return;
  document.querySelectorAll("[data-servicio]").forEach((a) => a.addEventListener("click", () => {
    sel.value = a.dataset.servicio;
  }));
}

/* ---------- Copiar al portapapeles ---------- */
async function copyText(text, btn) {
  const label = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copiado"; }
  catch { btn.textContent = "Selecciona y copia"; }
  setTimeout(() => (btn.textContent = label), 1800);
}

/* ---------- Cotizador ---------- */
function initQuote() {
  const form = document.getElementById("quote");
  if (!form) return;
  const out = document.getElementById("quote-out");
  const pre = out.querySelector("pre");
  const err = document.getElementById("quote-err");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const nombre = (d.get("nombre") || "").trim();
    const contacto = (d.get("contacto") || "").trim();
    if (!nombre || !contacto) { err.textContent = "Escribe tu nombre y un teléfono o correo para poder responderte."; return; }
    err.textContent = "";
    const extras = d.getAll("extras");
    const txt = [
      `Hola ${CONFIG.marca}, quiero cotizar un proyecto.`,
      `Nombre / artista: ${nombre}`,
      `Contacto: ${contacto}`,
      `Proyecto: ${d.get("servicio")}`,
      d.get("fecha") ? `Fecha: ${d.get("fecha")}` : null,
      d.get("lugar") ? `Locación: ${d.get("lugar")}` : null,
      extras.length ? `Incluir: ${extras.join(", ")}` : null,
      d.get("mensaje") ? `Detalles: ${d.get("mensaje").trim()}` : null,
    ].filter(Boolean).join("\n");
    pre.textContent = txt;
    out.querySelector(".wa").href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;
    out.hidden = false;
    out.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  });
  out.querySelector(".copy").addEventListener("click", (e) => copyText(pre.textContent, e.currentTarget));
}

/* ---------- EPK: copiar biografías ---------- */
function initCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", () => {
    const t = document.getElementById(btn.dataset.copy);
    if (t) copyText(t.innerText.trim(), btn);
  }));
  document.querySelectorAll("[data-count]").forEach((el) => {
    const t = document.getElementById(el.dataset.count);
    if (t) el.textContent = `${t.innerText.trim().split(/\s+/).length} palabras`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHud();
  initHeroReel();
  initPortfolio();
  initServiceLinks();
  initQuote();
  initCopyButtons();
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});
