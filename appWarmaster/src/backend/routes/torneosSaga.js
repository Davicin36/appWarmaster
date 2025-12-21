// routes/torneosSaga.js
const express = require('express');
const jwt = require('jsonwebtoken'); 
const multer = require('multer');
const crypto = require('crypto');
const { pool } = require('../config/bd');
const { enviarInvitacionEquipo } = require('../utils/emailInscripcionEquipos');
const { verificarToken, verificarOrganizador } = require('../middleware/auth');
const { 
  calcularPuntosTorneo,
  validarFecha,
  validarCamposRequeridos,
  errorResponse,
  successResponse,
  manejarErrorDB,
  paginar,
  limpiarFecha
} = require('../utils/helpers');

const router = express.Router(); 

// =====CONFIGURACIÓN DE MULTER PARA SUBIDA DE PDF=====

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});


//================
//RUTAS TORNEOS
//================

//=====OBTENER TORNEOS CON PAGINACIÓN=====

router.get('/obtenerTorneos', async (req, res) => {
  try {
    console.log('📥 GET /api/torneosSaga');
    
    const { page = 1, limit = 10, buscar = '' } = req.query;
    const { limit: limitNum, offset } = paginar(page, limit);
    
    let userId = 0;
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
    
    let whereClause = 'WHERE ts.sistema = "SAGA"'
    let queryParams = [userId];
    
    if (buscar.trim()) {
      whereClause = 'WHERE ts.nombre_torneo LIKE ? OR ts.ubicacion LIKE ?';
      const searchTerm = `%${buscar}%`;
      params = [searchTerm, searchTerm];
    }

    queryParams.push(parseInt(limitNum), parseInt(offset))
    
    const [torneos] = await pool.query(`
      SELECT 
        ts.id,
        ts.nombre_torneo,
        ts.sistema,
        ts.tipo_torneo,
        ts.num_jugadores_equipo,
        ts.rondas_max,
        ts.ronda_actual,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_banda,
        ts.participantes_max,
        ts.equipos_max,
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
        GROUP_CONCAT(DISTINCT tse.epoca ORDER BY tse.epoca SEPARATOR '|') as epocas_disponibles,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.club as creador_club,
        COUNT(DISTINCT CASE WHEN ts.tipo_torneo = 'Individual' THEN jts.id ELSE NULL END) as total_participantes,
        COUNT(DISTINCT eq.id) as total_equipos_inscritos,
        COUNT(DISTINCT CASE WHEN ts.tipo_torneo = 'Por equipos' THEN jts.jugador_id ELSE NULL END) as total_jugadores_en_equipos,
        MAX(CASE WHEN jts.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      LEFT JOIN torneo_saga_equipo eq ON ts.id = eq.torneo_id
      LEFT JOIN torneo_saga_epocas tse ON ts.id = tse.torneo_id
      ${whereClause}
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
      LIMIT ? OFFSET ?
    `, queryParams);

    // Query para contar total
    let countParams = [];
    if (buscar.trim()) {
      const searchTerm = `%${buscar}%`;
      countParams = [searchTerm, searchTerm];
    }
    
    const [totalRows] = await pool.execute(`
      SELECT COUNT(DISTINCT ts.id) as total
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      LEFT JOIN torneo_saga_epocas tse ON ts.id = tse.torneo_id
      ${whereClause}
    `, countParams);
    
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

//=====OBTENER TORNEO ESPECIFICO=====

router.get('/torneo/:torneoId', async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    console.log(`📖 GET /torneo/${torneoId}`);
    
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        console.log(`✅ Usuario: ${userId}`);
      } catch (err) {
        console.log('ℹ️ Sin autenticación');
      }
    }

    const [torneos] = await pool.execute(`
      SELECT 
        ts.id,
        ts.sistema,
        ts.nombre_torneo,
        ts.tipo_torneo,
        ts.num_jugadores_equipo,
        ts.rondas_max,
        ts.ronda_actual,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_banda,
        ts.participantes_max,
        ts.equipos_max,
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
        GROUP_CONCAT(DISTINCT tse.epoca ORDER BY tse.epoca SEPARATOR '|') as epocas_disponibles,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.email as creador_email,
        u.club as creador_club,
        COUNT(DISTINCT CASE WHEN ts.tipo_torneo = 'Individual' THEN jts.id ELSE NULL END) as total_participantes,
        COUNT(DISTINCT eq.id) as total_equipos_inscritos,
        COUNT(DISTINCT CASE WHEN ts.tipo_torneo = 'Por equipos' THEN jts.jugador_id ELSE NULL END) as total_jugadores_en_equipos,
        MAX(CASE WHEN jts.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      LEFT JOIN torneo_saga_equipo eq ON ts.id = eq.torneo_id
      LEFT JOIN torneo_saga_epocas tse ON ts.id = tse.torneo_id
      WHERE ts.id = ?
      GROUP BY ts.id
    `, [userId, torneoId]);
    
    if (torneos.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }
    
    const torneo = torneos[0];
    
    res.json(
      successResponse('Torneo obtenido exitosamente', {
        torneo: torneo
      })
    );
    
  } catch (error) {
    console.error('❌ Error al obtener torneo:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// =====CREAR NUEVO TORNEO=====

router.post('/creandoTorneo', verificarToken, upload.single('bases_pdf'), async (req, res) => {
  try {
    
    const { 
      nombre_torneo, 
      tipo_torneo,
      num_jugadores_equipo,
      rondas_max,
      epocas_disponibles: epocas_raw,
      fecha_inicio, 
      fecha_fin, 
      ubicacion,
      puntos_banda,
      participantes_max,
      equipos_max,
      estado,
      partida_ronda_1,
      partida_ronda_2,
      partida_ronda_3,
      partida_ronda_4,
      partida_ronda_5
    } = req.body;

    // ✅ CORREGIDO: Parsear épocas si viene como string
    let epocas_disponibles;
    if (typeof epocas_raw === 'string') {
      try {
        epocas_disponibles = JSON.parse(epocas_raw);
      } catch (e) {
        epocas_disponibles = epocas_raw.split('|').map(e => e.trim()).filter(e => e);
      }
    } else {
      epocas_disponibles = epocas_raw;
    }
    
    const camposFaltantes = validarCamposRequeridos(req.body, [
      'nombre_torneo', 
      'tipo_torneo',
      'rondas_max', 
      'epocas_disponibles', 
      'fecha_inicio',
      'puntos_banda',
      'participantes_max',
      'equipos_max',
      'partida_ronda_1',
      'partida_ronda_2',
      'partida_ronda_3'
    ]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      );
    }

    if (!Array.isArray(epocas_disponibles) || epocas_disponibles.length === 0) {
      return res.status(400).json(
        errorResponse('Debe seleccionar al menos una época')
      );
    }

    if (tipo_torneo === 'Por equipos') {
      if (!num_jugadores_equipo) {
        return res.status(400).json(
          errorResponse('Debe especificar el número de jugadores por equipo')
        );
      }

      const numJugadores = parseInt(num_jugadores_equipo);

      if (isNaN(numJugadores)) {
        return res.status(400).json(
          errorResponse('El número de jugadores debe ser un número válido')
        );
      }

      if (numJugadores < 2 || numJugadores > 6) {
        return res.status(400).json(
          errorResponse('El número de jugadores por equipo debe estar entre 2 y 6')
        );
      }

      if (epocas_disponibles.length < numJugadores) {
        return res.status(400).json(
          errorResponse(`Debe seleccionar al menos ${numJugadores} épocas (una por jugador)`)
        );
      }
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

     if (equipos_max < 5 || equipos_max > 20) {
      return res.status(400).json(
        errorResponse('El número de equipos debe estar entre 5 y 20')
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
  [req.usuario.userId]
);

let rolActualizado = usuarios[0].rol;

if (usuarios[0].rol !== 'organizador') {
  console.log('🔄 Actualizando rol a organizador...');
  
  const [updateResult] = await pool.execute(
    'UPDATE usuarios SET rol = ? WHERE id = ?',
    ['organizador', req.usuario.userId]
  );
  
  console.log('✅ Resultado UPDATE:', updateResult);
  console.log('  Filas afectadas:', updateResult.affectedRows);
  
  rolActualizado = 'organizador';
}

console.log('📋 Rol final:', rolActualizado);
    
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
      `INSERT INTO torneos_sistemas 
       (nombre_torneo, 
        tipo_torneo,
        num_jugadores_equipo,
        rondas_max, 
        fecha_inicio, 
        fecha_fin, 
        ubicacion, 
        puntos_banda, 
        participantes_max, 
        equipos_max,
        estado, 
        partida_ronda_1, 
        partida_ronda_2, 
        partida_ronda_3, 
        partida_ronda_4, 
        partida_ronda_5, 
        bases_torneo, 
        bases_nombre, 
        base_tamaño, 
        created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_torneo, 
        tipo_torneo === 'Por equipos' ? 'Por equipos' : 'Individual',
        num_jugadores_equipo || null,
        rondas_max, 
        fecha_inicio, 
        fecha_fin || null, 
        ubicacion || null,  // ✅ Asegurar que se guarde
        puntos_banda,
        participantes_max,
        equipos_max,
        estado || 'pendiente',
        partida_ronda_1,
        partida_ronda_2,
        partida_ronda_3,
        partida_ronda_4 || null,
        partida_ronda_5 || null,
        req.file ? req.file.buffer : null,
        req.file ? req.file.originalname : null,
        req.file ? req.file.size : null,
        req.usuario.userId
      ]
    );

    const torneoId = resultado.insertId;

    // Guardar cada época en la tabla torneo_saga_epocas
    for (const epoca of epocas_disponibles) {
      await pool.execute(
        `INSERT INTO torneo_saga_epocas (torneo_id, epoca) VALUES (?, ?)`,
        [torneoId, epoca]
      );
      console.log(`  ✓ Época guardada: ${epoca}`);
    }
    
    res.status(201).json(
      successResponse('Torneo creado exitosamente', {
        torneoId: resultado.insertId,
        nombre_torneo,
        tipo_torneo,
        num_jugadores_equipo: num_jugadores_equipo || null,
        epocas_disponibles: epocas_disponibles,
        ubicacion: ubicacion || null,
        tiene_bases_pdf: !!req.file,
        created_by: req.usuario.userId
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

// ======ACTUALIZAR TORNEO=====

router.put('/:torneoId/actualizarTorneo', verificarToken, upload.single('bases_pdf'), async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    const { 
      nombre_torneo, 
      rondas_max,
      tipo_torneo,
      num_jugadores_equipo,
      ronda_actual,
      epoca_torneo: epoca_raw,
      fecha_inicio, 
      fecha_fin, 
      ubicacion,
      puntos_banda,
      participantes_max,
      equipos_max,
      estado,
      partida_ronda_1,
      partida_ronda_2,
      partida_ronda_3,
      partida_ronda_4,
      partida_ronda_5,
      eliminar_pdf
    } = req.body;

    let epocas_disponibles;
    if (epoca_raw) {
      if (typeof epoca_raw === 'string') {
        epocas_disponibles = epoca_raw.split('|').map(e => e.trim()).filter(e => e);
      } else if (Array.isArray(epoca_raw)) {
        epocas_disponibles = epoca_raw;
      }
    }
        
    const [torneoExistente] = await pool.execute(
      'SELECT created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneoExistente.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    if (torneoExistente[0].created_by !== req.usuario.userId) {
      return res.status(403).json(
        errorResponse('Solo el creador del torneo puede modificarlo')
      );
    }

    if (tipo_torneo === 'Por equipos' ) {
      if (num_jugadores_equipo) {
        const numJugadores = parseInt(num_jugadores_equipo);
        
        if (isNaN(numJugadores) || numJugadores < 2 || numJugadores > 6) {
          return res.status(400).json(
            errorResponse('El número de jugadores por equipo debe estar entre 2 y 6')
          );
        }
      if (epocas_disponibles && Array.isArray(epocas_disponibles)) {
      if (epocas_disponibles.length < numJugadores) {
        return res.status(400).json(
          errorResponse(`Debe tener al menos ${numJugadores} épocas para ${numJugadores} jugadores`)
        );
      }
    }
  }
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

     if (equipos_max && (equipos_max < 5 || equipos_max > 20)) {
      return res.status(400).json(
        errorResponse('El número de equipos debe estar entre 5 y 20')
      );
    }
    
    if (fecha_inicio && !validarFecha(fecha_inicio)) {
      return res.status(400).json(
        errorResponse('La fecha de inicio no puede ser en el pasado')
      );
    }
    
    if (fecha_fin && fecha_inicio && new Date(fecha_fin) < new Date(fecha_inicio)) {
      return res.status(400).json(
        errorResponse('La fecha de fin debe ser posterior o igual a la fecha de inicio')
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

    if (tipo_torneo !== undefined) {  
      camposActualizar.push('tipo_torneo = ?');
      valores.push(tipo_torneo);
    }

    if (num_jugadores_equipo !== undefined) { 
      camposActualizar.push('num_jugadores_equipo = ?');
      valores.push(num_jugadores_equipo || null);
    }

    if (rondas_max !== undefined) {
      camposActualizar.push('rondas_max = ?');
      valores.push(rondas_max);
    }

    if (ronda_actual !== undefined) {
      camposActualizar.push('ronda_actual = ?');
      valores.push(ronda_actual);
    }
    
    if (fecha_inicio !== undefined) {
      camposActualizar.push('fecha_inicio = ?');
      valores.push(limpiarFecha(fecha_inicio));
    }
    if (fecha_fin !== undefined) {
      camposActualizar.push('fecha_fin = ?');
      valores.push(limpiarFecha(fecha_fin));
    }
    
    // ✅ IMPORTANTE: Guardar ubicacion
    if (ubicacion !== undefined) {
      console.log('🔄 Actualizando ubicacion a:', ubicacion);
      camposActualizar.push('ubicacion = ?');
      valores.push(ubicacion || null);
    }
    
    if (puntos_banda !== undefined) {
      camposActualizar.push('puntos_banda = ?');
      valores.push(puntos_banda);
    }
    if (participantes_max !== undefined) {
      camposActualizar.push('participantes_max = ?');
      valores.push(participantes_max);
    }

     if (equipos_max !== undefined) {
        camposActualizar.push('equipos_max = ?');
        valores.push(equipos_max);
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
    }
    else if (eliminar_pdf === 'true' || eliminar_pdf === true) {
      camposActualizar.push('bases_torneo = NULL');
      camposActualizar.push('bases_nombre = NULL');
      camposActualizar.push('base_tamaño = NULL');
      console.log('🗑️ Eliminando PDF existente');
    }
    
    if (camposActualizar.length === 0 && !epocas_disponibles) {
      return res.status(400).json(
        errorResponse('No se proporcionaron campos para actualizar')
      );
    }
    
    // ✅ Actualizar torneo principal si hay cambios
    if (camposActualizar.length > 0) {
      valores.push(torneoId);
      await pool.execute(
        `UPDATE torneos_sistemas SET ${camposActualizar.join(', ')} WHERE id = ?`,
        valores
      );
      console.log('✅ Torneo actualizado');
    }
    
    // ✅ NUEVO: Actualizar épocas si se proporcionaron
    if (epocas_disponibles && Array.isArray(epocas_disponibles)) {
      console.log('📝 Actualizando épocas en torneo_saga_epocas...');
      
      // Eliminar épocas antiguas
      await pool.execute(
        'DELETE FROM torneo_saga_epocas WHERE torneo_id = ?',
        [torneoId]
      );
      
      // Insertar nuevas épocas
      for (const epoca of epocas_disponibles) {
        await pool.execute(
          `INSERT INTO torneo_saga_epocas (torneo_id, epoca) VALUES (?, ?)`,
          [torneoId, epoca]
        );
        console.log(`  ✓ Época guardada: ${epoca}`);
      }
    }
    
    res.json(
      successResponse('Torneo actualizado exitosamente', {
        torneoId,
        ubicacion_actualizada: ubicacion !== undefined,
        epocas_actualizadas: !!epocas_disponibles,
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

// ======INSCRIBIRSE EN TORNEO=====

router.post('/:torneoId/inscripcion', async (req, res) => {
  try {
    const { torneoId } = req.params;

    const { 
      usuarioId,
      faccion,
      puntosGuardias,
      puntosGuerreros,
      puntosLevas,
      puntosMercenarios,
      detalleMercenarios
    } = req.body;

    // Validar que el torneo existe y obtener su época
    const [torneos] = await pool.execute(
      `SELECT puntos_banda, particpantes_max, estado, tipo_torneo 
          FROM torneos_sistemas 
          WHERE id = ?`,
      [torneoId]
    );

    if (torneos.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }

    const torneo = torneos[0];

    if (torneo.estado !== 'pendiente'){
      return res.status(400).json (
        errorResponse('Solo puedes inscribirte en torneos que estén en estado PENDIENTE')
      )
    }

    if (torneo.tipo_torneo === 'Por equipos') {
      return res.status(400).json(
        errorResponse('Este es un torneo por equipos, Debes inscribirte con un equipo')
      )
    }

    const [conteoJugadores] = await pool.execute(
      `SELECT COUNT(*) as total
      FROM jugador_torneo_saga
      WHERE torneo_id = ?`,
      [torneoId]
    )

    const jugadoresInscritos = conteoJugadores[0].total

    if(jugadoresInscritos >= torneo.participantes_max){
      return res.status(400).json(
        errorResponse(`TORNEO COMPLETO: Ya están todas las plazas cubiertas del maximo de ${torneo.participantes_max}`)
      )
    }

    const [epocaBD] =await pool.execute(
      'SELECT epoca FROM torneo_saga_epocas WHERE torneo_id = ?',
      [torneoId]  
    )

     if (epocaBD.length === 0) {
      return res.status(404).json(
        errorResponse('No hay epocas en este torneo')
      );
    }

    const epocaTorneo = epocaBD[0].epoca.trim();

    // Validar puntos 
    if (puntosGuardias || puntosGuerreros || puntosLevas || puntosMercenarios){
      const totalPuntos = (puntosGuardias || 0) + (puntosGuerreros || 0) + (puntosLevas || 0) + (puntosMercenarios || 0);
      
      if (Math.abs(totalPuntos - torneo.puntos_banda) > 0.01) {
        return res.status(400).json(
          errorResponse(`Los puntos deben sumar ${torneo.puntos_banda}`)
        );
      }
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

    let composicionEjercito =  null

    if (puntosGuardias || puntosGuerreros || puntosLevas || puntosMercenarios) {
       composicionEjercito = JSON.stringify({
          guardias: puntosGuardias || 0,
          guerreros: puntosGuerreros || 0,
          levas: puntosLevas || 0,
          mercenarios: puntosMercenarios || 0,
          detalleMercenarios: detalleMercenarios || null
      });
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
        epocaTorneo,
        faccion || 'sin definir',
        composicionEjercito,
        0,      // pagado por defecto 0 = pendiente
        0,      // puntos_victoria por defecto 0
        0,      // puntos_torneo por defecto 0
        0,      // puntos_masacre por defecto 0
        0       // warlord_muerto por defecto 0
      ]
    );

    res.json(
      successResponse('Inscripción realizada exitosamente', {
        inscripcionId: resultado.insertId,
        torneoId,
        usuarioId,
        epoca: epocaTorneo,
        faccion: faccion || null,
        composicionEjercito: composicionEjercito ?JSON.parse(composicionEjercito) :  null
      })
    );

  } catch (error) {
    console.error('❌ Error al inscribirse:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// =====OBTENER MI INSCRIPCIÓN=====

router.get('/:torneoId/obtenerInscripcion', verificarToken, async (req, res) => {
    try {
        const { torneoId } = req.params;
        const jugadorId = req.userId
        
        const [inscripcion] = await pool.execute(`
            SELECT * FROM jugador_torneo_saga 
            WHERE torneo_id = ? AND jugador_id = ?
        `, [torneoId, jugadorId]);
        
        if (inscripcion.length === 0) {
            return res.status(404).json(errorResponse('No estás inscrito'));
        }

        // Parsear la composición si existe
        if (inscripcion[0].composicion_ejercito) {
            try {
                inscripcion[0].composicion_ejercito = JSON.parse(inscripcion[0].composicion_ejercito);
            } catch {
                inscripcion[0].composicion_ejercito = {};
            }
        }
        
        res.json(successResponse('Inscripción encontrada', inscripcion[0]));
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json(errorResponse('Error al obtener inscripción'));
    }
});

// =====ACTUALIZAR INSCRIPCIÓN=====

router.put('/:torneoId/actualizarInscripcion', verificarToken, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { torneoId } = req.params;
        const jugadorId = req.usuario.userId;

        const {
            faccion,
            puntosGuardias,
            puntosGuerreros,
            puntosLevas,
            puntosMercenarios,
            detalleMercenarios
        } = req.body;

        await connection.beginTransaction();

        // Verificar que está inscrito
        const [inscripcion] = await connection.execute(
            'SELECT id, epoca FROM jugador_torneo_saga WHERE torneo_id = ? AND jugador_id = ?',
            [torneoId, jugadorId]
        );

        if (inscripcion.length === 0) {
            await connection.rollback();
            return res.status(404).json(errorResponse('No estás inscrito en este torneo'));
        }

        // Validar puntos SOLO si se proporcionan
        if (puntosGuardias || puntosGuerreros || puntosLevas || puntosMercenarios) {
            const [torneos] = await connection.execute(
                'SELECT puntos_banda FROM torneos_sistemas WHERE id = ?',
                [torneoId]
            );

            if (torneos.length > 0) {
                const totalPuntos = (puntosGuardias || 0) + (puntosGuerreros || 0) + (puntosLevas || 0) + (puntosMercenarios || 0);
                
                if (Math.abs(totalPuntos - torneos[0].puntos_banda) > 0.01) {
                    await connection.rollback();
                    return res.status(400).json(
                        errorResponse(`Los puntos deben sumar ${torneos[0].puntos_banda}`)
                    );
                }
            }
        }

        // Crear composición SOLO si hay puntos
        let composicionEjercito = null;
        
        if (puntosGuardias || puntosGuerreros || puntosLevas || puntosMercenarios) {
            composicionEjercito = JSON.stringify({
                guardias: puntosGuardias || 0,
                guerreros: puntosGuerreros || 0,
                levas: puntosLevas || 0,
                mercenarios: puntosMercenarios || 0,
                detalleMercenarios: detalleMercenarios || null
            });
        }

        // Actualizar inscripción
        await connection.execute(`
            UPDATE jugador_torneo_saga 
            SET faccion = ?,
                composicion_ejercito = ?
            WHERE torneo_id = ? AND jugador_id = ?
        `, [
            faccion || null,           // CRÍTICO: || null en lugar de undefined
            composicionEjercito,       // Ya es null si no hay puntos
            torneoId,
            jugadorId
        ]);

        await connection.commit();

        // Obtener inscripción actualizada
        const [inscripcionActualizada] = await connection.execute(`
            SELECT * FROM jugador_torneo_saga 
            WHERE torneo_id = ? AND jugador_id = ?
        `, [torneoId, jugadorId]);

        if (inscripcionActualizada.length > 0 && inscripcionActualizada[0].composicion_ejercito) {
            try {
                inscripcionActualizada[0].composicion_ejercito = JSON.parse(inscripcionActualizada[0].composicion_ejercito);
            } catch {
                inscripcionActualizada[0].composicion_ejercito = null;
            }
        }

        console.log(`✅ Inscripción actualizada para usuario ${jugadorId} en torneo ${torneoId}`);

        res.json(successResponse(inscripcionActualizada[0], 'Inscripción actualizada correctamente'));

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al actualizar inscripción:', error);
        res.status(500).json(errorResponse('Error al actualizar inscripción'));
    } finally {
        connection.release();
    }
});

// =====INSCRIPCIÓN EQUIPOS=====

router.post('/:torneoId/inscripcionEquipo', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { torneoId } = req.params;
    const { 
      nombreEquipo, 
      miembros,
      miEpoca,
      miBanda,
      misPuntos,
      miDetalleMercenarios
    } = req.body;
    
    const inscriptorId = req.userId;
    
    await connection.beginTransaction();

    const [torneos] = await connection.execute(
      `SELECT 
        id, 
        tipo_torneo, 
        num_jugadores_equipo,
        participantes_max,
        equipos_max,
        puntos_banda,
        estado,
        nombre_torneo,
        created_by,
        sistema,
        ubicacion,
        fecha_inicio,
        fecha_fin
      FROM torneos_sistemas 
      WHERE id = ?`,
      [torneoId]
    );

    if (torneos.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const torneo = torneos[0];

    if (torneo.estado !== 'pendiente') {
      await connection.rollback();
      return res.status(400).json(
        errorResponse('Solo puedes inscribirte en torneos que estén en estado PENDIENTE')
      );
    }

    if (torneo.tipo_torneo !== 'Por equipos') {
      await connection.rollback();
      return res.status(400).json(
        errorResponse('Este torneo no acepta inscripciones por equipos')
      );
    }

    // ✅ SIN VALORES POR DEFECTO - Validar que existe
    if (!torneo.num_jugadores_equipo) {
      await connection.rollback();
      return res.status(400).json(
        errorResponse('El torneo no tiene configurado el número de jugadores por equipo')
      );
    }

    if (!torneo.equipos_max) {
      await connection.rollback();
      return res.status(400).json(
        errorResponse('El torneo no tiene configurado el número máximo de equipos')
      );
    }

    const [conteoEquipos] = await connection.execute(
      `SELECT COUNT(*) as total FROM torneo_saga_equipo WHERE torneo_id = ?`,
      [torneoId]
    );

    const equiposActuales = conteoEquipos[0].total;

     if (equiposActuales >= torneo.equipos_max) {
      await connection.rollback();
      return res.status(400).json(
        errorResponse(
          `❌ TORNEO COMPLETO: Ya hay ${equiposActuales} equipos inscritos (máximo: ${torneo.equipos_max})`
        )
      );
    }

    const jugadoresRequeridos = torneo.num_jugadores_equipo;

    const [yaInscrito] = await connection.execute(
      `SELECT 
        e.id, 
        e.nombre_equipo
       FROM torneo_saga_equipo e
       INNER JOIN equipo_miembros em ON e.id = em.equipo_id
       INNER JOIN jugador_torneo_saga j ON em.jugador_eq_id = j.id
       WHERE e.torneo_id = ? AND j.jugador_id = ?`,
      [torneoId, inscriptorId]
    );

    if (yaInscrito.length > 0) {
      await connection.rollback();
      return res.status(400).json(
        errorResponse(`Ya estás en el equipo "${yaInscrito[0].nombre_equipo}"`)
      );
    }

    // Validar número total de miembros (inscriptor + otros)
    const totalMiembros = miembros.length + 1;
    
    if (totalMiembros !== jugadoresRequeridos) {
      await connection.rollback();
      return res.status(400).json(
        errorResponse(`El equipo debe tener exactamente ${jugadoresRequeridos} jugadores (incluyéndote). Recibido: ${totalMiembros}`)
      );
    }

    //PROCESAMIENTO DE JUGADORES DEL TORNEO

    const miembrosConUsuarioId = []
    const miembrosInvitar = []

    if (miembros.length > 0) {
      const emails = miembros.map(m => m.email.toLowerCase().trim());

      if(new Set(emails).size !== emails.length){
        await connection.rollback()
        return res.status(400).json(
          errorResponse('No puede haber emails duplicados en el equipo')
        )
      }

      const [inscriptorEmailResult] = await connection.execute(
        'SELECT email FROM usuarios WHERE id = ?',
        [inscriptorId]
      );

      const inscriptorEmail = inscriptorEmailResult[0].email.toLowerCase();

      if (emails.includes(inscriptorEmail)) {
        await connection.rollback();
        return res.status(400).json(
          errorResponse('No puedes incluirte a ti mismo en la lista de miembros adicionales')
        );
      }

      const placeholders = emails.map(() => '?').join(',');
      const [yaEnOtroEquipo] = await connection.execute(
        `SELECT u.email, e.nombre_equipo
            FROM jugador_torneo_saga jts
            INNER JOIN usuarios u ON jts.jugador_id = u.id
            INNER JOIN torneo_saga_equipo e ON jts.equipo_id = e.id
            WHERE jts.torneo_id = ? AND u.email IN (${placeholders})`,
          [torneoId, ...emails]
      )

      if (yaEnOtroEquipo.length > 0) {
        const detalles = yaEnOtroEquipo.map (u =>`${u.email} (en "${u.nombre_equipo}")`).join(', ')
        await connection.rollback()
        return res.status(400).json(
          errorResponse(`Usuarios ya inscritos en otros Equipos: ${detalles}`)
        )
      }

      const [usuariosExistentes] = await connection.execute(
        `SELECT id, email, nombre, apellidos, estado_cuenta 
            FROM usuarios 
            WHERE email IN (${placeholders})`,
        emails
      );

      const usuariosMap = new Map (
        usuariosExistentes.map (usu => [usu.email.toLowerCase(), usu])
      )

      for (const miembro of miembros) {
        const emailLower = miembro.email.toLowerCase().trim()
        const usuarioExistente = usuariosMap.get(emailLower)

        if (usuarioExistente){
          miembrosConUsuarioId.push ({
            ...miembro,
            usuarioId: usuarioExistente.id,
            nombre: miembro.nombre || `${usuarioExistente.nombre} ${usuarioExistente.apellidos}`.trim(),
            esNuevo: false
          })
        } else {
          //CREAMOS CUENTA PENDIENTE
          const [nuevoUsuario] = await connection.execute(
            `INSERT INTO usuarios (
              email,
              nombre,
              apellidos,
              password,
              estado_cuenta
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              emailLower,
              miembro.nombre || emailLower.split('@')[0],
              'Pendiente',
              crypto.randomBytes(20).toString('hex'), // Password temporal
              'pendiente_registro'
            ]
          );

          const nuevoUserId = nuevoUsuario.insertId;
          
          miembrosConUsuarioId.push({
            ...miembro,
            usuarioId: nuevoUserId,
            nombre: miembro.nombre || emailLower.split('@')[0],
            esNuevo: true
          });

          // Marcar para enviar email
          miembrosInvitar.push({
            ...miembro,
            usuarioId: nuevoUserId,
            nombre: miembro.nombre || emailLower.split('@')[0]
          });
        }
      }
    }
  
    const [resultadoEquipo] = await connection.execute(
      `INSERT INTO torneo_saga_equipo (
        torneo_id, 
        nombre_equipo, 
        capitan_id,
        pagado
      ) VALUES (?, ?, ?, ?)`,
      [torneoId, nombreEquipo, inscriptorId, 'pendiente'] 
    );

    const equipoId = resultadoEquipo.insertId;

  //INTRODUCIR CAPITAN
    const composicionInscriptor = JSON.stringify({
      guardias: misPuntos?.guardias || 0,
      guerreros: misPuntos?.guerreros || 0,
      levas: misPuntos?.levas || 0,
      mercenarios: misPuntos?.mercenarios || 0,
      detalleMercenarios: miDetalleMercenarios || null
    });

    const [resultadoInscriptor] = await connection.execute(
      `INSERT INTO jugador_torneo_saga (
        torneo_id,
        jugador_id,
        equipo_id,
        epoca,
        faccion,
        composicion_ejercito
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        torneoId,
        inscriptorId,
        equipoId,
        miEpoca || null,
        miBanda || null,
        miBanda ? composicionInscriptor :  null
      ]
    );

    const inscriptorJugadorId = resultadoInscriptor.insertId;

    await connection.execute(
      `INSERT INTO equipo_miembros (
        equipo_id,
        usuario_id,
        jugador_eq_id
      ) VALUES (?, ?, ?)`,
      [equipoId, inscriptorId, inscriptorJugadorId]
    );

    for (const miembro of miembrosConUsuarioId) {
          const composicionMiembro = JSON.stringify({
            guardias: miembro.puntos?.guardias || 0,
            guerreros: miembro.puntos?.guerreros || 0,
            levas: miembro.puntos?.levas || 0,
            mercenarios: miembro.puntos?.mercenarios || 0,
            detalleMercenarios: miembro.detalleMercenarios || null
          });

      const [resultadoJugador] = await connection.execute(
        `INSERT INTO jugador_torneo_saga (
          torneo_id,
          jugador_id,
          equipo_id,
          epoca,
          faccion,
          composicion_ejercito
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          torneoId,
          miembro.usuarioId,
          equipoId,
          miembro.epoca || null,
          miembro.banda || null,
          miembro.banda ? composicionMiembro : null
        ]
      );

      const jugadorId = resultadoJugador.insertId;

      await connection.execute(
        `INSERT INTO equipo_miembros (
          equipo_id,
          usuario_id,
          jugador_eq_id
        ) VALUES (?, ?, ?)`,
        [equipoId, miembro.usuarioId, jugadorId]
      );
    }

    //INICIALIZAR CLASIFICACIONES
    await connection.execute(`
      INSERT INTO clasificacion_equipos_saga (
          torneo_id,
          equipo_id,
          partidas_jugadas,
          partidas_ganadas,
          partidas_empatadas,
          partidas_perdidas,
          puntos_victoria_eq_totales,
          puntos_torneo_eq_totales,
          puntos_masacre_eq_totales,
          warlord_muerto
      ) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0)
          ON DUPLICATE KEY UPDATE equipo_id = equipo_id
        `, [torneoId, equipoId])

      await connection.execute(`
          INSERT INTO clasificacion_jugadores_saga (
            torneo_id,
            jugador_id,
            equipo_id,
            partidas_jugadas,
            partidas_ganadas,
            partidas_empatadas,
            partidas_perdidas,
            puntos_victoria_totales,
            puntos_torneo_totales,
            puntos_masacre_totales,
            warlord_muerto_totales
          ) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)
          ON DUPLICATE KEY UPDATE jugador_id = jugador_id
        `, [torneoId, inscriptorId, equipoId]);

        for (const miembro of miembrosConUsuarioId) {         
          await connection.execute(`
              INSERT INTO clasificacion_jugadores_saga (
                torneo_id,
                jugador_id,
                equipo_id,
                partidas_jugadas,
                partidas_ganadas,
                partidas_empatadas,
                partidas_perdidas,
                puntos_victoria_totales,
                puntos_torneo_totales,
                puntos_masacre_totales,
                warlord_muerto_totales
              ) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)
              ON DUPLICATE KEY UPDATE jugador_id = jugador_id
            `, [torneoId, miembro.usuarioId, equipoId]);
        }

      await connection.commit();

      if (miembrosConUsuarioId.length > 0) {
       
      // Obtener info del capitán
      const [inscriptorInfo] = await connection.execute(
        'SELECT nombre, apellidos, email FROM usuarios WHERE id = ?',
        [inscriptorId]
      );

      const capitan = {
        nombre: `${inscriptorInfo[0].nombre} ${inscriptorInfo[0].apellidos}`.trim(),
        email: inscriptorInfo[0].email
      };

      const [organizadorInfo] = await connection.execute(
        'SELECT nombre, apellidos, email FROM usuarios WHERE id = ?',
        [torneo.created_by]
      );

      const organizador = {
        nombre: `${organizadorInfo[0].nombre} ${organizadorInfo[0].apellidos}`.trim(),
        email: organizadorInfo[0].email
      };

      console.log('📧 Correos a enviar:', miembrosConUsuarioId.map(m => ({
        email: m.email,
        esNuevo: m.esNuevo,
        usuarioId: m.usuarioId
    })));

      // Enviar correos en segundo plano (no bloquear la respuesta)
      setImmediate(async () => {
        for (const miembro of miembrosConUsuarioId) {
          try {
            await enviarInvitacionEquipo(
              {
                nombre: miembro.nombre,
                email: miembro.email,
                epoca: miembro.epoca,
                banda: miembro.banda,
                esNuevo: miembro.esNuevo
              },
              {
                nombreEquipo,
                capitan
              },
              {
                nombre_torneo: torneo.nombre_torneo,
                sistema: torneo.sistema,
                organizador,
                tipo_torneo: torneo.tipo_torneo,
                ubicacion: torneo.ubicacion,
                fecha_inicio: torneo.fecha_inicio,
                fecha_fin: torneo.fecha_fin,
                puntos_banda: torneo.puntos_banda
              },
              null // Ya no usamos token
            );
          } catch (emailError) {
            console.error(`  ❌ Error enviando email a ${miembro.email}:`, emailError.message);
          }
        }
      });
    }
    
        res.json(
          successResponse('Equipo inscrito exitosamente', {
            equipoId,
            torneoId,
            nombreEquipo,
            totalMiembros,
            miembrosNuevos: miembrosInvitar.length,
            correosProgramados: miembrosConUsuarioId.map(m => m.email)
          })
        );

  } catch (error) {
    await connection.rollback();
    console.error('❌ ERROR EN INSCRIPCIÓN:', error);
    console.error('Stack:', error.stack);

     return res.status(500).json(
      errorResponse('Error interno del servidor', error.message)
    );
  } finally {
    connection.release();
  }
});

// ===== OBTENER MI EQUIPO =====

router.get('/:torneoId/obtenerInscripcionEquipo', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const userId = req.usuario.userId;
    
    console.log(`📖 GET /${torneoId}/obtenerInscripcionEquipo - User: ${userId}`);
    
    // Buscar equipo del usuario
    const [equipos] = await pool.execute(`
      SELECT DISTINCT
        tse.id,
        tse.nombre_equipo,
        tse.capitan_id
      FROM torneo_saga_equipo tse
      INNER JOIN equipo_miembros em ON tse.id = em.equipo_id
      INNER JOIN jugador_torneo_saga jts ON em.jugador_eq_id = jts.id
      WHERE tse.torneo_id = ? AND jts.jugador_id = ?
    `, [torneoId, userId]);
    
    if (equipos.length === 0) {
      return res.status(404).json(errorResponse('No estás en ningún equipo'));
    }

    const equipo = equipos[0];

    // ✅ OBTENER TODOS LOS MIEMBROS (ACTIVOS Y PENDIENTES)
    const [miembros] = await pool.execute(`
      SELECT 
        j.id as jugador_id,
        j.jugador_id as usuario_id,
        j.epoca,
        j.faccion as banda,
        j.composicion_ejercito,
        u.nombre,
        u.apellidos,
        u.email,
        u.estado_cuenta,
        e.capitan_id = j.jugador_id as es_capitan
      FROM jugador_torneo_saga j
      INNER JOIN equipo_miembros em ON j.id = em.jugador_eq_id
      INNER JOIN usuarios u ON j.jugador_id = u.id
      INNER JOIN torneo_saga_equipo e ON em.equipo_id = e.id
      WHERE em.equipo_id = ?
      ORDER BY (e.capitan_id = j.jugador_id) DESC, u.nombre
    `, [equipo.id]);

    console.log(`📋 Miembros encontrados: ${miembros.length}`);
    
    // ✅ PROCESAR MIEMBROS (INCLUYENDO PENDIENTES)
    const miembrosProcesados = miembros.map(m => {
      let composicion = {};
      try {
        composicion = typeof m.composicion_ejercito === 'string'
          ? JSON.parse(m.composicion_ejercito)
          : m.composicion_ejercito || {};
      } catch (e) {
        console.error('Error al parsear composición:', e);
      }

      // ✅ LOG para debugging
      console.log(`  - ${m.nombre} ${m.apellidos} (${m.email}): ${m.estado_cuenta}`);

      return {
        jugador_id: m.jugador_id,
        usuario_id: m.usuario_id,
        nombre: `${m.nombre} ${m.apellidos}`,
        email: m.email,
        epoca: m.epoca,
        banda: m.banda,
        puntos: {
          guardias: composicion.guardias || 0,
          guerreros: composicion.guerreros || 0,
          levas: composicion.levas || 0,
          mercenarios: composicion.mercenarios || 0
        },
        detalle_mercenarios: composicion.detalleMercenarios || '',
        es_capitan: Boolean(m.es_capitan),
        estado_cuenta: m.estado_cuenta 
      };
    });

    const respuesta = {
      ...equipo,
      esCapitan: equipo.capitan_id === userId,
      miembros: miembrosProcesados,
      // ✅ NUEVO: Estadísticas del equipo
      estadisticas: {
        total: miembrosProcesados.length,
        activos: miembrosProcesados.filter(m => m.estado_cuenta === 'activo').length,
        pendientes: miembrosProcesados.filter(m => m.estado_cuenta === 'pendiente_registro').length
      }
    };
    
    console.log(`✅ Equipo encontrado: ${equipo.nombre_equipo}`);
    console.log(`   - Miembros activos: ${respuesta.estadisticas.activos}`);
    console.log(`   - Miembros pendientes: ${respuesta.estadisticas.pendientes}`);
    
    res.json(successResponse('Equipo encontrado', respuesta));
    
  } catch (error) {
    console.error('❌ Error al obtener equipo:', error);
    console.error('Stack:', error.stack);
    res.status(500).json(errorResponse('Error al obtener equipo'));
  }
});

// ===== ACTUALIZAR EQUIPO =====

router.put('/:torneoId/actualizarInscripcionEquipo', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    const userId = req.userId;
    const { nombreEquipo, miembros } = req.body;

    await connection.beginTransaction();

    // Verificar que el usuario es miembro del equipo
    const [equipos] = await connection.execute(
      `SELECT DISTINCT e.id, e.nombre_equipo 
          FROM torneo_saga_equipo e
          INNER JOIN equipo_miembros em ON e.id = em.equipo_id
          INNER JOIN jugador_torneo_saga j ON em.jugador_eq_id = j.id
          WHERE e.torneo_id = ? AND j.jugador_id = ?`,
      [torneoId, userId]
    );

    if (equipos.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('No eres miembro de ningún equipo'));
    }

    const equipoId = equipos[0].id;

    // Validar miembros
    if (!miembros || miembros.length < 2 || miembros.length > 6) {
      await connection.rollback();
      return res.status(400).json(
        errorResponse('El equipo debe tener entre 2 y 6 miembros')
      );
    }

    // Buscar nuevo capitán
    const capitan = miembros.find(m => m.esCapitan);
    if (!capitan) {
      await connection.rollback();
      return res.status(400).json(errorResponse('Debe haber un capitán'));
    }

    const [usuarioCapitan] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [capitan.email.toLowerCase().trim()]
    );

    const nuevoCapitanId = usuarioCapitan[0].id;

    // Actualizar nombre del equipo y capitán
    await connection.execute(
      'UPDATE torneo_saga_equipo SET nombre_equipo = ?, capitan_id = ? WHERE id = ?',
      [nombreEquipo, nuevoCapitanId, equipoId]
    );

    //VALIDAR LOS EMAILS DE LOS MIEMBROS QUE EXISTAN
    const emailsUnicos = new Set();
    for (const miembro of miembros) {
      const emailLower = miembro.email.toLowerCase().trim();
        
       // Validar emails únicos
       if (emailsUnicos.has(emailLower)) {
        await connection.rollback();
          return res.status(400).json(
            errorResponse(`Email duplicado: ${miembro.email}`)
          );
      }
      emailsUnicos.add(emailLower);
    }

    const usuariosMap = new Map();
    
    for (const miembro of miembros) {
      const emailLower = miembro.email.toLowerCase().trim();
          
      const [usuario] = await connection.execute(
        'SELECT id, nombre, apellidos, estado_cuenta FROM usuarios WHERE email = ?',
        [emailLower]
      );

      if (usuario.length === 0) {
        await connection.rollback();
          return res.status(400).json(
            errorResponse(
              `El usuario ${miembro.email} no existe en el sistema. ` +
              `Debe haber sido invitado previamente o estar registrado.`
            )
          );
      }
      usuariosMap.set(emailLower, usuario[0]);
    }

    // Eliminar miembros anteriores
    await connection.execute(
      'DELETE FROM equipo_miembros WHERE equipo_id = ?',
      [equipoId]
    );

    await connection.execute(
      'DELETE FROM jugador_torneo_saga WHERE torneo_id = ? AND equipo_id = ?',
      [torneoId, equipoId]
    );

    // Insertar todos los miembros nuevamente
    for (const miembro of miembros) {
      const emailLower = miembro.email.toLowerCase().trim();
      const usuario = usuariosMap.get(emailLower);
      const usuarioId = usuario.id

      const composicion = JSON.stringify({
          guardias: miembro.puntos?.guardias || 0,
          guerreros: miembro.puntos?.guerreros || 0,
          levas: miembro.puntos?.levas || 0,
          mercenarios: miembro.puntos?.mercenarios || 0,
          detalleMercenarios: miembro.detalleMercenarios || null
      });

      const [resultadoJugador] = await connection.execute(
        `INSERT INTO jugador_torneo_saga (
          torneo_id,
          jugador_id,
          equipo_id,
          epoca,
          faccion,
          composicion_ejercito
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [torneoId, usuarioId, equipoId, miembro.epoca, miembro.banda || null, composicion]
      );

      const jugadorId = resultadoJugador.insertId;

      await connection.execute(
        `INSERT INTO equipo_miembros (
          equipo_id,
          usuario_id,
          jugador_eq_id
        ) VALUES (?, ?, ?)`,
        [equipoId, usuarioId, jugadorId]
      );
    }

    await connection.commit();

    res.json(successResponse('Equipo actualizado correctamente', {
      equipoId,
      nombreEquipo,
      totalMiembros: miembros.length,
      miembrosActivos: [...usuariosMap.values()].filter(u => u.estado_cuenta === 'activo').length,
      miembrosPendientes: [...usuariosMap.values()].filter(u => u.estado_cuenta === 'pendiente_registro').length
    }));

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al actualizar equipo:', error);
    res.status(500).json(errorResponse('Error al actualizar equipo'));
  } finally {
    connection.release();
  }
});

// ====== ACTUALIZAR EL PAGO INSCRIPCION DE EQUIPO (solo organizadores) ======

router.patch('/:torneoId/equipos/:equipoId/pago', verificarToken, async (req, res) => {
    try {
        const { torneoId, equipoId } = req.params;
        const { pagado } = req.body; // 'pagado' o 'pendiente'

        // Validar valor
        if (!['pendiente', 'pagado'].includes(pagado)) {
            return res.status(400).json(errorResponse('Valor de pago inválido. Debe ser "pendiente" o "pagado"'));
        }

        // Verificar que el usuario es organizador del torneo
        const [torneo] = await pool.execute(
            'SELECT created_by FROM torneos_sistemas WHERE id = ?',
            [torneoId]
        );
        
        if (!torneo.length || torneo[0].created_by !== req.userId) {
            return res.status(403).json(errorResponse('No tienes permisos'));
        }

        // Actualizar estado de pago del equipo
        const [resultEquipo] = await pool.execute(`
            UPDATE torneo_saga_equipo 
            SET pagado = ?
            WHERE torneo_id = ? AND id = ?
        `, [pagado, torneoId, equipoId]);


        if (resultEquipo.affectedRows === 0) {
            return res.status(404).json(errorResponse('Equipo no encontrado'));
        }

        const pagadoNumerico = (pagado === 'pagado') ? 1 : 0;

       const [resultJugadores] = await pool.execute(`
            UPDATE jugador_torneo_saga 
            SET pagado = ?
            WHERE torneo_id = ? AND equipo_id = ?
        `, [pagadoNumerico, torneoId, equipoId]);

        res.json(successResponse(
            `Estado de pago actualizado a: ${pagado}. Equipo y ${resultJugadores.affectedRows} jugador(es) actualizados.`
        ));
        
    } catch (error) {
        console.error('Error al actualizar pago del equipo:', error);
        res.status(500).json(errorResponse('Error al actualizar estado de pago'));
    }
});

//======ACTUALIZAR EL PAGO INSCRIPCION (solo organizadores)=====

router.patch('/:torneoId/jugadores/:jugadorId/pago', verificarToken, async (req, res) => {
    try {
        const { torneoId, jugadorId } = req.params;
        const { pagado } = req.body; // 'pagado' o 'pendiente'

        // Validar valor
        if (!['pendiente', 'pagado'].includes(pagado)) {
            return res.status(400).json(errorResponse('Valor de pago inválido. Debe ser "pendiente" o "pagado"'));
        }

        // Verificar que el usuario es organizador del torneo (opcional)
        const [torneo] = await pool.execute(
             'SELECT created_by FROM torneos_sistemas WHERE id = ?',
             [torneoId]
         );
         if (torneo[0].created_by !== req.userId) {
             return res.status(403).json(errorResponse('No tienes permisos'));
         }

         const pagadoNumerico = pagado === 'pagado' ? 1 : 0;

        // Actualizar estado de pago
        const [result] = await pool.execute(`
            UPDATE jugador_torneo_saga 
            SET pagado = ?
            WHERE torneo_id = ? AND id = ?
        `, [pagadoNumerico, torneoId, jugadorId]);

        if (result.affectedRows === 0) {
            return res.status(404).json(errorResponse('Inscripción no encontrada'));
        }

        res.json(successResponse(`Estado de pago actualizado a: ${pagado}`));

    } catch (error) {
        console.error('Error al actualizar pago:', error);
        res.status(500).json(errorResponse('Error al actualizar estado de pago'));
    }
});

// ====== VERIFICAR SI TODOS LOS PARTICIPANTES HAN PAGADOS ======

router.get('/:torneoId/verificarPagos', verificarToken, async (req, res) => {
    try {
        const { torneoId } = req.params;

        // Obtener tipo de torneo
        const [torneo] = await pool.execute(
            'SELECT tipo_torneo FROM torneos_sistemas WHERE id = ?',
            [torneoId]
        );

        if (!torneo.length) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }

        const tipoTorneo = torneo[0].tipo_torneo;

        if (tipoTorneo === 'Por equipos') {
            // Verificar equipos
            const [equipos] = await pool.execute(
                'SELECT COUNT(*) as total, SUM(CASE WHEN pagado = "pagado" THEN 1 ELSE 0 END) as pagados FROM torneo_saga_equipo WHERE torneo_id = ?',
                [torneoId]
            );

            const total = Number(equipos[0].total);
            const pagados = Number(equipos[0].pagados);
            const pendientes = total - pagados;
            const todosPagados = total > 0 && total === pagados;

            return res.json(successResponse({
                todosPagados,
                total,
                pagados,
                pendientes
            }));

        } else {
            // Verificar jugadores individuales
            const [jugadores] = await pool.execute(
                'SELECT COUNT(*) as total, SUM(CASE WHEN pagado = 1 THEN 1 ELSE 0 END) as pagados FROM jugador_torneo_saga WHERE torneo_id = ?',
                [torneoId]
            );

            const total = Number(jugadores[0].total);
            const pagados = Number(jugadores[0].pagados);
            const pendientes = total - pagados;
            const todosPagados = total > 0 && total === pagados;


            return res.json(successResponse({
                todosPagados,
                total,
                pagados,
                pendientes
            }));
        }

    } catch (error) {
        console.error('Error al verificar pagos:', error);
        res.status(500).json(errorResponse('Error al verificar pagos'));
    }
});

// =====ELIMINAR TORNEO======

router.delete('/:torneoId/eliminarTorneo', verificarToken, async (req, res) => {
  
  try {
    const { torneoId } = req.params;
    
    const [torneoExistente] = await pool.execute(
      'SELECT created_by, nombre_torneo FROM torneos_sistemas WHERE id = ?',
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
    
    await pool.execute('DELETE FROM torneos_sistemas WHERE id = ?', [torneoId]);
    
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

// =====ELIMINAR JUGADOR TORNEO=====

router.delete('/:torneoId/jugadores/:jugadorId', verificarToken, async (req, res) => {
  try {
    const { torneoId, jugadorId } = req.params;

    const [torneoExistente] = await pool.execute(
      'SELECT created_by, nombre_torneo FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneoExistente.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }
    
    // Permitir si es el creador del torneo O si es el propio jugador eliminándose a sí mismo
    const esCreador = torneoExistente[0].created_by === req.userId;
    const esPropio = parseInt(jugadorId) === parseInt(req.userId);
    
    if (!esCreador && !esPropio) {
      return res.status(403).json(
        errorResponse('No tienes permiso para eliminar esta inscripción')
      );
    }
    
    const [participante] = await pool.execute(
      `SELECT jts.id, u.nombre, u.apellidos 
       FROM jugador_torneo_saga jts
       INNER JOIN usuarios u ON jts.jugador_id = u.id
       WHERE jts.torneo_id = ? AND jts.jugador_id = ?`,
      [torneoId, jugadorId]
    );

      console.log('🔍 Participante encontrado:', participante);
    
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
        errorResponse(`No se puede eliminar ${esPropio ? 'tu inscripción' : `a ${nombreJugador}`} porque ya ${esPropio ? 'tienes' : 'tiene'} ${partidas[0].total} partida(s) registrada(s) en este torneo`)
      );
    }
    
    await pool.execute(
      'DELETE FROM jugador_torneo_saga WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, jugadorId]
    );
    
    res.json(
      successResponse(
        esPropio 
          ? `Tu inscripción ha sido eliminada del torneo "${torneoExistente[0].nombre_torneo}"` 
          : `${nombreJugador} ha sido eliminado del torneo "${torneoExistente[0].nombre_torneo}"`,
        {
          torneoId,
          jugadorId,
          nombreJugador
        }
      )
    );
    
  } catch (error) {
    console.error('❌ Error al eliminar jugador del torneo:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// =====ELIMINAR INSCRIPCIÓN DE EQUIPO=====

router.delete('/:torneoId/equipo/:equipoId', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId, equipoId } = req.params;
    const userId = req.usuario.userId
    
    await connection.beginTransaction();

    // Verificar que el equipo existe
    const [equipos] = await connection.execute(
      'SELECT id, capitan_id FROM torneo_saga_equipo WHERE id = ? AND torneo_id = ?',
      [equipoId, torneoId]
    );

    if (equipos.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('No tienes un equipo inscrito en el torneo'));
    }

    const equipo = equipos[0]

    const [torneos] = await connection.execute(
      'SELECT created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    )

    const esOrganizador = torneos.length > 0 && torneos[0].created_by === userId
    const esCapitan = equipo.capitan_id === userId

    if(!esCapitan && !esOrganizador) {
      await connection.rollback()
      return res.status(403).json(errorResponse('Solo el capitan o el organizador puede eliminar la inscripción del equipo'))
    }

    const [miembros] = await connection.execute(
      'SELECT jugador_eq_id FROM equipo_miembros WHERE equipo_id = ?',
      [equipoId]
    );

     if (miembros.length > 0) {
      for (const miembro of miembros) {
        await connection.execute(
          'DELETE FROM jugador_torneo_saga WHERE id = ?',
          [miembro.jugador_eq_id]
        );
      }}

    // Eliminar miembros del equipo
    await connection.execute(
      'DELETE FROM equipo_miembros WHERE equipo_id = ?',
      [equipoId]
    );

    // Eliminar equipo
    await connection.execute(
      'DELETE FROM torneo_saga_equipo WHERE id = ?',
      [equipoId]
    );

    await connection.commit();
    res.json(successResponse('Equipo eliminado exitosamente'));

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al eliminar equipo:', error);
    res.status(500).json(errorResponse('Error al eliminar equipo'));
  } finally {
    connection.release();
  }
});


 //====================================================
  //METODOS PARA ACCEDER A JUGADORES DE LOS TORNEOS SAGA
//====================================================

// =======OBTENER JUGADORES DE UN TORNEO=======

router.get('/:torneoId/jugadores', async (req, res) => {
    try {
        const { torneoId } = req.params;
        
        const [jugadores] = await pool.execute(`
            SELECT 
                jts.id,
                jts.jugador_id,
                jts.equipo_id,
                u.nombre as jugador_nombre,
                u.apellidos as jugador_apellidos,
                u.nombre_alias,
                u.club,
                u.localidad,
                u.pais,
                jts.epoca,
                jts.faccion,
                jts.composicion_ejercito,
                jts.pagado,
                jts.puntos_victoria,
                jts.puntos_torneo,
                jts.puntos_masacre,
                jts.warlord_muerto,
                jts.created_at as fecha_inscripcion
            FROM jugador_torneo_saga jts
            INNER JOIN usuarios u ON jts.jugador_id = u.id
            LEFT JOIN torneo_saga_equipo e ON jts.equipo_id = e.id
            WHERE jts.torneo_id = ?
            ORDER BY jts.puntos_torneo DESC, jts.created_at ASC
        `, [torneoId]);
        
        res.json(successResponse('Jugadores obtenidos', jugadores));
        
    } catch (error) {
        console.error('Error al obtener jugadores:', error);
        res.status(500).json(errorResponse('Error al obtener jugadores'));
    }
});

// ===== OBTENER EQUIPOS DE UN TORNEO =====

router.get('/:torneoId/equipos', async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    console.log(`📖 GET /${torneoId}/equipos`);
    
    const [equipos] = await pool.execute(`
      SELECT 
        e.id,
        e.nombre_equipo,
        e.capitan_id,
        e.pagado,
        u.nombre as capitan_nombre,
        u.apellidos as capitan_apellidos
      FROM torneo_saga_equipo e
      INNER JOIN usuarios u ON e.capitan_id = u.id
      WHERE e.torneo_id = ?
    `, [torneoId]);
    
    // Obtener miembros de cada equipo con su composición
    for (let equipo of equipos) {
      const [miembros] = await pool.execute(`
        SELECT 
          j.epoca,
          j.faccion as banda,
          j.composicion_ejercito,
          u.nombre,
          u.apellidos,
          CASE WHEN e.capitan_id = j.jugador_id THEN 1 ELSE 0 END as es_capitan
        FROM jugador_torneo_saga j
        INNER JOIN usuarios u ON j.jugador_id = u.id
        INNER JOIN torneo_saga_equipo e ON j.equipo_id = e.id
        WHERE j.equipo_id = ?
        ORDER BY (e.capitan_id = j.jugador_id) DESC, u.nombre
      `, [equipo.id]);
      
      equipo.miembros = miembros.map(m => {
        // Parsear composición del ejército
        let composicion = {};
        if (m.composicion_ejercito) {
          try {
            composicion = JSON.parse(m.composicion_ejercito);
          } catch (e) {
            console.error('Error al parsear composición:', e);
            composicion = {};
          }
        }

        return {
          nombre: `${m.nombre} ${m.apellidos}`,
          epoca: m.epoca,
          banda: m.banda,
          es_capitan: Boolean(m.es_capitan),
          composicion: composicion
        };
      });
    }
    
    console.log(`✅ ${equipos.length} equipos encontrados`);
    
    res.json(successResponse('Equipos obtenidos', equipos));
    
  } catch (error) {
    console.error('❌ Error al obtener equipos:', error);
    res.status(500).json(errorResponse('Error al obtener equipos'));
  }
});

// =====CAMBIAR ESTADO DEL TORNEO=====

router.put('/:torneoId/estado', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    const { estado } = req.body;
    const userId = req.usuario.userId;
    
    // Validar que se envió el estado
    if (!estado) {
      return res.status(400).json(errorResponse('El estado es requerido'));
    }
    
    // Validar estados permitidos
    const estadosPermitidos = ['pendiente', 'en_curso', 'finalizado'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json(
        errorResponse(`Estado no válido. Debe ser: ${estadosPermitidos.join(', ')}`)
      );
    }
    
    await connection.beginTransaction();
    
    // Verificar que el torneo existe y que el usuario es el creador
    const [torneo] = await connection.execute(
      'SELECT id, created_by, estado, nombre_torneo FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneo.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    // Verificar que el usuario es el creador del torneo
    if (torneo[0].created_by !== userId) {
      await connection.rollback();
      return res.status(403).json(
        errorResponse('No tienes permiso para cambiar el estado de este torneo')
      );
    }
    
    const estadoActual = torneo[0].estado;
    
    // Validaciones de transiciones de estado
    if (estadoActual === 'cancelado') {
      await connection.rollback();
      return res.status(400).json(
        errorResponse('No se puede cambiar el estado de un torneo cancelado')
      );
    }
    
    if (estadoActual === 'finalizado' && estado !== 'finalizado') {
      await connection.rollback();
      return res.status(400).json(
        errorResponse('No se puede cambiar el estado de un torneo finalizado')
      );
    }
    
    // Actualizar el estado
    await connection.execute(
      'UPDATE torneos_sistemas SET estado = ?  WHERE id = ?',
      [estado, torneoId]
    );
    
    await connection.commit();
    
    console.log(`✅ Estado del torneo ${torneoId} cambiado de "${estadoActual}" a "${estado}"`);
    
    res.json(
      successResponse(`Estado del torneo actualizado a "${estado}"`, {
        id: parseInt(torneoId),
        nombre_torneo: torneo[0].nombre_torneo,
        estado_anterior: estadoActual,
        estado_nuevo: estado
      })
    );
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al cambiar estado del torneo:', error);
    res.status(500).json(errorResponse('Error al cambiar el estado del torneo'));
  } finally {
    connection.release();
  }
});

  // ==========================================
  // MÉTODOS DE PARTIDAS
  // ==========================================

// =======OBTENER PARTIDAS DE UN TORNEO=========

router.get('/:torneoId/partidasTorneoSaga', async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    let whereClause = 'WHERE ps.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND ps.ronda = ?';
      params.push(ronda);
    }
    
    const [partidas] = await pool.execute(`
      SELECT 
        ps.*,
        ps.nombre_partida,

        -- Jugador 1
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
        jt1.faccion as jugador1_faccion,
        jt1.epoca as jugador1_epoca,
        eq1.nombre_equipo as jugador1_equipo_nombre,
        eq1.id as jugador1_equipo_id,
        
        -- Jugador 2
        CASE 
          WHEN ps.es_bye = TRUE THEN NULL
          ELSE u2.nombre
        END as jugador2_nombre,
        CASE 
          WHEN ps.es_bye = TRUE THEN NULL
          ELSE u2.apellidos
        END as jugador2_apellidos,
        CASE 
          WHEN ps.es_bye = TRUE THEN NULL
          ELSE u2.nombre_alias
        END as jugador2_alias,
        CASE 
          WHEN ps.es_bye = TRUE THEN NULL
          ELSE jt2.faccion
        END as jugador2_faccion,
        CASE 
          WHEN ps.es_bye = TRUE THEN NULL
          ELSE jt2.epoca
        END as jugador2_epoca,
        CASE 
          WHEN ps.es_bye = TRUE THEN NULL
          ELSE eq2.nombre_equipo
        END as jugador2_equipo_nombre,
        CASE 
          WHEN ps.es_bye = TRUE THEN NULL
          ELSE eq2.id
        END as jugador2_equipo_id
        
      FROM partidas_saga ps
      
      -- JOIN Jugador 1
      LEFT JOIN usuarios u1 ON ps.jugador1_id = u1.id
      LEFT JOIN jugador_torneo_saga jt1 ON (jt1.jugador_id = ps.jugador1_id AND jt1.torneo_id = ps.torneo_id)
      LEFT JOIN torneo_saga_equipo eq1 ON ps.equipo1_id = eq1.id
      
      -- JOIN Jugador 2
      LEFT JOIN usuarios u2 ON ps.jugador2_id = u2.id AND ps.es_bye = FALSE
      LEFT JOIN jugador_torneo_saga jt2 ON (jt2.jugador_id = ps.jugador2_id AND jt2.torneo_id = ps.torneo_id)
      LEFT JOIN torneo_saga_equipo eq2 ON ps.equipo2_id = eq2.id
      
      ${whereClause}
      ORDER BY ps.mesa, ps.id
    `, params);

    console.log(`📊 Partidas obtenidas: ${partidas.length}`);
    
    // Formatear con objetos anidados para jugador1 y jugador2
    const partidasFormateadas = partidas.map(p => ({
      ...p,
      jugador1: {
        nombre_alias: p.jugador1_alias || null, 
        equipo_nombre: p.jugador1_equipo_nombre || null,
        equipo_id: p.jugador1_equipo_id || null,
        faccion: p.jugador1_faccion || null,
        epoca: p.jugador1_epoca || null
      },
      jugador2: p.jugador2_id ? {
        nombre_alias: p.jugador2_alias || null, 
        equipo_nombre: p.jugador2_equipo_nombre || null,
        equipo_id: p.jugador2_equipo_id || null,
        faccion: p.jugador2_faccion || null,
        epoca: p.jugador2_epoca || null
      } : null
    }));
    
    res.json(partidasFormateadas);
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======OBTENER PARTIDA ESPECÍFICA=======

router.get('/:torneoId/partidasTorneoSaga/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    const [partidas] = await pool.execute(`
      SELECT 
        ps.*,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
        u2.nombre as jugador2_nombre,
        u2.apellidos as jugador2_apellidos,
        u2.nombre_alias as jugador2_alias,
        p1.faccion as jugador1_faccion,
        p2.faccion as jugador2_faccion,
        ps.ronda,
        ts.nombre_torneo
      FROM partidas_saga ps
      JOIN usuarios u1 ON ps.jugador1_id = u1.id
      JOIN usuarios u2 ON ps.jugador2_id = u2.id
      JOIN torneos_sistemas ts ON ps.torneo_id = ts.id
      LEFT JOIN jugador_torneo_saga p1 ON (ps.torneo_id = p1.torneo_id AND ps.jugador1_id = p1.jugador_id)
      LEFT JOIN jugador_torneo_saga p2 ON (ps.torneo_id = p2.torneo_id AND ps.jugador2_id = p2.jugador_id)
      WHERE ps.id = ?
    `, [partidaId]);
    
    if (partidas.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }
    
    res.json(
      successResponse('Partida obtenida exitosamente', {
        partida: partidas[0]
      })
    );
    
  } catch (error) {
    console.error('Error al obtener partida:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ====== REGISTRAR PARTIDA========

router.put('/:torneoId/partidasTorneoSaga/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId, torneoId } = req.params;
    const { 
      puntos_partida_j1,
      puntos_partida_j2,
      puntos_masacre_j1,
      puntos_masacre_j2,
      warlord_muerto_j1,
      warlord_muerto_j2,
      primer_jugador
    } = req.body;
    
    // Validar campos requeridos
    const camposFaltantes = validarCamposRequeridos(req.body, [
      'puntos_partida_j1',
      'puntos_partida_j2',
      'puntos_masacre_j1',
      'puntos_masacre_j2'
    ]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      );
    }
    
    // Verificar que la partida existe
    const [partida] = await pool.execute(`
      SELECT 
        ps.id,
        ps.jugador1_id, 
        ps.jugador2_id, 
        ps.resultado_ps, 
        ps.torneo_id, 
        ps.ronda, 
        ps.resultado_confirmado,
        t.tipo_torneo
        FROM partidas_saga ps
      INNER JOIN torneos_sistemas t ON ps.torneo_id = t.id
      WHERE ps.id = ? AND torneo_id = ?
    `, [partidaId, torneoId]);
    
    if (partida.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }
    
    // ✅ Extraer los IDs de jugadores
    const jugador1_id = partida[0].jugador1_id;
    const jugador2_id = partida[0].jugador2_id;
    const tipoTorneo = partida[0].tipo_torneo
    
    // ✅ Verificar que no sea una partida BYE
    if (!jugador2_id || partida[0].resultado_ps === 'victoria_j1') {
      return res.status(400).json(
        errorResponse('No se puede actualizar una partida BYE. La victoria automática ya está registrada.')
      );
    }

    // Verificar que el resultado no esté confirmado
    if (partida[0].resultado_confirmado) {
      return res.status(400).json(
        errorResponse('No se puede actualizar una partida con resultado confirmado. El organizador debe desconfirmar el resultado primero.')
      );
    }
    
    // Validar que primer_jugador sea uno de los dos jugadores
    if (primer_jugador && primer_jugador !== jugador1_id && primer_jugador !== jugador2_id) {
      return res.status(400).json(
        errorResponse('El primer jugador debe ser uno de los dos jugadores de la partida')
      );
    }

    // Calcular resultado basado en puntos de victoria
    const puntosPartidaJ1 = parseInt(puntos_partida_j1) || 0;
    const puntosPartidaJ2 = parseInt(puntos_partida_j2) || 0;

    let puntosVictoriaJ1, puntosVictoriaJ2, resultado;
    
    if (puntosPartidaJ1 > puntosPartidaJ2) {
      puntosVictoriaJ1 = 3;
      puntosVictoriaJ2 = 0;
      resultado = 'victoria_j1';
    } else if (puntosPartidaJ2 > puntosPartidaJ1) {
      puntosVictoriaJ1 = 0;
      puntosVictoriaJ2 = 3;
      resultado = 'victoria_j2';
    } else {
      puntosVictoriaJ1 = 1;
      puntosVictoriaJ2 = 1;
      resultado = 'empate';
    }

    const puntosMasacreJ1 = parseInt(puntos_masacre_j1) || 0;
    const puntosMasacreJ2 = parseInt(puntos_masacre_j2) || 0;
    
    // Determinar quién fue el primer jugador
    const primerJugadorId = primer_jugador || null;

    let puntosTorneoJ1, puntosTorneoJ2
    
    if (tipoTorneo === 'Por equipos'){
      puntosTorneoJ1 = puntosPartidaJ1
      puntosTorneoJ2 = puntosPartidaJ2

    } else {
      
      const puntosTorneo = calcularPuntosTorneo(
        puntosPartidaJ1, 
        puntosPartidaJ2, 
        jugador1_id, 
        primerJugadorId
      )

      puntosTorneoJ1 = puntosTorneo.j1
      puntosTorneoJ2 = puntosTorneo.j2

    }
    
    // ✅ Actualizar la partida con la sintaxis SQL correcta
    await pool.execute(`
      UPDATE partidas_saga SET
        puntos_victoria_j1 = ?, 
        puntos_victoria_j2 = ?,
        puntos_torneo_j1 = ?, 
        puntos_torneo_j2 = ?,
        puntos_masacre_j1 = ?, 
        puntos_masacre_j2 = ?,
        warlord_muerto_j1 = ?, 
        warlord_muerto_j2 = ?,
        resultado_ps = ?, 
        primer_jugador = ?,
        resultado_confirmado = FALSE
      WHERE id = ?
    `, [
      puntosVictoriaJ1, 
      puntosVictoriaJ2,
      puntosTorneoJ1,
      puntosTorneoJ2,
      puntosMasacreJ1, 
      puntosMasacreJ2,
      warlord_muerto_j1 || false, 
      warlord_muerto_j2 || false,
      resultado, 
      primerJugadorId,
      partidaId
    ]);
    
    res.status(200).json(
      successResponse('Partida registrada exitosamente (pendiente de confirmación)', {
        partidaId,
        resultado,
        puntosTorneo: {
          jugador1: puntosTorneoJ1,
          jugador2: puntosTorneoJ2
        },
        puntosVictoria: {
          jugador1: puntosVictoriaJ1,
          jugador2: puntosVictoriaJ2
        },
        puntosMasacre: {
          jugador1: puntosMasacreJ1,
          jugador2: puntosMasacreJ2
        }
      })
    );
    
  } catch (error) {
    console.error('Error al registrar partida:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ====== CONFIRMAR RESULTADO  INDIVIDUAL POR ORGANIZADOR ========

router.patch('/:torneoId/partidasTorneoSaga/:partidaId/confirmar', verificarToken, async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const { torneoId, partidaId } = req.params;
    const { confirmar } = req.body;
    
    await connection.beginTransaction();
    
    // Verificar organizador y obtener partida
    const [verificacion] = await connection.execute(
      `SELECT 
        t.created_by,
        p.id, 
        p.jugador1_id, 
        p.jugador2_id,
        p.puntos_victoria_j1, 
        p.puntos_victoria_j2,
        p.puntos_torneo_j1, 
        p.puntos_torneo_j2,
        p.puntos_masacre_j1, 
        p.puntos_masacre_j2,
        p.warlord_muerto_j1, 
        p.warlord_muerto_j2,
        p.resultado_confirmado,
        p.resultado_ps,
        p.es_bye
      FROM torneos_sistemas t
      INNER JOIN partidas_saga p ON p.torneo_id = t.id
      WHERE t.id = ? AND p.id = ?`,
      [torneoId, partidaId]
    );
    
    if (verificacion.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json(errorResponse('Torneo o partida no encontrado'));
    }
    
    const partidaData = verificacion[0];
    
    if (partidaData.created_by !== req.userId) {
      await connection.rollback();
      connection.release();
      return res.status(403).json(errorResponse('Solo el organizador puede confirmar resultados'));
    }
    
    const esBye = !partidaData.jugador2_id || partidaData.es_bye;
    
    if (confirmar && partidaData.resultado_confirmado) {
      await connection.rollback();
      connection.release();
      return res.status(400).json(errorResponse('Esta partida ya está confirmada'));
    }
    
    if (!confirmar && !partidaData.resultado_confirmado) {
      await connection.rollback();
      connection.release();
      return res.status(400).json(errorResponse('Esta partida no está confirmada'));
    }

    let j1Gana = 0, j1Empata = 0, j1Pierde = 0;
    let j2Gana = 0, j2Empata = 0, j2Pierde = 0;

    if (esBye) {
      j1Gana = 1;
    } else {
      switch (partidaData.resultado_ps) {
        case 'victoria_j1':
          j1Gana = 1;
          j2Pierde = 1;
          break;
        case 'victoria_j2':
          j1Pierde = 1;
          j2Gana = 1;
          break;
        case 'empate':
          j1Empata = 1;
          j2Empata = 1;
          break;
      }
    }
    
    if (confirmar) {
      // Actualizar jugador_torneo_saga J1
      await connection.execute(`
        UPDATE jugador_torneo_saga 
        SET puntos_victoria = puntos_victoria + ?,
            puntos_torneo = puntos_torneo + ?,
            puntos_masacre = puntos_masacre + ?,
            warlord_muerto = warlord_muerto + ?
        WHERE jugador_id = ? AND torneo_id = ?
      `, [
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_torneo_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.warlord_muerto_j1 ? 1 : 0,
        partidaData.jugador1_id,
        torneoId
      ]);
      
      await connection.execute(`
        INSERT INTO clasificacion_jugadores_saga (
            torneo_id, jugador_id, partidas_jugadas, partidas_ganadas, 
            partidas_empatadas, partidas_perdidas, puntos_victoria_totales, 
            puntos_torneo_totales, puntos_masacre_totales, warlord_muerto_totales
          )
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          partidas_jugadas = partidas_jugadas + 1,
          partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
          partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
          partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
          puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
          puntos_torneo_totales = puntos_torneo_totales + VALUES(puntos_torneo_totales),
          puntos_masacre_totales = puntos_masacre_totales + VALUES(puntos_masacre_totales),
          warlord_muerto_totales = warlord_muerto_totales + VALUES(warlord_muerto_totales)
      `, [
        torneoId, partidaData.jugador1_id, j1Gana, j1Empata, j1Pierde,
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_torneo_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.warlord_muerto_j1 ? 1 : 0        
      ]);
      
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_saga 
          SET puntos_victoria = puntos_victoria + ?,
              puntos_torneo = puntos_torneo + ?,
              puntos_masacre = puntos_masacre + ?,
              warlord_muerto = warlord_muerto + ?
          WHERE jugador_id = ? AND torneo_id = ?
        `, [
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_torneo_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.warlord_muerto_j2 ? 1 : 0,
          partidaData.jugador2_id,
          torneoId
        ]);

        await connection.execute(`
          INSERT INTO clasificacion_jugadores_saga (
             torneo_id, jugador_id, partidas_jugadas, partidas_ganadas, 
             partidas_empatadas, partidas_perdidas, puntos_victoria_totales, 
             puntos_torneo_totales, puntos_masacre_totales, warlord_muerto_totales
          )
          VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            partidas_jugadas = partidas_jugadas + 1,
            partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
            partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
            partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
            puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
            puntos_torneo_totales = puntos_torneo_totales + VALUES(puntos_torneo_totales),
            puntos_masacre_totales = puntos_masacre_totales + VALUES(puntos_masacre_totales),
            warlord_muerto_totales = warlord_muerto_totales + VALUES(warlord_muerto_totales)
        `, [
          torneoId, partidaData.jugador2_id, j2Gana, j2Empata, j2Pierde,
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_torneo_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.warlord_muerto_j2 ? 1 : 0
        ]);
      }
      
    } else {
      // DESCONFIRMAR
      await connection.execute(`
        UPDATE jugador_torneo_saga 
        SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
            puntos_torneo = GREATEST(0, puntos_torneo - ?),
            puntos_masacre = GREATEST(0, puntos_masacre - ?),
            warlord_muerto = GREATEST(0, warlord_muerto - ?)
        WHERE jugador_id = ? AND torneo_id = ?
      `, [
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_torneo_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.warlord_muerto_j1 ? 1 : 0,
        partidaData.jugador1_id,
        torneoId
      ]);
      
      await connection.execute(`
        UPDATE clasificacion_jugadores_saga 
        SET 
          partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
          partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
          partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
          partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
          puntos_victoria_totales = GREATEST(0, puntos_victoria_totales - ?),
          puntos_torneo_totales = GREATEST(0, puntos_torneo_totales - ?),
          puntos_masacre_totales = GREATEST(0, puntos_masacre_totales - ?),
          warlord_muerto_totales = GREATEST(0, warlord_muerto_totales - ?)
        WHERE torneo_id = ? AND jugador_id = ?
      `, [
        j1Gana, j1Empata, j1Pierde,
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_torneo_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.warlord_muerto_j1 ? 1 : 0,
        torneoId,
        partidaData.jugador1_id
      ]);
      
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_saga 
          SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
              puntos_torneo = GREATEST(0, puntos_torneo - ?),
              puntos_masacre = GREATEST(0, puntos_masacre - ?),
              warlord_muerto = GREATEST(0, warlord_muerto - ?)
          WHERE jugador_id = ? AND torneo_id = ?
        `, [
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_torneo_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.warlord_muerto_j2 ? 1 : 0,
          partidaData.jugador2_id,
          torneoId
        ]);
        
        await connection.execute(`
          UPDATE clasificacion_jugadores_saga 
          SET 
            partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
            partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
            partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
            partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
            puntos_victoria_totales = GREATEST(0, puntos_victoria_totales - ?),
            puntos_torneo_totales = GREATEST(0, puntos_torneo_totales - ?),
            puntos_masacre_totales = GREATEST(0, puntos_masacre_totales - ?),
            warlord_muerto_totales = GREATEST(0, warlord_muerto_totales - ?)
          WHERE torneo_id = ? AND jugador_id = ?
        `, [    
          j2Gana, j2Empata, j2Pierde,
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_torneo_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.warlord_muerto_j2 ? 1 : 0,
          torneoId,
          partidaData.jugador2_id
        ]);
      }
    }
   
    await connection.execute(
      'UPDATE partidas_saga SET resultado_confirmado = ? WHERE id = ?',
      [confirmar, partidaId]
    );
    
    await connection.commit();
    connection.release();
    
    res.json(
      successResponse(
        confirmar 
          ? `✅ Resultado confirmado correctamente${esBye ? ' (BYE)' : ''}`
          : `⚠️ Resultado desconfirmado correctamente${esBye ? ' (BYE)' : ''}`, 
        { partidaId, confirmado: confirmar, esBye }
      )
    );
    
  } catch (error) {
    console.error('❌ Error al confirmar resultado:', error);
    
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError.message);
      }
      
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error al liberar conexión:', releaseError.message);
      }
    }
    
    res.status(500).json(errorResponse('Error al confirmar resultado'));
  }
});;

// ====== CONFIRMAR RESULTADO EN TORNEOS POR EQUIPOS ========

router.patch('/:torneoId/partidasTorneoSaga/:partidaId/confirmarEquipo', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId, partidaId } = req.params;
    const { confirmar } = req.body; // true para confirmar, false para desconfirmar
    
    await connection.beginTransaction();
    
    // Verificar que el usuario es el organizador
    const [torneo] = await connection.execute(
      'SELECT created_by, tipo_torneo FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneo.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    if (torneo[0].created_by !== req.userId) {
      await connection.rollback();
      return res.status(403).json(errorResponse('Solo el organizador puede confirmar resultados'));
    }

    if (torneo[0].tipo_torneo !== 'Por equipos') {
      await connection.rollback();
      return res.status(400).json(errorResponse('Este endpoint es solo para torneos por equipos'));
    }
    
    // Obtener datos completos de la partida
    const [partida] = await connection.execute(
      `SELECT 
        id, 
        jugador1_id, 
        jugador2_id,
        equipo1_id,
        equipo2_id,
        puntos_victoria_j1, 
        puntos_victoria_j2,
        puntos_torneo_j1, 
        puntos_torneo_j2,
        puntos_masacre_j1, 
        puntos_masacre_j2,
        warlord_muerto_j1, 
        warlord_muerto_j2,
        resultado_confirmado,
        resultado_ps,
        es_bye
       FROM partidas_saga 
       WHERE id = ? AND torneo_id = ?`,
      [partidaId, torneoId]
    );
    
    if (partida.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('Partida no encontrada'));
    }
    
    const partidaData = partida[0];
    const esBye = !partidaData.jugador2_id || partidaData.es_bye;
    
    // Evitar doble confirmación/desconfirmación
    if (confirmar && partidaData.resultado_confirmado) {
      await connection.rollback();
      return res.status(400).json(errorResponse('Esta partida ya está confirmada'));
    }
    
    if (!confirmar && !partidaData.resultado_confirmado) {
      await connection.rollback();
      return res.status(400).json(errorResponse('Esta partida no está confirmada'));
    }

      const puntosVictoriaJ1 = (partidaData.puntos_victoria_j1 || 0) + (partidaData.warlord_muerto_j1 ? 1 : 0)
      const puntosVictoriaJ2 = (partidaData.puntos_victoria_j2 || 0) + (partidaData.warlord_muerto_j2 ? 1 : 0)
    
      let j1Gana = 0, j1Empata = 0, j1Pierde = 0
      let j2Gana = 0, j2Empata = 0, j2Pierde = 0

      if (esBye){
        j1Gana = 1
      } else {

        switch (partidaData.resultado_ps){
          case 'victoria_j1':
            j1Gana = 1;
            j2Pierde = 1;
            break;
          case 'victoria_j2':
            j1Pierde = 1;
            j2Gana = 1;
            break;
          case 'empate' :
            j1Empata = 1;
            j2Empata = 1;
            break;
        }
      }

      if (confirmar) {
     //ACTUALIZAR jugador_torneo_saga (Jugador 1)
      await connection.execute(`
        UPDATE jugador_torneo_saga 
        SET puntos_victoria = puntos_victoria + ?,
            puntos_torneo = puntos_torneo + ?,
            puntos_masacre = puntos_masacre + ?,
            warlord_muerto = warlord_muerto + ?
        WHERE jugador_id = ? AND torneo_id = ?
      `, [
        puntosVictoriaJ1,
        partidaData.puntos_torneo_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.warlord_muerto_j1 ? 1 : 0,
        partidaData.jugador1_id,
        torneoId
      ]);
      
      // 2️⃣ ACTUALIZAR JUGADOR 1 INDIVIDUAL
      await connection.execute(`
        INSERT INTO clasificacion_jugadores_saga (
            torneo_id, 
            jugador_id, 
            equipo_id, 
            partidas_jugadas, 
            partidas_ganadas, 
            partidas_empatadas, 
            partidas_perdidas, 
            puntos_victoria_totales, 
            puntos_torneo_totales, 
            puntos_masacre_totales, 
            warlord_muerto_totales
          )
        VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          partidas_jugadas = partidas_jugadas + 1,
          partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
          partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
          partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
          puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
          puntos_torneo_totales = puntos_torneo_totales + VALUES(puntos_torneo_totales),
          puntos_masacre_totales = puntos_masacre_totales + VALUES(puntos_masacre_totales),
          warlord_muerto_totales = warlord_muerto_totales + VALUES(warlord_muerto_totales)
      `, [
        torneoId,
        partidaData.jugador1_id,
        partidaData.equipo1_id,
        j1Gana,
        j1Empata,
        j1Pierde,
        puntosVictoriaJ1,
        partidaData.puntos_torneo_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.warlord_muerto_j1 ? 1 : 0        
      ]);

      if (partidaData.equipo1_id) {
        //ACTUALIZAR JUGADOR 1 EQUIPOS
        await connection.execute(`
          INSERT INTO clasificacion_equipos_saga (
              torneo_id, 
              equipo_id, 
              partidas_jugadas, 
              partidas_ganadas, 
              partidas_empatadas, 
              partidas_perdidas, 
              puntos_victoria_eq_totales, 
              puntos_torneo_eq_totales, 
             puntos_masacre_eq_totales, 
             warlord_muerto
            )
          VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            partidas_jugadas = partidas_jugadas + 1,
            partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
            partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
            partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
            puntos_victoria_eq_totales = puntos_victoria_eq_totales + VALUES(puntos_victoria_eq_totales),
            puntos_torneo_eq_totales = puntos_torneo_eq_totales + VALUES(puntos_torneo_eq_totales),
            puntos_masacre_eq_totales = puntos_masacre_eq_totales + VALUES(puntos_masacre_eq_totales),
            warlord_muerto = warlord_muerto + VALUES(warlord_muerto)
        `, [
          torneoId,
          partidaData.equipo1_id,
          j1Gana,
          j1Empata,
          j1Pierde,
          puntosVictoriaJ1,
          partidaData.puntos_torneo_j1 || 0,
          partidaData.puntos_masacre_j1 || 0,
          partidaData.warlord_muerto_j1 ? 1 : 0
         
        ]);
      }
      
      // ACTUALIZAR JUGADOR 2 SI NO E BYE
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_saga 
          SET puntos_victoria = puntos_victoria + ?,
              puntos_torneo = puntos_torneo + ?,
              puntos_masacre = puntos_masacre + ?,
              warlord_muerto = warlord_muerto + ?
          WHERE jugador_id = ? AND torneo_id = ?
        `, [
          puntosVictoriaJ2,
          partidaData.puntos_torneo_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.warlord_muerto_j2 ? 1 : 0,
          partidaData.jugador2_id,
          torneoId
        ]);

        // ACTUALIZAR clasificacion_jugadores_saga JUGADOR 2
        await connection.execute(`
          INSERT INTO clasificacion_jugadores_saga (
              torneo_id,
              jugador_id,
              equipo_id, 
              partidas_jugadas, 
              partidas_ganadas, 
              partidas_empatadas, 
              partidas_perdidas, 
              puntos_victoria_totales, 
              puntos_torneo_totales, 
              puntos_masacre_totales, 
              warlord_muerto_totales
            )
          VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            partidas_jugadas = partidas_jugadas + 1,
            partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
            partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
            partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
            puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
            puntos_torneo_totales = puntos_torneo_totales + VALUES(puntos_torneo_totales),
            puntos_masacre_totales = puntos_masacre_totales + VALUES(puntos_masacre_totales),
            warlord_muerto_totales = warlord_muerto_totales + VALUES(warlord_muerto_totales)
        `, [
          torneoId,
          partidaData.jugador2_id,
          partidaData.equipo2_id,
          j2Gana,
          j2Empata,
          j2Pierde,
          puntosVictoriaJ2,
          partidaData.puntos_torneo_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.warlord_muerto_j2 ? 1 : 0,
        ]);

        // ACTUALIZAR clasificacion_equipos_saga (Equipo 2)
        if (partidaData.equipo2_id) {
          await connection.execute(`
            INSERT INTO clasificacion_equipos_saga 
              ( torneo_id, 
                equipo_id, 
                partidas_jugadas,
                partidas_ganadas, 
                partidas_empatadas, 
                partidas_perdidas, 
                puntos_victoria_eq_totales, 
                puntos_torneo_eq_totales, 
                puntos_masacre_eq_totales, 
                warlord_muerto)
            VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              partidas_jugadas = partidas_jugadas + 1,
              partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
              partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
              partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
              puntos_victoria_eq_totales = puntos_victoria_eq_totales + VALUES(puntos_victoria_eq_totales),
              puntos_torneo_eq_totales = puntos_torneo_eq_totales + VALUES(puntos_torneo_eq_totales),
              puntos_masacre_eq_totales = puntos_masacre_eq_totales + VALUES(puntos_masacre_eq_totales),
              warlord_muerto = warlord_muerto + VALUES(warlord_muerto)
          `, [
            torneoId,
            partidaData.equipo2_id,
            j2Gana,
            j2Empata,
            j2Pierde,
            puntosVictoriaJ2,
            partidaData.puntos_torneo_j2 || 0,
            partidaData.puntos_masacre_j2 || 0,
            partidaData.warlord_muerto_j2 ? 1 : 0
          ]);
        }
      }
      
      console.log(`✅ Puntos sumados a clasificaciones individuales Y de equipos para partida ${partidaId}${esBye ? ' (BYE)' : ''}`);
      
    } else {
      // ❌ DESCONFIRMAR: Restar puntos de clasificaciones individuales Y de equipos
      
      // 1️⃣ RESTAR de jugador_torneo_saga (Jugador 1)
      await connection.execute(`
        UPDATE jugador_torneo_saga 
        SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
            puntos_torneo = GREATEST(0, puntos_torneo - ?),
            puntos_masacre = GREATEST(0, puntos_masacre - ?),
            warlord_muerto = GREATEST(0, warlord_muerto - ?)
        WHERE jugador_id = ? AND torneo_id = ?
      `, [
        puntosVictoriaJ1,
        partidaData.puntos_torneo_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.warlord_muerto_j1 ? 1 : 0,
        partidaData.jugador1_id,
        torneoId
      ]);
      
      // 2️⃣ RESTAR de clasificacion_jugadores_saga (Jugador 1)
      await connection.execute(`
        UPDATE clasificacion_jugadores_saga 
        SET 
          partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
          partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
          partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
          partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
          puntos_victoria_totales = GREATEST(0, puntos_victoria_totales - ?),
          puntos_torneo_totales = GREATEST(0, puntos_torneo_totales - ?),
          puntos_masacre_totales = GREATEST(0, puntos_masacre_totales - ?),
          warlord_muerto_totales = GREATEST(0, warlord_muerto_totales - ?)
        WHERE torneo_id = ? AND jugador_id = ?
        
      `, [
        j1Gana,
        j1Empata,
        j1Pierde,
        puntosVictoriaJ1,
        partidaData.puntos_torneo_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.warlord_muerto_j1 ? 1 : 0,
        torneoId,
        partidaData.jugador1_id,
        
      ]);

      // 3️⃣ RESTAR de clasificacion_equipos_saga (Equipo 1)
      if (partidaData.equipo1_id) {
        await connection.execute(`
          UPDATE clasificacion_equipos_saga 
          SET 
            partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
            partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
            partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
            partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
            puntos_victoria_eq_totales = GREATEST(0, puntos_victoria_eq_totales - ?),
            puntos_torneo_eq_totales = GREATEST(0, puntos_torneo_eq_totales - ?),
            puntos_masacre_eq_totales = GREATEST(0, puntos_masacre_eq_totales - ?),
            warlord_muerto = GREATEST(0, warlord_muerto - ?)
          WHERE torneo_id = ? AND equipo_id = ?
        `, [
          j1Gana,
          j1Empata,
          j1Pierde,
          puntosVictoriaJ1,
          partidaData.puntos_torneo_j1 || 0,
          partidaData.puntos_masacre_j1 || 0,
          partidaData.warlord_muerto_j1 ? 1 : 0,
          torneoId,
          partidaData.equipo1_id,
        ]);
      }
      
      // 4️⃣ Jugador 2 (solo si no es BYE)
      if (!esBye) {
        // RESTAR de jugador_torneo_saga
        await connection.execute(`
          UPDATE jugador_torneo_saga 
          SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
              puntos_torneo = GREATEST(0, puntos_torneo - ?),
              puntos_masacre = GREATEST(0, puntos_masacre - ?),
              warlord_muerto = GREATEST(0, warlord_muerto - ?)
          WHERE jugador_id = ? AND torneo_id = ?
        `, [
          puntosVictoriaJ2,
          partidaData.puntos_torneo_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.warlord_muerto_j2 ? 1 : 0,
          partidaData.jugador2_id,
          torneoId
        ]);
        
        // RESTAR de clasificacion_jugadores_saga
        await connection.execute(`
          UPDATE clasificacion_jugadores_saga 
          SET 
            partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
            partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
            partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
            partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
            puntos_victoria_totales = GREATEST(0, puntos_victoria_totales - ?),
            puntos_torneo_totales = GREATEST(0, puntos_torneo_totales - ?),
            puntos_masacre_totales = GREATEST(0, puntos_masacre_totales - ?),
            warlord_muerto_totales = GREATEST(0, warlord_muerto_totales - ?)
          WHERE torneo_id = ? AND jugador_id = ?
        `, [
          j2Gana,
          j2Empata,
          j2Pierde,
          puntosVictoriaJ2,
          partidaData.puntos_torneo_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.warlord_muerto_j2 ? 1 : 0,
          torneoId,
          partidaData.jugador2_id,
        ]);

        // RESTAR de clasificacion_equipos_saga (Equipo 2)
        if (partidaData.equipo2_id) {
          await connection.execute(`
            UPDATE clasificacion_equipos_saga 
            SET 
              partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
              partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
              partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
              partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
              puntos_victoria_eq_totales = GREATEST(0, puntos_victoria_eq_totales - ?),
              puntos_torneo_eq_totales = GREATEST(0, puntos_torneo_eq_totales - ?),
              puntos_masacre_eq_totales = GREATEST(0, puntos_masacre_eq_totales - ?),
              warlord_muerto = GREATEST(0, warlord_muerto - ?)
            WHERE torneo_id = ? AND equipo_id = ?
          `, [
            j2Gana,
            j2Empata,
            j2Pierde,
            puntosVictoriaJ2,
            partidaData.puntos_torneo_j2 || 0,
            partidaData.puntos_masacre_j2 || 0,
            partidaData.warlord_muerto_j2 ? 1 : 0,
            torneoId,
            partidaData.equipo2_id,
          ]);
        }
      }
      
      console.log(`⚠️ Puntos restados de todas las clasificaciones para partida ${partidaId}${esBye ? ' (BYE)' : ''}`);
    }
   
    // Actualizar estado de confirmación de la partida
    await connection.execute(
      'UPDATE partidas_saga SET resultado_confirmado = ? WHERE id = ?',
      [confirmar, partidaId]
    );
    
    await connection.commit();
    
    res.json(
      successResponse(
        confirmar 
          ? `✅ Resultado confirmado. Clasificaciones individuales Y de equipos actualizadas${esBye ? ' (BYE)' : ''}`
          : `⚠️ Resultado desconfirmado. Todas las clasificaciones revertidas${esBye ? ' (BYE)' : ''}`, 
        { 
          partidaId, 
          confirmado: confirmar,
          esBye 
        }
      )
    );
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al confirmar resultado de equipo:', error);
    res.status(500).json(errorResponse('Error al confirmar resultado'));
  } finally {
    connection.release();
  }
});

// ======= OBTENER EMPAREJAMIENTOS DE RONDA INDIVIDUALES (GET) =======

router.get('/:torneoId/obtenerEmparejamientosIndividuales', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    let whereClause = 'WHERE ps.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND ps.ronda = ?';
      params.push(ronda);
    }

    const queryConJoins = `
      SELECT 
        ps.*,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
        u2.nombre as jugador2_nombre,
        u2.apellidos as jugador2_apellidos,
        u2.nombre_alias as jugador2_alias
      FROM partidas_saga ps
      LEFT JOIN usuarios u1 ON ps.jugador1_id = u1.id
      LEFT JOIN usuarios u2 ON ps.jugador2_id = u2.id AND ps.es_bye = FALSE
      ${whereClause}
      ORDER BY ps.mesa, ps.id
    `;
    
    const [partidasConJoins] = await pool.execute(queryConJoins, params);
    
    // Formatear con objetos anidados para jugador1 y jugador2
    const partidasFormateadas = partidasConJoins.map(p => ({
      ...p,
      jugador1: {
        nombre_alias: p.jugador1_alias || null
      },
      jugador2: p.jugador2_id ? {
        nombre_alias: p.jugador2_alias || null
      } : null
    }));
    
    res.json(partidasFormateadas);
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======= OBTENER EMPAREJAMIENTOS DE EQUIPOS (GET) =======

router.get('/:torneoId/obtenerEmparejamientosEquipos', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    let whereClause = 'WHERE ps.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND ps.ronda = ?';
      params.push(ronda);
    }

    const query = `
      SELECT 
        ps.*,
        ps.nombre_partida,
        
        -- Equipo 1
        eq1.id as equipo1_id,
        eq1.nombre_equipo as equipo1_nombre,
        eq1.capitan_id as equipo1_capitan_id,
        u1.nombre as equipo1_capitan_nombre,
        u1.apellidos as equipo1_capitan_apellidos,
        uj1.nombre as jugador1_nombre,
        uj1.apellidos as jugador1_apellidos,
        jt1.faccion as jugador1_faccion,
        jt1.epoca as jugador1_epoca,
        
        -- Puntos del Equipo 1 (desde clasificacion_equipos_saga)
        COALESCE(ceq1.puntos_victoria_eq_totales, 0) as equipo1_puntos_victoria,
        COALESCE(ceq1.puntos_torneo_eq_totales, 0) as equipo1_puntos_torneo,
        COALESCE(ceq1.puntos_masacre_eq_totales, 0) as equipo1_puntos_masacre,
        
        -- Equipo 2
        eq2.id as equipo2_id,
        eq2.nombre_equipo as equipo2_nombre,
        eq2.capitan_id as equipo2_capitan_id,
        u2.nombre as equipo2_capitan_nombre,
        u2.apellidos as equipo2_capitan_apellidos,
        uj2.nombre as jugador2_nombre,
        uj2.apellidos as jugador2_apellidos,
        jt2.faccion as jugador2_faccion,
        jt2.epoca as jugador2_epoca,
        
        -- Puntos del Equipo 2 (desde clasificacion_equipos_saga)
        COALESCE(ceq2.puntos_victoria_eq_totales, 0) as equipo2_puntos_victoria,
        COALESCE(ceq2.puntos_torneo_eq_totales, 0) as equipo2_puntos_torneo,
        COALESCE(ceq2.puntos_masacre_eq_totales, 0) as equipo2_puntos_masacre
        
      FROM partidas_saga ps
      
      -- JOIN Equipo 1
      LEFT JOIN torneo_saga_equipo eq1 ON ps.equipo1_id = eq1.id
      LEFT JOIN usuarios u1 ON eq1.capitan_id = u1.id
      LEFT JOIN clasificacion_equipos_saga ceq1 ON (ceq1.equipo_id = eq1.id AND ceq1.torneo_id = ps.torneo_id)
      LEFT JOIN usuarios uj1 ON ps.jugador1_id = uj1.id
      LEFT JOIN jugador_torneo_saga jt1 ON (jt1.jugador_id = uj1.id AND jt1.torneo_id = ps.torneo_id)
            
      -- JOIN Equipo 2
      LEFT JOIN torneo_saga_equipo eq2 ON ps.equipo2_id = eq2.id
      LEFT JOIN usuarios u2 ON eq2.capitan_id = u2.id
      LEFT JOIN clasificacion_equipos_saga ceq2 ON (ceq2.equipo_id = eq2.id AND ceq2.torneo_id = ps.torneo_id)
      LEFT JOIN usuarios uj2 ON ps.jugador2_id = uj2.id AND ps.es_bye = FALSE
      LEFT JOIN jugador_torneo_saga jt2 ON (jt2.jugador_id = uj2.id AND jt2.torneo_id = ps.torneo_id)
      
      ${whereClause}
      ORDER BY ps.mesa, ps.id
    `;
    
    const [partidas] = await pool.execute(query, params);
    
    res.json(partidas);
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======= GUARDAR EMPAREJAMIENTOS DE RONDA  INDIVIDUAL (POST) =======

router.post('/:torneoId/guardarEmparejamientosIndividuales', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    const { emparejamientos, ronda } = req.body;
    
    if (!emparejamientos || !Array.isArray(emparejamientos)) {
      throw new Error('emparejamientos debe ser un array');
    }
    
    if (!ronda) {
      throw new Error('ronda es requerida');
    }
    
    console.log('📥 Recibiendo emparejamientos:', emparejamientos.length);
    console.log('📋 Primer emparejamiento:', emparejamientos[0]);
    
    await connection.beginTransaction();
    
    // 1. Eliminar emparejamientos existentes de esta ronda
    await connection.execute(
      'DELETE FROM partidas_saga WHERE torneo_id = ? AND ronda = ?',
      [torneoId, ronda]
    );
    
    // 2. Insertar nuevos emparejamientos
    for (const partida of emparejamientos) {
      const jugador1_id = partida.jugador1_id;
      const jugador2_id = partida.jugador2_id || null;
      const es_bye = !jugador2_id;
      
      const insertQuery = `
        INSERT INTO partidas_saga (
          torneo_id, 
          jugador1_id, 
          jugador2_id,
          equipo1_id,
          equipo2_id,
          epoca,
          ronda, 
          mesa, 
          nombre_partida,
          es_bye,
          resultado_ps,
          puntos_victoria_j1,
          puntos_victoria_j2,
          puntos_torneo_j1,
          puntos_torneo_j2,
          puntos_masacre_j1,
          puntos_masacre_j2,
          resultado_confirmado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(insertQuery, [
        torneoId,
        jugador1_id,
        jugador2_id,
        partida.equipo1_id || null,
        partida.equipo2_id || null,
        partida.epoca || null,        // ✅ AGREGADO
        ronda,
        partida.mesa || null,
        partida.nombre_partida || 'Partida sin nombre',
        es_bye,
        es_bye ? 'victoria_j1' : 'pendiente',
        es_bye ? 3 : 0,
        0,
        es_bye ? 10 : 0,
        0,
        0,
        0,
        false 
      ]);
    }
    
    // 3. Actualizar ronda_actual del torneo
    await connection.execute(
      'UPDATE torneos_sistemas SET ronda_actual = ? WHERE id = ?',
      [ronda, torneoId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Emparejamientos guardados correctamente',
      ronda: ronda,
      total: emparejamientos.length
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ ERROR al guardar emparejamientos:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// ======= GUARDAR EMPAREJAMIENTOS DE EQUIPOS (POST) =======

router.post('/:torneoId/guardarEmparejamientosEquipos', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    const { emparejamientos, ronda } = req.body;
    
    if (!emparejamientos || !Array.isArray(emparejamientos)) {
      throw new Error('emparejamientos debe ser un array');
    }
    
    if (!ronda) {
      throw new Error('ronda es requerida');
    }
    
    console.log('📥 Recibiendo emparejamientos de equipos:', emparejamientos.length);
    console.log('📋 Primer emparejamiento:', emparejamientos[0]);
    
    await connection.beginTransaction();
    
    // 1. Eliminar emparejamientos existentes de esta ronda
    await connection.execute(
      'DELETE FROM partidas_saga WHERE torneo_id = ? AND ronda = ?',
      [torneoId, ronda]
    );
    
    // 2. Insertar nuevos emparejamientos
    for (const partida of emparejamientos) {
      const jugador1_id = partida.jugador1_id;
      const jugador2_id = partida.jugador2_id || null;
      const es_bye = !jugador2_id;
      
      const insertQuery = `
        INSERT INTO partidas_saga (
          torneo_id, 
          jugador1_id, 
          jugador2_id,
          equipo1_id,
          equipo2_id,
          epoca,
          ronda, 
          mesa, 
          nombre_partida,
          es_bye,
          resultado_ps,
          puntos_victoria_j1,
          puntos_victoria_j2,
          puntos_torneo_j1,
          puntos_torneo_j2,
          puntos_masacre_j1,
          puntos_masacre_j2,
          resultado_confirmado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(insertQuery, [
        torneoId,
        jugador1_id,
        jugador2_id || null,
        partida.equipo1_id || null,
        partida.equipo2_id || null,
        partida.epoca || null,
        ronda,
        partida.mesa || null,
        partida.nombre_partida || 'Partida sin nombre',
        es_bye,
        es_bye ? 'victoria_j1' : 'pendiente',
        es_bye ? 1 : 0,
        0,
        es_bye ? 10 : 0,
        0,
        0,
        0,
        false 
      ]);
    }
    
    // 3. Actualizar ronda_actual del torneo
    await connection.execute(
      'UPDATE torneos_sistemas SET ronda_actual = ? WHERE id = ?',
      [ronda, torneoId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Emparejamientos de equipos guardados correctamente',
      ronda: ronda,
      total: emparejamientos.length
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ ERROR al guardar emparejamientos de equipos:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// ======ELIMINAR PARTIDA======

router.delete('/:torneoId/partidasTorneoSaga/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    // Verificar que la partida existe y permisos
    const [partidaExistente] = await pool.execute(`
      SELECT ps.*, ts.created_by
      FROM partidas_saga ps
      JOIN torneos_sistemas ts ON ps.torneo_id = ts.id
      WHERE ps.id = ?
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
    await pool.execute('DELETE FROM partidas_saga WHERE id = ?', [partidaId]);
    
    res.json(
      successResponse('Partida eliminada exitosamente')
    );
    
  } catch (error) {
    console.error('Error al eliminar partida:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

//======ACTUALIZAR A PRIMER JUGADOR DE CADA PARTIDA=======

router.put('/:torneoId/partidasTorneoSaga/:partidaId/primer-jugador/:jugadorId', async (req, res) => {
   try {  
    const { partidaId, torneoId } = req.params; // id de la partida y del torneo
    const { jugadorId } = req.body; // id del jugador que clicó

    // Validación de datos
    if (!jugadorId) {
      return res.status(400).json(
        errorResponse('El ID del jugador es requerido')
      );
    }

    // Verificar que el jugador pertenece a la partida
    const [partida] = await pool.execute(
      "SELECT jugador1_id, jugador2_id FROM partidas_saga WHERE id = ? AND torneo_id = ?",
      [partidaId, torneoId]
    );

    if (partida.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }

    const jugador1Id = partida[0].jugador1_id;
    const jugador2Id = partida[0].jugador2_id;

    if (jugador1Id !== parseInt(jugadorId) && jugador2Id !== parseInt(jugadorId)) {
      return res.status(403).json(
        errorResponse('El jugador no pertenece a esta partida')
      );
    }

    // Actualizar primer jugador
    await pool.execute(
      "UPDATE partidas_saga SET primer_jugador = ? WHERE id = ?",
      [jugadorId, partidaId]
    );
    
    res.json(
      successResponse('Primer jugador registrado correctamente', {
        partidaId: partidaId,
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

//=======OBTENER CLASIFICACION=========

router.get('/:torneoId/obtenerClasificacionIndividual', async (req, res) =>{

  try {

     const { torneoId } = req.params;

        const [clasificacion] = await pool.execute(`
            SELECT 
                cjs.id,
                cjs.jugador_id,
                cjs.equipo_id,
                cjs.partidas_ganadas,
                cjs.partidas_empatadas,
                cjs.partidas_perdidas,
                tse.nombre_equipo,
                u.nombre as jugador_nombre,
                u.apellidos as jugador_apellidos,
                u.nombre_alias,
                u.club,
                jts.faccion,
                jts.epoca,
                COALESCE(cjs.partidas_jugadas, 0) as partidas_jugadas,
                 COALESCE(cjs.partidas_ganadas, 0) as jugador_partidas_ganadas,
                COALESCE(cjs.partidas_empatadas, 0) as jugador_partidas_empatadas,
                COALESCE(cjs.partidas_perdidas, 0) as jugador_partidas_perdidas,
                COALESCE(cjs.puntos_victoria_totales, 0) as puntos_victoria_totales,
                COALESCE(ROUND (cjs.puntos_torneo_totales, 1), 0) as puntos_torneo_totales,
                COALESCE(cjs.puntos_masacre_totales, 0) as puntos_masacre_totales,
                COALESCE(cjs.warlord_muerto_totales, 0) as warlord_muerto_totales
              FROM clasificacion_jugadores_saga cjs
                INNER JOIN usuarios u 
                  ON cjs.jugador_id = u.id
                LEFT JOIN torneo_saga_equipo tse
                  ON tse.torneo_id = cjs.torneo_id 
                  AND tse.id = cjs.equipo_id
                LEFT JOIN jugador_torneo_saga jts
                  ON cjs.jugador_id = jts.jugador_id
                  AND cjs.torneo_id = jts.torneo_id 
              WHERE cjs.torneo_id = ?
        `, [torneoId]);


        res.json(successResponse('La clasificación obtenida es: ',  clasificacion))

  }catch(error){
        console.error('❌ Error COMPLETO al obtener la clasificación:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        res.status(500).json(errorResponse('Error al obtener la clasificación'));
  }
})

//======= OBTENER CLASIFICACIÓN POR EQUIPOS =========

router.get('/:torneoId/obtenerClasificacionEquipos', async (req, res) => {
  try {
    const { torneoId } = req.params;

    // Consulta principal: equipos con su clasificación
    const [clasificacionEquipos] = await pool.execute(`
      SELECT 
        ceqs.id as clasificacion_id,
        ceqs.equipo_id,
        ceqs.torneo_id,
        ceqs.partidas_jugadas,
        ceqs.partidas_ganadas,
        ceqs.partidas_empatadas,
        ceqs.partidas_perdidas,
        ceqs.puntos_victoria_eq_totales,
        ceqs.puntos_torneo_eq_totales,
        ceqs.puntos_masacre_eq_totales,
        ceqs.warlord_muerto,
        
        tse.nombre_equipo,
        tse.capitan_id,
        
        u.nombre as capitan_nombre,
        u.apellidos as capitan_apellidos,
        u.nombre_alias,
        u.club as capitan_club
        
      FROM clasificacion_equipos_saga ceqs
      INNER JOIN torneo_saga_equipo tse 
        ON ceqs.equipo_id = tse.id
      LEFT JOIN usuarios u 
        ON tse.capitan_id = u.id
      WHERE ceqs.torneo_id = ?
    `, [torneoId]);

    // Consulta secundaria: jugadores de cada equipo
    const [jugadoresEquipos] = await pool.execute(`
      SELECT 
        jts.equipo_id,
        jts.jugador_id,
        jts.epoca,
        jts.faccion,
        u.nombre as jugador_nombre,
        u.apellidos as jugador_apellidos,
        u.nombre_alias,
        u.club as jugador_club,
        
        cjs.partidas_jugadas as jugador_partidas_jugadas,
        COALESCE(cjs.partidas_ganadas, 0) as jugador_partidas_ganadas,
        COALESCE(cjs.partidas_empatadas, 0) as jugador_partidas_empatadas,
        COALESCE(cjs.partidas_perdidas, 0) as jugador_partidas_perdidas,
        COALESCE(cjs.puntos_victoria_totales, 0) as jugador_puntos_victoria,
        COALESCE(cjs.puntos_torneo_totales, 0) as jugador_puntos_torneo,
        COALESCE(cjs.puntos_masacre_totales, 0) as jugador_puntos_masacre,
        COALESCE(cjs.warlord_muerto_totales, 0) as jugador_warlord_muerto
        
      FROM jugador_torneo_saga jts
      LEFT JOIN usuarios u 
        ON jts.jugador_id = u.id
      LEFT JOIN clasificacion_jugadores_saga cjs
        ON cjs.jugador_id = jts.jugador_id 
        AND cjs.torneo_id = jts.torneo_id
      WHERE jts.torneo_id = ?
        AND jts.equipo_id IS NOT NULL
    `, [torneoId]);

    // Agrupar jugadores por equipo
    const jugadoresPorEquipo = new Map();
    jugadoresEquipos.forEach(jugador => {
      if (!jugadoresPorEquipo.has(jugador.equipo_id)) {
        jugadoresPorEquipo.set(jugador.equipo_id, []);
      }
      jugadoresPorEquipo.get(jugador.equipo_id).push({
        jugador_id: jugador.jugador_id,
        nombre: jugador.jugador_nombre,
        apellidos: jugador.jugador_apellidos,
        alias: jugador.nombre_alias,
        club: jugador.jugador_club,
        epoca: jugador.epoca,
        faccion: jugador.faccion,
        partidas_jugadas: jugador.jugador_partidas_jugadas || 0,
        partidas_ganadas: jugador.partidas_ganadas || 0,
        partidas_empatadas: jugador.partidas_empatadas || 0,
        partidas_perdidas: jugador.partidas_perdidas || 0,
        puntos_victoria: jugador.jugador_puntos_victoria || 0,
        puntos_torneo: jugador.jugador_puntos_torneo || 0,
        puntos_masacre: jugador.jugador_puntos_masacre || 0,
        warlord_muerto: jugador.jugador_warlord_muerto || 0
      });
    });

    // Construir respuesta final
    const resultado = clasificacionEquipos.map(equipo => ({
      clasificacion_id: equipo.clasificacion_id,
      equipo_id: equipo.equipo_id,
      torneo_id: equipo.torneo_id,
      nombre_equipo: equipo.nombre_equipo,
      
      // Estadísticas del equipo
      partidas_jugadas: equipo.partidas_jugadas,
      partidas_ganadas: equipo.partidas_ganadas,
      partidas_empatadas: equipo.partidas_empatadas,
      partidas_perdidas: equipo.partidas_perdidas,
      puntos_victoria_totales: equipo.puntos_victoria_eq_totales,
      puntos_torneo_totales: equipo.puntos_torneo_eq_totales,
      puntos_masacre_totales: equipo.puntos_masacre_eq_totales,
      warlord_muerto: equipo.warlord_muerto,
      
      // Información del capitán
      capitan: {
        id: equipo.capitan_id,
        nombre: equipo.capitan_nombre,
        apellidos: equipo.capitan_apellidos,
        alias: equipo.nombre_alias,
        club: equipo.capitan_club
      },
      
      // Jugadores del equipo
      jugadores: jugadoresPorEquipo.get(equipo.equipo_id) || []
    }));

    res.json(successResponse('Clasificación de equipos obtenida correctamente', resultado));

  } catch(error) {
    console.error('❌ Error al obtener la clasificación de equipos:', error);
    res.status(500).json(errorResponse('Error al obtener la clasificación de equipos'));
  }
});

//===============================================================================
//===============================================================================

// =====DESCARGAR PDF DE BASES DEL TORNEO=====

router.get('/:torneoId/bases-pdf', async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    const [result] = await pool.execute(
      'SELECT bases_torneo, bases_nombre FROM torneos_sistemas WHERE id = ?',
      [torneoId]
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


module.exports = router;
