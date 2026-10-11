# Catálogo de botones

Cada botón de un `c/<slug>.json` es un objeto con un **`tipo`**. El motor elige el comportamiento **solo por el `tipo`** (nunca por el texto del nombre) y **nunca inserta HTML** del JSON: todo se escribe como texto.
Si a un botón le falta un dato imprescindible, **se omite** y el aviso aparece al abrir la página con `&debug=1`. No existen teléfonos "por defecto": un botón nunca puede escribir al número de otro negocio.

## Estructura de un cliente

```json
{
  "version": 2,
  "nombre": "PELUQUERÍA SOL & LUNA",
  "subtitulo": "Tu pelo, tu cita, sin esperas",
  "textoBadge": "AGENDA ACTIVA",
  "logo": "sol-luna-logo.png",
  "fondoLogo": "#ffffff",
  "colorPrincipal": "#0b0c10",
  "colorAcento": "#c026d3",
  "whatsapp": "https://wa.me/34600112233",
  "datosPago": { "bizum": "600112233", "concepto": "Sol y Luna" },
  "secciones": [ { "titulo": "Reserva", "botones": [ { "tipo": "whatsapp", "nombre": "…" } ] } ]
}
```

Opcionales de identidad: `tema: "industrial"`, `logoAnchoMax` (`160px` o `100%`), `logoAlto`, `paddingLogo`, `telefono`.
`logo` puede ser un archivo de la carpeta `c/` (`"logo.png"`) o un enlace `https://` directo a una imagen (no sirven los enlaces de Drive/Dropbox).
Los campos que empiezan por `_` (`_pendientes`, `_generado`, `_peticion`…) son notas internas: el motor los ignora.

Campos comunes a todos los botones: `nombre` (≤60), `descripcion` (≤120), `icono`, `colorIcono` (`#rrggbb`), `destacado` (true/false).
Iconos disponibles: `utensils alert key chat locate contact calculator bottle shield clipboard search bed truck link cross info pin clock check copy calendar phone instagram star nav gift dumbbell file facebook globe flame heart scale`.

**Huecos en mensajes** (se rellenan solos): `{negocio}`, `{mesa}`, `{llavero}`, `{nombre}`, `{referencia}`, `{numero}`, `{ubicacion}`, `{resultado}`, `{detalle}` y `{Título de cada paso}` en los asistentes.

## Tipos

| `tipo` | Qué hace | Campos propios |
|---|---|---|
| `enlace` | Abre una URL | `url` (`https:`, `tel:` o `mailto:`) — obligatorio |
| `whatsapp` | Abre WhatsApp con un mensaje escrito | `mensaje`; `numeroWhatsapp` (si no, usa el `whatsapp` del negocio) |
| `vcard` | Guarda el contacto en la agenda | `url` a un `.vcf` propio; si no hay, se **genera** con `telefono` o el WhatsApp |
| `llaves` | Aviso SOS "he encontrado unas llaves" con el código del llavero | `mensaje`, `numeroWhatsapp` |
| `bizum` | Copia el número y guía el pago | `numeroBizum` o `datosPago.bizum`; `concepto` |
| `reserva_cita` | Formulario (nombre [+ referencia de Bizum]) → WhatsApp | `titulo`, `intro`, `aviso`, `mensaje`, `numeroBizum` |
| `parking` | Guarda la posición del coche **solo en ese móvil** y luego da la ruta a pie | — |
| `asistente` | Ventana con pasos de pastillas → resultado por reglas → WhatsApp | `pasos`, `resultado`, `mensaje`, `botonTexto`, `intro`, `aviso` |
| `calculadora` | Número × factor (proteína, raciones, presupuesto…) | `campo`, `opciones`, `resultado`, `aviso` |
| `info` | Tarjetas de texto (alérgenos, fichas, guías, FAQ) | `tarjetas`, `acciones`, `intro`, `aviso` |
| `asistencia_ruta` | Busca ayuda cercana en Maps y envía mi posición GPS por WhatsApp | `busquedaMaps` (obligatorio), `mensajeGPS` |
| `opinion` | **Dos botones iguales**: opinión en Google / comentario privado | `urlGoogle`, `whatsappGerencia` |

### `asistente` — el más potente
```json
{ "tipo": "asistente", "nombre": "Reservar mi cita en 3 toques", "icono": "calendar", "destacado": true,
  "titulo": "Reserva de cita", "intro": "Elige y te confirmamos por WhatsApp.",
  "pasos": [
    { "titulo": "Servicio", "opciones": ["Corte", "Color", "Peinado"] },
    { "titulo": "Franja", "opciones": ["Mañana", "Tarde"], "defecto": "Tarde" } ],
  "resultado": { "etiqueta": "Duración orientativa",
    "reglas": [ { "si": { "Servicio": ["Color"] }, "titulo": "Reserva 2 horas", "texto": "El color necesita más tiempo." } ],
    "porDefecto": { "titulo": "Reserva 1 hora" } },
  "botonTexto": "Pedir cita por WhatsApp",
  "mensaje": "Hola {negocio}, quiero cita:\n- {Servicio}\n- {Franja}\n{resultado}" }
```
Las reglas se evalúan **en orden**; gana la primera cuyo `si` se cumple (en cada clave, vale cualquiera de las opciones listadas). Si ninguna, `porDefecto`.
Ejemplos reales: `c/iberlax.json` (diagnóstico de fatiga, test ergonómico, logística), `c/ankara-kebab.json` (configurador de menú), `c/zombie-tattoo.json` (cotizador).

### `calculadora`
```json
{ "tipo": "calculadora", "nombre": "Calculadora de Proteína", "campo": { "etiqueta": "Tu peso (kg)", "unidad": "kg", "min": 30, "max": 250 },
  "etiquetaOpciones": "Objetivo", "opciones": [ { "texto": "Mantenimiento (1.5 g/kg)", "factor": 1.5 }, { "texto": "Ganar músculo (1.8 g/kg)", "factor": 1.8 } ],
  "resultado": { "texto": "Ingesta recomendada", "unidad": "g / día", "decimales": 0 }, "aviso": "Orientativo." }
```

### `info`
```json
{ "tipo": "info", "nombre": "Guía de alérgenos", "titulo": "Alérgenos",
  "tarjetas": [ { "nivel": "aviso", "titulo": "Gluten", "texto": "Presente en pita y dürüm." },
                { "nivel": "ok", "titulo": "Vacuna", "texto": "Rabia", "items": [ { "etiqueta": "Pauta", "valor": "Anual" } ] } ],
  "acciones": [ { "texto": "Preguntar por WhatsApp", "whatsapp": true, "estilo": "whatsapp", "mensaje": "Hola {negocio}, tengo una duda." },
                { "texto": "Buscar urgencias 24h", "maps": "hospital veterinario urgencias 24 horas", "estilo": "peligro" } ] }
```
Niveles: `info`, `alerta`, `ok`, `aviso`. Los saltos de línea `\n` en `texto` se respetan (útil para listas con "• ").

### `opinion` (reseñas)
```json
{ "tipo": "opinion",
  "urlGoogle": "https://search.google.com/local/writereview?placeid=XXXX",
  "whatsappGerencia": "https://wa.me/34600112233?text=Hola%20Gerencia…" }
```
Detalle y límites en [`RESENAS-Y-CUMPLIMIENTO.md`](RESENAS-Y-CUMPLIMIENTO.md).

## Compatibilidad con la versión 1
El motor entiende los JSON antiguos: `escudoResenas`+`urlGoogleResenas` se convierten en `opinion`; `recuperar_llaves` en `llaves`; los iconos `fa-solid fa-…` conocidos se traducen. Los tipos antiguos con contenido escrito dentro del motor (`configurador_kebab`, `test_desgaste`, `guia_creatina`, `carnet_vacunacion`…) **ya no existen**: ahora su contenido vive en el JSON con `asistente`, `calculadora` o `info`. Si aparecen, el motor lo avisa en `?debug=1`.

Cualquier JSON se puede comprobar con `python3 tests/validar_json.py`; GitHub lo hace solo al subirlo.
