// ============================================================
// app.js - Logica del frontend
// Busca, filtra por categoria, muestra el detalle, trae recetas aleatorias
// y muestra recetas "para inspirarte" al abrir la pagina.
// Habla SOLO con nuestro servidor (/api/...), nunca directo con TheMealDB.
// ============================================================

// ---------- 1. Referencias a los elementos de la pagina ----------
// getElementById busca un elemento del HTML por su id y lo guarda en una constante.
const formulario = document.getElementById('formulario-busqueda');
const campoBusqueda = document.getElementById('campo-busqueda');
const selectorCategoria = document.getElementById('selector-categoria');
const listaCategorias = document.getElementById('lista-categorias');
const botonAleatoria = document.getElementById('boton-aleatoria');
const tituloResultados = document.getElementById('titulo-resultados');
const mensaje = document.getElementById('mensaje');
const resultados = document.getElementById('resultados');
const detalle = document.getElementById('detalle');
const botonCerrar = document.getElementById('cerrar-detalle');
const detalleTitulo = document.getElementById('detalle-titulo');
const detalleImagen = document.getElementById('detalle-imagen');
const detalleInfo = document.getElementById('detalle-info');
const detalleIngredientes = document.getElementById('detalle-ingredientes');
const detalleInstrucciones = document.getElementById('detalle-instrucciones');

// "Turno": un contador que sube cada vez que se pide una lista nueva.
// Sirve para ignorar respuestas viejas: si haces dos busquedas muy seguidas,
// solo se dibuja la ultima aunque la primera tarde mas en llegar.
let turno = 0;

// Texto del mensaje inicial
const MENSAJE_INICIAL = 'Escribe un platillo o elige una categoría para empezar.';

// Nombres de las categorias en espanol. TheMealDB las manda en ingles y son siempre las mismas 14,
// asi que las traducimos con este diccionario (gratis, sin cuentas y sin limites).
const CATEGORIAS_ES = {
  Beef: 'Res',
  Breakfast: 'Desayunos',
  Chicken: 'Pollo',
  Dessert: 'Postres',
  Goat: 'Cabra',
  Lamb: 'Cordero',
  Miscellaneous: 'Variados',
  Pasta: 'Pasta',
  Pork: 'Cerdo',
  Seafood: 'Mariscos',
  Side: 'Guarniciones',
  Starter: 'Entradas',
  Vegan: 'Vegano',
  Vegetarian: 'Vegetariano'
};

// Origenes de las recetas (nacionalidades y paises) en espanol. TheMealDB manda uno u otro,
// por ejemplo "Italian" o "Italy". Si llega uno que no esta aqui, se muestra tal cual.
const ORIGENES_ES = {
  // Nacionalidades (como "cocina italiana")
  American: 'Estadounidense', Argentinian: 'Argentina', Algerian: 'Argelina', British: 'Británica',
  Canadian: 'Canadiense', Chinese: 'China', Croatian: 'Croata', Dutch: 'Holandesa',
  Egyptian: 'Egipcia', Filipino: 'Filipina', French: 'Francesa', German: 'Alemana',
  Greek: 'Griega', Indian: 'India', Irish: 'Irlandesa', Italian: 'Italiana',
  Jamaican: 'Jamaiquina', Japanese: 'Japonesa', Kenyan: 'Keniana', Malaysian: 'Malasia',
  Mexican: 'Mexicana', Moroccan: 'Marroquí', Norwegian: 'Noruega', Polish: 'Polaca',
  Portuguese: 'Portuguesa', Russian: 'Rusa', Slovakian: 'Eslovaca', Spanish: 'Española',
  Syrian: 'Siria', Thai: 'Tailandesa', Tunisian: 'Tunecina', Turkish: 'Turca',
  Ukrainian: 'Ucraniana', Uruguayan: 'Uruguaya', Venezuelan: 'Venezolana', Vietnamese: 'Vietnamita',
  // Paises
  Algeria: 'Argelia', Argentina: 'Argentina', Belgium: 'Bélgica', Brazil: 'Brasil',
  Bulgaria: 'Bulgaria', Canada: 'Canadá', China: 'China', Croatia: 'Croacia',
  Denmark: 'Dinamarca', Egypt: 'Egipto', France: 'Francia', Germany: 'Alemania',
  Greece: 'Grecia', India: 'India', Ireland: 'Irlanda', Italy: 'Italia',
  Jamaica: 'Jamaica', Japan: 'Japón', Kenya: 'Kenia', Malaysia: 'Malasia',
  Mexico: 'México', Morocco: 'Marruecos', Netherlands: 'Países Bajos', Norway: 'Noruega',
  Philippines: 'Filipinas', Poland: 'Polonia', Portugal: 'Portugal', Russia: 'Rusia',
  Slovakia: 'Eslovaquia', Spain: 'España', Syria: 'Siria', Thailand: 'Tailandia',
  Tunisia: 'Túnez', Turkey: 'Turquía', Ukraine: 'Ucrania', 'United Kingdom': 'Reino Unido',
  'United States': 'Estados Unidos', Uruguay: 'Uruguay', Venezuela: 'Venezuela', Vietnam: 'Vietnam'
};

// Devuelve el nombre de la categoria en espanol (o el mismo texto si no esta en el diccionario).
function categoriaEnEspanol(nombre) {
  return CATEGORIAS_ES[nombre] || nombre;
}

// Devuelve el origen en espanol (o el mismo texto si no esta en el diccionario).
function origenEnEspanol(nombre) {
  return ORIGENES_ES[nombre] || nombre;
}

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

// Escribe un texto normal en la zona de mensajes. Con texto vacio, el mensaje se oculta.
function mostrarMensaje(texto) {
  mensaje.textContent = texto;                 // textContent pone texto plano (seguro)
  mensaje.className = 'mensaje';               // quita los estilos de "cargando" o "error"
}

// Muestra "No encontramos recetas" con una frase de apoyo debajo.
function mostrarVacio() {
  resultados.replaceChildren();                // quita las tarjetas anteriores
  const apoyo = document.createElement('span');
  apoyo.className = 'mensaje-secundario';
  apoyo.textContent = 'Prueba con otro nombre o categoría';
  // replaceChildren pone el texto principal y la frase de apoyo dentro del mensaje
  mensaje.replaceChildren('No encontramos recetas', apoyo);
  mensaje.className = 'mensaje';
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

// ---------- 3. Tarjetas de recetas ----------

// Devuelve las etiquetas de una receta (categoria y pais), sin valores vacios.
// "categoriaElegida" se usa cuando la API no manda categoria (pasa al filtrar por categoria).
function obtenerEtiquetas(receta, categoriaElegida) {
  const categoria = receta.strCategory || categoriaElegida;
  const origen = receta.strArea || receta.strCountry;
  const etiquetas = [];
  // Agregamos cada etiqueta solo si existe, ya traducida al espanol.
  // (La API a veces manda el valor "Unknown", que tampoco se muestra.)
  if (categoria) etiquetas.push(categoriaEnEspanol(categoria));
  if (origen && origen !== 'Unknown') etiquetas.push(origenEnEspanol(origen));
  return etiquetas;
}

// Dibuja las tarjetas de una lista de recetas (foto, nombre y etiquetas).
function mostrarTarjetas(recetas, categoriaElegida) {
  resultados.replaceChildren();                // vacia las tarjetas anteriores

  for (const receta of recetas) {              // recorre cada receta de la lista
    // Crea la tarjeta: <article class="tarjeta">
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';
    tarjeta.tabIndex = 0;                      // permite llegar a ella con la tecla Tab

    // Marco de la foto (sirve para recortar el zoom al pasar el mouse)
    const marcoFoto = document.createElement('div');
    marcoFoto.className = 'tarjeta-foto';

    // Crea la foto
    const imagen = document.createElement('img');
    imagen.src = receta.strMealThumb;          // direccion de la foto
    imagen.alt = receta.strMeal;               // texto alternativo (accesibilidad)
    imagen.loading = 'lazy';                   // carga la foto solo cuando esta por verse
    marcoFoto.append(imagen);

    // Zona de texto: nombre y etiquetas
    const info = document.createElement('div');
    info.className = 'tarjeta-info';

    const titulo = document.createElement('h3');
    titulo.textContent = receta.strMeal;
    info.append(titulo);

    const contenedorEtiquetas = document.createElement('div');
    contenedorEtiquetas.className = 'etiquetas';
    for (const texto of obtenerEtiquetas(receta, categoriaElegida)) {
      const etiqueta = document.createElement('span');
      etiqueta.className = 'etiqueta';
      etiqueta.textContent = texto;
      contenedorEtiquetas.append(etiqueta);
    }
    info.append(contenedorEtiquetas);

    // Mete todo dentro de la tarjeta, y la tarjeta en la pagina
    tarjeta.append(marcoFoto, info);
    resultados.append(tarjeta);

    // Al hacer clic (o Enter con el teclado), abre el detalle de esa receta
    tarjeta.addEventListener('click', () => abrirDetalle(receta.idMeal));
    tarjeta.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') abrirDetalle(receta.idMeal);
    });
  }
}

// Muestra una lista de recetas, o el aviso de "sin resultados" si no hay ninguna.
function mostrarLista(recetas, titulo, categoriaElegida) {
  if (!recetas) {                              // la API manda null cuando no hay nada
    tituloResultados.textContent = 'Resultados de recetas';
    mostrarVacio();
    return;
  }
  tituloResultados.textContent = titulo;       // actualiza el titulo de la seccion
  mostrarMensaje('');                          // oculta el mensaje: ya hay resultados
  mostrarTarjetas(recetas, categoriaElegida);
}

// ---------- 4. Detalle de una receta ----------

// Llena la ventana de detalle con los datos de una receta y la muestra.
function mostrarDetalle(receta) {
  detalleTitulo.textContent = receta.strMeal;
  detalleImagen.hidden = false;                // la foto se oculta mientras carga; aqui se vuelve a mostrar
  detalleImagen.src = receta.strMealThumb;
  detalleImagen.alt = receta.strMeal;

  // Categoria y origen; filter(Boolean) descarta los que vengan vacios o null.
  const datos = [categoriaEnEspanol(receta.strCategory), origenEnEspanol(receta.strArea || receta.strCountry)];
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
    // Formato "Ingrediente: medida" (por ejemplo "Sal: al gusto" o "Harina: 2 tazas").
    // Asi suena natural en espanol sin importar el genero ni el tipo de medida.
    // Si no hay medida, se muestra solo el ingrediente.
    const nombre = ingrediente.trim();
    const nombreConMayuscula = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    item.textContent = medida && medida.trim() ? nombreConMayuscula + ': ' + medida.trim() : nombreConMayuscula;
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
      mostrarVacio();
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

// ---------- 5. Circulos de categorias ----------

// Un emoji para cada categoria que manda TheMealDB. Si llega una nueva, usa el plato.
const ICONOS_CATEGORIA = {
  Todas: '🍴',
  Beef: '🥩',
  Breakfast: '🥞',
  Chicken: '🍗',
  Dessert: '🍰',
  Goat: '🐐',
  Lamb: '🐑',
  Miscellaneous: '🍽️',
  Pasta: '🍝',
  Pork: '🥓',
  Seafood: '🐟',
  Side: '🥗',
  Starter: '🥣',
  Vegan: '🌱',
  Vegetarian: '🥦'
};

// Los cuatro colores de la paleta que se reparten entre los circulos (ver estilos.css).
const COLORES_CIRCULO = ['color-oliva', 'color-terracota', 'color-mostaza', 'color-crema'];

// Dibuja un circulo por categoria, empezando por "Todas".
function dibujarCategorias(categorias) {
  listaCategorias.replaceChildren();
  // Creamos una lista con "Todas" al inicio (su valor vacio significa "sin filtro")
  const nombres = [''].concat(categorias.map((categoria) => categoria.strCategory));

  nombres.forEach((nombre, posicion) => {
    const etiquetaTexto = nombre || 'Todas';

    // El circulo es un boton, para que se pueda usar con el teclado
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'categoria-item';
    boton.dataset.categoria = nombre;          // guarda el nombre dentro del propio boton

    const circulo = document.createElement('span');
    circulo.className = 'categoria-circulo ' + COLORES_CIRCULO[posicion % COLORES_CIRCULO.length];

    const icono = document.createElement('span');
    icono.textContent = ICONOS_CATEGORIA[etiquetaTexto] || '🍽️';
    icono.setAttribute('aria-hidden', 'true'); // el emoji es decorativo; el nombre ya esta debajo
    circulo.append(icono);

    const nombreVisible = document.createElement('span');
    nombreVisible.textContent = nombre ? categoriaEnEspanol(nombre) : 'Todas'; // el nombre que se ve, en espanol

    boton.append(circulo, nombreVisible);
    listaCategorias.append(boton);

    // Al hacer clic, se elige esa categoria (igual que desde la lista desplegable)
    boton.addEventListener('click', () => elegirCategoria(nombre));
  });

  marcarCategoriaActiva(selectorCategoria.value);
}

// Resalta el circulo de la categoria elegida y quita el resalte a los demas.
function marcarCategoriaActiva(nombre) {
  for (const boton of listaCategorias.querySelectorAll('.categoria-item')) {
    const esActiva = boton.dataset.categoria === nombre;
    boton.classList.toggle('activa', esActiva);
    boton.setAttribute('aria-pressed', String(esActiva)); // avisa a los lectores de pantalla
  }
}

// Elige una categoria desde un circulo: actualiza la lista desplegable y filtra.
function elegirCategoria(nombre) {
  selectorCategoria.value = nombre;
  filtrarPorCategoria();
}

// ---------- 6. Acciones principales ----------

// Buscar por nombre.
async function buscarPorNombre(evento) {
  evento.preventDefault();                     // evita que el formulario recargue la pagina
  const nombre = campoBusqueda.value.trim();   // trim quita espacios al inicio y al final
  if (!nombre) {
    mostrarMensaje('Escribe el nombre de un platillo para buscar.');
    return;
  }
  selectorCategoria.value = '';                // limpia el filtro para no confundir al usuario
  marcarCategoriaActiva('');
  const miTurno = ++turno;                     // este es el turno de esta busqueda
  tituloResultados.textContent = 'Resultados de recetas';
  mostrarCargando('Cargando...');
  try {
    const datos = await pedirJson('/api/buscar?nombre=' + encodeURIComponent(nombre));
    if (miTurno !== turno) return;             // llego tarde: ya hay una peticion mas nueva
    mostrarLista(datos.meals, 'Resultados para "' + nombre + '"', '');
  } catch (error) {
    if (miTurno !== turno) return;
    mostrarError(error);
  }
}

// Filtrar por la categoria elegida (lista desplegable o circulos).
async function filtrarPorCategoria() {
  const categoria = selectorCategoria.value;
  marcarCategoriaActiva(categoria);
  campoBusqueda.value = '';                    // limpia el buscador
  if (!categoria) {                            // "Todas las categorias": volvemos al inicio
    cargarInspiracion();
    return;
  }
  const miTurno = ++turno;
  tituloResultados.textContent = 'Resultados de recetas';
  mostrarCargando('Cargando...');
  try {
    const datos = await pedirJson('/api/filtrar?categoria=' + encodeURIComponent(categoria));
    if (miTurno !== turno) return;
    mostrarLista(datos.meals, 'Categoría: ' + categoriaEnEspanol(categoria), categoria);
  } catch (error) {
    if (miTurno !== turno) return;
    mostrarError(error);
  }
}

// Al abrir la pagina (o elegir "Todas"): muestra hasta 4 recetas aleatorias reales.
async function cargarInspiracion() {
  const miTurno = ++turno;
  tituloResultados.textContent = 'Para inspirarte';
  mostrarCargando('Cargando...');

  // Hacemos 4 peticiones al mismo tiempo. allSettled espera a todas y nos dice
  // cuales salieron bien y cuales fallaron, sin detenerse si una falla.
  const intentos = await Promise.allSettled([
    pedirJson('/api/aleatoria'),
    pedirJson('/api/aleatoria'),
    pedirJson('/api/aleatoria'),
    pedirJson('/api/aleatoria')
  ]);
  if (miTurno !== turno) return;               // el usuario ya hizo otra cosa

  // Nos quedamos con las recetas que llegaron bien, sin repetir ninguna
  const recetas = [];
  for (const intento of intentos) {
    if (intento.status !== 'fulfilled' || !intento.value.meals) continue;
    const receta = intento.value.meals[0];
    if (!recetas.some((existente) => existente.idMeal === receta.idMeal)) {
      recetas.push(receta);
    }
  }

  if (recetas.length === 0) {                  // no llego ninguna
    const fallo = intentos.find((intento) => intento.status === 'rejected');
    if (fallo) mostrarError(fallo.reason);     // avisamos del tipo de error real
    else mostrarVacio();
    return;
  }

  mostrarTarjetas(recetas, '');
  mostrarMensaje(MENSAJE_INICIAL);             // pista debajo del titulo
}

// Receta aleatoria (boton "Sorprendeme"): se muestra directo en el detalle.
async function recetaAleatoria() {
  mostrarDetalleCargando();
  try {
    const datos = await pedirJson('/api/aleatoria');
    if (!datos.meals) {
      cerrarDetalle();
      mostrarVacio();
      return;
    }
    mostrarDetalle(datos.meals[0]);
  } catch (error) {
    cerrarDetalle();
    mostrarError(error);
  }
}

// Carga la lista de categorias al abrir la pagina y llena el desplegable y los circulos.
async function cargarCategorias() {
  try {
    const datos = await pedirJson('/api/categorias');
    if (!datos.categories) return;
    for (const categoria of datos.categories) {
      const opcion = document.createElement('option');  // <option>
      opcion.value = categoria.strCategory;               // valor que se enviara al servidor
      opcion.textContent = categoriaEnEspanol(categoria.strCategory); // texto que ve el usuario, en espanol
      selectorCategoria.append(opcion);
    }
    dibujarCategorias(datos.categories);
  } catch (error) {
    // Si fallan las categorias, el buscador sigue sirviendo; solo avisamos del problema
    mostrarError(error);
  }
}

// ---------- 7. Conectar los eventos ----------
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

// ---------- 8. Al abrir la pagina ----------
cargarCategorias();
cargarInspiracion();
