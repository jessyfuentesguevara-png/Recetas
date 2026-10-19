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

- Los nombres de platillos, ingredientes e instrucciones vienen de la API **en inglés**. Solo la interfaz está en español. Por eso conviene buscar en inglés (por ejemplo `chicken` en lugar de `pollo`).
- La clave `1` es de prueba, solo para desarrollo o uso educativo. La documentación de TheMealDB indica que para publicar una app se necesita una clave de supporter.
- TheMealDB busca el texto exacto dentro del nombre del platillo, así que una frase de varias palabras (por ejemplo `chicken rice`) casi nunca devuelve resultados.
- La foto principal de la portada viene de una receta real de TheMealDB (700 × 700 px), por lo que se muestra a un tamaño moderado para no verse borrosa.

## Declaración de uso de IA

Este proyecto se hizo **con ayuda de inteligencia artificial**, como permite la tarea. Aquí declaro qué herramientas usé, para qué y qué hice yo.

> ✏️ **Antes de entregar:** completa o corrige todo lo marcado con ✏️ para que sea verdad, y borra esos avisos.

### Herramientas de IA que usé

| Herramienta | Para qué la usé |
|---|---|
| **Claude Code** (modelo Claude Sonnet 5.5, app de escritorio de Claude) | Generar el código del servidor y del frontend, explicarme cada parte, depurar y probar la app en el navegador, escribir este README y guiarme con los comandos de Git |
| **ChatGPT** | ✏️ Confirma y ajusta: propuesta de diseño visual (mockup y paleta de colores) a partir de un prompt que preparó Claude, y el prompt de rediseño que luego le di a Claude |
| GitHub Copilot, Cursor, Codespaces | ✏️ Si no los usaste, deja escrito "No los usé". Si los usaste, explica para qué |

### Dónde usé IA en el proyecto

| Archivo | Qué hizo la IA | Qué hice yo |
|---|---|---|
| `server.js` | Claude escribió el servidor Express, las 5 rutas que consultan TheMealDB y la clasificación de errores (429, 502, 503) | Pedí las reglas (clave en `.env`, solo `express` y `dotenv`) y revisé la fase antes de continuar |
| `.gitignore`, `.env.example`, `package.json` | Claude los creó siguiendo mis reglas de seguridad | Definí que la clave nunca se subiera y revisé que `.env` no apareciera en los archivos por subir |
| `public/index.html` | Claude escribió la estructura de la página y el rediseño | Elegí el diseño a seguir (mockup) y revisé el resultado |
| `public/estilos.css` | Claude escribió los estilos: primero una versión básica y luego el rediseño "Cocina de hogar" con la paleta y las fuentes del prompt de diseño | Detecté que la foto del detalle se veía recortada y pedí corregirla; pedí un naranja más claro |
| `public/app.js` | Claude escribió la lógica: buscar, filtrar por categoría, detalle, receta aleatoria, "Cargando...", manejo de errores y las 4 recetas de inicio | Revisé cada fase; detecté que "pollo con arroz" no devolvía resultados y que el contenido salía en inglés |
| `README.md` | Claude redactó las instrucciones de ejecución y el borrador de esta declaración | ✏️ Completé y corregí esta declaración |

### Cómo trabajé con la IA

- Escribí un prompt con el stack permitido, la API, las reglas de seguridad y **6 fases**. Revisé cada fase antes de pasar a la siguiente.
- Elegí la API (TheMealDB), pedí el manejo de errores obligatorio (sin conexión, respuesta vacía, límite de peticiones) y probé que la app abriera y funcionara.
- Para el rediseño, usé ChatGPT para obtener una propuesta visual y se la pasé a Claude para implementarla.

### Git y commits (transparencia)

- Los commits desde "Agrega estructura inicial" hasta "Rediseño 'Cocina de hogar'" **los creó Claude Code a petición mía**, siguiendo mis instrucciones paso a paso. Por eso llevan la línea `Co-Authored-By: Claude` y varios se hicieron el mismo día, al terminar cada parte, y no a medida que escribía el código.
- ✏️ Los commits posteriores a este los hice yo, y aprendí a hacerlos con la guía de Claude. (Deja esta frase solo cuando sea cierto.)

### Lo que hice yo sin ayuda de IA

✏️ **Complétalo tú, con la verdad.** Solo tú sabes qué hiciste sin IA. Escribe aquí, por ejemplo, qué partes escribiste o modificaste a mano, qué configuraste tú (cuenta y repositorio de GitHub, solicitud del GitHub Student Developer Pack) y qué probaste por tu cuenta. Si no hubo partes de código escritas sin IA, escríbelo así, tal cual.

