# 🍳 Recetario de cocina

Aplicación web pequeña que busca recetas de cocina usando la API pública [TheMealDB](https://www.themealdb.com/api.php).

Permite:

- Buscar platillos por nombre.
- Filtrar por categoría (la lista se carga desde la API).
- Ver el detalle de una receta: foto, ingredientes con medidas e instrucciones.
- Obtener una receta aleatoria con el botón **Sorpréndeme**.

## Tecnologías

- **Frontend:** HTML, CSS y JavaScript puro (sin frameworks).
- **Backend:** Node.js + Express. Sirve de intermediario con la API para que la clave nunca llegue al navegador.
- **Paquetes:** solo `express` y `dotenv`. Se usa el `fetch` nativo de Node.

## Requisitos

- [Node.js](https://nodejs.org/) versión 18 o superior.
  Para comprobarlo, abre una terminal y escribe: `node --version`
- Conexión a internet (la app consulta TheMealDB).

## Cómo ejecutarla (Windows + VS Code)

1. **Descarga o clona** el proyecto y ábrelo en VS Code (`Archivo > Abrir carpeta`).

2. **Abre una terminal** en VS Code (`Terminal > Nueva terminal`).

3. **Instala las dependencias:**

   ```bash
   npm install
   ```

4. **Crea tu archivo `.env`.** Copia `.env.example` y renombra la copia como `.env`:

   ```bash
   copy .env.example .env
   ```

   Abre `.env` y escribe la clave después del signo igual. La clave de prueba para desarrollo aparece en la [documentación de TheMealDB](https://www.themealdb.com/api.php):

   ```
   MEALDB_API_KEY=aqui_va_la_clave
   PORT=3000
   ```

   > El archivo `.env` está en `.gitignore`, así que **no se sube a GitHub**.

5. **Inicia el servidor:**

   ```bash
   npm start
   ```

6. **Abre el navegador** en <http://localhost:3000>

Para detener el servidor, presiona `Ctrl + C` en la terminal.

## Estructura del proyecto

```
.
├── .env.example        # Plantilla de variables de entorno (sin clave real)
├── .gitignore          # Evita subir .env y node_modules
├── package.json        # Datos del proyecto y dependencias
├── server.js           # Servidor Express: rutas que consultan la API
└── public/             # Frontend (lo que ve el navegador)
    ├── index.html      # Estructura de la página
    ├── estilos.css     # Aspecto visual (adaptable a celular)
    └── app.js          # Lógica: buscar, filtrar, detalle, aleatoria, errores
```

## Rutas del servidor

El navegador solo habla con estas rutas; el servidor es quien llama a TheMealDB con la clave.

| Ruta | Qué hace | Endpoint de TheMealDB |
|---|---|---|
| `GET /api/buscar?nombre=pasta` | Busca recetas por nombre | `search.php?s=` |
| `GET /api/categorias` | Lista las categorías | `categories.php` |
| `GET /api/filtrar?categoria=Seafood` | Recetas de una categoría | `filter.php?c=` |
| `GET /api/receta/:id` | Detalle completo de una receta | `lookup.php?i=` |
| `GET /api/aleatoria` | Una receta al azar | `random.php` |

## Manejo de errores

| Situación | Qué ve el usuario |
|---|---|
| Sin conexión a internet o servidor apagado | Mensaje amigable de falta de conexión |
| Sin resultados (`meals: null`) | "No encontramos recetas" |
| Límite de peticiones (HTTP 429) | Aviso de demasiadas peticiones seguidas |
| Error de la API u otro error del servidor | Mensaje claro de que el servicio tiene problemas |
| Respuesta que tarda más de 10 segundos | Aviso de que la respuesta tardó demasiado |
| Mientras se espera la respuesta | Indicador "Cargando..." |

## Seguridad

- La clave de la API vive solo en el archivo `.env` y la lee el servidor.
- La clave **no aparece** en el frontend ni en ningún archivo que se suba a GitHub.
- Los datos de la API se insertan en la página como texto (`textContent`), nunca como HTML.

## Limitaciones conocidas

- Todo el contenido está en español latinoamericano: la interfaz, las categorías y los orígenes se traducen con diccionarios, y los nombres, ingredientes, medidas e instrucciones de unas 790 recetas están traducidos de antemano en `datos/traducciones-es.json`. El servidor mezcla ese archivo con lo que responde TheMealDB. La traducción se hizo con ayuda de Claude (ver la declaración de uso de IA). Si TheMealDB agrega recetas nuevas que no están en el archivo, esas se mostrarán en inglés. Se puede buscar en español (por ejemplo `pollo`) o en inglés (`chicken`).
- TheMealDB casi no tiene platillos mexicanos (por ejemplo, no tiene `chilaquiles`). La búsqueda también prueba la palabra en singular (`enchiladas` encuentra `enchilada`).
- La clave `1` es de prueba, solo para desarrollo o uso educativo. La documentación de TheMealDB indica que para publicar una app se necesita una clave de supporter.
- TheMealDB busca el texto exacto dentro del nombre del platillo, así que una frase de varias palabras (por ejemplo `chicken rice`) casi nunca devuelve resultados.
- La foto principal de la portada viene de una receta real de TheMealDB (700 × 700 px), por lo que se muestra a un tamaño moderado para no verse borrosa.

## Bitácora de programación con IA

La bitácora (prompts reales, errores de la IA detectados y aprendizajes) está en [BITACORA.md](BITACORA.md).

## Declaración de uso de IA

Este proyecto se hizo **con ayuda de inteligencia artificial**, como permite la tarea. Aquí declaro qué herramientas usé, para qué y qué hice yo.

### Herramientas de IA que usé

| Herramienta | Para qué la usé |
|---|---|
| **Claude Code** (modelo Claude Sonnet 5.5, app de escritorio de Claude) | Generar el código del servidor y del frontend, explicarme cada parte, depurar y probar la app en el navegador, escribir este README y guiarme con los comandos de Git |
| **ChatGPT** | Generar las imágenes de referencia del rediseño (el mockup) y la propuesta de diseño y paleta de colores. El prompt que le di a ChatGPT lo redactó Claude. Las imágenes de ChatGPT solo sirvieron de referencia: las fotos que muestra la app vienen de TheMealDB |
| GitHub Copilot, Cursor, Codespaces | No los usé |

### Dónde usé IA en el proyecto

| Archivo | Qué hizo la IA | Qué hice yo |
|---|---|---|
| `server.js` | Claude escribió el servidor Express, las 5 rutas que consultan TheMealDB y la clasificación de errores (429, 502, 503) | Pedí las reglas (clave en `.env`, solo `express` y `dotenv`) y revisé la fase antes de continuar |
| `.gitignore`, `.env.example`, `package.json` | Claude los creó siguiendo mis reglas de seguridad | Definí que la clave nunca se subiera y revisé que `.env` no apareciera en los archivos por subir |
| `public/index.html` | Claude escribió la estructura de la página y el rediseño | Elegí el diseño a seguir (mockup) y revisé el resultado |
| `public/estilos.css` | Claude escribió los estilos: primero una versión básica y luego el rediseño "Cocina de hogar" con la paleta y las fuentes del prompt de diseño | Detecté que la foto del detalle se veía recortada y pedí corregirla; pedí un naranja más claro |
| `public/app.js` | Claude escribió la lógica: buscar, filtrar por categoría, detalle, receta aleatoria, "Cargando...", manejo de errores y las 4 recetas de inicio | Revisé cada fase; detecté que "pollo con arroz" no devolvía resultados y que el contenido salía en inglés |
| `README.md` | Claude redactó las instrucciones de ejecución y el borrador de esta declaración | Completé la declaración con lo que realmente hice yo |

### Cómo trabajé con la IA

- Escribí un prompt con el stack permitido, la API, las reglas de seguridad y **6 fases**. Revisé cada fase antes de pasar a la siguiente.
- Elegí la API (TheMealDB), pedí el manejo de errores obligatorio (sin conexión, respuesta vacía, límite de peticiones) y revisé el funcionamiento de la app.
- Para el rediseño, le di a Claude las indicaciones paso a paso: la paleta de colores, el diseño y cómo quería que funcionara la página. Usé ChatGPT para generar las imágenes de referencia (el mockup) y se las pasé a Claude para implementarlas.

### Git y commits (transparencia)

- Los commits desde "Agrega estructura inicial" hasta "Rediseño 'Cocina de hogar'" **los creó Claude Code a petición mía**, siguiendo mis instrucciones paso a paso. Por eso llevan la línea `Co-Authored-By: Claude` y varios se hicieron el mismo día, al terminar cada parte, y no a medida que escribía el código.
- Los commits que hice yo, con la guía de Claude paso a paso en la terminal, son "Agrega declaración de uso de IA en el README" y los que siguen a ese.

### Lo que hice yo sin ayuda de IA

**No escribí el código a mano:** el código del servidor, la página, los estilos y el JavaScript lo escribió Claude Code a partir de mis indicaciones. Lo que hice yo fue:

- Definir la idea del proyecto y cómo quería que funcionara la página: buscar por nombre, filtrar por categoría, ver el detalle de una receta, receta aleatoria y mensajes de error y de carga.
- Elegir la API (TheMealDB) y las reglas del proyecto: solo `express` y `dotenv`, y la clave en un archivo `.env` que nunca se sube.
- Dirigir el trabajo por fases y revisar cada una antes de aprobar la siguiente.
- Definir el diseño visual: la paleta de colores, el estilo y el mockup, y decidir cómo usar ChatGPT para las imágenes de referencia.
- Probar la página y detectar errores que le pedí a la IA corregir: la foto del detalle se veía recortada, "pollo con arroz" no daba resultados y el contenido de las recetas salía en inglés.
- Crear mi cuenta y el repositorio de GitHub, y solicitar el GitHub Student Developer Pack.
- Hacer yo, desde la terminal, los commits indicados arriba.

