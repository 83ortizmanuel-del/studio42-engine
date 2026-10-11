# Cómo piensa la IA (Claude) y cómo ajustarla

El "prompt maestro" antiguo (`docs/historico/prompt-maestro-v1-OBSOLETO.md`) pedía a Gemini **todo el JSON** (hoy la IA es Claude), incluidos teléfonos, enlaces y estructura. Eso era frágil: un número inventado, una coma de más o un tipo de botón inexistente rompían la página.

## El reparto nuevo

| Lo pone… | Qué |
|---|---|
| **El formulario del Closer y Google Maps** (datos reales) | WhatsApp, Instagram/Facebook/web, **Place ID → enlace directo de reseña**, teléfono, dirección, horario, Bizum, color, logo |
| **El código** (`Code.gs`, siempre igual) | contacto, llamar, cómo llegar, horario, llavero SOS, parking, guardar contacto, bloque de reseñas, colores, estructura del JSON, paquete base de cada sector |
| **Claude** (solo lo creativo) | subtítulo, badge, título de sección y **3–5 botones a medida** (`asistente`, `calculadora`, `info`, `whatsapp`) que resuelven las fricciones contadas |

Además, **todo lo que devuelve Claude se filtra** antes de publicarse: solo tipos permitidos, sin enlaces, sin HTML, iconos de la lista, longitudes máximas, huecos `{…}` solo los conocidos, reglas que apunten a pasos que existen. Si Claude falla o responde algo inservible, se publica el **paquete base del sector** (un asistente de cita/consulta adaptado a ese tipo de comercio) y se avisa al Closer. Las fricciones que cuenta el Closer **no se publican** (solo van al Google Sheet).

## Reglas que ya lleva el prompt
- No inventar teléfonos, direcciones, horarios, **precios**, descuentos, alérgenos, dosis ni datos médicos. Si falta un dato, el botón hace que el cliente *elija* y lo envíe por WhatsApp para que el negocio responda.
- Nunca prometer premios por reseñas ni crear botones de reseñas (los añade el sistema).
- Salud/clínicas/veterinaria/nutrición: nada de diagnóstico ni consejo clínico; solo logística de cita y "ante una emergencia, 112".
- Cada botón responde a una fricción real del diagnóstico; el primero es el principal.

## Ajustes sin tocar código
En Apps Script → ⚙ Configuración → Propiedades de la secuencia de comandos:

- `PROMPT_EXTRA`: texto que se añade al final de las instrucciones. Ejemplos:
  - `Tutea al cliente final y usa un tono desenfadado.`
  - `En hostelería, el primer botón siempre debe ser para pedir/reservar.`
  - `Evita calculadoras salvo que el diagnóstico las pida expresamente.`
- `CLAUDE_MODELO`: nombre del modelo de Claude (por defecto `claude-sonnet-5-5`). Cámbialo si Anthropic lo retira.

Para cambiar las reglas de fondo, edita `construirPrompt_` en `apps-script/Code.gs` y vuelve a hacer *Implementar → Nueva versión*.

## Cómo conseguir mejores botones (consejo para el Closer)
La IA solo sabe lo que se le cuenta. Frases concretas ("la gente pregunta si hay menú sin gluten", "pierdo citas por no contestar al WhatsApp de noche") producen botones concretos. "Optimización integral" produce botones genéricos.

## Sectores
Hay 17 (ver `SECTORES` en `Code.gs` y el desplegable del formulario). Cada uno tiene: subtítulo, paquete base de respaldo y una "guía" de lo que suele necesitar ese tipo de comercio, que se le pasa a Claude junto con los tipos de la ficha de Google Maps. Para añadir un sector: una entrada en `SECTORES`, una opción en el desplegable y sus fricciones en `FRICCIONES_POR_SECTOR` (`v/closer/index.html`); `python3 tests/probar_closer_e2e.py` comprueba que coinciden.

## Reseña directa de Google
Si el Closer elige el negocio en el buscador de Maps, el botón de Google abre `https://search.google.com/local/writereview?placeid=<ID>`: **la ventana de valoración del negocio, sin pasos intermedios**. Las estrellas **no** se pueden preseleccionar (lo prohíben las normas de Google) y junto a ese botón siempre hay otro igual de visible para hablar con la gerencia. Ver `docs/RESENAS-Y-CUMPLIMIENTO.md`.
