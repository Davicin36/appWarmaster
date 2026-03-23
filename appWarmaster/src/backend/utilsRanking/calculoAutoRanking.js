// utilsRanking/calculoAutoRanking.js
import { obtenerTablas, obtenerJugadorIdDesdeParticipacion } from './tablasJuegos.js';

// Sistema ELO
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
      resultado1 = 1;
      resultado2 = 0;
      descripcion1 = 'victoria';
      descripcion2 = 'derrota';
    } else if (ganador === 2) {
      resultado1 = 0;
      resultado2 = 1;
      descripcion1 = 'derrota';
      descripcion2 = 'victoria';
    } else {
      resultado1 = 0.5;
      resultado2 = 0.5;
      descripcion1 = 'empate';
      descripcion2 = 'empate';
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

// ===== OBTENER O CREAR ELO =====

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

// ===== ACTUALIZAR ELO JUGADOR =====

async function actualizarEloJugador(connRanking, jugadorId, temporadaId, sistemaJuego, nuevoElo, resultado) {
  const actualizaciones = {
    elo_actual: nuevoElo,
    partidas_jugadas: 'partidas_jugadas + 1'
  };

  if (resultado === 'victoria') {
    actualizaciones.victorias = 'victorias + 1';
  } else if (resultado === 'derrota') {
    actualizaciones.derrotas = 'derrotas + 1';
  } else if (resultado === 'empate') {
    actualizaciones.empates = 'empates + 1';
  }

  const sets = Object.entries(actualizaciones)
    .map(([key, val]) => {
      if (typeof val === 'string' && val.includes('+')) {
        return `${key} = ${val}`;
      }
      return `${key} = ?`;
    })
    .join(', ');

  const valores = Object.entries(actualizaciones)
    .filter(([_, val]) => typeof val !== 'string' || !val.includes('+'))
    .map(([_, val]) => val);

  await connRanking.query(
    `UPDATE elo_jugadores 
     SET ${sets},
         elo_maximo = GREATEST(elo_maximo, ?),
         elo_minimo = LEAST(elo_minimo, ?)
     WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
    [...valores, nuevoElo, nuevoElo, jugadorId, temporadaId, sistemaJuego]
  );
}

// ===== ACTUALIZAR ELO AUTOMÁTICO =====

export async function actualizarEloAutomatico(connTorneos, connRanking, torneoId) {
  console.log(`\n🎯 ===== INICIANDO CÁLCULO AUTOMÁTICO DE ELO - Torneo ${torneoId} =====\n`);

  // 1. Obtener información del torneo
  const [torneo] = await connTorneos.query(
    'SELECT * FROM torneos_sistemas WHERE id = ?',
    [torneoId]
  );

  if (torneo.length === 0) {
    throw new Error('Torneo no encontrado');
  }

  if (torneo[0].elo_procesado) {
    console.warn('⚠️ ADVERTENCIA: Este torneo ya fue procesado. Limpiando datos anteriores...');
    await connRanking.query('DELETE FROM elo_historial WHERE torneo_id = ?', [torneoId]);
    console.log('✅ Datos anteriores limpiados. Reprocesando...');
  }

  const sistemaJuego = torneo[0].sistema.toLowerCase();
  console.log(`📋 Sistema de juego: ${sistemaJuego.toUpperCase()}`);

  // 2. Obtener tablas dinámicamente
  const tablas = obtenerTablas(sistemaJuego);
  console.log(`📊 Tablas a usar: ${tablas.partidas}, ${tablas.jugadorTorneo}`);

  // 3. Obtener o crear temporada
  const añoActual = new Date().getFullYear();
  let [temporada] = await connRanking.query(
    'SELECT id, elo_inicial FROM temporadas WHERE año = ? AND sistema_juego = ? LIMIT 1',
    [añoActual, sistemaJuego]
  );

  if (temporada.length === 0) {
    console.log(`📅 Creando temporada ${añoActual} para ${sistemaJuego}...`);
    const [result] = await connRanking.query(
      `INSERT INTO temporadas (nombre, año, sistema_juego, fecha_inicio, fecha_fin, activa, elo_inicial)
       VALUES (?, ?, ?, ?, ?, TRUE, 1500)`,
      [
        `${sistemaJuego.toUpperCase()} - Temporada ${añoActual}`,
        añoActual,
        sistemaJuego,
        `${añoActual}-01-01`,
        `${añoActual}-12-31`
      ]
    );

    [temporada] = await connRanking.query(
      'SELECT id, elo_inicial FROM temporadas WHERE id = ?',
      [result.insertId]
    );
  }

  const temporadaId = temporada[0].id;
  const eloInicial = temporada[0].elo_inicial;
  console.log(`✅ Temporada ID: ${temporadaId}, ELO Inicial: ${eloInicial}`);

  // 4. Obtener partidas con campos específicos del sistema
  let queryPartidas;

  if (sistemaJuego === 'saga') {
    queryPartidas = `
      SELECT 
        p.id,
        p.jugador1_id,
        p.jugador2_id,
        p.resultado_ps AS resultado,
        p.warlord_muerto_j1,
        p.warlord_muerto_j2,
        jt1.epoca AS epoca_j1,
        jt1.faccion AS faccion_j1,
        jt2.epoca AS epoca_j2,
        jt2.faccion AS faccion_j2
      FROM ${tablas.partidas} p
      LEFT JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? 
      AND p.resultado_confirmado = 1
      ORDER BY p.ronda, p.mesa
    `;
  } else if (sistemaJuego === 'warmaster') {
    queryPartidas = `
      SELECT 
        p.id,
        jt1.jugador_id AS jugador1_id,
        jt2.jugador_id AS jugador2_id,
        p.resultado_pw AS resultado,
        p.general_muerto_j1 AS warlord_muerto_j1,
        p.general_muerto_j2 AS warlord_muerto_j2,
        jt1.ejercito AS ejercito_j1,
        jt2.ejercito AS ejercito_j2
      FROM ${tablas.partidas} p
      INNER JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? 
      AND p.resultado_confirmado = 1
      ORDER BY p.ronda, p.mesa
    `;
  } else if (sistemaJuego === 'fow') {
    queryPartidas = `
      SELECT 
        p.id,
        jt1.jugador_id AS jugador1_id,
        jt2.jugador_id AS jugador2_id,
        p.resultado_pf AS resultado,
        jt1.ejercito AS ejercito_j1,
        jt1.epoca AS epoca_j1,
        jt2.ejercito AS ejercito_j2,
        jt2.epoca AS epoca_j2
      FROM ${tablas.partidas} p
      INNER JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? 
      AND p.resultado_confirmado = 1
      ORDER BY p.ronda, p.mesa
    `;
  } else if (sistemaJuego === 'epic') {
    // ✅ Epic: LEFT JOIN para incluir BYEs (jugador2_id puede ser NULL)
    queryPartidas = `
      SELECT 
        p.id,
        p.es_bye,
        jt1.jugador_id AS jugador1_id,
        jt2.jugador_id AS jugador2_id,
        p.resultado_pe AS resultado,
        jt1.ejercito AS ejercito_j1,
        jt2.ejercito AS ejercito_j2
      FROM ${tablas.partidas} p
      INNER JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? 
      AND p.resultado_confirmado = 1
      ORDER BY p.ronda, p.mesa
    `;
  } else {
    throw new Error(`Sistema de juego no soportado: ${sistemaJuego}`);
  }

  const [partidas] = await connTorneos.query(queryPartidas, [torneoId]);

  console.log(`\n📦 MUESTRA DE PARTIDA 1:`, JSON.stringify(partidas[0], null, 2));
  console.log(`📦 Campo resultado:`, partidas[0]?.resultado);
  console.log(`📦 jugador1_id:`, partidas[0]?.jugador1_id);
  console.log(`📦 jugador2_id:`, partidas[0]?.jugador2_id);

  if (partidas.length === 0) {
    throw new Error('No hay partidas confirmadas en este torneo');
  }

  console.log(`📊 Procesando ${partidas.length} partidas confirmadas\n`);

  // 5. Acumulador de estadísticas
  const estadisticasJugadores = new Map();
  let partidasProcesadas = 0;

  // 6. Procesar cada partida
  for (const partida of partidas) {
    console.log(`\n--- Partida ${partida.id} ---`);

    let jugador1Id, jugador2Id;

    if (sistemaJuego === 'warmaster' || sistemaJuego === 'fow' || sistemaJuego === 'epic') {
      // IDs directos de usuario
      jugador1Id = partida.jugador1_id;
      jugador2Id = partida.jugador2_id;
    } else {
      // SAGA: necesita conversión desde ID de participación
      jugador1Id = await obtenerJugadorIdDesdeParticipacion(
        connTorneos,
        partida.jugador1_id,
        sistemaJuego
      );
      jugador2Id = await obtenerJugadorIdDesdeParticipacion(
        connTorneos,
        partida.jugador2_id,
        sistemaJuego
      );
    }

    if (!jugador1Id || !jugador2Id) {
      // ✅ BYE para todos los sistemas: victoria automática contra fantasma 1500
      if (jugador1Id && partida.es_bye) {
        const jugador1 = await obtenerOCrearElo(connRanking, jugador1Id, temporadaId, sistemaJuego, eloInicial);
        const cambios = eloSystem.procesarPartida(
          { elo: jugador1.elo_actual, partidasJugadas: jugador1.partidas_jugadas },
          { elo: eloInicial, partidasJugadas: 0 },
          1 // victoria para jugador1
        );
        await actualizarEloJugador(connRanking, jugador1Id, temporadaId, sistemaJuego, cambios.jugador1.eloNuevo, 'victoria');
        console.log(`  BYE J1 (${jugador1Id}): ${cambios.jugador1.eloAnterior} → ${cambios.jugador1.eloNuevo} (+${cambios.jugador1.cambio})`);
        partidasProcesadas++;
      } else {
        console.warn(`⚠️  Partida ${partida.id}: No se pudieron obtener los IDs de jugadores`);
      }
      continue;
    }

    // Inicializar estadísticas del jugador si no existen
    if (!estadisticasJugadores.has(jugador1Id)) {
      estadisticasJugadores.set(jugador1Id,
        sistemaJuego === 'saga'
          ? { epocas: {}, facciones: {}, warlords_muertos: 0 }
          : sistemaJuego === 'fow'
            ? { ejercitos: {}, epocas: {} }
            : sistemaJuego === 'epic'
              ? { ejercitos: {}, facciones: {} }           // ✅ Epic: con facciones, sin generales_muertos
              : { ejercitos: {}, generales_muertos: 0 }   // Warmaster
      );
    }
    if (!estadisticasJugadores.has(jugador2Id)) {
      estadisticasJugadores.set(jugador2Id,
        sistemaJuego === 'saga'
          ? { epocas: {}, facciones: {}, warlords_muertos: 0 }
          : sistemaJuego === 'fow'
            ? { ejercitos: {}, epocas: {} }
            : sistemaJuego === 'epic'
              ? { ejercitos: {}, facciones: {} }           // ✅ Epic: con facciones, sin generales_muertos
              : { ejercitos: {}, generales_muertos: 0 }   // Warmaster
      );
    }

    const stats1 = estadisticasJugadores.get(jugador1Id);
    const stats2 = estadisticasJugadores.get(jugador2Id);

    // Acumular estadísticas específicas del sistema
    if (sistemaJuego === 'saga') {
      if (partida.epoca_j1) stats1.epocas[partida.epoca_j1] = (stats1.epocas[partida.epoca_j1] || 0) + 1;
      if (partida.faccion_j1) stats1.facciones[partida.faccion_j1] = (stats1.facciones[partida.faccion_j1] || 0) + 1;
      if (partida.warlord_muerto_j1) stats1.warlords_muertos++;

      if (partida.epoca_j2) stats2.epocas[partida.epoca_j2] = (stats2.epocas[partida.epoca_j2] || 0) + 1;
      if (partida.faccion_j2) stats2.facciones[partida.faccion_j2] = (stats2.facciones[partida.faccion_j2] || 0) + 1;
      if (partida.warlord_muerto_j2) stats2.warlords_muertos++;

    } else if (sistemaJuego === 'warmaster') {
      if (partida.ejercito_j1) stats1.ejercitos[partida.ejercito_j1] = (stats1.ejercitos[partida.ejercito_j1] || 0) + 1;
      if (partida.warlord_muerto_j1) stats1.generales_muertos++;

      if (partida.ejercito_j2) stats2.ejercitos[partida.ejercito_j2] = (stats2.ejercitos[partida.ejercito_j2] || 0) + 1;
      if (partida.warlord_muerto_j2) stats2.generales_muertos++;

    } else if (sistemaJuego === 'fow') {
      if (partida.ejercito_j1) stats1.ejercitos[partida.ejercito_j1] = (stats1.ejercitos[partida.ejercito_j1] || 0) + 1;
      if (partida.epoca_j1) stats1.epocas[partida.epoca_j1] = (stats1.epocas[partida.epoca_j1] || 0) + 1;

      if (partida.ejercito_j2) stats2.ejercitos[partida.ejercito_j2] = (stats2.ejercitos[partida.ejercito_j2] || 0) + 1;
      if (partida.epoca_j2) stats2.epocas[partida.epoca_j2] = (stats2.epocas[partida.epoca_j2] || 0) + 1;

    } else if (sistemaJuego === 'epic') {
      // ✅ Epic: ejército y facción
      if (partida.ejercito_j1) stats1.ejercitos[partida.ejercito_j1] = (stats1.ejercitos[partida.ejercito_j1] || 0) + 1;
      if (partida.ejercito_j2) stats2.ejercitos[partida.ejercito_j2] = (stats2.ejercitos[partida.ejercito_j2] || 0) + 1;
    }

    // Obtener o crear ELO
    const jugador1 = await obtenerOCrearElo(connRanking, jugador1Id, temporadaId, sistemaJuego, eloInicial);
    const jugador2 = await obtenerOCrearElo(connRanking, jugador2Id, temporadaId, sistemaJuego, eloInicial);

    // Determinar ganador
    let ganador;
    if (partida.resultado === 'victoria_j1') ganador = 1;
    else if (partida.resultado === 'victoria_j2') ganador = 2;
    else if (partida.resultado === 'empate') ganador = 0;
    else {
      console.warn(`⚠️  Partida ${partida.id}: resultado pendiente o desconocido (${partida.resultado})`);
      continue;
    }

    // Calcular nuevos ELOs
    const cambios = eloSystem.procesarPartida(
      { elo: jugador1.elo_actual, partidasJugadas: jugador1.partidas_jugadas },
      { elo: jugador2.elo_actual, partidasJugadas: jugador2.partidas_jugadas },
      ganador
    );

    console.log(`  J1 (${jugador1Id}): ${cambios.jugador1.eloAnterior} → ${cambios.jugador1.eloNuevo} (${cambios.jugador1.cambio >= 0 ? '+' : ''}${cambios.jugador1.cambio})`);
    console.log(`  J2 (${jugador2Id}): ${cambios.jugador2.eloAnterior} → ${cambios.jugador2.eloNuevo} (${cambios.jugador2.cambio >= 0 ? '+' : ''}${cambios.jugador2.cambio})`);

    // Actualizar ELOs
    await actualizarEloJugador(connRanking, jugador1Id, temporadaId, sistemaJuego, cambios.jugador1.eloNuevo, cambios.jugador1.resultado);
    await actualizarEloJugador(connRanking, jugador2Id, temporadaId, sistemaJuego, cambios.jugador2.eloNuevo, cambios.jugador2.resultado);

    // ✅ Warlords/generales muertos solo para SAGA y Warmaster (NO Epic)
    if (sistemaJuego === 'saga' || sistemaJuego === 'warmaster') {
      if (partida.warlord_muerto_j1) {
        await connRanking.query(
          `UPDATE elo_jugadores SET warlords_muertos = warlords_muertos + 1
           WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
          [jugador1Id, temporadaId, sistemaJuego]
        );
      }
      if (partida.warlord_muerto_j2) {
        await connRanking.query(
          `UPDATE elo_jugadores SET warlords_muertos = warlords_muertos + 1
           WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
          [jugador2Id, temporadaId, sistemaJuego]
        );
      }
    }

    // Guardar en historial
    const epocaOEjercito_j1 = sistemaJuego === 'saga'
      ? (partida.epoca_j1 || null)
      : (partida.ejercito_j1 || null);
    const epocaOEjercito_j2 = sistemaJuego === 'saga'
      ? (partida.epoca_j2 || null)
      : (partida.ejercito_j2 || null);
    const faccion_j1 = sistemaJuego === 'saga' ? (partida.faccion_j1 || null) : null;
    const faccion_j2 = sistemaJuego === 'saga' ? (partida.faccion_j2 || null) : null;

    await connRanking.query(
      `INSERT INTO elo_historial 
       (jugador_id, temporada_id, sistema_juego, partida_id, torneo_id, elo_anterior, elo_nuevo, 
        cambio, oponente_id, oponente_elo, resultado, epoca, faccion, warlord_muerto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jugador1Id, temporadaId, sistemaJuego, partida.id, torneoId,
        cambios.jugador1.eloAnterior, cambios.jugador1.eloNuevo, cambios.jugador1.cambio,
        jugador2Id, jugador2.elo_actual, cambios.jugador1.resultado,
        epocaOEjercito_j1, faccion_j1, false
      ]
    );

    await connRanking.query(
      `INSERT INTO elo_historial 
       (jugador_id, temporada_id, sistema_juego, partida_id, torneo_id, elo_anterior, elo_nuevo, 
        cambio, oponente_id, oponente_elo, resultado, epoca, faccion, warlord_muerto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jugador2Id, temporadaId, sistemaJuego, partida.id, torneoId,
        cambios.jugador2.eloAnterior, cambios.jugador2.eloNuevo, cambios.jugador2.cambio,
        jugador1Id, jugador1.elo_actual, cambios.jugador2.resultado,
        epocaOEjercito_j2, faccion_j2, false
      ]
    );

    partidasProcesadas++;
  }

  // 7. Guardar estadísticas detalladas
  console.log(`\n📊 Guardando estadísticas detalladas...`);

  for (const [jugadorId, stats] of estadisticasJugadores) {

    // ── Leer estadísticas existentes en BD ──────────────────────────────
    const [existente] = await connRanking.query(
      `SELECT epocas_jugadas, facciones_jugadas
      FROM estadisticas_jugador
      WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
      [jugadorId, temporadaId, sistemaJuego]
    );

    // ── Helper: parsear JSON de BD (puede venir como string u objeto) ──
    const parsearJSON = (raw) => {
      if (!raw) return {};
      if (typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw;
      try { return JSON.parse(raw); } catch { return {}; }
    };

    // ── Helper: fusionar dos objetos sumando valores (nunca arrays) ────
    const fusionar = (base, nuevo) => {
      const resultado = { ...base };
      for (const [clave, valor] of Object.entries(nuevo)) {
        resultado[clave] = (resultado[clave] || 0) + (Number(valor) || 0);
      }
      return resultado;
    };

    // ── Helper: clave con mayor valor ──────────────────────────────────
    const favorita = (obj) =>
      Object.keys(obj).length === 0
        ? null
        : Object.entries(obj).sort(([, a], [, b]) => b - a)[0][0];

    // ── Construir objetos fusionados según sistema ─────────────────────
    let epocasMerged = {};
    let faccionesMerged = {};

    if (existente.length > 0) {
      epocasMerged   = parsearJSON(existente[0].epocas_jugadas);
      faccionesMerged = parsearJSON(existente[0].facciones_jugadas);
    }

    if (sistemaJuego === 'saga') {
      epocasMerged    = fusionar(epocasMerged, stats.epocas);
      faccionesMerged = fusionar(faccionesMerged, stats.facciones);

    } else if (sistemaJuego === 'fow') {
      epocasMerged    = fusionar(epocasMerged, stats.epocas);
      faccionesMerged = fusionar(faccionesMerged, stats.ejercitos); // ejercito → faccion_favorita

    } else if (sistemaJuego === 'warmaster' || sistemaJuego === 'epic') {
      epocasMerged    = {};  // warmaster/epic no tienen época
      faccionesMerged = fusionar(faccionesMerged, stats.ejercitos);
    }

    const epocaFavorita   = favorita(epocasMerged);
    const faccionFavorita = favorita(faccionesMerged);

    // ── Upsert limpio, sin JSON_MERGE_PRESERVE ─────────────────────────
    await connRanking.query(
      `INSERT INTO estadisticas_jugador
        (jugador_id, temporada_id, sistema_juego,
          epoca_favorita, faccion_favorita,
          epocas_jugadas, facciones_jugadas,
          torneos_participados)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        epoca_favorita      = VALUES(epoca_favorita),
        faccion_favorita    = VALUES(faccion_favorita),
        epocas_jugadas      = VALUES(epocas_jugadas),
        facciones_jugadas   = VALUES(facciones_jugadas),
        torneos_participados = torneos_participados + 1,
        updated_at          = CURRENT_TIMESTAMP`,
      [
        jugadorId, temporadaId, sistemaJuego,
        epocaFavorita,
        faccionFavorita,
        JSON.stringify(epocasMerged),
        JSON.stringify(faccionesMerged)
      ]
    );
  }

  // 8. Marcar torneo como procesado
  await connTorneos.query(
    'UPDATE torneos_sistemas SET elo_procesado = TRUE WHERE id = ?',
    [torneoId]
  );

  console.log(`\n✅ ===== CÁLCULO COMPLETADO =====`);
  console.log(`📊 Partidas procesadas: ${partidasProcesadas}`);
  console.log(`👥 Jugadores afectados: ${estadisticasJugadores.size}`);
  console.log(`🏆 Sistema: ${sistemaJuego.toUpperCase()}\n`);

  return {
    partidasProcesadas,
    jugadoresAfectados: estadisticasJugadores.size,
    sistemaJuego: sistemaJuego.toUpperCase()
  };
}