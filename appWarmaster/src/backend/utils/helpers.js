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


const tablaPuntuacion = [
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
    const fila = tablaPuntuacion.find(
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


//FUNCION PARA ORGANIZAR Y SUMAR LOS PUNTOS PARA LA CLASIFICACION DE LOS TORNEOS
const organizarClasificacion = (jugadoresTorneo, partidasTorneo) => {
  
    const clasificacionMap = new Map()

    jugadoresTorneo.forEach (jugador => {
      clasificacionMap.set(jugador.jugador_id, {
          jugador_id: jugador.jugador_id,
          nombre: jugador.nombre,
          apellido: jugador.apellido,
          faccion: jugador.faccion,
          puntos_victoria_totales:0,
          puntos_torneo_totales:0,
          puntos_masacre_totales:0,
          partidas_jugadas: 0
    })
  })

  //para sumar los puntos de todas las partidas para cada jugador
  partidasTorneo.forEach(partida => {
    //cada partida actualiza los puntos de los dos jugadores
    const j1 = clasificacionMap.get(partida.jugador1_id)
    j1.puntos_victoria_totales += partida.puntos_victoria_j1 || 0;
    j1.puntos_torneo_totales += partida.puntos_torneo_j1 || 0;
    j1.puntos_masacre_totales += partida.puntos_masacre_j1 || 0;
    j1.warlord_muerto_veces += partida.warlord_muerto_j1 || 0;
    j1.partidas_jugadas++;

    if (partida.jugador2_id2){
      const j2 = clasificacionMap.get(partida.jugador2_id)
    j2.puntos_victoria_totales += partida.puntos_victoria_j2 || 0;
    j2.puntos_torneo_totales += partida.puntos_torneo_j2 || 0;
    j2.puntos_masacre_totales += partida.puntos_masacre_j2 || 0;
    j2.warlord_matado_veces += partida.warlord_muerto_j2 || 0;
    j2.partidas_jugadas++;
    }
  })

  //ordenamos los jugadores por sus puntaciones
  const clasificacionOrdenada = Array.from(clasificacionMap.values()).sort((a, b) =>{
    if (b.puntos_victoria_totales !== a.puntos_victoria_totales){
      return b.puntos_victoria_totales- a.puntos_victoria_totales
    }
    if (b.puntos_torneo_totales !== a.puntos_torneo_totales){
      return b.puntos_torneo_totales - a.puntos_torneo_totales
    }
    if (b.puntos_masacre_totales !== a.puntos_masacre_totales){
      return b.puntos_torneo_totales - a.puntos_torneo_totales
    }
    return b.warlord_matado_veces - a.warlord_matado_veces
  })


  return clasificacionOrdenada.map((jugador,index)=>({
    ...jugador,
    posicion: index +1
  }) )
}


module.exports = {
  calcularPuntosTorneo,
  organizarClasificacion,
  validarEmail,
  validarFecha,
  errorResponse,
  successResponse,
  validarCamposRequeridos,
  limpiarObjeto,
  generarSlug,
  manejarErrorDB,
  paginar
};
