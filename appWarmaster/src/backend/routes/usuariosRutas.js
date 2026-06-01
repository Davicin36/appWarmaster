// routes/usuariosRutas.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { transporter } from "../utils/emailHelpers.js";
import { promisify } from 'util';
import { verificarToken } from '../middleware/auth.js';
import crypto from 'crypto';
import { pool } from '../config/bd.js';
import { validarCodigoPostal } from '../utils/validaciones.js';
import emailRecuperar  from '../utils/emailRecuperar.js';
import { 
  validarEmail, 
  validarCamposRequeridos, 
  errorResponse, 
  successResponse,
  manejarErrorDB 
} from '../utils/helpers.js';

// ✅ Al inicio del archivo, convierte jwt.verify a Promise
const verifyToken = promisify(jwt.verify);

const router = express.Router(); 

// =======LISTAR TODOS LOS USUARIOS===========

router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/usuarios - Listando todos los usuarios');
    
    const [usuarios] = await pool.execute(`
      SELECT 
        id,
        nombre,
        apellidos,
        nombre_alias,
        club,
        email,
        rol,
        localidad,
        pais,
        created_at
      FROM usuarios
      ORDER BY created_at DESC
    `);
    
    res.json(
      successResponse('Usuarios obtenidos exitosamente', {
        usuarios,
        total: usuarios.length
      })
    );
    
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ======REGISTRO DE USUARIO=======

router.post('/registro', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const {
      nombre,
      apellidos,
      nombre_alias,
      club,
      email,
      codigo_postal,
      localidad,
      pais,
      password,
      aceptaTerminos
    } = req.body;

    await connection.beginTransaction();

    if (!aceptaTerminos) {
      await connection.rollback();
      return res.status(400).json(
        errorResponse('Debes aceptar los Términos y Condiciones')
      );
    }

    // VERIFICAR SI YA EXISTE UN USUARIO PENDIENTE
    const [usuarioExistente] = await connection.execute(
      'SELECT id, estado_cuenta FROM usuarios WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    if (usuarioExistente.length > 0) {
      const usuario = usuarioExistente[0];

      // ✅ SI ESTÁ PENDIENTE, ACTUALIZAR
      if (usuario.estado_cuenta === 'pendiente_registro') {
        await connection.execute(
          `UPDATE usuarios 
           SET nombre = ?,
               apellidos = ?,
               nombre_alias = ?,
               club = ?,
               codigo_postal = ?,
               localidad = ?,
               pais = ?,
               password = ?,
               acepta_terminos = ?,
               estado_cuenta = 'activo'
           WHERE id = ?`,
          [
            nombre,
            apellidos || null,
            nombre_alias || null,
            club || null,
            codigo_postal || null,
            localidad || null,
            pais || null,
            hashedPassword,
            aceptaTerminos,
            usuario.id
          ]
        );

        await connection.commit();

        // Generar token
        const token = jwt.sign(
          { userId: usuario.id, email: email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json(
          successResponse('Registro completado exitosamente', {
            token,
            usuario: {
              id: usuario.id,
              nombre,
              apellidos,
              email: email.toLowerCase()
            }
          })
        );
      } else {
        // ❌ Si ya está activo, error de email duplicado
        await connection.rollback();
        return res.status(400).json(
          errorResponse('Este email ya está registrado')
        );
      }
    }

    // ✅ SI NO EXISTE, CREAR NUEVO USUARIO
    const [resultado] = await connection.execute(
      `INSERT INTO usuarios (
        nombre,
        apellidos,
        nombre_alias,
        club,
        email,
        codigo_postal,
        localidad,
        pais,
        password,
        acepta_terminos,
        estado_cuenta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellidos || null,
        nombre_alias || null,
        club || null,
        email.toLowerCase().trim(),
        codigo_postal || null,
        localidad || null,
        pais || null,
        hashedPassword,
        aceptaTerminos,
        'activo'
      ]
    );

    const nuevoUserId = resultado.insertId;

    await connection.commit();

    // Generar token
    const token = jwt.sign(
      { userId: nuevoUserId, email: email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json(
      successResponse('Usuario registrado exitosamente', {
        token,
        usuario: {
          id: nuevoUserId,
          nombre,
          apellidos,
          email: email.toLowerCase()
        }
      })
    );

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error en registro:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('Este email ya está registrado')
      );
    }

    res.status(500).json(
      errorResponse('Error al registrar usuario')
    );
  } finally {
    connection.release();
  }
});

// ======LOGIN=========

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      console.log('❌ Campos vacíos');
      return res.status(400).json({
        success: false,
        mensaje: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    console.log('🔍 Buscando usuario en BD...');
    const [usuarios] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (usuarios.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales inválidas'
      });
    }

    const usuario = usuarios[0];
    
    const passwordValida = await bcrypt.compare(password, usuario.password);
    
    
    if (!passwordValida) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = jwt.sign(
      { 
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      mensaje: 'Login exitoso',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          nombre_alias: usuario.nombre_alias,
          club: usuario.club,
          email: usuario.email,
          rol: usuario.rol,
          localidad: usuario.localidad,
          pais: usuario.pais
        }
      }
    });

  } catch (error) {
    console.error('💥 ERROR FATAL en login:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

// ======VERIFICAR TOKEN=======

router.get('/verificar', async (req, res) => {
  try {
    // Extraer token del header
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json(
        errorResponse('Token no proporcionado')
      );
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json(
        errorResponse('Token no proporcionado')
      );
    }
    
    let decoded;
    try {
      decoded = await verifyToken(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('Error verificando token:', err.message);
      return res.status(401).json(
        errorResponse('Token inválido o expirado')
      );
    }
    
    // Buscar usuario en la base de datos
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, apellidos, nombre_alias, club, email, rol, localidad, pais
       FROM usuarios WHERE id = ?`,
      [decoded.userId]
    );
    
    if (usuarios.length === 0) {
      return res.status(401).json(
        errorResponse('Usuario no encontrado')
      );
    }
    
    const usuario = usuarios[0];
    
    // Respuesta exitosa
    return res.json(
      successResponse('Token válido', {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          nombre_alias: usuario.nombre_alias,
          club: usuario.club,
          email: usuario.email,
          rol: usuario.rol,
          localidad: usuario.localidad,
          pais: usuario.pais
        }
      })
    );
    
  } catch (error) {
    console.error('Error en verificación:', error);
    return res.status(500).json(
      errorResponse('Error interno del servidor')
    );
  }
});

// ======ACTUALIZAR PERFIL=======

router.put('/actualizarPerfil', async (req, res) => {

  try {
    console.log(' PUT /actualizarPerfil - Iniciando actualización')

    const authHeader = req.headers['authorization']

    if(!authHeader) {
      return res.status(401).json(
        errorResponse('Token no proporcionado')
      )
    }

    const token = authHeader.split(' ')[1]

    if(!token) {
      return res.status(401).json(
        errorResponse('Token no proporcionado')
      )   
    }

    //verificar el token
    let decoded
    try {
      decoded = await verifyToken (token, process.env.JWT_SECRET)
    }catch (error) {
      return res.status(401).json(
        errorResponse('Token inválido o expirado')
      )
    }

    let { nombre, apellidos, nombre_alias, club, email, localidad, pais, codigo_postal } = req.body

    nombre = nombre?.trim();
    apellidos = apellidos?.trim();
    nombre_alias = nombre_alias?.trim() || null;
    club = club?.trim() || null;
    email = email?.trim().toLowerCase();
    localidad = localidad?.trim();
    pais = pais?.trim();
    codigo_postal = codigo_postal?.trim()
    
    //validar campor requeridos
    const camposFaltantes = validarCamposRequeridos(
      req.body, 
      ['nombre', 'apellidos', 'email', 'pais', 'localidad', 'codigo_postal']
    );
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      );
    }

    //validar email
    if (!validarEmail(email)){
      return res.status(401).json(
        errorResponse('Formato email no válido')
      )
    }

    if (!localidad || localidad.length < 2) {
      return res.status(400).json(
        errorResponse('La localidad debe tener al menos 2 caracteres')
      );
    }

    if (localidad.length > 100) {
      return res.status(400).json(
        errorResponse('La localidad no puede superar los 100 caracteres')
      );
    }

    if (!pais || pais.length < 2) {
      return res.status(400).json(
        errorResponse('Debes seleccionar un país válido')
      );
    }

    const validacionCP = validarCodigoPostal(codigo_postal, pais);
    
    if (!validacionCP.valido) {
      return res.status(400).json(
        errorResponse(validacionCP.mensaje || 'Código postal inválido')
      );
    }

    //verificar si el email ya existe y poder excluir al usuario actual
    const [existeEmail] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [email, decoded.userId]
    )

    if (existeEmail.length >0){
      return res.status(401).json(
        errorResponse('El email ya esta en uso por otro usuario')
      )
    }

    //actualizar el usuario
   const [resultado] = await pool.execute(
      `UPDATE usuarios
       SET nombre = ?, 
           apellidos = ?, 
           nombre_alias = ?, 
           club = ?, 
           email = ?, 
           pais = ?,
           codigo_postal = ?,
           localidad = ?
       WHERE id = ?`,
      [
        nombre, 
        apellidos, 
        nombre_alias, 
        club, 
        email, 
        pais,
        codigo_postal,
        localidad, 
        decoded.userId
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json(
        errorResponse('Usuario no encontrado')
      );
    }

    //obtener los datos actualizados
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, apellidos, nombre_alias, club, email, rol, 
              pais, codigo_postal, localidad
       FROM usuarios 
       WHERE id = ?`,
      [decoded.userId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json(
        errorResponse('Usuario no encontrado')
      );
    }
    
    const usuario = usuarios[0];
    
    return res.json(
      successResponse('Perfil actualizado exitosamente', {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          nombre_alias: usuario.nombre_alias,
          club: usuario.club,
          email: usuario.email,
          rol: usuario.rol,
          localidad: usuario.localidad,
          pais: usuario.pais,
          codigo_postal: usuario.codigo_postal
        }
      })
    );
    
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    const mensaje = manejarErrorDB(error);
    return res.status(500).json(errorResponse(mensaje));
  }
});

// ======CAMBIAR CONTRASEÑA==========

router.post('/cambiarPassword', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json(errorResponse('Token no proporcionado'));
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json(errorResponse('Token no proporcionado'));
    }
    //veririficar token
     let decoded;
      try {
        decoded = await verifyToken(token, process.env.JWT_SECRET);
      } catch (err) {
          return res.status(401).json(
              errorResponse('Token inválido o expirado')
          );
        }

    const { passwordActual, passwordNueva } = req.body;
    
    // Validar campos
    const camposFaltantes = validarCamposRequeridos(req.body, ['passwordActual', 'passwordNueva']);
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos: ${camposFaltantes.join(', ')}`)
      );
    }
    
    if (passwordNueva.length < 6) {
      return res.status(400).json(
        errorResponse('La nueva contraseña debe tener al menos 6 caracteres')
      );
    }
    
    // Obtener usuario actual y obtener su contraseña
    const [usuarios] = await pool.execute(
      'SELECT password FROM usuarios WHERE id = ?',
      [decoded.userId]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json(errorResponse('Usuario no encontrado'));
    }
    
    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(passwordActual, usuarios[0].password);
    if (!passwordValida) {
      return res.status(400).json(errorResponse('Contraseña actual incorrecta'));
    }
    
    // Encriptar nueva contraseña
    const passwordEncriptada = await bcrypt.hash(passwordNueva, 12);
    
    // Actualizar contraseña
    await pool.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [passwordEncriptada, decoded.userId]
    );
    
    return res.status(200).json(
      successResponse('Contraseña cambiada exitosamente'));
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// =======CAMBIAR ROL A ORGANIZADOR========

router.post('/convertirOrganizador', async (req, res) => {
  try {
    // Extraer token
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json(
        errorResponse('Token no proporcionado')
      );
    }
    
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json(
        errorResponse('Token no proporcionado')
      );
    }
    // Verificar token
    let decoded;
    try {
      decoded = await verifyToken(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json(
        errorResponse('Token inválido o expirado')
      );
    }
    
    // Actualizar rol del usuario a 'organizador'
    await pool.execute(
      'UPDATE usuarios SET rol = ? WHERE id = ?',
      ['organizador', decoded.userId]
    );
    
    // Obtener datos actualizados del usuario
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, apellidos, nombre_alias, club, email, rol 
       FROM usuarios WHERE id = ?`,
      [decoded.userId]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json(
        errorResponse('Usuario no encontrado')
      );
    }
    
    const usuario = usuarios[0];
    
    // ✅ Respuesta exitosa con datos actualizados
    return res.status(200).json(
      successResponse('Rol actualizado a organizador', {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          nombre_alias: usuario.nombre_alias,
          club: usuario.club,
          email: usuario.email,
          rol: usuario.rol,
          localidad: usuario.localidad,
          pais: usuario.pais
        }
      })
    );
    
  } catch (error) {
    console.error('❌ Error cambiando rol:', error);
    return res.status(500).json(
      errorResponse('Error interno del servidor')
    );
  }
});

// ======OBTENER TODOS LOS TORNEOS DEL SISTEMA======

router.get('/torneos', async (req, res) => {
    try {
        const query = `
            SELECT 
                ts.*,
                u.nombre as creador_nombre,
                u.apellidos as creador_apellidos,
                -- Contar según tipo de torneo (Individual o Por equipos)
                CASE 
                    WHEN ts.tipo_torneo = 'Individual' THEN
                        CASE 
                            WHEN ts.sistema = 'SAGA' THEN (
                                SELECT COUNT(*) 
                                FROM jugador_torneo_saga jts 
                                WHERE jts.torneo_id = ts.id
                            )
                            WHEN ts.sistema = 'WARMASTER' THEN (
                                SELECT COUNT(*) 
                                FROM jugador_torneo_warmaster jtw 
                                WHERE jtw.torneo_id = ts.id
                            )
                            WHEN ts.sistema = 'FOW' THEN (
                                SELECT COUNT(*) 
                                FROM jugador_torneo_fow jtf 
                                WHERE jtf.torneo_id = ts.id
                            )
                                 WHEN ts.sistema = 'EPIC' THEN (
                                SELECT COUNT(*) 
                                FROM jugador_torneo_epic jte 
                                WHERE jte.torneo_id = ts.id
                            )
                                WHEN ts.sistema ='DRACULA' THEN (
                                SELECT COUNT (*)
                                FROM jugador_torneo_dracula jtd
                                WHERE jtd.torneo_id = ts.id
                            )
                            ELSE 0
                        END
                    WHEN ts.tipo_torneo = 'Por equipos' THEN
                        CASE
                            WHEN ts.sistema = 'SAGA' THEN (
                                SELECT COUNT(*) 
                                FROM torneo_saga_equipo tse 
                                WHERE tse.torneo_id = ts.id
                            )
                            ELSE 0
                        END
                    ELSE 0
                END as num_participantes
            FROM torneos_sistemas ts
            LEFT JOIN usuarios u ON ts.created_by = u.id
            ORDER BY ts.created_at DESC
        `;

        const [torneos] = await pool.query(query);

        res.json(torneos);
    } catch (error) {
        console.error('❌ Error al obtener todos los torneos:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener los torneos',
            error: error.message 
        });
    }
});

// ====== CORREO PARA CONTACTO======

router.post('/contacto', async (req, res) => {
  const { nombre, email, asunto, mensaje } = req.body;

  if (!nombre || !email || !asunto || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    await transporter.sendMail({
      from: '"GestionaTusTorneos" <warmastermadrid23@gmail.com>',
      to: 'warmastermadrid23@gmail.com',
      replyTo: email,
      subject: `[Contacto Web] ${asunto}`,
      html: `
        <h3>Nuevo mensaje de contacto</h3>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong><br>${mensaje.replace(/\n/g, '<br>')}</p>
      `
    });

    res.json({ ok: true });

  } catch (err) {
    console.error('❌ Error al enviar email de contacto:', err);
    res.status(500).json({ error: 'No se pudo enviar el mensaje' });
  }
});

// ======OBTENER SISTEMAS  DEL TORNEO======

router.get('/torneos/sistema/:torneoId', async (req, res) => {
  const { torneoId } = req.params;
  const [result] = await pool.execute(
    'SELECT sistema FROM torneos_sistemas WHERE id = ?',
    [torneoId]
  );
  
  if (result.length === 0) {
    return res.status(404).json({ error: 'Torneo no encontrado' });
  }
  
  res.json({ sistema: result[0].sistema });
});

// ===== OBTENER TORNEOS POR USUARIO======

router.get('/:userId', verificarToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // ✅ Verifica que coincida con el usuario autenticado
    if (req.usuario.userId !== parseInt(userId)) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver torneos de otro usuario')
      );
    }
    
    // ✅ CONSULTA 1: Torneos CREADOS por el usuario (solo los que organizó)
    const [torneosCreados] = await pool.execute(`
      SELECT 
        ts.*,
        GROUP_CONCAT(DISTINCT tse.epoca ORDER BY tse.epoca SEPARATOR '|') as epocas_disponibles,
        (
          SELECT COUNT(*) FROM jugador_torneo_saga WHERE torneo_id = ts.id
        ) + (
          SELECT COUNT(*) FROM jugador_torneo_fow WHERE torneo_id = ts.id
        ) + (
          SELECT COUNT(*) FROM jugador_torneo_warmaster WHERE torneo_id = ts.id
        ) + (
          SELECT COUNT(*) FROM jugador_torneo_epic WHERE torneo_id = ts.id
        ) + (
          SELECT COUNT(*) FROM jugador_torneo_dracula WHERE torneo_id = ts.id
        ) as total_participantes,
        COUNT(DISTINCT tseq.id) as total_equipos
      FROM torneos_sistemas ts
      LEFT JOIN torneo_saga_epocas tse ON ts.id = tse.torneo_id
      LEFT JOIN torneo_epocas_fow tef ON ts.id = tef.torneo_id
      LEFT JOIN torneo_saga_equipo tseq ON ts.id = tseq.torneo_id
      WHERE ts.created_by = ?
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
    `, [userId]);
    
    // ✅ CONSULTA 2: Torneos donde PARTICIPA (TODOS, incluyendo propios)
    const [torneosParticipando] = await pool.execute(`
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
        ts.puntos_banda, 
        ts.participantes_max,
        ts.equipos_max, 
        ts.estado, 
        ts.created_by, 
        ts.created_at,
        p.faccion,
        p.composicion_ejercito,
        epocas.epocas_disponibles
      FROM torneos_sistemas ts
      INNER JOIN (
        SELECT 
          torneo_id, jugador_id, 
          faccion, 
          epoca AS epoca_inscripcion,
          composicion_ejercito
        FROM jugador_torneo_saga 
        WHERE jugador_id = ?
        
        UNION ALL
        
        SELECT 
          torneo_id, jugador_id,
          ejercito AS faccion,
          epoca AS epoca_inscripcion,
          NULL AS composicion_ejercito    -- no tienen composición de banda
        FROM jugador_torneo_fow 
        WHERE jugador_id = ?
        
        UNION ALL
        
        SELECT 
          torneo_id, jugador_id,
          ejercito AS faccion,
          NULL AS epoca_inscripcion,        -- no tiene epoca
          NULL AS composicion_ejercito    -- no tienen composición de banda
        FROM jugador_torneo_warmaster 
        WHERE jugador_id = ?

        UNION ALL
        
        SELECT 
          torneo_id, jugador_id,
          ejercito AS faccion,
          NULL AS epoca_inscripcion,          -- no tiene epoca
          NULL AS composicion_ejercito      -- no tienen composición de banda
        FROM jugador_torneo_epic
        WHERE jugador_id = ?

        UNION ALL

         SELECT 
          torneo_id, jugador_id,
          banda AS faccion,
          NULL AS epoca_inscripcion,          -- no tiene epoca
          NULL AS composicion_ejercito      -- no tienen composición de banda
        FROM jugador_torneo_dracula
        WHERE jugador_id = ?
        
      ) p ON ts.id = p.torneo_id
      LEFT JOIN (
        SELECT torneo_id, GROUP_CONCAT(DISTINCT epoca ORDER BY epoca SEPARATOR '|') as epocas_disponibles
        FROM torneo_saga_epocas GROUP BY torneo_id
        UNION ALL
        SELECT torneo_id, GROUP_CONCAT(DISTINCT epoca ORDER BY epoca SEPARATOR '|') as epocas_disponibles
        FROM torneo_epocas_fow GROUP BY torneo_id
      ) epocas ON ts.id = epocas.torneo_id
      ORDER BY ts.fecha_inicio ASC
    `, [userId, userId, userId, userId, userId]);


    const [torneosCoorganizando] = await pool.execute (`
      SELECT
        ts.id,
        ts.sistema,
        ts.nombre_torneo,
        ts.tipo_torneo,
        ts.estado,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.created_by,
        u.nombre AS creador_nombre,
        u.apellidos AS creador_apellidos
      FROM organizadores_torneos ot
      INNER JOIN torneos_sistemas ts ON ot.torneo_id = ts.id
      LEFT JOIN usuarios u ON ts.created_by = u.id
      WHERE ot.usuario_id = ? AND ts.created_by != ?
      ORDER BY ts.fecha_inicio ASC
    `, [userId, userId]);

    console.log('🤝 Coorganizando:', torneosCoorganizando.length, JSON.stringify(torneosCoorganizando));
    
    res.json(
      successResponse('Torneos del usuario obtenidos exitosamente', {
        torneosCreados,
        torneosParticipando,
        torneosCoorganizando
      })
    );
    
  } catch (error) {
    console.error('❌ Error al obtener torneos del usuario:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

// ===== VERIFICAR SI USUARIO EXISTE (GET) =====

router.get('/verificarUsuario/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json(errorResponse('Email inválido'));
    }

    const [usuarios] = await pool.execute(
      `SELECT id, nombre, apellidos, email FROM usuarios WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    res.json({
      success: true,
      existe: usuarios.length > 0,
      usuario: usuarios.length > 0 ? usuarios[0] : null
    });

  } catch (error) {
    console.error('❌ Error al verificar usuario:', error);
    res.status(500).json(errorResponse('Error al verificar usuario'));
  }
});

// ====== VERIFICAR SI ES ORGANIZADOR ========

router.get('/:torneoId/verificar-organizador', verificarToken, async (req, res) => {
  try {
    const { torneoId } = req.params;
    const userId = req.usuario?.userId || req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }
    
    // Verificar si el usuario es organizador del torneo
    const [organizador] = await pool.execute(
      `SELECT * FROM organizadores_torneos 
       WHERE torneo_id = ? AND usuario_id = ?`,
      [torneoId, userId]
    );
    
    const esOrganizador = organizador.length > 0;
    
    res.status(200).json({
      success: true,
      mensaje: 'Verificación completada',
      data: {
        esOrganizador,
        userId,
        torneoId
      }
    });
    
  } catch (error) {
    console.error('❌ Error al verificar organizador:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
});

// ===== RECUPERACIÓN DE CONTRASEÑA =====

router.post('/recuperar-password', async (req, res) => {
  
  const { email, lang } = req.body;

  try {
    // 👇 AÑADIR ESTA LÍNEA AL PRINCIPIO
    const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
    
    console.log('═══════════════════════════════════════');
    console.log('🌍 RECUPERACIÓN DE PASSWORD');
    console.log('═══════════════════════════════════════');
    console.log('Email recibido:', email);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('FRONTEND_URL:', urlBase); // 👈 Cambiar aquí
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('BREVO_API_KEY existe:', !!process.env.BREVO_API_KEY);

    if (!email || !email.trim()) {
      console.log('❌ Email vacío');
      return res.status(400).json({
        success: false,
        mensaje: 'El email es requerido'
      });
    }

    console.log('🔍 Buscando usuario...');
    const [usuarios] = await pool.execute(
      'SELECT id, nombre, email FROM usuarios WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    console.log('Usuarios encontrados:', usuarios.length);

    if (usuarios.length === 0) {
      console.log('⚠️ Usuario no encontrado');
      return res.status(200).json({
        success: true,
        mensaje: 'Si el email existe, recibirás un enlace de recuperación'
      });
    }

    const usuario = usuarios[0];
    console.log('✅ Usuario encontrado:', { id: usuario.id, email: usuario.email });
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date(Date.now() + 3600000); // 1 hora

    console.log('🗄️ Invalidando tokens antiguos...');
    await pool.execute(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE usuario_id = ? AND usado = FALSE',
      [usuario.id]
    );

    console.log('💾 Insertando nuevo token...');
    await pool.execute(
      'INSERT INTO password_reset_tokens (usuario_id, token, expiracion, usado) VALUES (?, ?, ?, FALSE)',
      [usuario.id, token, expiracion]
    );

    // 👇 CAMBIAR AQUÍ - Usar urlBase en lugar de process.env.FRONTEND_URL
    const resetUrl = `${urlBase}/reset-password?token=${token}`;
    
    console.log('═══════════════════════════════════════');
    console.log('📧 DATOS DEL EMAIL');
    console.log('URL Base:', urlBase); // 👈 Añadir log
    console.log('Token:', token);
    console.log('URL Completa:', resetUrl);
    console.log('Destinatario:', usuario.email);
    console.log('Nombre:', usuario.nombre);
    console.log('Expira:', expiracion.toISOString());
    console.log('═══════════════════════════════════════');
    
    console.log('📤 Llamando a enviarRecuperacionPassword...');
    const resultadoEmail = await emailRecuperar.enviarRecuperacionPassword({
      email: usuario.email,
      nombre: usuario.nombre,
      resetUrl: resetUrl,
      lang
    });

    console.log('✅ Email enviado:', resultadoEmail);

    res.status(200).json({
      success: true,
      mensaje: 'Si el email existe, recibirás un enlace de recuperación'
    });

  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ ERROR EN RECUPERAR-PASSWORD');
    console.error('═══════════════════════════════════════');
    console.error('Tipo:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('Body:', error.body);
    console.error('Response:', error.response);
    console.error('═══════════════════════════════════════');
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al procesar la solicitud'
    });
  }
});

//======VERIFICAR TOKEN RECUPERAR PASSWORD=======

router.get('/verificar-token/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const [tokens] = await pool.execute(
      `SELECT * FROM password_reset_tokens 
       WHERE token = ? AND expiracion > NOW() AND usado = FALSE`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json(
        errorResponse('El enlace de recuperación ha expirado o no es válido')
      );
    }

    res.status(200).json(
      successResponse('Token válido')
    );

  } catch (error) {
    console.error('❌ Error al verificar token:', error);
    res.status(500).json(
      errorResponse('Error al verificar el token')
    );
  }
});

//======RESET PASSWORD=======

router.post('/reset-password', async (req, res) => {
  const { token, password, lang} = req.body;

  try {
    const [tokens] = await pool.execute(
      `SELECT usuario_id FROM password_reset_tokens 
       WHERE token = ? AND expiracion > NOW() AND usado = FALSE`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json(
        errorResponse('El enlace de recuperación ha expirado o no es válido')
      );
    }

    const usuarioId = tokens[0].usuario_id;

    if (password.length < 6) {
      return res.status(400).json(
        errorResponse('La contraseña debe tener al menos 6 caracteres')
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Actualizar la contraseña
    await pool.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, usuarioId]
    );

    // Marcar el token como usado
    await pool.execute(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE token = ?',
      [token]
    );

    // 👇 OPCIONAL: Obtener datos del usuario para enviar email de confirmación
    const [usuarios] = await pool.execute(
      'SELECT nombre, email FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (usuarios.length > 0) {
      const usuario = usuarios[0];
      try {
        // Enviar email de confirmación
        await emailRecuperar.enviarConfirmacionCambioPassword({
          email: usuario.email,
          nombre: usuario.nombre,
          lang
        });
        console.log('✅ Email de confirmación enviado a:', usuario.email);
      } catch (emailError) {
        console.error('⚠️ Error al enviar email de confirmación:', emailError.message);
        // No lanzamos error porque el cambio de contraseña ya se hizo
      }
    }

    res.status(200).json(
      successResponse('Contraseña restablecida exitosamente')
    );

  } catch (error) {
    console.error('❌ Error al restablecer contraseña:', error);
    res.status(500).json(
      errorResponse('Error al restablecer la contraseña')
    );
  }
});

export default router;