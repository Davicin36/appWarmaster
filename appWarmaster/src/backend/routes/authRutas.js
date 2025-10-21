// routes/authRutas.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
    
    // Validar campos requeridos
    const camposFaltantes = validarCamposRequeridos(req.body, ['email', 'password']);
    if (camposFaltantes.length > 0) {
      return res.status(400).json(
        errorResponse(`Campos requeridos: ${camposFaltantes.join(', ')}`)
      );
    }
    
    // Buscar usuario por email
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, apellidos, nombre_alias, club, email, password, rol 
       FROM usuarios WHERE email = ?`,
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
    
    // Crear token JWT
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Respuesta exitosa
    res.json(
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
    res.status(500).json(
      errorResponse('Error interno del servidor')
    );
  }
});

// ==========================================
// VERIFICAR TOKEN
// ==========================================
router.get('/verificar', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json(
        errorResponse('Token no proporcionado')
      );
    }
    
    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json(
          errorResponse('Token inválido o expirado')
        );
      }
      
      // Buscar usuario actualizado en la base de datos
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
      
      res.json(
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
    });
    
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json(
      errorResponse('Error interno del servidor')
    );
  }
});

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================
router.post('/cambiar-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json(errorResponse('Token no proporcionado'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    
    // Obtener usuario actual
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
    
    res.json(successResponse('Contraseña cambiada exitosamente'));
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});

module.exports = router;