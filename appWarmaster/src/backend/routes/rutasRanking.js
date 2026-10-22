// routes/rutasRanking.js
import express from 'express';
import { pool, poolRanking, executeCrossTransaction } from '../config/bd.js';
import { verificarToken, verificarSuperAdmin } from '../middleware/auth.js';
import {
  validarSistemaJuego,
  obtenerSistemasDisponibles
} from '../utilsRanking/tablasJuegos.js';
import {
  obtenerOCrearTemporada,
  obtenerAñoTemporada
} from '../utilsRanking/temporadas.js';

import { actualizarEloAutomatico } from '../utilsRanking/calculoAutoRanking.js';
import { obtenerSistemasActivos, rankingActivo } from '../utilsRanking/configRanking.js';
import { esPaisValido } from '../utilsRanking/paises.js';
import { provinciasDeComunidad, provinciaDeCP } from '../utilsRanking/provinciasES.js';

const router = express.Router();

// Mínimo de partidas por defecto para aparecer en el ranking
const MIN_PARTIDAS_DEFECTO = { saga: 3 };

function obtenerCategoria(elo) {
  if (elo >= 2400) return { nombre: 'Gran Maestro', clase: 'gran-maestro' };
  if (elo >= 2200) return { nombre: 'Maestro', clase: 'maestro' };
  if (elo >= 2000) return { nombre: 'Experto', clase: 'experto' };
  if (elo >= 1800) return { nombre: 'Avanzado', clase: 'avanzado' };
  if (elo >= 1600) return { nombre: 'Intermedio', clase: 'intermedio' };
  if (elo >= 1400) return { nombre: 'Principiante', clase: 'principiante' };
  return { nombre: 'Novato', clase: 'novato' };
}

/**
 * Filtro de temporada a partir de ?año=
 *   'general' → histórico | '2025' → esa temporada | vacío → temporada actual
 * Devuelve el trozo de SQL (sobre el alias "t") y sus valores.
 */
function filtroTemporadaDesdeQuery(año) {
  if (año === 'general') {
    return { sql: `t.tipo = 'general'`, valores: [] };
  }
  return {
    sql: `t.tipo = 'anual' AND t.año = ?`,
    valores: [parseInt(año) || obtenerAñoTemporada()]
  };
}

// ============================================
// ENDPOINTS - SISTEMAS DE JUEGO
// ============================================

router.get('/sistemas-juego', async (req, res) => {
  try {
    const todos = await obtenerSistemasDisponibles(pool);
    const activos = await obtenerSistemasActivos(poolRanking);
    const sistemas = todos.filter(s => validarSistemaJuego(s) && activos.includes(s.toLowerCase()));

    // Totales históricos (temporada general): no se quedan a 0 al empezar cada temporada
    const sistemasConStats = await Promise.all(
      sistemas.map(async (sistema) => {
        const [stats] = await poolRanking.query(`
          SELECT
            COUNT(DISTINCT e.jugador_id) as total_jugadores,
            SUM(e.partidas_jugadas) as total_partidas
          FROM elo_jugadores e
          JOIN temporadas t ON e.temporada_id = t.id
          WHERE t.tipo = 'general' AND e.sistema_juego = ?
        `, [sistema]);

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

    const temporada = await obtenerOCrearTemporada(poolRanking, sistemaJuego);

    res.json(temporada);
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

/**
 * GET /ranking/:sistemaJuego
 *   ?año=general | 2025 | (vacío = temporada actual)
 *   ?limit=50
 *   ?minPartidas=3
 *   ?pais=FR  |  ?pais=ES&comunidad=madrid  |  ?pais=ES&provincia=28
 */
router.get('/ranking/:sistemaJuego', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    const { limit = 100, año, pais, comunidad, provincia } = req.query;

    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }

    const minPartidas = req.query.minPartidas !== undefined
      ? Math.max(0, parseInt(req.query.minPartidas) || 0)
      : (MIN_PARTIDAS_DEFECTO[sistemaJuego] ?? 0);

    // ── Temporada ──
    const temporada = filtroTemporadaDesdeQuery(año);

    // ── Filtro geográfico ──
    let filtroZona = '';
    let idsZona = [];

    if (pais || comunidad || provincia) {
      // Comunidad y provincia solo existen en España
      const paisFiltro = String(pais || 'ES').toUpperCase();

      if (!esPaisValido(paisFiltro)) {
        return res.status(400).json({ error: 'País no válido' });
      }

      const condiciones = ['pais = ?'];
      const valores = [paisFiltro];

      if (paisFiltro === 'ES' && (provincia || comunidad)) {
        const prefijos = provincia ? [String(provincia)] : provinciasDeComunidad(comunidad);
        if (prefijos.length === 0) {
          return res.status(400).json({ error: 'Zona no válida' });
        }
        condiciones.push(`LEFT(codigo_postal, 2) IN (${prefijos.map(() => '?').join(',')})`);
        valores.push(...prefijos);
      }

      const [usuariosZona] = await pool.query(
        `SELECT id FROM usuarios WHERE ${condiciones.join(' AND ')}`,
        valores
      );

      if (usuariosZona.length === 0) {
        return res.json([]);
      }

      idsZona = usuariosZona.map(u => u.id);
      filtroZona = `AND e.jugador_id IN (${idsZona.map(() => '?').join(',')})`;
    }

    // ── PASO 1: Datos de ranking ──
    // Las posiciones se calculan DENTRO del filtro (el 1º de Madrid, no el 1º de España)
    const [rankingData] = await poolRanking.query(`
      SELECT
        e.jugador_id, e.elo_actual, e.elo_maximo, e.elo_minimo,
        e.partidas_jugadas, e.victorias, e.derrotas, e.empates,
        e.warlords_muertos, e.sistema_juego,
        ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) as porcentaje_victorias,
        t.nombre as temporada_nombre,
        t.año as temporada_año,
        t.tipo as temporada_tipo,
        RANK() OVER (ORDER BY e.elo_actual DESC) as posicion,
        est.epoca_favorita,
        est.faccion_favorita
      FROM elo_jugadores e
      JOIN temporadas t ON e.temporada_id = t.id
      LEFT JOIN estadisticas_jugador est ON e.jugador_id = est.jugador_id
        AND e.temporada_id = est.temporada_id
        AND e.sistema_juego = est.sistema_juego
      WHERE ${temporada.sql}
        AND e.sistema_juego = ?
        AND e.partidas_jugadas >= ?
        ${filtroZona}
      ORDER BY e.elo_actual DESC
      LIMIT ?
    `, [...temporada.valores, sistemaJuego, minPartidas, ...idsZona, parseInt(limit)]);

    if (rankingData.length === 0) {
      return res.json([]);
    }

    // ── PASO 2: Datos de usuarios ──
    const jugadorIds = rankingData.map(r => r.jugador_id);
    const placeholders = jugadorIds.map(() => '?').join(',');
    const [usuarios] = await pool.query(
      `SELECT id, nombre, apellidos, nombre_alias, club, pais, codigo_postal
       FROM usuarios WHERE id IN (${placeholders})`,
      jugadorIds
    );

    // ── PASO 3: Combinar (nunca se devuelve el código postal, solo la provincia) ──
    const usuariosMap = {};
    usuarios.forEach(u => { usuariosMap[u.id] = u; });

    const ranking = rankingData.map(jugador => {
      const usuario = usuariosMap[jugador.jugador_id] || {};
      return {
        ...jugador,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        nombre_alias: usuario.nombre_alias,
        club: usuario.club,
        pais: usuario.pais || null,
        provincia: usuario.pais === 'ES' ? (provinciaDeCP(usuario.codigo_postal)?.nombre || null) : null,
        categoria: obtenerCategoria(jugador.elo_actual)
      };
    });

    res.json(ranking);
  } catch (error) {
    console.error('Error obteniendo ranking:', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

// ============================================
// PAÍSES CON JUGADORES (para el filtro geográfico)
// ============================================

router.get('/paises-disponibles', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pais, COUNT(*) AS total
       FROM usuarios
       WHERE pais IS NOT NULL
       GROUP BY pais
       ORDER BY total DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo países:', error);
    res.status(500).json({ error: 'Error al obtener países' });
  }
});

// ============================================
// RECALCULAR TODO EL RANKING (superadmin)
// ============================================

router.post('/recalcular-todo', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const resultado = await executeCrossTransaction(async (connTorneos, connRanking) => {
      const activos = await obtenerSistemasActivos(connRanking);

      if (activos.length === 0) {
        throw new Error('No hay ningún sistema con el ranking activo');
      }

      const ph = activos.map(() => '?').join(',');

      // 1. Vaciar SOLO los sistemas activos (el orden importa por las FK)
      await connRanking.query(`DELETE FROM elo_historial WHERE sistema_juego IN (${ph})`, activos);
      await connRanking.query(`DELETE FROM estadisticas_jugador WHERE sistema_juego IN (${ph})`, activos);
      await connRanking.query(`DELETE FROM elo_jugadores WHERE sistema_juego IN (${ph})`, activos);
      await connRanking.query(`DELETE FROM temporadas WHERE sistema_juego IN (${ph})`, activos);

      // 2. Marcar sus torneos como no procesados
      await connTorneos.query(
        `UPDATE torneos_sistemas SET elo_procesado = FALSE WHERE LOWER(sistema) IN (${ph})`,
        activos
      );

      // 3. Reprocesar en orden cronológico
      const [torneos] = await connTorneos.query(
        `SELECT id, nombre_torneo
         FROM torneos_sistemas
         WHERE estado = 'finalizado' AND LOWER(sistema) IN (${ph})
         ORDER BY COALESCE(fecha_fin, fecha_inicio) ASC, id ASC`,
        activos
      );

      const procesados = [];
      const errores = [];

      for (const t of torneos) {
        try {
          const r = await actualizarEloAutomatico(connTorneos, connRanking, t.id);
          procesados.push({ torneoId: t.id, nombre: t.nombre_torneo, ...r });
        } catch (e) {
          errores.push({ torneoId: t.id, nombre: t.nombre_torneo, error: e.message });
        }
      }

      return { sistemas: activos, total: torneos.length, procesados, errores };
    });

    res.json({ mensaje: 'Ranking recalculado', ...resultado });
  } catch (error) {
    console.error('Error recalculando ranking:', error);
    res.status(500).json({ error: error.message || 'Error al recalcular ranking' });
  }
});

// ============================================
// CONFIGURACIÓN DEL RANKING (superadmin)
// ============================================

// Lista TODOS los sistemas de la plataforma, con su estado y si tienen ranking programado
router.get('/config', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const todos = await obtenerSistemasDisponibles(pool);

    const [rows] = await poolRanking.query(
      'SELECT sistema_juego, activo FROM configuracion_ranking'
    );
    const estado = new Map(rows.map(r => [r.sistema_juego.toLowerCase(), !!r.activo]));

    const nombres = new Set([
      ...todos.map(s => String(s).toLowerCase()),
      ...estado.keys()
    ]);

    const config = [...nombres].sort().map(sistema => ({
      sistema_juego: sistema,
      activo: estado.get(sistema) || false,
      soportado: validarSistemaJuego(sistema)
    }));

    res.json(config);
  } catch (error) {
    console.error('Error obteniendo configuración del ranking:', error);
    res.status(500).json({ error: 'Error al obtener la configuración del ranking' });
  }
});

router.put('/config/:sistemaJuego', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const sistemaJuego = req.params.sistemaJuego.toLowerCase();
    const { activo } = req.body;

    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }

    await poolRanking.query(
      `INSERT INTO configuracion_ranking (sistema_juego, activo) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE activo = VALUES(activo)`,
      [sistemaJuego, !!activo]
    );

    res.json({ sistema_juego: sistemaJuego, activo: !!activo });
  } catch (error) {
    console.error('Error actualizando configuración del ranking:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración del ranking' });
  }
});

// ============================================
// RANKING GLOBAL (todos los sistemas, temporada actual)
// ============================================

router.get('/ranking-global', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const minPartidas = 6;
    const añoActual = obtenerAñoTemporada();

    // PASO 1: Obtener datos de ranking
    const [rankingData] = await poolRanking.query(`
      SELECT
        e.jugador_id,
        e.sistema_juego,
        e.elo_actual,
        e.partidas_jugadas,
        e.victorias,
        e.derrotas,
        e.warlords_muertos,
        ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) as porcentaje_victorias,
        RANK() OVER (
          PARTITION BY e.sistema_juego
          ORDER BY e.elo_actual DESC
        ) as posicion_sistema,
        RANK() OVER (
          ORDER BY e.elo_actual DESC
        ) as posicion_global
      FROM elo_jugadores e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE t.tipo = 'anual' AND t.año = ? AND e.partidas_jugadas >= ?
      ORDER BY e.elo_actual DESC
      LIMIT ?
    `, [añoActual, minPartidas, parseInt(limit)]);

    if (rankingData.length === 0) {
      return res.json([]);
    }

    // PASO 2: Obtener datos de usuarios
    const jugadorIds = rankingData.map(r => r.jugador_id);
    const placeholders = jugadorIds.map(() => '?').join(',');
    const [usuarios] = await pool.query(
      `SELECT id, nombre, apellidos, nombre_alias, club, pais
       FROM usuarios
       WHERE id IN (${placeholders})`,
      jugadorIds
    );

    // PASO 3: Combinar datos
    const usuariosMap = {};
    usuarios.forEach(u => { usuariosMap[u.id] = u; });

    const ranking = rankingData.map(jugador => {
      const usuario = usuariosMap[jugador.jugador_id] || {};
      return {
        ...jugador,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        nombre_alias: usuario.nombre_alias,
        club: usuario.club,
        pais: usuario.pais || null,
        categoria: obtenerCategoria(jugador.elo_actual)
      };
    });

    res.json(ranking);
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
    const añoActual = obtenerAñoTemporada();

    // PASO 1: Obtener datos de ELO
    const [datosElo] = await poolRanking.query(`
      SELECT
        e.*,
        t.nombre as temporada_nombre,
        t.año as temporada_año,
        ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) as porcentaje_victorias,
        (SELECT COUNT(*) + 1
         FROM elo_jugadores e2
         WHERE e2.temporada_id = e.temporada_id
         AND e2.sistema_juego = e.sistema_juego
         AND e2.elo_actual > e.elo_actual) as posicion_ranking
      FROM elo_jugadores e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE e.jugador_id = ? AND t.tipo = 'anual' AND t.año = ?
      ORDER BY e.sistema_juego
    `, [jugadorId, añoActual]);

    if (datosElo.length === 0) {
      return res.json([]);
    }

    // PASO 2: Obtener datos del usuario
    const [usuarios] = await pool.query(
      'SELECT nombre, apellidos, nombre_alias, email, club, localidad, pais, codigo_postal FROM usuarios WHERE id = ?',
      [jugadorId]
    );

    const usuario = usuarios[0] || {};

    // PASO 3: Combinar datos
    const datos = datosElo.map(d => ({
      ...d,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      nombre_alias: usuario.nombre_alias,
      email: usuario.email,
      club: usuario.club,
      localidad: usuario.localidad,
      pais: usuario.pais,
      codigo_postal: usuario.codigo_postal,
      categoria: obtenerCategoria(d.elo_actual)
    }));

    res.json(datos);
  } catch (error) {
    console.error('Error obteniendo datos del jugador:', error);
    res.status(500).json({ error: 'Error al obtener datos del jugador' });
  }
});

router.get('/jugador/:jugadorId/:sistemaJuego', async (req, res) => {
  try {
    const { jugadorId, sistemaJuego } = req.params;
    const añoActual = obtenerAñoTemporada();

    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }

    // PASO 1: Obtener datos de ELO
    const [datosElo] = await poolRanking.query(`
      SELECT
        e.*,
        t.nombre as temporada_nombre,
        t.año as temporada_año,
        ROUND((e.victorias * 100.0 / NULLIF(e.partidas_jugadas, 0)), 2) as porcentaje_victorias,
        (SELECT COUNT(*) + 1
         FROM elo_jugadores e2
         WHERE e2.temporada_id = e.temporada_id
         AND e2.sistema_juego = e.sistema_juego
         AND e2.elo_actual > e.elo_actual) as posicion_ranking
      FROM elo_jugadores e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE e.jugador_id = ? AND t.tipo = 'anual' AND t.año = ? AND e.sistema_juego = ?
      LIMIT 1
    `, [jugadorId, añoActual, sistemaJuego]);

    if (datosElo.length === 0) {
      return res.status(404).json({
        mensaje: 'Jugador no tiene datos de ELO en este sistema',
        elo_inicial: 1500,
        sistemaJuego
      });
    }

    // PASO 2: Obtener datos del usuario
    const [usuarios] = await pool.query(
      'SELECT nombre, apellidos, nombre_alias, email, club FROM usuarios WHERE id = ?',
      [jugadorId]
    );

    const usuario = usuarios[0] || {};

    // PASO 3: Combinar datos
    const datos = {
      ...datosElo[0],
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      nombre_alias: usuario.nombre_alias,
      email: usuario.email,
      club: usuario.club,
      codigo_postal: usuario.codigo_postal,
      localidad: usuario.localidad,
      pais: usuario.pais,
      categoria: obtenerCategoria(datosElo[0].elo_actual)
    };

    res.json(datos);
  } catch (error) {
    console.error('Error obteniendo datos del jugador:', error);
    res.status(500).json({ error: 'Error al obtener datos del jugador' });
  }
});

router.get('/jugador/:jugadorId/:sistemaJuego/historial', async (req, res) => {
  try {
    const { jugadorId, sistemaJuego } = req.params;
    const { limit = 50 } = req.query;
    const añoActual = obtenerAñoTemporada();

    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }

    // PASO 1: Obtener historial de ELO
    const [historialElo] = await poolRanking.query(`
      SELECT
        h.*
      FROM elo_historial h
      JOIN temporadas temp ON h.temporada_id = temp.id
      WHERE h.jugador_id = ? AND temp.tipo = 'anual' AND temp.año = ? AND h.sistema_juego = ?
      ORDER BY h.fecha DESC
      LIMIT ?
    `, [jugadorId, añoActual, sistemaJuego, parseInt(limit)]);

    if (historialElo.length === 0) {
      return res.json([]);
    }

    // PASO 2: Obtener IDs únicos
    const oponenteIds = [...new Set(historialElo.map(h => h.oponente_id))];
    const torneoIds = [...new Set(historialElo.map(h => h.torneo_id))];

    // PASO 3: Obtener datos de oponentes
    const placeholdersOponentes = oponenteIds.map(() => '?').join(',');
    const [oponentes] = await pool.query(
      `SELECT id, nombre, apellidos, nombre_alias
       FROM usuarios
       WHERE id IN (${placeholdersOponentes})`,
      oponenteIds
    );

    const oponentesMap = {};
    oponentes.forEach(o => { oponentesMap[o.id] = o; });

    // PASO 4: Obtener datos de torneos
    const placeholdersTorneos = torneoIds.map(() => '?').join(',');
    const [torneos] = await pool.query(
      `SELECT id, nombre_torneo, fecha_inicio, sistema
       FROM torneos_sistemas
       WHERE id IN (${placeholdersTorneos})`,
      torneoIds
    );

    const torneosMap = {};
    torneos.forEach(t => { torneosMap[t.id] = t; });

    // PASO 5: Combinar datos
    const historial = historialElo.map(h => {
      const oponente = oponentesMap[h.oponente_id] || {};
      const torneo = torneosMap[h.torneo_id] || {};

      return {
        ...h,
        oponente_nombre: oponente.nombre,
        oponente_apellidos: oponente.apellidos,
        oponente_alias: oponente.nombre_alias,
        torneo_nombre: torneo.nombre_torneo,
        torneo_fecha: torneo.fecha_inicio,
        torneo_sistema: torneo.sistema
      };
    });

    res.json(historial);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ============================================
// ENDPOINTS - ACTUALIZACIÓN DE ELO (superadmin)
// ============================================

router.post('/actualizar-torneo/:torneoId', verificarToken, verificarSuperAdmin, async (req, res) => {
  const { torneoId } = req.params;

  try {
    const resultado = await executeCrossTransaction(async (connTorneos, connRanking) => {
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

      const sistemaJuego = torneo[0].sistema?.toLowerCase();

      if (!sistemaJuego) {
        throw new Error('El torneo no tiene un sistema de juego definido');
      }

      if (!validarSistemaJuego(sistemaJuego)) {
        throw new Error(`Sistema de juego "${sistemaJuego}" no es válido`);
      }

      if (!(await rankingActivo(connRanking, sistemaJuego))) {
        throw new Error(`El ranking de ${sistemaJuego.toUpperCase()} está en standby`);
      }

      const resultadoElo = await actualizarEloAutomatico(connTorneos, connRanking, torneoId);

      return {
        partidasProcesadas: resultadoElo.partidasProcesadas,
        sistemaJuego
      };
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

// ?año=general | 2025 | (vacío = temporada actual)
router.get('/estadisticas/:sistemaJuego', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;

    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }

    const temporada = filtroTemporadaDesdeQuery(req.query.año);

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
      WHERE ${temporada.sql} AND e.sistema_juego = ?
      GROUP BY e.sistema_juego
    `, [...temporada.valores, sistemaJuego]);

    res.json(stats[0] || { sistema_juego: sistemaJuego, total_jugadores: 0 });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/estadisticas-globales', async (req, res) => {
  try {
    const añoActual = obtenerAñoTemporada();

    const [stats] = await poolRanking.query(`
      SELECT
        e.sistema_juego,
        COUNT(DISTINCT e.jugador_id) as total_jugadores,
        SUM(e.partidas_jugadas) as total_partidas,
        ROUND(AVG(e.elo_actual), 2) as elo_promedio,
        MAX(e.elo_actual) as elo_maximo
      FROM elo_jugadores e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE t.tipo = 'anual' AND t.año = ?
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

router.get('/jugador/:jugadorId/:sistemaJuego/estadisticas-completas', async (req, res) => {
  try {
    const { jugadorId, sistemaJuego } = req.params;
    const añoActual = obtenerAñoTemporada();

    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }

    // PASO 1: Obtener estadísticas
    const [estadisticas] = await poolRanking.query(`
      SELECT
        e.*,
        ej.elo_actual,
        ej.elo_maximo,
        ej.partidas_jugadas,
        ej.victorias,
        ej.derrotas,
        ej.empates
      FROM estadisticas_jugador e
      JOIN elo_jugadores ej ON e.jugador_id = ej.jugador_id
        AND e.temporada_id = ej.temporada_id
        AND e.sistema_juego = ej.sistema_juego
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE e.jugador_id = ? AND t.tipo = 'anual' AND t.año = ? AND e.sistema_juego = ?
      LIMIT 1
    `, [jugadorId, añoActual, sistemaJuego]);

    if (estadisticas.length === 0) {
      return res.status(404).json({
        mensaje: 'No hay estadísticas para este jugador',
        jugadorId,
        sistemaJuego
      });
    }

    // PASO 2: Obtener datos del usuario
    const [usuarios] = await pool.query(
      'SELECT nombre, apellidos, nombre_alias, club FROM usuarios WHERE id = ?',
      [jugadorId]
    );

    const usuario = usuarios[0] || {};
    const stat = estadisticas[0];

    // Parsear JSON (puede venir como string o como objeto)
    let epocasJugadas = {};
    let faccionesJugadas = {};

    try {
      epocasJugadas = typeof stat.epocas_jugadas === 'string'
        ? JSON.parse(stat.epocas_jugadas)
        : (stat.epocas_jugadas || {});

      faccionesJugadas = typeof stat.facciones_jugadas === 'string'
        ? JSON.parse(stat.facciones_jugadas)
        : (stat.facciones_jugadas || {});
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }

    res.json({
      jugador: {
        id: stat.jugador_id,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        alias: usuario.nombre_alias,
        club: usuario.club
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

router.get('/estadisticas/:sistemaJuego/epocas-populares', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    const añoActual = obtenerAñoTemporada();

    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }

    const [estadisticas] = await poolRanking.query(`
      SELECT
        e.epoca_favorita,
        COUNT(*) as jugadores_usando
      FROM estadisticas_jugador e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE t.tipo = 'anual' AND t.año = ? AND e.sistema_juego = ? AND e.epoca_favorita IS NOT NULL
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

router.get('/estadisticas/:sistemaJuego/facciones-populares', async (req, res) => {
  try {
    const { sistemaJuego } = req.params;
    const añoActual = obtenerAñoTemporada();

    if (!validarSistemaJuego(sistemaJuego)) {
      return res.status(400).json({ error: 'Sistema de juego no válido' });
    }

    const [estadisticas] = await poolRanking.query(`
      SELECT
        e.faccion_favorita,
        COUNT(*) as jugadores_usando
      FROM estadisticas_jugador e
      JOIN temporadas t ON e.temporada_id = t.id
      WHERE t.tipo = 'anual' AND t.año = ? AND e.sistema_juego = ? AND e.faccion_favorita IS NOT NULL
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

// ============================================
// FINALIZAR TORNEO CON ELO AUTOMÁTICO
// ============================================

router.post('/:torneoId/finalizar', verificarToken, async (req, res) => {
  const { torneoId } = req.params;

  try {
    const resultado = await executeCrossTransaction(async (connTorneos, connRanking) => {
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

      // Finalizar el torneo (siempre, esté o no activo el ranking)
      await connTorneos.query(
        'UPDATE torneos_sistemas SET estado = "finalizado" WHERE id = ?',
        [torneoId]
      );

      console.log(`✅ Torneo ${torneoId} finalizado`);

      // Si el ranking de este sistema está en standby, no se calcula ELO
      if (!(await rankingActivo(connRanking, torneo[0].sistema))) {
        console.log(`⏸️ Ranking en standby para ${torneo[0].sistema}: no se calcula ELO`);
        return {
          mensaje: 'Torneo finalizado correctamente',
          torneoId,
          advertencia: 'Ranking en standby: no se ha calculado el ELO'
        };
      }

      // Calcular ELO automáticamente
      try {
        const resultadoElo = await actualizarEloAutomatico(connTorneos, connRanking, torneoId);

        console.log(`✅ ELO calculado: ${resultadoElo.partidasProcesadas} partidas`);

        return {
          mensaje: 'Torneo finalizado correctamente',
          torneoId,
          elo: resultadoElo
        };
      } catch (eloError) {
        console.error('⚠️ Error calculando ELO:', eloError.message);

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