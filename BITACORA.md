# Bitácora de programación con IA

**Proyecto:** Recetario de cocina (TheMealDB) · **Herramientas:** Claude Code (Claude Sonnet 5.5) y ChatGPT

> **Borrador para revisar:** los prompts están copiados tal cual de mi conversación, con mis errores de escritura. Los fragmentos largos van marcados con […]. La última sección ("Qué aprendí") debo ajustarla con mis propias palabras antes de entregar. Cuando lo haga, borro este aviso.

## Prompts reales

### 1. Prompt inicial (fragmento)
> "Voy a hacer una tarea universitaria: una aplicación web pequeña de recetas de cocina que consuma una API externa. Soy estudiante de Desarrollo de Software Multiplataforma, uso Windows y VS Code. Debo poder explicar cada línea de código en clase, así que escribe código simple y claro, sin trucos avanzados ni librerías innecesarias. […] Trabaja por fases y DETENTE al final de cada una para que yo la revise, la pruebe y confirme antes de seguir. […] Empieza solo con la Fase 1."

- **Respuesta:** Claude me explicó cada fase antes de hacerla. Creó primero el `.gitignore` (con `.env` y `node_modules`), después `.env.example`, `package.json` y un servidor Express mínimo. Antes de la Fase 2 consultó la documentación oficial de TheMealDB para confirmar los endpoints.
- **¿A la primera?** Sí, el servidor arrancó y respondió. Ajustes menores: Claude olvidó darme el comando de commit al final de la Fase 1 y lo corrigió en la Fase 2.

### 2. Errores y cambios que detecté al usar la página
> "ve que cuando sellecciono una receta mira como aparece entonces camabia eso, a que se ve a bienla imagen, otra cosa en el buscador cuando pongo "pollo con arroz" no me da resultado se supone que debe aparecer una receta de como se hace o recetas, entonces tambien checa eso, y cambia el color de la pagina a un naranja mas claro, otra cosa, el ididoma, me lo estas dando en ingles todo lo de la pagina incluyendo las recetas pon que tosdo sea español latinoamericano, y una duda concetaste un api real de recetas como lo hicimos con lo de noticias?"

- **Respuesta:** Claude explicó que el recorte de la foto venía de su propio CSS (`object-fit: cover`), y lo cambió a `contain`. Probó que "pollo con arroz" (y hasta `chicken rice`) da 0 resultados porque TheMealDB solo busca el texto exacto dentro del nombre. Cambió el naranja y puso texto café para conservar el contraste. Para la traducción investigó dos opciones y sus límites: MyMemory (5,000 caracteres al día sin correo) y el traductor de Chrome (solo escritorio).
- **¿A la primera?** La foto y el color sí, comprobados en el navegador. La búsqueda de varias palabras y la traducción **siguen pendientes**: quedaron como limitaciones en el README.

### 3. Prompt para pedirle un diseño a ChatGPT
> "Hazme un prompt para ChatGPT, o sea, tipo, pon todas las funciones que hace la aplicación, o sea, que diga la página web, y quiero que él me cree un diseño especial con una paleta de colores. Pero tú pon el prompt de lo que hace la aplicación, en qué se basa y todo eso, y que quiero que me dé ideas."

- **Respuesta:** Claude redactó un prompt con todas las funciones, los estados de la página (cargando, error, vacío), las restricciones (solo HTML, CSS y JavaScript puro) y las clases CSS que ya existían. Con eso ChatGPT me dio el mockup y la paleta.
- **¿A la primera?** Sí, pero tuve que adaptar el resultado: "Favoritos" no existe en mi app, así que se quitó; las fotos del mockup eran generadas, así que la app usa fotos reales de TheMealDB; y un icono blanco sobre el círculo mostaza no tenía buen contraste (2.4:1), así que se cambió a café.

### 4. Prompt de rediseño (fragmento)
> "Rediseño UI/UX de mi aplicación web: Recetario de cocina. Actúa como un desarrollador frontend y diseñador UI/UX especializado en interfaces web modernas, accesibles y responsive. Quiero que rediseñes visualmente mi aplicación web existente llamada “Recetario de cocina”, tomando como referencia EXACTA la captura del mockup que te adjunto. […]"

- **Respuesta:** Claude reescribió `index.html`, `estilos.css` y `app.js` con la paleta y las fuentes pedidas, agregó círculos de categoría que filtran de verdad, etiquetas en las tarjetas y recetas de inicio. Probó en escritorio y en celular, y calculó los contrastes.
- **¿A la primera?** Casi. En celular la barra superior se partía en dos líneas y un título decía "Resultados para…" junto a "No encontramos recetas". Ambos se corrigieron.

### 5. Subir el proyecto a GitHub
> "Ahora necesito subir este proyecto a GitHub. Voy a explicar a mi profe cada comando, así que ve paso por paso, explicándome qué hace cada uno y por qué, y NO hagas nada irreversible sin mi confirmación. […]"

- **Respuesta:** Claude guió cada comando. Antes de subir comprobó que `.env` no se publicara y encontró un archivo de configuración local que tampoco debía subirse (`.claude/`).
- **¿A la primera?** No. GitHub rechazó el push porque mi repositorio ya tenía un "Initial commit". Se resolvió con un merge de historias distintas, conservando mi `.gitignore`. Yo cometí también dos errores: trabajé en una terminal abierta en la carpeta equivocada, y hice un commit antes de guardar el README. Lo arreglé con un commit nuevo, sin tocar el historial.

## Un error de la IA que detecté
En la Fase 3, Claude escribió para la foto del detalle `max-height: 350px` con `object-fit: cover`. Al abrir una receta, la foto salía ampliada y **cortada**. Lo detecté con una captura de pantalla y se lo mostré. La solución fue `object-fit: contain`, `height: auto` y `max-height: 60vh`, que muestran la foto completa. Al arreglarlo, Claude encontró además un error escondido: un `display: block` anulaba el atributo `hidden` de esa imagen, y lo corrigió con una regla propia. Otro fallo que detecté: la búsqueda "pollo con arroz" no devolvía nada porque el diseño dependía de que la API coincidiera con el texto exacto.

## Qué aprendí y qué haría distinto
- Daría a la IA, desde el principio, **los requisitos exactos de la tarea** (commits durante el desarrollo, declaración de IA, bitácora). Varios se descubrieron al final.
- Haría **yo los commits**, uno por cada avance, y no varios juntos al terminar.
- **Probaría con búsquedas reales** antes de dar por buena la búsqueda: varias palabras, en español y en inglés.
- **Revisaría con capturas de pantalla**: la foto cortada solo se vio al usar la página.
- Le pediría a la IA que me diga **qué no verificó**: por ejemplo, el error de límite de peticiones (429) solo se probó simulado.
- **Guardaría el archivo antes de hacer `git add`** y comprobaría con `git status` que Git ve el cambio.
