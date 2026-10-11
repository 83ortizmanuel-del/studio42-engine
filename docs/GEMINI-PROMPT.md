# Cómo piensa la IA (Gemini) y cómo ajustarla

El "prompt maestro" antiguo (`docs/historico/prompt-maestro-v1-OBSOLETO.md`) pedía a Gemini **todo el JSON**, incluidos teléfonos, enlaces y estructura. Eso era frágil: un número inventado, una coma de más o un tipo de botón inexistente rompían la página.

## El reparto nuevo

| Lo pone… | Qué |
|---|---|
| **El formulario del Closer** (datos reales) | WhatsApp, Instagram/Facebook/web, enlace de Google, Bizum, color, logo |
| **El código** (`Code.gs`, siempre igual) | contacto, llavero SOS, parking, guardar contacto, bloque de reseñas, colores, estructura del JSON |
| **Gemini** (solo lo creativo) | subtítulo, badge, título de sección y **2–4 botones a medida** (`asistente`, `calculadora`, `info`, `whatsapp`) que resuelven las fricciones contadas |

Además, **todo lo que devuelve Gemini se filtra** antes de publicarse: solo tipos permitidos, sin enlaces, sin HTML, iconos de la lista, longitudes máximas, huecos `{…}` solo los conocidos, reglas que apunten a pasos que existen. Si Gemini falla o responde algo inservible, se publica una interfaz básica correcta y se avisa al Closer. Las fricciones que cuenta el Closer **no se publican** (solo van al Google Sheet).

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
- `GEMINI_MODELO`: nombre del modelo si el predeterminado (`gemini-2.5-flash`) deja de existir.

Para cambiar las reglas de fondo, edita `construirPrompt_` en `apps-script/Code.gs` y vuelve a hacer *Implementar → Nueva versión*.

## Cómo conseguir mejores botones (consejo para el Closer)
La IA solo sabe lo que se le cuenta. Frases concretas ("la gente pregunta si hay menú sin gluten", "pierdo citas por no contestar al WhatsApp de noche") producen botones concretos. "Optimización integral" produce botones genéricos.
