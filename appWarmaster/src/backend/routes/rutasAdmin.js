import express from 'express';
import { pool } from '../config/bd.js';
import { verificarToken, verificarSuperAdmin } from '../middleware/auth.js';
import multer from 'multer';
import { 
  validarFecha, 
  limpiarFecha, 
  errorResponse, 
  successResponse 
} from '../utils/helpers.js';
import { enviarInvitacionOrganizadorNoRegistrado, enviarInvitacionOrganizadorRegistrado } from '../utils/emailInvitarOrganizador.js'; 

// Configuración de multer para PDFs
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

const router = express.Router();

//------USUARIOS-------
// OBTERNER TODOS LOS USUARIOS

router.get('/usuarios', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const [usuarios] = await pool.query(`
      SELECT 
        id, 
        nombre,
        apellidos,
        nombre_alias,
        club, 
        email, 
        rol, 
        estado_cuenta,
        localidad,
        pais,
        created_at
      FROM usuarios 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      usuarios
    });
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
});

// ACTUALIZAR USUARIOS

router.put('/usuarios/:id', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo } = req.body;
    
    // Verificar que no se modifique a sí mismo si intenta cambiar su rol
    if (parseInt(id) === req.userId && rol !== req.userRole) {
      return res.status(400).json({
        success: false,
        error: 'No puedes cambiar tu propio rol'
      });
    }
    
    await pool.query(
      'UPDATE usuarios SET nombre = ?, apellidos = ?, nombre_alias = ?, club = ? email = ?, estado_cuenta = ?, rol = ?, codigo_postal = ?, localidad = ?, pais = ?  WHERE id = ?',
      [nombre, apellidos, nombre_alias, club, email, estado_cuenta, rol, codigo_postal, localidad, pais, id]
    );
    
    res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario'
    });
  }
});

// ELIMINAR USUARIO

router.delete('/usuarios/:id', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que no se elimine a sí mismo
    if (parseInt(id) === req.userId) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar tu propia cuenta'
      });
    }
    
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario'
    });
  }
});

//------TORNEOS-------
// ===== OBTENER TODOS LOS TORNEOS (para superadmin) =====

router.get('/torneos', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const { sistema, estado, page = 1, limit = 20 } = req.query;
    
    // Construir WHERE clause dinámicamente
    let whereConditions = [];
    let queryParams = [];
    
    if (sistema) {
      whereConditions.push('ts.sistema = ?');
      queryParams.push(sistema);
    }
    
    if (estado) {
      whereConditions.push('ts.estado = ?');
      queryParams.push(estado);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Paginación
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;
    
    // Query principal: obtener torneos con datos básicos
    const [torneos] = await pool.query(`
      SELECT 
        ts.*,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.email as creador_email,
        u.club as creador_club,
        
        -- Contar participantes según el sistema
        CASE 
            WHEN ts.sistema = 'SAGA' THEN (
                SELECT COUNT(DISTINCT jts.id) 
                FROM jugador_torneo_saga jts 
                WHERE jts.torneo_id = ts.id
          )
            WHEN ts.sistema = 'WARMASTER' THEN (
                SELECT COUNT(DISTINCT jtw.id) 
                FROM jugador_torneo_warmaster jtw 
                WHERE jtw.torneo_id = ts.id
          )
            WHEN ts.sistema = 'FOW' THEN (
                SELECT COUNT(DISTINCT jtf.id) 
                FROM jugador_torneo_fow jtf 
                WHERE jtf.torneo_id = ts.id
          )
          ELSE 0
        END as num_participantes,
        
        -- Contar equipos (solo para torneos por equipos)
        CASE 
          WHEN ts.tipo_torneo = 'Por equipos' AND ts.sistema = 'SAGA' THEN (
            SELECT COUNT(DISTINCT tse.id) 
            FROM torneo_saga_equipo tse 
            WHERE tse.torneo_id = ts.id
          )
          ELSE 0
        END as num_equipos
        
      FROM torneos_sistemas ts
      LEFT JOIN usuarios u ON ts.created_by = u.id
      ${whereClause}
      ORDER BY ts.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limitNum, offset]);
    
    // Si no hay torneos, devolver respuesta vacía
    if (torneos.length === 0) {
      return res.json({
        success: true,
        torneos: [],
        paginacion: {
          paginaActual: parseInt(page),
          totalPaginas: 0,
          totalRegistros: 0,
          registrosPorPagina: limitNum
        }
      });
    }
    
    // Obtener IDs de torneos para la siguiente query
    const torneoIds = torneos.map(t => t.id);
    const placeholders = torneoIds.map(() => '?').join(',');
    
    // Query secundaria: obtener TODOS los organizadores de estos torneos
    const [organizadores] = await pool.query(`
      SELECT 
        ot.torneo_id,
        ot.usuario_id,
        ot.fecha_asignacion,
        u.nombre,
        u.apellidos,
        u.email,
        u.estado_cuenta,
        ts.created_by = ot.usuario_id as es_creador
      FROM organizadores_torneos ot
      INNER JOIN usuarios u ON ot.usuario_id = u.id
      INNER JOIN torneos_sistemas ts ON ot.torneo_id = ts.id
      WHERE ot.torneo_id IN (${placeholders})
      ORDER BY ot.fecha_asignacion ASC
    `, torneoIds);
    
    // Obtener épocas para torneos SAGA
    const torneosSaga = torneos.filter(t => t.sistema === 'SAGA').map(t => t.id);
    let epocasPorTorneo = new Map();
    
    if (torneosSaga.length > 0) {
      const sagaPlaceholders = torneosSaga.map(() => '?').join(',');
      const [epocas] = await pool.query(`
        SELECT torneo_id, GROUP_CONCAT(epoca ORDER BY epoca SEPARATOR '|') as epocas
        FROM torneo_saga_epocas
        WHERE torneo_id IN (${sagaPlaceholders})
        GROUP BY torneo_id
      `, torneosSaga);
      
      epocas.forEach(e => {
        epocasPorTorneo.set(e.torneo_id, e.epocas ? e.epocas.split('|') : []);
      });
    }
    
    // Agrupar organizadores por torneo
    const organizadoresPorTorneo = new Map();
    organizadores.forEach(org => {
      if (!organizadoresPorTorneo.has(org.torneo_id)) {
        organizadoresPorTorneo.set(org.torneo_id, []);
      }
      
      organizadoresPorTorneo.get(org.torneo_id).push({
        usuario_id: org.usuario_id,
        nombre: `${org.nombre} ${org.apellidos}`.trim(),
        email: org.email,
        estado_cuenta: org.estado_cuenta,
        es_creador: Boolean(org.es_creador),
        fecha_asignacion: org.fecha_asignacion,
        rol: org.es_creador ? 'creador' : 'organizador'
      });
    });
    
    // Combinar toda la información
    const torneosCompletos = torneos.map(torneo => {
      const organizadoresList = organizadoresPorTorneo.get(torneo.id) || [];
      const creador = organizadoresList.find(o => o.es_creador);
      const organizadoresSecundarios = organizadoresList.filter(o => !o.es_creador);
      
      return {
        ...torneo,
        creador: creador || {
          nombre: torneo.creador_nombre ? `${torneo.creador_nombre} ${torneo.creador_apellidos}`.trim() : 'Desconocido',
          email: torneo.creador_email,
          club: torneo.creador_club
        },
        organizadores: {
          total: organizadoresList.length,
          activos: organizadoresList.filter(o => o.estado_cuenta === 'activo').length,
          pendientes: organizadoresList.filter(o => o.estado_cuenta === 'pendiente_registro').length,
          lista: organizadoresList
        },
        // Añadir épocas si es SAGA
        ...(torneo.sistema === 'SAGA' && {
          epocas_disponibles: epocasPorTorneo.get(torneo.id) || []
        }),
        // Limpiar campos redundantes
        creador_nombre: undefined,
        creador_apellidos: undefined,
        creador_email: undefined,
        creador_club: undefined
      };
    });
    
    // Contar total de registros para paginación
    const [totalRows] = await pool.query(`
      SELECT COUNT(DISTINCT ts.id) as total
      FROM torneos_sistemas ts
      ${whereClause}
    `, queryParams);
    
    const total = totalRows[0].total;
    const totalPages = Math.ceil(total / limitNum);
    
    console.log(`✅ ${torneosCompletos.length} torneos obtenidos (superadmin)`);
    
    res.json({
      success: true,
      torneos: torneosCompletos,
      paginacion: {
        paginaActual: parseInt(page),
        totalPaginas: totalPages,
        totalRegistros: total,
        registrosPorPagina: limitNum
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener torneos (superadmin):', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener torneos'
    });
  }
});

// ===== OBTENER ESTADÍSTICAS GENERALES =====

router.get('/estadisticas', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        -- Usuarios
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'organizador') as total_organizadores,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'superadmin') as total_superadmins,
        (SELECT COUNT(*) FROM usuarios WHERE estado_cuenta = 'activo') as usuarios_activos,
        (SELECT COUNT(*) FROM usuarios WHERE estado_cuenta = 'pendiente_registro') as usuarios_pendientes,
        
        -- Torneos
        (SELECT COUNT(*) FROM torneos_sistemas) as total_torneos,
        (SELECT COUNT(*) FROM torneos_sistemas WHERE estado = 'pendiente') as torneos_pendientes,
        (SELECT COUNT(*) FROM torneos_sistemas WHERE estado = 'en_curso') as torneos_en_curso,
        (SELECT COUNT(*) FROM torneos_sistemas WHERE estado = 'finalizado') as torneos_finalizados,
        
        -- Torneos por sistema
        (SELECT COUNT(*) FROM torneos_sistemas WHERE sistema = 'SAGA') as torneos_saga,
        (SELECT COUNT(*) FROM torneos_sistemas WHERE sistema = 'WARMASTER') as torneos_warmaster,
        (SELECT COUNT(*) FROM torneos_sistemas WHERE sistema = 'FOW') as torneos_fow,
        
        -- Participantes
        (SELECT COUNT(*) FROM jugador_torneo_saga) as total_inscripciones_saga,
        (SELECT COUNT(*) FROM jugador_torneo_warmaster) as total_inscripciones_warmaster
    `);
    
    res.json({
      success: true,
      estadisticas: stats[0]
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// ===== ACTUALIZAR CUALQUIER TORNEO (superadmin) =====

router.put('/torneos/:torneoId', verificarToken, verificarSuperAdmin, upload.single('bases_pdf'), async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    const { 
      nombre_torneo,
      sistema,
      tipo_torneo,
      num_jugadores_equipo,
      rondas_max,
      ronda_actual,
      fecha_inicio,
      fecha_fin,
      ubicacion,
      puntos_banda,        // Para SAGA
      puntos_ejercito,     // Para WARMASTER, FOW, BOLT
      participantes_max,
      equipos_max,
      estado,
      partida_ronda_1,
      partida_ronda_2,
      partida_ronda_3,
      partida_ronda_4,
      partida_ronda_5,
      epocas_disponibles: epocas_raw,  // Para SAGA
      eliminar_pdf
    } = req.body;

    // ✅ Verificar que el torneo existe
    const [torneoExistente] = await pool.execute(
      'SELECT id, sistema, tipo_torneo, created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneoExistente.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const torneoActual = torneoExistente[0];
    const sistemaActual = torneoActual.sistema;

    // ✅ Parsear épocas si vienen (solo para SAGA)
    let epocas_disponibles;
    if (epocas_raw && sistemaActual === 'SAGA') {
      if (typeof epocas_raw === 'string') {
        try {
          epocas_disponibles = JSON.parse(epocas_raw);
        } catch (e) {
          epocas_disponibles = epocas_raw.split('|').map(e => e.trim()).filter(e => e);
        }
      } else if (Array.isArray(epocas_raw)) {
        epocas_disponibles = epocas_raw;
      }
    }

    // ✅ VALIDACIONES GENERALES
    
    if (tipo_torneo === 'Por equipos' && num_jugadores_equipo) {
      const numJugadores = parseInt(num_jugadores_equipo);
      
      if (isNaN(numJugadores) || numJugadores < 2 || numJugadores > 6) {
        return res.status(400).json(
          errorResponse('El número de jugadores por equipo debe estar entre 2 y 6')
        );
      }

      // Para SAGA, validar que haya suficientes épocas
      if (sistemaActual === 'SAGA' && epocas_disponibles && Array.isArray(epocas_disponibles)) {
        if (epocas_disponibles.length < numJugadores) {
          return res.status(400).json(
            errorResponse(`Debe tener al menos ${numJugadores} épocas para ${numJugadores} jugadores`)
          );
        }
      }
    }

    if (rondas_max && (rondas_max < 2 || rondas_max > 5)) {
      return res.status(400).json(
        errorResponse('El número de rondas debe estar entre 2 y 5')
      );
    }

    // Validación específica según sistema
    if (puntos_banda && sistemaActual === 'SAGA') {
      if (puntos_banda < 4 || puntos_banda > 8) {
        return res.status(400).json(
          errorResponse('Los puntos de banda deben estar entre 4 y 8 (SAGA)')
        );
      }
    }

    if (puntos_ejercito && (sistemaActual === 'WARMASTER' || sistemaActual === 'FOW')) {
      if (puntos_ejercito < 1000 || puntos_ejercito > 3000) {
        return res.status(400).json(
          errorResponse('Los puntos de ejército deben estar entre 1000 y 3000')
        );
      }
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

    // ✅ CONSTRUIR UPDATE DINÁMICO
    const camposActualizar = [];
    const valores = [];

    if (nombre_torneo !== undefined) {
      camposActualizar.push('nombre_torneo = ?');
      valores.push(nombre_torneo);
    }

    if (sistema !== undefined) {
      camposActualizar.push('sistema = ?');
      valores.push(sistema);
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
      valores.push(limpiarFecha ? limpiarFecha(fecha_inicio) : fecha_inicio);
    }

    if (fecha_fin !== undefined) {
      camposActualizar.push('fecha_fin = ?');
      valores.push(limpiarFecha ? limpiarFecha(fecha_fin) : fecha_fin);
    }

    if (ubicacion !== undefined) {
      camposActualizar.push('ubicacion = ?');
      valores.push(ubicacion || null);
    }

    // Puntos según sistema
    if (puntos_banda !== undefined && sistemaActual === 'SAGA') {
      camposActualizar.push('puntos_banda = ?');
      valores.push(puntos_banda);
    }

    if (puntos_ejercito !== undefined && (sistemaActual === 'WARMASTER' || sistemaActual === 'FOW')) {
      camposActualizar.push('puntos_ejercito = ?');
      valores.push(puntos_ejercito);
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

    // Manejo de PDF
    if (req.file) {
      camposActualizar.push('bases_torneo = ?');
      valores.push(req.file.buffer);
      
      camposActualizar.push('bases_nombre = ?');
      valores.push(req.file.originalname);
      
      camposActualizar.push('base_tamaño = ?');
      valores.push(req.file.size);
    } else if (eliminar_pdf === 'true' || eliminar_pdf === true) {
      camposActualizar.push('bases_torneo = NULL');
      camposActualizar.push('bases_nombre = NULL');
      camposActualizar.push('base_tamaño = NULL');
      console.log('🗑️ Eliminando PDF existente');
    }

    // ✅ EJECUTAR UPDATE SI HAY CAMBIOS
    if (camposActualizar.length > 0) {
      valores.push(torneoId);
      await pool.execute(
        `UPDATE torneos_sistemas SET ${camposActualizar.join(', ')} WHERE id = ?`,
        valores
      );
      console.log(`✅ Torneo ${torneoId} actualizado por superadmin`);
    }

    // ✅ ACTUALIZAR ÉPOCAS (solo para SAGA)
    if (sistemaActual === 'SAGA' && epocas_disponibles && Array.isArray(epocas_disponibles)) {
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

    // ✅ Obtener el torneo actualizado completo
    const [torneoActualizado] = await pool.query(`
      SELECT 
        ts.*,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.email as creador_email
      FROM torneos_sistemas ts
      LEFT JOIN usuarios u ON ts.created_by = u.id
      WHERE ts.id = ?
    `, [torneoId]);

    // Obtener épocas si es SAGA
    let epocasActualizadas = [];
    if (sistemaActual === 'SAGA') {
      const [epocas] = await pool.query(
        'SELECT epoca FROM torneo_saga_epocas WHERE torneo_id = ?',
        [torneoId]
      );
      epocasActualizadas = epocas.map(e => e.epoca);
    }

    console.log(`✅ Torneo ${torneoId} (${sistemaActual}) actualizado exitosamente por superadmin`);

    res.json(
      successResponse('Torneo actualizado exitosamente', {
        torneo: {
          ...torneoActualizado[0],
          ...(sistemaActual === 'SAGA' && { epocas_disponibles: epocasActualizadas })
        },
        cambios: {
          campos_actualizados: camposActualizar.length,
          epocas_actualizadas: sistemaActual === 'SAGA' && !!epocas_disponibles,
          pdf_actualizado: !!req.file,
          pdf_eliminado: eliminar_pdf === 'true' || eliminar_pdf === true
        }
      })
    );

  } catch (error) {
    console.error('❌ Error al actualizar torneo (superadmin):', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(
          errorResponse('El archivo PDF excede el tamaño máximo de 16MB')
        );
      }
      return res.status(400).json(errorResponse(error.message));
    }
    
    if (error.message === 'Solo se permiten archivos PDF') {
      return res.status(400).json(errorResponse(error.message));
    }

    res.status(500).json(
      errorResponse('Error al actualizar torneo', error.message)
    );
  }
});

// ===== ELIMINAR TORNEO (superadmin) =====

router.delete('/torneos/:torneoId', verificarToken, verificarSuperAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    
    await connection.beginTransaction();
    
    // Verificar que existe
    const [torneo] = await connection.execute(
      'SELECT id, nombre_torneo, sistema FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneo.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const torneoData = torneo[0];
    const sistema = torneoData.sistema;

    // Eliminar registros relacionados según el sistema
    if (sistema === 'SAGA') {
      await connection.execute('DELETE FROM partidas_saga WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM clasificacion_jugadores_saga WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM clasificacion_equipos_saga WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM equipo_miembros WHERE equipo_id IN (SELECT id FROM torneo_saga_equipo WHERE torneo_id = ?)', [torneoId]);
      await connection.execute('DELETE FROM torneo_saga_equipo WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM jugador_torneo_saga WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM torneo_saga_epocas WHERE torneo_id = ?', [torneoId]);
    } else if (sistema === 'WARMASTER') {
      await connection.execute('DELETE FROM partidas_warmaster WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM clasificacion_jugadores_warmaster WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM jugador_torneo_warmaster WHERE torneo_id = ?', [torneoId]);
    } else if (sistema === 'FOW') {
      await connection.execute('DELETE FROM partidas_fow WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM clasificacion_jugadores_fow WHERE torneo_id = ?', [torneoId]);
      await connection.execute('DELETE FROM jugador_torneo_fow WHERE torneo_id = ?', [torneoId]);
    }
    // Añadir más sistemas según necesites

    // Eliminar organizadores
    await connection.execute('DELETE FROM organizadores_torneos WHERE torneo_id = ?', [torneoId]);
    
    // Eliminar torneo
    await connection.execute('DELETE FROM torneos_sistemas WHERE id = ?', [torneoId]);
    
    await connection.commit();
    
    console.log(`🗑️ Torneo ${torneoId} (${sistema}) eliminado por superadmin: "${torneoData.nombre_torneo}"`);
    
    res.json(
      successResponse(`Torneo "${torneoData.nombre_torneo}" eliminado exitosamente`, {
        torneoId,
        sistema,
        nombre: torneoData.nombre_torneo
      })
    );
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al eliminar torneo:', error);
    res.status(500).json(errorResponse('Error al eliminar torneo'));
  } finally {
    connection.release();
  }
});

//===== OBTENER ORGANIZADORES (SUPERADMIN) =====

router.get('/torneos/:torneoId/organizadores', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const { torneoId } = req.params;

    // Verificar que el torneo existe
    const [torneo] = await pool.execute(
      'SELECT id, created_by, nombre_torneo FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );

    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const creadorId = torneo[0].created_by;
    const nombreTorneo = torneo[0].nombre_torneo;

    // Obtener TODOS los organizadores
    const [organizadores] = await pool.execute(
      `SELECT 
        ot.id as organizador_id,
        ot.torneo_id,
        ot.usuario_id,
        ot.fecha_asignacion,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.email,
        u.estado_cuenta,
        u.password,
        u.rol
      FROM organizadores_torneos ot
      INNER JOIN usuarios u ON ot.usuario_id = u.id
      WHERE ot.torneo_id = ?
      ORDER BY ot.fecha_asignacion ASC`,
      [torneoId]
    );

    // Procesar organizadores
    const organizadoresConInfo = organizadores.map(org => {
      const esCreador = org.usuario_id === creadorId;
      const esPendienteInvitacion = org.password && org.password.startsWith('TEMP_');
      
      let nombreCompleto;
      if (esPendienteInvitacion) {
        nombreCompleto = org.email;
      } else {
        nombreCompleto = org.nombre_alias || 
                        `${org.nombre || ''} ${org.apellidos || ''}`.trim() || 
                        org.email;
      }

      return {
        organizador_id: org.organizador_id,
        usuario_id: org.usuario_id,
        nombre_usuario: nombreCompleto,
        email: org.email,
        estado_cuenta: org.estado_cuenta,
        fecha_asignacion: org.fecha_asignacion,
        es_creador: esCreador,
        es_invitacion_pendiente: esPendienteInvitacion,
        rol: esCreador ? 'creador' : 'organizador',
        rol_usuario: org.rol
      };
    });

    // Separar por estado
    const activos = organizadoresConInfo.filter(org => 
      org.estado_cuenta === 'activo' && !org.es_invitacion_pendiente
    );
    
    const pendientes = organizadoresConInfo.filter(org => 
      org.estado_cuenta === 'pendiente_registro' || org.es_invitacion_pendiente
    );

    console.log(`👑 SuperAdmin consultó organizadores del torneo ${torneoId}:`);
    console.log(`  ✅ Activos: ${activos.length}`);
    console.log(`  ⏳ Pendientes: ${pendientes.length}`);

    res.json(successResponse('Organizadores obtenidos', {
      torneo: {
        id: torneoId,
        nombre: nombreTorneo
      },
      activos,
      pendientes,
      total: organizadoresConInfo.length
    }));

  } catch (error) {
    console.error('❌ Error al obtener organizadores (superadmin):', error);
    res.status(500).json(errorResponse('Error al obtener organizadores'));
  }
});

// ===== AGREGAR ORGANIZADORES (SUPERADMIN) =====

router.post('/torneos/:torneoId/organizadores', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json(errorResponse('El email es obligatorio'));
    }

    const emailLimpio = email.toLowerCase().trim();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLimpio)) {
      return res.status(400).json(errorResponse('Email inválido'));
    }

    // Verificar que el torneo existe
    const [torneo] = await pool.execute(
      `SELECT 
        id, 
        nombre_torneo,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        tipo_torneo,
        rondas_max,
        created_by
      FROM torneos_sistemas 
      WHERE id = ?`,
      [torneoId]
    );

    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const nombreTorneo = torneo[0].nombre_torneo;

    // Verificar si el usuario existe
    const [usuarioExistente] = await pool.execute(
      'SELECT id, email, estado_cuenta, password, nombre, apellidos, nombre_alias, rol FROM usuarios WHERE email = ?',
      [emailLimpio]
    );

    let usuarioId;
    let tipoRespuesta;

    if (usuarioExistente.length > 0) {
      // Usuario existe
      usuarioId = usuarioExistente[0].id;
      const estadoCuenta = usuarioExistente[0].estado_cuenta;
      const esInvitacionTemporal = usuarioExistente[0].password && 
                                  usuarioExistente[0].password.startsWith('TEMP_');

      // Verificar estado de la cuenta
      if (estadoCuenta === 'suspendido') {
        return res.status(400).json(
          errorResponse('Este usuario está suspendido y no puede ser organizador')
        );
      }

      // Verificar si ya es organizador
      const [yaEsOrganizador] = await pool.execute(
        'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND usuario_id = ?',
        [torneoId, usuarioId]
      );

      if (yaEsOrganizador.length > 0) {
        return res.status(400).json(
          errorResponse('Este usuario ya es organizador del torneo')
        );
      }

      if (estadoCuenta === 'activo' && !esInvitacionTemporal) {
        tipoRespuesta = 'activo';
        
        // Agregar a organizadores_torneos
        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id, fecha_asignacion)
           VALUES (?, ?, NOW())`,
          [torneoId, usuarioId]
        );

        // Actualizar rol a organizador si es jugador
        if (usuarioExistente[0].rol === 'jugador') {
          await pool.execute(
            `UPDATE usuarios SET rol = 'organizador' WHERE id = ?`,
            [usuarioId]
          );
        }

        const nombreCompleto = usuarioExistente[0].nombre_alias || 
                              `${usuarioExistente[0].nombre || ''} ${usuarioExistente[0].apellidos || ''}`.trim() || 
                              emailLimpio;

        // Enviar email a usuario YA registrado
        try {
          await enviarInvitacionOrganizadorRegistrado({
            destinatario: emailLimpio,
            nombreDestinatario: nombreCompleto,
            creadorNombre: 'SuperAdmin',
            nombreTorneo: nombreTorneo,
            fechaInicio: torneo[0].fecha_inicio ? new Date(torneo[0].fecha_inicio).toLocaleDateString('es-ES') : null,
            fechaFin: torneo[0].fecha_fin ? new Date(torneo[0].fecha_fin).toLocaleDateString('es-ES') : null,
            ubicacion: torneo[0].ubicacion,
            tipoTorneo: torneo[0].tipo_torneo,
            rondasMax: torneo[0].rondas_max
          });
          console.log(`📧 Email enviado a usuario registrado: ${emailLimpio}`);
        } catch (emailError) {
          console.error('⚠️ Error al enviar email:', emailError);
        }

        console.log(`👑 SuperAdmin agregó organizador activo: ${emailLimpio} al torneo ${torneoId}`);

      } else {
        tipoRespuesta = 'pendiente_registro';
        
        // Agregar a organizadores_torneos
        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id, fecha_asignacion)
           VALUES (?, ?, NOW())`,
          [torneoId, usuarioId]
        );

        console.log(`👑 SuperAdmin agregó organizador pendiente: ${emailLimpio} al torneo ${torneoId}`);
      }

    } else {
      // Usuario NO existe - crear usuario temporal con invitación
      const crypto = await import('crypto');
      const passwordTemporal = `TEMP_${crypto.randomBytes(16).toString('hex')}`;
      
      try {
        const [resultado] = await pool.execute(
          `INSERT INTO usuarios (
            nombre, 
            apellidos,
            email, 
            password,
            estado_cuenta,
            rol,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            'Pendiente',
            'Registro',
            emailLimpio,
            passwordTemporal,
            'pendiente_registro',
            'organizador'
          ]
        );

        usuarioId = resultado.insertId;
        tipoRespuesta = 'invitacion_nueva';

        // Agregar a organizadores_torneos
        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id, fecha_asignacion)
           VALUES (?, ?, NOW())`,
          [torneoId, usuarioId]
        );

        // Enviar email a usuario NO registrado
        try {
          await enviarInvitacionOrganizadorNoRegistrado({
            destinatario: emailLimpio,
            nombreTorneo: nombreTorneo,
            creadorNombre: 'SuperAdmin',
            fechaInicio: torneo[0].fecha_inicio ? new Date(torneo[0].fecha_inicio).toLocaleDateString('es-ES') : null,
            fechaFin: torneo[0].fecha_fin ? new Date(torneo[0].fecha_fin).toLocaleDateString('es-ES') : null,
            ubicacion: torneo[0].ubicacion || 'Por confirmar',
            tipoTorneo: torneo[0].tipo_torneo,
            rondasMax: torneo[0].rondas_max
          });
          console.log(`📧 Email de invitación enviado a: ${emailLimpio}`);
        } catch (emailError) {
          console.error('⚠️ Error al enviar email:', emailError);
        }

        console.log(`👑 SuperAdmin creó usuario temporal e invitó: ${emailLimpio} (ID: ${usuarioId}) al torneo ${torneoId}`);

      } catch (insertError) {
        console.error('Error al crear usuario temporal:', insertError);
        if (insertError.code === 'ER_DUP_ENTRY') {
          return res.status(400).json(
            errorResponse('Este email ya está en uso')
          );
        }
        throw insertError;
      }
    }

    const mensajes = {
      'activo': `✅ ${emailLimpio} agregado como organizador. Se le ha enviado una notificación.`,
      'pendiente_registro': `⏳ ${emailLimpio} agregado como organizador (cuenta pendiente de activación)`,
      'invitacion_nueva': `📧 Invitación enviada a ${emailLimpio}. Debe registrarse para acceder`
    };

    return res.json(successResponse(mensajes[tipoRespuesta], {
      tipo: tipoRespuesta,
      email: emailLimpio,
      usuarioId,
      torneoId,
      nombreTorneo
    }));

  } catch (error) {
    console.error('❌ Error al agregar organizador (superadmin):', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('Error: este usuario ya es organizador del torneo')
      );
    }
    
    res.status(500).json(errorResponse('Error al agregar organizador'));
  }
});

// ===== ELIMINAR ORGANIZADORES (SUPERADMIN) =====

router.delete('/torneos/:torneoId/organizadores/:organizadorId', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const { torneoId, organizadorId } = req.params;

    // Verificar que el torneo existe
    const [torneo] = await pool.execute(
      'SELECT id, nombre_torneo, created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );

    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const nombreTorneo = torneo[0].nombre_torneo;
    const creadorOriginal = torneo[0].created_by;

    // Obtener información del organizador a eliminar
    const [organizador] = await pool.execute(
      `SELECT 
        ot.id,
        ot.usuario_id,
        u.email,
        u.password,
        u.estado_cuenta,
        u.nombre,
        u.apellidos,
        u.nombre_alias
      FROM organizadores_torneos ot
      INNER JOIN usuarios u ON ot.usuario_id = u.id
      WHERE ot.id = ? AND ot.torneo_id = ?`,
      [organizadorId, torneoId]
    );

    if (organizador.length === 0) {
      return res.status(404).json(errorResponse('Organizador no encontrado'));
    }

    const usuarioIdAEliminar = organizador[0].usuario_id;
    const emailUsuario = organizador[0].email;
    const passwordUsuario = organizador[0].password;
    const esInvitacionTemporal = passwordUsuario && passwordUsuario.startsWith('TEMP_');
    const nombreUsuario = organizador[0].nombre_alias || 
                         `${organizador[0].nombre || ''} ${organizador[0].apellidos || ''}`.trim() || 
                         emailUsuario;

    // Verificar que quede al menos un organizador
    const [totalOrganizadores] = await pool.execute(
      'SELECT COUNT(*) as total FROM organizadores_torneos WHERE torneo_id = ?',
      [torneoId]
    );

    if (totalOrganizadores[0].total <= 1) {
      return res.status(400).json(
        errorResponse('No se puede eliminar. Debe quedar al menos un organizador en el torneo')
      );
    }

    // SI SE ELIMINA AL CREADOR ORIGINAL, ASIGNAR NUEVO CREADOR
    let nuevoCreadorAsignado = false;
    if (usuarioIdAEliminar === creadorOriginal) {
      // Obtener el siguiente organizador más antiguo
      const [nuevoCreador] = await pool.execute(
        `SELECT usuario_id 
         FROM organizadores_torneos 
         WHERE torneo_id = ? AND usuario_id != ?
         ORDER BY fecha_asignacion ASC
         LIMIT 1`,
        [torneoId, usuarioIdAEliminar]
      );

      if (nuevoCreador.length > 0) {
        // Actualizar el creador del torneo
        await pool.execute(
          'UPDATE torneos_sistemas SET created_by = ? WHERE id = ?',
          [nuevoCreador[0].usuario_id, torneoId]
        );

        nuevoCreadorAsignado = true;
        console.log(`👑 Nuevo creador asignado por SuperAdmin: usuario_id ${nuevoCreador[0].usuario_id}`);
      }
    }

    // Eliminar de organizadores_torneos
    const [result] = await pool.execute(
      'DELETE FROM organizadores_torneos WHERE id = ? AND torneo_id = ?',
      [organizadorId, torneoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('No se pudo eliminar el organizador'));
    }

    console.log(`👑 SuperAdmin eliminó organizador: ${nombreUsuario} (${emailUsuario}) del torneo ${torneoId}`);

    // Si era una invitación temporal, verificar si tiene otros torneos
    if (esInvitacionTemporal) {
      const [otrosTorneos] = await pool.execute(
        'SELECT COUNT(*) as total FROM organizadores_torneos WHERE usuario_id = ?',
        [usuarioIdAEliminar]
      );

      if (otrosTorneos[0].total === 0) {
        // No tiene más torneos, eliminar usuario temporal
        await pool.execute(
          'DELETE FROM usuarios WHERE id = ? AND password LIKE "TEMP_%"',
          [usuarioIdAEliminar]
        );
        console.log(`👑 SuperAdmin eliminó usuario temporal completamente: ${emailUsuario}`);
      } else {
        console.log(`ℹ️ Usuario temporal ${emailUsuario} mantiene su cuenta (tiene ${otrosTorneos[0].total} torneo(s) más)`);
      }
    }

    res.json(successResponse('Organizador eliminado exitosamente', {
      email: emailUsuario,
      nombre: nombreUsuario,
      torneoId,
      nombreTorneo,
      nuevo_creador_asignado: nuevoCreadorAsignado,
      usuario_temporal_eliminado: esInvitacionTemporal && result.affectedRows > 0
    }));

  } catch (error) {
    console.error('❌ Error al eliminar organizador (superadmin):', error);
    res.status(500).json(errorResponse('Error al eliminar organizador'));
  }
});

// ===== REENVIAR EMAIL PARA AGREGAR  ORGANIZADOR (SUPERADMIN) =====

router.post('/torneos/:torneoId/organizadores/:organizadorId/reenviar', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const { torneoId, organizadorId } = req.params;

    // Obtener información del torneo y organizador
    const [data] = await pool.execute(
      `SELECT 
        ts.nombre_torneo,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.tipo_torneo,
        ts.rondas_max,
        u.email,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.estado_cuenta,
        u.password
      FROM organizadores_torneos ot
      INNER JOIN torneos_sistemas ts ON ot.torneo_id = ts.id
      INNER JOIN usuarios u ON ot.usuario_id = u.id
      WHERE ot.id = ? AND ot.torneo_id = ?`,
      [organizadorId, torneoId]
    );

    if (data.length === 0) {
      return res.status(404).json(errorResponse('Organizador o torneo no encontrado'));
    }

    const info = data[0];
    const esPendiente = info.estado_cuenta === 'pendiente_registro' || 
                       (info.password && info.password.startsWith('TEMP_'));

    if (!esPendiente) {
      return res.status(400).json(
        errorResponse('Solo se pueden reenviar invitaciones a usuarios pendientes')
      );
    }

    const nombreCompleto = info.nombre_alias || 
                          `${info.nombre || ''} ${info.apellidos || ''}`.trim() || 
                          info.email;

    // Reenviar email
    try {
      if (info.password && info.password.startsWith('TEMP_')) {
        // Usuario no registrado
        await enviarInvitacionOrganizadorNoRegistrado({
          destinatario: info.email,
          nombreTorneo: info.nombre_torneo,
          creadorNombre: 'SuperAdmin',
          fechaInicio: info.fecha_inicio ? new Date(info.fecha_inicio).toLocaleDateString('es-ES') : null,
          fechaFin: info.fecha_fin ? new Date(info.fecha_fin).toLocaleDateString('es-ES') : null,
          ubicacion: info.ubicacion || 'Por confirmar',
          tipoTorneo: info.tipo_torneo,
          rondasMax: info.rondas_max
        });
      } else {
        // Usuario registrado pero pendiente
        await enviarInvitacionOrganizadorRegistrado({
          destinatario: info.email,
          nombreDestinatario: nombreCompleto,
          creadorNombre: 'SuperAdmin',
          nombreTorneo: info.nombre_torneo,
          fechaInicio: info.fecha_inicio ? new Date(info.fecha_inicio).toLocaleDateString('es-ES') : null,
          fechaFin: info.fecha_fin ? new Date(info.fecha_fin).toLocaleDateString('es-ES') : null,
          ubicacion: info.ubicacion,
          tipoTorneo: info.tipo_torneo,
          rondasMax: info.rondas_max
        });
      }

      console.log(`👑 SuperAdmin reenvió invitación a: ${info.email} para torneo ${torneoId}`);

      res.json(successResponse('Invitación reenviada exitosamente', {
        email: info.email,
        nombreTorneo: info.nombre_torneo
      }));

    } catch (emailError) {
      console.error('❌ Error al reenviar email:', emailError);
      return res.status(500).json(
        errorResponse('Error al enviar el email de invitación')
      );
    }

  } catch (error) {
    console.error('❌ Error al reenviar invitación:', error);
    res.status(500).json(errorResponse('Error al reenviar invitación'));
  }
});

export default router;