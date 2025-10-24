// routes/authRutas.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const { pool } = require('../config/bd');
const { 
  validarEmail, 
  validarCamposRequeridos, 
  errorResponse, 
  successResponse,
  manejarErrorDB 
} = require('../utils/helpers');

const router = express.Router();

// ==========================================
// REGISTRO DE USUARIO
// ==========================================
router.post('/registro', async (req, res) => {
  try {
    const { nombre, apellidos, nombre_alias, club, email, password } = req.body;
    
    // Validar campos requeridos
    const camposFaltantes = validarCamposRequeridos(req.body, ['nombre', 'apellidos', 'email', 'password']);
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
      `INSERT INTO usuarios (nombre, apellidos, nombre_alias, club, email, password) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, apellidos, nombre_alias || null, club || null, email, passwordEncriptada]
    );
    
    // Respuesta exitosa (sin devolver datos sensibles)
    res.status(201).json(
      successResponse('Usuario registrado exitosamente', {
        userId: resultado.insertId,
        email: email,
        nombre: nombre
      })
    );
    
  } catch (error) {
    console.error('Error en registro:', error);
    const mensaje = manejarErrorDB(error);
    res.status(500).json(errorResponse(mensaje));
  }
});

// ==========================================
// LOGIN
// ==========================================
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

// ==========================================
// VERIFICAR TOKEN
// ==========================================
// ✅ Al inicio del archivo, convierte jwt.verify a Promise
const verifyToken = promisify(jwt.verify);

router.get('/verificar', async (req, res) => {
  try {
    // Extraer token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json(
        errorResponse('Token no proporcionado')
      );
    }
    
    // ✅ Verificar token (ahora es una Promise)
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

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================
router.post('/cambiar-password', async (req, res) => {
  try {
    //extraemos el token
    const authHeader = req.headers['authorization'];
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

// ==========================================
// CAMBIAR ROL A ORGANIZADOR
// ==========================================
router.post('/convertir-organizador', async (req, res) => {
  try {
    // Extraer token
    const authHeader = req.headers['authorization'];
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


module.exports = router;