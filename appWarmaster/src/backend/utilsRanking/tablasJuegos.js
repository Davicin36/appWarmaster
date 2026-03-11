// utils/tablasJuegos.js

/**
 * Obtiene los nombres de las tablas según el sistema de juego
 */
export function obtenerTablas(sistemaJuego) {
  const sistema = sistemaJuego.toLowerCase().trim();
  
  return {
    partidas: `partidas_${sistema}`,
    jugadorTorneo: `jugador_torneo_${sistema}`,
    clasificacion: `clasificacion_jugadores_${sistema}`,
    sistema: sistema
  };
}

/**
 * Valida que un sistema de juego sea válido
 */
export function validarSistemaJuego(sistemaJuego) {
  const sistemasValidos = [
    'saga',
    'warmaster',
    'fow',
    'epic',        // ← añadido
    'bolt_action'
  ];
  
  const sistema = sistemaJuego.toLowerCase().trim();
  return sistemasValidos.includes(sistema);
}

/**
 * Obtiene todos los sistemas de juego disponibles
 */
export async function obtenerSistemasDisponibles(pool) {
  try {
    const [sistemas] = await pool.query(`
      SELECT DISTINCT sistema 
      FROM torneos_sistemas 
      WHERE sistema IS NOT NULL AND sistema != ''
      ORDER BY sistema
    `);
    
    return sistemas.map(s => s.sistema.toLowerCase());
  } catch (error) {
    console.error('Error obteniendo sistemas:', error);
    return [];
  }
}

/**
 * Obtiene el ID del jugador a partir de jugador_torneo_X
 * Esto es importante porque las tablas jugador_torneo_X referencian a usuarios.id
 */
export async function obtenerJugadorIdDesdeParticipacion(pool, partidaJugadorId, sistemaJuego) {
  const tablas = obtenerTablas(sistemaJuego);
  
  try {
    const [resultado] = await pool.query(
      `SELECT jugador_id FROM ${tablas.jugadorTorneo} WHERE id = ?`,
      [partidaJugadorId]
    );
    
    if (resultado.length > 0) {
      return resultado[0].jugador_id;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo jugador_id:', error);
    return null;
  }
}