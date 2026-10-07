// utilsRanking/calculoAutoRanking.js
import { obtenerTablas, obtenerJugadorIdDesdeParticipacion } from './tablasJuegos.js';
import { obtenerOCrearTemporada, obtenerOCrearTemporadaGeneral } from './temporadas.js';

// ============================================
// SISTEMA ELO
// ============================================

class EloSystem {
  constructor() {
    this.K_FACTOR_BASE = 32;
    this.K_FACTOR_EXPERIENCIA = 16;
    this.UMBRAL_EXPERIENCIA = 30;
  }

  calcularKFactor(partidasJugadas) {
    return partidasJugadas >= this.UMBRAL_EXPERIENCIA
      ? this.K_FACTOR_EXPERIENCIA
      : this.K_FACTOR_BASE;
  }

  calcularProbabilidadVictoria(eloA, eloB) {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  }

  calcularNuevoElo(eloActual, probabilidad, resultado, kFactor) {
    return Math.round(eloActual + kFactor * (resultado - probabilidad));
  }

  procesarPartida(jugador1, jugador2, ganador) {
    const k1 = this.calcularKFactor(jugador1.partidasJugadas);
    const k2 = this.calcularKFactor(jugador2.partidasJugadas);

    const prob1 = this.calcularProbabilidadVictoria(jugador1.elo, jugador2.elo);
    const prob2 = this.calcularProbabilidadVictoria(jugador2.elo, jugador1.elo);

    let resultado1, resultado2, descripcion1, descripcion2;

    if (ganador === 1) {
      resultado1 = 1;   resultado2 = 0;
      descripcion1 = 'victoria'; descripcion2 = 'derrota';
    } else if (ganador === 2) {
      resultado1 = 0;   resultado2 = 1;
      descripcion1 = 'derrota';  descripcion2 = 'victoria';
    } else {
      resultado1 = 0.5; resultado2 = 0.5;
      descripcion1 = 'empate';   descripcion2 = 'empate';
    }

    const nuevoElo1 = this.calcularNuevoElo(jugador1.elo, prob1, resultado1, k1);
    const nuevoElo2 = this.calcularNuevoElo(jugador2.elo, prob2, resultado2, k2);

    return {
      jugador1: {
        eloAnterior: jugador1.elo,
        eloNuevo: nuevoElo1,
        cambio: nuevoElo1 - jugador1.elo,
        resultado: descripcion1
      },
      jugador2: {
        eloAnterior: jugador2.elo,
        eloNuevo: nuevoElo2,
        cambio: nuevoElo2 - jugador2.elo,
        resultado: descripcion2
      }
    };
  }
}

const eloSystem = new EloSystem();

// ============================================
// ELO DE UN JUGADOR EN UNA TEMPORADA
// ============================================

async function obtenerOCrearElo(connRanking, jugadorId, temporadaId, sistemaJuego, eloInicial) {
  const [existente] = await connRanking.query(
    `SELECT * FROM elo_jugadores
     WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
    [jugadorId, temporadaId, sistemaJuego]
  );

  if (existente.length > 0) {
    return existente[0];
  }

  await connRanking.query(
    `INSERT INTO elo_jugadores
       (jugador_id, temporada_id, sistema_juego, elo_actual, elo_maximo, elo_minimo,
        partidas_jugadas, victorias, derrotas, empates, warlords_muertos)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)`,
    [jugadorId, temporadaId, sistemaJuego, eloInicial, eloInicial, eloInicial]
  );

  const [nuevo] = await connRanking.query(
    `SELECT * FROM elo_jugadores
     WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
    [jugadorId, temporadaId, sistemaJuego]
  );

  return nuevo[0];
}

async function actualizarEloJugador(connRanking, jugadorId, temporadaId, sistemaJuego, nuevoElo, resultado) {
  let contador = '';
  if (resultado === 'victoria') contador = ', victorias = victorias + 1';
  else if (resultado === 'derrota') contador = ', derrotas = derrotas + 1';
  else if (resultado === 'empate') contador = ', empates = empates + 1';

  await connRanking.query(
    `UPDATE elo_jugadores
     SET elo_actual = ?,
         partidas_jugadas = partidas_jugadas + 1
         ${contador},
         elo_maximo = GREATEST(elo_maximo, ?),
         elo_minimo = LEAST(elo_minimo, ?)
     WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
    [nuevoElo, nuevoElo, nuevoElo, jugadorId, temporadaId, sistemaJuego]
  );
}

// ============================================
// HELPERS DE ESTADÍSTICAS
// ============================================

function crearStatsVacias(sistemaJuego) {
  if (sistemaJuego === 'saga') return { epocas: {}, facciones: {} };
  if (sistemaJuego === 'fow')  return { ejercitos: {}, epocas: {} };
  return { ejercitos: {} }; // warmaster / epic
}

function sumar(obj, clave) {
  if (clave) obj[clave] = (obj[clave] || 0) + 1;
}

const parsearJSON = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw;
  try { return JSON.parse(raw); } catch { return {}; }
};

const fusionar = (base, nuevo) => {
  const resultado = { ...base };
  for (const [clave, valor] of Object.entries(nuevo)) {
    resultado[clave] = (resultado[clave] || 0) + (Number(valor) || 0);
  }
  return resultado;
};

const favorita = (obj) =>
  Object.keys(obj).length === 0
    ? null
    : Object.entries(obj).sort(([, a], [, b]) => b - a)[0][0];

// ============================================
// APLICAR PARTIDAS EN UNA TEMPORADA (anual o general)
// ============================================

async function procesarEnTemporada(connRanking, temporada, sistemaJuego, torneoId, partidasNormalizadas) {
  const temporadaId = temporada.id;
  const eloInicial = temporada.elo_inicial;

  console.log(`\n🗓️  Procesando en: ${temporada.nombre} (ID ${temporadaId})`);

  const insertHistorial = `
    INSERT INTO elo_historial
      (jugador_id, temporada_id, sistema_juego, partida_id, torneo_id, elo_anterior, elo_nuevo,
       cambio, oponente_id, oponente_elo, resultado, epoca, faccion, warlord_muerto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  for (const item of partidasNormalizadas) {

    // ── BYE: victoria contra un rival fantasma con ELO inicial ──
    if (item.tipo === 'bye') {
      const jugador1 = await obtenerOCrearElo(connRanking, item.jugador1Id, temporadaId, sistemaJuego, eloInicial);
      const cambios = eloSystem.procesarPartida(
        { elo: jugador1.elo_actual, partidasJugadas: jugador1.partidas_jugadas },
        { elo: eloInicial, partidasJugadas: 0 },
        1
      );
      await actualizarEloJugador(connRanking, item.jugador1Id, temporadaId, sistemaJuego, cambios.jugador1.eloNuevo, 'victoria');
      console.log(`  BYE (${item.jugador1Id}): ${cambios.jugador1.eloAnterior} → ${cambios.jugador1.eloNuevo}`);
      continue;
    }

    // ── PARTIDA NORMAL ──
    const { partida, jugador1Id, jugador2Id, ganador } = item;

    const jugador1 = await obtenerOCrearElo(connRanking, jugador1Id, temporadaId, sistemaJuego, eloInicial);
    const jugador2 = await obtenerOCrearElo(connRanking, jugador2Id, temporadaId, sistemaJuego, eloInicial);

    const cambios = eloSystem.procesarPartida(
      { elo: jugador1.elo_actual, partidasJugadas: jugador1.partidas_jugadas },
      { elo: jugador2.elo_actual, partidasJugadas: jugador2.partidas_jugadas },
      ganador
    );

    console.log(
      `  J1 (${jugador1Id}): ${cambios.jugador1.eloAnterior} → ${cambios.jugador1.eloNuevo} | ` +
      `J2 (${jugador2Id}): ${cambios.jugador2.eloAnterior} → ${cambios.jugador2.eloNuevo}`
    );

    await actualizarEloJugador(connRanking, jugador1Id, temporadaId, sistemaJuego, cambios.jugador1.eloNuevo, cambios.jugador1.resultado);
    await actualizarEloJugador(connRanking, jugador2Id, temporadaId, sistemaJuego, cambios.jugador2.eloNuevo, cambios.jugador2.resultado);

    // Warlords / generales muertos (solo SAGA y Warmaster)
    if (sistemaJuego === 'saga' || sistemaJuego === 'warmaster') {
      const muertes = [
        [jugador1Id, partida.warlord_muerto_j1],
        [jugador2Id, partida.warlord_muerto_j2]
      ];
      for (const [id, muerto] of muertes) {
        if (muerto) {
          await connRanking.query(
            `UPDATE elo_jugadores SET warlords_muertos = warlords_muertos + 1
             WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
            [id, temporadaId, sistemaJuego]
          );
        }
      }
    }

    // Historial
    const epocaOEjercito_j1 = sistemaJuego === 'saga' ? (partida.epoca_j1 || null) : (partida.ejercito_j1 || null);
    const epocaOEjercito_j2 = sistemaJuego === 'saga' ? (partida.epoca_j2 || null) : (partida.ejercito_j2 || null);
    const faccion_j1 = sistemaJuego === 'saga' ? (partida.faccion_j1 || null) : null;
    const faccion_j2 = sistemaJuego === 'saga' ? (partida.faccion_j2 || null) : null;

    await connRanking.query(insertHistorial, [
      jugador1Id, temporadaId, sistemaJuego, partida.id, torneoId,
      cambios.jugador1.eloAnterior, cambios.jugador1.eloNuevo, cambios.jugador1.cambio,
      jugador2Id, jugador2.elo_actual, cambios.jugador1.resultado,
      epocaOEjercito_j1, faccion_j1, !!partida.warlord_muerto_j1
    ]);

    await connRanking.query(insertHistorial, [
      jugador2Id, temporadaId, sistemaJuego, partida.id, torneoId,
      cambios.jugador2.eloAnterior, cambios.jugador2.eloNuevo, cambios.jugador2.cambio,
      jugador1Id, jugador1.elo_actual, cambios.jugador2.resultado,
      epocaOEjercito_j2, faccion_j2, !!partida.warlord_muerto_j2
    ]);
  }
}

// ============================================
// GUARDAR ESTADÍSTICAS EN UNA TEMPORADA
// ============================================

async function guardarEstadisticas(connRanking, estadisticasJugadores, temporadaId, sistemaJuego) {
  for (const [jugadorId, stats] of estadisticasJugadores) {
    const [existente] = await connRanking.query(
      `SELECT epocas_jugadas, facciones_jugadas
       FROM estadisticas_jugador
       WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
      [jugadorId, temporadaId, sistemaJuego]
    );

    let epocasMerged    = existente.length > 0 ? parsearJSON(existente[0].epocas_jugadas)    : {};
    let faccionesMerged = existente.length > 0 ? parsearJSON(existente[0].facciones_jugadas) : {};

    if (sistemaJuego === 'saga') {
      epocasMerged    = fusionar(epocasMerged, stats.epocas);
      faccionesMerged = fusionar(faccionesMerged, stats.facciones);
    } else if (sistemaJuego === 'fow') {
      epocasMerged    = fusionar(epocasMerged, stats.epocas);
      faccionesMerged = fusionar(faccionesMerged, stats.ejercitos);
    } else {
      epocasMerged    = {}; // warmaster / epic no tienen época
      faccionesMerged = fusionar(faccionesMerged, stats.ejercitos);
    }

    await connRanking.query(
      `INSERT INTO estadisticas_jugador
         (jugador_id, temporada_id, sistema_juego,
          epoca_favorita, faccion_favorita,
          epocas_jugadas, facciones_jugadas,
          torneos_participados)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         epoca_favorita       = VALUES(epoca_favorita),
         faccion_favorita     = VALUES(faccion_favorita),
         epocas_jugadas       = VALUES(epocas_jugadas),
         facciones_jugadas    = VALUES(facciones_jugadas),
         torneos_participados = torneos_participados + 1,
         updated_at           = CURRENT_TIMESTAMP`,
      [
        jugadorId, temporadaId, sistemaJuego,
        favorita(epocasMerged), favorita(faccionesMerged),
        JSON.stringify(epocasMerged), JSON.stringify(faccionesMerged)
      ]
    );
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

export async function actualizarEloAutomatico(connTorneos, connRanking, torneoId) {
  console.log(`\n🎯 ===== CÁLCULO DE ELO - Torneo ${torneoId} =====\n`);

  // 1. Torneo
  const [torneo] = await connTorneos.query('SELECT * FROM torneos_sistemas WHERE id = ?', [torneoId]);

  if (torneo.length === 0) {
    throw new Error('Torneo no encontrado');
  }

  // Un torneo solo puede sumar UNA vez (si no, duplica ELO en anual y general).
  // Para corregir resultados, usar /recalcular-todo.
  if (torneo[0].elo_procesado) {
    throw new Error('El ELO de este torneo ya fue procesado');
  }

  const sistemaJuego = torneo[0].sistema.toLowerCase();
  const tablas = obtenerTablas(sistemaJuego);

  // 2. Las DOS temporadas donde va el resultado
  //    - Anual: según la FECHA DEL TORNEO (15/09 → 14/09)
  //    - General: histórico, sin años
  const fechaTorneo = new Date(torneo[0].fecha_fin || torneo[0].fecha_inicio);
  const temporadaAnual   = await obtenerOCrearTemporada(connRanking, sistemaJuego, fechaTorneo);
  const temporadaGeneral = await obtenerOCrearTemporadaGeneral(connRanking, sistemaJuego);

  console.log(`📅 Anual:   ${temporadaAnual.nombre}`);
  console.log(`🌍 General: ${temporadaGeneral.nombre}`);

  // 3. Partidas confirmadas
  let queryPartidas;

  if (sistemaJuego === 'saga') {
    queryPartidas = `
      SELECT
        p.id, p.jugador1_id, p.jugador2_id,
        p.resultado_ps AS resultado,
        p.warlord_muerto_j1, p.warlord_muerto_j2,
        jt1.epoca AS epoca_j1, jt1.faccion AS faccion_j1,
        jt2.epoca AS epoca_j2, jt2.faccion AS faccion_j2
      FROM ${tablas.partidas} p
      LEFT JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? AND p.resultado_confirmado = 1
      ORDER BY p.ronda, p.mesa`;
  } else if (sistemaJuego === 'warmaster') {
    queryPartidas = `
      SELECT
        p.id,
        jt1.jugador_id AS jugador1_id, jt2.jugador_id AS jugador2_id,
        p.resultado_pw AS resultado,
        p.general_muerto_j1 AS warlord_muerto_j1, p.general_muerto_j2 AS warlord_muerto_j2,
        jt1.ejercito AS ejercito_j1, jt2.ejercito AS ejercito_j2
      FROM ${tablas.partidas} p
      INNER JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? AND p.resultado_confirmado = 1
      ORDER BY p.ronda, p.mesa`;
  } else if (sistemaJuego === 'fow') {
    queryPartidas = `
      SELECT
        p.id,
        jt1.jugador_id AS jugador1_id, jt2.jugador_id AS jugador2_id,
        p.resultado_pf AS resultado,
        jt1.ejercito AS ejercito_j1, jt1.epoca AS epoca_j1,
        jt2.ejercito AS ejercito_j2, jt2.epoca AS epoca_j2
      FROM ${tablas.partidas} p
      INNER JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? AND p.resultado_confirmado = 1
      ORDER BY p.ronda, p.mesa`;
  } else if (sistemaJuego === 'epic') {
    queryPartidas = `
      SELECT
        p.id, p.es_bye,
        jt1.jugador_id AS jugador1_id, jt2.jugador_id AS jugador2_id,
        p.resultado_pe AS resultado,
        jt1.ejercito AS ejercito_j1, jt2.ejercito AS ejercito_j2
      FROM ${tablas.partidas} p
      INNER JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? AND p.resultado_confirmado = 1
      ORDER BY p.ronda, p.mesa`;
  } else {
    throw new Error(`Sistema de juego no soportado: ${sistemaJuego}`);
  }

  const [partidas] = await connTorneos.query(queryPartidas, [torneoId]);

  if (partidas.length === 0) {
    throw new Error('No hay partidas confirmadas en este torneo');
  }

  console.log(`📊 ${partidas.length} partidas confirmadas`);

  // 4. Preparar partidas UNA sola vez (IDs, ganador, estadísticas)
  const partidasNormalizadas = [];
  const estadisticasJugadores = new Map();

  for (const partida of partidas) {
    let jugador1Id, jugador2Id;

    if (sistemaJuego === 'saga') {
      // SAGA guarda el ID de participación: hay que convertirlo a ID de usuario
      jugador1Id = await obtenerJugadorIdDesdeParticipacion(connTorneos, partida.jugador1_id, sistemaJuego);
      jugador2Id = await obtenerJugadorIdDesdeParticipacion(connTorneos, partida.jugador2_id, sistemaJuego);
    } else {
      jugador1Id = partida.jugador1_id;
      jugador2Id = partida.jugador2_id;
    }

    // BYE o partida incompleta
    if (!jugador1Id || !jugador2Id) {
      if (jugador1Id && partida.es_bye) {
        partidasNormalizadas.push({ tipo: 'bye', jugador1Id });
      } else {
        console.warn(`⚠️  Partida ${partida.id}: no se pudieron obtener los IDs de jugadores`);
      }
      continue;
    }

    // Ganador
    let ganador;
    if (partida.resultado === 'victoria_j1') ganador = 1;
    else if (partida.resultado === 'victoria_j2') ganador = 2;
    else if (partida.resultado === 'empate') ganador = 0;
    else {
      console.warn(`⚠️  Partida ${partida.id}: resultado desconocido (${partida.resultado})`);
      continue;
    }

    // Estadísticas
    if (!estadisticasJugadores.has(jugador1Id)) estadisticasJugadores.set(jugador1Id, crearStatsVacias(sistemaJuego));
    if (!estadisticasJugadores.has(jugador2Id)) estadisticasJugadores.set(jugador2Id, crearStatsVacias(sistemaJuego));

    const stats1 = estadisticasJugadores.get(jugador1Id);
    const stats2 = estadisticasJugadores.get(jugador2Id);

    if (sistemaJuego === 'saga') {
      sumar(stats1.epocas, partida.epoca_j1);
      sumar(stats1.facciones, partida.faccion_j1);
      sumar(stats2.epocas, partida.epoca_j2);
      sumar(stats2.facciones, partida.faccion_j2);
    } else if (sistemaJuego === 'fow') {
      sumar(stats1.ejercitos, partida.ejercito_j1);
      sumar(stats1.epocas, partida.epoca_j1);
      sumar(stats2.ejercitos, partida.ejercito_j2);
      sumar(stats2.epocas, partida.epoca_j2);
    } else {
      sumar(stats1.ejercitos, partida.ejercito_j1);
      sumar(stats2.ejercitos, partida.ejercito_j2);
    }

    partidasNormalizadas.push({ tipo: 'normal', partida, jugador1Id, jugador2Id, ganador });
  }

  // 5. Aplicar en las DOS clasificaciones
  for (const temporada of [temporadaAnual, temporadaGeneral]) {
    await procesarEnTemporada(connRanking, temporada, sistemaJuego, torneoId, partidasNormalizadas);
    await guardarEstadisticas(connRanking, estadisticasJugadores, temporada.id, sistemaJuego);
  }

  // 6. Marcar torneo como procesado
  await connTorneos.query('UPDATE torneos_sistemas SET elo_procesado = TRUE WHERE id = ?', [torneoId]);

  console.log(`\n✅ ===== CÁLCULO COMPLETADO =====`);
  console.log(`📊 Partidas: ${partidasNormalizadas.length} | 👥 Jugadores: ${estadisticasJugadores.size}\n`);

  return {
    partidasProcesadas: partidasNormalizadas.length,
    jugadoresAfectados: estadisticasJugadores.size,
    sistemaJuego: sistemaJuego.toUpperCase(),
    temporada: temporadaAnual.nombre
  };
}