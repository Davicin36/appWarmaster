// routes/torneos.js
const express = require('express');
const { pool } = require('../config/bd');
const { verificarToken, verificarOrganizador } = require('../middleware/auth');
const { 
  validarFecha,
  validarCamposRequeridos,
  errorResponse,
  successResponse,
  manejarErrorDB,
  paginar
} = require('../utils/helpers');

const router = express.Router(); 

// ==========================================
// OBTENER TODOS LOS TORNEOS (CON PAGINACIÓN)
// ==========================================
router.get('/', verificarToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, buscar = '' } = req.query;
    const { limit: limitNum, offset } = paginar(page, limit);
    
    let whereClause = '';
    let params = [];
    
    // Filtro de búsqueda
    if (buscar.trim()) {
      whereClause = 'WHERE ts.nombre_torneo LIKE ? OR ts.epoca_torneo LIKE ? OR ts.ubicacion LIKE ?';
      const searchTerm = `%${buscar}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }
    
    // Consulta principal con información del creador y participantes
    const [torneos] = await pool.execute(`
      SELECT 
        ts.id,
        ts.nombre_torneo,
        ts.rondas_max,
        ts.epoca_torneo,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.created_at,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.club as creador_club,
        COUNT(p.id) as total_participantes
      FROM torneo_saga ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN participantes p ON ts.id = p.torneo_id
      ${whereClause}
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);
    
    // Contar total para paginación
    const [totalRows] = await pool.execute(`
      SELECT COUNT(DISTINCT ts.id) as total
      FROM torneo_saga ts 
      ${whereClause}
    `, params);
    
    const total = totalRows[0].total;
    const totalPages = Math.ceil(total / limitNum);
    
    res.json(
      successResponse('Torneos obtenidos exitosamente', {
        torneos,
        paginacion: {
          paginaActual: parseInt(page),
          totalPaginas: totalPages,
          totalRegistros: total,
          registrosPorPagina: limitNum
        }
      })
    );
    
  } catch (error) {
    console.error('Error al obtener torneos:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ==========================================
// OBTENER UN TORNEO ESPECÍFICO
// ==========================================
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [torneos] = await pool.execute(`
      SELECT 
        ts.*,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.email as creador_email,
        u.club as creador_club,
        COUNT(p.id) as total_participantes
      FROM torneo_saga ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN participantes p ON ts.id = p.torneo_id
      WHERE ts.id = ?
      GROUP BY ts.id
    `, [req.params.id]);
    
    if (torneos.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }
    
    res.json(
      successResponse('Torneo obtenido exitosamente', {
        torneo: torneos[0]
      })
    );
    
  } catch (error) {
    console.error('Error al obtener torneo:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ==========================================
// CREAR NUEVO TORNEO
// ==========================================
router.post('/', verificarToken, verificarOrganizador, async (req, res) => {
  try {
    const { 
      nombre_torneo, 
      rondas_max, 
      epoca_torneo, 
      fecha_inicio, 
      fecha_fin, 
      ubicacion 
    } = req.body;
    
    // Validar campos requeridos
    const camposFaltantes = validarCamposRequeridos(req.body, [
      'nombre_torneo', 
      'rondas_max', 
      'epoca_torneo', 
      'fecha_inicio'
    ]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      );
    }
    
    // Validar número de rondas
    if (rondas_max < 1 || rondas_max > 20) {
      return res.status(400).json(
        errorResponse('El número de rondas debe estar entre 1 y 20')
      );
    }
    
    // Validar fechas
    if (!validarFecha(fecha_inicio)) {
      return res.status(400).json(
        errorResponse('La fecha de inicio no puede ser en el pasado')
      );
    }
    
    if (fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json(
        errorResponse('La fecha de fin debe ser posterior a la fecha de inicio')
      );
    }
    
    // Crear el torneo
    const [resultado] = await pool.execute(
      `INSERT INTO torneo_saga 
       (nombre_torneo, rondas_max, epoca_torneo, fecha_inicio, fecha_fin, ubicacion, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_torneo, 
        rondas_max, 
        epoca_torneo, 
        fecha_inicio, 
        fecha_fin || null, 
        ubicacion || null, 
        req.userId
      ]
    );
    
    res.status(201).json(
      successResponse('Torneo creado exitosamente', {
        torneoId: resultado.insertId,
        nombre_torneo,
        epoca_torneo
      })
    );
    
  } catch (error) {
    console.error('Error al crear torneo:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('Ya existe un torneo con esa época')
      );
    }
    
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// ACTUALIZAR TORNEO
// ==========================================
router.put('/:id', verificarToken, verificarOrganizador, async (req, res) => {
  try {
    const torneoId = req.params.id;
    const { 
      nombre_torneo, 
      rondas_max, 
      epoca_torneo, 
      fecha_inicio, 
      fecha_fin, 
      ubicacion 
    } = req.body;
    
    // Verificar que el torneo existe y el usuario es el creador
    const [torneoExistente] = await pool.execute(
      'SELECT created_by FROM torneo_saga WHERE id = ?',
      [torneoId]
    );
    
    if (torneoExistente.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }
    
    if (torneoExistente[0].created_by !== req.userId) {
      return res.status(403).json(
        errorResponse('Solo el creador del torneo puede modificarlo')
      );
    }
    
    // Validar fechas si se proporcionan
    if (fecha_inicio && !validarFecha(fecha_inicio)) {
      return res.status(400).json(
        errorResponse('La fecha de inicio no puede ser en el pasado')
      );
    }
    
    if (fecha_fin && fecha_inicio && new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json(
        errorResponse('La fecha de fin debe ser posterior a la fecha de inicio')
      );
    }
    
    // Construir consulta de actualización dinámicamente
    const camposActualizar = [];
    const valores = [];
    
    if (nombre_torneo) {
      camposActualizar.push('nombre_torneo = ?');
      valores.push(nombre_torneo);
    }
    if (rondas_max) {
      camposActualizar.push('rondas_max = ?');
      valores.push(rondas_max);
    }
    if (epoca_torneo) {
      camposActualizar.push('epoca_torneo = ?');
      valores.push(epoca_torneo);
    }
    if (fecha_inicio) {
      camposActualizar.push('fecha_inicio = ?');
      valores.push(fecha_inicio);
    }
    if (fecha_fin !== undefined) {
      camposActualizar.push('fecha_fin = ?');
      valores.push(fecha_fin);
    }
    if (ubicacion !== undefined) {
      camposActualizar.push('ubicacion = ?');
      valores.push(ubicacion);
    }
    
    if (camposActualizar.length === 0) {
      return res.status(400).json(
        errorResponse('No se proporcionaron campos para actualizar')
      );
    }
    
    valores.push(torneoId);
    
    await pool.execute(
      `UPDATE torneo_saga SET ${camposActualizar.join(', ')} WHERE id = ?`,
      valores
    );
    
    res.json(
      successResponse('Torneo actualizado exitosamente')
    );
    
  } catch (error) {
    console.error('Error al actualizar torneo:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('Ya existe un torneo con esa época')
      );
    }
    
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// ELIMINAR TORNEO
// ==========================================
router.delete('/:id', verificarToken, verificarOrganizador, async (req, res) => {
  try {
    const torneoId = req.params.id;
    
    // Verificar que el torneo existe y el usuario es el creador
    const [torneoExistente] = await pool.execute(
      'SELECT created_by, nombre_torneo FROM torneo_saga WHERE id = ?',
      [torneoId]
    );
    
    if (torneoExistente.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }
    
    if (torneoExistente[0].created_by !== req.userId) {
      return res.status(403).json(
        errorResponse('Solo el creador del torneo puede eliminarlo')
      );
    }
    
    // Verificar si hay participantes inscritos
    const [participantes] = await pool.execute(
      'SELECT COUNT(*) as total FROM participantes WHERE torneo_id = ?',
      [torneoId]
    );
    
    if (participantes[0].total > 0) {
      return res.status(400).json(
        errorResponse('No se puede eliminar un torneo que ya tiene participantes inscritos')
      );
    }
    
    // Eliminar el torneo
    await pool.execute('DELETE FROM torneo_saga WHERE id = ?', [torneoId]);
    
    res.json(
      successResponse(`Torneo "${torneoExistente[0].nombre_torneo}" eliminado exitosamente`)
    );
    
  } catch (error) {
    console.error('Error al eliminar torneo:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// OBTENER TORNEOS POR USUARIO
// ==========================================
router.get('/usuario/:userId', verificarToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Solo permitir ver torneos propios o si es organizador
    if (req.userId !== parseInt(userId) && req.userRole !== 'organizador') {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver torneos de otro usuario')
      );
    }
    
    const [torneosCreados] = await pool.execute(`
      SELECT 
        ts.*,
        COUNT(p.id) as total_participantes
      FROM torneo_saga ts 
      LEFT JOIN participantes p ON ts.id = p.torneo_id
      WHERE ts.created_by = ?
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
    `, [userId]);
    
    const [torneosParticipando] = await pool.execute(`
      SELECT 
        ts.*,
        p.faccion,
        p.composicion_ejercito,
        COUNT(p2.id) as total_participantes
      FROM torneo_saga ts 
      JOIN participantes p ON ts.id = p.torneo_id
      LEFT JOIN participantes p2 ON ts.id = p2.torneo_id
      WHERE p.jugador_id = ?
      GROUP BY ts.id, p.id
      ORDER BY ts.fecha_inicio ASC
    `, [userId]);
    
    res.json(
      successResponse('Torneos del usuario obtenidos exitosamente', {
        torneosCreados,
        torneosParticipando
      })
    );
    
  } catch (error) {
    console.error('Error al obtener torneos del usuario:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

module.exports = router;