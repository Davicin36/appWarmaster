import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import cloudinary from 'cloudinary'
import { pool, executeCrossTransaction } from '../config/bd.js';
import { enviarInvitarJugador }  from '../utils/emailInvitarTorneoInd.js';
import { enviarInvitacionOrganizadorNoRegistrado, enviarInvitacionOrganizadorRegistrado } from '../utils/emailInvitarOrganizador.js'; 
import  { emailTorneo }  from '../utils/emailComunicaciones.js';
import { actualizarEloAutomatico } from '../utilsRanking/calculoAutoRanking.js';
import { verificarToken, verificarOrganizadorTorneo } from '../middleware/auth.js';
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
    fileSize: 16 * 1024 * 1024 // 16MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB máximo
  },
  fileFilter: (req, file, cb) => {
    // ⬅️ ACTUALIZADO: Aceptar tanto PDFs como imágenes
    if (file.fieldname === 'bases_pdf') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF para las bases'), false);
      }
    } else if (file.fieldname === 'imagen_cartel') {
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (tiposPermitidos.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP) para el cartel'), false);
      }
    } else {
      cb(new Error('Campo de archivo no reconocido'), false);
    }
  }
});

// ======CONFIGURACION CLOUDINARY========

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
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
      } catch (err) {
        console.error('ℹ️ Sin autenticación o token inválido', err);
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
        ts.imagen_url,
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
      } catch (err) {
        console.error('ℹ️ Sin autenticación', err);
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
        ts.imagen_url,
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

router.post('/creandoTorneo', verificarToken,uploadMultiple.fields([
    { name: 'bases_pdf', maxCount: 1 },
    { name: 'imagen_cartel', maxCount: 1 }
]), async (req, res) => {
  try {
    
    const { 
      nombre_torneo, 
      tipo_torneo = 'Individual',
      rondas_max: rondas_max_raw,
      fecha_inicio, 
      fecha_fin, 
      ubicacion,
      puntos_ejercito: puntos_ejercito_raw,
      participantes_max: participantes_max_raw,
      estado = 'pendiente',
      partida_ronda_1,
      partida_ronda_2,
      partida_ronda_3,
      partida_ronda_4,
      partida_ronda_5,
      organizadores_emails: organizadores_raw
    } = req.body;

    const rondas_max = parseInt(rondas_max_raw);
    const puntos_ejercito = parseInt(puntos_ejercito_raw);
    const participantes_max = parseInt(participantes_max_raw);

    let organizadores_emails = [];
    if (organizadores_raw) {
      if(typeof organizadores_raw === 'string') {
          try {
            organizadores_emails = JSON.parse(organizadores_raw)
          }catch (e) {
            organizadores_emails = organizadores_raw.split(', ').map(e => e.trim()).filter(e => e);
          }
      } else if (Array.isArray(organizadores_raw)) {
        organizadores_emails = organizadores_raw;
      }
    } 

    const camposFaltantes = validarCamposRequeridos(req.body, [
      'nombre_torneo',
      'rondas_max', 
      'fecha_inicio',
      'puntos_ejercito',
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

    if (organizadores_emails.length > 5) {
      return res.status(400).json(
        errorResponse('Máximo 5 organizadores adicionales permitidos')
      );
    }

    const [usuarios] = await pool.execute(
      'SELECT rol, nombre, apellidos FROM usuarios WHERE id = ?',
      [req.usuario.userId]
    );

    let rolActualizado = usuarios[0].rol;
    const creadorNombre = `${usuarios[0].nombre} ${usuarios[0].apellidos}`;

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
    
    if (req.files && req.files['bases_pdf']) {
      const pdfFile = req.files['bases_pdf'][0];
      basesPdf = pdfFile.buffer;
      basesNombre = pdfFile.originalname;
      baseTamaño = pdfFile.size;
      console.log(`📄 PDF recibido: ${basesNombre} (${baseTamaño} bytes)`);
    }

    let imagenUrl = null;

        if (req.files && req.files['imagen_cartel']) {
          const imagenFile = req.files['imagen_cartel'][0];
          
          try {
            // Convertir buffer a base64
            const b64 = Buffer.from(imagenFile.buffer).toString('base64');
            const dataURI = `data:${imagenFile.mimetype};base64,${b64}`;
            
            // Subir a Cloudinary
            const resultado = await cloudinary.v2.uploader.upload(dataURI, {
              folder: 'torneos_warmaster',
              resource_type: 'auto',
              public_id: `torneo_${Date.now()}` // nombre único
            });
            
            imagenUrl = resultado.secure_url;
          } catch (cloudinaryError) {
            console.error('❌ Error al subir a Cloudinary:', cloudinaryError);
            // No bloquear la creación del torneo si falla Cloudinary
            // pero podrías retornar error si lo consideras crítico
          }
        }

    const [resultado] = await pool.execute(
      `INSERT INTO torneos_sistemas 
       (nombre_torneo, 
        sistema,
        tipo_torneo,
        num_jugadores_equipo,
        rondas_max, 
        fecha_inicio, 
        fecha_fin, 
        ubicacion,
        imagen_url,
        puntos_banda,
        puntos_ejercito, 
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_torneo, 
        'WARMASTER',
        tipo_torneo,
        null,
        rondas_max, 
        fecha_inicio, 
        fecha_fin || null, 
        ubicacion || null, 
        imagenUrl,
        0,
        puntos_ejercito,
        participantes_max,
        0,
        estado,
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

    //INSERTAR A LOS ORGANIZADORES DEL TORNEO EN SU BD.
    await pool.execute(
      `INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)`,
      [torneoId, req.usuario.userId]
    )

    let organizadoresRegistrados = []
    let organizadoresNoRegistrados = []

    if(organizadores_emails.length > 0){

      for (const email of organizadores_emails) {
        const emailLower = email.toLowerCase().trim();

        // Verificar si el usuario ya existe
        const [usuarioExistente] = await pool.execute(
          'SELECT id, nombre, apellidos, email FROM usuarios WHERE LOWER(email) = ?',
          [emailLower]
        );

        if (usuarioExistente.length > 0) {
          const usuario = usuarioExistente[0];

          const [yaEsOrganizador] = await pool.execute (
            'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND  usuario_id = ?',
            [torneoId, usuario.id]
          )

          if(yaEsOrganizador.length === 0){
              await pool.execute(
                'INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)',
                [torneoId, usuario.id]
              );

              if (usuario.estado_cuenta === 'activo') {
                await pool.execute(
                  `UPDATE usuarios SET rol = 'organizador' WHERE id = ? AND rol != 'organizador'`,
                  [usuario.id]
                );

              organizadoresRegistrados.push ({
                  email: usuario.email,
                  nombre: `${usuario.nombre} ${usuario.apellidos }`,
                  estado: usuario.estado_cuenta
              })
            }  else {
                  organizadoresNoRegistrados.push({
                  email: usuario.email
                });
            }
          }
      } else {

          try {
            // Crear usuario pendiente
            const [nuevoUsuario] = await pool.execute(
              `INSERT INTO usuarios (email, nombre, apellidos, password, estado_cuenta, rol) VALUES (?, ?, ?, ?, 'pendiente_registro', 'organizador')`,
              [emailLower, 'Pendiente', 'de Registro', crypto.randomBytes(32).toString('hex')]
            );

            const usuarioId = nuevoUsuario.insertId;

            // Añadir como organizador del torneo
            await pool.execute(
              'INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)',
              [torneoId, usuarioId]
            );

            organizadoresNoRegistrados.push({
              email: emailLower,
              usuarioId: usuarioId
            });

            organizadoresNoRegistrados.push({
              email: emailLower,
              usuarioId: usuarioId
            });

          } catch (dbError) {
            console.error(`  ❌ Error creando usuario pendiente para ${emailLower}:`, dbError);
          }
        }
      }

    // ✅ ENVIAR EMAILS
      if (organizadoresRegistrados.length > 0 || organizadoresNoRegistrados.length > 0) {

        // Enviar emails a organizadores activos
        for (const org of organizadoresRegistrados) {
          try {
            await enviarInvitacionOrganizadorRegistrado({
              destinatario: org.email,
              nombreDestinatario: org.nombre,
              creadorNombre,
              nombreTorneo: nombre_torneo,
              fechaInicio: fecha_inicio,
              fechaFin: fecha_fin,
              ubicacion,
              tipoTorneo: tipo_torneo,
              rondasMax: rondas_max
            });
          } catch (emailError) {
            console.error(`  ❌ Error enviando email a ${org.email}:`, emailError.message);
          }
        }

        // Enviar emails a organizadores pendientes
        for (const org of organizadoresNoRegistrados) {
          try {
            await enviarInvitacionOrganizadorNoRegistrado({
              destinatario: org.email,
              creadorNombre,
              nombreTorneo: nombre_torneo,
              fechaInicio: fecha_inicio,
              fechaFin: fecha_fin,
              ubicacion,
              tipoTorneo: tipo_torneo,
              rondasMax: rondas_max
            });
          } catch (emailError) {
            console.error(`  ❌ Error enviando email a ${org.email}:`, emailError.message);
          }
        }
      }
    }
    
    res.status(201).json(
      successResponse('Torneo creado exitosamente', {
        torneoId: resultado.insertId,
        nombre_torneo,
        tipo_torneo,
        ubicacion: ubicacion || null,
        imagen_url: imagenUrl,
        tiene_bases_pdf: !!req.file,
        created_by: req.usuario.userId,
        organizadores: {
          activos: organizadoresRegistrados.length,
          pendientes: organizadoresNoRegistrados.length,
          emails_enviados: organizadoresRegistrados.length + organizadoresNoRegistrados.length
        }
      })
    );
  
  } catch (error) {
    console.error('❌ Error al crear torneo:', error);
    
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

router.put('/:torneoId/actualizarTorneo', verificarToken, verificarOrganizadorTorneo, uploadMultiple.fields([
    { name: 'bases_pdf', maxCount: 1 },
    { name: 'imagen_cartel', maxCount: 1 }
]), async (req, res) => {
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
      eliminar_pdf,
      eliminar_imagen  // ⬅️ NUEVO
    } = req.body;
        
    // ⬅️ TAMBIÉN TRAER imagen_url actual para poder eliminarla de Cloudinary
    const [torneoExistente] = await pool.execute(
      'SELECT created_by, imagen_url FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneoExistente.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    // Validaciones
    if (rondas_max && (rondas_max < 3 || rondas_max > 5)) {
      return res.status(400).json(
        errorResponse('El número de rondas debe estar entre 3 y 5')
      );
    }

    if (puntos_ejercito && (puntos_ejercito < 1000 || puntos_ejercito > 3000)) {
      return res.status(400).json(
        errorResponse('Los puntos de ejército deben estar entre 1000 y 3000')
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
    
    // Campos básicos
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
    
    if (ubicacion !== undefined) {
      camposActualizar.push('ubicacion = ?');
      valores.push(ubicacion || null);
    }

    // ========================================
    // MANEJAR IMAGEN DEL CARTEL
    // ========================================
    let imagenActualizada = false;
    let imagenEliminada = false;

    // Si se sube una nueva imagen
    if (req.files && req.files['imagen_cartel']) {
      const imagenFile = req.files['imagen_cartel'][0];
      
      try {
        console.log('📤 Subiendo nueva imagen a Cloudinary...');
        console.log('   Archivo:', imagenFile.originalname);
        console.log('   Tamaño:', (imagenFile.size / 1024).toFixed(2), 'KB');
        
        // Convertir buffer a base64
        const b64 = Buffer.from(imagenFile.buffer).toString('base64');
        const dataURI = `data:${imagenFile.mimetype};base64,${b64}`;
        
        // Subir a Cloudinary
        const resultado = await cloudinary.v2.uploader.upload(dataURI, {
          folder: 'torneos_warmaster',
          resource_type: 'auto',
          public_id: `torneo_${torneoId}_${Date.now()}`
        });
        
        // Eliminar imagen anterior de Cloudinary si existe
        if (torneoExistente[0].imagen_url) {
          try {
            // Extraer public_id de la URL
            const urlParts = torneoExistente[0].imagen_url.split('/');
            const publicIdWithExt = urlParts.slice(-2).join('/');
            const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
            
            await cloudinary.v2.uploader.destroy(publicId);
            console.log('🗑️ Imagen anterior eliminada de Cloudinary');
          } catch (deleteError) {
            console.warn('⚠️ No se pudo eliminar imagen anterior:', deleteError.message);
          }
        }
        
        camposActualizar.push('imagen_url = ?');
        valores.push(resultado.secure_url);
        imagenActualizada = true;
        
        console.log('✅ Nueva imagen subida:', resultado.secure_url);
        
      } catch (cloudinaryError) {
        console.error('❌ Error al subir imagen a Cloudinary:', cloudinaryError);
        return res.status(500).json(
          errorResponse('Error al subir la imagen a Cloudinary: ' + cloudinaryError.message)
        );
      }
    }
    // Si se solicita eliminar la imagen existente
    else if (eliminar_imagen === 'true' || eliminar_imagen === true) {
      if (torneoExistente[0].imagen_url) {
        try {
          // Extraer public_id de la URL
          const urlParts = torneoExistente[0].imagen_url.split('/');
          const publicIdWithExt = urlParts.slice(-2).join('/');
          const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
          
          await cloudinary.v2.uploader.destroy(publicId);
          console.log('🗑️ Imagen eliminada de Cloudinary');
        } catch (deleteError) {
          console.warn('⚠️ No se pudo eliminar imagen de Cloudinary:', deleteError.message);
        }
      }
      
      camposActualizar.push('imagen_url = NULL');
      imagenEliminada = true;
      console.log('🗑️ Eliminando referencia de imagen en BD');
    }
    
    // Campos de puntuación
    if (puntos_ejercito !== undefined) {
      camposActualizar.push('puntos_ejercito = ?');
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

    // Partidas por ronda
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
    
    // ========================================
    // MANEJAR PDF DE BASES
    // ========================================
    let pdfActualizado = false;
    let pdfEliminado = false;

    // Si se sube un nuevo PDF - ⬅️ CAMBIO: usar req.files en lugar de req.file
    if (req.files && req.files['bases_pdf']) {
      const pdfFile = req.files['bases_pdf'][0];
      
      camposActualizar.push('bases_torneo = ?');
      valores.push(pdfFile.buffer);
      
      camposActualizar.push('bases_nombre = ?');
      valores.push(pdfFile.originalname);
      
      camposActualizar.push('base_tamaño = ?');
      valores.push(pdfFile.size);
      
      pdfActualizado = true;
      console.log('📄 Nuevo PDF recibido:', pdfFile.originalname);
    }
    // Si se solicita eliminar el PDF existente
    else if (eliminar_pdf === 'true' || eliminar_pdf === true) {
      camposActualizar.push('bases_torneo = NULL');
      camposActualizar.push('bases_nombre = NULL');
      camposActualizar.push('base_tamaño = NULL');
      pdfEliminado = true;
      console.log('🗑️ Eliminando PDF existente');
    }
    
    // ========================================
    // EJECUTAR UPDATE SI HAY CAMBIOS
    // ========================================
    if (camposActualizar.length > 0) {
      valores.push(torneoId);
      
      const query = `UPDATE torneos_sistemas SET ${camposActualizar.join(', ')} WHERE id = ?`;
      
      console.log('📝 Ejecutando UPDATE con', camposActualizar.length, 'campos');
      
      await pool.execute(query, valores);
      
      console.log('✅ Torneo actualizado correctamente');
    } else {
      console.log('ℹ️ No hay cambios para actualizar');
    }
    
    // ========================================
    // RESPUESTA
    // ========================================
    res.json(
      successResponse('Torneo actualizado exitosamente', {
        torneoId: parseInt(torneoId),
        cambios: {
          ubicacion: ubicacion !== undefined,
          imagen_actualizada: imagenActualizada,
          imagen_eliminada: imagenEliminada,
          pdf_actualizado: pdfActualizado,
          pdf_eliminado: pdfEliminado,
          total_campos: camposActualizar.length
        }
      })
    );
    
  } catch (error) {
    console.error('❌ Error al actualizar torneo:', error);
    console.error('Stack:', error.stack);
    
    // Manejo de errores de Multer
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(
          errorResponse('Uno de los archivos excede el tamaño máximo de 16MB')
        );
      }
      return res.status(400).json(errorResponse(error.message));
    }
    
    // Errores de validación de archivos
    if (error.message && error.message.includes('Solo se permiten')) {
      return res.status(400).json(errorResponse(error.message));
    }

    // Error de duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('Ya existe un torneo con ese nombre')
      );
    }
    
    // Error genérico
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ===== OBTENER ORGANIZADORES DEL TORNEO =====

router.get('/:torneoId/organizadores', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  try {
    const { torneoId } = req.params;

    // Verificar que el torneo existe y obtener el creador
    const [torneo] = await pool.execute(
      'SELECT id, created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );

    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const creadorId = torneo[0].created_by;

    // Obtener TODOS los organizadores
    const [organizadores] = await pool.execute(
      `SELECT 
        torg.id as organizador_id,
        torg.torneo_id,
        torg.usuario_id,
        torg.fecha_asignacion,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.email,
        u.estado_cuenta
      FROM organizadores_torneos torg
      INNER JOIN usuarios u ON torg.usuario_id = u.id
      WHERE torg.torneo_id = ?
      ORDER BY torg.fecha_asignacion ASC`,
      [torneoId]
    );

    // Procesar organizadores
    const organizadoresConInfo = organizadores.map(org => {
      const esCreador = org.usuario_id === creadorId;
      const esPendienteInvitacion = org.password && org.password.startsWith('TEMP_');
      
      let nombreCompleto;
      if (esPendienteInvitacion) {
        nombreCompleto = org.email; // Si es invitación, solo mostrar email
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
        rol: esCreador ? 'creador' : 'organizador'
      };
    });

    // Separar por estado
    const activos = organizadoresConInfo.filter(org => 
      org.estado_cuenta === 'activo' && !org.es_invitacion_pendiente
    );
    
    const pendientes = organizadoresConInfo.filter(org => 
      org.estado_cuenta === 'pendiente_registro' || org.es_invitacion_pendiente
    );

    res.json(successResponse('Organizadores obtenidos', {
      activos,
      pendientes
    }));

  } catch (error) {
    console.error('❌ Error al obtener organizadores:', error);
    res.status(500).json(errorResponse('Error al obtener organizadores'));
  }
});

// ===== AGREGAR ORGANIZADOR AL TORNEO =====

router.post('/:torneoId/organizadores', verificarToken, verificarOrganizadorTorneo,async (req, res) => {
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
        created_by, 
        nombre_torneo,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        tipo_torneo,
        rondas_max
      FROM torneos_sistemas 
      WHERE id = ?`,
      [torneoId]
    );

    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const nombreTorneo = torneo[0].nombre_torneo;
    const creadorOriginal = torneo[0].created_by;

    // VERIFICAR QUE EL USUARIO SEA ORGANIZADOR DEL TORNEO
    const [esOrganizador] = await pool.execute(
      'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND usuario_id = ?',
      [torneoId, req.usuario.userId]
    );

    // Si no es organizador Y tampoco es el creador original → DENEGAR
    if (esOrganizador.length === 0 && creadorOriginal !== req.usuario.userId) {
      return res.status(403).json(
        errorResponse('Solo los organizadores del torneo pueden agregar más organizadores')
      );
    }

    // Obtener datos del usuario que está invitando (para el email)
    const [usuarioInvitador] = await pool.execute(
      'SELECT nombre, apellidos, nombre_alias, email FROM usuarios WHERE id = ?',
      [req.usuario.userId]
    );

    const nombreInvitador = usuarioInvitador[0].nombre_alias || 
                           `${usuarioInvitador[0].nombre || ''} ${usuarioInvitador[0].apellidos || ''}`.trim() || 
                           usuarioInvitador[0].email;

    // Verificar si el usuario existe
    const [usuarioExistente] = await pool.execute(
      'SELECT id, email, estado_cuenta, password, nombre, apellidos, nombre_alias FROM usuarios WHERE email = ?',
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
        
        // Agregar a torneo_organizadores
        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id)
           VALUES (?, ?)`,
          [torneoId, usuarioId]
        );

        //actualizar rol a organizador si no lo es ya.
        await pool.execute(
          `UPDATE usuarios SET rol = 'organizador' WHERE id = ? AND rol != 'organizador'`,
          [usuarioId]
        );

        const nombreCompleto = usuarioExistente[0].nombre_alias || 
                              `${usuarioExistente[0].nombre || ''} ${usuarioExistente[0].apellidos || ''}`.trim() || emailLimpio;

        // Enviar email a usuario YA registrado
        try {
          await enviarInvitacionOrganizadorRegistrado({
              destinatario: emailLimpio,
              nombreDestinatario: nombreCompleto, 
              creadorNombre: nombreInvitador,
              nombreTorneo: nombreTorneo,
              fechaInicio: new Date(torneo[0].fecha_inicio).toLocaleDateString('es-ES'),
              fechaFin: torneo[0].fecha_fin ? new Date(torneo[0].fecha_fin).toLocaleDateString('es-ES') : null,
              ubicacion: torneo[0].ubicacion,
              tipoTorneo: torneo[0].tipo_torneo,
              rondasMax: torneo[0].rondas_max
          });
        } catch (emailError) {
          console.error('⚠️ Error al enviar email:', emailError);
          // No bloquear el proceso si falla el email
        }
      } else {
        tipoRespuesta = 'pendiente_registro';
        
        // Agregar a torneo_organizadores
        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id)
           VALUES (?, ?)`,
          [torneoId, usuarioId]
        );
      }

    } else {
      // Usuario NO existe - crear usuario temporal con invitación
      const passwordTemporal = `TEMP_${crypto.randomBytes(16).toString('hex')}`;
      
      try {
        const [resultado] = await pool.execute(
          `INSERT INTO usuarios (
              nombre, 
              apellidos,
              email, 
              password,
              estado_cuenta,
              rol
          ) VALUES ('pendiente', 'registro', ?, ?, 'pendiente_registro', 'organizador')`,
          [
            emailLimpio,
            passwordTemporal
          ]
        );

        usuarioId = resultado.insertId;
        tipoRespuesta = 'invitacion_nueva';

        // Agregar a torneo_organizadores
        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id)
           VALUES (?, ?)`,
          [torneoId, usuarioId]
        )

        // Enviar email a usuario NO registrado
        try {
          await enviarInvitacionOrganizadorNoRegistrado({
            destinatario: emailLimpio,
            nombreTorneo: nombreTorneo,
            creadorNombre: nombreInvitador,
            fechaInicio: new Date(torneo[0].fecha_inicio).toLocaleDateString('es-ES'),
            fechaFin: torneo[0].fecha_fin ? new Date(torneo[0].fecha_fin).toLocaleDateString('es-ES') : null,
            ubicacion: torneo[0].ubicacion || 'Por confirmar',
            tipoTorneo: torneo[0].tipo_torneo,
            rondasMax: torneo[0].rondas_max
          });
          console.log(`📧 Email de invitación enviado a: ${emailLimpio}`);
        } catch (emailError) {
          console.error('⚠️ Error al enviar email:', emailError);
          // No bloquear el proceso si falla el email
        }

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
      'pendiente': `⏳ ${emailLimpio} agregado como organizador (cuenta pendiente de activación)`,
      'invitacion_nueva': `📧 Invitación enviada a ${emailLimpio}. Debe registrarse para acceder`
    };

    return res.json(successResponse(mensajes[tipoRespuesta], {
      tipo: tipoRespuesta,
      email: emailLimpio,
      usuarioId
    }));

  } catch (error) {
    console.error('❌ Error al agregar organizador:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('Error: duplicado detectado')
      );
    }
    
    res.status(500).json(errorResponse('Error al agregar organizador'));
  }
});

//=====ELIMINAR ORGANIZADOR DE TORNEO=====

router.delete('/:torneoId/organizadores/:organizadorId', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  try {
    const { torneoId, organizadorId } = req.params;

    // Verificar que el usuario actual es el creador del torneo
    const [torneo] = await pool.execute(
      'SELECT created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );

    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    const creadorOriginal = torneo[0].created_by;

    // ✅ VERIFICAR QUE EL USUARIO ACTUAL SEA ORGANIZADOR DEL TORNEO
    const [usuarioEsOrganizador] = await pool.execute(
      'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND usuario_id = ?',
      [torneoId, req.usuario.userId]
    );

    // Si NO es organizador Y tampoco es el creador original → DENEGAR
    if (usuarioEsOrganizador.length === 0 && creadorOriginal !== req.usuario.userId) {
      return res.status(403).json(
        errorResponse('Solo los organizadores del torneo pueden eliminar organizadores')
      );
    }

    // Obtener información del organizador a eliminar
    const [organizador] = await pool.execute(
      `SELECT 
        torg.id,
        torg.usuario_id,
        u.email,
        u.password,
        u.estado_cuenta
      FROM organizadores_torneos torg
      INNER JOIN usuarios u ON torg.usuario_id = u.id
      WHERE torg.id = ? AND torg.torneo_id = ?`,
      [organizadorId, torneoId]
    );

    if (organizador.length === 0) {
      return res.status(404).json(errorResponse('Organizador no encontrado'));
    }

    const usuarioIdAEliminar = organizador[0].usuario_id;
    const emailUsuario = organizador[0].email;
    const passwordUsuario = organizador[0].password;
    const esInvitacionTemporal = passwordUsuario && passwordUsuario.startsWith('TEMP_');

    //VERIFICAMOS QUE QUEDE AL MENOS UN ORGANIZADOR
    const [totalOrganizadores] = await pool.execute(
      'SELECT COUNT(*) as total FROM organizadores_torneos WHERE torneo_id = ?',
      [torneoId]
    );

    if (totalOrganizadores[0].total <= 1) {
      return res.status(400).json(
        errorResponse('No se puede eliminar. Debe quedar al menos un organizador en el torneo')
      );
    }

    // ⚠️ OPCIONAL: No permitir que un organizador se elimine a sí mismo
    // (puedes comentar esto si quieres permitirlo)
    if (usuarioIdAEliminar === req.usuario.userId) {
      return res.status(400).json(
        errorResponse('No puedes eliminarte a ti mismo como organizador. Pídele a otro organizador que lo haga.')
      );
    }

//SI SE ELIMINA AL CREADOR ORIGINAL, ASIGNAR NUEVO CREADOR
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
      }
    }

    // Eliminar de torneo_organizadores
    const [result] = await pool.execute(
      'DELETE FROM organizadores_torneos WHERE id = ? AND torneo_id = ?',
      [organizadorId, torneoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('No se pudo eliminar el organizador'));
    }

    // Si era una invitación temporal, verificar si tiene otros torneos
    if (esInvitacionTemporal) {
      // Verificar si tiene otros torneos asignados
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
      }
    }

    res.json(successResponse('Organizador eliminado exitosamente', {
      email: emailUsuario,
      nuevo_creador_asignado: usuarioIdAEliminar === creadorOriginal
    }));

  } catch (error) {
    console.error('❌ Error al eliminar organizador:', error);
    res.status(500).json(errorResponse('Error al eliminar organizador'));
  }
});

// ===== REENVIAR EMAIL PARA AGREGAR  ORGANIZADOR (SUPERADMIN) =====

router.post('/:torneoId/organizadores/:organizadorId/reenviar', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
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
          creadorNombre: nombreInvitador,
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
          creadorNombre: nombreInvitador,
          nombreTorneo: info.nombre_torneo,
          fechaInicio: info.fecha_inicio ? new Date(info.fecha_inicio).toLocaleDateString('es-ES') : null,
          fechaFin: info.fecha_fin ? new Date(info.fecha_fin).toLocaleDateString('es-ES') : null,
          ubicacion: info.ubicacion,
          tipoTorneo: info.tipo_torneo,
          rondasMax: info.rondas_max
        });
      }

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

// ======INSCRIBIRSE EN TORNEO=====

router.post('/:torneoId/inscripcion', verificarToken, upload.single('lista_ejercito'), async (req, res) => {
  try {
    const { torneoId } = req.params;
    const usuarioId = req.usuario.userId;
    const { nombre_ejercito, ejercito } = req.body;

    if(!nombre_ejercito || !nombre_ejercito.trim()) {
      return  res.status(400).json(
        errorResponse('El nombre del ejército es obligatorio')
      );
    } 

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
        nombre_ejercito,
        ejercito,
        lista_ejercito,
        lista_nombre,
        lista_tamaño,
        pagado,
        puntos_victoria,
        puntos_masacre
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [
        torneoId,
        usuarioId,
        nombre_ejercito,
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
        nombre_ejercito,
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
            jtw.nombre_ejercito,
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

        const {nombre_ejercito, ejercito } = req.body;

        if(!nombre_ejercito || !nombre_ejercito.trim()) {
            await connection.rollback();
            return  res.status(400).json(
                errorResponse('El nombre del ejército es obligatorio')
            );
        } 

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

       let updateFields = ['nombre_ejercito = ?', 'ejercito = ?'];
        let updateValues = [nombre_ejercito, ejercito];

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
                nombre_ejercito,
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

// =====AÑADIR JUGADOR INDIVIDUAL MANUALMENTE (ORGANIZADOR)=====

router.post('/:torneoId/add-individual-participant', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    const { participante } = req.body;
    const usuarioOrganizadorId = req.usuario.userId;

    // ✅ VALIDAR SOLO NOMBRE (sin apellidos)
    if (!participante.nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }

    await connection.beginTransaction();

    // Verificar que el usuario es organizador del torneo y obtener datos completos
    const [torneoCheck] = await connection.query(
        `SELECT 
          t.*, 
          u.nombre as organizador_nombre, 
          u.email as organizador_email
        FROM torneos_sistemas t 
        LEFT JOIN usuarios u ON t.created_by = u.id 
        WHERE t.id = ?
        GROUP BY t.id`,
        [torneoId]
    );

    if (torneoCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado'
      });
    }

    if (torneoCheck[0].created_by !== usuarioOrganizadorId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para añadir participantes a este torneo'
      });
    }

    if (torneoCheck[0].estado !== 'pendiente') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden añadir participantes a torneos en estado PENDIENTE'
      });
    }

    const torneo = torneoCheck[0];

    let usuarioId;
    let esNuevoUsuario = false;

    // Verificar si el usuario existe por email
    if (participante.email) {
      const [usuarioExistente] = await connection.query(
        'SELECT id, estado_cuenta FROM usuarios WHERE email = ?',
        [participante.email.toLowerCase()]
      );

      if (usuarioExistente.length > 0) {
        usuarioId = usuarioExistente[0].id;

        // Verificar que no esté ya inscrito
        const [yaInscrito] = await connection.query(
          'SELECT id FROM jugador_torneo_warmaster WHERE torneo_id = ? AND jugador_id = ?',
          [torneoId, usuarioId]
        );

        if (yaInscrito.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Este usuario ya está inscrito en el torneo'
          });
        }
      }
    }

    // Si no existe, crear nuevo usuario (SOLO con nombre, sin apellidos)
    if (!usuarioId) {
      const passwordTemporal = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(passwordTemporal, 10);

      const [nuevoUsuario] = await connection.query(
        `INSERT INTO usuarios (nombre, apellidos, email, password, estado_cuenta, created_at) 
         VALUES (?, 'Pendiente', ?, ?, 'pendiente_registro', NOW())`,
        [
          participante.nombre,
          participante.email || null,
          passwordHash
        ]
      );
      usuarioId = nuevoUsuario.insertId;
      esNuevoUsuario = true;
    }

    // ✅ Insertar en jugador_torneo_warmaster
    const [jugadorInsertado] = await connection.query(
      `INSERT INTO jugador_torneo_warmaster (
        torneo_id, 
        jugador_id, 
        ejercito, 
        lista_ejercito, 
        lista_nombre, 
        lista_tamaño, 
        pagado, 
        puntos_victoria, 
        puntos_masacre, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        torneoId, 
        usuarioId, 
        participante.ejercito || 'Por definir', 
        null,
        null, 
        null, 
        null, 
        0, 
        0, 
        0
      ]
    );

    const jugadorTorneoId = jugadorInsertado.insertId;

    // ✅ Insertar en clasificacion_jugadores_warmaster
    await connection.query(
      `INSERT INTO clasificacion_jugadores_warmaster (
        torneo_id, 
        jugador_id, 
        partidas_jugadas, 
        partidas_ganadas, 
        partidas_empatadas, 
        partidas_perdidas, 
        puntos_victoria_totales, 
        puntos_masacre_totales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [torneoId, usuarioId, 0, 0, 0, 0, 0, 0]
    );

    await connection.commit();

    // ✅ ENVIAR EMAIL SI HAY CORREO
    let emailEnviado = false;
    if (participante.email) {
      try {
        const destinatario = {
          nombre: participante.nombre,
          email: participante.email,
          esNuevo: esNuevoUsuario,
          ejercito: participante.ejercito || 'Por definir'
        };

        const torneoInfo = {
          nombre_torneo: torneo.nombre_torneo,
          sistema: torneo.sistema,
          tipo_torneo: 'Individual',
          ubicacion: torneo.ubicacion,
          fecha_inicio: torneo.fecha_inicio,
          fecha_fin: torneo.fecha_fin,
          puntos_banda: torneo.puntos_banda,
          organizador: {
            nombre: torneo.organizador_nombre,
            email: torneo.organizador_email
          }
        };

        const resultado = await enviarInvitarJugador(destinatario, torneoInfo);
        
        if (resultado.success) {
          emailEnviado = true;
        }
        
        console.log('✅ Email enviado a:', participante.email);
      } catch (emailError) {
        console.error('❌ Error al enviar email:', emailError);
      }
    }

    res.json({
      success: true,
      message: emailEnviado
        ? 'Jugador añadido correctamente. Se ha enviado un email de invitación.'
        : 'Jugador añadido correctamente.',
      data: {
        jugadorTorneoId,
        usuarioId,
        esNuevoUsuario,
        emailEnviado
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al añadir jugador individual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al añadir jugador',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// ===== REENVIAR EMAIL A UN JUGADOR INDIVIDUAL (ORGANIZADOR) =====

router.post('/:torneoId/jugadores/:jugadorId/reenviarInvitacionInd', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId, jugadorId } = req.params;

    console.log('📧 Reenviando invitación al jugador:', { torneoId, jugadorId });

    // Obtener datos del jugador en el torneo
    const [jugadorData] = await connection.query(
      `SELECT jts.id, jts.usuario_id, u.nombre, u.apellidos, u.email, u.estado_cuenta, jts.ejercito
       FROM jugador_torneo_warmaster jts
       INNER JOIN usuarios u ON jts.usuario_id = u.id
       WHERE jts.id = ? AND jts.torneo_id = ?`,
      [jugadorId, torneoId]
    );

    if (jugadorData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado en este torneo'
      });
    }

    const jugador = jugadorData[0];
    const esNuevoUsuario = jugador.estado_cuenta === 'pendiente_registro';

    // Obtener datos del torneo
    const [torneoData] = await connection.query(
      `SELECT 
          t.*, 
          u.nombre as organizador_nombre,
          u.apellidos as organizador_apellidos,
          u.email as organizador_email 
       FROM torneos_sistemas t 
       LEFT JOIN usuarios u ON t.created_by = u.id 
       WHERE t.id = ?`,
      [torneoId]
    );

    if (torneoData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado'
      });
    }

    const torneo = torneoData[0];
    const torneoInfo = {
      nombre_torneo: torneo.nombre_torneo,
      sistema: torneo.sistema,
      tipo_torneo: torneo.tipo_torneo,
      ubicacion: torneo.ubicacion,
      fecha_inicio: torneo.fecha_inicio,
      fecha_fin: torneo.fecha_fin,
      puntos_banda: torneo.puntos_banda,
      organizador: {
        nombre: `${torneo.organizador_nombre} ${torneo.organizador_apellidos}`.trim(),
        email: torneo.organizador_email
      }
    };

    // Enviar email
    const destinatario = {
      nombre: `${jugador.nombre} ${jugador.apellidos}`.trim(),
      email: jugador.email,
      esNuevo: esNuevoUsuario,
      epoca: jugador.epoca,
      banda: jugador.faccion
    };

    const resultado = await enviarInvitacionJugador(destinatario, torneoInfo);

    if (resultado.success) {
      res.json({
        success: true,
        message: `Invitación reenviada correctamente a ${destinatario.nombre} ${destinatario.apellidos}`,
        data: {
          jugador: destinatario.nombre,
          email: destinatario.email,
          esNuevo: destinatario.esNuevo
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'No se pudo reenviar la invitación',
        error: resultado.error
      });
    }

  } catch (error) {
    console.error('❌ Error al reenviar invitación individual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reenviar invitación individual',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// ===== REENVIAR EMAIL A TODOS LOS JUGADORES (ORGANIZADOR) =====

router.post('/:torneoId/reenviarTodosJugadores', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { torneoId } = req.params;

    console.log('📧 Reenviando invitaciones a todos los jugadores del torneo:', torneoId);

    // Obtener todos los jugadores del torneo
    const [jugadores] = await connection.query(
      `SELECT jts.id, jts.usuario_id, u.nombre, u.apellidos, u.email, u.estado_cuenta, jts.epoca, jts.faccion
       FROM jugador_torneo_warmaster jts
       INNER JOIN usuarios u ON jts.usuario_id = u.id
       WHERE jts.torneo_id = ?
       ORDER BY u.nombre ASC`,
      [torneoId]
    );

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron jugadores en este torneo'
      });
    }

    // Obtener datos del torneo
    const [torneoData] = await connection.query(
      `SELECT 
          t.*, 
          u.nombre as organizador_nombre,
          u.apellidos as organizador_apellidos,
          u.email as organizador_email 
       FROM torneos_sistemas t 
       LEFT JOIN usuarios u ON t.created_by = u.id 
       WHERE t.id = ?`,
      [torneoId]
    );

    if (torneoData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado'
      });
    }

    const torneo = torneoData[0];
    const torneoInfo = {
      nombre_torneo: torneo.nombre_torneo,
      sistema: torneo.sistema,
      tipo_torneo: torneo.tipo_torneo,
      ubicacion: torneo.ubicacion,
      fecha_inicio: torneo.fecha_inicio,
      fecha_fin: torneo.fecha_fin,
      puntos_banda: torneo.puntos_banda,
      organizador: {
        nombre: `${torneo.organizador_nombre} ${torneo.organizador_apellidos}`.trim(),
        email: torneo.organizador_email
      }
    };

    // Enviar emails
    const resultadosPorJugador = [];
    let totalEnviados = 0;
    let totalFallidos = 0;
    let totalPendientes = 0;
    let totalRegistrados = 0;

    for (const jugador of jugadores) {
      try {
        const esNuevo = jugador.estado_cuenta === 'pendiente_registro';
        const destinatario = {
          nombre: `${jugador.nombre} ${jugador.apellidos}`.trim(),
          email: jugador.email,
          esNuevo,
          epoca: jugador.epoca,
          banda: jugador.faccion
        };

        const resultado = await enviarInvitacionJugador(destinatario, torneoInfo);

        if (resultado.success) {
          totalEnviados++;
          if (esNuevo) totalPendientes++;
          else totalRegistrados++;

          resultadosPorJugador.push({
            jugador: destinatario.nombre,
            email: destinatario.email,
            enviado: true
          });
        } else {
          totalFallidos++;
          resultadosPorJugador.push({
            jugador: destinatario.nombre,
            email: destinatario.email,
            enviado: false,
            error: resultado.error
          });
        }

      } catch (err) {
        totalFallidos++;
        resultadosPorJugador.push({
          jugador: `${jugador.nombre} ${jugador.apellidos}`,
          email: jugador.email,
          enviado: false,
          error: err.message
        });
        console.error(`❌ Error al enviar invitación a ${jugador.email}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `Se reenviaron invitaciones a ${totalEnviados} jugadores del torneo`,
      data: {
        totales: {
          enviados: totalEnviados,
          fallidos: totalFallidos,
          pendientes: totalPendientes,
          registrados: totalRegistrados
        },
        resultadosPorJugador
      }
    });

  } catch (error) {
    console.error('❌ Error al reenviar invitaciones a todos los jugadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reenviar invitaciones a todos los jugadores',
      error: error.message
    });
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
  //METODOS PARA ACCEDER A JUGADORES DE LOS TORNEOS WARMASTER
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
                jtw.nombre_ejercito,
                jtw.lista_ejercito,
                jtw.lista_nombre,
                jtw.lista_tamaño,
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

// =======VER LISTA PDF DE UN JUGADOR=======

router.get('/:torneoId/jugadores/:jugadorId/lista-pdf', verificarToken, async (req, res) => {
    try {
        const { torneoId, jugadorId } = req.params;
        
        const [resultado] = await pool.execute(`
            SELECT 
                lista_ejercito,
                lista_nombre,
                lista_tamaño
            FROM jugador_torneo_warmaster
            WHERE torneo_id = ? AND jugador_id = ?
        `, [torneoId, jugadorId]);
        
        if (resultado.length === 0) {
            return res.status(404).json(errorResponse('Jugador no encontrado'));
        }
        
        const jugador = resultado[0];
        
        if (!jugador.lista_ejercito) {
            return res.status(404).json(errorResponse('Este jugador no tiene lista cargada'));
        }
        
        // Configurar headers para visualización en navegador
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${jugador.lista_nombre || 'lista_ejercito.pdf'}"`);
        res.setHeader('Content-Length', jugador.lista_tamaño || jugador.lista_ejercito.length);
        
        // Enviar el PDF
        res.send(jugador.lista_ejercito);
        
    } catch (error) {
        console.error('Error al obtener lista PDF:', error);
        res.status(500).json(errorResponse('Error al obtener la lista'));
    }
});

/// =====CAMBIAR ESTADO DEL TORNEO WARMASTER=====

router.put('/:torneoId/estado', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  const { torneoId } = req.params;
  const { estado } = req.body;
  
  console.log(`\n🎯 ===== INICIANDO CAMBIO DE ESTADO WARMASTER =====`);
  console.log(`📋 Torneo ID: ${torneoId}`);
  console.log(`📋 Estado solicitado: ${estado}`);
  
  try {
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
    
    // Si el estado es "finalizado", usar transacción cross-database
    if (estado === 'finalizado') {
      console.log(`\n🏁 Estado es FINALIZADO - Iniciando transacción cross-database...`);
      
      const resultado = await executeCrossTransaction(async (connTorneos, connRanking) => {
        console.log(`✅ Conexiones obtenidas`);
        
        // Verificar que el torneo existe y es Warmaster
        const [torneo] = await connTorneos.query(
          'SELECT id, created_by, estado, nombre_torneo, sistema FROM torneos_sistemas WHERE id = ? AND sistema = ?',
          [torneoId, 'WARMASTER']
        );
        
        console.log(`📊 Torneo encontrado:`, torneo[0]);
        
        if (torneo.length === 0) {
          throw new Error('Torneo WARMASTER no encontrado');
        }
        
        const estadoActual = torneo[0].estado;
        
        // Validaciones
        if (estadoActual === 'cancelado') {
          throw new Error('No se puede cambiar el estado de un torneo cancelado');
        }
        
        if (estadoActual === 'finalizado') {
          throw new Error('El torneo ya está finalizado');
        }
        
        // Actualizar el estado a finalizado
        console.log(`\n📝 Actualizando estado de torneo...`);
        await connTorneos.query(
          'UPDATE torneos_sistemas SET estado = ? WHERE id = ?',
          [estado, torneoId]
        );
        console.log(`✅ Estado actualizado a: ${estado}`);
        
        // Calcular ELO automáticamente
        console.log(`\n🎲 Llamando a actualizarEloAutomatico para WARMASTER...`);
        let resultadoElo = null;
        let errorElo = null;
        
        try {
          resultadoElo = await actualizarEloAutomatico(connTorneos, connRanking, torneoId);
          console.log(`✅ ELO calculado exitosamente:`, resultadoElo);
        } catch (eloError) {
          console.error('❌ ERROR en actualizarEloAutomatico:', eloError);
          console.error('Stack:', eloError.stack);
          errorElo = eloError.message;
        }
        
        return {
          id: parseInt(torneoId),
          nombre_torneo: torneo[0].nombre_torneo,
          sistema: torneo[0].sistema,
          estado_anterior: estadoActual,
          estado_nuevo: estado,
          elo: resultadoElo,
          errorElo: errorElo
        };
      });
      
      console.log(`\n✅ Transacción completada`);
      console.log(`📊 Resultado final:`, resultado);
      
      // Construir respuesta
      let mensaje = `Torneo finalizado correctamente`;
      
      if (resultado.elo) {
        mensaje += ` - ELO calculado: ${resultado.elo.partidasProcesadas} partidas procesadas en ${resultado.elo.sistemaJuego}`;
      }
      
      if (resultado.errorElo) {
        mensaje += ` - Advertencia: ${resultado.errorElo}`;
      }
      
      return res.json(successResponse(mensaje, resultado));
      
    } else {
      // Para otros estados (pendiente, en_curso)
      console.log(`\n📝 Cambiando estado a: ${estado}`);
      
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        const [torneo] = await connection.query(
          'SELECT id, created_by, estado, nombre_torneo FROM torneos_sistemas WHERE id = ? AND sistema = ?',
          [torneoId, 'WARMASTER']
        );
        
        if (torneo.length === 0) {
          await connection.rollback();
          return res.status(404).json(errorResponse('Torneo no encontrado'));
        }
        
        const estadoActual = torneo[0].estado;
        
        console.log(`📊 Estado actual: ${estadoActual} → Nuevo: ${estado}`);
        
        if (estadoActual === 'cancelado') {
          await connection.rollback();
          return res.status(400).json(
            errorResponse('No se puede cambiar el estado de un torneo cancelado')
          );
        }
        
        // ⚠️ Permitir revertir de finalizado SOLO si no se ha procesado ELO
        if (estadoActual === 'finalizado') {
          const [eloCheck] = await connection.query(
            'SELECT elo_procesado FROM torneos_sistemas WHERE id = ?',
            [torneoId]
          );
          
          if (eloCheck[0]?.elo_procesado) {
            await connection.rollback();
            return res.status(400).json(
              errorResponse('No se puede revertir el estado de un torneo con ELO ya procesado. Contacta con el administrador.')
            );
          }
          
          console.log(`⚠️ Revirtiendo torneo finalizado (ELO no procesado)`);
        }
        
        await connection.query(
          'UPDATE torneos_sistemas SET estado = ? WHERE id = ?',
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
        throw error;
      } finally {
        connection.release();
      }
    }
    
  } catch (error) {
    console.error('\n❌ ===== ERROR GENERAL WARMASTER =====');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json(errorResponse(error.message || 'Error al cambiar el estado del torneo'));
  }
});

  // ==========================================
  // MÉTODOS DE PARTIDAS
  // ==========================================

// ======= OBTENER PARTIDAS DE UN TORNEO =========

router.get('/:torneoId/partidasTorneoWarmaster', async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    let whereClause = 'WHERE pw.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND pw.ronda = ?';
      params.push(ronda);
    }
    
    const [partidas] = await pool.execute(`
      SELECT 
        pw.id,
        pw.torneo_id,
        pw.ronda,
        pw.mesa,
        pw.nombre_partida,
        pw.es_bye,
        pw.resultado_pw,
        pw.resultado_confirmado,
        pw.puntos_victoria_j1,
        pw.puntos_victoria_j2,
        pw.puntos_masacre_j1,
        pw.puntos_masacre_j2,
        pw.general_muerto_j1,
        pw.general_muerto_j2,
        pw.created_at,
        pw.fecha_partida,
        
        -- IDs de participación (ya son jugador_torneo_warmaster.id)
        pw.jugador1_id,
        pw.jugador2_id,

        -- Info Jugador 1
        jt1.jugador_id as jugador1_usuario_id,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u1.nombre_alias as jugador1_alias,
        jt1.ejercito as jugador1_ejercito,
        
        -- Info Jugador 2
        jt2.jugador_id as jugador2_usuario_id,
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
          ELSE jt2.ejercito
        END as jugador2_ejercito
        
      FROM partidas_warmaster pw
      
      -- JOINs: pw.jugador1_id = jugador_torneo_warmaster.id (gracias a FK)
      INNER JOIN jugador_torneo_warmaster jt1 ON pw.jugador1_id = jt1.id
      INNER JOIN usuarios u1 ON jt1.jugador_id = u1.id
      
      LEFT JOIN jugador_torneo_warmaster jt2 ON pw.jugador2_id = jt2.id AND pw.es_bye = FALSE
      LEFT JOIN usuarios u2 ON jt2.jugador_id = u2.id
      
      ${whereClause}
      ORDER BY pw.ronda, pw.mesa, pw.id
    `, params);

    console.log(`📊 Partidas obtenidas: ${partidas.length}`);
    
    const partidasFormateadas = partidas.map(p => ({
      id: p.id,
      torneo_id: p.torneo_id,
      ronda: p.ronda,
      mesa: p.mesa,
      nombre_partida: p.nombre_partida,
      es_bye: p.es_bye,
      resultado_pw: p.resultado_pw,
      resultado_confirmado: p.resultado_confirmado,
      puntos_victoria_j1: p.puntos_victoria_j1,
      puntos_victoria_j2: p.puntos_victoria_j2,
      puntos_masacre_j1: p.puntos_masacre_j1,
      puntos_masacre_j2: p.puntos_masacre_j2,
      general_muerto_j1: p.general_muerto_j1,
      general_muerto_j2: p.general_muerto_j2,
      created_at: p.created_at,
      fecha_partida: p.fecha_partida,
      
      // IDs de participación (jugador_torneo_warmaster.id)
      jugador1_id: p.jugador1_id,
      jugador2_id: p.jugador2_id,
      
      // IDs de usuario (usuarios.id) - por si el frontend los necesita
      jugador1_usuario_id: p.jugador1_usuario_id,
      jugador2_usuario_id: p.jugador2_usuario_id,
      
      // Info adicional
      jugador1_nombre: p.jugador1_nombre,
      jugador1_apellidos: p.jugador1_apellidos,
      jugador1_alias: p.jugador1_alias,
      jugador2_nombre: p.jugador2_nombre,
      jugador2_apellidos: p.jugador2_apellidos,
      jugador2_alias: p.jugador2_alias,
      
      jugador1: { 
        ejercito: p.jugador1_ejercito || null 
      },
      jugador2: p.jugador2_id ? { 
        ejercito: p.jugador2_ejercito || null 
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
      puntos_torneo_j1,
      puntos_torneo_j2,
      general_muerto_j1, 
      general_muerto_j2  
    } = req.body;
    
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
        pw.jugador1_id,                         -- Ya es jugador_torneo_warmaster.id
        pw.jugador2_id,                         -- Ya es jugador_torneo_warmaster.id
        pw.resultado_pw, 
        pw.torneo_id, 
        pw.ronda, 
        pw.resultado_confirmado,
        pw.nombre_partida,
        pw.es_bye,
        ts.tipo_torneo
      FROM partidas_warmaster pw
      INNER JOIN torneos_sistemas ts ON pw.torneo_id = ts.id
      WHERE pw.id = ? AND pw.torneo_id = ?
    `, [partidaId, torneoId]);
    
    if (partida.length === 0) {
      return res.status(404).json(
        errorResponse('Partida no encontrada')
      );
    }
    
    const jugador1_id = partida[0].jugador1_id;  // jugador_torneo_warmaster.id
    const jugador2_id = partida[0].jugador2_id;  // jugador_torneo_warmaster.id
    const nombrePartida = partida[0].nombre_partida || '';
    const esBatallaCampal = nombrePartida.toLowerCase().includes('batalla campal');
    const esBye = !jugador2_id || partida[0].es_bye;
    
    if (esBye) {
      return res.status(400).json(
        errorResponse('No se puede actualizar una partida BYE. La victoria automática ya está registrada.')
      );
    }

    if (partida[0].resultado_confirmado) {
      return res.status(400).json(
        errorResponse('No se puede actualizar una partida con resultado confirmado. El organizador debe desconfirmar el resultado primero.')
      );
    }

    const puntosMasacreJ1 = parseInt(puntos_masacre_j1) || 0;
    const puntosMasacreJ2 = parseInt(puntos_masacre_j2) || 0;

    let puntosVictoriaJ1, puntosVictoriaJ2, resultado;
    
    if (esBatallaCampal) {
      const diferencia = Math.abs(puntosMasacreJ1 - puntosMasacreJ2);
      const diferenciaEmpate = 150;
      
      if (diferencia <= diferenciaEmpate) {
        puntosVictoriaJ1 = 1;
        puntosVictoriaJ2 = 1;
        resultado = 'empate';
      } else if (puntosMasacreJ1 > puntosMasacreJ2) {
        puntosVictoriaJ1 = 3;
        puntosVictoriaJ2 = 0;
        resultado = 'victoria_j1';
      } else {
        puntosVictoriaJ1 = 0;
        puntosVictoriaJ2 = 3;
        resultado = 'victoria_j2';
      }
    } else {
      if (puntos_torneo_j1 !== undefined && puntos_torneo_j2 !== undefined) {
        const puntosPartidaJ1 = parseInt(puntos_torneo_j1) || 0;
        const puntosPartidaJ2 = parseInt(puntos_torneo_j2) || 0;
        
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
      } else {
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
      }
    }

    // Bonus por general muerto
    if (general_muerto_j1) {
      puntosVictoriaJ1 += 1;
    }
    
    if (general_muerto_j2) {
      puntosVictoriaJ2 += 1;
    }

    const valorGeneralJ1 = general_muerto_j1 ? 1 : 0;
    const valorGeneralJ2 = general_muerto_j2 ? 1 : 0;

    await pool.execute(`
      UPDATE partidas_warmaster SET
        puntos_victoria_j1 = ?, 
        puntos_victoria_j2 = ?,
        puntos_masacre_j1 = ?, 
        puntos_masacre_j2 = ?,
        general_muerto_j1 = ?,
        general_muerto_j2 = ?,
        resultado_pw = ?, 
        resultado_confirmado = FALSE
      WHERE id = ?
    `, [
      puntosVictoriaJ1, 
      puntosVictoriaJ2,
      puntosMasacreJ1, 
      puntosMasacreJ2,
      valorGeneralJ1,
      valorGeneralJ2,
      resultado,
      partidaId
    ]);
    
    res.status(200).json(
      successResponse('Partida registrada exitosamente (pendiente de confirmación)', {
        partidaId,
        resultado,
        esBatallaCampal,
        puntosVictoria: {
          jugador1: puntosVictoriaJ1,
          jugador2: puntosVictoriaJ2
        },
        puntosMasacre: {
          jugador1: puntosMasacreJ1,
          jugador2: puntosMasacreJ2
        },
        generalesMuertos: {
          jugador1MataGeneral: general_muerto_j1 ? true : false,
          jugador2MataGeneral: general_muerto_j2 ? true : false
        }
      })
    );
    
  } catch (error) {
    console.error('❌ Error al registrar partida:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ====== CONFIRMAR RESULTADO INDIVIDUAL POR ORGANIZADOR ========

router.patch('/:torneoId/partidasTorneoWarmaster/:partidaId/confirmar', verificarToken, async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const { torneoId, partidaId } = req.params;
    const { confirmar } = req.body;
    
    await connection.beginTransaction();
    
    // Traer ambos IDs: participación y usuario
    const [verificacion] = await connection.execute(
      `SELECT 
        ts.created_by,
        pw.id, 
        pw.jugador1_id as participacion_j1_id,     -- jugador_torneo_warmaster.id
        pw.jugador2_id as participacion_j2_id,     -- jugador_torneo_warmaster.id
        jt1.jugador_id as jugador1_id,             -- usuarios.id
        jt2.jugador_id as jugador2_id,             -- usuarios.id
        pw.puntos_victoria_j1, 
        pw.puntos_victoria_j2,
        pw.puntos_masacre_j1, 
        pw.puntos_masacre_j2,
        COALESCE(pw.general_muerto_j1, 0) as general_muerto_j1,
        COALESCE(pw.general_muerto_j2, 0) as general_muerto_j2,
        pw.resultado_confirmado,
        pw.resultado_pw,
        pw.es_bye
      FROM torneos_sistemas ts
      INNER JOIN partidas_warmaster pw ON pw.torneo_id = ts.id
      LEFT JOIN jugador_torneo_warmaster jt1 ON pw.jugador1_id = jt1.id
      LEFT JOIN jugador_torneo_warmaster jt2 ON pw.jugador2_id = jt2.id
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
    
    const esBye = !partidaData.participacion_j2_id || partidaData.es_bye;
    
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
      // Actualizar jugador_torneo_warmaster (usa participacion_id)
      await connection.execute(`
        UPDATE jugador_torneo_warmaster 
        SET puntos_victoria = puntos_victoria + ?,
            puntos_masacre = puntos_masacre + ?,
            general_muerto = general_muerto + ?
        WHERE id = ? AND torneo_id = ?
      `, [
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.general_muerto_j1 ? 1 : 0,
        partidaData.participacion_j1_id,
        torneoId
      ]);
      
      // INSERT clasificacion (usa jugador_id = usuarios.id)
      await connection.execute(`
        INSERT INTO clasificacion_jugadores_warmaster (
            torneo_id, jugador_id, partidas_jugadas, partidas_ganadas, 
            partidas_empatadas, partidas_perdidas, puntos_victoria_totales, 
            puntos_masacre_totales, general_muerto_total
          )
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          partidas_jugadas = partidas_jugadas + 1,
          partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
          partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
          partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
          puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
          puntos_masacre_totales = puntos_masacre_totales + VALUES(puntos_masacre_totales),
          general_muerto_total = general_muerto_total + VALUES(general_muerto_total)
      `, [
        torneoId, 
        partidaData.jugador1_id,
        j1Gana,
        j1Empata,
        j1Pierde,
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.general_muerto_j1 ? 1 : 0
      ]);
      
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_warmaster
          SET puntos_victoria = puntos_victoria + ?,
              puntos_masacre = puntos_masacre + ?,
              general_muerto = general_muerto + ?
          WHERE id = ? AND torneo_id = ?
        `, [
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.general_muerto_j2 ? 1 : 0,
          partidaData.participacion_j2_id,
          torneoId
        ]);

        await connection.execute(`
          INSERT INTO clasificacion_jugadores_warmaster (
             torneo_id, jugador_id, partidas_jugadas, partidas_ganadas, 
             partidas_empatadas, partidas_perdidas, puntos_victoria_totales, 
             puntos_masacre_totales, general_muerto_total
          )
          VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            partidas_jugadas = partidas_jugadas + 1,
            partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),       
            partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas), 
            partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
            puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
            puntos_masacre_totales = puntos_masacre_totales + VALUES(puntos_masacre_totales),
            general_muerto_total = general_muerto_total + VALUES(general_muerto_total)
        `, [
          torneoId, 
          partidaData.jugador2_id,
          j2Gana,
          j2Empata,
          j2Pierde,
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.general_muerto_j2 ? 1 : 0
        ]);
      }
      
    } else {
      // DESCONFIRMAR
      await connection.execute(`
        UPDATE jugador_torneo_warmaster
        SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
            puntos_masacre = GREATEST(0, puntos_masacre - ?),
            general_muerto = GREATEST(0, general_muerto - ?)
        WHERE id = ? AND torneo_id = ?
      `, [
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.general_muerto_j1 ? 1 : 0,
        partidaData.participacion_j1_id,
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
          general_muerto_total = GREATEST(0, general_muerto_total - ?)
        WHERE torneo_id = ? AND jugador_id = ?
      `, [
        j1Gana,
        j1Empata,
        j1Pierde,
        partidaData.puntos_victoria_j1 || 0,
        partidaData.puntos_masacre_j1 || 0,
        partidaData.general_muerto_j1 ? 1 : 0,
        torneoId,
        partidaData.jugador1_id
      ]);
      
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_warmaster
          SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
              puntos_masacre = GREATEST(0, puntos_masacre - ?),
              general_muerto = GREATEST(0, general_muerto - ?)
          WHERE id = ? AND torneo_id = ?
        `, [
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.general_muerto_j2 ? 1 : 0,
          partidaData.participacion_j2_id,
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
            general_muerto_total = GREATEST(0, general_muerto_total - ?)
          WHERE torneo_id = ? AND jugador_id = ?
        `, [    
          j2Gana,
          j2Empata,
          j2Pierde,
          partidaData.puntos_victoria_j2 || 0,
          partidaData.puntos_masacre_j2 || 0,
          partidaData.general_muerto_j2 ? 1 : 0,
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
});

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
        jt1.jugador_id as jugador1_usuario_id,
        jt2.jugador_id as jugador2_usuario_id,
        u1.nombre as jugador1_nombre,
        u1.apellidos as jugador1_apellidos,
        u2.nombre as jugador2_nombre,
        u2.apellidos as jugador2_apellidos
      FROM partidas_warmaster pw
      INNER JOIN jugador_torneo_warmaster jt1 ON pw.jugador1_id = jt1.id
      LEFT JOIN jugador_torneo_warmaster jt2 ON pw.jugador2_id = jt2.id AND pw.es_bye = FALSE
      INNER JOIN usuarios u1 ON jt1.jugador_id = u1.id
      LEFT JOIN usuarios u2 ON jt2.jugador_id = u2.id
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
    
    await connection.beginTransaction();
    
    // Eliminar emparejamientos existentes de esta ronda
    await connection.execute(
      'DELETE FROM partidas_warmaster WHERE torneo_id = ? AND ronda = ?',
      [torneoId, ronda]
    );
    
    // Insertar nuevos emparejamientos
    for (const partida of emparejamientos) {
      // Buscar ID de participación para jugador1
      const [j1] = await connection.execute(
        'SELECT id FROM jugador_torneo_warmaster WHERE jugador_id = ? AND torneo_id = ?',
        [partida.jugador1_id, torneoId]
      );
      
      if (j1.length === 0) {
        console.error(`❌ Jugador1 ${partida.jugador1_id} no está inscrito en el torneo`);
        continue;
      }
      
      const jugador1_participacion_id = j1[0].id;
      let jugador2_participacion_id = null;
      let es_bye = false;
      
      if (partida.jugador2_id) {
        const [j2] = await connection.execute(
          'SELECT id FROM jugador_torneo_warmaster WHERE jugador_id = ? AND torneo_id = ?',
          [partida.jugador2_id, torneoId]
        );
        
        if (j2.length > 0) {
          jugador2_participacion_id = j2[0].id;
        } else {
          console.error(`❌ Jugador2 ${partida.jugador2_id} no está inscrito en el torneo`);
          es_bye = true;
        }
      } else {
        es_bye = true;
      }
      
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
        jugador1_participacion_id,  // FK a jugador_torneo_warmaster.id
        jugador2_participacion_id,  // FK a jugador_torneo_warmaster.id
        ronda,
        partida.mesa || null,
        partida.nombre_partida || 'Partida sin nombre',
        es_bye,
        es_bye ? 'victoria_j1' : 'pendiente',
        es_bye ? 3 : 0,
        0,
        es_bye ? 150 : 0,
        0,
        false 
      ]);
    }
    
    // Actualizar ronda_actual del torneo
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
                COALESCE(cjw.general_muerto_total, 0) as general_muerto_total
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

// ======= ENDPOINTS PARA CORREOS - WARMASTER =======

// ======= OBTENER JUGADORES PARA CORREOS (INDIVIDUAL) =======

router.get('/:torneoId/jugadores-correos', verificarToken, verificarOrganizadorTorneo, async (req, res) => {

    try {
        const { torneoId } = req.params;

        // Verificar que el usuario es uno de los organizadores del torneo
         const [torneo] = await pool.query(
            `SELECT 
              created_by
            FROM torneos_sistemas 
            WHERE id = ?`,
            [torneoId]
          );

        if (torneo.length === 0) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }

        // Obtener jugadores con su email
        const [jugadores] = await pool.execute(`
            SELECT DISTINCT
                u.id,
                u.nombre,
                u.apellidos,
                u.email,
                CONCAT(u.nombre, ' ', u.apellidos) as nombre_completo,
                u.nombre_alias,
                jts.ejercito,
                jts.nombre_ejercito
            FROM jugador_torneo_warmaster jts
            INNER JOIN usuarios u ON jts.jugador_id = u.id
            ORDER BY u.nombre, u.apellidos
        `, [torneoId]);

        res.json(successResponse('Jugadores obtenidos', jugadores));

    } catch (error) {
        console.error('Error al obtener jugadores para correos:', error);
        res.status(500).json(errorResponse('Error al obtener jugadores'));
    }
});

// ======= ENVIAR CORREOS A PARTICIPANTES =======

router.post('/:torneoId/enviar-correo', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { torneoId } = req.params;
        const { destinatarios, asunto, mensaje, tipoTorneo } = req.body;

        // Verificar que el usuario es el organizador del torneo
          const [torneo] = await pool.query(
            `SELECT
              id,
              tipo_torneo,
              nombre_torneo,
              created_by
            FROM torneos_sistemas 
            WHERE id = ?`,
            [torneoId]
          );

        if (torneo.length === 0) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }

        // Validaciones
        if (!destinatarios || destinatarios.length === 0) {
            return res.status(400).json(errorResponse('Debes seleccionar al menos un destinatario'));
        }

        if (!asunto || !mensaje) {
            return res.status(400).json(errorResponse('El asunto y el mensaje son obligatorios'));
        }

        const [organizadores] = await pool.execute(
          `SELECT 
            torg.id as organizador_id,
            torg.torneo_id,
            torg.usuario_id,
            u.nombre,
            u.apellidos,
            u.nombre_alias,
            u.email,
            u.estado_cuenta
          FROM organizadores_torneos torg
          INNER JOIN usuarios u ON torg.usuario_id = u.id
          WHERE torg.torneo_id = ?
          ORDER BY torg.fecha_asignacion ASC`,
          [torneoId]
        );

        if(organizadores.length === 0){
          return res.status(400).json(errorResponse('No hay organizadores asignados para este torneo'));
        }

        const organizadorPrincipal = organizadores[0];
        const datosOrganizador = {
            nombre: organizadorPrincipal.nombre,
            apellidos: organizadorPrincipal.apellidos,
            nombre_completo: organizadorPrincipal.nombre_completo,
            email: organizadorPrincipal.email
        };

        const nombreTorneo = torneo[0].nombre_torneo;
        const tipoJuego = 'WARMASTER';
        let emails = [];

            // Para torneos individuales, obtener emails de jugadores
            const [jugadores] = await pool.query(`
                SELECT DISTINCT 
                    u.email, 
                    u.nombre,
                    u.apellidos,
                    CONCAT(u.nombre, ' ', u.apellidos) as nombre_completo
                FROM jugador_torneo_warmaster jts
                INNER JOIN usuarios u ON jts.jugador_id = u.id
                WHERE jts.torneo_id = ? 
                AND u.id IN (?)
            `, [torneoId, destinatarios]);

            emails = jugadores.map(j => ({
                email: j.email,
                nombre: j.nombre_completo
            }));
        

        if (emails.length === 0) {
            return res.status(400).json(errorResponse('No se encontraron destinatarios válidos'));
        }

        const enviosExitosos = [];
        const enviosFallidos = [];

        // Enviar correos
        for (const destinatario of emails) {
            
            const resultado = await emailTorneo.enviarCorreoParticipantes({
                email: destinatario.email,
                nombre: destinatario.nombre,
                nombreTorneo: nombreTorneo,
                tipoJuego: tipoJuego,
                asunto: asunto,
                mensaje: mensaje,
                nombreEquipo: destinatario.equipo || null,
                organizador: datosOrganizador
            });

            if (resultado.success) {
                enviosExitosos.push(destinatario.email);
            } else {
                enviosFallidos.push(destinatario.email);
                console.error(`❌ Error enviando a ${destinatario.email}:`, resultado.error);
            }
        }

        // Registrar el envío en logs (opcional)
        try {
            await pool.query(`
                INSERT INTO logs_correos_torneos 
                (torneo_id, sistema_juego, asunto, mensaje, destinatarios_exitosos, destinatarios_fallidos, tipo_torneo, fecha)
                VALUES (?, 'WARMASTER', ?, ?, ?, ?, ?, NOW())
            `, [
                torneoId,
                asunto,
                mensaje,
                enviosExitosos.length,
                enviosFallidos.length,
                tipoTorneo
            ]);
        } catch (logError) {
            console.error('⚠️ Error al registrar log (no crítico):', logError);
        }

        const mensajeRespuesta = enviosFallidos.length === 0
            ? `✅ Todos los correos enviados correctamente (${enviosExitosos.length})`
            : `⚠️ Correos enviados: ${enviosExitosos.length} exitosos, ${enviosFallidos.length} fallidos`;

        res.json(successResponse(mensajeRespuesta, {
            exitosos: enviosExitosos.length,
            fallidos: enviosFallidos.length,
            detalles: {
                enviosExitosos,
                enviosFallidos
            }
        }));

    } catch (error) {
        console.error('❌ Error al enviar correos:', error);
        res.status(500).json(errorResponse('Error al enviar los correos'));
    } finally {
        connection.release();
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