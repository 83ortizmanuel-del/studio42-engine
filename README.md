# Studio 42 Engine

Motor *phygital* de Studio 42: un llavero, stand o tarjeta NFC abre una mini-app web en el móvil del cliente de un comercio local — contacto, WhatsApp, herramientas a medida y captación de reseñas — **sin app que instalar**.

```
 Closer (móvil)                Apps Script                 GitHub                 Netlify
┌──────────────┐  diagnóstico ┌───────────────┐   c/slug   ┌────────┐  publica   ┌────────────────────────┐
│ /v/closer/   │ ───────────▶ │  Code.gs      │ ─────────▶ │  repo  │ ─────────▶ │ studio42.es/c/?cod=slug│
│ formulario   │              │  + Gemini     │   .json    └────────┘            └────────────────────────┘
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
| `apps-script/Code.gs` | El "cerebro" automático (Gemini + GitHub). Se copia a Google Apps Script. | Sí, si cambia el prompt |
| `tests/` | Pruebas automáticas (ver abajo). | No |
| `docs/` | Guías. Empieza por **`docs/GUIA-PRIMEROS-PASOS.md`**. | — |
| `AFRICARS/ Alejo/ art/ la-sucursal/ talent/ vault/ v/aura… v/demo` | Páginas sueltas de clientes/demos que ya existen. **No mover ni renombrar**: sus URLs pueden estar grabadas en llaveros NFC. | No |

## La URL de un cliente

`https://studio42.es/c/?cod=<slug>` — el `slug` es el nombre del archivo sin `.json`.
Parámetros opcionales: `&k=<código-llavero>` (identifica el llavero), `&mesa=<n>`, `&debug=1` (muestra avisos de configuración).
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
node    tests/probar_appsscript.js       # Code.gs con Google/GitHub/Gemini simulados (filtros de seguridad incluidos)
python3 tests/probar_closer_e2e.py       # recorrido completo: formulario → script → JSON → interfaz
```

## Más documentación

- [`docs/GUIA-PRIMEROS-PASOS.md`](docs/GUIA-PRIMEROS-PASOS.md) — puesta en marcha paso a paso y operación diaria del Closer
- [`docs/CATALOGO-BOTONES.md`](docs/CATALOGO-BOTONES.md) — qué hace cada tipo de botón y cómo escribirlo
- [`docs/GEMINI-PROMPT.md`](docs/GEMINI-PROMPT.md) — cómo piensa la IA y cómo ajustarla
- [`docs/RESENAS-Y-CUMPLIMIENTO.md`](docs/RESENAS-Y-CUMPLIMIENTO.md) — reseñas, RGPD y límites
- [`docs/AUDITORIA-REPO.md`](docs/AUDITORIA-REPO.md) — qué se encontró, qué se cambió y qué queda por decidir
- [`docs/PENDIENTES-DE-CONFIRMAR.md`](docs/PENDIENTES-DE-CONFIRMAR.md) — datos de clientes que hay que confirmar
- `docs/historico/` — documentos de la versión 1 (conservados, obsoletos)
