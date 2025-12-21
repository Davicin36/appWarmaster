// routes/authRutas.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
// ✅ Al inicio del archivo, convierte jwt.verify a Promise
const verifyToken = promisify(jwt.verify);
const { verificarToken  } = require('../middleware/auth');
const crypto = require('crypto');

const { pool } = require('../config/bd');
const { validarCodigoPostal } = require('../utils/validaciones');
const emailRecuperar = require('../utils/emailRecuperar');
const { 
  validarEmail, 
  validarCamposRequeridos, 
  errorResponse, 
  successResponse,
  manejarErrorDB 
} = require('../utils/helpers');

const router = express.Router(); 

// =======LISTAR TODOS LOS USUARIOS===========
//Para ver a todos los usuarios de la base de datos

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
    
    console.log(`✅ ${usuarios.length} usuarios encontrados`);
    
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
      password
    } = req.body;

    await connection.beginTransaction();

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

        console.log(`✅ Usuario pendiente ${email} completó su registro`);

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
        estado_cuenta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    console.log(`✅ Nuevo usuario registrado: ${email}`);

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
      return res.status(400).json(
        errorResponse('Email y contraseña son requeridos')
      );
    }

    // Buscar usuario
    const [usuarios] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json(
        errorResponse('Credenciales inválidas')
      );
    }

    const usuario = usuarios[0];

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    
    if (!passwordValida) {
      return res.status(401).json(
        errorResponse('Credenciales inválidas')
      );
    }

    // Generar token
    const token = jwt.sign(
      { userId: usuario.id,
        email: usuario.email
       },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ CRÍTICO: Debe devolver success: true
    return res.json(
      successResponse('Login exitoso', {
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
      })
    );

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json(
      errorResponse('Error interno del servidor')
    );
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

// ===== OBTENER TORNEOS POR USUARIO======

router.get('/:userId', verificarToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔍 Buscando torneos para usuario:', userId);
    
    // ✅ Verifica que coincida con el usuario autenticado
    if (req.usuario.userId !== parseInt(userId)) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver torneos de otro usuario')
      );
    }
    
    // ✅ CONSULTA 1: Torneos CREADOS por el usuario (solo los que organizó)
    const [torneosCreados] = await pool.execute(`
      SELECT 
        ts.id,
        ts.sistema,
        ts.nombre_torneo,
        ts.tipo_torneo,
        ts.num_jugadores_equipo,
        ts.rondas_max,
        ts.fecha_inicio,
        ts.fecha_fin,
        ts.ubicacion,
        ts.puntos_banda,
        ts.participantes_max,
        ts.equipos_max,
        ts.ronda_actual,
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
        COUNT(DISTINCT jts.id) as total_participantes
      FROM torneos_sistemas ts 
      LEFT JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      LEFT JOIN torneo_saga_epocas tse ON ts.id = tse.torneo_id
      WHERE ts.created_by = ?
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
    `, [userId]);
    
    console.log(`✅ Torneos creados: ${torneosCreados.length}`);
    
    // ✅ CONSULTA 2: Torneos donde PARTICIPA (TODOS, incluyendo propios)
    // 🔥 CAMBIO: Se ELIMINÓ el filtro "ts.created_by != ?"
    const [torneosParticipando] = await pool.execute(`
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
        jts.faccion,
        jts.composicion_ejercito,
        (SELECT COUNT(*) FROM jugador_torneo_saga WHERE torneo_id = ts.id) as total_participantes
      FROM torneos_sistemas ts 
      INNER JOIN jugador_torneo_saga jts ON ts.id = jts.torneo_id
      LEFT JOIN torneo_saga_epocas tse ON ts.id = tse.torneo_id
      WHERE jts.jugador_id = ?
      GROUP BY ts.id, jts.id, jts.faccion, jts.composicion_ejercito
      ORDER BY ts.fecha_inicio ASC
    `, [userId]);
    
    console.log(`✅ Torneos participando: ${torneosParticipando.length}`);
    
    res.json(
      successResponse('Torneos del usuario obtenidos exitosamente', {
        torneosCreados,
        torneosParticipando
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

    if (usuarios.length > 0) {
      console.log(`✅ Usuario encontrado: ${usuarios[0].nombre} ${usuarios[0].apellidos}`);
    } else {
      console.log(`⚠️ Usuario NO encontrado: ${email}`);
    }

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

// ===== RECUPERACIÓN DE CONTRASEÑA =====

router.post('/recuperar-password', async (req, res) => {
  const { email } = req.body;

  try {
    const [usuarios] = await pool.execute(
      'SELECT id, nombre FROM usuarios WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (usuarios.length === 0) {
      return res.status(200).json(
        successResponse('Si el email existe, recibirás un enlace de recuperación')
      );
    }

    const usuario = usuarios[0];
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date(Date.now() + 3600000); // 1 hora

    await pool.execute(
      `INSERT INTO password_reset_tokens (usuario_id, token, expiracion) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       token = VALUES(token), 
       expiracion = VALUES(expiracion)`,
      [usuario.id, token, expiracion]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await emailRecuperar.enviarRecuperacionPassword({
      email: email,
      nombre: usuario.nombre,
      resetUrl: resetUrl
    });

    res.status(200).json(
      successResponse('Si el email existe, recibirás un enlace de recuperación')
    );

  } catch (error) {
    console.error('❌ Error en solicitud de recuperación:', error);
    res.status(500).json(
      errorResponse('Error al procesar la solicitud')
    );
  }
});

//======VERIFICAR TOKEM RECUPERAR PASSWORD=======

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
  const { token, password } = req.body;

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

    await pool.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, usuarioId]
    );

    await pool.execute(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE token = ?',
      [token]
    );

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

module.exports = router;