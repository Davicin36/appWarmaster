// utilsRanking/configRanking.js

/**
 * Lista de sistemas con ranking activo (en minúsculas).
 */
export async function obtenerSistemasActivos(connRanking) {
  const [rows] = await connRanking.query(
    'SELECT sistema_juego FROM configuracion_ranking WHERE activo = TRUE'
  );
  return rows.map(r => r.sistema_juego.toLowerCase());
}

/**
 * ¿Está activo el ranking de este sistema?
 */
export async function rankingActivo(connRanking, sistema) {
  const [rows] = await connRanking.query(
    'SELECT activo FROM configuracion_ranking WHERE sistema_juego = ?',
    [String(sistema || '').toLowerCase()]
  );
  return rows.length > 0 && !!rows[0].activo;
}