// routes/torneosSaga.js
const express = require('express');
const jwt = require('jsonwebtoken'); 
const multer = require('multer');
const { pool } = require('../config/bd');
const { verificarToken, verificarOrganizador } = require('../middleware/auth');
const { 
  calcularPuntosTorneo,
  validarFecha,
  validarCamposRequeridos,
  errorResponse,
  successResponse,
  manejarErrorDB,
  paginar
} = require('../utils/helpers');

const router = express.Router(); 

// ==========================================
// CONFIGURACIÓN DE MULTER PARA SUBIDA DE PDF
// ==========================================
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

// =========================================================
// OBTENER TODOS LOS TORNEOS (CON PAGINACIÓN)
// =========================================================
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/torneosSaga - Petición recibida');
    
    const { page = 1, limit = 10, buscar = '' } = req.query;
    const { limit: limitNum, offset } = paginar(page, limit);
    
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        console.log(`✅ Usuario autenticado: ${userId}`);
      } catch (err) {
        console.log('ℹ️ Sin autenticación o token inválido');
      }
    }
    
    let whereClause = '';
    let params = [];
    
    if (buscar.trim()) {
      whereClause = 'WHERE ts.nombre_torneo LIKE ? OR ts.epoca_torneo LIKE ? OR ts.ubicacion LIKE ?';
      const searchTerm = `%${buscar}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }
    
    const [torneos] = await pool.execute(`  
      SELECT 
        ts.id,
        ts.nombre_torneo,
        ts.rondas_max,
        ts.epoca_torneo,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_banda,
        ts.participantes_max,
        ts.estado,
        ts.partida_ronda_1,
        ts.partida_ronda_2,
        ts.partida_ronda_3,
        ts.partida_ronda_4,
        ts.partida_ronda_5,
        ts.bases_nombre,
        ts.base_tamaño,
        ts.created_by,
        ts.created_at,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.club as creador_club,
        COUNT(DISTINCT jts.id) as total_participantes,
        MAX(CASE WHEN jts.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneo_saga ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      ${whereClause}
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, ...params, limitNum, offset]);
    
    console.log(`✅ ${torneos.length} torneos encontrados`);
    
    const [totalRows] = await pool.execute(`
      SELECT COUNT(DISTINCT ts.id) as total
      FROM torneo_saga ts 
      ${whereClause}
    `, params);
    
    const total = totalRows[0].total;
    const totalPages = Math.ceil(total / limitNum);
    
    res.json(
      successResponse('Torneos obtenidos exitosamente', {
        torneosSaga: torneos,
        paginacion: {
          paginaActual: parseInt(page),
          totalPaginas: totalPages,
          totalRegistros: total,
          registrosPorPagina: limitNum
        }
      })
    );
    
  } catch (error) {
    console.error('❌ Error al obtener torneos:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// =========================================================
// DESCARGAR PDF DE BASES DEL TORNEO
// =========================================================
router.get('/:id/bases-pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'SELECT bases_torneo, bases_nombre FROM torneo_saga WHERE id = ?',
      [id]
    );
    
    if (result.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    const torneo = result[0];
    
    if (!torneo.bases_torneo) {
      return res.status(404).json(errorResponse('Este torneo no tiene bases en PDF'));
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${torneo.bases_nombre || 'bases_torneo.pdf'}"`);
    res.send(torneo.bases_torneo);
    
  } catch (error) {
    console.error('❌ Error al descargar PDF:', error);
    res.status(500).json(errorResponse('Error al descargar el PDF'));
  }
});

// ==========================================
// OBTENER UN TORNEO ESPECÍFICO
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/torneosSaga/${req.params.id}`);
    
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Token inválido, continuar sin userId
      }
    }

    const [torneos] = await pool.execute(`
      SELECT 
        ts.id,
        ts.nombre_torneo,
        ts.rondas_max,
        ts.epoca_torneo,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_banda,
        ts.participantes_max,
        ts.estado,
        ts.partida_ronda_1,
        ts.partida_ronda_2,
        ts.partida_ronda_3,
        ts.partida_ronda_4,
        ts.partida_ronda_5,
        ts.bases_nombre,
        ts.base_tamaño,
        ts.created_by,
        ts.created_at,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.email as creador_email,
        u.club as creador_club,
        COUNT(DISTINCT jts.id) as total_participantes,
        MAX(CASE WHEN jts.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneo_saga ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      WHERE ts.id = ?
      GROUP BY ts.id
    `, [userId, req.params.id]);
    
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
    console.error('❌ Error al obtener torneo:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ==========================================
// CREAR NUEVO TORNEO
// ==========================================
router.post('/', verificarToken, upload.single('bases_pdf'), async (req, res) => {
  try {
    console.log('📥 POST /api/torneosSaga - Creando torneo');
    
    const { 
      nombre_torneo, 
      rondas_max, 
      epoca_torneo, 
      fecha_inicio, 
      fecha_fin, 
      ubicacion,
      puntos_banda,
      participantes_max,
      estado,
      partida_ronda_1,
      partida_ronda_2,
      partida_ronda_3,
      partida_ronda_4,
      partida_ronda_5
    } = req.body;
    
    console.log('📦 Datos recibidos:', req.body);
    console.log('📄 Archivo PDF:', req.file ? req.file.originalname : 'No adjunto');
    
    const camposFaltantes = validarCamposRequeridos(req.body, [
      'nombre_torneo', 
      'rondas_max', 
      'epoca_torneo', 
      'fecha_inicio',
      'puntos_banda',
      'participantes_max',
      'partida_ronda_1',
      'partida_ronda_2',
      'partida_ronda_3'
    ]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      );
    }
    
    if (rondas_max < 3 || rondas_max > 5) {
      return res.status(400).json(
        errorResponse('El número de rondas debe estar entre 3 y 5')
      );
    }

    if (puntos_banda < 4 || puntos_banda > 8) {
      return res.status(400).json(
        errorResponse('Los puntos de banda deben estar entre 4 y 8')
      );
    }

    if (participantes_max < 4 || participantes_max > 100) {
      return res.status(400).json(
        errorResponse('El número de participantes debe estar entre 4 y 100')
      );
    }
    
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

    const [usuarios] = await pool.execute(
      'SELECT rol FROM usuarios WHERE id = ?',
      [req.userId]
    );

    let rolActualizado = usuarios[0].rol;

    if (usuarios[0].rol !== 'organizador') {
      await pool.execute(
        'UPDATE usuarios SET rol = ? WHERE id = ?',
        ['organizador', req.userId]
      );
      rolActualizado = 'organizador';
      console.log(`✅ Usuario ${req.userId} convertido a organizador`);
    }
    
    let basesPdf = null;
    let basesNombre = null;
    let baseTamaño = null;
    
    if (req.file) {
      basesPdf = req.file.buffer;
      basesNombre = req.file.originalname;
      baseTamaño = req.file.size;
      console.log(`📄 PDF recibido: ${basesNombre} (${baseTamaño} bytes)`);
    }
    
    const [resultado] = await pool.execute(
      `INSERT INTO torneo_saga 
       (nombre_torneo, rondas_max, epoca_torneo, fecha_inicio, fecha_fin, ubicacion, 
        puntos_banda, participantes_max, estado, partida_ronda_1, partida_ronda_2, 
        partida_ronda_3, partida_ronda_4, partida_ronda_5, bases_torneo, 
        bases_nombre, base_tamaño, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_torneo, 
        rondas_max, 
        epoca_torneo, 
        fecha_inicio, 
        fecha_fin || null, 
        ubicacion || null, 
        puntos_banda,
        participantes_max,
        estado || 'pendiente',
        partida_ronda_1,
        partida_ronda_2,
        partida_ronda_3,
        partida_ronda_4 || null,
        partida_ronda_5 || null,
        basesPdf,
        basesNombre,
        baseTamaño,
        req.userId
      ]
    );
    
    console.log(`✅ Torneo creado con ID: ${resultado.insertId}`);
    
    res.status(201).json(
      successResponse('Torneo creado exitosamente', {
        torneoId: resultado.insertId,
        nombre_torneo,
        epoca_torneo, 
        tiene_bases_pdf: !!req.file,
        created_by: req.userId,
        rol_actualizado: rolActualizado
      })
    );
    
  } catch (error) {
    console.error('❌ Error al crear torneo:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(
          errorResponse('El archivo PDF excede el tamaño máximo de 5MB')
        );
      }
      return res.status(400).json(errorResponse(error.message));
    }
    
    if (error.message === 'Solo se permiten archivos PDF') {
      return res.status(400).json(errorResponse(error.message));
    }

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
router.put('/:id', verificarToken, upload.single('bases_pdf'), async (req, res) => {
  try {
    const torneoId = req.params.id;
    const { 
      nombre_torneo, 
      rondas_max, 
      epoca_torneo, 
      fecha_inicio, 
      fecha_fin, 
      ubicacion,
      puntos_banda,
      participantes_max,
      estado,
      partida_ronda_1,
      partida_ronda_2,
      partida_ronda_3,
      partida_ronda_4,
      partida_ronda_5,
      eliminar_pdf
    } = req.body;
    
    console.log(`📝 PUT /api/torneosSaga/${torneoId} - Actualizando torneo`);
    console.log('📦 Datos recibidos:', req.body);
    console.log('📄 Nuevo PDF:', req.file ? req.file.originalname : 'No adjunto');
    
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
    
    if (rondas_max && (rondas_max < 3 || rondas_max > 5)) {
      return res.status(400).json(
        errorResponse('El número de rondas debe estar entre 3 y 5')
      );
    }

    if (puntos_banda && (puntos_banda < 4 || puntos_banda > 8)) {
      return res.status(400).json(
        errorResponse('Los puntos de banda deben estar entre 4 y 8')
      );
    }

    if (participantes_max && (participantes_max < 4 || participantes_max > 100)) {
      return res.status(400).json(
        errorResponse('El número de participantes debe estar entre 4 y 100')
      );
    }
    
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

    if (estado && !['pendiente', 'en_curso', 'finalizado'].includes(estado)) {
      return res.status(400).json(
        errorResponse('Estado inválido. Debe ser: pendiente, en_curso o finalizado')
      );
    }
    
    const camposActualizar = [];
    const valores = [];
    
    if (nombre_torneo !== undefined) {
      camposActualizar.push('nombre_torneo = ?');
      valores.push(nombre_torneo);
    }
    if (rondas_max !== undefined) {
      camposActualizar.push('rondas_max = ?');
      valores.push(rondas_max);
    }
    if (epoca_torneo !== undefined) {
      camposActualizar.push('epoca_torneo = ?');
      valores.push(epoca_torneo);
    }
    if (fecha_inicio !== undefined) {
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
    if (puntos_banda !== undefined) {
      camposActualizar.push('puntos_banda = ?');
      valores.push(puntos_banda);
    }
    if (participantes_max !== undefined) {
      camposActualizar.push('participantes_max = ?');
      valores.push(participantes_max);
    }
    if (estado !== undefined) {
      camposActualizar.push('estado = ?');
      valores.push(estado);
    }
    if (partida_ronda_1 !== undefined) {
      camposActualizar.push('partida_ronda_1 = ?');
      valores.push(partida_ronda_1);
    }
    if (partida_ronda_2 !== undefined) {
      camposActualizar.push('partida_ronda_2 = ?');
      valores.push(partida_ronda_2);
    }
    if (partida_ronda_3 !== undefined) {
      camposActualizar.push('partida_ronda_3 = ?');
      valores.push(partida_ronda_3);
    }
    if (partida_ronda_4 !== undefined) {
      camposActualizar.push('partida_ronda_4 = ?');
      valores.push(partida_ronda_4);
    }
    if (partida_ronda_5 !== undefined) {
      camposActualizar.push('partida_ronda_5 = ?');
      valores.push(partida_ronda_5);
    }
    
    if (req.file) {
      camposActualizar.push('bases_torneo = ?');
      valores.push(req.file.buffer);
      
      camposActualizar.push('bases_nombre = ?');
      valores.push(req.file.originalname);
      
      camposActualizar.push('base_tamaño = ?');
      valores.push(req.file.size);
      
      console.log(`📄 Nuevo PDF: ${req.file.originalname} (${req.file.size} bytes)`);
    }
    else if (eliminar_pdf === 'true' || eliminar_pdf === true) {
      camposActualizar.push('bases_torneo = NULL');
      camposActualizar.push('bases_nombre = NULL');
      camposActualizar.push('base_tamaño = NULL');
      console.log('🗑️ Eliminando PDF existente');
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
    
    console.log(`✅ Torneo ${torneoId} actualizado exitosamente`);
    
    res.json(
      successResponse('Torneo actualizado exitosamente', {
        torneoId,
        pdf_actualizado: !!req.file,
        pdf_eliminado: eliminar_pdf === 'true' || eliminar_pdf === true
      })
    );
    
  } catch (error) {
    console.error('❌ Error al actualizar torneo:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(
          errorResponse('El archivo PDF excede el tamaño máximo de 5MB')
        );
      }
      return res.status(400).json(errorResponse(error.message));
    }
    
    if (error.message === 'Solo se permiten archivos PDF') {
      return res.status(400).json(errorResponse(error.message));
    }

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
// ELIMINAR JUGADOR DE UN TORNEO
// ==========================================
router.delete('/:id/participantes/:jugadorId', verificarToken, async (req, res) => {
  try {
    const torneoId = req.params.id;
    const jugadorId = req.params.jugadorId;
    
    console.log(`🗑️ DELETE /api/torneosSaga/${torneoId}/participantes/${jugadorId}`);
    console.log(`👤 Usuario solicitante: ${req.userId}`);
    
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
        errorResponse('Solo el creador del torneo puede eliminar participantes')
      );
    }
    
    const [participante] = await pool.execute(
      `SELECT jts.id, u.nombre, u.apellidos 
       FROM jugador_torneo_saga jts
       INNER JOIN usuarios u ON jts.jugador_id = u.id
       WHERE jts.torneo_id = ? AND jts.jugador_id = ?`,
      [torneoId, jugadorId]
    );
    
    if (participante.length === 0) {
      return res.status(404).json(
        errorResponse('El jugador no está inscrito en este torneo')
      );
    }
    
    const nombreJugador = `${participante[0].nombre} ${participante[0].apellidos || ''}`.trim();
    
    const [partidas] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM partidas_saga 
       WHERE torneo_id = ? AND (jugador1_id = ? OR jugador2_id = ?)`,
      [torneoId, jugadorId, jugadorId]
    );
    
    if (partidas[0].total > 0) {
      return res.status(400).json(
        errorResponse(`No se puede eliminar a ${nombreJugador} porque ya tiene ${partidas[0].total} partida(s) registrada(s) en este torneo`)
      );
    }
    
    await pool.execute(
      'DELETE FROM jugador_torneo_saga WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, jugadorId]
    );
    
    console.log(`✅ Jugador ${nombreJugador} eliminado del torneo ${torneoExistente[0].nombre_torneo}`);
    
    res.json(
      successResponse(`${nombreJugador} ha sido eliminado del torneo "${torneoExistente[0].nombre_torneo}"`, {
        torneoId,
        jugadorId,
        nombreJugador
      })
    );
    
  } catch (error) {
    console.error('❌ Error al eliminar jugador del torneo:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// ELIMINAR TORNEO COMPLETO
// ==========================================
router.delete('/:id', verificarToken, async (req, res) => {
  console.log('🗑️ DELETE TORNEO - Endpoint alcanzado');
  console.log('👤 Usuario ID:', req.userId);
  console.log('🎯 Torneo ID:', req.params.id);
  
  try {
    const torneoId = req.params.id;
    
    const [torneoExistente] = await pool.execute(
      'SELECT created_by, nombre_torneo FROM torneo_saga WHERE id = ?',
      [torneoId]
    );
    
    console.log('📋 Torneo encontrado:', torneoExistente);
    
    if (torneoExistente.length === 0) {
      console.log('❌ Torneo no encontrado');
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }
    
    console.log('🔍 Verificando creador:', {
      creador: torneoExistente[0].created_by,
      usuario: req.userId,
      sonIguales: torneoExistente[0].created_by === req.userId
    });
    
    if (torneoExistente[0].created_by !== req.userId) {
      console.log('⛔ Usuario no es el creador');
      return res.status(403).json(
        errorResponse('Solo el creador del torneo puede eliminarlo')
      );
    }
    
    const [participantes] = await pool.execute(
      'SELECT COUNT(*) as total FROM jugador_torneo_saga WHERE torneo_id = ?',
      [torneoId]
    );
    
    console.log('👥 Participantes:', participantes[0].total);
    
    if (participantes[0].total > 0) {
      console.log('⛔ Torneo tiene participantes');
      return res.status(400).json(
        errorResponse('No se puede eliminar un torneo que ya tiene participantes inscritos')
      );
    }
    
    await pool.execute('DELETE FROM torneo_saga WHERE id = ?', [torneoId]);
    
    console.log(`✅ Torneo "${torneoExistente[0].nombre_torneo}" eliminado correctamente`);
    
    res.json(
      successResponse(`Torneo "${torneoExistente[0].nombre_torneo}" eliminado exitosamente`)
    );
    
  } catch (error) {
    console.error('❌ Error al eliminar torneo:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

/// ==========================================
// INSCRIBIRSE A UN TORNEO
// ==========================================
router.post('/:id/inscripcion', async (req, res) => {
  try {
    const torneoId = req.params.id;
    const { 
      usuarioId,
      bandaTipo,
      puntosGuardias,
      puntosGuerreros,
      puntosLevas,
      puntosMercenarios,
      detalleMercenarios
    } = req.body;

    console.log(`📝 POST /api/torneosSaga/${torneoId}/inscripcion`);

    // Validar que el torneo existe y obtener su época
    const [torneos] = await pool.execute(
      'SELECT puntos_maximos, estado, epoca_torneo FROM torneo_saga WHERE id = ?',
      [torneoId]
    );

    if (torneos.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }

    const torneo = torneos[0];

    // Validar puntos
    const totalPuntos = puntosGuardias + puntosGuerreros + puntosLevas + puntosMercenarios;
    if (totalPuntos !== torneo.puntos_banda) {
      return res.status(400).json(
        errorResponse(`Los puntos deben sumar ${torneo.punto_banda}`)
      );
    }

    // Verificar si ya está inscrito
    const [inscripcionExistente] = await pool.execute(
      'SELECT id FROM jugador_torneo_saga WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, usuarioId]
    );

    if (inscripcionExistente.length > 0) {
      return res.status(400).json(
        errorResponse('Ya estás inscrito en este torneo')
      );
    }

    // Formatear composición del ejército
    let composicionEjercito = `Guardias: ${puntosGuardias}, Guerreros: ${puntosGuerreros}, Levas: ${puntosLevas}, Mercenarios: ${puntosMercenarios}`;
    
    // Si hay mercenarios, añadir el detalle
    if (puntosMercenarios > 0 && detalleMercenarios) {
      composicionEjercito += ` (${detalleMercenarios})`;
    }

    // Insertar inscripción
    const [resultado] = await pool.execute(
      `INSERT INTO jugador_torneo_saga (
        torneo_id, 
        jugador_id, 
        epoca,
        faccion, 
        composicion_ejercito,
        pagado,
        puntos_victoria,
        puntos_torneo,
        puntos_masacre,
        warlord_muerto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        torneoId,
        usuarioId,
        torneo.epoca_torneo,
        bandaTipo,
        composicionEjercito,
        false,  // pagado por defecto false
        0,      // puntos_victoria por defecto 0
        0,      // puntos_torneo por defecto 0
        0,      // puntos_masacre por defecto 0
        0       // warlord_muerto por defecto 0
      ]
    );

    console.log(`✅ Usuario ${usuarioId} inscrito en torneo ${torneoId}`);

    res.json(
      successResponse('Inscripción realizada exitosamente', {
        inscripcionId: resultado.insertId,
        torneoId,
        usuarioId,
        faccion: bandaTipo,
        composicionEjercito
      })
    );

  } catch (error) {
    console.error('❌ Error al inscribirse:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ==========================================
// OBTENER HISTORIAL DE PARTIDAS
// ==========================================

router.get('/:id/partidasTorneoSaga', async (req, res) => {
  try {
    const torneoId = req.params.id;
    console.log(`📥 GET /api/torneosSaga/${torneoId}/partidasTorneoSaga`);
    
    // Obtener los datos de la tabla de juagadores del torneo, para comprobar las posibles variaciones a emparejamientos
    const [enfrentamientos] = await pool.execute(`
      SELECT 
        ps.id,
        ps.jugador1_id,
        ps.jugador2_id,
        ps.ronda,
        ps.puntos_victoria_j1,
        ps.puntos_victoria_j2,
        ps.puntos_torneo_j1,
        ps.puntos_torneo_j2,
        ps.puntos_masacre_j1,
        ps.puntos_masacre_j2,
        ps.primer_jugador,
        ps.resultado_cr,
        ps.created_at,
        CONCAT(j1.nombre, ' ', COALESCE(j1.apellidos, '')) as jugador1_nombre,
        CONCAT(j2.nombre, ' ', COALESCE(j2.apellidos, '')) as jugador2_nombre
      FROM partidas_saga ps
      INNER JOIN usuarios j1 ON ps.jugador1_id = j1.id
      INNER JOIN usuarios j2 ON ps.jugador2_id = j2.id
      WHERE ps.torneo_id = ?
      ORDER BY ps.ronda ASC, ps.id ASC
    `, [torneoId]);
    
    console.log(`✅ ${enfrentamientos.length} enfrentamientos históricos encontrados`);
    
    res.json(
      successResponse('Historial de enfrentamientos obtenido exitosamente', {
        enfrentamientos
      })
    );
    
  } catch (error) {
    console.error('❌ Error al obtener historial de enfrentamientos:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

//=========================================
// ACTUALIZAR A PRIMER JUGADOR DE CADA PARTIDA
//=========================================
router.put("/partidasTorneoSaga/:id/primer-jugador", async (req, res) => {
   try {  
    const { id } = req.params; // id de la partida
    const { jugadorId } = req.body; // id del jugador que clicó

    console.log(`📝 PUT /api/partidasTorneoSaga/${id}/primer-jugador - Jugador: ${jugadorId}`);

    // Validación de datos
    if (!jugadorId) {
      return res.status(400).json(
        errorResponse('El ID del jugador es requerido')
      );
    }

    // Verificar que el jugador pertenece a la partida
    const [partida] = await pool.execute(
      "SELECT jugador1_id, jugador2_id FROM partidas_saga WHERE id = ?",
      [id]
    );

    if (partida.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }

    if (partida[0].jugador1_id !== jugadorId && partida[0].jugador2_id !== jugadorId) {
      return res.status(403).json(
        errorResponse('El jugador no pertenece a esta partida')
      );
    }

    // Actualizar primer jugador
    await pool.execute(
      "UPDATE partidas_saga SET primer_jugador = ? WHERE id = ?",
      [jugadorId, id]
    );

    console.log(`✅ Primer jugador actualizado correctamente en partida ${id}`);
    
    res.json(
      successResponse('Primer jugador registrado correctamente', {
        partidaId: id,
        primerJugador: jugadorId
      })
    );
    
  } catch (error) {
    console.error('❌ Error al guardar el primer jugador:', error);
    res.status(500).json(
      errorResponse('Error interno del servidor')
    );
  }
});

// ==========================================
// CALCULAR Y GUARDAR RESULTADO DE PARTIDA
// ==========================================
router.post('/:id/calcular-resultado', async (req, res) => {
  try {
     const partidaId = req.params.id;
    const {                  
      puntosPartidaJ1,        // Solo para cálculo, NO lo guardamos
      puntosPartidaJ2,        // Solo para cálculo, NO lo guardamos
      puntosMasacreJ1, 
      puntosMasacreJ2,
      matoWarlordJ1 = false,  // boolean
      matoWarlordJ2 = false   // boolean
    } = req.body;

    console.log(`📊 POST /api/partidasTorneoSaga/${partidaId}/calcular-resultado`);

    // Validaciones
    if (puntosPartidaJ1 === undefined || puntosPartidaJ2 === undefined) {
      return res.status(400).json(
        errorResponse('Los puntos de partida son obligatorios')
      );
    }
      if (puntosMasacreJ1 === undefined || puntosMasacreJ2 === undefined) {
      return res.status(400).json(
        errorResponse('Los puntos de masacre son obligatorios')
      );
    }

    // Obtener datos de la partida (incluido primer_jugador)
    const [partidas] = await pool.execute(`
      SELECT 
        id,
        ronda,
        jugador1_id,
        jugador2_id,
        puntosMasacreJ1, 
        puntosMasacreJ2,
        primer_jugador,
        matoWarlordJ1,
        matoWarlordJ2,
      FROM partidas_saga 
      WHERE id = ?
    `, [partidaId]);

    if (partidas.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }

    const partida = partidas[0];

    // Verificar que primer_jugador esté asignado
    if (!partida.primer_jugador) {
      return res.status(400).json(
        errorResponse('Debe asignar el primer jugador antes de calcular resultados')
      );
    }

    // ===================================================
    // PASO 2: Calcular puntos de TORNEO (usando tabla)
    // ===================================================
    const puntosTorneo = calcularPuntosTorneo(
      puntosPartidaJ1,
      puntosPartidaJ2,
      partida.jugador1_id,
      partida.primer_jugador
    );

    console.log(`📊 Puntos Torneo - J1: ${puntosTorneo.j1}, J2: ${puntosTorneo.j2}`);

    // ===================================================
    // PASO 3: Guardar todos los resultados en la BD
    // ===================================================
    await pool.execute(`
      UPDATE partidas_saga 
      SET 
        puntos_partida_j1 = ?,
        puntos_partida_j2 = ?,
        puntos_masacre_j1 = ?,
        puntos_masacre_j2 = ?,
        mato_warlord_j1 = ?,
        mato_warlord_j2 = ?,
        puntos_victoria_j1 = ?,
        puntos_victoria_j2 = ?,
        puntos_torneo_j1 = ?,
        puntos_torneo_j2 = ?,
        resultado_cr = ?
      WHERE id = ?
    `, [
      puntosPartidaJ1,
      puntosPartidaJ2,
      puntosMasacreJ1 || 0,
      puntosMasacreJ2 || 0,
      matoWarlordJ1,
      matoWarlordJ2,
      puntosVictoriaJ1,
      puntosVictoriaJ2,
      puntosTorneo.j1,
      puntosTorneo.j2,
      puntosVictoriaJ1 === puntosVictoriaJ2 ? 'empate' : 
        (puntosVictoriaJ1 > puntosVictoriaJ2 ? 'j1' : 'j2'),
      partidaId
    ]);

    console.log(`✅ Resultado guardado correctamente`);

    // ===================================================
    // PASO 4: Actualizar clasificación del torneo
    // ===================================================
    // Obtener torneo_id de la partida
    const [partidaInfo] = await pool.execute(
      'SELECT torneo_id FROM partidas_saga WHERE id = ?',
      [partidaId]
    );

    if (partidaInfo.length > 0) {
      // Actualizar puntos totales de cada jugador en la tabla de clasificación
      await pool.execute(`
        UPDATE jugadores_torneo_saga 
        SET 
          puntos_torneo = puntos_torneo + ?,
          puntos_victoria = puntos_victoria + ?
        WHERE torneo_id = ? AND jugador_id = ?
      `, [
        puntosTorneo.j1,
        puntosVictoriaJ1,
        partidaInfo[0].torneo_id,
        partida.jugador1_id
      ]);

      await pool.execute(`
        UPDATE jugadores_torneo_saga 
        SET 
          puntos_torneo = puntos_torneo + ?,
          puntos_victoria = puntos_victoria + ?
        WHERE torneo_id = ? AND jugador_id = ?
      `, [
        puntosTorneo.j2,
        puntosVictoriaJ2,
        partidaInfo[0].torneo_id,
        partida.jugador2_id
      ]);

      console.log(`✅ Clasificación del torneo actualizada`);
    }

    // ===================================================
    // RESPUESTA
    // ===================================================
    res.json(
      successResponse('Resultado calculado y guardado correctamente', {
        partidaId,
        jugador1: {
          puntosPartida: puntosPartidaJ1,
          puntosMasacre: puntosMasacreJ1 || 0,
          matoWarlord: matoWarlordJ1,
          puntosVictoria: puntosVictoriaJ1,
          puntosTorneo: puntosTorneo.j1
        },
        jugador2: {
          puntosPartida: puntosPartidaJ2,
          puntosMasacre: puntosMasacreJ2 || 0,
          matoWarlord: matoWarlordJ2,
          puntosVictoria: puntosVictoriaJ2,
          puntosTorneo: puntosTorneo.j2
        },
        resultado: puntosVictoriaJ1 === puntosVictoriaJ2 ? 'Empate' : 
                   (puntosVictoriaJ1 > puntosVictoriaJ2 ? 'Ganador: Jugador 1' : 'Ganador: Jugador 2')
      })
    );

  } catch (error) {
    console.error('❌ Error al calcular resultado:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ==========================================
// OBTENER TORNEOS POR USUARIO
// ==========================================
router.get('/usuario/:userId', verificarToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (req.userId !== parseInt(userId)) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver torneos de otro usuario')
      );
    }
    
    const [torneosCreados] = await pool.execute(`
      SELECT 
        ts.id,
        ts.nombre_torneo,
        ts.rondas_max,
        ts.epoca_torneo,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_banda,
        ts.participantes_max,
        ts.estado,
        ts.partida_ronda_1,
        ts.partida_ronda_2,
        ts.partida_ronda_3,
        ts.partida_ronda_4,
        ts.partida_ronda_5,
        ts.bases_nombre,
        ts.base_tamaño,
        ts.created_by,
        ts.created_at,
        COUNT(jts.id) as total_participantes
      FROM torneo_saga ts 
      LEFT JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      WHERE ts.created_by = ?
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
    `, [userId]);
    
    const [torneosParticipando] = await pool.execute(`
      SELECT 
        ts.id,
        ts.nombre_torneo,
        ts.rondas_max,
        ts.epoca_torneo,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_banda,
        ts.participantes_max,
        ts.estado,
        ts.partida_ronda_1,
        ts.partida_ronda_2,
        ts.partida_ronda_3,
        ts.partida_ronda_4,
        ts.partida_ronda_5,
        ts.bases_nombre,
        ts.base_tamaño,
        ts.created_by,
        ts.created_at,
        jts.faccion,
        jts.composicion_ejercito,
        COUNT(jts2.id) as total_participantes
      FROM torneo_saga ts 
      JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      LEFT JOIN jugador_torneo_saga jts2 ON ts.id = jts2.torneo_id
      WHERE jts.jugador_id = ?
      GROUP BY ts.id, jts.id
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

// ==========================================
// OBTENER JUGADORES DE UN TORNEO
// ==========================================
router.get('/:id/jugadores', async (req, res) => {
  try {
    const torneoId = req.params.id;
    console.log(`📥 GET /api/torneosSaga/${torneoId}/jugadores`);
    
    const [jugadores] = await pool.execute(`
      SELECT 
        u.id,
        CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as nombre,
        u.club,
        jts.faccion as ejercito,
        jts.composicion_ejercito
      FROM jugador_torneo_saga jts
      INNER JOIN usuarios u ON jts.jugador_id = u.id
      WHERE jts.torneo_id = ?
      ORDER BY u.nombre
    `, [torneoId]);
    
    console.log(`✅ ${jugadores.length} jugadores encontrados`);
    
    res.json(jugadores);
    
  } catch (error) {
    console.error('❌ Error al obtener jugadores:', error);
    console.error('❌ Error detallado:', error.message);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
});

// ==========================================
// OBTENER PARTIDAS DE UN TORNEO
// ==========================================
router.get('/:id/partidas', async (req, res) => {
  try {
    const torneoId = req.params.id;
    console.log(`📥 GET /api/torneosSaga/${torneoId}/partidas`);
    
    const [partidas] = await pool.execute(`
      SELECT 
        ps.id,
        ps.torneo_id,
        ps.jugador1_id,
        ps.jugador2_id,
        ps.puntos_masacre_j1,
        ps.puntos_masacre_j2,
        ps.puntos_victoria_j1,
        ps.puntos_victoria_j2,
        ps.puntos_torneo_j1,
        ps.puntos_torneo_j2,
        ps.resultado_cr as resultado,
        ps.ronda,
        ps.created_at,
        CONCAT(j1.nombre, ' ', COALESCE(j1.apellidos, '')) as jugador1_nombre,
        CONCAT(j2.nombre, ' ', COALESCE(j2.apellidos, '')) as jugador2_nombre
      FROM partidas_saga ps
      INNER JOIN usuarios j1 ON ps.jugador1_id = j1.id
      INNER JOIN usuarios j2 ON ps.jugador2_id = j2.id
      WHERE ps.torneo_id = ?
      ORDER BY ps.ronda DESC, ps.id DESC
    `, [torneoId]);
    
    console.log(`✅ ${partidas.length} partidas encontradas`);
    
    res.json(partidas);
    
  } catch (error) {
    console.error('❌ Error al obtener partidas:', error);
    console.error('❌ Error detallado:', error.message);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
});

// ==========================================
// OBTENER CLASIFICACIÓN
// ==========================================
router.get('/:id/clasificacion', async (req, res) => {
  try {
    const torneoId = req.params.id;
    console.log(`📥 GET /api/torneosSaga/${torneoId}/clasificacion`);

    const [participantes] = await pool.execute(
      'SELECT COUNT(*) AS total FROM jugador_torneo_saga WHERE torneo_id = ?',
      [torneoId]
    );

    if (participantes[0].total === 0) {
      console.log('ℹ️ No hay participantes en este torneo');
      return res.json([]);
    }

    const [jugadores] = await pool.execute(`
      SELECT 
        u.id AS jugador_id,
        u.nombre,
        u.apellidos,
        CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) AS nombre_completo,
        u.club,
        u.localidad,
        u.pais,
        jts.id AS inscripcion_id,
        jts.epoca,
        jts.faccion,
        jts.composicion_ejercito,
        jts.pagado,
        jts.puntos_victoria,
        jts.puntos_torneo,
        jts.puntos_masacre,
        jts.warlord_muerto,
        jts.created_at AS fecha_inscripcion
      FROM jugador_torneo_saga jts
      INNER JOIN usuarios u ON jts.jugador_id = u.id
      WHERE jts.torneo_id = ?
      ORDER BY u.nombre ASC
    `, [torneoId]);

    console.log(`✅ ${jugadores.length} jugadores obtenidos`);
    res.json(jugadores);

  } catch (error) {
    console.error('❌ Error al obtener jugadores del torneo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
});

module.exports = router;