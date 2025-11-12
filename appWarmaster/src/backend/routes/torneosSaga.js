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
  paginar,
  organizarClasificacion
} = require('../utils/helpers');

const router = express.Router(); 

// =====CONFIGURACIÓN DE MULTER PARA SUBIDA DE PDF=====
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


//================
//RUTAS TORNEOS
//================

//=====OBTENER TORNEOS CON PAGINACIÓN=====

router.get('/obtenerTorneos', async (req, res) => {
  try {
    console.log('📥 GET /api/torneosSaga');
    
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
        ts.ronda_actual,
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

//=====OBTENER TORNEO ESPECIFICO=====

router.get('/torneo/:torneoId', async (req, res) => {
  try {

    const { torneoId } = req.params;
    console.log(`📥 GET /api/torneosSaga/${torneoId}`);
    
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
        ts.ronda_actual,
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
    `, [userId, torneoId]);  // ✅ CORREGIDO
    
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

// =====CREAR NUEVO TORNEO=====

router.post('/creandoTorneo', verificarToken, upload.single('bases_pdf'), async (req, res) => {
  try {
    console.log('📥 POST /api/torneosSaga/creandoTorneo');

    console.log('👤 [RUTA] req.usuario:', req.usuario);  // ✅ AGREGAR AQUÍ
    console.log('👤 [RUTA] req.userId:', req.userId);
    
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
      [req.usuario.userId]
    );

    let rolActualizado = usuarios[0].rol;

    if (usuarios[0].rol !== 'organizador') {
      await pool.execute(
        'UPDATE usuarios SET rol = ? WHERE id = ?',
        ['organizador', req.usuario.userId]
      );
      rolActualizado = 'organizador';
      console.log(`✅ Usuario ${req.usuario.userId} convertido a organizador`);
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
        req.usuario.userId
      ]
    );
    
    console.log(`✅ Torneo creado con ID: ${resultado.insertId}`);
    
    res.status(201).json(
      successResponse('Torneo creado exitosamente', {
        torneoId: resultado.insertId,
        nombre_torneo,
        epoca_torneo, 
        tiene_bases_pdf: !!req.file,
        created_by: req.usuario.userId,
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

// ======ACTUALIZAR TORNEO=====

router.put('/:torneoId/actualizarTorneo', verificarToken, upload.single('bases_pdf'), async (req, res) => {
  try {
    const { torneoId } = req.params;
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

// ======INSCRIBIRSE EN TORNEO=====

router.post('/:torneoId/inscripcion', async (req, res) => {
  try {
    const { torneoId } = req.params;
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
      'SELECT puntos_banda, epoca_torneo FROM torneo_saga WHERE id = ?',
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

    const composicionEjercito = JSON.stringify({
      guardias: puntosGuardias,
      guerreros: puntosGuerreros,
      levas: puntosLevas,
      mercenarios: puntosMercenarios,
      detalleMercenarios: detalleMercenarios || null
    });
    
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
      ) VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?)`,
      [
        torneoId,
        usuarioId,
        torneo.epoca_torneo,
        bandaTipo,
        composicionEjercito,
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
        composicionEjercito: JSON.parse(composicionEjercito)
      })
    );

  } catch (error) {
    console.error('❌ Error al inscribirse:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// =====OBTENER MI INSCRIPCIÓN=====

router.get('/:torneoId/miInscripcion', verificarToken, async (req, res) => {
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
        const jugadorId = req.userId

        const {
            bandaTipo,
            puntosGuardias,
            puntosGuerreros,
            puntosLevas,
            puntosMercenarios,
            detalleMercenarios
        } = req.body;

        await connection.beginTransaction();

        // Verificar que está inscrito
        const [inscripcion] = await connection.execute(
            'SELECT id FROM jugador_torneo_saga WHERE torneo_id = ? AND jugador_id = ?',
            [torneoId, jugadorId]
        );

        if (inscripcion.length === 0) {
            await connection.rollback();
            return res.status(404).json(errorResponse('No estás inscrito en este torneo'));
        }

        // Crear objeto JSON con la composición del ejército
        const composicionEjercito = JSON.stringify({
            guardias: puntosGuardias,
            guerreros: puntosGuerreros,
            levas: puntosLevas,
            mercenarios: puntosMercenarios,
            detalleMercenarios: detalleMercenarios
        });

        // Actualizar inscripción
        const resultado = await connection.execute(`
            UPDATE jugador_torneo_saga 
            SET faccion = ?,
                composicion_ejercito = ?
            WHERE torneo_id = ? AND jugador_id = ?
        `, [
            bandaTipo,
           composicionEjercito,
            torneoId,
            jugadorId
        ]);

        if (resultado.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json(errorResponse('Error al actualizar inscripción'));
        }

        await connection.commit();

        const [inscripcionActualizada] = await connection.execute(`
            SELECT * FROM jugador_torneo_saga 
            WHERE torneo_id = ? AND jugador_id = ?
        `, [torneoId, jugadorId]);

        if (inscripcionActualizada.length > 0 && inscripcionActualizada[0].composicion_ejercito) {
            try {
                inscripcionActualizada[0].composicion_ejercito = JSON.parse(inscripcionActualizada[0].composicion_ejercito);
            } catch {
                inscripcionActualizada[0].composicion_ejercito = {};
            }
        }
         res.json(successResponse(inscripcionActualizada[0], 'Inscripción actualizada correctamente'));

    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json(errorResponse('Error al actualizar inscripción'));
    } finally {
        connection.release();
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
             'SELECT created_by FROM torneo_saga WHERE id = ?',
             [torneoId]
         );
         if (torneo[0].created_by !== req.userId) {
             return res.status(403).json(errorResponse('No tienes permisos'));
         }

        // Actualizar estado de pago
        const [result] = await pool.execute(`
            UPDATE jugador_torneo_saga 
            SET pagado = ?
            WHERE torneo_id = ? AND jugador_id = ?
        `, [pagado, torneoId, jugadorId]);

        if (result.affectedRows === 0) {
            return res.status(404).json(errorResponse('Inscripción no encontrada'));
        }

        res.json(successResponse(`Estado de pago actualizado a: ${pagado}`));

    } catch (error) {
        console.error('Error al actualizar pago:', error);
        res.status(500).json(errorResponse('Error al actualizar estado de pago'));
    }
});

// =====ELIMINAR TORNEO======

router.delete('/:torneoId/eliminarTorneo', verificarToken, async (req, res) => {
  
  try {
    const { torneoId } = req.params;
    
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

// =====ELIMINAR JUGADOR TORNEO=====

router.delete('/:torneoId/jugadores/:jugadorId', verificarToken, async (req, res) => {
  try {
    const { torneoId, jugadorId } = req.params;
    
    console.log(`🗑️ DELETE /api/torneosSaga/${torneoId}/jugadores/${jugadorId}`);
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
            WHERE jts.torneo_id = ?
            ORDER BY jts.puntos_torneo DESC, jts.created_at ASC
        `, [torneoId]);
        
        res.json(successResponse('Jugadores obtenidos', jugadores));
        
    } catch (error) {
        console.error('Error al obtener jugadores:', error);
        res.status(500).json(errorResponse('Error al obtener jugadores'));
    }
});


// =====CAMBIAR ESTADO DEL TORNEO=====

router.put('/:torneoId/estado', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    const { estado } = req.body;
    const userId = req.usuario.userId;
    
    console.log(`📝 PUT /api/torneosSaga/${torneoId}/estado - Cambiar estado a: ${estado}`);
    
    // Validar que se envió el estado
    if (!estado) {
      return res.status(400).json(errorResponse('El estado es requerido'));
    }
    
    // Validar estados permitidos
    const estadosPermitidos = ['pendiente', 'en curso', 'finalizado'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json(
        errorResponse(`Estado no válido. Debe ser: ${estadosPermitidos.join(', ')}`)
      );
    }
    
    await connection.beginTransaction();
    
    // Verificar que el torneo existe y que el usuario es el creador
    const [torneo] = await connection.execute(
      'SELECT id, created_by, estado, nombre_torneo FROM torneo_saga WHERE id = ?',
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
      'UPDATE torneo_saga SET estado = ?, updated_at = NOW() WHERE id = ?',
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
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
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
        END as jugador2_alias
      FROM partidas_saga ps
      LEFT JOIN usuarios u1 ON ps.jugador1_id = u1.id
      LEFT JOIN usuarios u2 ON ps.jugador2_id = u2.id AND ps.es_bye = FALSE
      ${whereClause}
      ORDER BY ps.mesa, ps.id
    `, params);

    console.log(`📊 Partidas obtenidas: ${partidas.length}`);
    
    res.json(partidas);
    
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
      JOIN torneo_saga ts ON ps.torneo_id = ts.id
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
    const { partidaId, torneoId } =req.params
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
      SELECT jugador1_id, jugador2_id, resultado_ps, torneo_id, ronda, resultado_confirmado
      FROM partidas_saga 
      WHERE id = ? AND torneo_id = ?
    `, [partidaId, torneoId]);
    
    if (partida.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }
    
   // ✅ CORREGIDO: Extraer los IDs de jugadores
    const jugador1_id = partida[0].jugador1_id;
    const jugador2_id = partida[0].jugador2_id;
    
    // ✅ Verificar que no sea una partida BYE
    if (!jugador2_id || partida[0].resultado_ps === 'victoria_j1') {
      return res.status(400).json(
        errorResponse('No se puede actualizar una partida BYE. La victoria automática ya está registrada.')
      );
    }

    //verificar que el resultado no este confirmado
    if (partida[0].resultado_confirmado) {
      return res.status(400).json(
        errorResponse('No se puede actualizar una partida con resultado confirmado. El organizador debe desconfirmar el resultado primero.')
      );
    }
    
    // Verificar que no existe ya una partida entre estos jugadores en esta ronda
    const [partidaExistente] = await pool.execute(`
      SELECT id FROM partidas_saga 
      WHERE torneo_id = ? AND ronda = ? AND 
      ((jugador1_id = ? AND jugador2_id = ?) OR (jugador1_id = ? AND jugador2_id = ?))
    `, [torneo_id, ronda || 1, jugador1_id, jugador2_id, jugador2_id, jugador1_id]);
    
    if (partidaExistente.length > 0) {
      return res.status(400).json(
        errorResponse('Ya existe una partida entre estos jugadores en esta ronda')
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
      resultado = 'victoria_j1'
    } else if (puntosPartidaJ2 > puntosPartidaJ1) {
      puntosVictoriaJ1 = 0;
      puntosVictoriaJ2 = 3;
      resultado = 'victoria_j2'
    } else {
      puntosVictoriaJ1 = 1;
      puntosVictoriaJ2 = 1;
      resultado = 'empate'
    }

    const puntosMasacreJ1 = parseInt(puntos_masacre_j1) || 0;
    const puntosMasacreJ2 = parseInt(puntos_masacre_j2) || 0;
    
    // Determinar quién fue el primer jugador (por defecto jugador1 si primer_jugador es true)
    const primerJugadorId = primer_jugador || null;
    
    const puntosTorneo = calcularPuntosTorneo(
      puntosPartidaJ1, 
      puntosPartidaJ2, 
      jugador1_id, 
      primerJugadorId
    );
    
    // Registrar la partida
   await pool.execute(`
     UPDATE partidas_saga SET
        puntos_victoria_j1 = ?, 
        puntos_victoria_j2 = ?,
        puntos_torneo_j1 = ?, 
        puntos_torneo_j2 = ?,
        puntos_masacre_j1 = ?, 
        puntos_masacre_j2 = ?,
        warlord_muerto_j1 = ?, 
        warlord_muerto_j2 =?,
        resultado_ps = ?, 
        primer_jugador = ?
        resultado_confirmado = FALSE
      WHERE id=?
    `, [
      puntosVictoriaJ1, 
      puntosVictoriaJ2,
      puntosTorneo.j1, // ← Puntos calculados automáticamente
      puntosTorneo.j2, // ← Puntos calculados automáticamente
      puntosMasacreJ1, 
      puntosMasacreJ2,
      warlord_muerto_j1 || false, 
      warlord_muerto_j2 || false,
      resultado, 
      primer_jugador || false,
      partidaId
    ]);
    
    res.status(201).json(
      successResponse('Partida registrada exitosamente (pendiente de confirmación)', {
        partidaId,
        resultado,
        puntosTorneo: {
          jugador1: puntosTorneo.j1,
          jugador2: puntosTorneo.j2
        },
        puntosVictoria :{
          jugador1: puntosVictoriaJ1,
          jugador2: puntosVictoriaJ2
        },
        puntosMasacre :{
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

// ====== CONFIRMAR RESULTADO POR ORGANIZADOR========

router.patch('/:torneoId/partidasTorneoSaga/:partidaId/confirmar', verificarToken, async (req, res) => {
  try {
    const { torneoId, partidaId } = req.params;
    const { confirmar } = req.body; // true para confirmar, false para desconfirmar
    
    // Verificar que el usuario es el organizador
    const [torneo] = await pool.execute(
      'SELECT created_by FROM torneo_saga WHERE id = ?',
      [torneoId]
    );
    
    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    if (torneo[0].created_by !== req.userId) {
      return res.status(403).json(errorResponse('Solo el organizador puede confirmar resultados'));
    }
    
    // Verificar que la partida existe
    const [partida] = await pool.execute(
      'SELECT id, jugador2_id FROM partidas_saga WHERE id = ? AND torneo_id = ?',
      [partidaId, torneoId]
    );
    
    if (partida.length === 0) {
      return res.status(404).json(errorResponse('Partida no encontrada'));
    }
    
    // No permitir confirmar partidas BYE
    if (!partida[0].jugador2_id) {
      return res.status(400).json(errorResponse('Las partidas BYE no requieren confirmación'));
    }
    
    // Actualizar estado de confirmación
    await pool.execute(
      'UPDATE partidas_saga SET resultado_confirmado = ? WHERE id = ?',
      [confirmar ? true : false, partidaId]
    );
    
    res.json(
      successResponse(
        confirmar ? 'Resultado confirmado' : 'Resultado desconfirmado', 
        { 
          partidaId, 
          confirmado: confirmar 
        }
      )
    );
    
  } catch (error) {
    console.error('Error al confirmar resultado:', error);
    res.status(500).json(errorResponse('Error al confirmar resultado'));
  }
});

/// ======= GUARDAR EMPAREJAMIENTOS DE RONDA =======

router.get('/:torneoId/partidasTorneoSaga', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    console.log('\n🔍 ==================== INICIO ====================');
    console.log('📊 torneoId:', torneoId, 'tipo:', typeof torneoId);
    console.log('📊 ronda:', ronda, 'tipo:', typeof ronda);
    
    let whereClause = 'WHERE ps.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND ps.ronda = ?';
      params.push(ronda);
    }
    
    // CONSULTA MÁS SIMPLE POSIBLE PRIMERO
    console.log('\n📝 Ejecutando consulta SIN JOINs...');
    const querySinJoins = `SELECT * FROM partidas_saga ${whereClause}`;
    console.log('Query:', querySinJoins);
    console.log('Params:', params);
    
    const [partidasSinJoins] = await pool.execute(querySinJoins, params);
    console.log(`✅ Partidas SIN JOINs: ${partidasSinJoins.length}`);
    console.log('IDs:', partidasSinJoins.map(p => p.id));
    
    // AHORA CON JOINS
    console.log('\n📝 Ejecutando consulta CON JOINs...');
    const queryConJoins = `
      SELECT 
        ps.*,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u2.nombre as jugador2_nombre,
        u2.apellidos as jugador2_apellidos
      FROM partidas_saga ps
      LEFT JOIN usuarios u1 ON ps.jugador1_id = u1.id
      LEFT JOIN usuarios u2 ON ps.jugador2_id = u2.id AND ps.es_bye = FALSE
      ${whereClause}
      ORDER BY ps.mesa, ps.id
    `;
    
    const [partidasConJoins] = await pool.execute(queryConJoins, params);
    console.log(`✅ Partidas CON JOINs: ${partidasConJoins.length}`);
    console.log('IDs:', partidasConJoins.map(p => p.id));
    
    if (partidasSinJoins.length !== partidasConJoins.length) {
      console.error('⚠️ DISCREPANCIA: Los JOINs están filtrando filas!');
      console.error(`Sin JOINs: ${partidasSinJoins.length}, Con JOINs: ${partidasConJoins.length}`);
    }
    
    console.log('\n📊 Detalle de cada partida:');
    partidasConJoins.forEach(p => {
      console.log(`  ID: ${p.id} | Mesa: ${p.mesa} | J1: ${p.jugador1_id} | J2: ${p.jugador2_id} | BYE: ${p.es_bye}`);
    });
    
    console.log('🔍 ==================== FIN ====================\n');
    
    res.json(partidasConJoins);
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// ======= ACTUALIZAR PARTIDA======

router.put('/:torneoId/partidasTorneoSaga/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId, torneoId } =req.params
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
      SELECT jugador1_id, jugador2_id, resultado_ps 
      FROM partidas_saga 
      WHERE id = ? AND torneo_id = ?
    `, [partidaId, torneoId]);
    
    if (partida.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }
    
    // ✅ CORREGIDO: Extraer los IDs de jugadores
    const jugador1_id = partida[0].jugador1_id;
    const jugador2_id = partida[0].jugador2_id;
    
    // ✅ Verificar que no sea una partida BYE
    if (!jugador2_id || partida[0].resultado_ps === 'victoria_j1') {
      return res.status(400).json(
        errorResponse('No se puede actualizar una partida BYE. La victoria automática ya está registrada.')
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
      resultado = 'victoria_j1'
    } else if (puntosPartidaJ2 > puntosPartidaJ1) {
      puntosVictoriaJ1 = 0;
      puntosVictoriaJ2 = 3;
      resultado = 'victoria_j2'
    } else {
      puntosVictoriaJ1 = 1;
      puntosVictoriaJ2 = 1;
      resultado = 'empate'
    }

    const puntosMasacreJ1 = parseInt(puntos_masacre_j1) || 0;
    const puntosMasacreJ2 = parseInt(puntos_masacre_j2) || 0;
    
    // Determinar quién fue el primer jugador (por defecto jugador1 si primer_jugador es true)
    const primerJugadorId = primer_jugador || null;
    
    const puntosTorneo = calcularPuntosTorneo(
      puntosPartidaJ1, 
      puntosPartidaJ2, 
      jugador1_id, 
      primerJugadorId
    );
    
    // Registrar la partida
   await pool.execute(`
     UPDATE partidas_saga SET
        puntos_victoria_j1 = ?, 
        puntos_victoria_j2 = ?,
        puntos_torneo_j1 = ?, 
        puntos_torneo_j2 = ?,
        puntos_masacre_j1 = ?, 
        puntos_masacre_j2 = ?,
        warlord_muerto_j1 = ?, 
        warlord_muerto_j2 =?,
        resultado_ps = ?, 
        primer_jugador = ?
      WHERE id=?
    `, [
      puntosVictoriaJ1, 
      puntosVictoriaJ2,
      puntosTorneo.j1, // ← Puntos calculados automáticamente
      puntosTorneo.j2, // ← Puntos calculados automáticamente
      puntosMasacreJ1, 
      puntosMasacreJ2,
      warlord_muerto_j1 || false, 
      warlord_muerto_j2 || false,
      resultado, 
      primer_jugador || false,
      partidaId
    ]);
    
    res.status(201).json(
      successResponse('Partida registrada exitosamente', {
        partidaId,
        resultado,
        puntosTorneo: {
          jugador1: puntosTorneo.j1,
          jugador2: puntosTorneo.j2
        },
        puntosVictoria :{
          jugador1: puntosVictoriaJ1,
          jugador2: puntosVictoriaJ2
        },
        puntosMasacre :{
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

// ======ELIMINAR PARTIDA======

router.delete('/:torneoId/partidasTorneoSaga/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    // Verificar que la partida existe y permisos
    const [partidaExistente] = await pool.execute(`
      SELECT ps.*, ts.created_by
      FROM partidas_saga ps
      JOIN torneo_saga ts ON ps.torneo_id = ts.id
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

    console.log(`📝 PUT /api/partidasTorneoSaga/${torneoId}/partidasTorneoSaga/${partidaId}/primer-jugador - Jugador: ${jugadorId}`);

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

    console.log(`✅ Primer jugador actualizado correctamente en partida ${partidaId}`);
    
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

//======OBTENER CLASIFICACION DEL TORNEO CON ACTUALIZACIONES======

router.get('/:torneoId/clasificacionTorneo', async (req, res) => {
  const { torneoId } =req.params;
   console.log(`📥 GET /api/torneosSaga/${torneoId}/clasificacionTorneo`);

  try {
  const [jugadores] = await pool.execute(`
      SELECT 
        jts.id,
        jts.jugador_id,
        u.nombre,
        u.apellidos AS apellido,
        u.club,
        jts.faccion,
        jts.puntos_victoria,
        jts.puntos_torneo,
        jts.puntos_masacre,
        jts.warlord_muerto
      FROM jugador_torneo_saga jts
      INNER JOIN usuarios u ON jts.jugador_id = u.id
      WHERE jts.torneo_id = ?
    `, [torneoId]);

    if (jugadores.length === 0) {
      return res.json(
        successResponse('No hay jugadores inscritos en este torneo', [])
      );
    }

    const [partidas] = await pool.execute(`
      SELECT
        jugador1_id,
        jugador2_id,
        puntos_victoria_j1,
        puntos_victoria_j2,
        puntos_torneo_j1,
        puntos_torneo_j2,
        puntos_masacre_j1,
        puntos_masacre_j2,
        warlord_muerto_j1,
        warlord_muerto_j2
      FROM partidas_saga
      WHERE torneo_id = ?
      `, [torneoId])

      if(partidas.length === 0){
        return res.json (
          successResponse('No hay partidas anotadas en este torneo', [])
        )
      }

      const clasificacionOrdenada = organizarClasificacion(jugadores, partidas)

      res.json(
          successResponse('Clasificación obtenida exitosamente', clasificacionOrdenada)
      )
      

  }catch (error){
    console.error('Error al obtener la clasificación', error)
    const mensaje = manejarErrorDB (error)
    res.status(500).json(errorResponse(mensaje))
  }
})

//===============================================================================
//===============================================================================
// 
// =====DESCARGAR PDF DE BASES DEL TORNEO=====

router.get('/:torneoId/bases-pdf', async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    const [result] = await pool.execute(
      'SELECT bases_torneo, bases_nombre FROM torneo_saga WHERE id = ?',
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