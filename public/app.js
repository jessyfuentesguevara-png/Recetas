// ============================================================
// app.js - Logica del frontend (Fase 4)
// Busca, filtra, muestra el detalle y trae recetas aleatorias.
// Habla SOLO con nuestro servidor (/api/...), nunca directo con TheMealDB.
// ============================================================

// ---------- 1. Referencias a los elementos de la pagina ----------
// getElementById busca un elemento del HTML por su id y lo guarda en una constante.
const formulario = document.getElementById('formulario-busqueda');
const campoBusqueda = document.getElementById('campo-busqueda');
const selectorCategoria = document.getElementById('selector-categoria');
const botonAleatoria = document.getElementById('boton-aleatoria');
const mensaje = document.getElementById('mensaje');
const resultados = document.getElementById('resultados');
const detalle = document.getElementById('detalle');
const botonCerrar = document.getElementById('cerrar-detalle');
const detalleTitulo = document.getElementById('detalle-titulo');
const detalleImagen = document.getElementById('detalle-imagen');
const detalleInfo = document.getElementById('detalle-info');
const detalleIngredientes = document.getElementById('detalle-ingredientes');
const detalleInstrucciones = document.getElementById('detalle-instrucciones');

// ---------- 2. Funciones auxiliares ----------

// Crea un error con una etiqueta ("tipo") que dice que clase de problema fue.
// Los tipos son: 'conexion', 'lento', 'limite', 'api' y 'servidor'.
function crearError(tipo) {
  const error = new Error('Fallo de tipo: ' + tipo);
  error.tipo = tipo;
  return error;
}

// Pide datos a nuestro servidor y devuelve el JSON ya convertido.
// Si algo falla, lanza un error con su "tipo" para poder avisarle al usuario con claridad.
async function pedirJson(ruta) {
  let respuesta;
  try {
    // AbortSignal.timeout(10000) cancela la peticion si pasan 10 segundos sin respuesta
    respuesta = await fetch(ruta, { signal: AbortSignal.timeout(10000) });
  } catch (error) {
    // fetch falla de golpe cuando no hay conexion (o se acabo el tiempo de espera)
    throw crearError(error.name === 'TimeoutError' ? 'lento' : 'conexion');
  }

  if (!respuesta.ok) {                         // ok es false si el codigo HTTP no es 200-299
    if (respuesta.status === 429) throw crearError('limite');     // demasiadas peticiones
    if (respuesta.status === 502) throw crearError('api');        // la API de recetas fallo
    if (respuesta.status === 503) throw crearError('conexion');   // el servidor no alcanzo la API
    throw crearError('servidor');                                 // cualquier otro error
  }

  try {
    return await respuesta.json();             // convierte el texto recibido en objeto
  } catch (error) {
    throw crearError('servidor');              // la respuesta no era un JSON valido
  }
}

// Escribe un texto normal en la zona de mensajes.
function mostrarMensaje(texto) {
  mensaje.textContent = texto;                 // textContent pone texto plano (seguro)
  mensaje.className = 'mensaje';               // quita los estilos de "cargando" o "error"
}

// Muestra "Cargando..." con el circulo giratorio (la clase "cargando" esta en el CSS).
// Tambien quita las tarjetas viejas para no mezclarlas con los resultados nuevos.
function mostrarCargando(texto) {
  resultados.replaceChildren();
  mensaje.textContent = texto;
  mensaje.className = 'mensaje cargando';
}

// Textos amigables en espanol para cada tipo de error.
const TEXTOS_ERROR = {
  conexion: 'No hay conexión con internet o con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  lento: 'La respuesta tardó demasiado. Inténtalo de nuevo en unos momentos.',
  limite: 'Hiciste demasiadas peticiones seguidas. Espera un momento e inténtalo de nuevo.',
  api: 'El servicio de recetas tiene problemas en este momento. Inténtalo más tarde.',
  servidor: 'Ocurrió un error inesperado. Inténtalo de nuevo.'
};

// Muestra el mensaje de error que corresponde al tipo de fallo.
function mostrarError(error) {
  // Si el error no trae tipo (un fallo que no previmos), usamos el mensaje general
  mensaje.textContent = TEXTOS_ERROR[error.tipo] || TEXTOS_ERROR.servidor;
  mensaje.className = 'mensaje error';         // activa el estilo rojo del CSS
}

// Dibuja las tarjetas de una lista de recetas (cada una con foto y nombre).
function mostrarTarjetas(recetas) {
  resultados.replaceChildren();                // vacia las tarjetas anteriores

  for (const receta of recetas) {              // recorre cada receta de la lista
    // Crea la tarjeta: <article class="tarjeta">
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';
    tarjeta.tabIndex = 0;                      // permite llegar a ella con la tecla Tab

    // Crea la foto
    const imagen = document.createElement('img');
    imagen.src = receta.strMealThumb;          // direccion de la foto
    imagen.alt = receta.strMeal;               // texto alternativo (accesibilidad)
    imagen.loading = 'lazy';                   // carga la foto solo cuando esta por verse

    // Crea el nombre
    const titulo = document.createElement('h2');
    titulo.textContent = receta.strMeal;

    // Mete foto y nombre dentro de la tarjeta, y la tarjeta en la pagina
    tarjeta.append(imagen, titulo);
    resultados.append(tarjeta);

    // Al hacer clic (o Enter con el teclado), abre el detalle de esa receta
    tarjeta.addEventListener('click', () => abrirDetalle(receta.idMeal));
    tarjeta.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') abrirDetalle(receta.idMeal);
    });
  }
}

// Muestra una lista de recetas, o el aviso de "sin resultados" si no hay ninguna.
function mostrarLista(recetas, textoExito) {
  if (!recetas) {                              // la API manda null cuando no hay nada
    resultados.replaceChildren();
    mostrarMensaje('No encontramos recetas');
    return;
  }
  mostrarMensaje(textoExito);
  mostrarTarjetas(recetas);
}

// ---------- 3. Detalle de una receta ----------

// Llena la ventana de detalle con los datos de una receta y la muestra.
function mostrarDetalle(receta) {
  detalleTitulo.textContent = receta.strMeal;
  detalleImagen.hidden = false;                // la foto se oculta mientras carga; aqui se vuelve a mostrar
  detalleImagen.src = receta.strMealThumb;
  detalleImagen.alt = receta.strMeal;

  // Categoria y origen; filter(Boolean) descarta los que vengan vacios o null.
  const datos = [receta.strCategory, receta.strArea || receta.strCountry];
  detalleInfo.textContent = datos.filter(Boolean).join(' · ');

  // La API guarda los ingredientes como strIngredient1...strIngredient20
  // y sus medidas como strMeasure1...strMeasure20.
  detalleIngredientes.replaceChildren();
  for (let i = 1; i <= 20; i++) {
    const ingrediente = receta['strIngredient' + i];
    const medida = receta['strMeasure' + i];
    // Si no hay ingrediente (null o solo espacios), saltamos al siguiente numero
    if (!ingrediente || !ingrediente.trim()) continue;

    const item = document.createElement('li');
    // Une la medida con el ingrediente, ej. "200g Pasta"; si no hay medida, solo el ingrediente
    item.textContent = ((medida || '').trim() + ' ' + ingrediente.trim()).trim();
    detalleIngredientes.append(item);
  }

  detalleInstrucciones.textContent = receta.strInstructions;

  detalle.hidden = false;                      // muestra la ventana
  botonCerrar.focus();                         // lleva el foco al boton de cerrar (teclado)
}

// Abre la ventana de detalle vacia con "Cargando..." mientras llega la receta.
function mostrarDetalleCargando() {
  detalleTitulo.textContent = 'Cargando...';
  detalleImagen.hidden = true;                 // oculta la foto para no ver una imagen rota
  detalleInfo.textContent = '';
  detalleIngredientes.replaceChildren();
  detalleInstrucciones.textContent = '';
  detalle.hidden = false;
  botonCerrar.focus();
}

// Pide a nuestro servidor una receta por su id y la muestra.
async function abrirDetalle(id) {
  mostrarDetalleCargando();
  try {
    const datos = await pedirJson('/api/receta/' + id);
    if (!datos.meals) {
      cerrarDetalle();                         // cierra la ventana vacia
      mostrarMensaje('No encontramos recetas');
      return;
    }
    mostrarDetalle(datos.meals[0]);            // el detalle viene como lista de 1 elemento
  } catch (error) {
    cerrarDetalle();                           // cierra la ventana para que se vea el mensaje de error
    mostrarError(error);
  }
}

// Cierra la ventana de detalle.
function cerrarDetalle() {
  detalle.hidden = true;
}

// ---------- 4. Acciones principales ----------

// Buscar por nombre.
async function buscarPorNombre(evento) {
  evento.preventDefault();                     // evita que el formulario recargue la pagina
  const nombre = campoBusqueda.value.trim();   // trim quita espacios al inicio y al final
  if (!nombre) {
    mostrarMensaje('Escribe el nombre de un platillo para buscar.');
    return;
  }
  selectorCategoria.value = '';                // limpia el filtro para no confundir al usuario
  mostrarCargando('Cargando...');
  try {
    const datos = await pedirJson('/api/buscar?nombre=' + encodeURIComponent(nombre));
    mostrarLista(datos.meals, 'Resultados para "' + nombre + '"');
  } catch (error) {
    mostrarError(error);
  }
}

// Filtrar por la categoria elegida en la lista desplegable.
async function filtrarPorCategoria() {
  const categoria = selectorCategoria.value;
  if (!categoria) return;                      // si eligio la opcion vacia, no hace nada
  campoBusqueda.value = '';                    // limpia el buscador
  mostrarCargando('Cargando...');
  try {
    const datos = await pedirJson('/api/filtrar?categoria=' + encodeURIComponent(categoria));
    mostrarLista(datos.meals, 'Categoría: ' + categoria);
  } catch (error) {
    mostrarError(error);
  }
}

// Receta aleatoria (boton "Sorprendeme"): se muestra directo en el detalle.
async function recetaAleatoria() {
  mostrarDetalleCargando();
  try {
    const datos = await pedirJson('/api/aleatoria');
    if (!datos.meals) {
      cerrarDetalle();
      mostrarMensaje('No encontramos recetas');
      return;
    }
    mostrarDetalle(datos.meals[0]);
  } catch (error) {
    cerrarDetalle();
    mostrarError(error);
  }
}

// Carga la lista de categorias al abrir la pagina y llena el desplegable.
async function cargarCategorias() {
  try {
    const datos = await pedirJson('/api/categorias');
    if (!datos.categories) return;
    for (const categoria of datos.categories) {
      const opcion = document.createElement('option');  // <option>
      opcion.value = categoria.strCategory;               // valor que se enviara al servidor
      opcion.textContent = categoria.strCategory;         // texto que ve el usuario
      selectorCategoria.append(opcion);
    }
  } catch (error) {
    // Si fallan las categorias, el buscador sigue sirviendo; solo avisamos del problema
    mostrarError(error);
  }
}

// ---------- 5. Conectar los eventos ----------
formulario.addEventListener('submit', buscarPorNombre);          // Enter o boton Buscar
selectorCategoria.addEventListener('change', filtrarPorCategoria); // al elegir una categoria
botonAleatoria.addEventListener('click', recetaAleatoria);       // boton Sorprendeme
botonCerrar.addEventListener('click', cerrarDetalle);            // boton X

// Cerrar al hacer clic en el fondo oscuro (fuera de la ventana blanca)
detalle.addEventListener('click', (evento) => {
  if (evento.target === detalle) cerrarDetalle();
});

// Cerrar con la tecla Escape
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !detalle.hidden) cerrarDetalle();
});

// ---------- 6. Al abrir la pagina ----------
cargarCategorias();
