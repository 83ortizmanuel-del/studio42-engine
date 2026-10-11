# SOP: PROCEDIMIENTO ESTÁNDAR DE DESPLIEGUE (CLIENTE NUEVO)
**Documento:** SOP-001 | **Área:** Operaciones y Soporte Técnico | **Motor:** Studio 42 EngineAI 1.0

## Objetivo
Establecer los pasos exactos para transformar el diagnóstico comercial de un establecimiento en un ecosistema Phygital activo, almacenado en GitHub, propagado por Netlify y grabado en el soporte físico (NFC/QR).

---Google Form] ➔ [IA + Prompt Maestro] ➔ [Genera JSON] ➔ [Guardar en GitHub]

## 🛠️ Fase 1: Generación de la Ficha Neural (.json)

1. **Recopilar los datos del diagnóstico:**
   - Nombre oficial del negocio.
   - WhatsApp del propietario/gerente (para el filtro de críticas privadas).
   - describir los puntos de dolor del establecimiento y cuellos de botella para su analisis por parta de Studio42engine IA 1.0
   - Enlace oficial a la ficha de Google Maps.
   - Identidad visual (Código de color HEX primario).

2. **Ejecutar el Studio 42 EngineAI:**
   - Abrir el asistente de Inteligencia Artificial de la agencia.
   - Copiar el `PROMPT_MAESTRO_ENGINE_AI.md`.
   - Inyectar los datos recopilados del negocio.
   - La IA devolverá la estructura de código JSON optimizada, incluyendo los **2 Botones Inteligentes** de conversión personalizada sugeridos tras el análisis.

---

## 📂 Fase 2: Inyección en GitHub y Servidor Cloud

1. Entrar al repositorio oficial en GitHub (`studio42-engine`).
2. Abrir la carpeta `clientes/`.
3. Crear un nuevo archivo con la nomenclatura: `cliente_[nombre-del-local].json` *(Ejemplo: `cliente_la_petite_melina.json`)*.
4. Pegar el código JSON generado por la IA.
5. Hacer clic en **Commit changes...** (Confirmar cambios).
6. **Verificación:** Netlify propagará el archivo en la red CDN global en un tiempo estimado de **10 a 15 segundos**.

---

## 🌐 Fase 3: Verificación de la Ruta Digital

1. Abrir el navegador del smartphone y probar la URL generada:
   `https://studio42.es/v/?id=nombre-del-local` *(o la ruta asignada en el motor)*.
2. **Control de Calidad (Checklist de 3 Puntos):**
   - [ ] La página carga en menos de 0.5 segundos.
   - [ ] Al pulsar 1, 2 o 3 estrellas se abre la alerta privada hacia el WhatsApp del cliente.
   - [ ] Los 2 Botones Inteligentes generados por la IA redirigen correctamente a la acción configurada.

---

## 🧲 Fase 4: Grado y Grabación en Soportes NFC

1. Abrir la aplicación **NFC Tools** (o equivalente) en el smartphone.
2. Seleccionar la opción **Escribir / Write** ➔ **Añadir un registro / Add a record** ➔ **URL / URI**.
3. Pegar la URL oficial verificada en la Fase 3.
4. Acercar el smartphone a los soportes físicos encargados por el cliente:
   - Exhibidor de Metacrilato / Peana.
   - Llaveros Smart NFC para el personal de sala.
   - Tarjeta PVC / Ejecutiva negra.
   - Chip textil de la manga del uniforme.
5. Seleccionar **Escribir / Write** y confirmar con el tono háptico del teléfono.
6. Probar el escaneo de confirmación acercando el teléfono sin la app abierta.

---

## 📦 Fase 5: Entrega y Cierre

1. Empaquetar los soportes grabados en el **Welcome Pack** corporativo.
2. Entregar al establecimiento y realizar una demostración en vivo delante del cliente/gerente para validar la velocidad y el funcionamiento del Escudo Anti-Críticas.

---
*Studio 42 Operations — Garantía de latencia cero y despliegue antifrágil.*
