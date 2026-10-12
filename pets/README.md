# Studio 42 · Pet Pass

Chapa NFC para el collar con la ficha de la mascota. **Nace en blanco**: el veterinario (o la familia) la activa al escanearla, rellena la ficha en 2 minutos y elige un PIN. A partir de ahí queda **bloqueada**: cualquiera que la escanee la lee y puede llamar a la familia, pero solo con el PIN se edita.

## Enlaces
- Chapa demo ya activada: `studio42.es/pets/?id=demo` (PIN `1234`)
- Chapa demo en blanco (ver cómo se activa): `studio42.es/pets/?id=nueva`
- Chapa real: `studio42.es/pets/?id=<código>` (el código lo crea Studio 42)
- Venta a clínicas y peluquerías: `studio42.es/pets/clinicas/`

Las dos demos guardan los datos solo en el navegador. Las chapas reales guardan en el servidor.

## Cómo crear chapas (Studio 42)
1. En el Google Sheet → Extensiones → Apps Script, abre `CREAR_CHAPAS_PET`.
2. Cambia `CANTIDAD` y `ENTREGADA_POR` (nombre de la clínica, o vacío).
3. Ejecuta ▶. En la pestaña **PetPass** aparecen los códigos y sus URL.
4. Graba cada URL en una chapa NFC (app NFC Tools, «Escribir → URL»).

Si un dueño olvida el PIN: comprueba que es el dueño, pon el código en `RESETEAR_PIN_PET` y ejecuta. La ficha se conserva y la próxima persona que pulse «Editar ficha» elige un PIN nuevo.

## Seguridad
- El PIN nunca se publica: se guarda cifrado (con sal) en la pestaña PetPass.
- 5 PIN incorrectos bloquean esa chapa 15 minutos.
- Solo se pueden activar chapas creadas por Studio 42 (códigos aleatorios).
- El servidor filtra los campos y quita HTML antes de publicar `pets/<código>.json`.
- La ficha (incluido el teléfono de la familia) es pública a propósito: es lo que permite que quien encuentre al animal llame. Mientras el repositorio sea público, también se ve en GitHub.

## Requisitos
Usa el mismo Apps Script que el Closer, con `GITHUB_TOKEN` configurado. Tras pegar el `Code.gs` nuevo hay que publicar una **Nueva versión** (Implementar → Administrar implementaciones).
