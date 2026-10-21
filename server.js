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

// ------------------------------------------------------------
// TRADUCCIONES AL ESPANOL
// TheMealDB solo entrega las recetas en ingles. Para mostrarlas en espanol, las traducimos
// UNA SOLA VEZ y las guardamos en el archivo datos/traducciones-es.json. Asi la pagina no
// necesita cuentas, claves ni servicios de traduccion, y funciona igual en cualquier navegador.
// El archivo tiene tres partes:
//   recetas:      para cada id de receta, su nombre ("n") y sus instrucciones ("i") en espanol
//   ingredientes: diccionario  ingles -> espanol  (por ejemplo "chicken" -> "pollo")
//   medidas:      diccionario  ingles -> espanol  (por ejemplo "2 tbsp" -> "2 cucharadas")
// ------------------------------------------------------------

// "fs" (file system) es el modulo de Node que sirve para leer archivos.
const fs = require('fs');

// Si el archivo no existe, la app sigue funcionando y las recetas se muestran en ingles.
let TRADUCCIONES = { recetas: {}, ingredientes: {}, medidas: {} };
try {
  const texto = fs.readFileSync(path.join(__dirname, 'datos', 'traducciones-es.json'), 'utf8');
  TRADUCCIONES = JSON.parse(texto);
} catch (error) {
  console.log('Aviso: no se pudo leer datos/traducciones-es.json. Las recetas se mostraran en ingles.');
}

// Traduce SOLO el nombre de una receta (sirve para las listas de tarjetas).
// Si la receta no esta en el archivo, se devuelve igual que llego.
function traducirNombre(receta) {
  const es = TRADUCCIONES.recetas[receta.idMeal];
  return es ? { ...receta, strMeal: es.n } : receta;
}

// Traduce una receta COMPLETA: nombre, instrucciones, ingredientes y medidas.
function traducirReceta(receta) {
  const es = TRADUCCIONES.recetas[receta.idMeal];
  if (!es) return receta;                         // no esta en el archivo: se queda en ingles
  // Las tres rayitas "..." copian todos los campos de la receta y luego cambiamos algunos
  const traducida = { ...receta, strMeal: es.n, strInstructions: es.i };
  // TheMealDB guarda los ingredientes como strIngredient1...20 y las medidas como strMeasure1...20
  for (let i = 1; i <= 20; i++) {
    const ingrediente = (receta['strIngredient' + i] || '').trim();
    if (!ingrediente) continue;                   // casillas vacias: las saltamos
    // Buscamos cada texto en el diccionario (en minusculas); si no esta, dejamos el original
    traducida['strIngredient' + i] = TRADUCCIONES.ingredientes[ingrediente.toLowerCase()] || ingrediente;
    const medida = (receta['strMeasure' + i] || '').trim();
    if (medida) {
      traducida['strMeasure' + i] = TRADUCCIONES.medidas[medida.toLowerCase()] || medida;
    }
  }
  return traducida;
}

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
  // Lista de formas del nombre que vamos a probar, en orden.
  // TheMealDB encuentra "enchilada" pero no "enchiladas", asi que si el texto termina
  // en "es" o en "s", tambien probamos la palabra en singular.
  const candidatos = [nombre];
  if (nombre.length > 4 && nombre.toLowerCase().endsWith('es')) {
    candidatos.push(nombre.slice(0, -2)); // quita las dos ultimas letras ("es")
  }
  if (nombre.length > 3 && nombre.toLowerCase().endsWith('s')) {
    candidatos.push(nombre.slice(0, -1)); // quita la ultima letra ("s")
  }
  try {
    // Probamos cada forma hasta que alguna devuelva recetas.
    for (const candidato of candidatos) {
      // encodeURIComponent convierte espacios y acentos a un formato seguro para URLs.
      const recetas = await consultarApi(`/search.php?s=${encodeURIComponent(candidato)}`);
      if (recetas) {
        // map aplica la traduccion a cada receta de la lista
        return res.json({ meals: recetas.map(traducirReceta) });
      }
    }
    res.json({ meals: null }); // ninguna forma encontro recetas
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
    // Esta lista solo trae nombre, foto e id, asi que traducimos solo el nombre
    res.json({ meals: recetas ? recetas.map(traducirNombre) : null });
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
    res.json({ meals: recetas ? recetas.map(traducirReceta) : null });
  } catch (error) {
    responderError(res, error);
  }
});

// GET /api/aleatoria -> una receta al azar (boton "Sorprendeme").
app.get('/api/aleatoria', async (req, res) => {
  try {
    const recetas = await consultarApi('/random.php');
    res.json({ meals: recetas ? recetas.map(traducirReceta) : null });
  } catch (error) {
    responderError(res, error);
  }
});

// Arranca el servidor y avisa en la consola en que direccion quedo disponible.
app.listen(PUERTO, () => {
  console.log(`Servidor listo en http://localhost:${PUERTO}`);
});
