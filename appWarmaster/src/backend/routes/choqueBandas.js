// routes/choqueBandas.js
const express = require('express');
const { pool } = require('../config/bd');
const { verificarToken } = require('../middleware/auth');
const { 
  calcularResultado,
  calcularPuntosTorneo,
  validarCamposRequeridos,
  errorResponse,
  successResponse,
  manejarErrorDB
} = require('../utils/helpers');

const router = express.Router();

// ==========================================
// OBTENER PARTIDAS DE CHOQUE DE BANDAS DE UN TORNEO
// ==========================================
router.get('/torneo/:torneoId', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    let whereClause = 'WHERE cb.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND cb.ronda = ?';
      params.push(ronda);
    }
    
    const [partidas] = await pool.execute(`
      SELECT 
        cb.*,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
        u2.nombre as jugador2_nombre,
        u2.apellidos as jugador2_apellidos,
        u2.nombre_alias as jugador2_alias,
        p1.faccion as jugador1_faccion,
        p2.faccion as jugador2_faccion
      FROM choque_bandas cb
      JOIN usuarios u1 ON cb.jugador1_id = u1.id
      JOIN usuarios u2 ON cb.jugador2_id = u2.id
      LEFT JOIN participantes p1 ON (cb.torneo_id = p1.torneo_id AND cb.jugador1_id = p1.jugador_id)
      LEFT JOIN participantes p2 ON (cb.torneo_id = p2.torneo_id AND cb.jugador2_id = p2.jugador_id)
      ${whereClause}
      ORDER BY cb.ronda, cb.created_at
    `, params);
    
    res.json(
      successResponse('Partidas de Choque de Bandas obtenidas exitosamente', {
        partidas,
        totalPartidas: partidas.length
      })
    );
    
  } catch (error) {
    console.error('Error al obtener partidas de Choque de Bandas:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ==========================================
// REGISTRAR PARTIDA DE CHOQUE DE BANDAS
// ==========================================
router.post('/', verificarToken, async (req, res) => {
  try {
    const { 
      torneo_id, 
      jugador1_id, 
      jugador2_id, 
      puntos_cr_j1,
      puntos_cr_j2,
      puntos_masacre_cr_j1,
      puntos_masacre_cr_j2,
      warlord_muerto_cr_j1,
      warlord_muerto_cr_j2,
      ronda 
    } = req.body;
    
    // Validar campos requeridos
    const camposFaltantes = validarCamposRequeridos(req.body, [
      'torneo_id', 
      'jugador1_id', 
      'jugador2_id',
      'puntos_masacre_cr_j1',
      'puntos_masacre_cr_j2'
    ]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      );
    }
    
    // Validar que los jugadores sean diferentes
    if (jugador1_id === jugador2_id) {
      return res.status(400).json(
        errorResponse('Un jugador no puede jugar contra sí mismo')
      );
    }
    
    // Verificar que ambos jugadores están inscritos en el torneo
    const [participantes] = await pool.execute(`
      SELECT jugador_id FROM participantes 
      WHERE torneo_id = ? AND jugador_id IN (?, ?)
    `, [torneo_id, jugador1_id, jugador2_id]);
    
    if (participantes.length !== 2) {
      return res.status(400).json(
        errorResponse('Uno o ambos jugadores no están inscritos en este torneo')
      );
    }
    
    // Verificar que no existe ya una partida entre estos jugadores en esta ronda
    const [partidaExistente] = await pool.execute(`
      SELECT id FROM choque_bandas 
      WHERE torneo_id = ? AND ronda = ? AND 
      ((jugador1_id = ? AND jugador2_id = ?) OR (jugador1_id = ? AND jugador2_id = ?))
    `, [torneo_id, ronda || 1, jugador1_id, jugador2_id, jugador2_id, jugador1_id]);
    
    if (partidaExistente.length > 0) {
      return res.status(400).json(
        errorResponse('Ya existe una partida entre estos jugadores en esta ronda')
      );
    }
    
    // Calcular puntos de control y resultado
    const puntosControlJ1 = parseInt(puntos_cr_j1) || 0;
    const puntosControlJ2 = parseInt(puntos_cr_j2) || 0;
    const resultado = calcularResultado(puntosControlJ1, puntosControlJ2);
    
    // Calcular puntos de torneo
    const puntosTorneoJ1 = calcularPuntosTorneo(resultado, 1);
    const puntosTorneoJ2 = calcularPuntosTorneo(resultado, 2);
    
    // Registrar la partida
    const [resultadoInsert] = await pool.execute(`
      INSERT INTO choque_bandas (
        torneo_id, jugador1_id, jugador2_id, 
        puntos_cr_j1, puntos_cr_j2,
        puntos_torneo_cr_j1, puntos_torneo_cr_j2,
        puntos_masacre_cr_j1, puntos_masacre_cr_j2,
        warlord_muerto_cr_j1, warlord_muerto_cr_j2,
        resultado_cr, ronda
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      torneo_id, jugador1_id, jugador2_id,
      puntosControlJ1, puntosControlJ2,
      puntosTorneoJ1, puntosTorneoJ2,
      puntos_masacre_cr_j1, puntos_masacre_cr_j2,
      warlord_muerto_cr_j1 || false, warlord_muerto_cr_j2 || false,
      resultado, ronda || 1
    ]);
    
    res.status(201).json(
      successResponse('Partida de Choque de Bandas registrada exitosamente', {
        partidaId: resultadoInsert.insertId,
        resultado,
        puntosTorneo: {
          jugador1: puntosTorneoJ1,
          jugador2: puntosTorneoJ2
        }
      })
    );
    
  } catch (error) {
    console.error('Error al registrar partida de Choque de Bandas:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// ACTUALIZAR PARTIDA DE CHOQUE DE BANDAS
// ==========================================
router.put('/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    const { 
      puntos_cr_j1,
      puntos_cr_j2,
      puntos_masacre_cr_j1,
      puntos_masacre_cr_j2,
      warlord_muerto_cr_j1,
      warlord_muerto_cr_j2
    } = req.body;
    
    // Verificar que la partida existe
    const [partidaExistente] = await pool.execute(`
      SELECT cb.*, ts.created_by, ts.fecha_inicio
      FROM choque_bandas cb
      JOIN torneo_saga ts ON cb.torneo_id = ts.id
      WHERE cb.id = ?
    `, [partidaId]);
    
    if (partidaExistente.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }
    
    const partida = partidaExistente[0];
    
    // Verificar permisos (creador del torneo o uno de los jugadores)
    const esCreador = partida.created_by === req.userId;
    const esJugador = partida.jugador1_id === req.userId || partida.jugador2_id === req.userId;
    
    if (!esCreador && !esJugador) {
      return res.status(403).json(
        errorResponse('No tienes permisos para modificar esta partida')
      );
    }
    
    // Calcular nuevos valores
    const puntosControlJ1 = parseInt(puntos_cr_j1) || partida.puntos_cr_j1;
    const puntosControlJ2 = parseInt(puntos_cr_j2) || partida.puntos_cr_j2;
    const resultado = calcularResultado(puntosControlJ1, puntosControlJ2);
    
    const puntosTorneoJ1 = calcularPuntosTorneo(resultado, 1);
    const puntosTorneoJ2 = calcularPuntosTorneo(resultado, 2);
    
    // Actualizar la partida
    await pool.execute(`
      UPDATE choque_bandas SET
        puntos_cr_j1 = ?,
        puntos_cr_j2 = ?,
        puntos_torneo_cr_j1 = ?,
        puntos_torneo_cr_j2 = ?,
        puntos_masacre_cr_j1 = ?,
        puntos_masacre_cr_j2 = ?,
        warlord_muerto_cr_j1 = ?,
        warlord_muerto_cr_j2 = ?,
        resultado_cr = ?
      WHERE id = ?
    `, [
      puntosControlJ1, puntosControlJ2,
      puntosTorneoJ1, puntosTorneoJ2,
      puntos_masacre_cr_j1 !== undefined ? puntos_masacre_cr_j1 : partida.puntos_masacre_cr_j1,
      puntos_masacre_cr_j2 !== undefined ? puntos_masacre_cr_j2 : partida.puntos_masacre_cr_j2,
      warlord_muerto_cr_j1 !== undefined ? warlord_muerto_cr_j1 : partida.warlord_muerto_cr_j1,
      warlord_muerto_cr_j2 !== undefined ? warlord_muerto_cr_j2 : partida.warlord_muerto_cr_j2,
      resultado,
      partidaId
    ]);
    
    res.json(
      successResponse('Partida de Choque de Bandas actualizada exitosamente', {
        resultado,
        puntosTorneo: {
          jugador1: puntosTorneoJ1,
          jugador2: puntosTorneoJ2
        }
      })
    );
    
  } catch (error) {
    console.error('Error al actualizar partida de Choque de Bandas:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// ELIMINAR PARTIDA DE CHOQUE DE BANDAS
// ==========================================
router.delete('/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    // Verificar que la partida existe y permisos
    const [partidaExistente] = await pool.execute(`
      SELECT cb.*, ts.created_by
      FROM choque_bandas cb
      JOIN torneo_saga ts ON cb.torneo_id = ts.id
      WHERE cb.id = ?
    `, [partidaId]);
    
    if (partidaExistente.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }
    
    const partida = partidaExistente[0];
    
    // Solo el creador del torneo puede eliminar partidas
    if (partida.created_by !== req.userId) {
      return res.status(403).json(
        errorResponse('Solo el creador del torneo puede eliminar partidas')
      );
    }
    
    // Eliminar la partida
    await pool.execute('DELETE FROM choque_bandas WHERE id = ?', [partidaId]);
    
    res.json(
      successResponse('Partida de Choque de Bandas eliminada exitosamente')
    );
    
  } catch (error) {
    console.error('Error al eliminar partida de Choque de Bandas:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// OBTENER PARTIDA ESPECÍFICA
// ==========================================
router.get('/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    const [partidas] = await pool.execute(`
      SELECT 
        cb.*,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
        u2.nombre as jugador2_nombre,
        u2.apellidos as jugador2_apellidos,
        u2.nombre_alias as jugador2_alias,
        p1.faccion as jugador1_faccion,
        p2.faccion as jugador2_faccion,
        ts.nombre_torneo
      FROM choque_bandas cb
      JOIN usuarios u1 ON cb.jugador1_id = u1.id
      JOIN usuarios u2 ON cb.jugador2_id = u2.id
      JOIN torneo_saga ts ON cb.torneo_id = ts.id
      LEFT JOIN participantes p1 ON (cb.torneo_id = p1.torneo_id AND cb.jugador1_id = p1.jugador_id)
      LEFT JOIN participantes p2 ON (cb.torneo_id = p2.torneo_id AND cb.jugador2_id = p2.jugador_id)
      WHERE cb.id = ?
    `, [partidaId]);
    
    if (partidas.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }
    
    res.json(
      successResponse('Partida de Choque de Bandas obtenida exitosamente', {
        partida: partidas[0]
      })
    );
    
  } catch (error) {
    console.error('Error al obtener partida de Choque de Bandas:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ==========================================
// OBTENER ESTADÍSTICAS DE CHOQUE DE BANDAS
// ==========================================
router.get('/estadisticas/torneo/:torneoId', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    // Estadísticas generales
    const [estadisticas] = await pool.execute(`
      SELECT 
        COUNT(*) as total_partidas,
        COUNT(CASE WHEN resultado_cr != 'pendiente' THEN 1 END) as partidas_completadas,
        COUNT(CASE WHEN resultado_cr = 'empate' THEN 1 END) as empates,
        AVG(CASE WHEN resultado_cr != 'pendiente' THEN puntos_cr_j1 + puntos_cr_j2 END) as promedio_puntos_control,
        AVG(CASE WHEN resultado_cr != 'pendiente' THEN puntos_masacre_cr_j1 + puntos_masacre_cr_j2 END) as promedio_puntos_masacre
      FROM choque_bandas 
      WHERE torneo_id = ?
    `, [torneoId]);
    
    // Ranking por puntos de torneo en Choque de Bandas
    const [ranking] = await pool.execute(`
      SELECT 
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        p.faccion,
        SUM(cb.puntos_torneo_cr_j1 + cb.puntos_torneo_cr_j2) as puntos_torneo_total,
        SUM(cb.puntos_masacre_cr_j1 + cb.puntos_masacre_cr_j2) as puntos_masacre_total,
        COUNT(*) as partidas_jugadas,
        SUM(CASE WHEN 
          (cb.jugador1_id = u.id AND cb.resultado_cr = 'victoria_j1') OR 
          (cb.jugador2_id = u.id AND cb.resultado_cr = 'victoria_j2') 
        THEN 1 ELSE 0 END) as victorias
      FROM choque_bandas cb
      JOIN usuarios u ON (cb.jugador1_id = u.id OR cb.jugador2_id = u.id)
      LEFT JOIN participantes p ON (p.torneo_id = cb.torneo_id AND p.jugador_id = u.id)
      WHERE cb.torneo_id = ? AND cb.resultado_cr != 'pendiente'
      GROUP BY u.id
      ORDER BY puntos_torneo_total DESC, puntos_masacre_total DESC
    `, [torneoId]);
    
    res.json(
      successResponse('Estadísticas de Choque de Bandas obtenidas exitosamente', {
        estadisticas: estadisticas[0],
        ranking
      })
    );
    
  } catch (error) {
    console.error('Error al obtener estadísticas de Choque de Bandas:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

module.exports = router;