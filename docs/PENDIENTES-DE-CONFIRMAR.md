# Datos que hay que confirmar con cada cliente

Al migrar los 9 clientes se conservó todo lo que funcionaba. Lo que no estaba claro **no se borró ni se inventó**: se dejó anotado (también dentro de cada JSON, en el campo `_pendientes`). Esta es la lista para resolver en la próxima visita.

## Enlaces de reseñas de Google que faltan (el botón de Google está oculto hasta tenerlos)
| Cliente | Situación |
|---|---|
| Uñas Latinas Carolina | Tenía `https://maps.google.com` (portada de Maps) |
| Dra. Lisbeth Rangel | Tenía `https://maps.google.com` |
| Zombie Live Tattoo | Tenía el texto de relleno `AQUI_LINK_DE_GOOGLE_MAPS` |

*Cómo se consigue:* el dueño entra en su Perfil de empresa de Google → **Pedir reseñas** → copiar enlace. Se pega en `urlGoogle` del bloque `opinion` del JSON (o en el formulario del Closer).

## Teléfonos y contactos que no coinciden
| Cliente | Qué | Acción |
|---|---|---|
| **Iberlax** | La web usa el WhatsApp `34643186453` (el botón «Guardar contacto» genera la tarjeta con ese número). Existe una tarjeta suelta, `c/contacto-iberlax.vcf`, con otros teléfonos: `+34945601573` y `+34652821738` | ¿Cuál es el WhatsApp de atención? Si hay que usar la tarjeta completa, se enlaza |
| **Clínica Ruiz Mazo** | El botón genera la tarjeta con el WhatsApp `34691613796`. La tarjeta completa `c/contacto-ruizmazo.vcf` (más rica: dirección, email, web) tiene `+941583060` (falta el 34) y un móvil `+34669161379` distinto | Confirmar teléfono fijo, móvil y WhatsApp; luego se puede usar la tarjeta completa |
| **Sport Planet Nutrition (mostrador)** | Sigue usando `spn-vcard.vcf` como antes: lleva otros dos teléfonos (`+34626811728`, `+34671510675`) distintos del WhatsApp de la tienda (`34692202636`) y un **Gmail personal** | Confirmar que es lo que se quiere publicar; si no, se cambia por una tarjeta generada |
| **Dra. Lisbeth** | Su tarjeta lleva un Gmail (`lisca@…`) y un segundo móvil | Confirmar que quiere publicarlos |

## Contenido que depende de una promesa o de un dato técnico (que lo validen ellos)
- **Iberlax:** «Servicio bonificado en tienda» (se lee como entrega gratis), «Club Embajador: bono de 50 €» y textos técnicos (Titanium Pocket, muelles 7 zonas…).
- **Clínica Ruiz Mazo:** «Bono Amigo: 30 € de descuento» (¿existe?), «Guía Pre y Post Operatoria» (apunta a la página genérica de tratamientos; falta la guía real).
- **Ankara Kebab:** alérgenos (opción «sin gluten», lácteos de la salsa blanca). Lleva ya el aviso «si tienes una alergia grave díselo al personal».
- **Sport Planet Nutrition:** dosis de creatina y factores de proteína (1.5 / 1.8 / 2.2 g/kg) — llevan aviso «orientativo».
- **Dra. Lisbeth:** signos de alarma y maleta del parto: que los revise ella.
- **PETS Id Smart (Toby):** es una **demostración** (foto de Unsplash, microchip de ejemplo). Para un cliente real, cambiar foto y datos.

## Botones que no funcionaban y quedaron anotados
- **Zombie:** «Guía de curación (PDF)» tenía el enlace de relleno `AQUI_TU_LINK_DE_DRIVE_AL_PDF`. Cuando tengan el PDF en Drive: añadir un botón `enlace`.
- **SPN pacientes:** «Mi Plan de Comidas» y «Mi Rutina» apuntaban a la portada de Canva. Hace falta un enlace por paciente (un JSON propio por paciente, o quitar el área del paciente). **No guardar datos clínicos reales en el repo público.**
- **Dra. Lisbeth:** Calculadora gestacional, Carnet de vacunación maternal, Control de peso/IMC y Contador de contracciones **no funcionaban** (el motor antiguo no tenía la calculadora gestacional ni el contador; el carnet salía vacío). Se pueden construir como módulos nuevos (una segunda fase) con el contenido médico validado por la doctora. Su «pago móvil» tenía datos de relleno (`V-12345678`).
- **Dental «Simulador de cuotas»:** solo era un enlace a WhatsApp; ahora se llama «Tratamiento en Cuotas». Con precios reales se puede hacer un simulador de verdad.

## Funciones del motor antiguo que ya no existen
- **Música de fondo** (`audioFondo`): el motor nuevo no la reproduce (los navegadores móviles bloquean el audio automático y consumía datos: los `.mp3` pesan 4–7 MB). Si algún cliente la quiere, se puede añadir como botón "activar ambiente".
- **Efecto "modo demo"** (`modoDemo`): no se usaba para nada visible.
- **Estrellas con filtro** de reseñas: sustituido por los dos botones iguales (ver `RESENAS-Y-CUMPLIMIENTO.md`).
