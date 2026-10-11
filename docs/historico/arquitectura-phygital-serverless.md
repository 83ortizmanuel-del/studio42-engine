# 🚀 Studio42 Engine | Arquitectura Phygital Serverless

**Studio42 Engine** es un motor de renderizado dinámico diseñado para conectar soportes físicos (NFC / QR) con experiencias digitales de alta conversión en milisegundos. 

Construido para la agencia **Studio 42**, este sistema elimina la necesidad de desarrollar páginas web tradicionales, bases de datos pesadas o aplicaciones nativas, ofreciendo una infraestructura ágil, de latencia cero y escalabilidad infinita.

---

## 🧠 Arquitectura del Sistema (SPA Desacoplada)

El motor funciona bajo un modelo *Serverless* dividido en tres capas fundamentales:

### 1. El Motor Maestro (`v/index.html`)
Un único archivo HTML blindado con **Tailwind CSS** y **Vanilla JavaScript**. Actúa como un lienzo inteligente que lee la URL de entrada, localiza el nodo de datos correspondiente y renderiza la interfaz gráfica en tiempo real. 
*   **Ventaja:** Permite actualizar el diseño visual o la lógica de negocio de *todos* los clientes simultáneamente modificando un solo archivo.

### 2. Los Nodos de Datos (`v/[slug-cliente]/cliente.json`)
Cada cliente se despliega exclusivamente mediante un archivo JSON ultra-ligero que contiene su identidad corporativa y configuración operativa (botones, enlaces, Escudo Anti-Críticas).
*   **Ventaja:** Elimina vulnerabilidades de seguridad, caídas de servidor por sobrecarga y costes de mantenimiento de bases de datos.

### 3. El Enrutador Fantasma (`_redirects`)
Reglas de enrutamiento a nivel de servidor (Netlify). Intercepta las peticiones de los soportes físicos (`/v/nombre-cliente`) y las redirige silenciosamente al Motor Maestro sin generar errores 404.

---

## ⚡ Ventajas Competitivas de la Infraestructura

*   **Latencia Cero:** Al servir archivos estáticos (HTML/JSON) a través de un CDN global, las pantallas cargan instantáneamente tras el escaneo NFC, evitando el abandono del usuario.
*   **Despliegue Ultra-Rápido:** Un nuevo cliente puede ser configurado, generado (vía IA) y desplegado en producción en menos de 60 segundos.
*   **Coste Marginal Cero:** Escalar de 10 a 10.000 clientes no requiere aumentar la potencia del servidor ni los costes de infraestructura.
*   **Blindaje Anti-Caídas:** Sin CMS (como WordPress) ni consultas a MySQL, el sistema es invulnerable a ataques de inyección y caídas por picos de tráfico.

---

## 🛠️ Flujo de Despliegue (Para Closers)

Para dar de alta un nuevo negocio en la plataforma:

1. Crear una carpeta dentro de `v/` con el slug del cliente (ej. `v/mi-cliente/`).
2. Añadir el archivo `cliente.json` generado por el Prompt Maestro.
3. *(Opcional)* Añadir el archivo `logo.jpg` en la misma carpeta.
4. Grabar la URL absoluta (`https://studio42.es/v/mi-cliente`) en el soporte NFC.

---
*Desarrollado para la optimización operativa y reputacional del comercio y hostelería local por Studio 42.*
