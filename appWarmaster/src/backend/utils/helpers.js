// utils/helpers.js

// Función para validar email
const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para validar que una fecha no sea en el pasado
const validarFecha = (fecha) => {
  const fechaInput = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
  return fechaInput >= hoy;
};

// Función para formatear respuesta de error
const successResponse = (message, data = null) => {
  const response = { 
    success: true,
    mensaje: message 
  };
  if (data) response.data = data;
  return response;
};

// ✅ CORRECTO - Con success: false y mensaje consistente
const errorResponse = (message, details = null) => {
  const response = { 
    success: false,  
    mensaje: message  
  };
  if (details) response.details = details;
  return response;
};

// Función para validar campos requeridos
const validarCamposRequeridos = (objeto, camposRequeridos) => {
  const camposFaltantes = [];
  
  camposRequeridos.forEach(campo => {
    if (!objeto[campo] || objeto[campo].toString().trim() === '') {
      camposFaltantes.push(campo);
    }
  });
  
  return camposFaltantes;
};

// Función para limpiar objeto de campos undefined/null
const limpiarObjeto = (objeto) => {
  const objetoLimpio = {};
  Object.keys(objeto).forEach(key => {
    if (objeto[key] !== undefined && objeto[key] !== null) {
      objetoLimpio[key] = objeto[key];
    }
  });
  return objetoLimpio;
};

// Función para generar slug único
const generarSlug = (texto) => {
  return texto
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover múltiples guiones
    .trim('-'); // Remover guiones al inicio/final
};

// Función para manejar errores de base de datos
const manejarErrorDB = (error) => {
  console.error('Error de base de datos:', error);
  
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return 'Ya existe un registro con esos datos.';
    case 'ER_NO_REFERENCED_ROW_2':
      return 'Referencia a datos que no existen.';
    case 'ER_ROW_IS_REFERENCED_2':
      return 'No se puede eliminar porque está siendo usado por otros registros.';
    case 'ER_DATA_TOO_LONG':
      return 'Uno de los campos es demasiado largo.';
    case 'ER_BAD_NULL_ERROR':
      return 'Campo requerido no puede estar vacío.';
    default:
      return 'Error interno del servidor.';
  }
};

// Función para paginar resultados
const paginar = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset: parseInt(offset) };
};

const limpiarFecha = (fecha) => {
  if (!fecha || fecha.trim() === '') return null;
  return fecha;
};

//CALCULAR PUNTOS TORNEOS FOW

const tablaPuntuacionFow = [
  {rango : 1, vencedor : 6, perdedor : 1},
  {rango : 2, vencedor : 5, perdedor : 2},
  {rango : [3, Infinity], vencedor : 4, perdedor : 3}
]

const calcularPuntosTorneoFow = (pelotonesMuertosVencedor) => {
  const pelotonesMuertos = pelotonesMuertosVencedor

  const fila = tablaPuntuacionFow.find(
    pelotones => {
      if (Array.isArray(pelotones.rango)) {
        const [min, max] = pelotones.rango;
        return pelotonesMuertos >= min && pelotonesMuertos <= max; 
      } else {
        return pelotones.rango === pelotonesMuertos;
      }
    });

  return fila ? {
    puntosVencedor : fila.vencedor,
    puntosPerdedor : fila.perdedor
  } : {
    puntosVencedor : 0,
    puntosPerdedor : 0
  }
}

//CALCULAR PUNTOS TORNEOS SAGA

const tablaPuntuacionSaga = [
    {rango : [0, 0], vencedor : 10.5 , perdedor : 10},
    {rango : [1, 3], vencedor : 11, perdedor : 9}, 
    {rango : [4, 6], vencedor : 12, perdedor : 8}, 
    {rango : [7, 10], vencedor : 13, perdedor : 7}, 
    {rango : [11, 15], vencedor : 14, perdedor : 6}, 
    {rango : [16, 20], vencedor : 15, perdedor : 5}, 
    {rango : [21, 25], vencedor : 16, perdedor : 4}, 
    {rango : [26, 30], vencedor : 17, perdedor : 3}, 
    {rango : [31, 35], vencedor : 18, perdedor : 2},
    {rango : [36, Infinity], vencedor : 19, perdedor : 1}, 
]

// Función para calcular el resultado de una partida
const calcularPuntosTorneo = (puntosPartidaJ1, puntosPartidaJ2, jugador1Id, primerJugadorId) => {
    const diferencia = Math.abs(puntosPartidaJ1 - puntosPartidaJ2)
    const jugadorVencedor = puntosPartidaJ1 > puntosPartidaJ2

    //aqui consigo la puntuacion para cada jugador.
    const fila = tablaPuntuacionSaga.find(
        dif => diferencia >= dif.rango[0] && diferencia <= dif.rango[1]
    )

    if(!fila){
        throw new Error (`No se encontro un resultado adecuado para la partida, ${diferencia}`)    
    }
    //en caso de empate a 0
    if (diferencia === 0) {
      const j1PrimerJugador = jugador1Id ===primerJugadorId;
      return j1PrimerJugador
        ? { j1: 10.5, j2: 10 } 
        : { j1: 10, j2: 10.5}
    }

    // Asignar puntos según quién ganó
    return jugadorVencedor
        ? { j1: fila.vencedor, j2: fila.perdedor }
        : { j1: fila.perdedor, j2: fila.vencedor };
};


export {
  calcularPuntosTorneo,
  calcularPuntosTorneoFow,
  validarEmail,
  validarFecha,
  errorResponse,
  successResponse,
  validarCamposRequeridos,
  limpiarObjeto,
  generarSlug,
  manejarErrorDB,
  paginar,
  limpiarFecha
};
