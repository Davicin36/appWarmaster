// routes/authRutas.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
// ✅ Al inicio del archivo, convierte jwt.verify a Promise
const verifyToken = promisify(jwt.verify);
const { verificarToken  } = require('../middleware/auth');

const { pool } = require('../config/bd');
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
  try {
    const { nombre, apellidos, nombre_alias, club, email, password, localidad, pais } = req.body;
    
    // Validar campos requeridos
    const camposFaltantes = validarCamposRequeridos(req.body, ['nombre', 'apellidos', 'email', 'password', 'localidad', 'pais']);
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      );
    }
    
    // Validar email
    if (!validarEmail(email)) {
      return res.status(400).json(
        errorResponse('Formato de email inválido')
      );
    }
    
    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json(
        errorResponse('La contraseña debe tener al menos 6 caracteres')
      );
    }

     if (!localidad) {
        return res.status(400).json (
          errorResponse('No has introducido localidad')
        )
      }

       if (!pais) {
        return res.status(400).json (
          errorResponse('No has introducido pais')
        )
      }
    
    // Verificar si el email ya existe
    const [existeUsuario] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ?', 
      [email]
    );
    
    if (existeUsuario.length > 0) {
      return res.status(400).json(
        errorResponse('El email ya está registrado')
      );
    }
    
    // Encriptar contraseña
    const passwordEncriptada = await bcrypt.hash(password, 12);
    
    // Insertar usuario
    const [resultado] = await pool.execute(
      `INSERT INTO usuarios (nombre, apellidos, nombre_alias, club, email, password, localidad, pais) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellidos, nombre_alias || null, club || null, email, passwordEncriptada, localidad, pais]
    );
    
    // Respuesta exitosa (sin devolver datos sensibles)
    res.status(201).json(
      successResponse('Usuario registrado exitosamente', {
        userId: resultado.insertId,
        email: email,
        nombre: nombre,
        localidad: localidad,
        pais: pais
      })
    );
    
  } catch (error) {
    console.error('Error en registro:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
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
          rol: usuario.rol
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
      `SELECT id, nombre, apellidos, nombre_alias, club, email, rol 
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
          rol: usuario.rol
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

    const { nombre, apellidos, nombre_alias, club, email, localidad, pais } = req.body
    
    //validar campor requeridos
    const camposFaltantes = validarCamposRequeridos (req.body, ['nombre', 'apellidos', 'email'])
    if (camposFaltantes.length > 0) {
      return res.status(401).json(
        errorResponse(`Campor requeridos faltantes: ${camposFaltantes.join(', ')}`)
      )
    }

    //validar email
    if (!validarEmail(email)){
      return res.status(401).json(
        errorResponse('Formato email no válido')
      )
    }

    if (!localidad) {
        return res.status(400).json (
          errorResponse('No has introducido localidad')
        )
      }

       if (!pais) {
        return res.status(400).json (
          errorResponse('No has introducido pais')
        )
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
    await pool.execute(
      `UPDATE usuarios
      SET nombre = ?, apellidos = ?, nombre_alias = ?, club = ?, email = ?, localidad = ?, pais = ?
      WHERE id = ? `,
      [nombre, apellidos, nombre_alias || null, club || null, email, localidad, pais, decoded.userId ]
    )

    //obtener los datos actualizados
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, apellidos, nombre_alias, club, email, rol, localidad, pais
      FROM usuarios WHERE id = ?`,
      [decoded.userId]
    )

    if (usuarios.length === 0) {
      return res.status(404).json(
        errorResponse('Usuario no encontrado')
      );
    }
    
    const usuario = usuarios[0];
    
    console.log('✅ Perfil actualizado exitosamente');
    
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
          pais: usuario.pais
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
          rol: usuario.rol
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
    const {userId} = req.params;
    
    if (req.usuario.userId !== parseInt(userId)) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver torneos de otro usuario')
      );
    }
    
    const [torneosCreados] = await pool.execute(`
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


module.exports = router;