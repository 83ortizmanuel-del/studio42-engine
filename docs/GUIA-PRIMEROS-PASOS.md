# Guía de primeros pasos (sin tecnicismos) · versión 3: Claude + Google Maps

Esta guía te lleva de la mano. **Haz los pasos en orden.** Si algún texto de pantalla es un poco distinto al que pone aquí (Google, GitHub y Anthropic cambian los menús a menudo), busca el que más se parezca.

> **Regla de oro:** las claves (token de GitHub, clave de Claude, clave de Google Maps) **no se pegan nunca** en un chat, en un correo, en un WhatsApp ni en un archivo del repositorio. Solo van en el sitio que se indica en el Paso 3 (*Propiedades de la secuencia de comandos* de Apps Script). Si alguna vez se te escapa una, **bórrala y crea otra** (Paso 0).

**Tiempo total:** unos 30–40 minutos, una sola vez. Después, cada diagnóstico es: buscar el negocio → rellenar → enviar → esperar.

---

## Cómo funciona ahora (en 5 líneas)

1. El Closer escribe el nombre del comercio en el **buscador de Google Maps** del formulario y lo elige.
2. El sistema obtiene el **Place ID** (el "identificador" del negocio en Google) y sus datos reales: teléfono, web, dirección, horario.
3. **Claude** lee las fricciones que contó el Closer y diseña de 3 a 5 botones a medida para ese tipo de comercio.
4. El sistema guarda el JSON en GitHub y GitHub Pages lo publica en `studio42.es/c/?cod=<negocio>`.
5. El botón de Google de esa interfaz abre **directamente la ventana de valoración** del negocio (con las estrellas a la vista). Junto a él siempre hay otro botón igual de visible para hablar con la gerencia.

---

## Paso 0 · Anular cualquier token que se haya pegado en un chat (IMPORTANTE)

Un token que se ha escrito en un chat **ya no es secreto**: cualquiera que lo viera podría escribir en tu repositorio. Hay que anularlo y crear uno nuevo.

1. GitHub → tu foto (arriba a la derecha) → **Settings** → abajo del todo **Developer settings** → **Personal access tokens**.
2. Mira en **Tokens (classic)** y en **Fine-grained tokens**: busca el token que se pegó en el chat (los «classic» empiezan por `ghp_`) → **Delete** (o *Revoke*). Confirma.
3. Crea el nuevo (Paso 2.2). Ese **no** lo pegues en ningún chat.

---

## Paso 1 · Los cambios ya están en GitHub

Si estás leyendo esto en tu repositorio, los cambios ya están publicados (se aprueban con un *Pull Request*). Comprobación: abre en el móvil `https://studio42.es/c/?cod=ankara-kebab&debug=1`. Debe verse el menú y, abajo, el panel "Sin avisos. Configuración correcta."

---

## Paso 2 · Crear las tres claves

### 2.1 Clave de Claude (la IA)
1. Entra en <https://console.anthropic.com> con tu correo y crea la cuenta.
2. Menú **Billing** (facturación) → añade una tarjeta y algo de saldo (con unos pocos euros salen cientos de diagnósticos; cada uno cuesta céntimos).
3. Menú **API Keys** → **Create Key** → nombre `studio42-diagnostico` → copia la clave (empieza por `sk-ant-…`). Solo se muestra una vez; déjala en un bloc de notas un momento.

> Ojo: tener una suscripción a Claude (la de chat) **no** vale para esto. La API es aparte y se paga por uso.

### 2.2 Token de GitHub (permiso para guardar archivos)
1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. *Token name:* `studio42-apps-script`. *Expiration:* 1 año (apunta la fecha en el calendario).
3. *Repository access:* **Only select repositories** → `studio42-engine`.
4. *Permissions* → **Repository permissions** → **Contents** → **Read and write**. (Nada más.)
5. **Generate token** → cópialo (empieza por `github_pat_…`). Solo se muestra una vez.

### 2.3 Clave de Google Maps (el buscador de negocios)
1. Entra en <https://console.cloud.google.com> con tu cuenta de Google. Arriba, selecciona o crea un **proyecto** (por ejemplo `studio42`).
2. Menú ☰ → **Facturación** → vincula una cuenta de facturación (Google lo exige aunque tiene una cuota gratuita mensual; revisa los precios actuales de *Places API* y pon un **presupuesto/alerta** de unos pocos euros para dormir tranquilo).
3. Menú ☰ → **APIs y servicios** → **Biblioteca** → busca **Places API (New)** → **Habilitar**.
4. **APIs y servicios → Credenciales → Crear credenciales → Clave de API**. Cópiala (empieza por `AIza…`).
5. Pulsa la clave → **Restricciones de la API** → *Restringir clave* → marca solo **Places API (New)** → Guardar.

> Sin esta clave todo sigue funcionando, pero el buscador de Maps no aparece operativo y el Closer tiene que rellenar los datos a mano (y pegar el enlace de reseñas).

---

## Paso 3 · Instalar el script en tu Google Sheet

1. Abre el Google Sheet que ya usas para el diagnóstico.
2. Menú **Extensiones → Apps Script**.
3. A la izquierda verás un archivo (`Código.gs` o `Code.gs`). **Borra todo su contenido** y pega el contenido de `apps-script/Code.gs` (ábrelo en GitHub → botón "Copy raw file"). Pulsa 💾 **Guardar**.
4. Rueda dentada ⚙ (**Configuración del proyecto**) → baja hasta **Propiedades de la secuencia de comandos** → **Añadir propiedad de la secuencia de comandos**. Crea estas (nombre exacto, en mayúsculas):

   | Propiedad | Valor |
   |---|---|
   | `GITHUB_TOKEN` | el token **nuevo** del 2.2 |
   | `ANTHROPIC_API_KEY` | la clave del 2.1 |
   | `GOOGLE_MAPS_API_KEY` | la clave del 2.3 |
   | `CLOSERS` | los códigos de tus closers separados por coma, por ejemplo `MO001,MEL001` (los mismos que pongas en `?cod=` del formulario) |
   | `PANEL_CLAVE` | la contraseña para entrar en tu panel de control (`studio42.es/panel/`). Mínimo 6 caracteres; que no sea la de tu correo |

   Guarda las propiedades.
5. Vuelve al editor (`<>`). Arriba, en el desplegable de funciones, elige **`PROBAR_CONFIGURACION`** y pulsa **▶ Ejecutar**.
   - Te pedirá permisos: **Revisar permisos** → tu cuenta → **Avanzado** → **Ir a (nombre del proyecto) (no seguro)** → **Permitir**. (Es normal: es *tu* propio script.)
   - Abajo, en el *Registro de ejecución*, deben salir líneas con ✔: GitHub responde (permiso de escritura **sí**), Claude responde, Google Maps responde.
   - Si sale ✘, copia ese mensaje y pregúntame; **no** pegues las claves.

---

## Paso 4 · Publicar el script (la dirección a la que escribe el formulario)

1. Arriba a la derecha: **Implementar → Administrar implementaciones**.
2. **Si ya hay una implementación** (la de tu sistema anterior): pulsa el lápiz ✏ → *Versión:* **Nueva versión** → **Implementar**. La dirección **no cambia**, así que el formulario ya apunta a ella.
3. **Si no hay ninguna:** **Implementar → Nueva implementación** → engranaje ⚙ → **Aplicación web** → *Ejecutar como:* **Yo** → *Quién tiene acceso:* **Cualquier usuario** → **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`). Ábrela en `v/closer/index.html` (en GitHub, lápiz ✏) y pega esa URL en la línea `const SCRIPT_URL = "…";`.

> Cada vez que cambies algo en `Code.gs` hay que repetir el punto 2 ("Nueva versión"), si no el formulario sigue usando la versión vieja.

---

## Paso 5 · Prueba con un negocio real (el tuyo o uno conocido)

1. En el móvil abre `https://studio42.es/v/closer/?cod=MO001`.
2. En **① Busca el negocio en Google Maps** escribe nombre + ciudad → **Buscar** → toca el resultado correcto. Se rellenan nombre, sector, web y (si es móvil) WhatsApp.
3. Comprueba el **WhatsApp** (pon **tu propio número** en la prueba) → marca 1–2 fricciones → **Registrar Diagnóstico**.
4. En 10–40 segundos aparece **👉 Ver interfaz en vivo**. Ábrela: botones a medida, "Llamar ahora", "Cómo llegar", "Horario" y, abajo, los dos botones de opinión.
5. Toca **Dejar mi opinión en Google**: debe abrirse la ventana de valoración **de ese negocio**, lista para elegir las estrellas.
6. Mira el Sheet: pestaña **Diagnósticos** con una fila (estado `PUBLICADO`).
7. Para borrar la prueba: en GitHub abre `c/<nombre>.json` → papelera 🗑 → Commit.

---

## Cómo trabaja el Closer (día a día)

1. Abre su enlace (`studio42.es/v/closer/?cod=SU-CÓDIGO`). Conviene guardarlo en el inicio del móvil.
2. En el local: **busca el comercio en Maps** y elígelo; revisa el sector; **marca las fricciones que ha visto** y, en el recuadro, añade con sus palabras lo que haya observado (cuanto más concreto, mejores botones).
3. Pide al dueño: **WhatsApp** (si el de Maps es un fijo, no sirve para WhatsApp), **Instagram** y, si quiere, Bizum.
4. **Registrar Diagnóstico** → esperar → **Ver interfaz en vivo** → enseñársela al dueño en su móvil.
5. Si el cliente firma: **Copiar enlace** y grabarlo en el llavero/stand NFC.

**Si no aparece el negocio en el buscador:** pruébalo con nombre + ciudad; si sigue sin salir, rellena a mano y pega el enlace de reseñas (Perfil de empresa → *Pedir reseñas*).

**Si aparece un aviso amarillo**, léelo con el dueño y vuelve a enviar con el mismo nombre: la demo se actualiza, no se duplica.

## Equipo de Closers (tarjeta en el lanyard)

**Cada Closer = un código.** El código va en su enlace: `https://studio42.es/v/closer/?cod=CÓDIGO` (por ejemplo `MO001`, `MEL042`). Con ese enlace la app sabe quién vende y cada pedido queda a su nombre.

**Dar de alta a un Closer nuevo:**
1. Inventa su código: letras y números, sin espacios ni tildes (`ANA007`).
2. Apps Script → ⚙️ → Propiedades → `CLOSERS` → añádelo al final separado por coma → Guardar. (No hace falta volver a implementar.)
3. Graba su tarjeta NFC con NFC Tools → Escribir → URL → `https://studio42.es/v/closer/?cod=ANA007`. Bloquéala (NFC Tools → Otros → Bloquear etiqueta) para que nadie la reescriba.
4. Pídele que, la primera vez, acerque el móvil a su tarjeta y pulse **Añadir a pantalla de inicio**.

**Dar de baja:** quita su código de `CLOSERS`. Su tarjeta deja de servir al momento; sus pedidos antiguos siguen en el panel.

> El código es una identificación, no una contraseña: quien tenga la tarjeta puede usar la app. Si un Closer pierde la tarjeta, cámbiale el código.

**Tú como director:** el panel (`studio42.es/panel/`) se actualiza solo cada 45 segundos y al volver a abrirlo. Cuando entra un pedido suena un aviso 🔔 y aparece marcado. Arriba de los pedidos ves a cada Closer con sus ventas del mes; toca uno para ver solo los suyos. Además te llega un **email por cada pedido** (al correo dueño del script, o al que pongas en la propiedad `AVISO_EMAIL`; `0` para desactivarlo).

## Qué hacer si algo falla

| Síntoma | Qué significa | Qué hacer |
|---|---|---|
| "Código de Closer no autorizado" | El código no está en `CLOSERS` | Añádelo en el Paso 3.4 |
| "Ya existe un cliente real llamado…" | Ese nombre coincide con un cliente ya entregado (protección para no pisarlo) | Cambia el nombre (añade la ciudad) |
| "GitHub: el token no tiene permiso" | Token mal creado, revocado o caducado | Repite el 2.2 y pégalo de nuevo en `GITHUB_TOKEN` |
| El buscador dice "no está configurado" o "Google Maps no respondió" | Falta `GOOGLE_MAPS_API_KEY`, la facturación, o no está activada *Places API (New)* | Repite el 2.3 y ejecuta `PROBAR_CONFIGURACION` |
| Se publicó el "paquete base" y avisa de Claude | La IA falló esa vez (saldo agotado, clave mal, modelo retirado) | Mira saldo en console.anthropic.com; ejecuta `PROBAR_CONFIGURACION`; reenvía |
| "No hemos podido confirmar la publicación" | El navegador no pudo leer la respuesta o GitHub Pages tarda | Pulsa **Reintentar** (no duplica nada) y mira la pestaña *Diagnósticos* del Sheet |
| El logo no sale | Se envió un enlace de Drive/Dropbox (no se pueden mostrar) | Sube el logo al repo (carpeta `c/`) o usa un enlace directo a la imagen |

Para ver errores técnicos: Apps Script → icono **Ejecuciones** (a la izquierda).

## Mantenimiento

- **Renovar el token de GitHub** antes de que caduque (Paso 2.2 y actualizar `GITHUB_TOKEN`).
- **Vigilar el saldo de Anthropic y el gasto de Google Maps** (alertas de presupuesto).
- **Si Anthropic retira el modelo**, aparecerá "paquete base" siempre. Crea la propiedad `CLAUDE_MODELO` con el nombre del modelo actual (por defecto `claude-sonnet-5-5`).
- **Cambiar el estilo de la IA** (por ejemplo "usa siempre tono más formal"): propiedad `PROMPT_EXTRA`. Más en `docs/CLAUDE-PROMPT.md`.
- **Hosting:** la web se sirve con **GitHub Pages** (no Netlify). Todo lo que hay en el repositorio es público mientras el repo lo sea (ver `docs/RESENAS-Y-CUMPLIMIENTO.md`).

## Pet Pass (chapas para mascotas)

1. Pega el `Code.gs` nuevo y publica **Nueva versión** (Paso 4). Usa el mismo `GITHUB_TOKEN`.
2. En Apps Script elige **`CREAR_CHAPAS_PET`**, cambia `CANTIDAD` y `ENTREGADA_POR` (por ejemplo el nombre de la clínica) y pulsa ▶.
3. Abre la pestaña **PetPass** del Sheet: cada fila es una chapa con su URL. Grábala en la chapa con la app NFC Tools (Escribir → URL).
4. Entrega las chapas. Al escanear una chapa nueva sale «Activar ahora»: se rellena la ficha, se elige un PIN y queda bloqueada.
5. ¿Alguien olvidó el PIN? Usa **`RESETEAR_PIN_PET`** con el código de la chapa.

Más detalles en `pets/README.md`.

## Pedidos y panel de control

**Pedido en la visita (Closer):** cuando aparece «¡Interfaz lista!», pulsa **🛒 Preparar el pedido**. Elige el pack, ajusta las piezas con + y − (no se puede bajar de lo que incluye el pack; lo que pase de ahí se cobra por unidad) y marca la promo si aplica. **Revisar pedido** → **Confirmar pedido**. Aparece la lista de enlaces para grabar cada pieza con NFC Tools: cada llavero tiene su propio código (`&k=L01`, `L02`…), así sabes desde qué pieza entra cada cliente. El pedido queda en la pestaña **Pedidos** del Sheet como «Por despachar».

> Los precios están en `Code.gs` (bloque `CATALOGO`) y en el formulario. El total que vale es el del servidor. Si cambias un precio, cámbialo en los dos sitios (una prueba automática avisa si no coinciden).

**Panel (`studio42.es/panel/`):** entra con tu `PANEL_CLAVE` desde el móvil (puedes añadirlo a la pantalla de inicio). Tienes:
- **Pedidos**: los pendientes arriba; tócalos para ver el detalle, copiar los enlaces NFC y cambiar el estado (Por despachar → Grabado → Entregado → Cobrado).
- **Clientes**: todas las landings con vista previa en un móvil. **✨ Pedir un cambio a Claude**: escríbelo con tus palabras, Claude prepara la propuesta, la ves en la vista previa (marcada «sin publicar») y solo cuando pulsas **Publicar en la web** se guarda. Si algo no encaja, **Descartar**.
- **Pet Pass**: las chapas de cada clínica y cuáles están activadas.
- **Nuevo**: abre el formulario del Closer (con tu código) para dar de alta un cliente.

Para verlo sin configurar nada: `studio42.es/panel/?demo=1` (datos de ejemplo, no guarda nada).

## Suscripciones (Ecosistema Activo) y cobro con Stripe

**Precios:** Esencial 19 €, Pro 39 €, Multi-sede 79 € (+29 €/sede), Pet Pass Clínica 29 € al mes + IVA. Trimestral −5 %, anual = 10 meses. Cada pack incluye meses gratis: Prueba 1, Imán 2, Multiplicador 3, Dominio 6. Se cambian en `Code.gs` (bloque `CATALOGO`) y en el formulario del Closer (una prueba avisa si no coinciden).

**Antes de cobrar de verdad:** alta de autónomo (Hacienda 036 + Seguridad Social con tarifa plana) y cuenta de Stripe activada como autónomo. Mientras tanto se puede montar y probar todo en **modo prueba** de Stripe.

1. Stripe → Desarrolladores → Claves API → copia la **clave secreta** (`sk_test_…` en modo prueba). Pégala en Apps Script como propiedad `STRIPE_SECRET_KEY`. Nunca en un chat.
2. En Stripe → Configuración → Pagos, activa **Adeudo directo SEPA** además de tarjeta.
3. Stripe → Configuración → Facturación → Suscripciones: en «si fallan todos los reintentos», elige **marcar la suscripción como no pagada** (así la landing se pausa sola).
4. En Apps Script ejecuta **CREAR_PRODUCTOS_STRIPE** (crea los 12 precios con IVA incluido) y luego **INSTALAR_AUTOMATIZACIONES** (sincroniza cada hora y envía el informe el día 1).
5. Prueba completa en modo prueba: haz un pedido desde el formulario del Closer con plan, abre el enlace de pago y paga con la tarjeta de prueba `4242 4242 4242 4242` (cualquier fecha futura y CVC). Comprueba en Stripe que se cobró la apertura y que la suscripción queda «en prueba» con los meses gratis. En una hora aparece en el panel.
6. Cuando tengas el alta: activa la cuenta en Stripe, cambia `STRIPE_SECRET_KEY` por la clave `sk_live_…`, borra la propiedad `STRIPE_PRECIOS` y vuelve a ejecutar **CREAR_PRODUCTOS_STRIPE**.

**Qué pasa solo:** si un cliente deja de pagar, Stripe reintenta y avisa; cuando la suscripción queda «no pagada» o cancelada, la landing muestra «en pausa». Al pagar, se reactiva. Desde el panel puedes pausar o reactivar a mano (una pausa manual no la deshace la sincronización). Si no quieres pausas automáticas, crea la propiedad `PAUSA_AUTOMATICA` = `0`.

**Estadísticas e informe:** cada landing cuenta de forma anónima visitas y clics (reseña, WhatsApp, llamada, ruta), por pieza. Se ven en el panel (últimos 30 días) y cada cliente con email recibe su informe el día 1. La pestaña «Eventos» del Sheet crece con el uso; cuando tengas muchos clientes conviene pasar a un servidor más potente.

