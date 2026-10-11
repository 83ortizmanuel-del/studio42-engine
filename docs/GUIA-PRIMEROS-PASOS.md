# Guía de primeros pasos (sin tecnicismos)

Esta guía te lleva de la mano. **Haz los pasos en orden.** Si algún texto de pantalla es un poco distinto al que pone aquí (Google y GitHub cambian los menús a menudo), busca el que más se parezca.

> **Regla de oro:** las claves (token de GitHub, clave de Gemini) **no se pegan nunca** en un chat, en un correo ni en un archivo del repositorio. Solo van en el sitio que se indica en el Paso 3.

**Tiempo total:** unos 30–40 minutos, una sola vez. Después, cada diagnóstico es: rellenar → enviar → esperar.

---

## Paso 1 · Subir los cambios a GitHub

Todo el trabajo está preparado en una rama llamada `motor-v2` (una "copia de trabajo" que **no toca** tu web hasta que tú lo apruebes). Hay dos formas de subirla. Elige **una**.

### Forma A (recomendada): me das permiso y lo subo yo
1. Entra en <https://github.com/apps/claude/installations/select_target>
2. Elige tu cuenta `83ortizmanuel-del` → **Only select repositories** → marca `studio42-engine` → **Install**.
3. Dime "listo". Subo la rama y abro un *Pull Request* (una propuesta de cambios).
4. En GitHub entra en la pestaña **Pull requests**, abre la propuesta, revisa que los tests salgan en verde (✔) y pulsa **Merge pull request** → **Confirm merge**. Esto es lo que publica los cambios.

### Forma B: subirlo tú a mano
1. Descomprime `studio42-engine-v2-cambios.zip`.
2. En GitHub, entra en tu repositorio → **Add file** → **Upload files**. Arrastra el *contenido* de la carpeta descomprimida (no la carpeta en sí) para que se respeten las subcarpetas. Escribe un título abajo ("Motor v2") y pulsa **Commit changes**.
3. **Borrar lo que ya no se usa.** Dentro de GitHub, abre cada archivo de la lista de abajo → icono de papelera (🗑) → **Commit changes**. (Si prefieres, no los borres: no estorban, solo están desordenados en la raíz).

| Qué | Archivo |
|---|---|
| **Sustituir** | `c/index.html` (el motor nuevo) |
| **Sustituir** | los 9 `c/*.json` de clientes |
| **Sustituir** | `v/closer/index.html` (formulario nuevo) |
| **Añadir** | `schema.json`, `.github/workflows/validar-json.yml`, `apps-script/Code.gs`, `tests/`, `docs/`, `README.md`, `_redirects`, `.gitignore`, `c/motor-v1-respaldo.html`, `c/contacto-iberlax.vcf` |
| **Borrar** (están ya copiados en `docs/historico/`) | los 8 documentos sueltos de la raíz (los de nombre largo con `*`, `MANIFIESTO…`, `RENTABILIDAD…`, `PROCEDIMIENTO…`, `PROMPT MAESTRO…`, `Studio42 Engine \| Arquitectura…`, `promt-art`, `promt-anime-art`) y `c/contacto.vcf` |

> No borres ni muevas `AFRICARS`, `Alejo`, `art`, `la-sucursal`, `talent`, `vault`, `v/aura`, `v/demo`…: pueden estar grabadas en llaveros reales.

**Comprobación:** espera ~1 minuto y abre en el móvil `https://studio42.es/c/?cod=ankara-kebab&debug=1`. Debe verse el menú y, abajo, el panel "Sin avisos. Configuración correcta."

---

## Paso 2 · Crear las dos claves

### 2.1 Clave de Gemini (la IA)
1. Abre <https://aistudio.google.com/apikey> con tu cuenta de Google.
2. **Create API key** → elige un proyecto (o crea uno) → copia la clave (empieza por `AIza…`). Déjala en un bloc de notas un momento.

### 2.2 Token de GitHub (permiso para guardar archivos)
1. GitHub → tu foto (arriba a la derecha) → **Settings** → abajo del todo **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. *Token name:* `studio42-apps-script`. *Expiration:* 1 año (apunta la fecha en el calendario para renovarlo).
3. *Repository access:* **Only select repositories** → `studio42-engine`.
4. *Permissions* → **Repository permissions** → **Contents** → **Read and write**. (Nada más.)
5. **Generate token** → cópialo (empieza por `github_pat_…`). Solo se muestra una vez.

---

## Paso 3 · Instalar el script en tu Google Sheet

1. Abre el Google Sheet que ya usas para el diagnóstico.
2. Menú **Extensiones → Apps Script**.
3. A la izquierda verás un archivo (`Código.gs` o `Code.gs`). **Borra todo su contenido** y pega el contenido de `apps-script/Code.gs` (ábrelo en GitHub → botón "Copy raw file"). Pulsa 💾 **Guardar**.
4. Rueda dentada ⚙ (**Configuración del proyecto**) → baja hasta **Propiedades de la secuencia de comandos** → **Añadir propiedad de la secuencia de comandos**. Crea estas tres (nombre exacto en mayúsculas):

   | Propiedad | Valor |
   |---|---|
   | `GITHUB_TOKEN` | el token del 2.2 |
   | `GEMINI_API_KEY` | la clave del 2.1 |
   | `CLOSERS` | los códigos de tus closers separados por coma, por ejemplo `MO001,MEL001` (usa los que de verdad pongas en `?cod=` del formulario) |

   Guarda las propiedades.
5. Vuelve al editor (`<>`). Arriba, en el desplegable de funciones, elige **`PROBAR_CONFIGURACION`** y pulsa **▶ Ejecutar**.
   - Te pedirá permisos: **Revisar permisos** → tu cuenta → **Avanzado** → **Ir a (nombre del proyecto) (no seguro)** → **Permitir**. (Es normal: es *tu* propio script.)
   - Abajo, en el *Registro de ejecución*, deben salir líneas con ✔: GitHub responde, permiso de escritura **sí**, Gemini responde.
   - Si sale ✘, copia ese mensaje y pregúntame; **no** pegues las claves.

---

## Paso 4 · Publicar el script (la dirección a la que escribe el formulario)

1. Arriba a la derecha: **Implementar → Administrar implementaciones**.
2. **Si ya hay una implementación** (la de tu sistema anterior): pulsa el lápiz ✏ → *Versión:* **Nueva versión** → **Implementar**. La dirección **no cambia**, así que el formulario ya apunta a ella.
3. **Si no hay ninguna:** **Implementar → Nueva implementación** → engranaje ⚙ → **Aplicación web** → *Ejecutar como:* **Yo** → *Quién tiene acceso:* **Cualquier usuario** → **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`). Ábrela en `v/closer/index.html` (en GitHub, lápiz ✏) y pega esa URL en la línea `const SCRIPT_URL = "…";`.

> Cada vez que cambies algo en `Code.gs` hay que repetir el punto 2 ("Nueva versión"), si no el formulario sigue usando la versión vieja.

---

## Paso 5 · Prueba con un negocio inventado

1. En el móvil abre `https://studio42.es/v/closer/?cod=MO001`.
2. Rellena: *Nombre:* `Prueba Test 01` · *Sector:* el que quieras · marca 1–2 fricciones · *WhatsApp:* **tu propio número** · (el enlace de Google puedes dejarlo vacío) → **Registrar Diagnóstico**.
3. Verás tres pasos que se van marcando con ✓. En 10–40 segundos aparece **👉 Ver interfaz en vivo**. Ábrela: tiene que mostrar botones a medida para las fricciones que marcaste y, al final, los dos botones de opinión.
4. Mira el Sheet: debe haber una pestaña nueva **Diagnósticos** con una fila (estado `PUBLICADO`).
5. Para borrar la prueba: en GitHub abre `c/prueba-test-01.json` → papelera 🗑 → Commit.

---

## Cómo trabaja el Closer (día a día)

1. Abre su enlace (`studio42.es/v/closer/?cod=SU-CÓDIGO`). Conviene guardarlo en el inicio del móvil.
2. En el local: nombre, sector, **marca las fricciones que ha visto** y, en el recuadro de texto, añade con sus palabras lo que haya observado (cuanto más concreto, mejores botones).
3. Pide al dueño: **WhatsApp**, **Instagram**, y el **enlace de reseñas de Google** (Perfil de empresa → *Pedir reseñas* → copiar enlace). Sin ese último enlace, el botón de Google se oculta y solo queda el comentario privado.
4. **Registrar Diagnóstico** → esperar → **Ver interfaz en vivo** → enseñársela al dueño en su móvil.
5. Si el cliente firma: **Copiar enlace** y grabarlo en el llavero/stand NFC.

**Si aparece un aviso amarillo** (por ejemplo "el enlace de Google es la portada de Maps"), corrígelo con el dueño y vuelve a enviar con el mismo nombre: la demo se actualiza, no se duplica.

## Qué hacer si algo falla

| Síntoma | Qué significa | Qué hacer |
|---|---|---|
| "Código de Closer no autorizado" | El código no está en `CLOSERS` | Añádelo en el Paso 3.4 |
| "Ya existe un cliente real llamado…" | Ese nombre coincide con un cliente ya entregado (protección para no pisarlo) | Cambia el nombre (añade la ciudad) |
| "GitHub: el token no tiene permiso" | Token mal creado o caducado | Repite el 2.2 y pégalo de nuevo en `GITHUB_TOKEN` |
| Se publicó la "interfaz básica" y avisa de Gemini | La IA falló esa vez (cuota, modelo cambiado…) | Reenvía; si persiste, ejecuta `PROBAR_CONFIGURACION` y mira el mensaje de Gemini |
| "No hemos podido confirmar la publicación" | El navegador no pudo leer la respuesta o Netlify tarda | Pulsa **Reintentar** (no duplica nada) y mira la pestaña *Diagnósticos* del Sheet |
| El logo no sale | Se envió un enlace de Drive/Dropbox (no se pueden mostrar) | Sube el logo al repo (carpeta `c/`) y pon su nombre en el JSON, o usa un enlace directo a la imagen |

Para ver errores técnicos: Apps Script → icono **Ejecuciones** (a la izquierda).

## Mantenimiento

- **Renovar el token de GitHub** antes de que caduque (Paso 2.2 y actualizar `GITHUB_TOKEN`).
- **Si Google retira el modelo de Gemini**, aparecerá "interfaz básica" siempre. Solución: en AI Studio mira el nombre del modelo actual y crea la propiedad `GEMINI_MODELO` con ese nombre (por defecto usa `gemini-2.5-flash`).
- **Cambiar el estilo de la IA** (por ejemplo "usa siempre tono más formal"): propiedad `PROMPT_EXTRA`. Más en `docs/GEMINI-PROMPT.md`.
