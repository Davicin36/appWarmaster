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

  // ✅ CORREGIR: Verificar si es string antes de usar .includes()
  const sets = Object.entries(actualizaciones)
    .map(([key, val]) => {
      // Si el valor es un string Y contiene '+', es una expresión SQL
      if (typeof val === 'string' && val.includes('+')) {
        return `${key} = ${val}`;
      }
      // Si no, es un valor parametrizado
      return `${key} = ?`;
    })
    .join(', ');

  // ✅ CORREGIR: Solo incluir valores que no son expresiones SQL
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

  // 4. Obtener partidas con época y facción (SIN BANDA)
  let queryPartidas;
  
  if (sistemaJuego === 'saga') {
    queryPartidas = `
      SELECT 
        p.id,
        p.jugador1_id,
        p.jugador2_id,
        p.resultado_ps,
        p.warlord_muerto_j1,
        p.warlord_muerto_j2,
        jt1.epoca as epoca_j1,
        jt1.faccion as faccion_j1,
        jt2.epoca as epoca_j2,
        jt2.faccion as faccion_j2
      FROM ${tablas.partidas} p
      LEFT JOIN ${tablas.jugadorTorneo} jt1 ON p.jugador1_id = jt1.id
      LEFT JOIN ${tablas.jugadorTorneo} jt2 ON p.jugador2_id = jt2.id
      WHERE p.torneo_id = ? 
      AND p.resultado_confirmado = TRUE 
      AND p.es_bye = FALSE
      ORDER BY p.ronda, p.mesa
    `;
  } else {
    queryPartidas = `
      SELECT 
        id,
        jugador1_id,
        jugador2_id,
        resultado_ps
      FROM ${tablas.partidas}
      WHERE torneo_id = ? 
      AND resultado_confirmado = TRUE 
      AND es_bye = FALSE
      ORDER BY ronda, mesa
    `;
  }

  const [partidas] = await connTorneos.query(queryPartidas, [torneoId]);

  if (partidas.length === 0) {
    throw new Error('No hay partidas confirmadas en este torneo');
  }

  console.log(`📊 Procesando ${partidas.length} partidas confirmadas\n`);

  // 5. Acumulador de estadísticas (SIN BANDA)
  const estadisticasJugadores = new Map();
  const torneosParticipados = new Set();
  
  let partidasProcesadas = 0;

  // 6. Procesar cada partida
  for (const partida of partidas) {
    console.log(`\n--- Partida ${partida.id} ---`);

    const jugador1Id = await obtenerJugadorIdDesdeParticipacion(
      connTorneos,
      partida.jugador1_id,
      sistemaJuego
    );

    const jugador2Id = await obtenerJugadorIdDesdeParticipacion(
      connTorneos,
      partida.jugador2_id,
      sistemaJuego
    );

    if (!jugador1Id || !jugador2Id) {
      console.warn(`⚠️  Partida ${partida.id}: No se pudieron obtener los IDs de jugadores`);
      continue;
    }

    // Acumular estadísticas de época/facción (SIN BANDA)
    if (sistemaJuego === 'saga') {
      // Jugador 1
      if (!estadisticasJugadores.has(jugador1Id)) {
        estadisticasJugadores.set(jugador1Id, {
          epocas: {},
          facciones: {},
          warlords_muertos: 0
        });
      }
      
      const stats1 = estadisticasJugadores.get(jugador1Id);
      if (partida.epoca_j1) {
        stats1.epocas[partida.epoca_j1] = (stats1.epocas[partida.epoca_j1] || 0) + 1;
      }
      if (partida.faccion_j1) {
        stats1.facciones[partida.faccion_j1] = (stats1.facciones[partida.faccion_j1] || 0) + 1;
      }
      if (partida.warlord_muerto_j1) {
        stats1.warlords_muertos++;
      }

      // Jugador 2
      if (!estadisticasJugadores.has(jugador2Id)) {
        estadisticasJugadores.set(jugador2Id, {
          epocas: {},
          facciones: {},
          warlords_muertos: 0
        });
      }
      
      const stats2 = estadisticasJugadores.get(jugador2Id);
      if (partida.epoca_j2) {
        stats2.epocas[partida.epoca_j2] = (stats2.epocas[partida.epoca_j2] || 0) + 1;
      }
      if (partida.faccion_j2) {
        stats2.facciones[partida.faccion_j2] = (stats2.facciones[partida.faccion_j2] || 0) + 1;
      }
      if (partida.warlord_muerto_j2) {
        stats2.warlords_muertos++;
      }
    }

    torneosParticipados.add(jugador1Id);
    torneosParticipados.add(jugador2Id);

    // Obtener o crear ELO
    const jugador1 = await obtenerOCrearElo(connRanking, jugador1Id, temporadaId, sistemaJuego, eloInicial);
    const jugador2 = await obtenerOCrearElo(connRanking, jugador2Id, temporadaId, sistemaJuego, eloInicial);

    // Determinar ganador
    let ganador;
    if (partida.resultado_ps === 'victoria_j1') ganador = 1;
    else if (partida.resultado_ps === 'victoria_j2') ganador = 2;
    else if (partida.resultado_ps === 'empate') ganador = 0;
    else {
      console.warn(`⚠️  Partida ${partida.id}: resultado pendiente`);
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

    // Actualizar warlords muertos
    if (sistemaJuego === 'saga' && partida.warlord_muerto_j1) {
      await connRanking.query(
        `UPDATE elo_jugadores 
         SET warlords_muertos = warlords_muertos + 1
         WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
        [jugador1Id, temporadaId, sistemaJuego]
      );
    }
    
    if (sistemaJuego === 'saga' && partida.warlord_muerto_j2) {
      await connRanking.query(
        `UPDATE elo_jugadores 
         SET warlords_muertos = warlords_muertos + 1
         WHERE jugador_id = ? AND temporada_id = ? AND sistema_juego = ?`,
        [jugador2Id, temporadaId, sistemaJuego]
      );
    }

    // Guardar en historial (SIN BANDA)
    await connRanking.query(
      `INSERT INTO elo_historial 
       (jugador_id, temporada_id, sistema_juego, partida_id, torneo_id, elo_anterior, elo_nuevo, 
        cambio, oponente_id, oponente_elo, resultado, epoca, faccion, warlord_muerto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jugador1Id, temporadaId, sistemaJuego, partida.id, torneoId,
        cambios.jugador1.eloAnterior, cambios.jugador1.eloNuevo, cambios.jugador1.cambio,
        jugador2Id, jugador2.elo_actual, cambios.jugador1.resultado,
        partida.epoca_j1 || null, 
        partida.faccion_j1 || null,
        partida.warlord_muerto_j1 || false
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
        partida.epoca_j2 || null, 
        partida.faccion_j2 || null,
        partida.warlord_muerto_j2 || false
      ]
    );

    partidasProcesadas++;
  }

  // 7. Guardar estadísticas detalladas (SIN BANDA)
  console.log(`\n📊 Guardando estadísticas detalladas...`);
  
  if (sistemaJuego === 'saga') {
    for (const [jugadorId, stats] of estadisticasJugadores) {
      const epocaFavorita = Object.entries(stats.epocas)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const faccionFavorita = Object.entries(stats.facciones)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      console.log(`  Jugador ${jugadorId}: época=${epocaFavorita}, facción=${faccionFavorita}`);

      await connRanking.query(
        `INSERT INTO estadisticas_jugador 
         (jugador_id, temporada_id, sistema_juego, epoca_favorita, faccion_favorita,
          epocas_jugadas, facciones_jugadas, torneos_participados)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           epoca_favorita = VALUES(epoca_favorita),
           faccion_favorita = VALUES(faccion_favorita),
           epocas_jugadas = JSON_MERGE_PRESERVE(COALESCE(epocas_jugadas, '{}'), VALUES(epocas_jugadas)),
           facciones_jugadas = JSON_MERGE_PRESERVE(COALESCE(facciones_jugadas, '{}'), VALUES(facciones_jugadas)),
           torneos_participados = torneos_participados + 1,
           updated_at = CURRENT_TIMESTAMP`,
        [
          jugadorId,
          temporadaId,
          sistemaJuego,
          epocaFavorita,
          faccionFavorita,
          JSON.stringify(stats.epocas),
          JSON.stringify(stats.facciones)
        ]
      );
    }
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