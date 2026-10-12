# Studio 42 · Pet Pass

Chapa NFC para collares con la ficha completa de la mascota: datos, dueño, veterinario, vacunas, alergias y agenda de visitas. Enfoque: cualquiera que escanee la chapa accede a la información, pero **solo el dueño** puede editarla con un PIN.

## URLs

- Demo pública: `https://studio42.es/pets/?id=demo` (PIN: `1234`)
- Ficha de un cliente real: `https://studio42.es/pets/?id=<slug>` (necesita el fichero `pets/<slug>.json` en el repo)

## Cómo funciona

1. **Vista pública (lectura).** Al escanear la chapa, se abre esta página y se muestra la ficha de la mascota. El visitante puede:
   - Llamar al dueño o escribirle por WhatsApp.
   - Compartir su ubicación GPS directamente al WhatsApp del dueño.
   - Ver alertas críticas (alergias, medicación), ficha completa, veterinario, vacunas y agenda.

2. **Panel del dueño (edición).** Un botón flotante en la esquina abre el panel. Si la ficha está bloqueada, pide un **PIN de 4 a 6 dígitos**. El PIN no se guarda nunca en texto: se almacena su **hash SHA-256** en el campo `pinHash`. Una vez desbloqueado, el dueño:
   - Edita los datos de la mascota, el dueño y el veterinario.
   - Añade y borra vacunas.
   - Añade visitas al veterinario (fecha, motivo, nota) a modo de agenda.
   - Puede cambiar el PIN.
   - Pulsa **Guardar y bloquear**: los cambios quedan persistidos y el panel se cierra. A partir de ese momento, quien escanee solo lee.

3. **Dónde se guardan los cambios.** El JSON de base vive en el repositorio (`pets/<slug>.json`). Los cambios que haga el dueño desde el panel se guardan en el **localStorage del propio móvil** bajo las claves `s42_pet_<slug>` y `s42_pet_lock_<slug>`. Para una entrega profesional, basta con que el dueño abra la chapa en su móvil habitual (donde pondrá siempre al día las visitas).

4. **Entrega al cliente.** Para cada mascota, Studio 42:
   - Pide los datos al dueño.
   - Genera el fichero `pets/<slug>.json`.
   - Guarda el hash de un PIN que el dueño elija (`echo -n '1234' | sha256sum` lo calcula).
   - Graba la URL `https://studio42.es/pets/?id=<slug>` en la chapa NFC NTAG216.

## Estructura del JSON

```json
{
  "schema": "s42-pet-pass-v1",
  "nombre": "Toby",
  "raza": "Golden Retriever",
  "sexo": "Macho",
  "fechaNac": "Mayo 2021",
  "peso": 28.5,
  "castrado": true,
  "microchip": "981098108472911",
  "fotoUrl": "",
  "contactoNombre": "Manuel",
  "contactoTelefono": "+34…",
  "contactoWhatsapp": "+34…",
  "alimentacion": "…",
  "medicacion": "…",
  "caracter": "…",
  "alertas": ["Alérgico a …", "…"],
  "vet": { "clinica": "…", "doctor": "…", "telefono": "+34…", "direccion": "…" },
  "vacunas": [{ "nombre": "Rabia", "fecha": "Vigente" }],
  "visitas": [{ "fecha": "2026-03-15", "motivo": "Revisión anual", "nota": "…" }],
  "pinHash": "SHA-256 del PIN"
}
```

## Qué queda pendiente (producción)

- **Guardado remoto en GitHub (opcional).** Hoy los cambios viven en el navegador. Para que la ficha vaya en la nube, el panel puede enviar el JSON al Apps Script y este lo escribe en el repo (igual que hace Code.gs para los diagnósticos del Closer).
- **Botón de descarga del JSON** por si el dueño quiere llevarse una copia a su correo (opcional).
- Las piezas físicas: chapa de aluminio anodizado con el isotipo del cohete grabado y el chip NFC embebido. Posteriormente integrar en los packs del catálogo.
