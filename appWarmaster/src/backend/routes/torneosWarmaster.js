import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { pool } from '../config/bd.js';
import { verificarToken } from '../middleware/auth.js';
import { 
  validarFecha,
  validarCamposRequeridos,
  errorResponse,
  successResponse,
  manejarErrorDB,
  paginar
} from '../utils/helpers.js';

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


//========================
//RUTAS TORNEOS WARMASTER
//========================

//=====OBTENER TORNEOS CON PAGINACIÓN=====

router.get('/obtenerTorneos', async (req, res) => {
  try {
    console.log('📥 GET /api/torneosWarmaster/obtenerTorneos');
    
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
    
    let whereClause = 'WHERE ts.sistema = "WARMASTER"';
    let queryParams = [userId];
    
    if (buscar.trim()) {
      whereClause += ' AND (ts.nombre_torneo LIKE ? OR ts.ubicacion LIKE ?)';
      const searchTerm = `%${buscar}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    queryParams.push(parseInt(limitNum), parseInt(offset));
    
    const [torneos] = await pool.query(`
      SELECT 
        ts.id,
        ts.nombre_torneo,
        ts.sistema,
        ts.tipo_torneo,
        ts.rondas_max,
        ts.ronda_actual,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_ejercito,
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
        COUNT(DISTINCT jtw.id) as total_participantes,
        MAX(CASE WHEN jtw.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_warmaster jtw ON ts.id = jtw.torneo_id
      ${whereClause}
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
      LIMIT ? OFFSET ?
    `, queryParams);
    
    console.log(`✅ ${torneos.length} torneos Warmaster obtenidos`);
    
    // Query para contar total
    let countParams = [];
    let countWhereClause = 'WHERE ts.sistema = "WARMASTER"';
    
    if (buscar.trim()) {
      countWhereClause += ' AND (ts.nombre_torneo LIKE ? OR ts.ubicacion LIKE ?)';
      const searchTerm = `%${buscar}%`;
      countParams = [searchTerm, searchTerm];
    }
    
    const [totalRows] = await pool.execute(`
      SELECT COUNT(DISTINCT ts.id) as total
      FROM torneos_sistemas ts 
      ${countWhereClause}
    `, countParams);
    
    const total = totalRows[0].total;
    const totalPages = Math.ceil(total / limitNum);
    
    res.json(
      successResponse('Torneos obtenidos exitosamente', {
        torneosWarmaster: torneos,
        paginacion: {
          paginaActual: parseInt(page),
          totalPaginas: totalPages,
          totalRegistros: total,
          registrosPorPagina: limitNum
        }
      })
    );
    
  } catch (error) {
    console.error('❌ Error al obtener torneos Warmaster:', error);
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
        ts.rondas_max,
        ts.ronda_actual,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_ejercito,
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
        COUNT(DISTINCT CASE WHEN ts.tipo_torneo = 'Individual' THEN jtw.id ELSE NULL END) as total_participantes,
        MAX(CASE WHEN jtw.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_warmaster jtw ON ts.id = jtw.torneo_id
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
      tipo_torneo = 'Individual',
      rondas_max,
      fecha_inicio, 
      fecha_fin, 
      ubicacion,
      puntos_ejercito,
      participantes_max,
      estado = 'pendiente',
      partida_ronda_1,
      partida_ronda_2,
      partida_ronda_3,
      partida_ronda_4,
      partida_ronda_5
    } = req.body;

    const camposFaltantes = validarCamposRequeridos(req.body, [
      'nombre_torneo',
      'rondas_max', 
      'fecha_inicio',
      'puntos_ejercito',
      'participantes_max',
      'partida_ronda_1',
      'partida_ronda_2',
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

    if (puntos_ejercito < 1000 || puntos_ejercito > 3000) {
      return res.status(400).json(
        errorResponse('Los puntos de ejercit deben estar entre 1000 y 3000')
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
      `INSERT INTO torneos_sistemas 
       (nombre_torneo, 
        sistema,
        tipo_torneo,
        rondas_max, 
        fecha_inicio, 
        fecha_fin, 
        ubicacion, 
        puntos_ejercito, 
        participantes_max, 
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_torneo, 
        'WARMASTER',
        tipo_torneo,
        rondas_max, 
        fecha_inicio, 
        fecha_fin || null, 
        ubicacion || null, 
        puntos_ejercito,
        participantes_max,
        estado,
        partida_ronda_1,
        partida_ronda_2,
        partida_ronda_3 || null,
        partida_ronda_4 || null,
        partida_ronda_5 || null,
        req.file ? req.file.buffer : null,
        req.file ? req.file.originalname : null,
        req.file ? req.file.size : null,
        req.usuario.userId
      ]
    );
    
    res.status(201).json(
      successResponse('Torneo creado exitosamente', {
        torneoId: resultado.insertId,
        nombre_torneo,
        tipo_torneo,
        sistema: 'WARMASTER',
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
      ronda_actual,
      fecha_inicio, 
      fecha_fin, 
      ubicacion,
      puntos_ejercito,
      participantes_max,
      estado,
      partida_ronda_1,
      partida_ronda_2,
      partida_ronda_3,
      partida_ronda_4,
      partida_ronda_5,
      eliminar_pdf
    } = req.body;
        
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
    
    if (rondas_max && (rondas_max < 2 || rondas_max > 5)) {
      return res.status(400).json(
        errorResponse('El número de rondas debe estar entre 2 y 5')
      );
    }

    if (puntos_ejercito && (puntos_ejercito < 1000 || puntos_ejercito > 3000)) {
      return res.status(400).json(
        errorResponse('Los puntos de banda deben estar entre 1000 y 3000')
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

    if (ronda_actual !== undefined) {
      camposActualizar.push('ronda_actual = ?');
      valores.push(ronda_actual);
    }
    
    if (fecha_inicio !== undefined) {
      camposActualizar.push('fecha_inicio = ?');
      valores.push(fecha_inicio);
    }

    if (fecha_fin !== undefined) {
      camposActualizar.push('fecha_fin = ?');
      valores.push(fecha_fin);
    }
    
    // ✅ IMPORTANTE: Guardar ubicacion
    if (ubicacion !== undefined) {
      console.log('🔄 Actualizando ubicacion a:', ubicacion);
      camposActualizar.push('ubicacion = ?');
      valores.push(ubicacion || null);
    }
    
    if (puntos_ejercito !== undefined) {
      camposActualizar.push('puntos_banda = ?');
      valores.push(puntos_ejercito);
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
    }
    else if (eliminar_pdf === 'true' || eliminar_pdf === true) {
      camposActualizar.push('bases_torneo = NULL');
      camposActualizar.push('bases_nombre = NULL');
      camposActualizar.push('base_tamaño = NULL');
      console.log('🗑️ Eliminando PDF existente');
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
    
    res.json(
      successResponse('Torneo actualizado exitosamente', {
        torneoId,
        ubicacion_actualizada: ubicacion !== undefined,
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

router.post('/:torneoId/inscripcion', verificarToken, upload.single('lista_ejercito'), async (req, res) => {
  try {
    const { torneoId } = req.params;
    const usuarioId = req.usuario.userId;
    const { ejercito } = req.body;

     if (!ejercito || !ejercito.trim()) {
      return res.status(400).json(
        errorResponse('El ejército es obligatorio')
      );
    }

    // Validar que el torneo existe 
    const [torneos] = await pool.execute(
      'SELECT nombre_torneo, puntos_ejercito FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );

    if (torneos.length === 0) {
      return res.status(404).json(
        errorResponse('Torneo no encontrado')
      );
    }

    const torneo = torneos[0];

    // Verificar si ya está inscrito
    const [inscripcionExistente] = await pool.execute(
      'SELECT id FROM jugador_torneo_warmaster WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, usuarioId]
    );

    if (inscripcionExistente.length > 0) {
      return res.status(400).json(
        errorResponse('Ya estás inscrito en este torneo')
      );
    }

     let listaEjercito = null;
    let listaNombre = null;
    let listaTamaño = null;

    if (req.file) {
      listaEjercito = req.file.buffer;
      listaNombre = req.file.originalname;
      listaTamaño = req.file.size;
      console.log(`📄 Lista recibida: ${listaNombre} (${listaTamaño} bytes)`);
    }
    
    // Insertar inscripción
    const [resultado] = await pool.execute(
      `INSERT INTO jugador_torneo_warmaster (
        torneo_id, 
        jugador_id, 
        ejercito,
        lista_ejercito,
        lista_nombre,
        lista_tamaño,
        pagado,
        puntos_victoria,
        puntos_masacre
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [
        torneoId,
        usuarioId,
       ejercito,
       listaEjercito,
       listaNombre,
       listaTamaño 
      ]
    );

    console.log(`✅ Usuario ${usuarioId} inscrito en torneo ${torneoId}`);

    res.json(
      successResponse('Inscripción realizada exitosamente', {
        inscripcionId: resultado.insertId,
        torneoId,
        torneoNombre: torneo.nombre_torneo,
        usuarioId,
        ejercito,
        tiene_lista_pdf: !!req.file
      })
    );

  } catch (error) {
    console.error('❌ Error al inscribirse:', error);
     if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(
          errorResponse('El archivo PDF excede el tamaño máximo de 16MB')
        );
      }
      return res.status(400).json(errorResponse(error.message));
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('Ya estás inscrito en este torneo')
      );
    }

    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// =====OBTENER MI INSCRIPCIÓN=====

router.get('/:torneoId/obtenerInscripcion', verificarToken, async (req, res) => {
    try {
        const { torneoId } = req.params;
        const jugadorId = req.usuario.userId;
        
        const [inscripcion] = await pool.execute(`
          SELECT 
            jtw.id,
            jtw.torneo_id,
            jtw.jugador_id,
            jtw.ejercito,
            jtw.lista_nombre,
            jtw.lista_tamaño,
            jtw.pagado,
            jtw.puntos_victoria,
            jtw.puntos_masacre,
            jtw.created_at
          FROM jugador_torneo_warmaster jtw
          WHERE jtw.torneo_id = ? AND jtw.jugador_id = ?
        `, [torneoId, jugadorId]);

        if (inscripcion.length === 0) {
          return res.status(404).json(
            errorResponse('No estás inscrito en este torneo')
          );
        }

        console.log(`✅ Inscripción encontrada`);

        res.json(
          successResponse('Inscripción obtenida exitosamente', inscripcion[0])
        );

      } catch (error) {
        console.error('❌ Error al obtener inscripción:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
      }
});

// =====ACTUALIZAR INSCRIPCIÓN=====

router.put('/:torneoId/actualizarInscripcion', verificarToken, upload.single('lista_ejercito'), async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { torneoId } = req.params;
        const jugadorId = req.usuario.userId

        const { ejercito } = req.body;

         if (!ejercito || !ejercito.trim()) {
            await connection.rollback();
            return res.status(400).json(
                errorResponse('El ejército es obligatorio')
            );
        }

        await connection.beginTransaction();

        // Verificar que está inscrito
        const [inscripcion] = await connection.execute(
            'SELECT id FROM jugador_torneo_warmaster WHERE torneo_id = ? AND jugador_id = ?',
            [torneoId, jugadorId]
        );

        if (inscripcion.length === 0) {
            await connection.rollback();
            return res.status(404).json(errorResponse('No estás inscrito en este torneo'));
        }

        const [torneos] = await connection.execute(`
            SELECT 
                ts.id,
                ts.nombre_torneo,
                ts.estado,
                ts.puntos_ejercito
            FROM torneos_sistemas ts
            WHERE ts.id = ? AND ts.sistema = "WARMASTER"
        `, [torneoId]);

          if (torneos.length === 0) {
            await connection.rollback();
            return res.status(404).json(errorResponse('Torneo no encontrado'));
          }
        
         if (torneos[0].estado !== 'pendiente') {
            await connection.rollback();
            return res.status(400).json(
                errorResponse('No se pueden modificar inscripciones. El torneo ya no está en estado pendiente')
            );
        }

       let updateFields = ['ejercito = ?'];
        let updateValues = [ejercito];

        if (req.file) {
            updateFields.push('lista_ejercito = ?');
            updateFields.push('lista_nombre = ?');
            updateFields.push('lista_tamaño = ?');
            updateValues.push(req.file.buffer, req.file.originalname, req.file.size);
            console.log(`📄 Nueva lista recibida: ${req.file.originalname} (${req.file.size} bytes)`);
        }

        updateValues.push(torneoId, jugadorId);

        // Actualizar inscripción
         const [resultado] = await connection.execute(`
            UPDATE jugador_torneo_warmaster 
            SET ${updateFields.join(', ')}
            WHERE torneo_id = ? AND jugador_id = ?
        `, updateValues);

        if (resultado.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json(errorResponse('Error al actualizar inscripción'));
        }

        await connection.commit();

        const [inscripcionActualizada] = await connection.execute(`
            SELECT 
                id,
                torneo_id,
                jugador_id,
                ejercito,
                lista_nombre,
                lista_tamaño,
                pagado,
                puntos_victoria,
                puntos_masacre,
                created_at
            FROM jugador_torneo_warmaster 
            WHERE torneo_id = ? AND jugador_id = ?
        `, [torneoId, jugadorId]);

        res.json(
            successResponse('Inscripción actualizada correctamente', {
                inscripcion: inscripcionActualizada[0],
                lista_actualizada: !!req.file
            })
        );

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al actualizar inscripción:', error);
        
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json(
                    errorResponse('El archivo PDF excede el tamaño máximo de 5MB')
                );
            }
            return res.status(400).json(errorResponse(error.message));
        }
        
        res.status(500).json(errorResponse('Error al actualizar inscripción'));
    } finally {
        connection.release();
    }
});

//======ACTUALIZAR EL PAGO INSCRIPCION (solo organizadores)=====

router.patch('/:torneoId/jugadores/:jugadorId/pago', verificarToken, async (req, res) => {
    try {
        const { torneoId, jugadorId } = req.params;
        const { pagado } = req.body;

        console.log('📥 Datos recibidos:', { torneoId, jugadorId, pagado, userId: req.userId }); // 👈 LOG

        // Validar valor
        if (!['pendiente', 'pagado'].includes(pagado)) {
            return res.status(400).json(errorResponse('Valor de pago inválido'));
        }

        const valorPagado = pagado === 'pagado' ? 1 : 0;

        // Verificar que el usuario es organizador del torneo
        const [torneo] = await pool.execute(
            'SELECT created_by FROM torneos_sistemas WHERE id = ?',
            [torneoId]
        );
        
        console.log('🏆 Torneo encontrado:', torneo[0]); // 👈 LOG
        
        if (!torneo[0]) { // 👈 AGREGAR VALIDACIÓN
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }
        
        if (torneo[0].created_by !== req.userId) {
            return res.status(403).json(errorResponse('No tienes permisos'));
        }

        // Actualizar estado de pago
        const [result] = await pool.execute(`
            UPDATE jugador_torneo_warmaster 
            SET pagado = ?
            WHERE torneo_id = ? AND id = ?
        `, [valorPagado, torneoId, jugadorId]);

        console.log('✅ Resultado UPDATE:', result); // 👈 LOG

        if (result.affectedRows === 0) {
            return res.status(404).json(errorResponse('Inscripción no encontrada'));
        }

        res.json(successResponse(`Estado de pago actualizado a: ${pagado}`));

    } catch (error) {
        console.error('❌ Error completo:', error); // 👈 LOG DETALLADO
        res.status(500).json(errorResponse('Error al actualizar estado de pago'));
    }
});

// ====== VERIFICAR SI TODOS LOS PARTICIPANTES HAN PAGADOS ======

router.get('/:torneoId/verificarPagos', verificarToken, async (req, res) => {
    try {
        const { torneoId } = req.params;
        const usuarioId = req.usuario.userId;

        console.log(`💰 Verificando pagos - Torneo ${torneoId}`);

        // Verificar que el torneo existe y que el usuario es el creador
        const [torneo] = await pool.execute(
            'SELECT id, tipo_torneo, created_by FROM torneos_sistemas WHERE id = ? AND sistema = "WARMASTER"',
            [torneoId]
        );

        if (!torneo.length) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }

        // Verificar que el usuario es el organizador
        if (torneo[0].created_by !== usuarioId) {
            return res.status(403).json(
                errorResponse('No tienes permisos para ver esta información')
            );
        }

        // Obtener estadísticas de pagos
        const [jugadores] = await pool.execute(
            `SELECT 
                COUNT(*) as total, 
                SUM(CASE WHEN pagado = 1 THEN 1 ELSE 0 END) as pagados 
            FROM jugador_torneo_warmaster 
            WHERE torneo_id = ?`,
            [torneoId]
        );

        const total = Number(jugadores[0].total);
        const pagados = Number(jugadores[0].pagados);
        const pendientes = total - pagados;
        const todosPagados = total > 0 && total === pagados;

        console.log(`✅ Total: ${total}, Pagados: ${pagados}, Pendientes: ${pendientes}`);

        return res.json(
            successResponse('Estadísticas de pago obtenidas', {
                todosPagados,
                total,
                pagados,
                pendientes
            })
        );

    } catch (error) {
        console.error('❌ Error al verificar pagos:', error);
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
      'SELECT COUNT(*) as total FROM jugador_torneo_warmaster WHERE torneo_id = ?',
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
    
    if (torneoExistente[0].created_by !== req.userId) {
      return res.status(403).json(
        errorResponse('Solo el creador del torneo puede eliminar participantes')
      );
    }
    
    const [participante] = await pool.execute(
      `SELECT jtw.id, jtw.jugador_id, u.nombre, u.apellidos 
       FROM jugador_torneo_warmaster jtw
       INNER JOIN usuarios u ON jtw.jugador_id = u.id
       WHERE jtw.torneo_id = ? AND jtw.id = ?`,
      [torneoId, jugadorId]
    );
    
    if (participante.length === 0) {
      return res.status(404).json(
        errorResponse('El jugador no está inscrito en este torneo')
      );
    }
    
    const jugadorInscritoId = participante[0].jugador_id
    const nombreJugador = `${participante[0].nombre} ${participante[0].apellidos || ''}`.trim();
    
    const [partidas] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM partidas_warmaster 
       WHERE torneo_id = ? AND (jugador1_id = ? OR jugador2_id = ?)`,
      [torneoId, jugadorInscritoId, jugadorInscritoId]
    );
    
    if (partidas[0].total > 0) {
      return res.status(400).json(
        errorResponse(`No se puede eliminar a ${nombreJugador} porque ya tiene ${partidas[0].total} partida(s) registrada(s) en este torneo`)
      );
    }
    
    await pool.execute(
      'DELETE FROM jugador_torneo_warmaster WHERE torneo_id = ? AND id = ?',
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
                jtw.id,
                jtw.jugador_id,
                u.nombre as jugador_nombre,
                u.apellidos as jugador_apellidos,
                u.nombre_alias,
                u.club,
                u.localidad,
                u.pais,
                jtw.ejercito,
                jtw.lista_ejercito,
                jtw.pagado,
                jtw.puntos_victoria,
                jtw.puntos_masacre,
                jtw.created_at as fecha_inscripcion
            FROM jugador_torneo_warmaster jtw
            INNER JOIN usuarios u ON jtw.jugador_id = u.id
            WHERE jtw.torneo_id = ?
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

router.get('/:torneoId/partidasTorneoWarmaster', async (req, res) => {
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
        pw.*,
        pw.nombre_partida,

        -- Jugador 1
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
        jtw1.ejercito as jugador1_ejercito
        
        -- Jugador 2
        CASE 
          WHEN pw.es_bye = TRUE THEN NULL
          ELSE u2.nombre
        END as jugador2_nombre,
        CASE 
          WHEN pw.es_bye = TRUE THEN NULL
          ELSE u2.apellidos
        END as jugador2_apellidos,
        CASE 
          WHEN pw.es_bye = TRUE THEN NULL
          ELSE u2.nombre_alias
        END as jugador2_alias,
        CASE 
          WHEN pw.es_bye = TRUE THEN NULL
          ELSE jtw2.ejercito
        END as jugador2_ejercito,
        
      FROM partidas_warmaster pw
      
      -- JOIN Jugador 1
      LEFT JOIN usuarios u1 ON pw.jugador1_id = u1.id
      LEFT JOIN jugador_torneo_warmaster jtw1 ON (jtw1.jugador_id = pw.jugador1_id AND jtw1.torneo_id = pw.torneo_id)
      
      -- JOIN Jugador 2
      LEFT JOIN usuarios u2 ON pw.jugador2_id = u2.id AND pw.es_bye = FALSE
      LEFT JOIN jugador_torneo_warmaster jtw2 ON (jtw2.jugador_id = pw.jugador2_id AND jtw2.torneo_id = pw.torneo_id)
      
      ${whereClause}
      ORDER BY pw.mesa, pw.id
    `, params);

    console.log(`📊 Partidas obtenidas: ${partidas.length}`);
    
    // Formatear con objetos anidados para jugador1 y jugador2
    const partidasFormateadas = partidas.map(p => ({
      ...p,
      jugador1: { ejercito: p.jugador1_ejercito || null },
      jugador2: p.jugador2_id ? { ejercito: p.jugador2_ejercito || null } : null
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

router.get('/:torneoId/partidasTorneoWarmaster/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    const [partidas] = await pool.execute(`
      SELECT 
        pw.*,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
        u2.nombre as jugador2_nombre,
        u2.apellidos as jugador2_apellidos,
        u2.nombre_alias as jugador2_alias,
        jtw1.ejercito as jugador1_ejercito,
        jtw2.ejercito as jugador2_ejercito,
        pw.ronda,
        ts.nombre_torneo
      FROM partidas_warmaster pw
      JOIN usuarios u1 ON pw.jugador1_id = u1.id
      JOIN usuarios u2 ON pw.jugador2_id = u2.id
      JOIN torneos_sistemas ts ON pw.torneo_id = ts.id
      LEFT JOIN jugador_torneo_warmaster jtw1 ON (pw.torneo_id = jtw1.torneo_id AND pw.jugador1_id = jtw1.jugador_id)
      LEFT JOIN jugador_torneo_warmaster jtw2 ON (pw.torneo_id = jtw2.torneo_id AND pw.jugador2_id = jtw2.jugador_id)
      WHERE pw.id = ?
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

router.put('/:torneoId/partidasTorneoWarmaster/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId, torneoId } = req.params;
    const { 
      puntos_masacre_j1,
      puntos_masacre_j2,
    } = req.body;
    
    // Validar campos requeridos
    const camposFaltantes = validarCamposRequeridos(req.body, [
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
        pw.id,
        pw.jugador1_id, 
        pw.jugador2_id, 
        pw.resultado_pw, 
        pw.torneo_id, 
        pw.ronda, 
        pw.resultado_confirmado,
        ts.tipo_torneo
        FROM partidas_warmaster pw
      INNER JOIN torneos_sistemas ts ON pw.torneo_id = t.id
      WHERE pw.id = ? AND torneo_id = ?
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

    // Calcular resultado basado en puntos de victoria
    const puntosMasacreJ1 = parseInt(puntos_masacre_j1) || 0;
    const puntosMasacreJ2 = parseInt(puntos_masacre_j2) || 0;

    let puntosVictoriaJ1, puntosVictoriaJ2, resultado;
    
    if (puntosMasacreJ1 > puntosMasacreJ2) {
      puntosVictoriaJ1 = 3;
      puntosVictoriaJ2 = 0;
      resultado = 'victoria_j1';
    } else if (puntosMasacreJ2 > puntosMasacreJ1) {
      puntosVictoriaJ1 = 0;
      puntosVictoriaJ2 = 3;
      resultado = 'victoria_j2';
    } else {
      puntosVictoriaJ1 = 1;
      puntosVictoriaJ2 = 1;
      resultado = 'empate';
    }

    // ✅ Actualizar la partida con la sintaxis SQL correcta
    await pool.execute(`
      UPDATE partidas_warmaster SET
        puntos_victoria_j1 = ?, 
        puntos_victoria_j2 = ?,
        puntos_masacre_j1 = ?, 
        puntos_masacre_j2 = ?,
        resultado_pw = ?, 
        resultado_confirmado = FALSE
      WHERE id = ?
    `, [
      puntosVictoriaJ1, 
      puntosVictoriaJ2,
      puntosMasacreJ1, 
      puntosMasacreJ2,
      resultado,
      partidaId
    ]);
    
    res.status(200).json(
      successResponse('Partida registrada exitosamente (pendiente de confirmación)', {
        partidaId,
        resultado,
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

router.patch('/:torneoId/partidasTorneoWarmaster/:partidaId/confirmar', verificarToken, async (req, res) => {

  let connection;
  
  try {
    connection = await pool.getConnection();
    const { torneoId, partidaId } = req.params;
    const { confirmar } = req.body;
    
    await connection.beginTransaction();
    
    // Verificar organizador y obtener partida
    const [verificacion] = await connection.execute(
      `SELECT 
        ts.created_by,
        pw.id, 
        pw.jugador1_id, 
        pw.jugador2_id,
        pw.puntos_victoria_j1, 
        pw.puntos_victoria_j2,
        pw.puntos_masacre_j1, 
        pw.puntos_masacre_j2,
        pw.resultado_confirmado,
        pw.resultado_pw,
        pw.es_bye
      FROM torneos_sistemas ts
      INNER JOIN partidas_warmaster pw ON pw.torneo_id = ts.id
      WHERE ts.id = ? AND pw.id = ?`,
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

    let j1Gana, j1Empata, j1Pierde = 0;
    let j2Gana, j2Empata, j2Pierde = 0;

    if (esBye) {
      j1Gana = 1;
    } else {
      switch (partidaData.resultado_pw) {
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
      // Actualizar jugador_torneo_warmaster J1
      await connection.execute(`
        UPDATE jugador_torneo_warmaster 
        SET puntos_victoria = puntos_victoria + ?,
            puntos_masacre = puntos_masacre + ?,
        WHERE jugador_id = ? AND torneo_id = ?
      `, [
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.jugador1_id,
        torneoId
      ]);
      
      await connection.execute(`
        INSERT INTO clasificacion_jugadores_warmaster (
            torneo_id, jugador_id, partidas_jugadas, partidas_ganadas, 
            partidas_empatadas, partidas_perdidas, puntos_victoria_totales, 
            puntos_masacre_totales
          )
        VALUES (?, ?, 1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          partidas_jugadas = partidas_jugadas + 1,
          partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
          partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
          partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
          puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
          puntos_masacre_totales = puntos_masacre_totales + VALUES(puntos_masacre_totales),
      `, [
        torneoId, partidaData.jugador1_id, j1Gana, j1Empata, j1Pierde,
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,     
      ]);
      
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_warmaster
          SET puntos_victoria = puntos_victoria + ?,
              puntos_masacre = puntos_masacre + ?,
          WHERE jugador_id = ? AND torneo_id = ?
        `, [
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.jugador2_id,
          torneoId
        ]);

        await connection.execute(`
          INSERT INTO clasificacion_jugadores_warmaster (
             torneo_id, jugador_id, partidas_jugadas, partidas_ganadas, 
             partidas_empatadas, partidas_perdidas, puntos_victoria_totales, 
             puntos_masacre_totales
          )
          VALUES (?, ?, 1, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            partidas_jugadas = partidas_jugadas + 1,
            partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
            partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
            partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
            puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
            puntos_masacre_totales = puntos_masacre_totales + VALUES(puntos_masacre_totales),
        `, [
          torneoId, partidaData.jugador2_id, j2Gana, j2Empata, j2Pierde,
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
        ]);
      }
      
    } else {
      // DESCONFIRMAR
      await connection.execute(`
        UPDATE jugador_torneo_warmaster
        SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
            puntos_masacre = GREATEST(0, puntos_masacre - ?),
        WHERE jugador_id = ? AND torneo_id = ?
      `, [
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.jugador1_id,
        torneoId
      ]);
      
      await connection.execute(`
        UPDATE clasificacion_jugadores_warmaster 
        SET 
          partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
          partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
          partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
          partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
          puntos_victoria_totales = GREATEST(0, puntos_victoria_totales - ?)
          puntos_masacre_totales = GREATEST(0, puntos_masacre_totales - ?),
        WHERE torneo_id = ? AND jugador_id = ?
      `, [
        j1Gana, j1Empata, j1Pierde,
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        torneoId,
        partidaData.jugador1_id
      ]);
      
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_warmaster
          SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
              puntos_masacre = GREATEST(0, puntos_masacre - ?),
          WHERE jugador_id = ? AND torneo_id = ?
        `, [
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.jugador2_id,
          torneoId
        ]);
        
        await connection.execute(`
          UPDATE clasificacion_jugadores_warmaster 
          SET 
            partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
            partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
            partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
            partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
            puntos_victoria_totales = GREATEST(0, puntos_victoria_totales - ?),
            puntos_masacre_totales = GREATEST(0, puntos_masacre_totales - ?),
          WHERE torneo_id = ? AND jugador_id = ?
        `, [    
          j2Gana, j2Empata, j2Pierde,
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          torneoId,
          partidaData.jugador2_id
        ]);
      }
    }
   
    await connection.execute(
      'UPDATE partidas_warmaster SET resultado_confirmado = ? WHERE id = ?',
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

// ======= OBTENER EMPAREJAMIENTOS DE RONDA INDIVIDUALES (GET) =======

router.get('/:torneoId/obtenerEmparejamientosIndividuales', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    let whereClause = 'WHERE pw.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND pw.ronda = ?';
      params.push(ronda);
    }

    const queryConJoins = `
      SELECT 
        pw.*,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u2.nombre as jugador2_nombre,
        u2.apellidos as jugador2_apellidos
      FROM partidas_warmaster pw
      LEFT JOIN usuarios u1 ON pw.jugador1_id = u1.id
      LEFT JOIN usuarios u2 ON pw.jugador2_id = u2.id AND pw.es_bye = FALSE
      ${whereClause}
      ORDER BY pw.mesa, pw.id
    `;
    
    const [partidasConJoins] = await pool.execute(queryConJoins, params);
    
    res.json(partidasConJoins);
    
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
      'DELETE FROM partidas_warmaster WHERE torneo_id = ? AND ronda = ?',
      [torneoId, ronda]
    );
    
    // 2. Insertar nuevos emparejamientos
    for (const partida of emparejamientos) {
      const jugador1_id = partida.jugador1_id;
      const jugador2_id = partida.jugador2_id || null;
      const es_bye = !jugador2_id;
      
      const insertQuery = `
        INSERT INTO partidas_warmaster (
          torneo_id, 
          jugador1_id, 
          jugador2_id,
          ronda, 
          mesa, 
          nombre_partida,
          es_bye,
          resultado_pw,
          puntos_victoria_j1,
          puntos_victoria_j2,
          puntos_masacre_j1,
          puntos_masacre_j2,
          resultado_confirmado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(insertQuery, [
        torneoId,
        jugador1_id,
        jugador2_id, 
        ronda,
        partida.mesa || null,
        partida.nombre_partida || 'Partida sin nombre',
        es_bye,
        es_bye ? 'victoria_j1' : 'pendiente',
        es_bye ? 3 : 0,
        0,
        es_bye ?  150 : 0,
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

// ======ELIMINAR PARTIDA======

router.delete('/:torneoId/partidasTorneoWarmaster/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    // Verificar que la partida existe y permisos
    const [partidaExistente] = await pool.execute(`
      SELECT pw.*, ts.created_by
      FROM partidas_warmaster pw
      JOIN torneos_sistemas ts ON pw.torneo_id = ts.id
      WHERE pw.id = ?
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
    await pool.execute('DELETE FROM partidas_warmaster WHERE id = ?', [partidaId]);
    
    res.json(
      successResponse('Partida eliminada exitosamente')
    );
    
  } catch (error) {
    console.error('Error al eliminar partida:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

//=======OBTENER CLASIFICACION=========

router.get('/:torneoId/obtenerClasificacionIndividual', async (req, res) =>{

  try {

     const { torneoId } = req.params;

        const [clasificacion] = await pool.execute(`
            SELECT 
                cjw.id,
                cjw.jugador_id,
                cjw.equipo_id,
                cjw.partidas_ganadas,
                cjw.partidas_empatadas,
                cjw.partidas_perdidas,
                u.nombre as jugador_nombre,
                u.apellidos as jugador_apellidos,
                u.club,
                jtw.ejercito,
                COALESCE(cjw.partidas_jugadas, 0) as partidas_jugadas,
                 COALESCE(cjw.partidas_ganadas, 0) as jugador_partidas_ganadas,
                COALESCE(cjw.partidas_empatadas, 0) as jugador_partidas_empatadas,
                COALESCE(cjw.partidas_perdidas, 0) as jugador_partidas_perdidas,
                COALESCE(cjw.puntos_victoria_totales, 0) as puntos_victoria_totales,
                COALESCE(cjw.puntos_masacre_totales, 0) as puntos_masacre_totales,
              FROM clasificacion_jugadores_warmaster cjw
                INNER JOIN usuarios u 
                  ON cjw.jugador_id = u.id
                LEFT JOIN jugador_torneo_warmaster jtw
                  ON cjw.jugador_id = jtw.jugador_id
                  AND cjw.torneo_id = jtw.torneo_id 
              WHERE cjw.torneo_id = ?
        `, [torneoId]);


        res.json(successResponse('La clasificación obtenida es: ',  clasificacion))

  }catch(error){
        console.error('❌ Error COMPLETO al obtener la clasificación:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        res.status(500).json(errorResponse('Error al obtener la clasificación'));
  }
})

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

// =====DESCARGAR PDF DE LISTAS DE EJERCITO=====

router.get('/:torneoId/listasEjercitos-pdf/:jugadorId', verificarToken, async (req, res) => {
  try {
    const { torneoId, jugadorId } = req.params;
    const usuarioActual = req.usuario.userId;
    
    // Verificar permisos (solo el jugador o el organizador pueden descargar)
    const [torneo] = await pool.execute(
      'SELECT created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    const esOrganizador = torneo[0].created_by === usuarioActual;
    const esMiLista = parseInt(jugadorId) === usuarioActual;
    
    if (!esOrganizador && !esMiLista) {
      return res.status(403).json(
        errorResponse('No tienes permiso para descargar esta lista')
      );
    }
    
    // Obtener la lista del jugador (nota: AND en lugar de coma)
    const [result] = await pool.execute(
      'SELECT lista_ejercito, lista_nombre FROM jugador_torneo_warmaster WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, jugadorId]
    );
    
    if (result.length === 0) {
      return res.status(404).json(errorResponse('Inscripción no encontrada'));
    }
    
    const inscripcion = result[0];
    
    // Verificar que tenga PDF
    if (!inscripcion.lista_ejercito) {
      return res.status(404).json(errorResponse('Este jugador no ha subido lista de ejército'));
    }
    
    // Enviar el PDF (buffer, no el nombre)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${inscripcion.lista_nombre || 'lista_ejercito.pdf'}"`);
    res.send(inscripcion.lista_ejercito); // ✅ Enviar el buffer del PDF
    
  } catch (error) {
    console.error('❌ Error al descargar PDF:', error);
    res.status(500).json(errorResponse('Error al descargar el PDF'));
  }
});


export default router;