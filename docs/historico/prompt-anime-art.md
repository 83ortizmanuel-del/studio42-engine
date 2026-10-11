Actúa como Director Técnico y Diseñador de Experiencia Phygital para Studio 42 Art & Wear Division.

Genera ÚNICAMENTE un bloque de código JSON válido y formateado para una pieza phygital de Studio 42.

Datos de la pieza:
- Tipo de producto: [ART o WEAR]
- Categoría / Universo: [Anime | Fighters | Comics | Cartoon | Música]
- Personaje / Sujeto: [Ej: Roronoa Zoro]
- Subtítulo / Serie: [Ej: Cazador de Piratas // One Piece]
- Edición: [Ej: Edición Limitada // Pieza 01 de 10]
- Propietario inicial: [Ej: Pendiente de Registro / Coleccionista VIP #01]

Requisitos técnicos del JSON:
1. "obra_id": Formato "[TIPO]-[CATEGORIA]-[NUM]" (ej: "ART-ANIME-003").
2. "tipo_producto": Exactamente "ART" o "WEAR".
3. "categoria": Exactamente una de estas opciones: "Anime", "Fighters", "Comics", "Cartoon" o "Música".
4. "titulo_obra" y "subtitulo": Títulos cinematográficos de alto impacto.
5. "estetica": Paleta cromática acorde a la energía visual del personaje:
   - "color_primario" (HEX llamativo)
   - "color_acento" (HEX complementario)
   - "color_fondo" (HEX oscuro profundo tipo #05070F o #070505)
   - "aura_neon" (RGBA con 0.6 a 0.75 de opacidad)
6. "imagen_lienzo": Slug en minúsculas (ej: "zoro-santoryu.png").
7. "media":
   - "mockup": Mismo nombre de imagen o render ("zoro-santoryu.png").
   - "audio_track": Enlace o archivo MP3 de sintonía/OST.
   - "youtube_embed": URL embed de YouTube si aplica, o dejar como string vacío "".
   - "wallpaper_download": Nombre del wallpaper descargable ("zoro-4k-exclusive.jpg").
8. "modulo_especifico": DEBE contener los campos según la categoría elegida:
   - Si es Anime: "rango_ki", "tecnica_maestra", "frase".
   - Si es Fighters: "record", "estilo", "finalizacion_icono", "frase".
   - Si es Comics: "tierra", "editorial_linea", "frase".
   - Si es Cartoon: "frase", "canal_era" (ej: "Cartoon Network 90s").
   - Si es Música: "album", "año_hito", "frase".
9. "certificado":
   - "codigo": Formato "S42-[PERSONAJE]-[NUMERO]" (ej: "S42-ZORO-001-OP").
   - "estado": "ORIGINAL VERIFICADO POR NFC".
   - "propietario": Nombre o "Coleccionista VIP #01".
10. "enlaces":
   - "whatsapp_vip": URL con mensaje dinámico prellenado hacia el número +34 672 294 962:
     "https://wa.me/34672294962?text=Hola%20Studio%2042,%20quiero%20registrar%20mi%20pieza%20Phygital%20de%20[PERSONAJE]"

Devuélveme EXCLUSIVAMENTE el bloque de código JSON sin introducciones, sin explicaciones y sin texto fuera del bloque JSON.
