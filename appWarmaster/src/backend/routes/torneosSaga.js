// routes/torneosSaga.js
const express = require('express');
const jwt = require('jsonwebtoken'); 
const multer = require('multer');
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
// CONFIGURACIÓN DE MULTER PARA SUBIDA DE PDF
// ==========================================
// Configurar multer para guardar en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

// =========================================================
// OBTENER TODOS LOS TORNEOS (CON PAGINACIÓN) Y SIN AUTENTICACIÓN
// =========================================================
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/torneosSaga - Petición recibida');
    
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
    
    // ✅ Consulta principal con TODOS los campos (EXCEPTO el BLOB del PDF)
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
        COUNT(DISTINCT p.id) as total_participantes,
        MAX(CASE WHEN p.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneo_saga ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN participantes p ON ts.id = p.torneo_id
      ${whereClause}
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, ...params, limitNum, offset]);
    
    console.log(`✅ ${torneos.length} torneos encontrados`);
    
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
    
    // Establecer headers para descarga de PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${torneo.bases_nombre || 'bases_torneo.pdf'}"`);
    res.send(torneo.bases_torneo);
    
  } catch (error) {
    console.error('❌ Error al descargar PDF:', error);
    res.status(500).json(errorResponse('Error al descargar el PDF'));
  }
});

// ==========================================
// OBTENER UN TORNEO ESPECÍFICO (PÚBLICO)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/torneosSaga/${req.params.id}`);

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
        COUNT(DISTINCT p.id) as total_participantes,
        MAX(CASE WHEN p.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneo_saga ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN participantes p ON ts.id = p.torneo_id
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
// CREAR NUEVO TORNEO (REQUIERE AUTENTICACIÓN)
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
    
    // Validar campos requeridos
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
    
    // Validar número de rondas
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

    // ✅ Verificar rol del usuario y convertir a organizador si es necesario
    const [usuarios] = await pool.execute(
      'SELECT rol FROM usuarios WHERE id = ?',
      [req.userId] // ✅ Usar directamente req.userId del middleware
    );

    let rolActualizado = usuarios[0].rol;

    if (usuarios[0].rol !== 'organizador') {
      await pool.execute(
        'UPDATE usuarios SET rol = ? WHERE id = ?',
        ['organizador', req.userId] // ✅ Usar directamente req.userId
      );
      rolActualizado = 'organizador';
      console.log(`✅ Usuario ${req.userId} convertido a organizador`);
    }
    
    // ✅ Preparar datos del PDF si existe
    let basesPdf = null;
    let basesNombre = null;
    let baseTamaño = null;
    
    if (req.file) {
      basesPdf = req.file.buffer;
      basesNombre = req.file.originalname;
      baseTamaño = req.file.size;
      console.log(`📄 PDF recibido: ${basesNombre} (${baseTamaño} bytes)`);
    }
    
    // Crear el torneo
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
        req.userId // ✅ Usar directamente req.userId
      ]
    );
    
    console.log(`✅ Torneo creado con ID: ${resultado.insertId}`);
    
    res.status(201).json(
      successResponse('Torneo creado exitosamente', {
        torneoId: resultado.insertId,
        nombre_torneo,
        epoca_torneo, 
        tiene_bases_pdf: !!req.file,
        created_by: req.userId, // ✅ Usar directamente req.userId
        rol_actualizado: rolActualizado
      })
    );
    
  } catch (error) {
    console.error('❌ Error al crear torneo:', error);
    
    // Manejar error de Multer
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
router.put('/:id', verificarToken, verificarOrganizador, upload.single('bases_pdf'), async (req, res) => {
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
      eliminar_pdf // Flag para eliminar el PDF existente
    } = req.body;
    
    console.log(`📝 PUT /api/torneosSaga/${torneoId} - Actualizando torneo`);
    console.log('📦 Datos recibidos:', req.body);
    console.log('📄 Nuevo PDF:', req.file ? req.file.originalname : 'No adjunto');
    
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
    
    // Validaciones
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

    // Validar estado
    if (estado && !['pendiente', 'en_curso', 'finalizado'].includes(estado)) {
      return res.status(400).json(
        errorResponse('Estado inválido. Debe ser: pendiente, en_curso o finalizado')
      );
    }
    
    // Construir consulta de actualización dinámicamente
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
    
    // ✅ Manejar PDF
    // Opción 1: Se subió un nuevo PDF
    if (req.file) {
      camposActualizar.push('bases_torneo = ?');
      valores.push(req.file.buffer);
      
      camposActualizar.push('bases_nombre = ?');
      valores.push(req.file.originalname);
      
      camposActualizar.push('base_tamaño = ?');
      valores.push(req.file.size);
      
      console.log(`📄 Nuevo PDF: ${req.file.originalname} (${req.file.size} bytes)`);
    }
    // Opción 2: Se solicita eliminar el PDF existente
    else if (eliminar_pdf === 'true' || eliminar_pdf === true) {
      camposActualizar.push('bases_torneo = NULL');
      camposActualizar.push('bases_nombre = NULL');
      camposActualizar.push('base_tamaño = NULL');
      console.log('🗑️ Eliminando PDF existente');
    }
    // Opción 3: No se hace nada con el PDF (se mantiene el actual si existe)
    
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
    
    // Manejar error de Multer
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
    
    // Solo permitir ver torneos propios
    if (req.userId !== parseInt(userId)) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver torneos de otro usuario')
      );
    }
    
    // ✅ Torneos creados - con todos los campos nuevos
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
        COUNT(p.id) as total_participantes
      FROM torneo_saga ts 
      LEFT JOIN participantes p ON ts.id = p.torneo_id
      WHERE ts.created_by = ?
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
    `, [userId]);
    
    // ✅ Torneos participando - con todos los campos nuevos
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

// ==========================================
// OBTENER JUGADORES/PARTICIPANTES DE UN TORNEO
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
        p.faccion as ejercito,
        p.composicion_ejercito
      FROM participantes p
      INNER JOIN usuarios u ON p.jugador_id = u.id
      WHERE p.torneo_id = ?
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
        cb.id,
        cb.torneo_id,
        cb.jugador1_id,
        cb.jugador2_id,
        cb.puntos_masacre_cr_j1 as puntos_masacre_j1,
        cb.puntos_masacre_cr_j2 as puntos_masacre_j2,
        cb.puntos_cr_j1 as puntos_victoria_j1,
        cb.puntos_cr_j2 as puntos_victoria_j2,
        cb.puntos_torneo_cr_j1 as puntos_torneo_j1,
        cb.puntos_torneo_cr_j2 as puntos_torneo_j2,
        cb.resultado_cr as resultado,
        cb.ronda,
        cb.created_at,
        CONCAT(j1.nombre, ' ', COALESCE(j1.apellidos, '')) as jugador1_nombre,
        CONCAT(j2.nombre, ' ', COALESCE(j2.apellidos, '')) as jugador2_nombre
      FROM choque_bandas cb
      INNER JOIN usuarios j1 ON cb.jugador1_id = j1.id
      INNER JOIN usuarios j2 ON cb.jugador2_id = j2.id
      WHERE cb.torneo_id = ?
      ORDER BY cb.ronda DESC, cb.id DESC
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
// OBTENER DATOS DE CLASIFICACIÓN (sin ordenar)
// ==========================================
router.get('/:id/clasificacion', async (req, res) => {
  try {
    const torneoId = req.params.id;
    console.log(`📥 GET /api/torneosSaga/${torneoId}/clasificacion`);

    // Comprobamos que haya participantes
    const [participantes] = await pool.execute(
      'SELECT COUNT(*) AS total FROM participantes WHERE torneo_id = ?',
      [torneoId]
    );

    if (participantes[0].total === 0) {
      console.log('ℹ️ No hay participantes en este torneo');
      return res.json([]);
    }

    // Obtenemos datos crudos para que el frontend calcule clasificación
    const [datos] = await pool.execute(`
      SELECT 
        u.id AS jugador_id,
        CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) AS nombre_jugador,
        u.club,
        p.id AS participante_id,
        p.faccion,
        
        -- Puntos de torneo
        COALESCE(SUM(
          CASE 
            WHEN cb.jugador1_id = u.id THEN cb.puntos_torneo_cr_j1
            WHEN cb.jugador2_id = u.id THEN cb.puntos_torneo_cr_j2
            ELSE 0
          END
        ), 0) AS puntos_torneo,

        -- Puntos de masacre
        COALESCE(SUM(
          CASE 
            WHEN cb.jugador1_id = u.id THEN cb.puntos_masacre_cr_j1
            WHEN cb.jugador2_id = u.id THEN cb.puntos_masacre_cr_j2
            ELSE 0
          END
        ), 0) AS puntos_masacre,

        -- Puntos de victoria (puntos_cr)
        COALESCE(SUM(
          CASE 
            WHEN cb.jugador1_id = u.id THEN cb.puntos_cr_j1
            WHEN cb.jugador2_id = u.id THEN cb.puntos_cr_j2
            ELSE 0
          END
        ), 0) AS puntos_victoria,

        -- Número de partidas jugadas
        COUNT(DISTINCT cb.id) AS partidas_jugadas,

        -- Victorias / Empates / Derrotas
        SUM(
          CASE 
            WHEN (cb.jugador1_id = u.id AND cb.resultado_cr = 'victoria_j1') OR 
                 (cb.jugador2_id = u.id AND cb.resultado_cr = 'victoria_j2') THEN 1
            ELSE 0
          END
        ) AS victorias,

        SUM(
          CASE 
            WHEN cb.resultado_cr = 'empate' AND 
                 (cb.jugador1_id = u.id OR cb.jugador2_id = u.id) THEN 1
            ELSE 0
          END
        ) AS empates,

        SUM(
          CASE 
            WHEN (cb.jugador1_id = u.id AND cb.resultado_cr = 'victoria_j2') OR 
                 (cb.jugador2_id = u.id AND cb.resultado_cr = 'victoria_j1') THEN 1
            ELSE 0
          END
        ) AS derrotas

      FROM participantes p
      INNER JOIN usuarios u ON p.jugador_id = u.id
      LEFT JOIN choque_bandas cb 
        ON (cb.jugador1_id = u.id OR cb.jugador2_id = u.id)
        AND cb.torneo_id = ?
      WHERE p.torneo_id = ?
      GROUP BY u.id, u.nombre, u.apellidos, u.club, p.id, p.faccion
    `, [torneoId, torneoId]);

    console.log(`✅ Clasificación generada con ${datos.length} jugadores`);
    res.json(datos);

  } catch (error) {
    console.error('❌ Error al obtener clasificación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
});

module.exports = router;
