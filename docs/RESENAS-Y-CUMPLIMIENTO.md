# Reseñas, privacidad y límites

## Reseñas: cómo funciona y por qué
El bloque `opinion` ofrece **dos botones idénticos** (mismo tamaño, peso y orden fijo): *Dejar mi opinión en Google* y *Enviar un comentario privado a la gerencia*. Nadie es "filtrado" según su nota; cada persona elige libremente.

Lo que **no** hace el sistema, a propósito:
- **No hay estrellas previas ni desvío según la nota.** Mostrar el enlace de Google solo a quien puntúa alto es *review gating*, prohibido por las políticas de contenido de Google (puede acarrear eliminación de reseñas o sanción de la ficha) y, en la UE, está en el punto de mira de la normativa sobre reseñas engañosas.
- **No se ofrece nada a cambio de una reseña** (premios, descuentos, sorteos). Es una práctica prohibida por Google y por las normas de consumo. Se eliminó el título «¡Premio Seguro!» de Sport Planet Nutrition por este motivo.
- **No se escriben ni se "mejoran" reseñas.**

Lo que sí hace que lleguen más reseñas auténticas: el botón está siempre visible en cada llavero/stand, abre **directamente** el formulario de reseña de Google (enlace *Pedir reseñas* del Perfil de empresa) y el cliente lo ve justo después de una buena experiencia. Un buen argumento comercial: *más reseñas reales por la misma afluencia*, no "reseñas dirigidas".

Sin enlace de Google válido (o si es solo la portada de Maps) el botón de Google se oculta y queda la vía privada; el Closer recibe el aviso.

## Datos personales (RGPD)
- **Parking:** la ubicación del coche se guarda **solo en el móvil** del usuario (almacenamiento local) y no se envía a ningún servidor. El botón puede borrarla.
- **Ubicación GPS** (asistencia en ruta): solo se usa cuando el usuario pulsa el botón y la envía él mismo por WhatsApp.
- **Sin fuentes ni librerías externas** en el motor (antes cargaba Google Fonts, Font Awesome y Tailwind desde CDN, lo que envía la IP del visitante a terceros). Cada visita carga solo `studio42.es`.
- **Sin cookies ni analítica** en el motor.
- Los mensajes por WhatsApp los redacta el usuario en su propio WhatsApp; Studio 42 no los recibe.

## Repositorio público
Todo lo que está en el repositorio (incluidos los `c/*.json` de cada cliente: nombre, WhatsApp, enlaces) **es público** mientras el repo sea público, y además cada JSON es público en `studio42.es/c/<slug>.json`. Esos datos ya son los que el negocio muestra en su ficha, pero conviene:
1. Contárselo al cliente (cláusula en el contrato/ficha).
2. No guardar nunca en un JSON datos de pacientes/clientes finales (nombres, fichas médicas reales). Para el SPN "área del paciente" usar enlaces privados por paciente o no usarlo hasta tener una solución con acceso.
3. Valorar pasar el repositorio a **privado** (Netlify sigue desplegando; la única función que se perdería es el respaldo de lectura desde GitHub, que apenas se usa).
Las notas del Closer sobre las debilidades del negocio (las "fricciones") **no se publican**: solo se quedan en tu Google Sheet.

## Contenido sensible (salud, alimentación)
La IA tiene prohibido dar consejo clínico, dosis o alérgenos inventados. El contenido de salud y alérgenos que ya existe en los clientes (Ankara, SPN, dental, Dra. Lisbeth, mascotas) lo escribió el negocio o tú: **que lo valide su responsable** antes de firmar (ver `PENDIENTES-DE-CONFIRMAR.md`).
