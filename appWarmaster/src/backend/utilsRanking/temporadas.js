// utilsRanking/temporadas.js

const MES_INICIO_TEMPORADA = 9;  // Septiembre
const DIA_INICIO_TEMPORADA = 15;

/**
 * Año de temporada al que pertenece una fecha.
 * Temporadas: 15 de septiembre → 14 de septiembre del año siguiente.
 *
 * Ej: 20/10/2026 → 2026 (2026-09-15 a 2027-09-14)
 *     10/03/2026 → 2025 (2025-09-15 a 2026-09-14)
 */
export function obtenerAñoTemporada(fecha = new Date()) {
  const ano = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  const yaEmpezoTemporadaEsteAño =
    mes > MES_INICIO_TEMPORADA ||
    (mes === MES_INICIO_TEMPORADA && dia >= DIA_INICIO_TEMPORADA);

  return yaEmpezoTemporadaEsteAño ? ano : ano - 1;
}

/**
 * Fechas de inicio/fin (YYYY-MM-DD) de una temporada anual.
 */
export function obtenerFechasTemporada(anoTemporada) {
  return {
    fechaInicio: `${anoTemporada}-09-15`,
    fechaFin: `${anoTemporada + 1}-09-14`
  };
}

/**
 * Temporada ANUAL que corresponde a una fecha.
 * Si no existe, la crea. Solo la marca como activa si es la temporada actual.
 */
export async function obtenerOCrearTemporada(connRanking, sistemaJuego, fechaReferencia = new Date()) {
  const anoTemporada = obtenerAñoTemporada(fechaReferencia);

  let [temporada] = await connRanking.query(
    `SELECT * FROM temporadas
     WHERE año = ? AND sistema_juego = ? AND tipo = 'anual'
     LIMIT 1`,
    [anoTemporada, sistemaJuego]
  );

  if (temporada.length > 0) {
    return temporada[0];
  }

  const { fechaInicio, fechaFin } = obtenerFechasTemporada(anoTemporada);
  const nombre = `${sistemaJuego.toUpperCase()} - Temporada ${anoTemporada}-${anoTemporada + 1}`;
  const esTemporadaActual = anoTemporada === obtenerAñoTemporada();

  try {
    if (esTemporadaActual) {
      await connRanking.query(
        `UPDATE temporadas SET activa = FALSE
         WHERE sistema_juego = ? AND activa = TRUE AND tipo = 'anual'`,
        [sistemaJuego]
      );
    }

    const [result] = await connRanking.query(
      `INSERT INTO temporadas
         (nombre, año, sistema_juego, fecha_inicio, fecha_fin, activa, elo_inicial, tipo)
       VALUES (?, ?, ?, ?, ?, ?, 1500, 'anual')`,
      [nombre, anoTemporada, sistemaJuego, fechaInicio, fechaFin, esTemporadaActual]
    );

    [temporada] = await connRanking.query('SELECT * FROM temporadas WHERE id = ?', [result.insertId]);
    return temporada[0];

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      [temporada] = await connRanking.query(
        `SELECT * FROM temporadas
         WHERE año = ? AND sistema_juego = ? AND tipo = 'anual'
         LIMIT 1`,
        [anoTemporada, sistemaJuego]
      );
      return temporada[0];
    }
    throw error;
  }
}

/**
 * Temporada GENERAL: ELO histórico que nunca se reinicia.
 * Una por sistema de juego, con año = 0.
 */
export async function obtenerOCrearTemporadaGeneral(connRanking, sistemaJuego) {
  let [temporada] = await connRanking.query(
    `SELECT * FROM temporadas WHERE tipo = 'general' AND sistema_juego = ? LIMIT 1`,
    [sistemaJuego]
  );

  if (temporada.length > 0) {
    return temporada[0];
  }

  try {
    const [result] = await connRanking.query(
      `INSERT INTO temporadas
         (nombre, año, sistema_juego, fecha_inicio, fecha_fin, activa, elo_inicial, tipo)
       VALUES (?, 0, ?, NULL, NULL, FALSE, 1500, 'general')`,
      [`${sistemaJuego.toUpperCase()} - General`, sistemaJuego]
    );

    [temporada] = await connRanking.query('SELECT * FROM temporadas WHERE id = ?', [result.insertId]);
    return temporada[0];

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      [temporada] = await connRanking.query(
        `SELECT * FROM temporadas WHERE tipo = 'general' AND sistema_juego = ? LIMIT 1`,
        [sistemaJuego]
      );
      return temporada[0];
    }
    throw error;
  }
}