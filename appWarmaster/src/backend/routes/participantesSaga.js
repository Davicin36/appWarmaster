// routes/participantes.js
const express = require('express');
const { pool } = require('../config/bd');
const { verificarToken, verificarOrganizador } = require('../middleware/auth');
const { 
  validarCamposRequeridos,
  errorResponse,
  successResponse,
  manejarErrorDB
} = require('../utils/helpers');

const router = express.Router();

// ==========================================
// OBTENER PARTICIPANTES DE UN TORNEO
// ==========================================
router.get('/torneo/:torneoId', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    // Verificar que el torneo existe
    const [torneo] = await pool.execute(
      'SELECT id, nombre_torneo FROM torneo_saga WHERE id = ?',
      [torneoId]
    );
    
    if (torneo.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }
    
    // Obtener participantes con información del usuario
    const [participantes] = await pool.execute(`
      SELECT 
        p.id,
        p.epoca,
        p.faccion,
        p.composicion_ejercito,
        p.created_at,
        u.id as usuario_id,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.club,
        u.email
      FROM participantes p 
      JOIN usuarios u ON p.jugador_id = u.id 
      WHERE p.torneo_id = ?
      ORDER BY p.created_at ASC
    `, [torneoId]);
    
    res.json(
      successResponse('Participantes obtenidos exitosamente', {
        torneo: torneo[0],
        participantes,
        totalParticipantes: participantes.length
      })
    );
    
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ==========================================
// UNIRSE A UN TORNEO
// ==========================================
router.post('/unirse/:torneoId', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { epoca, faccion, composicion_ejercito } = req.body;
    
    // Validar campos requeridos
    const camposFaltantes = validarCamposRequeridos(req.body, [
      'faccion', 
      'composicion_ejercito'
    ]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      );
    }
    
    // Verificar que el torneo existe
    const [torneo] = await pool.execute(
      'SELECT id, nombre_torneo, epoca_torneo, fecha_inicio FROM torneo_saga WHERE id = ?',
      [torneoId]
    );
    
    if (torneo.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }
    
    // Verificar que el torneo no ha empezado
    const fechaHoy = new Date();
    const fechaInicio = new Date(torneo[0].fecha_inicio);
    
    if (fechaHoy >= fechaInicio) {
      return res.status(400).json(
        errorResponse('No se puede unir a un torneo que ya ha comenzado')
      );
    }
    
    // Verificar que el usuario no esté ya inscrito
    const [yaInscrito] = await pool.execute(
      'SELECT id FROM participantes WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, req.userId]
    );
    
    if (yaInscrito.length > 0) {
      return res.status(400).json(
        errorResponse('Ya estás inscrito en este torneo')
      );
    }
    
    // Si el torneo tiene época específica y se proporciona época, validar que coincida
    if (torneo[0].epoca_torneo && epoca && epoca !== torneo[0].epoca_torneo) {
      return res.status(400).json(
        errorResponse(`La época debe ser: ${torneo[0].epoca_torneo}`)
      );
    }
    
    // Usar la época del torneo si no se proporciona
    const epocaFinal = epoca || torneo[0].epoca_torneo;
    
    // Inscribir al participante
    const [resultado] = await pool.execute(
      `INSERT INTO participantes (torneo_id, jugador_id, epoca, faccion, composicion_ejercito) 
       VALUES (?, ?, ?, ?, ?)`,
      [torneoId, req.userId, epocaFinal, faccion, composicion_ejercito]
    );
    
    res.status(201).json(
      successResponse('Te has unido al torneo exitosamente', {
        participanteId: resultado.insertId,
        torneo: torneo[0].nombre_torneo,
        faccion,
        epoca: epocaFinal
      })
    );
    
  } catch (error) {
    console.error('Error al unirse al torneo:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('Ya estás inscrito en este torneo')
      );
    }
    
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// ACTUALIZAR PARTICIPACIÓN
// ==========================================
router.put('/:participanteId', verificarToken, async (req, res) => {
  try {
    const { participanteId } = req.params;
    const { faccion, composicion_ejercito } = req.body;
    
    // Verificar que la participación existe y pertenece al usuario
    const [participacion] = await pool.execute(`
      SELECT p.*, ts.fecha_inicio, ts.nombre_torneo
      FROM participantes p
      JOIN torneo_saga ts ON p.torneo_id = ts.id
      WHERE p.id = ? AND p.jugador_id = ?
    `, [participanteId, req.userId]);
    
    if (participacion.length === 0) {
      return res.status(404).json(
        errorResponse('Participación no encontrada o no tienes permisos')
      );
    }
    
    // Verificar que el torneo no ha empezado
    const fechaHoy = new Date();
    const fechaInicio = new Date(participacion[0].fecha_inicio);
    
    if (fechaHoy >= fechaInicio) {
      return res.status(400).json(
        errorResponse('No se puede modificar la participación una vez que el torneo ha comenzado')
      );
    }
    
    // Construir consulta de actualización
    const camposActualizar = [];
    const valores = [];
    
    if (faccion) {
      camposActualizar.push('faccion = ?');
      valores.push(faccion);
    }
    if (composicion_ejercito) {
      camposActualizar.push('composicion_ejercito = ?');
      valores.push(composicion_ejercito);
    }
    
    if (camposActualizar.length === 0) {
      return res.status(400).json(
        errorResponse('No se proporcionaron campos para actualizar')
      );
    }
    
    valores.push(participanteId);
    
    await pool.execute(
      `UPDATE participantes SET ${camposActualizar.join(', ')} WHERE id = ?`,
      valores
    );
    
    res.json(
      successResponse('Participación actualizada exitosamente')
    );
    
  } catch (error) {
    console.error('Error al actualizar participación:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// SALIRSE DE UN TORNEO
// ==========================================
router.delete('/:participanteId', verificarToken, async (req, res) => {
  try {
    const { participanteId } = req.params;
    
    // Verificar que la participación existe y pertenece al usuario
    const [participacion] = await pool.execute(`
      SELECT p.*, ts.fecha_inicio, ts.nombre_torneo
      FROM participantes p
      JOIN torneo_saga ts ON p.torneo_id = ts.id
      WHERE p.id = ? AND p.jugador_id = ?
    `, [participanteId, req.userId]);
    
    if (participacion.length === 0) {
      return res.status(404).json(
        errorResponse('Participación no encontrada o no tienes permisos')
      );
    }
    
    // Verificar que el torneo no ha empezado
    const fechaHoy = new Date();
    const fechaInicio = new Date(participacion[0].fecha_inicio);
    
    if (fechaHoy >= fechaInicio) {
      return res.status(400).json(
        errorResponse('No se puede salir de un torneo que ya ha comenzado')
      );
    }
    
    // Verificar que no tenga partidas registradas
    const [partidasJugadas] = await pool.execute(`
      SELECT COUNT(*) as total FROM (
        SELECT id FROM choque_bandas WHERE torneo_id = ? AND (jugador1_id = ? OR jugador2_id = ?)
        UNION ALL
        SELECT id FROM captura WHERE torneo_id = ? AND (jugador1_id = ? OR jugador2_id = ?)
        UNION ALL
        SELECT id FROM conquista WHERE torneo_id = ? AND (jugador1_id = ? OR jugador2_id = ?)
        UNION ALL
        SELECT id FROM desacralizacion WHERE torneo_id = ? AND (jugador1_id = ? OR jugador2_id = ?)
        UNION ALL
        SELECT id FROM avance WHERE torneo_id = ? AND (jugador1_id = ? OR jugador2_id = ?)
      ) as partidas
    `, [
      participacion[0].torneo_id, req.userId, req.userId,
      participacion[0].torneo_id, req.userId, req.userId,
      participacion[0].torneo_id, req.userId, req.userId,
      participacion[0].torneo_id, req.userId, req.userId,
      participacion[0].torneo_id, req.userId, req.userId
    ]);
    
    if (partidasJugadas[0].total > 0) {
      return res.status(400).json(
        errorResponse('No puedes salir del torneo porque ya tienes partidas registradas')
      );
    }
    
    // Eliminar participación
    await pool.execute('DELETE FROM participantes WHERE id = ?', [participanteId]);
    
    res.json(
      successResponse(`Te has salido del torneo "${participacion[0].nombre_torneo}" exitosamente`)
    );
    
  } catch (error) {
    console.error('Error al salir del torneo:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// ELIMINAR PARTICIPANTE (SOLO ORGANIZADORES)
// ==========================================
router.delete('/admin/:participanteId', verificarToken, verificarOrganizador, async (req, res) => {
  try {
    const { participanteId } = req.params;
    
    // Obtener información del participante
    const [participacion] = await pool.execute(`
      SELECT p.*, u.nombre, u.apellidos, ts.nombre_torneo, ts.created_by
      FROM participantes p
      JOIN usuarios u ON p.jugador_id = u.id
      JOIN torneo_saga ts ON p.torneo_id = ts.id
      WHERE p.id = ?
    `, [participanteId]);
    
    if (participacion.length === 0) {
      return res.status(404).json(
        errorResponse('Participante no encontrado')
      );
    }
    
    // Verificar que es el creador del torneo
    if (participacion[0].created_by !== req.userId) {
      return res.status(403).json(
        errorResponse('Solo el creador del torneo puede eliminar participantes')
      );
    }
    
    const participante = participacion[0];
    
    // Eliminar participación (las partidas se eliminarán en cascada)
    await pool.execute('DELETE FROM participantes WHERE id = ?', [participanteId]);
    
    res.json(
      successResponse(
        `Participante ${participante.nombre} ${participante.apellidos} eliminado del torneo "${participante.nombre_torneo}" exitosamente`
      )
    );
    
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// OBTENER PARTICIPACIONES DE UN USUARIO
// ==========================================
router.get('/usuario/:userId', verificarToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Solo permitir ver participaciones propias o si es organizador
    if (req.userId !== parseInt(userId) && req.userRole !== 'organizador') {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver participaciones de otro usuario')
      );
    }
    
    const [participaciones] = await pool.execute(`
      SELECT 
        p.*,
        ts.nombre_torneo,
        ts.epoca_torneo,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        COUNT(partidas.id) as partidas_jugadas
      FROM participantes p
      JOIN torneo_saga ts ON p.torneo_id = ts.id
      LEFT JOIN (
        SELECT torneo_id, jugador1_id as jugador_id FROM choque_bandas WHERE resultado_cr != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador2_id as jugador_id FROM choque_bandas WHERE resultado_cr != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador1_id as jugador_id FROM captura WHERE resultado_captura != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador2_id as jugador_id FROM captura WHERE resultado_captura != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador1_id as jugador_id FROM conquista WHERE resultado_conquista != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador2_id as jugador_id FROM conquista WHERE resultado_conquista != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador1_id as jugador_id FROM desacralizacion WHERE resultado_desacralizacion != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador2_id as jugador_id FROM desacralizacion WHERE resultado_desacralizacion != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador1_id as jugador_id FROM avance WHERE resultado_avance != 'pendiente'
        UNION ALL
        SELECT torneo_id, jugador2_id as jugador_id FROM avance WHERE resultado_avance != 'pendiente'
      ) as partidas ON (p.torneo_id = partidas.torneo_id AND p.jugador_id = partidas.jugador_id)
      WHERE p.jugador_id = ?
      GROUP BY p.id
      ORDER BY ts.fecha_inicio DESC
    `, [userId]);
    
    res.json(
      successResponse('Participaciones obtenidas exitosamente', {
        participaciones,
        totalParticipaciones: participaciones.length
      })
    );
    
  } catch (error) {
    console.error('Error al obtener participaciones:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

module.exports = router;