# Auditoría del repositorio y cambios realizados

## Fallos encontrados en la versión 1 (y cómo quedan)

| # | Hallazgo | Gravedad | Estado |
|---|---|---|---|
| 1 | **Números de reserva escritos dentro del motor antiguo**: el test de fatiga de Iberlax enviaba a `34643186453` si el cliente no tenía WhatsApp, y la tarjeta de contacto generada usaba `34672294962` (el dueño de Toby). Con cualquier cliente nuevo sin WhatsApp configurado, los mensajes y contactos habrían ido a esos números | Alta (latente) | ✅ Ya no hay números por defecto: el botón se omite y avisa en `?debug=1` |
| 2 | La tarjeta suelta `c/contacto.vcf` era la de Iberlax y se quedaba en la carpeta de todos los clientes (el motor antiguo la trataba como "marcador" y no la descargaba, pero era una trampa) | Baja | ✅ Renombrada a `contacto-iberlax.vcf` |
| 3 | Contenido del JSON insertado como HTML (`innerHTML`): cualquier texto con `<script>`/atributos rompía o inyectaba código | Alta | ✅ Todo se construye con texto (DOM), sin HTML |
| 4 | **Reseñas con filtro por estrellas** (desvío a gerencia si ≤3): incumple la política de Google | Alta (negocio) | ✅ Dos botones iguales |
| 5 | «Premio seguro» por reseñar en SPN | Alta (negocio) | ✅ Eliminado |
| 6 | La doctora tenía un botón de «hospitales **veterinarios**» (el texto era fijo de la ficha de mascotas) | Media | ✅ Búsqueda configurable por cliente |
| 7 | 5 botones de la doctora sin funcionalidad real (el motor antiguo no tenía calculadora gestacional ni contador de contracciones; el carnet de vacunas salía vacío; la teleconsulta no tenía enlace) | Media | ✅ Teleconsulta convertida; el resto anotado en `_pendientes` |
| 8 | Enlaces de relleno publicados (`AQUI_TU_LINK…`, `canva.com`, `maps.google.com`) | Media | ✅ Ocultos y anotados |
| 9 | Dependencias externas (Tailwind CDN, Font Awesome, Google Fonts): lento y envía la IP del visitante a terceros (RGPD) | Media | ✅ Cero dependencias externas |
| 10 | **El formulario del Closer no recogía teléfono, redes ni enlace de Google**: Gemini tenía que inventarlos. No daba aviso de errores (`no-cors`), contaba 35 s fijos y borraba el formulario aunque fallara | Alta | ✅ Formulario nuevo + Apps Script nuevo (ver README) |
| 11 | El formulario del Closer usaba `user-select:none` en todo el `body` y bloqueaba el zoom: en algunos iPhone no se podía escribir en los campos | Media | ✅ Corregido |
| 12 | El «prompt maestro» pedía a la IA el JSON entero y con una estructura vieja (`escudoResenas`…) | Media | ✅ Sustituido por un reparto datos/IA con filtros |
| 13 | Documentos estratégicos internos (rentabilidad, manifiesto) sueltos en la raíz y accesibles desde la web | Baja | ✅ Movidos a `docs/historico/` + ocultos en el sitio (`_redirects`) |

## Qué se cambió (resumen)
- **Motor** `c/index.html` v2 (polimórfico por `tipo`, sin dependencias, accesible, con pantallas de error y reintento). El motor antiguo queda en `c/motor-v1-respaldo.html`.
- **9 clientes migrados** conservando textos, colores, números y enlaces reales (`c/*.json`). Las URLs `…/c/?cod=<slug>` **no cambian**.
- **Esquema** `schema.json` + **validación automática** en GitHub (`.github/workflows/validar-json.yml`) en cada subida.
- **Automatización** `apps-script/Code.gs` + formulario `v/closer/index.html` (con sondeo hasta que la interfaz está en vivo).
- **Pruebas** en `tests/`, documentación en `docs/`.

## Qué se probó y qué no
| ✅ Probado | ⚠️ No se pudo probar desde aquí |
|---|---|
| Los 9 clientes en Chromium móvil: cada botón y ventana, calculadoras, asistentes, vCards, mensajes de WhatsApp sin huecos vacíos, ausencia de «undefined», botones de opinión del mismo tamaño | Servicios reales de **Google** (Apps Script, Gemini) y **GitHub**: se simularon con las mismas respuestas y errores que dan (ver `tests/_simulador.js`). El primer envío real hay que hacerlo tú (Guía, Paso 5) |
| Equivalencia de las reglas de Iberlax con el motor antiguo (13 casos) | La validación con **ajv** de GitHub Actions (se validó con `jsonschema` Draft-7, que cumple el mismo estándar) |
| `Code.gs` con 19 pruebas: slug, WhatsApp, enlaces de Google, filtros contra una IA hostil, no pisar clientes reales, caídas de Gemini/GitHub | Un **móvil físico/NFC** (se probó en emulación de móvil) |
| Recorrido completo formulario → script → JSON → interfaz (5 escenarios, incluido el de «no se puede leer la respuesta») | Que Google mantenga el modelo `gemini-2.5-flash` (configurable con `GEMINI_MODELO`) |

## Qué hay en el repo y qué hacer con ello

| Ruta | Veredicto | Motivo |
|---|---|---|
| `c/index.html`, `c/*.json`, `schema.json`, `v/closer/`, `apps-script/`, `tests/`, `docs/` | **Núcleo** | El producto |
| `AFRICARS/ Alejo/ art/ la-sucursal/ talent/ vault/ v/aura v/aura-setup v/briefingmarca v/demo c/copy-laser` | **No tocar** (revisar con calma) | Páginas sueltas de clientes/demos con su propio HTML. Pueden tener URLs grabadas en NFC. Cuando migren al motor v2, cada una se convierte en un JSON. `la-sucursal` ya tiene el código corregido; para pasarla al motor basta un JSON por sede |
| `c/motor-v1-respaldo.html` | **Archivar** (borrar en 1–2 meses si nada falla) | Motor antiguo |
| `c/contacto-iberlax.vcf`, `contacto-ruizmazo.vcf`, `dra-lisbeth…vcf` | **Mantener** | Tarjetas reales referenciadas por sus clientes |
| `c/spn-vcard.vcf` | **Revisar** | Teléfonos distintos y Gmail personal; ya no se usa |
| `docs/historico/*` | **Archivo** | Documentos de la v1 |
| `art/*.png` (3,4 MB ×2), `v/demo/ambiente2.mp3` (7,3 MB), `la-sucursal/ambiente.mp3` (6,1 MB), `track-fondo.mp3` (4,5 MB), `*-real.png` (0,2–1 MB) | **Optimizar** | Pesan mucho para un móvil con datos. Comprimir (WebP/MP3 a 96 kbps) reduciría la carga ~80 % sin cambiar nada visible |
| `logo.png` repetido en 6 carpetas (96 KB cada uno) | Baja prioridad | Duplicados del logo de Studio 42 |
| `README.md` (tenía 1 línea) | ✅ Reescrito | |

## Decisiones que te tocan a ti
1. **¿Repositorio público o privado?** Ver `RESENAS-Y-CUMPLIMIENTO.md`. Recomendado: privado.
2. **¿Se retira el modelo antiguo de música de fondo?** Ver `PENDIENTES-DE-CONFIRMAR.md`.
3. **Lista de closers** (`CLOSERS`) para que solo ellos puedan generar demos.
4. **Segunda fase opcional:** módulo de fechas (calculadora gestacional / recordatorios), cuadro de mando de reseñas, enlace de pago por cliente.
