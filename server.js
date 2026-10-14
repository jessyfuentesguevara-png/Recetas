// ============================================================
// server.js - Servidor Express de la app de recetas (Fase 1)
// ============================================================

// Carga las variables del archivo .env (como MEALDB_API_KEY) en process.env.
// Debe ir lo mas arriba posible para que el resto del codigo ya las pueda leer.
require('dotenv').config();

// Importa Express, la libreria que nos permite crear el servidor web.
const express = require('express');

// Importa "path", un modulo que viene con Node para armar rutas de carpetas
// que funcionen igual en Windows, Mac y Linux.
const path = require('path');

// Crea la aplicacion de Express (nuestro servidor).
const app = express();

// Puerto donde escuchara el servidor: el del .env si existe, y si no, el 3000.
const PUERTO = process.env.PORT || 3000;

// Lee la clave de la API desde el .env. Asi nunca queda escrita en el codigo.
const API_KEY = process.env.MEALDB_API_KEY;

// Si no hay clave, avisamos con un mensaje claro y detenemos el programa.
// (process.exit(1) significa "terminar con error").
if (!API_KEY) {
  console.error('Falta MEALDB_API_KEY. Copia .env.example como .env y escribe tu clave.');
  process.exit(1);
}

// Le dice a Express que sirva como pagina web todo lo que haya en la carpeta "public"
// (ahi estaran el HTML, CSS y JavaScript del frontend en fases posteriores).
// __dirname es la carpeta donde esta este archivo server.js.
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba: al entrar a /api/salud responde con un JSON.
// Sirve para comprobar que el servidor esta vivo. Nunca se envia la clave.
app.get('/api/salud', (req, res) => {
  res.json({ ok: true, mensaje: 'El servidor esta funcionando' });
});

// ------------------------------------------------------------
// FASE 2: rutas que consultan TheMealDB
// ------------------------------------------------------------

// Direccion base de la API. La clave se pega aqui, en el servidor,
// para que el navegador nunca la vea.
const URL_BASE = `https://www.themealdb.com/api/json/v1/${API_KEY}`;

// Funcion auxiliar: le pide un dato a TheMealDB y entrega el JSON ya convertido.
// "async" permite usar "await" para esperar la respuesta sin congelar el servidor.
// Recibe la parte final de la direccion, por ejemplo "/search.php?s=pasta".
async function consultarApi(rutaFinal) {
  // fetch hace la peticion HTTP. Si no hay internet, lanza un error aqui mismo.
  const respuesta = await fetch(URL_BASE + rutaFinal);

  // respuesta.ok es true solo si el codigo HTTP es 200-299.
  // Si no lo es (por ejemplo 429 o 500), creamos un error que lleva el codigo.
  if (!respuesta.ok) {
    const error = new Error('La API respondio con error');
    error.status = respuesta.status; // guardamos el codigo para usarlo despues
    throw error;
  }

  // Convierte el texto de la respuesta a un objeto de JavaScript.
  const datos = await respuesta.json();

  // La API devuelve { meals: null } cuando no hay resultados.
  // A veces podria devolver otra cosa que no sea lista (suposicion mia),
  // asi que solo aceptamos un arreglo; en cualquier otro caso usamos null.
  return Array.isArray(datos.meals) ? datos.meals : null;
}

// Funcion auxiliar: decide que contestarle al navegador cuando algo falla.
function responderError(res, error) {
  // Si la API nos limito las peticiones (429), se lo avisamos al navegador tal cual.
  if (error.status === 429) {
    return res.status(429).json({ error: 'limite' });
  }
  // Si la API respondio con otro error (500, 503, etc.), usamos 502 ("mala puerta de enlace").
  if (error.status) {
    return res.status(502).json({ error: 'api' });
  }
  // Si no hay codigo, fallo la conexion misma (sin internet, DNS, etc.).
  res.status(503).json({ error: 'conexion' });
}

// GET /api/buscar?nombre=pasta -> busca recetas por nombre.
app.get('/api/buscar', async (req, res) => {
  // Lee el parametro "nombre" de la direccion; si no viene, usa texto vacio.
  const nombre = (req.query.nombre || '').trim();
  // Si esta vacio, respondemos 400 ("peticion incorrecta") sin molestar a la API.
  if (!nombre) {
    return res.status(400).json({ error: 'falta_nombre' });
  }
  try {
    // encodeURIComponent convierte espacios y acentos a un formato seguro para URLs.
    const recetas = await consultarApi(`/search.php?s=${encodeURIComponent(nombre)}`);
    res.json({ meals: recetas }); // si no hubo resultados, meals sera null
  } catch (error) {
    responderError(res, error);
  }
});

// GET /api/categorias -> lista todas las categorias.
app.get('/api/categorias', async (req, res) => {
  try {
    // categories.php trae las categorias con imagen y descripcion,
    // pero su respuesta usa "categories" en vez de "meals", asi que la leemos aparte.
    const respuesta = await fetch(`${URL_BASE}/categories.php`);
    if (!respuesta.ok) {
      const error = new Error('La API respondio con error');
      error.status = respuesta.status;
      throw error;
    }
    const datos = await respuesta.json();
    // Si no viene una lista valida, mandamos null.
    res.json({ categories: Array.isArray(datos.categories) ? datos.categories : null });
  } catch (error) {
    responderError(res, error);
  }
});

// GET /api/filtrar?categoria=Seafood -> recetas de una categoria (solo nombre, foto e id).
app.get('/api/filtrar', async (req, res) => {
  const categoria = (req.query.categoria || '').trim();
  if (!categoria) {
    return res.status(400).json({ error: 'falta_categoria' });
  }
  try {
    const recetas = await consultarApi(`/filter.php?c=${encodeURIComponent(categoria)}`);
    res.json({ meals: recetas });
  } catch (error) {
    responderError(res, error);
  }
});

// GET /api/receta/52772 -> detalle completo de una receta por su id.
app.get('/api/receta/:id', async (req, res) => {
  const id = req.params.id;
  // Validamos que el id sean solo numeros, para no mandar basura a la API.
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'id_invalido' });
  }
  try {
    const recetas = await consultarApi(`/lookup.php?i=${id}`);
    res.json({ meals: recetas });
  } catch (error) {
    responderError(res, error);
  }
});

// GET /api/aleatoria -> una receta al azar (boton "Sorprendeme").
app.get('/api/aleatoria', async (req, res) => {
  try {
    const recetas = await consultarApi('/random.php');
    res.json({ meals: recetas });
  } catch (error) {
    responderError(res, error);
  }
});

// Arranca el servidor y avisa en la consola en que direccion quedo disponible.
app.listen(PUERTO, () => {
  console.log(`Servidor listo en http://localhost:${PUERTO}`);
});
