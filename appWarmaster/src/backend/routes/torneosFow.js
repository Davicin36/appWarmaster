import express from 'express';
import bcrypt from 'bcrypt'
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

const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
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


//==================
//RUTAS TORNEOS FOW
//==================

//=====OBTENER TORNEOS CON PAGINACIÓN=====
// FIX 1: queryParams=[userId, userId], añadido es_organizador al SELECT y JOIN con organizadores_torneos

router.get('/obtenerTorneos', async (req, res) => {
  try {
    console.log('📥 GET /api/torneosFow/obtenerTorneos');
    
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
    
    let whereClause = 'WHERE ts.sistema = "FOW"';
    let queryParams = [userId, userId]; // ✅ FIX: dos userId (es_organizador + usuario_inscrito)
    
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
        GROUP_CONCAT(DISTINCT tef.epoca ORDER BY tef.epoca SEPARATOR '|') as epocas_disponibles,
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.club as creador_club,
        COUNT(DISTINCT jtf.id) as total_participantes,
        SUM(CASE WHEN jtf.bando = 'Eje' THEN 1 ELSE 0 END) as total_eje,
        SUM(CASE WHEN jtf.bando = 'Aliados' THEN 1 ELSE 0 END) as total_aliados,
        MAX(CASE WHEN ot.usuario_id = ? THEN 1 ELSE 0 END) as es_organizador,
        MAX(CASE WHEN jtf.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_fow jtf ON ts.id = jtf.torneo_id
      LEFT JOIN torneo_epocas_fow tef ON ts.id = tef.torneo_id
      LEFT JOIN organizadores_torneos ot ON ts.id = ot.torneo_id
      ${whereClause}
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
      LIMIT ? OFFSET ?
    `, queryParams);
    
    console.log(`✅ ${torneos.length} torneos FOW obtenidos`);
    
    let countParams = [];
    let countWhereClause = 'WHERE ts.sistema = "FOW"';
    
    if (buscar.trim()) {
      countWhereClause += ' AND (ts.nombre_torneo LIKE ? OR ts.ubicacion LIKE ?)';
      const searchTerm = `%${buscar}%`;
      countParams = [searchTerm, searchTerm];
    }
    
    const [totalRows] = await pool.execute(`
      SELECT COUNT(DISTINCT ts.id) as total
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_fow jts ON ts.id = jts.torneo_id
      LEFT JOIN torneo_epocas_fow tse ON ts.id = tse.torneo_id
      ${countWhereClause}
    `, countParams);
    
    const total = totalRows[0].total;
    const totalPages = Math.ceil(total / limitNum);
    
    res.json(
      successResponse('Torneos obtenidos exitosamente', {
        torneosFow: torneos,
        paginacion: {
          paginaActual: parseInt(page),
          totalPaginas: totalPages,
          totalRegistros: total,
          registrosPorPagina: limitNum
        }
      })
    );
    
  } catch (error) {
    console.error('❌ Error al obtener torneos FOW:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

/// =====OBTENER TORNEO ESPECIFICO FOW=====
// FIX 2: params=[userId, userId, torneoId], añadido es_organizador al SELECT y JOIN

router.get('/torneo/:torneoId', async (req, res) => {
  try {
    const { torneoId } = req.params;

    console.log(`📖 GET /torneo/${torneoId} - FOW`);

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
        ts.imagen_url,
        ts.puntos_ejercito,
        ts.participantes_max,
        ts.equipos_max,
        ts.estado,
        ts.usa_frentes,
        ts.partida_ronda_1,
        ts.partida_ronda_2,
        ts.partida_ronda_3,
        ts.partida_ronda_4,
        ts.partida_ronda_5,
        ts.bases_nombre,
        ts.base_tamaño,
        ts.created_by,
        ts.created_at,
        GROUP_CONCAT(DISTINCT tse.epoca ORDER BY tse.epoca SEPARATOR '|') AS epocas_disponibles,
        u.nombre    AS creador_nombre,
        u.apellidos AS creador_apellidos,
        u.email     AS creador_email,
        u.club      AS creador_club,
        COUNT(DISTINCT jtf.id)                                        AS total_participantes,
        MAX(CASE WHEN ot.usuario_id = ? THEN 1 ELSE 0 END)           AS es_organizador,
        MAX(CASE WHEN jtf.jugador_id = ? THEN 1 ELSE 0 END)          AS usuario_inscrito
      FROM torneos_sistemas ts
      LEFT JOIN usuarios          u   ON ts.created_by  = u.id
      LEFT JOIN jugador_torneo_fow jtf ON ts.id          = jtf.torneo_id
      LEFT JOIN torneo_epocas_fow  tse ON ts.id          = tse.torneo_id
      LEFT JOIN organizadores_torneos ot ON ts.id        = ot.torneo_id
      WHERE ts.id = ? AND ts.sistema = 'FOW'
      GROUP BY ts.id
    `, [userId, userId, torneoId]); // ✅ FIX: [userId, userId, torneoId]

    if (torneos.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const torneo = torneos[0];

    let frentes = [];

    if (torneo.usa_frentes) {
      const [frentesRows] = await pool.execute(`
        SELECT id, nombre_frente, orden
        FROM fow_frentes
        WHERE torneo_id = ?
        ORDER BY orden ASC
      `, [torneoId]);

      if (frentesRows.length > 0) {
        const frenteIds = frentesRows.map(f => f.id);
        const placeholders = frenteIds.map(() => '?').join(', ');

        const [escenariosRows] = await pool.execute(`
          SELECT frente_id, ronda, nombre_partida
          FROM fow_frentes_escenarios
          WHERE frente_id IN (${placeholders})
          ORDER BY frente_id, ronda ASC
        `, frenteIds);

        const escenariosPorFrente = escenariosRows.reduce((acc, e) => {
          if (!acc[e.frente_id]) acc[e.frente_id] = {};
          acc[e.frente_id][e.ronda] = e.nombre_partida;
          return acc;
        }, {});

        frentes = frentesRows.map(f => ({
          id:            f.id,
          nombre_frente: f.nombre_frente,
          orden:         f.orden,
          escenarios:    escenariosPorFrente[f.id] || {},
        }));
      }
    }

    res.json(
      successResponse('Torneo obtenido exitosamente', {
        torneo: {
          ...torneo,
          frentes,
        }
      })
    );

  } catch (error) {
    console.error('❌ Error al obtener torneo FOW:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// =====CREAR NUEVO TORNEO FOW=====

router.post('/creandoTorneo', verificarToken, uploadMultiple.fields([
    { name: 'bases_pdf', maxCount: 1 },
    { name: 'imagen_cartel', maxCount: 1 }
]), async (req, res) => {
    try {

        const {
            nombre_torneo,
            usa_frentes: usa_frentes_raw,
            frentes: frentes_raw,
            tipo_torneo = 'Individual',
            rondas_max: rondas_max_raw,
            epocas_disponibles: epocas_raw,
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

        const usa_frentes = parseInt(usa_frentes_raw) === 1 || usa_frentes_raw === true || usa_frentes_raw === 'true';
        const rondas_max = parseInt(rondas_max_raw);
        const puntos_ejercito = parseInt(puntos_ejercito_raw);
        const participantes_max = parseInt(participantes_max_raw);

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

        let organizadores_emails = [];
        if (organizadores_raw) {
            if (typeof organizadores_raw === 'string') {
                try {
                    organizadores_emails = JSON.parse(organizadores_raw);
                } catch (e) {
                    organizadores_emails = organizadores_raw.split(',').map(e => e.trim()).filter(e => e);
                }
            } else if (Array.isArray(organizadores_raw)) {
                organizadores_emails = organizadores_raw;
            }
        }

        let frentes = [];
        if (usa_frentes && frentes_raw) {
            try {
                frentes = typeof frentes_raw === 'string' ? JSON.parse(frentes_raw) : frentes_raw;
            } catch (e) {
                return res.status(400).json(errorResponse('El formato de los frentes no es válido', e));
            }
        }

        const camposBase = ['nombre_torneo', 'rondas_max', 'epocas_disponibles', 'fecha_inicio', 'puntos_ejercito', 'participantes_max'];
        const camposFaltantes = validarCamposRequeridos(req.body, camposBase);
        if (camposFaltantes.length > 0) {
            return res.status(400).json(errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`));
        }

        if (!usa_frentes) {
            if (!partida_ronda_1 || !partida_ronda_2 || !partida_ronda_3) {
                return res.status(400).json(errorResponse('Debes seleccionar escenarios para las primeras 3 rondas'));
            }
            if (rondas_max >= 4 && !partida_ronda_4) {
                return res.status(400).json(errorResponse('Debes seleccionar el escenario para la ronda 4'));
            }
            if (rondas_max >= 5 && !partida_ronda_5) {
                return res.status(400).json(errorResponse('Debes seleccionar el escenario para la ronda 5'));
            }
        } else {
            if (!Array.isArray(frentes) || frentes.length === 0) {
                return res.status(400).json(errorResponse('Debes añadir al menos un frente'));
            }
            if (frentes.length > 6) {
                return res.status(400).json(errorResponse('Máximo 6 frentes por torneo'));
            }
            const nombresFrente = frentes.map(f => f.nombre?.trim().toLowerCase()).filter(Boolean);
            if (new Set(nombresFrente).size !== nombresFrente.length) {
                return res.status(400).json(errorResponse('Los nombres de los frentes deben ser únicos'));
            }
            for (let i = 0; i < frentes.length; i++) {
                const f = frentes[i];
                if (!f.nombre?.trim()) {
                    return res.status(400).json(errorResponse(`El frente ${i + 1} no tiene nombre`));
                }
                for (let r = 1; r <= rondas_max; r++) {
                    if (!f.escenarios?.[r]) {
                        return res.status(400).json(errorResponse(`Falta el escenario de la ronda ${r} en el frente "${f.nombre}"`));
                    }
                }
            }
        }

        if (!Array.isArray(epocas_disponibles) || epocas_disponibles.length === 0) {
            return res.status(400).json(errorResponse('Debe seleccionar al menos una época'));
        }
        if (isNaN(rondas_max) || rondas_max < 3 || rondas_max > 5) {
            return res.status(400).json(errorResponse('El número de rondas debe estar entre 3 y 5'));
        }
        if (isNaN(puntos_ejercito) || puntos_ejercito < 1000 || puntos_ejercito > 3000) {
            return res.status(400).json(errorResponse('Los puntos de ejército deben estar entre 1000 y 3000'));
        }
        if (isNaN(participantes_max) || participantes_max < 4 || participantes_max > 100) {
            return res.status(400).json(errorResponse('El número de participantes debe estar entre 4 y 100'));
        }
        if (!validarFecha(fecha_inicio)) {
            return res.status(400).json(errorResponse('La fecha de inicio no puede ser en el pasado'));
        }
        if (fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio)) {
            return res.status(400).json(errorResponse('La fecha de fin debe ser posterior a la fecha de inicio'));
        }
        if (organizadores_emails.length > 5) {
            return res.status(400).json(errorResponse('Máximo 5 organizadores adicionales permitidos'));
        }

        const [usuarios] = await pool.execute(
            'SELECT rol, nombre, apellidos FROM usuarios WHERE id = ?',
            [req.usuario.userId]
        );

        const creadorNombre = `${usuarios[0].nombre} ${usuarios[0].apellidos}`;

        if (usuarios[0].rol !== 'organizador') {
            await pool.execute(
                'UPDATE usuarios SET rol = ? WHERE id = ?',
                ['organizador', req.usuario.userId]
            );
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
                const b64 = Buffer.from(imagenFile.buffer).toString('base64');
                const dataURI = `data:${imagenFile.mimetype};base64,${b64}`;
                const resultado = await cloudinary.v2.uploader.upload(dataURI, {
                    folder: 'torneos_fow',
                    resource_type: 'auto',
                    public_id: `torneo_${Date.now()}`
                });
                imagenUrl = resultado.secure_url;
                console.log('✅ Imagen subida a Cloudinary:', imagenUrl);
            } catch (cloudinaryError) {
                console.error('❌ Error al subir a Cloudinary:', cloudinaryError);
            }
        }

        const [resultado] = await pool.execute(
            `INSERT INTO torneos_sistemas 
             (nombre_torneo, sistema, tipo_torneo, num_jugadores_equipo,
              rondas_max, fecha_inicio, fecha_fin, ubicacion, imagen_url,
              puntos_banda, puntos_ejercito, participantes_max, equipos_max,
              estado, usa_frentes,
              partida_ronda_1, partida_ronda_2, partida_ronda_3,
              partida_ronda_4, partida_ronda_5,
              bases_torneo, bases_nombre, base_tamaño, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre_torneo,
                'FOW',
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
                usa_frentes ? 1 : 0,
                usa_frentes ? 'se usan frentes' : partida_ronda_1,
                usa_frentes ? 'se usan frentes' : partida_ronda_2,
                usa_frentes ? 'se usan frentes' : partida_ronda_3,
                usa_frentes ? 'se usan frentes' : (partida_ronda_4 || null),
                usa_frentes ? 'se usan frentes' : (partida_ronda_5 || null),
                basesPdf,
                basesNombre,
                baseTamaño,
                req.usuario.userId
            ]
        );

        const torneoId = resultado.insertId;

        for (const epoca of epocas_disponibles) {
            await pool.execute(
                `INSERT INTO torneo_epocas_fow (torneo_id, epoca) VALUES (?, ?)`,
                [torneoId, epoca]
            );
        }

        if (usa_frentes) {
            for (let orden = 0; orden < frentes.length; orden++) {
                const f = frentes[orden];

                const [frenteResult] = await pool.execute(
                    `INSERT INTO fow_frentes (torneo_id, nombre_frente, orden) VALUES (?, ?, ?)`,
                    [torneoId, f.nombre.trim(), orden + 1]
                );

                const frenteId = frenteResult.insertId;

                for (let r = 1; r <= rondas_max; r++) {
                    await pool.execute(
                        `INSERT INTO fow_frentes_escenarios (frente_id, ronda, nombre_partida) VALUES (?, ?, ?)`,
                        [frenteId, r, f.escenarios[r]]
                    );
                }
            }
        }

        await pool.execute(
            `INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)`,
            [torneoId, req.usuario.userId]
        );

        let organizadoresRegistrados = [];
        let organizadoresNoRegistrados = [];

        if (organizadores_emails.length > 0) {
            for (const email of organizadores_emails) {
                const emailLower = email.toLowerCase().trim();

                const [usuarioExistente] = await pool.execute(
                    'SELECT id, nombre, apellidos, email, estado_cuenta FROM usuarios WHERE LOWER(email) = ?',
                    [emailLower]
                );

                if (usuarioExistente.length > 0) {
                    const usuario = usuarioExistente[0];

                    const [yaEsOrganizador] = await pool.execute(
                        'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND usuario_id = ?',
                        [torneoId, usuario.id]
                    );

                    if (yaEsOrganizador.length === 0) {
                        await pool.execute(
                            'INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)',
                            [torneoId, usuario.id]
                        );

                        if (usuario.estado_cuenta === 'activo') {
                            await pool.execute(
                                `UPDATE usuarios SET rol = 'organizador' WHERE id = ? AND rol != 'organizador'`,
                                [usuario.id]
                            );
                            organizadoresRegistrados.push({
                                email: usuario.email,
                                nombre: `${usuario.nombre} ${usuario.apellidos}`,
                                estado: usuario.estado_cuenta
                            });
                        } else {
                            organizadoresNoRegistrados.push({ email: usuario.email });
                        }
                    }
                } else {
                    try {
                        const [nuevoUsuario] = await pool.execute(
                            `INSERT INTO usuarios (email, nombre, apellidos, password, estado_cuenta, rol)
                             VALUES (?, ?, ?, ?, 'pendiente_registro', 'organizador')`,
                            [emailLower, 'Pendiente', 'de Registro', crypto.randomBytes(32).toString('hex')]
                        );

                        const usuarioId = nuevoUsuario.insertId;

                        await pool.execute(
                            'INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)',
                            [torneoId, usuarioId]
                        );

                        organizadoresNoRegistrados.push({ email: emailLower, usuarioId });

                    } catch (dbError) {
                        console.error(`❌ Error creando usuario pendiente para ${emailLower}:`, dbError);
                    }
                }
            }

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
                    console.error(`❌ Error enviando email a ${org.email}:`, emailError.message);
                }
            }

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
                    console.error(`❌ Error enviando email a ${org.email}:`, emailError.message);
                }
            }
        }

        res.status(201).json(
            successResponse('Torneo creado exitosamente', {
                torneoId,
                nombre_torneo,
                tipo_torneo,
                ubicacion: ubicacion || null,
                imagen_url: imagenUrl,
                usa_frentes,
                frentes_creados: usa_frentes ? frentes.length : 0,
                tiene_bases_pdf: !!basesPdf,
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
                return res.status(400).json(errorResponse('El archivo excede el tamaño máximo de 16MB'));
            }
            return res.status(400).json(errorResponse(error.message));
        }
        if (error.message === 'Solo se permiten archivos PDF') {
            return res.status(400).json(errorResponse(error.message));
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json(errorResponse('Ya existe un torneo con esa época'));
        }

        const mensaje = manejarErrorDB(error);
        res.status(500).json(errorResponse(mensaje));
    }
});

// ======ACTUALIZAR TORNEO FOW=====

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
            epoca_torneo: epoca_raw,
            fecha_inicio,
            fecha_fin,
            ubicacion,
            puntos_ejercito,
            participantes_max,
            estado,
            usa_frentes: usa_frentes_raw,
            frentes: frentes_raw,
            partida_ronda_1,
            partida_ronda_2,
            partida_ronda_3,
            partida_ronda_4,
            partida_ronda_5,
            eliminar_pdf,
            eliminar_imagen
        } = req.body;

        const [torneoExistente] = await pool.execute(
            'SELECT created_by, imagen_url, usa_frentes FROM torneos_sistemas WHERE id = ?',
            [torneoId]
        );

        if (torneoExistente.length === 0) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }

        const usa_frentes = usa_frentes_raw !== undefined
            ? (parseInt(usa_frentes_raw) === 1 || usa_frentes_raw === true || usa_frentes_raw === 'true')
            : !!torneoExistente[0].usa_frentes;

        let frentes = null;
        if (usa_frentes && frentes_raw) {
            try {
                frentes = typeof frentes_raw === 'string' ? JSON.parse(frentes_raw) : frentes_raw;
            } catch (e) {
                return res.status(400).json(errorResponse('El formato de los frentes no es válido', e));
            }
        }

        let epocas_disponibles;
        if (epoca_raw) {
            if (typeof epoca_raw === 'string') {
                epocas_disponibles = epoca_raw.split('|').map(e => e.trim()).filter(e => e);
            } else if (Array.isArray(epoca_raw)) {
                epocas_disponibles = epoca_raw;
            }
        }

        const rondasNum = rondas_max ? parseInt(rondas_max) : null;

        if (rondasNum && (rondasNum < 3 || rondasNum > 5)) {
            return res.status(400).json(errorResponse('El número de rondas debe estar entre 3 y 5'));
        }
        if (puntos_ejercito && (puntos_ejercito < 1000 || puntos_ejercito > 3000)) {
            return res.status(400).json(errorResponse('Los puntos de ejército deben estar entre 1000 y 3000'));
        }
        if (participantes_max && (participantes_max < 4 || participantes_max > 100)) {
            return res.status(400).json(errorResponse('El número de participantes debe estar entre 4 y 100'));
        }
        if (fecha_inicio && !validarFecha(fecha_inicio)) {
            return res.status(400).json(errorResponse('La fecha de inicio no puede ser en el pasado'));
        }
        if (fecha_fin && fecha_inicio && new Date(fecha_fin) < new Date(fecha_inicio)) {
            return res.status(400).json(errorResponse('La fecha de fin debe ser posterior o igual a la fecha de inicio'));
        }
        if (estado && !['pendiente', 'en_curso', 'finalizado'].includes(estado)) {
            return res.status(400).json(errorResponse('Estado inválido. Debe ser: pendiente, en_curso o finalizado'));
        }

        const camposActualizar = [];
        const valores = [];

        if (nombre_torneo !== undefined)   { camposActualizar.push('nombre_torneo = ?');  valores.push(nombre_torneo); }
        if (rondasNum !== null)            { camposActualizar.push('rondas_max = ?');      valores.push(rondasNum); }
        if (ronda_actual !== undefined)    { camposActualizar.push('ronda_actual = ?');    valores.push(ronda_actual); }
        if (fecha_inicio !== undefined)    { camposActualizar.push('fecha_inicio = ?');    valores.push(fecha_inicio) || null; }
        if (fecha_fin !== undefined) { camposActualizar.push('fecha_fin = ?'); valores.push(fecha_fin || null); }
        if (ubicacion !== undefined)       { camposActualizar.push('ubicacion = ?');       valores.push(ubicacion || null); }
        if (puntos_ejercito !== undefined) { camposActualizar.push('puntos_ejercito = ?'); valores.push(puntos_ejercito); }
        if (participantes_max !== undefined){ camposActualizar.push('participantes_max = ?'); valores.push(participantes_max); }
        if (estado !== undefined)          { camposActualizar.push('estado = ?');          valores.push(estado); }

        if (usa_frentes_raw !== undefined) {
            camposActualizar.push('usa_frentes = ?');
            valores.push(usa_frentes ? 1 : 0);
        }

        if (!usa_frentes) {
            if (partida_ronda_1 !== undefined) { camposActualizar.push('partida_ronda_1 = ?'); valores.push(partida_ronda_1); }
            if (partida_ronda_2 !== undefined) { camposActualizar.push('partida_ronda_2 = ?'); valores.push(partida_ronda_2); }
            if (partida_ronda_3 !== undefined) { camposActualizar.push('partida_ronda_3 = ?'); valores.push(partida_ronda_3); }
            if (partida_ronda_4 !== undefined) { camposActualizar.push('partida_ronda_4 = ?'); valores.push(partida_ronda_4); }
            if (partida_ronda_5 !== undefined) { camposActualizar.push('partida_ronda_5 = ?'); valores.push(partida_ronda_5); }
        }

        let imagenActualizada = false;
        let imagenEliminada = false;

        if (req.files && req.files['imagen_cartel']) {
            const imagenFile = req.files['imagen_cartel'][0];
            try {
                const b64 = Buffer.from(imagenFile.buffer).toString('base64');
                const dataURI = `data:${imagenFile.mimetype};base64,${b64}`;
                const resultado = await cloudinary.v2.uploader.upload(dataURI, {
                    folder: 'torneos_fow',
                    resource_type: 'auto',
                    public_id: `torneo_${torneoId}_${Date.now()}`
                });

                if (torneoExistente[0].imagen_url) {
                    try {
                        const urlParts = torneoExistente[0].imagen_url.split('/');
                        const publicId = urlParts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
                        await cloudinary.v2.uploader.destroy(publicId);
                    } catch (deleteError) {
                        console.warn('⚠️ No se pudo eliminar imagen anterior:', deleteError.message);
                    }
                }

                camposActualizar.push('imagen_url = ?');
                valores.push(resultado.secure_url);
                imagenActualizada = true;
            } catch (cloudinaryError) {
                console.error('❌ Error al subir imagen a Cloudinary:', cloudinaryError);
                return res.status(500).json(errorResponse('Error al subir la imagen: ' + cloudinaryError.message));
            }
        } else if (eliminar_imagen === 'true' || eliminar_imagen === true) {
            if (torneoExistente[0].imagen_url) {
                try {
                    const urlParts = torneoExistente[0].imagen_url.split('/');
                    const publicId = urlParts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
                    await cloudinary.v2.uploader.destroy(publicId);
                } catch (deleteError) {
                    console.warn('⚠️ No se pudo eliminar imagen de Cloudinary:', deleteError.message);
                }
            }
            camposActualizar.push('imagen_url = NULL');
            imagenEliminada = true;
        }

        let pdfActualizado = false;
        let pdfEliminado = false;

        if (req.files && req.files['bases_pdf']) {
            const pdfFile = req.files['bases_pdf'][0];
            camposActualizar.push('bases_torneo = ?');  valores.push(pdfFile.buffer);
            camposActualizar.push('bases_nombre = ?');  valores.push(pdfFile.originalname);
            camposActualizar.push('base_tamaño = ?');   valores.push(pdfFile.size);
            pdfActualizado = true;
        } else if (eliminar_pdf === 'true' || eliminar_pdf === true) {
            camposActualizar.push('bases_torneo = NULL');
            camposActualizar.push('bases_nombre = NULL');
            camposActualizar.push('base_tamaño = NULL');
            pdfEliminado = true;
        }

        if (camposActualizar.length > 0) {
            valores.push(torneoId);
            await pool.execute(
                `UPDATE torneos_sistemas SET ${camposActualizar.join(', ')} WHERE id = ?`,
                valores
            );
        }

        if (epocas_disponibles && Array.isArray(epocas_disponibles)) {
            await pool.execute('DELETE FROM torneo_epocas_fow WHERE torneo_id = ?', [torneoId]);
            for (const epoca of epocas_disponibles) {
                await pool.execute(
                    `INSERT INTO torneo_epocas_fow (torneo_id, epoca) VALUES (?, ?)`,
                    [torneoId, epoca]
                );
            }
        }

        let frentesActualizados = false;

        if (usa_frentes && frentes && Array.isArray(frentes) && frentes.length > 0) {
            await pool.execute('DELETE FROM fow_frentes WHERE torneo_id = ?', [torneoId]);

            const rondasActuales = rondasNum || torneoExistente[0].rondas_max;

            for (let orden = 0; orden < frentes.length; orden++) {
                const f = frentes[orden];

                const [frenteResult] = await pool.execute(
                    `INSERT INTO fow_frentes (torneo_id, nombre_frente, orden) VALUES (?, ?, ?)`,
                    [torneoId, f.nombre.trim(), orden + 1]
                );

                const frenteId = frenteResult.insertId;

                for (let r = 1; r <= rondasActuales; r++) {
                    if (f.escenarios?.[r]) {
                        await pool.execute(
                            `INSERT INTO fow_frentes_escenarios (frente_id, ronda, nombre_partida) VALUES (?, ?, ?)`,
                            [frenteId, r, f.escenarios[r]]
                        );
                    }
                }
            }
            frentesActualizados = true;
        }

        res.json(
            successResponse('Torneo actualizado exitosamente', {
                torneoId: parseInt(torneoId),
                cambios: {
                    ubicacion: ubicacion !== undefined,
                    imagen_actualizada: imagenActualizada,
                    imagen_eliminada: imagenEliminada,
                    epocas_actualizadas: !!epocas_disponibles,
                    frentes_actualizados: frentesActualizados,
                    pdf_actualizado: pdfActualizado,
                    pdf_eliminado: pdfEliminado,
                    total_campos: camposActualizar.length
                }
            })
        );

    } catch (error) {
        console.error('❌ Error al actualizar torneo:', error);

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json(errorResponse('Uno de los archivos excede el tamaño máximo de 16MB'));
            }
            return res.status(400).json(errorResponse(error.message));
        }
        if (error.message && error.message.includes('Solo se permiten')) {
            return res.status(400).json(errorResponse(error.message));
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json(errorResponse('Ya existe un torneo con ese nombre'));
        }

        const mensaje = manejarErrorDB(error);
        res.status(500).json(errorResponse(mensaje));
    }
});

// ===== OBTENER ORGANIZADORES DEL TORNEO =====

router.get('/:torneoId/organizadores', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  try {
    const { torneoId } = req.params;

    const [torneo] = await pool.execute(
      'SELECT id, created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );

    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const creadorId = torneo[0].created_by;

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
        rol: esCreador ? 'creador' : 'organizador'
      };
    });

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

router.post('/:torneoId/organizadores', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json(errorResponse('El email es obligatorio'));
    }

    const emailLimpio = email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLimpio)) {
      return res.status(400).json(errorResponse('Email inválido'));
    }

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

    const [esOrganizador] = await pool.execute(
      'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND usuario_id = ?',
      [torneoId, req.usuario.userId]
    );

    if (esOrganizador.length === 0 && creadorOriginal !== req.usuario.userId) {
      return res.status(403).json(
        errorResponse('Solo los organizadores del torneo pueden agregar más organizadores')
      );
    }

    const [usuarioInvitador] = await pool.execute(
      'SELECT nombre, apellidos, nombre_alias, email FROM usuarios WHERE id = ?',
      [req.usuario.userId]
    );

    const nombreInvitador = usuarioInvitador[0].nombre_alias || 
                           `${usuarioInvitador[0].nombre || ''} ${usuarioInvitador[0].apellidos || ''}`.trim() || 
                           usuarioInvitador[0].email;

    const [usuarioExistente] = await pool.execute(
      'SELECT id, email, estado_cuenta, password, nombre, apellidos, nombre_alias FROM usuarios WHERE email = ?',
      [emailLimpio]
    );

    let usuarioId;
    let tipoRespuesta;

    if (usuarioExistente.length > 0) {
      usuarioId = usuarioExistente[0].id;
      const estadoCuenta = usuarioExistente[0].estado_cuenta;
      const esInvitacionTemporal = usuarioExistente[0].password && 
                                   usuarioExistente[0].password.startsWith('TEMP_');

      if (estadoCuenta === 'suspendido') {
        return res.status(400).json(
          errorResponse('Este usuario está suspendido y no puede ser organizador')
        );
      }

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
        
        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)`,
          [torneoId, usuarioId]
        );

        await pool.execute(
          `UPDATE usuarios SET rol = 'organizador' WHERE id = ? AND rol != 'organizador'`,
          [usuarioId]
        );

        const nombreCompleto = usuarioExistente[0].nombre_alias || 
                              `${usuarioExistente[0].nombre || ''} ${usuarioExistente[0].apellidos || ''}`.trim() || emailLimpio;

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
        }
      } else {
        tipoRespuesta = 'pendiente_registro';
        
        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)`,
          [torneoId, usuarioId]
        );
      }

    } else {
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
          [emailLimpio, passwordTemporal]
        );

        usuarioId = resultado.insertId;
        tipoRespuesta = 'invitacion_nueva';

        await pool.execute(
          `INSERT INTO organizadores_torneos (torneo_id, usuario_id) VALUES (?, ?)`,
          [torneoId, usuarioId]
        );

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
        }

      } catch (insertError) {
        console.error('Error al crear usuario temporal:', insertError);
        if (insertError.code === 'ER_DUP_ENTRY') {
          return res.status(400).json(errorResponse('Este email ya está en uso'));
        }
        throw insertError;
      }
    }

    // ✅ FIX 3: clave corregida de 'pendiente' a 'pendiente_registro'
    const mensajes = {
      'activo': `✅ ${emailLimpio} agregado como organizador. Se le ha enviado una notificación.`,
      'pendiente_registro': `⏳ ${emailLimpio} agregado como organizador (cuenta pendiente de activación)`,
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
      return res.status(400).json(errorResponse('Error: duplicado detectado'));
    }
    
    res.status(500).json(errorResponse('Error al agregar organizador'));
  }
});

//=====ELIMINAR ORGANIZADOR DE TORNEO=====

router.delete('/:torneoId/organizadores/:organizadorId', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  try {
    const { torneoId, organizadorId } = req.params;

    const [torneo] = await pool.execute(
      'SELECT created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );

    if (torneo.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    const creadorOriginal = torneo[0].created_by;

    const [usuarioEsOrganizador] = await pool.execute(
      'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND usuario_id = ?',
      [torneoId, req.usuario.userId]
    );

    if (usuarioEsOrganizador.length === 0 && creadorOriginal !== req.usuario.userId) {
      return res.status(403).json(
        errorResponse('Solo los organizadores del torneo pueden eliminar organizadores')
      );
    }

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

    const [totalOrganizadores] = await pool.execute(
      'SELECT COUNT(*) as total FROM organizadores_torneos WHERE torneo_id = ?',
      [torneoId]
    );

    if (totalOrganizadores[0].total <= 1) {
      return res.status(400).json(
        errorResponse('No se puede eliminar. Debe quedar al menos un organizador en el torneo')
      );
    }

    if (usuarioIdAEliminar === req.usuario.userId) {
      return res.status(400).json(
        errorResponse('No puedes eliminarte a ti mismo como organizador. Pídele a otro organizador que lo haga.')
      );
    }

    if (usuarioIdAEliminar === creadorOriginal) {
      const [nuevoCreador] = await pool.execute(
        `SELECT usuario_id 
         FROM organizadores_torneos 
         WHERE torneo_id = ? AND usuario_id != ?
         ORDER BY fecha_asignacion ASC
         LIMIT 1`,
        [torneoId, usuarioIdAEliminar]
      );

      if (nuevoCreador.length > 0) {
        await pool.execute(
          'UPDATE torneos_sistemas SET created_by = ? WHERE id = ?',
          [nuevoCreador[0].usuario_id, torneoId]
        );
      }
    }

    const [result] = await pool.execute(
      'DELETE FROM organizadores_torneos WHERE id = ? AND torneo_id = ?',
      [organizadorId, torneoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('No se pudo eliminar el organizador'));
    }

    if (esInvitacionTemporal) {
      const [otrosTorneos] = await pool.execute(
        'SELECT COUNT(*) as total FROM organizadores_torneos WHERE usuario_id = ?',
        [usuarioIdAEliminar]
      );

      if (otrosTorneos[0].total === 0) {
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

// ===== REENVIAR EMAIL PARA AGREGAR ORGANIZADOR =====

router.post('/:torneoId/organizadores/:organizadorId/reenviar', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  try {
    const { torneoId, organizadorId } = req.params;

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

    const [usuarioInvitador] = await pool.execute(
      'SELECT nombre, apellidos, nombre_alias FROM usuarios WHERE id = ?',
      [req.usuario.userId]
    );
    const nombreInvitador = usuarioInvitador[0].nombre_alias || 
      `${usuarioInvitador[0].nombre} ${usuarioInvitador[0].apellidos}`.trim();

    const nombreCompleto = info.nombre_alias || 
                          `${info.nombre || ''} ${info.apellidos || ''}`.trim() || 
                          info.email;

    try {
      if (info.password && info.password.startsWith('TEMP_')) {
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
      return res.status(500).json(errorResponse('Error al enviar el email de invitación'));
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
    const { nombre_ejercito, ejercito, bando } = req.body;

    if(!nombre_ejercito || !nombre_ejercito.trim()) {
      return res.status(400).json(errorResponse('El nombre del ejército es obligatorio'));
    } 

    if (!ejercito || !ejercito.trim()) {
      return res.status(400).json(errorResponse('El ejército es obligatorio'));
    }

    if (!bando || !bando.trim()) {
      return res.status(400).json(errorResponse('Tienes que elegir un bando: EJE o ALIADOS'));
    }

    const bandoNormalizado = bando.toUpperCase();
    if (!['ALIADOS', 'EJE'].includes(bandoNormalizado)) {
      return res.status(400).json(errorResponse('El bando debe ser "Aliados" o "Eje"'));
    }

    const [torneos] = await pool.execute(
      'SELECT nombre_torneo, puntos_ejercito FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );

    if (torneos.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }

    const torneo = torneos[0];

    const [inscripcionExistente] = await pool.execute(
      'SELECT id FROM jugador_torneo_fow WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, usuarioId]
    );

    if (inscripcionExistente.length > 0) {
      return res.status(400).json(errorResponse('Ya estás inscrito en este torneo'));
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

    const [epocas] = await pool.execute(
      'SELECT epoca FROM torneo_epocas_fow WHERE torneo_id = ? LIMIT 1',
      [torneoId]
    );

    const epoca = epocas.length > 0 ? epocas[0].epoca : null;
    
    const [resultado] = await pool.execute(
      `INSERT INTO jugador_torneo_fow (
        torneo_id, jugador_id, nombre_ejercito, epoca, ejercito, bando,
        lista_ejercito, lista_nombre, lista_tamaño, pagado, puntos_victoria, puntos_torneo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [torneoId, usuarioId, nombre_ejercito, epoca, ejercito, bando, listaEjercito, listaNombre, listaTamaño]
    );

    console.log(`✅ Usuario ${usuarioId} inscrito en torneo ${torneoId}`);

    await pool.execute(
      `INSERT INTO clasificacion_jugadores_fow (
        torneo_id, jugador_id, partidas_jugadas, partidas_ganadas,
        partidas_empatadas, partidas_perdidas, puntos_victoria_totales, puntos_torneo_totales
      ) VALUES (?, ?, 0, 0, 0, 0, 0, 0)`,
      [torneoId, usuarioId]
    );

    res.json(
      successResponse('Inscripción realizada exitosamente', {
        inscripcionId: resultado.insertId,
        torneoId,
        torneoNombre: torneo.nombre_torneo,
        usuarioId,
        nombre_ejercito,
        ejercito,
        bando,
        tiene_lista_pdf: !!req.file
      })
    );

  } catch (error) {
    console.error('❌ Error al inscribirse:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(errorResponse('El archivo PDF excede el tamaño máximo de 16MB'));
      }
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(errorResponse('Ya estás inscrito en este torneo'));
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
            jtf.id, jtf.torneo_id, jtf.jugador_id, jtf.nombre_ejercito,
            jtf.ejercito, jtf.bando, jtf.lista_nombre, jtf.lista_tamaño,
            jtf.pagado, jtf.puntos_victoria, jtf.puntos_torneo, jtf.created_at
          FROM jugador_torneo_fow jtf
          WHERE jtf.torneo_id = ? AND jtf.jugador_id = ?
        `, [torneoId, jugadorId]);

        if (inscripcion.length === 0) {
          return res.status(404).json(errorResponse('No estás inscrito en este torneo'));
        }

        res.json(successResponse('Inscripción obtenida exitosamente', inscripcion[0]));

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
        const jugadorId = req.usuario.userId;
        const { nombre_ejercito, ejercito, bando } = req.body;

        if(!nombre_ejercito || !nombre_ejercito.trim()) {
            await connection.rollback();
            return res.status(400).json(errorResponse('El nombre del ejército es obligatorio'));
        } 

        if (!ejercito || !ejercito.trim()) {
            await connection.rollback();
            return res.status(400).json(errorResponse('El ejército es obligatorio'));
        }

        if(!bando || !bando.trim()) {
          await connection.rollback();
          return res.status(400).json(errorResponse('Tienes que elegir un bando : EJE o ALIADOS'));
        }

        const bandoNormalizado = bando.toUpperCase();
        if (!['ALIADOS', 'EJE'].includes(bandoNormalizado)) {
          return res.status(400).json(errorResponse('El bando debe ser "Aliados" o "Eje"'));
        }

        await connection.beginTransaction();

        const [inscripcion] = await connection.execute(
            'SELECT id FROM jugador_torneo_fow WHERE torneo_id = ? AND jugador_id = ?',
            [torneoId, jugadorId]
        );

        if (inscripcion.length === 0) {
            await connection.rollback();
            return res.status(404).json(errorResponse('No estás inscrito en este torneo'));
        }

        const [torneos] = await connection.execute(`
            SELECT ts.id, ts.nombre_torneo, ts.estado, ts.puntos_ejercito
            FROM torneos_sistemas ts
            WHERE ts.id = ? AND ts.sistema = "FOW"
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
            updateFields.push('lista_ejercito = ?', 'lista_nombre = ?', 'lista_tamaño = ?');
            updateValues.push(req.file.buffer, req.file.originalname, req.file.size);
            console.log(`📄 Nueva lista recibida: ${req.file.originalname} (${req.file.size} bytes)`);
        }

        updateValues.push(torneoId, jugadorId);

        const [resultado] = await connection.execute(`
            UPDATE jugador_torneo_fow
            SET ${updateFields.join(', ')}
            WHERE torneo_id = ? AND jugador_id = ?
        `, updateValues);

        if (resultado.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json(errorResponse('Error al actualizar inscripción'));
        }

        await connection.commit();

        const [inscripcionActualizada] = await connection.execute(`
            SELECT id, torneo_id, jugador_id, nombre_ejercito, ejercito, bando,
                   lista_nombre, lista_tamaño, pagado, puntos_victoria, puntos_torneo, created_at
            FROM jugador_torneo_fow
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
                return res.status(400).json(errorResponse('El archivo PDF excede el tamaño máximo de 5MB'));
            }
            return res.status(400).json(errorResponse(error.message));
        }
        
        res.status(500).json(errorResponse('Error al actualizar inscripción'));
    } finally {
        connection.release();
    }
});

// =====AÑADIR JUGADOR INDIVIDUAL MANUALMENTE (ADMIN)=====
// FIX 4: typo SQL `created_at'` → `created_at`

router.post('/:torneoId/add-individual-participant', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    const { participante } = req.body;
    const usuarioOrganizadorId = req.usuario.userId;

    if (!participante.nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }

    await connection.beginTransaction();

    const [torneoCheck] = await connection.query(
        `SELECT t.*, u.nombre as organizador_nombre, u.email as organizador_email
        FROM torneos_sistemas t 
        LEFT JOIN usuarios u ON t.created_by = u.id 
        WHERE t.id = ?
        GROUP BY t.id`,
        [torneoId]
    );

    if (torneoCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
    }

    if (torneoCheck[0].estado !== 'pendiente') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden añadir participantes a torneos en estado PENDIENTE'
      });
    }

    const [epocas] = await connection.query(
      'SELECT epoca FROM torneo_epocas_fow WHERE torneo_id = ? LIMIT 1',
      [torneoId]
    );
    const epoca = epocas.length > 0 ? epocas[0].epoca : null;

    const torneo = torneoCheck[0];

    let usuarioId;
    let esNuevoUsuario = false;

    if (participante.email) {
      const [usuarioExistente] = await connection.query(
        'SELECT id, estado_cuenta FROM usuarios WHERE email = ?',
        [participante.email.toLowerCase()]
      );

      if (usuarioExistente.length > 0) {
        usuarioId = usuarioExistente[0].id;

        const [yaInscrito] = await connection.query(
          'SELECT id FROM jugador_torneo_fow WHERE torneo_id = ? AND jugador_id = ?',
          [torneoId, usuarioId]
        );

        if (yaInscrito.length > 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Este usuario ya está inscrito en el torneo' });
        }
      }
    }

    if (!usuarioId) {
      const passwordTemporal = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(passwordTemporal, 10);

      const [nuevoUsuario] = await connection.query(
        `INSERT INTO usuarios (nombre, apellidos, email, password, estado_cuenta, created_at) 
         VALUES (?, 'Pendiente', ?, ?, 'pendiente_registro', NOW())`,
        [participante.nombre, participante.email || null, passwordHash]
      );
      usuarioId = nuevoUsuario.insertId;
      esNuevoUsuario = true;
    }

    // ✅ FIX 4: eliminada comilla extra en `created_at'`
    const [jugadorInsertado] = await connection.query(
      `INSERT INTO jugador_torneo_fow(
        torneo_id, jugador_id, ejercito, epoca, nombre_ejercito, bando,
        lista_ejercito, lista_nombre, lista_tamaño, pagado, puntos_victoria, puntos_torneo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        torneoId, usuarioId, 
        participante.ejercito || 'Por definir', 
        epoca,
        null,
        participante.bando || null,
        null, null, null, 0, 0, 0
      ]
    );

    const jugadorTorneoId = jugadorInsertado.insertId;

    await connection.query(
      `INSERT INTO clasificacion_jugadores_fow(
        torneo_id, jugador_id, partidas_jugadas, partidas_ganadas,
        partidas_empatadas, partidas_perdidas, puntos_victoria_totales, puntos_torneo_totales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [torneoId, usuarioId, 0, 0, 0, 0, 0, 0]
    );

    await connection.commit();

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
        if (resultado.success) emailEnviado = true;
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
      data: { jugadorTorneoId, usuarioId, esNuevoUsuario, emailEnviado }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al añadir jugador individual:', error);
    res.status(500).json({ success: false, message: 'Error al añadir jugador', error: error.message });
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

    const [jugadorData] = await connection.query(
      `SELECT jtf.id, jtf.jugador_id, u.nombre, u.apellidos, u.email, u.estado_cuenta, jtf.ejercito
       FROM jugador_torneo_fow jtf
       INNER JOIN usuarios u ON jtf.jugador_id = u.id
       WHERE jtf.id = ? AND jtf.torneo_id = ?`,
      [jugadorId, torneoId]
    );

    if (jugadorData.length === 0) {
      return res.status(404).json({ success: false, message: 'Jugador no encontrado en este torneo' });
    }

    const jugador = jugadorData[0];
    const esNuevoUsuario = jugador.estado_cuenta === 'pendiente_registro';

    const [torneoData] = await connection.query(
      `SELECT t.*, u.nombre as organizador_nombre, u.apellidos as organizador_apellidos, u.email as organizador_email 
       FROM torneos_sistemas t 
       LEFT JOIN usuarios u ON t.created_by = u.id 
       WHERE t.id = ?`,
      [torneoId]
    );

    if (torneoData.length === 0) {
      return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
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

    const destinatario = {
      nombre: `${jugador.nombre} ${jugador.apellidos}`.trim(),
      email: jugador.email,
      esNuevo: esNuevoUsuario,
      ejercito: jugador.ejercito
    };

    const resultado = await enviarInvitarJugador(destinatario, torneoInfo);

    if (resultado.success) {
      res.json({
        success: true,
        message: `Invitación reenviada correctamente a ${destinatario.nombre}`,
        data: { jugador: destinatario.nombre, email: destinatario.email, esNuevo: destinatario.esNuevo }
      });
    } else {
      res.status(500).json({ success: false, message: 'No se pudo reenviar la invitación', error: resultado.error });
    }

  } catch (error) {
    console.error('❌ Error al reenviar invitación individual:', error);
    res.status(500).json({ success: false, message: 'Error al reenviar invitación individual', error: error.message });
  } finally {
    connection.release();
  }
});

// ===== REENVIAR EMAIL A TODOS LOS JUGADORES (ORGANIZADOR) =====
// FIX 5: tabla jugador_torneo_warmaster → jugador_torneo_fow

router.post('/:torneoId/reenviarTodosJugadores', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { torneoId } = req.params;

    console.log('📧 Reenviando invitaciones a todos los jugadores del torneo:', torneoId);

    // ✅ FIX 5: jugador_torneo_warmaster → jugador_torneo_fow
    const [jugadores] = await connection.query(
      `SELECT jtf.id, jtf.jugador_id, u.nombre, u.apellidos, u.email, u.estado_cuenta, jtf.epoca, jtf.ejercito
       FROM jugador_torneo_fow jtf
       INNER JOIN usuarios u ON jtf.jugador_id = u.id
       WHERE jtf.torneo_id = ?
       ORDER BY u.nombre ASC`,
      [torneoId]
    );

    if (jugadores.length === 0) {
      return res.status(404).json({ success: false, message: 'No se encontraron jugadores en este torneo' });
    }

    const [torneoData] = await connection.query(
      `SELECT t.*, u.nombre as organizador_nombre, u.apellidos as organizador_apellidos, u.email as organizador_email 
       FROM torneos_sistemas t 
       LEFT JOIN usuarios u ON t.created_by = u.id 
       WHERE t.id = ?`,
      [torneoId]
    );

    if (torneoData.length === 0) {
      return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
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

    const resultadosPorJugador = [];
    let totalEnviados = 0, totalFallidos = 0, totalPendientes = 0, totalRegistrados = 0;

    for (const jugador of jugadores) {
      try {
        const esNuevo = jugador.estado_cuenta === 'pendiente_registro';
        const destinatario = {
          nombre: `${jugador.nombre} ${jugador.apellidos}`.trim(),
          email: jugador.email,
          esNuevo,
          ejercito: jugador.ejercito
        };

        const resultado = await enviarInvitarJugador(destinatario, torneoInfo);

        if (resultado.success) {
          totalEnviados++;
          if (esNuevo) totalPendientes++;
          else totalRegistrados++;
          resultadosPorJugador.push({ jugador: destinatario.nombre, email: destinatario.email, enviado: true });
        } else {
          totalFallidos++;
          resultadosPorJugador.push({ jugador: destinatario.nombre, email: destinatario.email, enviado: false, error: resultado.error });
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
        totales: { enviados: totalEnviados, fallidos: totalFallidos, pendientes: totalPendientes, registrados: totalRegistrados },
        resultadosPorJugador
      }
    });

  } catch (error) {
    console.error('❌ Error al reenviar invitaciones a todos los jugadores:', error);
    res.status(500).json({ success: false, message: 'Error al reenviar invitaciones', error: error.message });
  } finally {
    connection.release();
  }
});

//======ACTUALIZAR EL PAGO INSCRIPCION (solo organizadores)=====
// FIX 6: req.userId → req.usuario.userId

router.patch('/:torneoId/jugadores/:jugadorId/pago', verificarToken, async (req, res) => {
    try {
        const { torneoId, jugadorId } = req.params;
        const { pagado } = req.body;

        if (!['pendiente', 'pagado'].includes(pagado)) {
            return res.status(400).json(errorResponse('Valor de pago inválido'));
        }

        const valorPagado = pagado === 'pagado' ? 1 : 0;

        const [torneo] = await pool.execute(
            'SELECT created_by FROM torneos_sistemas WHERE id = ?',
            [torneoId]
        );
        
        if (!torneo[0]) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }
        
       const [esOrganizador] = await pool.execute(
            'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND usuario_id = ?',
            [torneoId, req.usuario.userId]
        );

        if (torneo[0].created_by !== req.usuario.userId && esOrganizador.length === 0) {
            return res.status(403).json(errorResponse('No tienes permisos'));
        }

        const [result] = await pool.execute(`
            UPDATE jugador_torneo_fow
            SET pagado = ?
            WHERE torneo_id = ? AND id = ?
        `, [valorPagado, torneoId, jugadorId]);

        if (result.affectedRows === 0) {
            return res.status(404).json(errorResponse('Inscripción no encontrada'));
        }

        res.json(successResponse(`Estado de pago actualizado a: ${pagado}`));

    } catch (error) {
        console.error('❌ Error completo:', error);
        res.status(500).json(errorResponse('Error al actualizar estado de pago'));
    }
});

// ====== VERIFICAR SI TODOS LOS PARTICIPANTES HAN PAGADO ======

router.get('/:torneoId/verificarPagos', verificarToken, async (req, res) => {
    try {
        const { torneoId } = req.params;
        const usuarioId = req.usuario.userId;

        const [torneo] = await pool.execute(
            'SELECT id, tipo_torneo, created_by FROM torneos_sistemas WHERE id = ? AND sistema = "FOW"',
            [torneoId]
        );

        if (!torneo.length) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }

        // ✅ Creador O cualquier organizador del torneo
        const [esOrganizador] = await pool.execute(
            'SELECT id FROM organizadores_torneos WHERE torneo_id = ? AND usuario_id = ?',
            [torneoId, usuarioId]
        );

        if (torneo[0].created_by !== usuarioId && esOrganizador.length === 0) {
            return res.status(403).json(errorResponse('No tienes permisos para ver esta información'));
        }

        const [jugadores] = await pool.execute(
            `SELECT COUNT(*) as total, SUM(CASE WHEN pagado = 1 THEN 1 ELSE 0 END) as pagados 
            FROM jugador_torneo_fow WHERE torneo_id = ?`,
            [torneoId]
        );

        const total = Number(jugadores[0].total);
        const pagados = Number(jugadores[0].pagados);
        const pendientes = total - pagados;
        const todosPagados = total > 0 && total === pagados;

        return res.json(
            successResponse('Estadísticas de pago obtenidas', { todosPagados, total, pagados, pendientes })
        );

    } catch (error) {
        console.error('❌ Error al verificar pagos:', error);
        res.status(500).json(errorResponse('Error al verificar pagos'));
    }
});

// =====ELIMINAR TORNEO======
// FIX 7: req.userId → req.usuario.userId

router.delete('/:torneoId/eliminarTorneo', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    const [torneoExistente] = await pool.execute(
      'SELECT created_by, nombre_torneo FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneoExistente.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    // ✅ FIX 7: req.userId → req.usuario.userId
    if (torneoExistente[0].created_by !== req.usuario.userId) {
      return res.status(403).json(errorResponse('Solo el creador del torneo puede eliminarlo'));
    }
    
    const [participantes] = await pool.execute(
      'SELECT COUNT(*) as total FROM jugador_torneo_fow WHERE torneo_id = ?',
      [torneoId]
    );
    
    if (participantes[0].total > 0) {
      return res.status(400).json(
        errorResponse('No se puede eliminar un torneo que ya tiene participantes inscritos')
      );
    }
    
    await pool.execute('DELETE FROM torneos_sistemas WHERE id = ?', [torneoId]);
    
    res.json(successResponse(`Torneo "${torneoExistente[0].nombre_torneo}" eliminado exitosamente`));
    
  } catch (error) {
    console.error('❌ Error al eliminar torneo:', error);
    res.status(500).json(errorResponse(manejarErrorDB(error)));
  }
});

// =====ELIMINAR JUGADOR TORNEO=====
// FIX 7: req.userId → req.usuario.userId

router.delete('/:torneoId/jugadores/:jugadorId', verificarToken, async (req, res) => {
  try {
    const { torneoId, jugadorId } = req.params;
    
    const [torneoExistente] = await pool.execute(
      'SELECT created_by, nombre_torneo FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneoExistente.length === 0) {
      return res.status(404).json(errorResponse('Torneo no encontrado'));
    }
    
    const [participante] = await pool.execute(
      `SELECT jtf.id, jtf.jugador_id, u.nombre, u.apellidos 
       FROM jugador_torneo_fow jtf
       INNER JOIN usuarios u ON jtf.jugador_id = u.id
       WHERE jtf.torneo_id = ? AND jtf.jugador_id = ?`,
      [torneoId, jugadorId]
    );
    
    if (participante.length === 0) {
      return res.status(404).json(errorResponse('El jugador no está inscrito en este torneo'));
    }

    // ✅ FIX 7: req.userId → req.usuario.userId
    const esCreador = torneoExistente[0].created_by === req.usuario.userId;
    const esPropiJugador = participante[0].jugador_id === req.usuario.userId;
    
    if (!esCreador && !esPropiJugador) {
      return res.status(403).json(errorResponse('No tienes permisos para eliminar esta inscripción'));
    }
    
    const jugadorInscritoId = participante[0].jugador_id;
    const nombreJugador = `${participante[0].nombre} ${participante[0].apellidos || ''}`.trim();
    
    const [partidas] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM partidas_fow 
       WHERE torneo_id = ? AND (jugador1_id = ? OR jugador2_id = ?)`,
      [torneoId, jugadorInscritoId, jugadorInscritoId]
    );
    
    if (partidas[0].total > 0) {
      return res.status(400).json(
        errorResponse(`No se puede eliminar a ${nombreJugador} porque ya tiene ${partidas[0].total} partida(s) registrada(s) en este torneo`)
      );
    }
    
    await pool.execute(
      'DELETE FROM jugador_torneo_fow WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, jugadorId]
    );
    
    res.json(
      successResponse(`${nombreJugador} ha sido eliminado del torneo "${torneoExistente[0].nombre_torneo}"`, {
        torneoId, jugadorId, nombreJugador
      })
    );
    
  } catch (error) {
    console.error('❌ Error al eliminar jugador del torneo:', error);
    res.status(500).json(errorResponse(manejarErrorDB(error)));
  }
});

// =======OBTENER JUGADORES DE UN TORNEO=======

router.get('/:torneoId/jugadores', async (req, res) => {
    try {
        const { torneoId } = req.params;
        
        const [jugadores] = await pool.execute(`
            SELECT 
                jtf.id, jtf.jugador_id,
                u.nombre as jugador_nombre, u.apellidos as jugador_apellidos,
                u.nombre_alias, u.club, u.localidad, u.pais,
                jtf.ejercito, jtf.bando, jtf.nombre_ejercito,
                jtf.lista_ejercito, jtf.lista_nombre, jtf.lista_tamaño,
                jtf.pagado, jtf.puntos_victoria, jtf.puntos_torneo,
                jtf.created_at as fecha_inscripcion
            FROM jugador_torneo_fow jtf
            INNER JOIN usuarios u ON jtf.jugador_id = u.id
            WHERE jtf.torneo_id = ?
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
            SELECT lista_ejercito, lista_nombre, lista_tamaño
            FROM jugador_torneo_fow
            WHERE torneo_id = ? AND jugador_id = ?
        `, [torneoId, jugadorId]);
        
        if (resultado.length === 0) {
            return res.status(404).json(errorResponse('Jugador no encontrado'));
        }
        
        const jugador = resultado[0];
        
        if (!jugador.lista_ejercito) {
            return res.status(404).json(errorResponse('Este jugador no tiene lista cargada'));
        }
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${jugador.lista_nombre || 'lista_ejercito.pdf'}"`);
        res.setHeader('Content-Length', jugador.lista_tamaño || jugador.lista_ejercito.length);
        res.send(jugador.lista_ejercito);
        
    } catch (error) {
        console.error('Error al obtener lista PDF:', error);
        res.status(500).json(errorResponse('Error al obtener la lista'));
    }
});

/// =====CAMBIAR ESTADO DEL TORNEO FOW=====

router.put('/:torneoId/estado', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
  const { torneoId } = req.params;
  const { estado } = req.body;
  
  try {
    if (!estado) {
      return res.status(400).json(errorResponse('El estado es requerido'));
    }
    
    const estadosPermitidos = ['pendiente', 'en_curso', 'finalizado'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json(errorResponse(`Estado no válido. Debe ser: ${estadosPermitidos.join(', ')}`));
    }
    
    if (estado === 'finalizado') {
      const resultado = await executeCrossTransaction(async (connTorneos, connRanking) => {
        const [torneo] = await connTorneos.query(
          'SELECT id, created_by, estado, nombre_torneo, sistema FROM torneos_sistemas WHERE id = ? AND sistema = ?',
          [torneoId, 'FOW']
        );
        
        if (torneo.length === 0) throw new Error('Torneo FOW no encontrado');
        
        const estadoActual = torneo[0].estado;
        
        if (estadoActual === 'cancelado') throw new Error('No se puede cambiar el estado de un torneo cancelado');
        if (estadoActual === 'finalizado') throw new Error('El torneo ya está finalizado');
        
        await connTorneos.query('UPDATE torneos_sistemas SET estado = ? WHERE id = ?', [estado, torneoId]);
        
        let resultadoElo = null;
        let errorElo = null;
        
        try {
          resultadoElo = await actualizarEloAutomatico(connTorneos, connRanking, torneoId);
        } catch (eloError) {
          console.error('❌ ERROR en actualizarEloAutomatico:', eloError);
          errorElo = eloError.message;
        }
        
        return {
          id: parseInt(torneoId),
          nombre_torneo: torneo[0].nombre_torneo,
          sistema: torneo[0].sistema,
          estado_anterior: estadoActual,
          estado_nuevo: estado,
          elo: resultadoElo,
          errorElo
        };
      });
      
      let mensaje = `Torneo finalizado correctamente`;
      if (resultado.elo) mensaje += ` - ELO calculado: ${resultado.elo.partidasProcesadas} partidas procesadas`;
      if (resultado.errorElo) mensaje += ` - Advertencia: ${resultado.errorElo}`;
      
      return res.json(successResponse(mensaje, resultado));
      
    } else {
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        const [torneo] = await connection.query(
          'SELECT id, created_by, estado, nombre_torneo FROM torneos_sistemas WHERE id = ? AND sistema = ?',
          [torneoId, 'FOW']
        );
        
        if (torneo.length === 0) {
          await connection.rollback();
          return res.status(404).json(errorResponse('Torneo no encontrado'));
        }
        
        const estadoActual = torneo[0].estado;
        
        if (estadoActual === 'cancelado') {
          await connection.rollback();
          return res.status(400).json(errorResponse('No se puede cambiar el estado de un torneo cancelado'));
        }
        
        if (estadoActual === 'finalizado') {
          const [eloCheck] = await connection.query(
            'SELECT elo_procesado FROM torneos_sistemas WHERE id = ?',
            [torneoId]
          );
          
          if (eloCheck[0]?.elo_procesado) {
            await connection.rollback();
            return res.status(400).json(
              errorResponse('No se puede revertir el estado de un torneo con ELO ya procesado.')
            );
          }
        }
        
        await connection.query('UPDATE torneos_sistemas SET estado = ? WHERE id = ?', [estado, torneoId]);
        await connection.commit();
        
        res.json(successResponse(`Estado del torneo actualizado a "${estado}"`, {
          id: parseInt(torneoId),
          nombre_torneo: torneo[0].nombre_torneo,
          estado_anterior: estadoActual,
          estado_nuevo: estado
        }));
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
    
  } catch (error) {
    console.error('❌ Error general FOW:', error.message);
    res.status(500).json(errorResponse(error.message || 'Error al cambiar el estado del torneo'));
  }
});

// ======= OBTENER PARTIDAS DE UN TORNEO =========

router.get('/:torneoId/partidasTorneoFow', async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    let whereClause = 'WHERE pf.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND pf.ronda = ?';
      params.push(ronda);
    }
    
    const [partidas] = await pool.execute(`
      SELECT 
        pf.id, pf.torneo_id, pf.ronda, pf.mesa, pf.nombre_partida, pf.es_bye,
        pf.resultado_pf, pf.resultado_confirmado,
        pf.puntos_victoria_j1, pf.puntos_victoria_j2,
        pf.puntos_torneo_j1, pf.puntos_torneo_j2,
        pf.pelotones_destruidos_vencedor, pf.created_at, pf.fecha_partida,
        pf.jugador1_id, pf.jugador2_id,
        jt1.jugador_id as jugador1_usuario_id,
        u1.nombre as jugador1_nombre, u1.apellidos as jugador1_apellidos, u1.nombre_alias as jugador1_alias,
        jt1.ejercito as jugador1_ejercito,
        jt2.jugador_id as jugador2_usuario_id,
        CASE WHEN pf.es_bye = TRUE THEN NULL ELSE u2.nombre END as jugador2_nombre,
        CASE WHEN pf.es_bye = TRUE THEN NULL ELSE u2.apellidos END as jugador2_apellidos,
        CASE WHEN pf.es_bye = TRUE THEN NULL ELSE u2.nombre_alias END as jugador2_alias,
        CASE WHEN pf.es_bye = TRUE THEN NULL ELSE jt2.ejercito END as jugador2_ejercito
      FROM partidas_fow pf
      INNER JOIN jugador_torneo_fow jt1 ON pf.jugador1_id = jt1.id
      INNER JOIN usuarios u1 ON jt1.jugador_id = u1.id
      LEFT JOIN jugador_torneo_fow jt2 ON pf.jugador2_id = jt2.id AND pf.es_bye = FALSE
      LEFT JOIN usuarios u2 ON jt2.jugador_id = u2.id
      ${whereClause}
      ORDER BY pf.ronda, pf.mesa, pf.id
    `, params);

    const partidasFormateadas = partidas.map(p => ({
      id: p.id, torneo_id: p.torneo_id, ronda: p.ronda, mesa: p.mesa,
      nombre_partida: p.nombre_partida, es_bye: p.es_bye,
      resultado_pw: p.resultado_pf, resultado_confirmado: p.resultado_confirmado,
      puntos_victoria_j1: p.puntos_victoria_j1, puntos_victoria_j2: p.puntos_victoria_j2,
      puntos_torneo_j1: p.puntos_torneo_j1, puntos_torneo_j2: p.puntos_torneo_j2,
      pelotones_destruidos_vencedor: p.pelotones_destruidos_vencedor,
      created_at: p.created_at, fecha_partida: p.fecha_partida,
      jugador1_id: p.jugador1_id, jugador2_id: p.jugador2_id,
      jugador1_usuario_id: p.jugador1_usuario_id, jugador2_usuario_id: p.jugador2_usuario_id,
      jugador1_nombre: p.jugador1_nombre, jugador1_apellidos: p.jugador1_apellidos, jugador1_alias: p.jugador1_alias,
      jugador2_nombre: p.jugador2_nombre, jugador2_apellidos: p.jugador2_apellidos, jugador2_alias: p.jugador2_alias,
      jugador1: { ejercito: p.jugador1_ejercito || null },
      jugador2: p.jugador2_id ? { ejercito: p.jugador2_ejercito || null } : null
    }));
    
    res.json(partidasFormateadas);
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ======OBTENER PARTIDA ESPECÍFICA=======

router.get('/:torneoId/partidasTorneoFow/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    const [partidas] = await pool.execute(`
      SELECT 
        pf.*,
        u1.nombre as jugador1_nombre, u1.apellidos as jugador1_apellidos, u1.nombre_alias as jugador1_alias,
        u2.nombre as jugador2_nombre, u2.apellidos as jugador2_apellidos, u2.nombre_alias as jugador2_alias,
        jtf1.ejercito as jugador1_ejercito, jtf2.ejercito as jugador2_ejercito,
        pf.ronda, ts.nombre_torneo
      FROM partidas_fow pf
      JOIN usuarios u1 ON pf.jugador1_id = u1.id
      JOIN usuarios u2 ON pf.jugador2_id = u2.id
      JOIN torneos_sistemas ts ON pf.torneo_id = ts.id
      LEFT JOIN jugador_torneo_fow jtf1 ON (pf.torneo_id = jtf1.torneo_id AND pf.jugador1_id = jtf1.jugador_id)
      LEFT JOIN jugador_torneo_fow jtf2 ON (pf.torneo_id = jtf2.torneo_id AND pf.jugador2_id = jtf2.jugador_id)
      WHERE pf.id = ?
    `, [partidaId]);
    
    if (partidas.length === 0) {
      return res.status(404).json(errorResponse('Partida no encontrada'));
    }
    
    res.json(successResponse('Partida obtenida exitosamente', { partida: partidas[0] }));
    
  } catch (error) {
    console.error('Error al obtener partida:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ====== REGISTRAR PARTIDA========

router.put('/:torneoId/partidasTorneoFow/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId, torneoId } = req.params;
    const {
      pelotones_destruidos_vencedor,
      puntos_torneo_j1, puntos_torneo_j2,
      puntos_victoria_j1, puntos_victoria_j2,
      resultado_pf
    } = req.body;

    if (resultado_pf === undefined || puntos_torneo_j1 === undefined || puntos_torneo_j2 === undefined || puntos_victoria_j1 === undefined || puntos_victoria_j2 === undefined) {
      return res.status(400).json(errorResponse('Faltan campos requeridos'));
    }

    if (!['victoria_j1', 'victoria_j2', 'empate'].includes(resultado_pf)) {
      return res.status(400).json(errorResponse('resultado_pf debe ser "victoria_j1", "victoria_j2" o "empate"'));
    }

    const [partidas] = await pool.execute(`
      SELECT pf.id, pf.jugador2_id, pf.es_bye, pf.resultado_confirmado
      FROM partidas_fow pf
      WHERE pf.id = ? AND pf.torneo_id = ?
    `, [partidaId, torneoId]);

    if (partidas.length === 0) return res.status(404).json(errorResponse('Partida no encontrada'));

    const partida = partidas[0];

    if (!partida.jugador2_id || partida.es_bye) {
      return res.status(400).json(errorResponse('No se puede registrar resultado en una partida BYE'));
    }

    if (partida.resultado_confirmado) {
      return res.status(400).json(errorResponse('Partida ya confirmada. El organizador debe desconfirmarla primero.'));
    }

    await pool.execute(`
      UPDATE partidas_fow SET
        puntos_victoria_j1 = ?, puntos_victoria_j2 = ?,
        puntos_torneo_j1 = ?, puntos_torneo_j2 = ?,
        pelotones_destruidos_vencedor = ?,
        resultado_pf = ?, resultado_confirmado = FALSE
      WHERE id = ?
    `, [
      parseInt(puntos_victoria_j1) || 0,
      parseInt(puntos_victoria_j2) || 0,
      parseInt(puntos_torneo_j1) || 0,
      parseInt(puntos_torneo_j2) || 0,
      pelotones_destruidos_vencedor ?? 0,
      resultado_pf, partidaId
    ]);

    res.status(200).json(successResponse('Partida registrada correctamente (pendiente de confirmación)', {
      partidaId, resultado_pf,
      puntos_victoria_j1: parseInt(puntos_victoria_j1) || 0,
      puntos_victoria_j2: parseInt(puntos_victoria_j2) || 0,
      puntos_torneo_j1: parseInt(puntos_torneo_j1) || 0,
      puntos_torneo_j2: parseInt(puntos_torneo_j2) || 0,
      pelotones_destruidos_vencedor: pelotones_destruidos_vencedor ?? 0
    }));

  } catch (error) {
    console.error('❌ Error al registrar partida FOW:', error);
    res.status(500).json(errorResponse(manejarErrorDB(error)));
  }
});

// ====== CONFIRMAR RESULTADO INDIVIDUAL POR ORGANIZADOR ========
// FIX 7: req.userId → req.usuario.userId

router.patch('/:torneoId/partidasTorneoFow/:partidaId/confirmar', verificarToken, async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const { torneoId, partidaId } = req.params;
    const { confirmar } = req.body;
    
    await connection.beginTransaction();
    
    const [verificacion] = await connection.execute(
      `SELECT 
        ts.created_by, pf.id, 
        pf.jugador1_id as participacion_j1_id,
        pf.jugador2_id as participacion_j2_id,
        jt1.jugador_id as jugador1_id,
        jt2.jugador_id as jugador2_id,
        pf.puntos_victoria_j1, pf.puntos_victoria_j2,
        pf.puntos_torneo_j1, pf.puntos_torneo_j2,
        COALESCE(pf.pelotones_destruidos_vencedor, 0) as pelotones_destruidos_vencedor,
        pf.resultado_confirmado, pf.resultado_pf, pf.es_bye
      FROM torneos_sistemas ts
      INNER JOIN partidas_fow pf ON pf.torneo_id = ts.id
      LEFT JOIN jugador_torneo_fow jt1 ON pf.jugador1_id = jt1.id
      LEFT JOIN jugador_torneo_fow jt2 ON pf.jugador2_id = jt2.id
      WHERE ts.id = ? AND pf.id = ?`,
      [torneoId, partidaId]
    );
    
    if (verificacion.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json(errorResponse('Torneo o partida no encontrado'));
    }
    
    const partidaData = verificacion[0];
    
    // ✅ FIX 7: req.userId → req.usuario.userId
    if (partidaData.created_by !== req.usuario.userId) {
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

    const ptJ1 = partidaData.puntos_torneo_j1 || 0;
    const ptJ2 = partidaData.puntos_torneo_j2 || 0;
    const pvJ1 = esBye ? 3 : (partidaData.puntos_victoria_j1 || 0);
    const pvJ2 = esBye ? 0 : (partidaData.puntos_victoria_j2 || 0);

    let j1Gana = 0, j1Empata = 0, j1Pierde = 0;
    let j2Gana = 0, j2Empata = 0, j2Pierde = 0;

    if (esBye) {
      j1Gana = 1;
    } else {
      switch (partidaData.resultado_pf) {
        case 'victoria_j1': j1Gana = 1; j2Pierde = 1; break;
        case 'victoria_j2': j1Pierde = 1; j2Gana = 1; break;
        case 'empate': j1Empata = 1; j2Empata = 1; break;
      }
    }
    
    if (confirmar) {
      await connection.execute(`
        UPDATE jugador_torneo_fow 
        SET puntos_victoria = GREATEST(0, puntos_victoria + ?),
            puntos_torneo   = GREATEST(0, puntos_torneo + ?)
        WHERE id = ? AND torneo_id = ?
      `, [pvJ1, ptJ1, partidaData.participacion_j1_id, torneoId]);
      
      await connection.execute(`
        INSERT INTO clasificacion_jugadores_fow (
            torneo_id, jugador_id, partidas_jugadas, partidas_ganadas,
            partidas_empatadas, partidas_perdidas, puntos_victoria_totales, puntos_torneo_totales
        ) VALUES (?, ?, 1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          partidas_jugadas = partidas_jugadas + 1,
          partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),
          partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas),
          partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
          puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
          puntos_torneo_totales = puntos_torneo_totales + VALUES(puntos_torneo_totales)
      `, [torneoId, partidaData.jugador1_id, j1Gana, j1Empata, j1Pierde, pvJ1, ptJ1]);
      
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_fow
          SET puntos_victoria = GREATEST(0, puntos_victoria + ?),
              puntos_torneo = GREATEST(0, puntos_torneo + ?)
          WHERE id = ? AND torneo_id = ?
        `, [pvJ2, ptJ2, partidaData.participacion_j2_id, torneoId]);

        await connection.execute(`
          INSERT INTO clasificacion_jugadores_fow (
             torneo_id, jugador_id, partidas_jugadas, partidas_ganadas,
             partidas_empatadas, partidas_perdidas, puntos_victoria_totales, puntos_torneo_totales
          ) VALUES (?, ?, 1, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            partidas_jugadas = partidas_jugadas + 1,
            partidas_ganadas = partidas_ganadas + VALUES(partidas_ganadas),
            partidas_empatadas = partidas_empatadas + VALUES(partidas_empatadas),
            partidas_perdidas = partidas_perdidas + VALUES(partidas_perdidas),
            puntos_victoria_totales = puntos_victoria_totales + VALUES(puntos_victoria_totales),
            puntos_torneo_totales = puntos_torneo_totales + VALUES(puntos_torneo_totales)
        `, [torneoId, partidaData.jugador2_id, j2Gana, j2Empata, j2Pierde, pvJ2, ptJ2]);
      }
      
    } else {
      await connection.execute(`
        UPDATE jugador_torneo_fow
        SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
            puntos_torneo = GREATEST(0, puntos_torneo - ?)
        WHERE id = ? AND torneo_id = ?
      `, [pvJ1, ptJ1, partidaData.participacion_j1_id, torneoId]);
      
      await connection.execute(`
        UPDATE clasificacion_jugadores_fow 
        SET 
          partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
          partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
          partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
          partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
          puntos_victoria_totales = GREATEST(0, puntos_victoria_totales - ?),
          puntos_torneo_totales = GREATEST(0, puntos_torneo_totales - ?)
        WHERE torneo_id = ? AND jugador_id = ?
      `, [j1Gana, j1Empata, j1Pierde, pvJ1, ptJ1, torneoId, partidaData.jugador1_id]);
      
      if (!esBye) {
        await connection.execute(`
          UPDATE jugador_torneo_fow
          SET puntos_victoria = GREATEST(0, puntos_victoria - ?),
              puntos_torneo = GREATEST(0, puntos_torneo - ?)
          WHERE id = ? AND torneo_id = ?
        `, [pvJ2, ptJ2, partidaData.participacion_j2_id, torneoId]);
        
        await connection.execute(`
          UPDATE clasificacion_jugadores_fow
          SET 
            partidas_jugadas = GREATEST(0, partidas_jugadas - 1),
            partidas_ganadas = GREATEST(0, partidas_ganadas - ?),
            partidas_empatadas = GREATEST(0, partidas_empatadas - ?),
            partidas_perdidas = GREATEST(0, partidas_perdidas - ?),
            puntos_victoria_totales = GREATEST(0, puntos_victoria_totales - ?),
            puntos_torneo_totales = GREATEST(0, puntos_torneo_totales - ?)
          WHERE torneo_id = ? AND jugador_id = ?
        `, [j2Gana, j2Empata, j2Pierde, pvJ2, ptJ2, torneoId, partidaData.jugador2_id]);
      }
    }
   
    await connection.execute(
      'UPDATE partidas_fow SET resultado_confirmado = ? WHERE id = ?',
      [confirmar, partidaId]
    );
    
    await connection.commit();
    connection.release();
    
    res.json(successResponse(
      confirmar 
        ? `✅ Resultado confirmado correctamente${esBye ? ' (BYE)' : ''}`
        : `⚠️ Resultado desconfirmado correctamente${esBye ? ' (BYE)' : ''}`, 
      { partidaId, confirmado: confirmar, esBye }
    ));
    
  } catch (error) {
    console.error('❌ Error al confirmar resultado:', error);
    if (connection) {
      try { await connection.rollback(); } catch (e) { console.error('Error rollback:', e.message); }
      try { connection.release(); } catch (e) { console.error('Error release:', e.message); }
    }
    res.status(500).json(errorResponse('Error al confirmar resultado'));
  }
});

// ======= OBTENER EMPAREJAMIENTOS DE RONDA INDIVIDUALES (GET) =======

router.get('/:torneoId/obtenerEmparejamientosIndividuales', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { ronda } = req.query;
    
    let whereClause = 'WHERE pf.torneo_id = ?';
    let params = [torneoId];
    
    if (ronda) {
      whereClause += ' AND pf.ronda = ?';
      params.push(ronda);
    }

    const queryConJoins = `
      SELECT 
        pf.*,
        jt1.jugador_id as jugador1_usuario_id, jt2.jugador_id as jugador2_usuario_id,
        jt1.ejercito as jugador1_ejercito, jt2.ejercito as jugador2_ejercito,
        jt1.nombre_ejercito as jugador1_nombreEjercito, jt2.nombre_ejercito as jugador2_nombreEjercito,
        u1.nombre as jugador1_nombre, u1.apellidos as jugador1_apellidos, u1.nombre_alias as jugador1_alias,
        u2.nombre as jugador2_nombre, u2.apellidos as jugador2_apellidos, u2.nombre_alias as jugador2_alias
      FROM partidas_fow pf
      INNER JOIN jugador_torneo_fow jt1 ON pf.jugador1_id = jt1.id
      LEFT JOIN jugador_torneo_fow jt2 ON pf.jugador2_id = jt2.id AND pf.es_bye = FALSE
      INNER JOIN usuarios u1 ON jt1.jugador_id = u1.id
      LEFT JOIN usuarios u2 ON jt2.jugador_id = u2.id
      ${whereClause}
      ORDER BY pf.mesa, pf.id
    `;
    
    const [partidasConJoins] = await pool.execute(queryConJoins, params);
    res.json(partidasConJoins);
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ======= GUARDAR EMPAREJAMIENTOS DE RONDA INDIVIDUAL (POST) =======

router.post('/:torneoId/guardarEmparejamientosIndividuales', verificarToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { torneoId } = req.params;
    const { emparejamientos, ronda } = req.body;
    
    if (!emparejamientos || !Array.isArray(emparejamientos)) throw new Error('emparejamientos debe ser un array');
    if (!ronda) throw new Error('ronda es requerida');
    
    await connection.beginTransaction();
    
    await connection.execute(
      'DELETE FROM partidas_fow WHERE torneo_id = ? AND ronda = ?',
      [torneoId, ronda]
    );
    
    for (const partida of emparejamientos) {
      const [j1] = await connection.execute(
        'SELECT id FROM jugador_torneo_fow WHERE jugador_id = ? AND torneo_id = ?',
        [partida.jugador1_id, torneoId]
      );
      
      if (j1.length === 0) {
        console.error(`❌ Jugador1 ${partida.jugador1_id} no está inscrito`);
        continue;
      }
      
      const jugador1_participacion_id = j1[0].id;
      let jugador2_participacion_id = null;
      let es_bye = false;
      
      if (partida.jugador2_id) {
        const [j2] = await connection.execute(
          'SELECT id FROM jugador_torneo_fow WHERE jugador_id = ? AND torneo_id = ?',
          [partida.jugador2_id, torneoId]
        );
        
        if (j2.length > 0) {
          jugador2_participacion_id = j2[0].id;
        } else {
          es_bye = true;
        }
      } else {
        es_bye = true;
      }
      
      await connection.execute(`
        INSERT INTO partidas_fow (
          torneo_id, jugador1_id, jugador2_id, ronda, mesa, nombre_partida,
          es_bye, resultado_pf, puntos_victoria_j1, puntos_victoria_j2,
          puntos_torneo_j1, puntos_torneo_j2, resultado_confirmado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        torneoId, jugador1_participacion_id, jugador2_participacion_id,
        ronda, partida.mesa || null,
        partida.nombre_partida || 'Partida sin nombre',
        es_bye, es_bye ? 'victoria_j1' : 'pendiente',
        es_bye ? 3 : 0, 0, es_bye ? 3 : 0, 0, es_bye ? 1 : 0
      ]);
    }
    
    await connection.execute(
      'UPDATE torneos_sistemas SET ronda_actual = ? WHERE id = ?',
      [ronda, torneoId]
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Emparejamientos guardados correctamente', ronda, total: emparejamientos.length });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ ERROR al guardar emparejamientos:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// ======ELIMINAR PARTIDA======
// FIX 7: req.userId → req.usuario.userId

router.delete('/:torneoId/partidasTorneoFow/:partidaId', verificarToken, async (req, res) => {
  try {
    const { partidaId } = req.params;
    
    const [partidaExistente] = await pool.execute(`
      SELECT pf.*, ts.created_by
      FROM partidas_fow pf
      JOIN torneos_sistemas ts ON pf.torneo_id = ts.id
      WHERE pf.id = ?
    `, [partidaId]);
    
    if (partidaExistente.length === 0) {
      return res.status(404).json(errorResponse('Partida no encontrada'));
    }
    
    // ✅ FIX 7: req.userId → req.usuario.userId
    if (partidaExistente[0].created_by !== req.usuario.userId) {
      return res.status(403).json(errorResponse('Solo el creador del torneo puede eliminar partidas'));
    }
    
    await pool.execute('DELETE FROM partidas_fow WHERE id = ?', [partidaId]);
    
    res.json(successResponse('Partida eliminada exitosamente'));
    
  } catch (error) {
    console.error('Error al eliminar partida:', error);
    res.status(500).json(errorResponse(manejarErrorDB(error)));
  }
});

//=======OBTENER CLASIFICACION GENERAL + POR BANDOS=========

router.get('/:torneoId/obtenerClasificacionIndividual', async (req, res) => {
  try {
    const { torneoId } = req.params;

    const [clasificacion] = await pool.execute(`
      SELECT 
        cjf.id, cjf.jugador_id,
        u.nombre as jugador_nombre, u.apellidos as jugador_apellidos, u.club,
        jtf.nombre_ejercito, jtf.ejercito, jtf.bando,
        COALESCE(cjf.partidas_jugadas, 0) as partidas_jugadas,
        COALESCE(cjf.partidas_ganadas, 0) as partidas_ganadas,
        COALESCE(cjf.partidas_empatadas, 0) as partidas_empatadas,
        COALESCE(cjf.partidas_perdidas, 0) as partidas_perdidas,
        COALESCE(cjf.puntos_victoria_totales, 0) as puntos_victoria_totales,
        COALESCE(cjf.puntos_torneo_totales, 0) as puntos_torneo_totales
      FROM clasificacion_jugadores_fow cjf
      INNER JOIN usuarios u ON cjf.jugador_id = u.id
      LEFT JOIN jugador_torneo_fow jtf ON cjf.jugador_id = jtf.jugador_id AND cjf.torneo_id = jtf.torneo_id 
      WHERE cjf.torneo_id = ?
      ORDER BY puntos_victoria_totales DESC, puntos_torneo_totales DESC
    `, [torneoId]);

    const eje = clasificacion
      .filter(j => j.bando === 'Eje')
      .map((jugador, index) => ({ ...jugador, posicion_bando: index + 1 }));

    const aliados = clasificacion
      .filter(j => j.bando === 'Aliados')
      .map((jugador, index) => ({ ...jugador, posicion_bando: index + 1 }));

    const general = clasificacion.map((jugador, index) => ({ ...jugador, posicion_general: index + 1 }));

    const estadisticas = {
      total_jugadores: clasificacion.length,
      total_eje: eje.length,
      total_aliados: aliados.length,
      partidas_totales: clasificacion.reduce((sum, j) => sum + j.partidas_jugadas, 0)
    };

    res.json(successResponse('Clasificación obtenida exitosamente', { general, eje, aliados, estadisticas }));

  } catch (error) {
    console.error('❌ Error al obtener la clasificación:', error);
    res.status(500).json(errorResponse('Error al obtener la clasificación'));
  }
});

// ======= OBTENER JUGADORES PARA CORREOS (INDIVIDUAL) =======
// FIX 4: añadido WHERE jtf.torneo_id = ?

router.get('/:torneoId/jugadores-correos', verificarToken, verificarOrganizadorTorneo, async (req, res) => {
    try {
        const { torneoId } = req.params;

        const [torneo] = await pool.query(
            `SELECT created_by FROM torneos_sistemas WHERE id = ?`,
            [torneoId]
        );

        if (torneo.length === 0) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }

        // ✅ FIX 4: añadido WHERE jtf.torneo_id = ?
        const [jugadores] = await pool.execute(`
            SELECT DISTINCT
                u.id, u.nombre, u.apellidos, u.email,
                CONCAT(u.nombre, ' ', u.apellidos) as nombre_completo,
                u.nombre_alias, jtf.ejercito, jtf.nombre_ejercito
            FROM jugador_torneo_fow jtf
            INNER JOIN usuarios u ON jtf.jugador_id = u.id
            WHERE jtf.torneo_id = ?
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

        const [torneo] = await pool.query(
            `SELECT id, tipo_torneo, nombre_torneo, created_by FROM torneos_sistemas WHERE id = ?`,
            [torneoId]
        );

        if (torneo.length === 0) {
            return res.status(404).json(errorResponse('Torneo no encontrado'));
        }

        if (!destinatarios || destinatarios.length === 0) {
            return res.status(400).json(errorResponse('Debes seleccionar al menos un destinatario'));
        }

        if (!asunto || !mensaje) {
            return res.status(400).json(errorResponse('El asunto y el mensaje son obligatorios'));
        }

        const [organizadores] = await pool.execute(
          `SELECT torg.id as organizador_id, torg.usuario_id,
            u.nombre, u.apellidos, u.nombre_alias, u.email, u.estado_cuenta
          FROM organizadores_torneos torg
          INNER JOIN usuarios u ON torg.usuario_id = u.id
          WHERE torg.torneo_id = ?
          ORDER BY torg.fecha_asignacion ASC`,
          [torneoId]
        );

        if (organizadores.length === 0) {
            return res.status(400).json(errorResponse('No hay organizadores asignados para este torneo'));
        }

        const organizadorPrincipal = organizadores[0];
        const datosOrganizador = {
            nombre: organizadorPrincipal.nombre,
            apellidos: organizadorPrincipal.apellidos,
            email: organizadorPrincipal.email
        };

        const nombreTorneo = torneo[0].nombre_torneo;
        const tipoJuego = 'FOW';

        const [jugadores] = await pool.query(`
            SELECT DISTINCT 
                u.email, u.nombre, u.apellidos,
                CONCAT(u.nombre, ' ', u.apellidos) as nombre_completo
            FROM jugador_torneo_fow jtf
            INNER JOIN usuarios u ON jtf.jugador_id = u.id
            WHERE jtf.torneo_id = ? AND u.id IN (?)
        `, [torneoId, destinatarios]);

        const emails = jugadores.map(j => ({ email: j.email, nombre: j.nombre_completo }));

        if (emails.length === 0) {
            return res.status(400).json(errorResponse('No se encontraron destinatarios válidos'));
        }

        const enviosExitosos = [];
        const enviosFallidos = [];

        for (const destinatario of emails) {
            const resultado = await emailTorneo.enviarCorreoParticipantes({
                email: destinatario.email,
                nombre: destinatario.nombre,
                nombreTorneo, tipoJuego, asunto, mensaje,
                nombreEquipo: null,
                organizador: datosOrganizador
            });

            if (resultado.success) {
                enviosExitosos.push(destinatario.email);
            } else {
                enviosFallidos.push(destinatario.email);
                console.error(`❌ Error enviando a ${destinatario.email}:`, resultado.error);
            }
        }

        try {
            await pool.query(`
                INSERT INTO logs_correos_torneos 
                (torneo_id, sistema_juego, asunto, mensaje, destinatarios_exitosos, destinatarios_fallidos, tipo_torneo, fecha)
                VALUES (?, 'FOW', ?, ?, ?, ?, ?, NOW())
            `, [torneoId, asunto, mensaje, enviosExitosos.length, enviosFallidos.length, tipoTorneo]);
        } catch (logError) {
            console.error('⚠️ Error al registrar log (no crítico):', logError);
        }

        const mensajeRespuesta = enviosFallidos.length === 0
            ? `✅ Todos los correos enviados correctamente (${enviosExitosos.length})`
            : `⚠️ Correos enviados: ${enviosExitosos.length} exitosos, ${enviosFallidos.length} fallidos`;

        res.json(successResponse(mensajeRespuesta, {
            exitosos: enviosExitosos.length,
            fallidos: enviosFallidos.length,
            detalles: { enviosExitosos, enviosFallidos }
        }));

    } catch (error) {
        console.error('❌ Error al enviar correos:', error);
        res.status(500).json(errorResponse('Error al enviar los correos'));
    } finally {
        connection.release();
    }
});

// =====DESCARGAR PDF DE BASES DEL TORNEO=====

router.get('/:torneoId/bases-pdf', async (req, res) => {
  try {
    const { torneoId } = req.params;
    
    const [result] = await pool.execute(
      'SELECT bases_torneo, bases_nombre FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (result.length === 0) return res.status(404).json(errorResponse('Torneo no encontrado'));
    
    const torneo = result[0];
    
    if (!torneo.bases_torneo) return res.status(404).json(errorResponse('Este torneo no tiene bases en PDF'));
    
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
    
    const [torneo] = await pool.execute(
      'SELECT created_by FROM torneos_sistemas WHERE id = ?',
      [torneoId]
    );
    
    if (torneo.length === 0) return res.status(404).json(errorResponse('Torneo no encontrado'));
    
    const esOrganizador = torneo[0].created_by === usuarioActual;
    const esMiLista = parseInt(jugadorId) === usuarioActual;
    
    if (!esOrganizador && !esMiLista) {
      return res.status(403).json(errorResponse('No tienes permiso para descargar esta lista'));
    }
    
    const [result] = await pool.execute(
      'SELECT lista_ejercito, lista_nombre FROM jugador_torneo_fow WHERE torneo_id = ? AND jugador_id = ?',
      [torneoId, jugadorId]
    );
    
    if (result.length === 0) return res.status(404).json(errorResponse('Inscripción no encontrada'));
    
    const inscripcion = result[0];
    
    if (!inscripcion.lista_ejercito) {
      return res.status(404).json(errorResponse('Este jugador no ha subido lista de ejército'));
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${inscripcion.lista_nombre || 'lista_ejercito.pdf'}"`);
    res.send(inscripcion.lista_ejercito);
    
  } catch (error) {
    console.error('❌ Error al descargar PDF:', error);
    res.status(500).json(errorResponse('Error al descargar el PDF'));
  }
});

export default router;