// middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }
    
    // Verificar y decodificar el token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          error: 'Token inválido o expirado.' 
        });
      }
      
      // Agregar información del usuario al request
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.userRole = decoded.rol;
      
      next(); // Continuar al siguiente middleware/ruta
    });
    
  } catch (error) {
    console.error('Error en verificación de token:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor.' 
    });
  }
};

// Middleware para verificar que el usuario sea organizador
const verificarOrganizador = (req, res, next) => {
  if (req.userRole !== 'organizador') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Solo organizadores pueden realizar esta acción.' 
    });
  }
  next();
};

// Middleware opcional - permite acceso sin token pero agrega info si existe
const tokenOpcional = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err) {
          req.userId = decoded.userId;
          req.userEmail = decoded.email;
          req.userRole = decoded.rol;
        }
      });
    }
    
    next();
  } catch (error) {
    // Si hay error, continuar sin autenticación
    next();
  }
};

module.exports = {
  verificarToken,
  verificarOrganizador,
  tokenOpcional
};