# Fichas de Google (una página por cliente)

`studio42.es/c/?cod=<slug>` pinta todo con JavaScript, así que Google la ve como una página vacía de Studio 42.
Para que el negocio salga en búsquedas de su zona, cada cliente puede tener además una página estática en
**`studio42.es/<slug>/`** con su nombre, dirección, código postal, horario, el schema `LocalBusiness`
y un botón «Abrir la app» que lleva a la landing de siempre. Las URLs de los llaveros no cambian.

## Cómo se activa

Añade un bloque `ficha` al JSON del cliente (`c/<slug>.json`). Obligatorios: `direccion`, `cp`, `ciudad`.

```json
"ficha": {
  "tipo": "Restaurant",
  "categoria": "Kebab",
  "descripcion": "Kebab y dürüm caseros en el centro de Logroño, para comer aquí o llevar.",
  "direccion": "Calle Ejemplo 12",
  "cp": "26001",
  "ciudad": "Logroño",
  "provincia": "La Rioja",
  "telefono": "+34 600 000 000",
  "mapsUrl": "https://maps.app.goo.gl/xxxx",
  "horario": ["Mo-Fr 12:00-23:00", "Sa,Su 13:00-00:00"],
  "precio": "€"
}
```

| Campo | Qué poner |
|---|---|
| `tipo` | Tipo de [schema.org](https://schema.org/LocalBusiness): `Restaurant`, `Dentist`, `BarberShop`, `BeautySalon`, `HairSalon`, `VeterinaryCare`, `PetStore`, `Store`… Si no se pone: `LocalBusiness`. |
| `categoria` | Texto visible y en el título: «Kebab», «Clínica dental»… |
| `descripcion` | 1–2 frases propias del negocio (20–300 caracteres). Mejor escrita a mano que genérica. |
| `direccion` | Calle y número, **sin** CP ni ciudad. Igual que en Google Maps. |
| `cp`, `ciudad`, `provincia` | El CP es lo que más pesa para el «cerca de mí». |
| `telefono` | Si falta, se usa el del WhatsApp del cliente. |
| `mapsUrl`, `web`, `redes` | Enlaces del negocio (https). Ayudan a Google a unir la página con su ficha de Maps. |
| `lat`, `lng` | Opcional, coordenadas. |
| `horario` | Formato schema.org: `Mo Tu We Th Fr Sa Su`, rangos con `-`, días sueltos con `,`. |
| `precio` | `€` a `€€€€`. |
| `indexar` | `false` para no publicar la página aunque haya ficha. |

**Importante:** nombre, dirección y teléfono deben coincidir con los de su ficha de Google Maps. No se pone nota
ni número de reseñas en el schema: Google lo trata como spam si la página no muestra esas reseñas.

## Qué pasa al guardar

La acción **«Páginas de clientes para Google»** (`.github/workflows/fichas-google.yml`) se ejecuta en cada cambio
de `c/*.json` en main: corre `tools/generar-fichas.js`, crea o actualiza `<slug>/index.html`, rehace el bloque de
clientes en `sitemap.xml` (entre las marcas `fichas:inicio` y `fichas:fin`) y lo sube a main.

- No sale página si el cliente está en pausa (`pausada: true`), tiene `redirigir` o `ficha.indexar: false`. Si ya tenía una, se borra.
- Nunca pisa una carpeta que no haya creado el script (por ejemplo `nutrition-planet/`): avisa y se la salta.
- Las páginas generadas llevan la marca `generado por tools/generar-fichas.js`: **no se editan a mano**, se cambia el JSON.

Para verlo en local: `node tools/generar-fichas.js` (escribe) o `node tools/generar-fichas.js --comprobar` (solo dice qué cambiaría).
Pruebas: `node tests/probar_fichas.js`.

## Después de publicar

1. En Google Search Console, enviar `https://studio42.es/sitemap.xml` (una vez) y pedir la indexación de la página nueva.
2. En la ficha de Google Maps del negocio, poner `https://studio42.es/<slug>/` como sitio web si no tiene web propia.
