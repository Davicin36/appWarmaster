// routes/elo.routes.js
import express from 'express';
import { pool, poolRanking, poolGeneral, executeCrossTransaction } from '../config/bd.js';
import { verificarToken, verificarSuperAdmin } from '../middleware/auth.js';
import { 
    obtenerTablas, 
    validarSistemaJuego, 
    obtenerSistemasDisponibles, 
    obtenerJugadorIdDesdeParticipacion 
} from '../utilsRanking/tablasJuegos.js';

import  { actualizarEloAutomatico }  from '../utilsRanking/calculoAutoRanking.js';

const router = express.Router();

function obtenerCategoria(elo) {
  if (elo >= 2400) return { nombre: 'Gran Maestro', clase: 'gran-maestro' };
  if (elo >= 2200) return { nombre: 'Maestro', clase: 'maestro' };
  if (elo >= 2000) return { nombre: 'Experto', clase: 'experto' };
  if (elo >= 1800) return { nombre: 'Avanzado', clase: 'avanzado' };
  if (elo >= 1600) return { nombre: 'Intermedio', clase: 'intermedio' };
  if (elo >= 1400) return { nombre: 'Principiante', clase: 'principiante' };
  return { nombre: 'Novato', clase: 'novato' };
}

// ============================================
// ENDPOINTS - SISTEMAS DE JUEGO
// ============================================

router.get('/sistemas-juego', async (req, res) => {
  try {
    const sistemas = await obtenerSistemasDisponibles(pool);
    
    const añoActual = new Date().getFullYear();
    
    const sistemasConStats = await Promise.all(
      sistemas.map(async (sistema) => {
        // ✅ CORREGIDO: Solo usa rankingTorneos → poolRanking sin prefijos
        const [stats] = await poolRanking.query(`
          SELECT 
            COUNT(DISTINCT e.jugador_id) as total_jugadores,
            SUM(e.partidas_jugadas) as total_partidas
          FROM elo_jugadores e
          JOIN temporadas t ON e.temporada_id = t.id
          WHERE t.año = ? AND e.sistema_juego = ?
        `, [añoActual, sistema]);
        
        return {
          sistema,
          nombre_display: sistema.toUpperCase(),
          total_jugadores: stats[0]?.total_jugadores || 0,
          total_partidas: stats[0]?.total_partidas || 0
        };
      })
    );
    
    res.json(sistemasConStats);
  } catch (error) {
    console.error('Error obteniendo sistemas:', error);
    res.status(500).json({ error: 'Error al obtener sistemas de juego' });
  }
});

// ============================================
// ENDPOINTS - TEMPORADAS
// ============================================

router.get('/temporada-actual/:sistemaJuego', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    const añoActual = new Date().getFullYear();
    
    let [temporada] = await poolRanking.query(
      'SELECT * FROM temporadas WHERE año = ? AND sistema_juego = ? LIMIT 1',
      [añoActual, sistemaJuego]
    );
    
    if (temporada.length === 0) {
      const [result] = await poolRanking.query(
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
      
      [temporada] = await poolRanking.query(
        'SELECT * FROM temporadas WHERE id = ?',
        [result.insertId]
      );
    }
    
    res.json(temporada[0]);
  } catch (error) {
    console.error('Error obteniendo temporada actual:', error);
    res.status(500).json({ error: 'Error al obtener temporada actual' });
  }
});

router.get('/temporadas/:sistemaJuego', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    const [temporadas] = await poolRanking.query(
      'SELECT * FROM temporadas WHERE sistema_juego = ? ORDER BY año DESC',
      [sistemaJuego]
    );
    
    res.json(temporadas);
  } catch (error) {
    console.error('Error obteniendo temporadas:', error);
    res.status(500).json({ error: 'Error al obtener temporadas' });
  }
});

// ============================================
// ENDPOINTS - RANKING
// ============================================

router.get('/ranking/:sistemaJuego', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    const { limit = 100, minPartidas = 0, año } = req.query;
    const añoActual = año || new Date().getFullYear();
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    // ✅ CORRECTO: Cruza ambas BDs → poolGeneral con prefijos
    const [ranking] = await poolGeneral.query(`
      SELECT 
        e.jugador_id,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.email,
        u.club,
        e.elo_actual,
        e.elo_maximo,
        e.elo_minimo,
        e.partidas_jugadas,
        e.victorias,
        e.derrotas,
        e.empates,
        e.warlords_muertos,
        e.sistema_juego,
        ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) as porcentaje_victorias,
        t.nombre as temporada_nombre,
        t.año as temporada_año,
        RANK() OVER (
          ORDER BY 
            e.partidas_jugadas DESC,
            ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) DESC,
            e.elo_actual DESC
        ) as posicion,
        est.epoca_favorita,
        est.faccion_favorita
      FROM rankingTorneos.elo_jugadores e
      JOIN torneos.usuarios u ON e.jugador_id = u.id
      JOIN rankingTorneos.temporadas t ON e.temporada_id = t.id
      LEFT JOIN rankingTorneos.estadisticas_jugador est ON e.jugador_id = est.jugador_id 
        AND e.temporada_id = est.temporada_id 
        AND e.sistema_juego = est.sistema_juego
      WHERE t.año = ? AND e.sistema_juego = ? AND e.partidas_jugadas >= ?
      ORDER BY 
        e.partidas_jugadas DESC,
        porcentaje_victorias DESC,
        e.elo_actual DESC
      LIMIT ?
    `, [parseInt(añoActual), sistemaJuego, parseInt(minPartidas), parseInt(limit)]);
    
    const rankingConCategoria = ranking.map(jugador => ({
      ...jugador,
      categoria: obtenerCategoria(jugador.elo_actual)
    }));
    
    console.log(rankingConCategoria);
    res.json(rankingConCategoria);
  } catch (error) {
    console.error('Error obteniendo ranking:', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

//======RANKING GLOBAL======

router.get('/ranking-global', async (req, res) => {
  try {
    const { limit = 100, minPartidas = 0 } = req.query;
    const añoActual = new Date().getFullYear();
    
    // ✅ CORRECTO: Cruza ambas BDs → poolGeneral con prefijos
    const [ranking] = await poolGeneral.query(`
      SELECT 
        e.jugador_id,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.email,
        u.club,
        e.sistema_juego,
        e.elo_actual,
        e.partidas_jugadas,
        e.victorias,
        e.derrotas,
        e.warlords_muertos,
        ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) as porcentaje_victorias,
        RANK() OVER (
          PARTITION BY e.sistema_juego 
          ORDER BY 
            e.partidas_jugadas DESC,
            ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) DESC,
            e.elo_actual DESC
        ) as posicion_sistema,
        RANK() OVER (
          ORDER BY 
            e.partidas_jugadas DESC,
            ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) DESC,
            e.elo_actual DESC
        ) as posicion_global
      FROM rankingTorneos.elo_jugadores e
      JOIN torneos.usuarios u ON e.jugador_id = u.id
      JOIN rankingTorneos.temporadas t ON e.temporada_id = t.id
      WHERE t.año = ? AND e.partidas_jugadas >= ?
      ORDER BY 
        e.partidas_jugadas DESC,
        porcentaje_victorias DESC,
        e.elo_actual DESC
      LIMIT ?
    `, [añoActual, parseInt(minPartidas), parseInt(limit)]);
    
    const rankingConCategoria = ranking.map(jugador => ({
      ...jugador,
      categoria: obtenerCategoria(jugador.elo_actual)
    }));
    
    res.json(rankingConCategoria);
    console.log(rankingConCategoria);
  } catch (error) {
    console.error('Error obteniendo ranking global:', error);
    res.status(500).json({ error: 'Error al obtener ranking global' });
  }
});

// ============================================
// ENDPOINTS - JUGADORES
// ============================================

router.get('/jugador/:jugadorId', async (req, res) => {
  try {
    const { jugadorId } = req.params;
    const añoActual = new Date().getFullYear();
    
    // ✅ CORRECTO: Cruza ambas BDs → poolGeneral con prefijos
    const [datos] = await poolGeneral.query(`
      SELECT 
        e.*,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.email,
        u.club,
        t.nombre as temporada_nombre,
        t.año as temporada_año,
        ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) as porcentaje_victorias,
        (SELECT COUNT(*) + 1 
         FROM rankingTorneos.elo_jugadores e2 
         WHERE e2.temporada_id = e.temporada_id 
         AND e2.sistema_juego = e.sistema_juego
         AND e2.elo_actual > e.elo_actual) as posicion_ranking
      FROM rankingTorneos.elo_jugadores e
      JOIN torneos.usuarios u ON e.jugador_id = u.id
      JOIN rankingTorneos.temporadas t ON e.temporada_id = t.id
      WHERE e.jugador_id = ? AND t.año = ?
      ORDER BY e.sistema_juego
    `, [jugadorId, añoActual]);
    
    if (datos.length === 0) {
      return res.status(404).json({ 
        mensaje: 'Jugador no tiene datos de ELO en la temporada actual',
        jugadorId
      });
    }
    
    const datosConCategoria = datos.map(d => ({
      ...d,
      categoria: obtenerCategoria(d.elo_actual)
    }));
    
    res.json(datosConCategoria);
  } catch (error) {
    console.error('Error obteniendo datos del jugador:', error);
    res.status(500).json({ error: 'Error al obtener datos del jugador' });
  }
});

router.get('/jugador/:jugadorId/:sistemaJuego', async (req, res) => {
  try {
    const { jugadorId, sistemaJuego } = req.params;
    const añoActual = new Date().getFullYear();
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    // ✅ CORRECTO: Cruza ambas BDs → poolGeneral con prefijos
    const [datos] = await poolGeneral.query(`
      SELECT 
        e.*,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.email,
        u.club,
        t.nombre as temporada_nombre,
        t.año as temporada_año,
        ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) as porcentaje_victorias,
        (SELECT COUNT(*) + 1 
         FROM rankingTorneos.elo_jugadores e2 
         WHERE e2.temporada_id = e.temporada_id 
         AND e2.sistema_juego = e.sistema_juego
         AND e2.elo_actual > e.elo_actual) as posicion_ranking
      FROM rankingTorneos.elo_jugadores e
      JOIN torneos.usuarios u ON e.jugador_id = u.id
      JOIN rankingTorneos.temporadas t ON e.temporada_id = t.id
      WHERE e.jugador_id = ? AND t.año = ? AND e.sistema_juego = ?
      LIMIT 1
    `, [jugadorId, añoActual, sistemaJuego]);
    
    if (datos.length === 0) {
      return res.status(404).json({ 
        mensaje: 'Jugador no tiene datos de ELO en este sistema',
        elo_inicial: 1500,
        sistemaJuego
      });
    }
    
    const datosConCategoria = {
      ...datos[0],
      categoria: obtenerCategoria(datos[0].elo_actual)
    };
    
    res.json(datosConCategoria);
  } catch (error) {
    console.error('Error obteniendo datos del jugador:', error);
    res.status(500).json({ error: 'Error al obtener datos del jugador' });
  }
});

router.get('/jugador/:jugadorId/:sistemaJuego/historial', async (req, res) => {
  try {
    const { jugadorId, sistemaJuego } = req.params;
    const { limit = 50 } = req.query;
    const añoActual = new Date().getFullYear();
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    // ✅ CORRECTO: Cruza ambas BDs → poolGeneral con prefijos
    const [historial] = await poolGeneral.query(`
      SELECT 
        h.*,
        u.nombre as oponente_nombre,
        u.apellidos as oponente_apellidos,
        u.nombre_alias as oponente_alias,
        t.nombre_torneo as torneo_nombre,
        t.fecha_inicio as torneo_fecha,
        t.sistema as torneo_sistema
      FROM rankingTorneos.elo_historial h
      JOIN torneos.usuarios u ON h.oponente_id = u.id
      JOIN torneos.torneos_sistemas t ON h.torneo_id = t.id
      JOIN rankingTorneos.temporadas temp ON h.temporada_id = temp.id
      WHERE h.jugador_id = ? AND temp.año = ? AND h.sistema_juego = ?
      ORDER BY h.fecha DESC
      LIMIT ?
    `, [jugadorId, añoActual, sistemaJuego, parseInt(limit)]);
    
    res.json(historial);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ============================================
// ENDPOINTS - ACTUALIZACIÓN DE ELO
// ============================================

router.post('/actualizar-torneo/:torneoId', verificarToken, verificarSuperAdmin, async (req, res) => {
  const { torneoId } = req.params;
  
  try {
    const resultado = await executeCrossTransaction(async (connTorneos, connRanking) => {
      // 1. Obtener información del torneo
      const [torneo] = await connTorneos.query(
        'SELECT * FROM torneos_sistemas WHERE id = ?',
        [torneoId]
      );
      
      if (torneo.length === 0) {
        throw new Error('Torneo no encontrado');
      }
      
      if (torneo[0].estado !== 'finalizado') {
        throw new Error('El torneo debe estar finalizado para calcular ELO');
      }
      
      if (torneo[0].elo_procesado) {
        throw new Error('El ELO de este torneo ya fue procesado');
      }
      
      const sistemaJuego = torneo[0].sistema.toLowerCase();
      
      if (!sistemaJuego) {
        throw new Error('El torneo no tiene un sistema de juego definido');
      }
      
      if (!validarSistemaJuego(sistemaJuego)) {
        throw new Error(`Sistema de juego "${sistemaJuego}" no es válido`);
      }
      
      // Obtener nombres de tablas dinámicamente
      const tablas = obtenerTablas(sistemaJuego);
      console.log(`📋 Procesando torneo ${torneoId} - Sistema: ${sistemaJuego.toUpperCase()}`);
      console.log(`📋 Usando tablas: ${tablas.partidas}, ${tablas.jugadorTorneo}`);
      
      // 2. Obtener o crear temporada
      const añoActual = new Date().getFullYear();
      let [temporada] = await connRanking.query(
        'SELECT id, elo_inicial FROM temporadas WHERE año = ? AND sistema_juego = ? LIMIT 1',
        [añoActual, sistemaJuego]
      );
      
      if (temporada.length === 0) {
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
      
      // 3. Obtener partidas finalizadas usando la tabla dinámica
      const [partidas] = await connTorneos.query(
        `SELECT 
          id,
          jugador1_id,
          jugador2_id,
          resultado_ps
         FROM ${tablas.partidas}
         WHERE torneo_id = ? 
         AND resultado_confirmado = TRUE 
         AND es_bye = FALSE
         ORDER BY ronda, mesa`,
        [torneoId]
      );
      
      if (partidas.length === 0) {
        throw new Error('No hay partidas confirmadas en este torneo');
      }
      
      console.log(`📊 Procesando ${partidas.length} partidas confirmadas`);
      
      // 4. Procesar cada partida
      let partidasProcesadas = 0;
      
      for (const partida of partidas) {
        // Obtener jugador_id real desde jugador_torneo_X
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
        
        // Obtener o crear ELO
        const jugador1 = await obtenerOCrearElo(
          connRanking,
          jugador1Id,
          temporadaId,
          sistemaJuego,
          eloInicial
        );
        
        const jugador2 = await obtenerOCrearElo(
          connRanking,
          jugador2Id,
          temporadaId,
          sistemaJuego,
          eloInicial
        );
        
        // Determinar ganador según resultado_ps
        let ganador;
        if (partida.resultado_ps === 'victoria_j1') {
          ganador = 1;
        } else if (partida.resultado_ps === 'victoria_j2') {
          ganador = 2;
        } else if (partida.resultado_ps === 'empate') {
          ganador = 0;
        } else {
          console.warn(`⚠️  Partida ${partida.id}: resultado pendiente`);
          continue;
        }
        
        // Calcular nuevos ELOs
        const cambios = eloSystem.procesarPartida(
          { elo: jugador1.elo_actual, partidasJugadas: jugador1.partidas_jugadas },
          { elo: jugador2.elo_actual, partidasJugadas: jugador2.partidas_jugadas },
          ganador
        );
        
        // Actualizar ELOs
        await actualizarEloJugador(
          connRanking,
          jugador1Id,
          temporadaId,
          sistemaJuego,
          cambios.jugador1.eloNuevo,
          cambios.jugador1.resultado
        );
        
        await actualizarEloJugador(
          connRanking,
          jugador2Id,
          temporadaId,
          sistemaJuego,
          cambios.jugador2.eloNuevo,
          cambios.jugador2.resultado
        );
        
        // Guardar en historial
        await connRanking.query(
          `INSERT INTO elo_historial 
           (jugador_id, temporada_id, sistema_juego, partida_id, torneo_id, elo_anterior, elo_nuevo, 
            cambio, oponente_id, oponente_elo, resultado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            jugador1Id, temporadaId, sistemaJuego, partida.id, torneoId,
            cambios.jugador1.eloAnterior, cambios.jugador1.eloNuevo, cambios.jugador1.cambio,
            jugador2Id, jugador2.elo_actual, cambios.jugador1.resultado
          ]
        );
        
        await connRanking.query(
          `INSERT INTO elo_historial 
           (jugador_id, temporada_id, sistema_juego, partida_id, torneo_id, elo_anterior, elo_nuevo, 
            cambio, oponente_id, oponente_elo, resultado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            jugador2Id, temporadaId, sistemaJuego, partida.id, torneoId,
            cambios.jugador2.eloAnterior, cambios.jugador2.eloNuevo, cambios.jugador2.cambio,
            jugador1Id, jugador1.elo_actual, cambios.jugador2.resultado
          ]
        );
        
        partidasProcesadas++;
      }
      
      // 5. Marcar torneo como procesado
      await connTorneos.query(
        'UPDATE torneos_sistemas SET elo_procesado = TRUE WHERE id = ?',
        [torneoId]
      );
      
      console.log(`✅ Torneo ${torneoId} (${sistemaJuego.toUpperCase()}) procesado: ${partidasProcesadas} partidas`);
      
      return { partidasProcesadas, sistemaJuego };
    });
    
    res.json({ 
      mensaje: 'ELO actualizado correctamente',
      partidasProcesadas: resultado.partidasProcesadas,
      sistemaJuego: resultado.sistemaJuego.toUpperCase()
    });
    
  } catch (error) {
    console.error('Error actualizando ELO:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar ELO' });
  }
});

// ============================================
// ENDPOINTS - ESTADÍSTICAS
// ============================================

router.get('/estadisticas/:sistemaJuego', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    const añoActual = new Date().getFullYear();
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    // ✅ CORREGIDO: Solo usa rankingTorneos → poolRanking sin prefijos
    const [stats] = await poolRanking.query(`
      SELECT 
        COUNT(DISTINCT e.jugador_id) as total_jugadores,
        SUM(e.partidas_jugadas) as total_partidas,
        ROUND(AVG(e.elo_actual), 2) as elo_promedio,
        MAX(e.elo_actual) as elo_maximo,
        MIN(e.elo_actual) as elo_minimo,
        e.sistema_juego
      FROM elo_jugadores e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE t.año = ? AND e.sistema_juego = ?
      GROUP BY e.sistema_juego
    `, [añoActual, sistemaJuego]);
    
    res.json(stats[0] || { sistema_juego: sistemaJuego, total_jugadores: 0 });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/estadisticas-globales', async (req, res) => {
  try {
    const añoActual = new Date().getFullYear();
    
    // ✅ CORREGIDO: Solo usa rankingTorneos → poolRanking sin prefijos
    const [stats] = await poolRanking.query(`
      SELECT 
        e.sistema_juego,
        COUNT(DISTINCT e.jugador_id) as total_jugadores,
        SUM(e.partidas_jugadas) as total_partidas,
        ROUND(AVG(e.elo_actual), 2) as elo_promedio,
        MAX(e.elo_actual) as elo_maximo
      FROM elo_jugadores e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE t.año = ?
      GROUP BY e.sistema_juego
      ORDER BY total_jugadores DESC
    `, [añoActual]);
    
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas globales:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas globales' });
  }
});

// ============================================
// ENDPOINTS - ESTADÍSTICAS DETALLADAS
// ============================================

// ===== OBTENER ESTADISTICAS DE CADA JUGADOR========

router.get('/jugador/:jugadorId/:sistemaJuego/estadisticas-completas', async (req, res) => {
  try {
    const { jugadorId, sistemaJuego } = req.params;
    const añoActual = new Date().getFullYear();
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    // ✅ CORRECTO: Cruza ambas BDs → poolGeneral con prefijos
    const [estadisticas] = await poolGeneral.query(`
      SELECT 
        e.*,
        ej.elo_actual,
        ej.elo_maximo,
        ej.partidas_jugadas,
        ej.victorias,
        ej.derrotas,
        ej.empates,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.club
      FROM rankingTorneos.estadisticas_jugador e
      JOIN rankingTorneos.elo_jugadores ej ON e.jugador_id = ej.jugador_id 
        AND e.temporada_id = ej.temporada_id 
        AND e.sistema_juego = ej.sistema_juego
      JOIN rankingTorneos.temporadas t ON e.temporada_id = t.id
      JOIN torneos.usuarios u ON e.jugador_id = u.id
      WHERE e.jugador_id = ? AND t.año = ? AND e.sistema_juego = ?
      LIMIT 1
    `, [jugadorId, añoActual, sistemaJuego]);
    
    if (estadisticas.length === 0) {
      return res.status(404).json({ 
        mensaje: 'No hay estadísticas para este jugador',
        jugadorId,
        sistemaJuego
      });
    }
    
    const stat = estadisticas[0];
    
    // Parsear JSON
    let epocasJugadas = {};
    let faccionesJugadas = {};
    
    try {
      epocasJugadas = stat.epocas_jugadas ? JSON.parse(stat.epocas_jugadas) : {};
      faccionesJugadas = stat.facciones_jugadas ? JSON.parse(stat.facciones_jugadas) : {};
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
    
    res.json({
      jugador: {
        id: stat.jugador_id,
        nombre: stat.nombre,
        apellidos: stat.apellidos,
        alias: stat.nombre_alias,
        club: stat.club
      },
      sistema: sistemaJuego,
      elo: {
        actual: stat.elo_actual,
        maximo: stat.elo_maximo,
        categoria: obtenerCategoria(stat.elo_actual)
      },
      partidas: {
        total: stat.partidas_jugadas,
        victorias: stat.victorias,
        derrotas: stat.derrotas,
        empates: stat.empates,
        porcentaje_victorias: stat.partidas_jugadas > 0 
          ? ((stat.victorias / stat.partidas_jugadas) * 100).toFixed(1) 
          : 0
      },
      epoca_favorita: stat.epoca_favorita,
      faccion_favorita: stat.faccion_favorita,
      epocas_jugadas: epocasJugadas,
      facciones_jugadas: faccionesJugadas,
      torneos: {
        participados: stat.torneos_participados,
        ganados: stat.torneos_ganados
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas completas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas completas' });
  }
});

// ===== OBTENER EPOCAS MAS USADAS (SAGA)========

router.get('/estadisticas/:sistemaJuego/epocas-populares', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    const añoActual = new Date().getFullYear();
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    // ✅ CORREGIDO: Solo usa rankingTorneos → poolRanking sin prefijos
    const [estadisticas] = await poolRanking.query(`
      SELECT 
        e.epoca_favorita,
        COUNT(*) as jugadores_usando,
        e.epocas_jugadas
      FROM estadisticas_jugador e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE t.año = ? AND e.sistema_juego = ? AND e.epoca_favorita IS NOT NULL
      GROUP BY e.epoca_favorita
      ORDER BY jugadores_usando DESC
      LIMIT 10
    `, [añoActual, sistemaJuego]);
    
    res.json(estadisticas);
    
  } catch (error) {
    console.error('Error obteniendo épocas populares:', error);
    res.status(500).json({ error: 'Error al obtener épocas populares' });
  }
});

// ===== OBTENER FACCIONES MAS USADAS (SAGA)========

router.get('/estadisticas/:sistemaJuego/facciones-populares', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    const añoActual = new Date().getFullYear();
    
    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }
    
    // ✅ CORREGIDO: Solo usa rankingTorneos → poolRanking sin prefijos
    const [estadisticas] = await poolRanking.query(`
      SELECT 
        e.faccion_favorita,
        COUNT(*) as jugadores_usando,
        e.facciones_jugadas
      FROM estadisticas_jugador e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE t.año = ? AND e.sistema_juego = ? AND e.faccion_favorita IS NOT NULL
      GROUP BY e.faccion_favorita
      ORDER BY jugadores_usando DESC
      LIMIT 10
    `, [añoActual, sistemaJuego]);
    
    res.json(estadisticas);
    
  } catch (error) {
    console.error('Error obteniendo facciones populares:', error);
    res.status(500).json({ error: 'Error al obtener facciones populares' });
  }
});

//=======ACTUALIZAR RANKING AUTO=======

router.post('/:torneoId/finalizar', verificarToken, async (req, res) => {
  const { torneoId } = req.params;
  
  try {
    const resultado = await executeCrossTransaction(async (connTorneos, connRanking) => {
      // 1. Verificar que el torneo existe
      const [torneo] = await connTorneos.query(
        'SELECT * FROM torneos_sistemas WHERE id = ?',
        [torneoId]
      );
      
      if (torneo.length === 0) {
        throw new Error('Torneo no encontrado');
      }
      
      if (torneo[0].estado === 'finalizado') {
        throw new Error('El torneo ya está finalizado');
      }
      
      // 2. Finalizar el torneo
      await connTorneos.query(
        'UPDATE torneos_sistemas SET estado = "finalizado" WHERE id = ?',
        [torneoId]
      );
      
      console.log(`✅ Torneo ${torneoId} finalizado`);
      
      // 3. Calcular ELO automáticamente
      try {
        const resultadoElo = await actualizarEloAutomatico(
          connTorneos, 
          connRanking, 
          torneoId
        );
        
        console.log(`✅ ELO calculado: ${resultadoElo.partidasProcesadas} partidas`);
        
        return {
          mensaje: 'Torneo finalizado correctamente',
          torneoId,
          elo: resultadoElo
        };
      } catch (eloError) {
        console.error('⚠️ Error calculando ELO (torneo ya finalizado):', eloError.message);
        
        // El torneo se finalizó pero hubo error en ELO
        // Esto no es crítico, se puede recalcular después
        return {
          mensaje: 'Torneo finalizado correctamente',
          torneoId,
          advertencia: 'No se pudo calcular el ELO automáticamente',
          errorElo: eloError.message
        };
      }
    });
    
    res.json(resultado);
    
  } catch (error) {
    console.error('Error finalizando torneo:', error);
    res.status(500).json({ 
      error: error.message || 'Error al finalizar torneo' 
    });
  }
});

export default router;