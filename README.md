# Studio 42 Engine

Motor *phygital* de Studio 42: un llavero, stand o tarjeta NFC abre una mini-app web en el móvil del cliente de un comercio local — contacto, WhatsApp, herramientas a medida y captación de reseñas — **sin app que instalar**.

```
 Closer (móvil)                Apps Script                 GitHub                 GitHub Pages
┌──────────────┐  diagnóstico ┌───────────────┐   c/slug   ┌────────┐  publica   ┌────────────────────────┐
│ /v/closer/   │ ───────────▶ │  Code.gs      │ ─────────▶ │  repo  │ ─────────▶ │ studio42.es/c/?cod=slug│
│ formulario   │              │ Claude + Maps │   .json    └────────┘            └────────────────────────┘
└──────┬───────┘              └───────────────┘                                          ▲
       └──────────── espera a que aparezca la interfaz y muestra el botón "Ver en vivo" ──┘
```

## Qué hay en cada carpeta

| Ruta | Para qué sirve | ¿Se toca? |
|---|---|---|
| `c/index.html` | **El motor.** Un solo HTML para todos los clientes. Lee `c/<slug>.json` y pinta los botones. | Solo para mejorar el motor |
| `c/<slug>.json` | Un archivo por cliente (todos los datos y botones). | Sí, para editar un cliente |
| `c/motor-v1-respaldo.html` | Motor antiguo, por si hiciera falta volver atrás. | No |
| `schema.json` | Reglas que debe cumplir cada JSON. GitHub las comprueba solo (`.github/workflows`). | No |
| `v/closer/` | Formulario del Closer (`studio42.es/v/closer/?cod=MO001`). | Solo la URL del script |
| `v/expositor/` | Arte para imprimir de cada pieza (expositor 148×105 mm, pegatina de mesa 80×80 mm) con su QR. Se abre con el botón «Arte» del pedido. | Solo para cambiar el diseño |
| `apps-script/Code.gs` | El "cerebro" automático (Claude + Google Maps + GitHub). Se copia a Google Apps Script. | Sí, si cambia el prompt |
| `tests/` | Pruebas automáticas (ver abajo). | No |
| `docs/` | Guías. Empieza por **`docs/GUIA-PRIMEROS-PASOS.md`**. | — |
| `AFRICARS/ Alejo/ art/ la-sucursal/ talent/ vault/ v/aura… v/demo` | Páginas sueltas de clientes/demos que ya existen. **No mover ni renombrar**: sus URLs pueden estar grabadas en llaveros NFC. | No |

## La URL de un cliente

`https://studio42.es/c/?cod=<slug>` — el `slug` es el nombre del archivo sin `.json`.
Parámetros opcionales: `&k=<código-llavero>` (identifica la pieza; el QR impreso de un expositor lleva `-QR` al final, p. ej. `MOSTRADOR-QR`, para medirlo aparte del chip), `&mesa=<n>`, `&debug=1` (muestra avisos de configuración).
**Las URLs grabadas en llaveros NFC no cambian nunca.**

## Los botones (resumen)

`enlace · whatsapp · vcard · llaves · bizum · reserva_cita · parking · asistente · calculadora · info · asistencia_ruta · opinion`
Descripción y ejemplos de cada uno en [`docs/CATALOGO-BOTONES.md`](docs/CATALOGO-BOTONES.md).

## Reseñas: política de la casa

El bloque `opinion` muestra **dos botones idénticos** (Google / comentario privado). No hay estrellas ni filtro por nota, y nunca se ofrece nada a cambio de una reseña. Detalle y motivos en [`docs/RESENAS-Y-CUMPLIMIENTO.md`](docs/RESENAS-Y-CUMPLIMIENTO.md).

## Pruebas

```bash
pip install playwright jsonschema        # una vez
python3 tests/validar_json.py            # ¿cumple cada c/*.json el esquema?
python3 tests/probar_clientes.py         # abre cada cliente en un navegador real y pulsa todos los botones
python3 tests/probar_reglas.py           # los asistentes de Iberlax dan los mismos resultados que el motor antiguo
node    tests/probar_appsscript.js       # Code.gs con Google Maps/GitHub/Claude simulados (filtros de seguridad incluidos)
python3 tests/probar_closer_e2e.py       # recorrido completo: formulario → script → JSON → interfaz
python3 tests/probar_expositor.py        # el QR del arte se lee con cámara y abre el enlace exacto de la pieza
```

## Más documentación

- [`docs/GUIA-PRIMEROS-PASOS.md`](docs/GUIA-PRIMEROS-PASOS.md) — puesta en marcha paso a paso y operación diaria del Closer
- [`docs/CATALOGO-BOTONES.md`](docs/CATALOGO-BOTONES.md) — qué hace cada tipo de botón y cómo escribirlo
- [`docs/CLAUDE-PROMPT.md`](docs/CLAUDE-PROMPT.md) — cómo piensa la IA (Claude) y cómo ajustarla
- [`docs/RESENAS-Y-CUMPLIMIENTO.md`](docs/RESENAS-Y-CUMPLIMIENTO.md) — reseñas, RGPD y límites
- [`docs/AUDITORIA-REPO.md`](docs/AUDITORIA-REPO.md) — qué se encontró, qué se cambió y qué queda por decidir
- [`docs/PENDIENTES-DE-CONFIRMAR.md`](docs/PENDIENTES-DE-CONFIRMAR.md) — datos de clientes que hay que confirmar
- `docs/historico/` — documentos de la versión 1 (conservados, obsoletos)
