// middleware/auth.js
import jwt from 'jsonwebtoken';

const verificarToken = (req, res, next) => {
  
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          success: false,
          error: 'Token inválido o expirado.' 
        });
      }
      
      req.usuario = {
        userId: decoded.userId,
        email: decoded.email,
        rol: decoded.rol
      };
      
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.userRole = decoded.rol;
        
      next();
    });
    
  } catch (error) {
    console.error('❌ Error inesperado en middleware:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor.' 
    });
  }
};

// Middleware para verificar que el usuario sea organizador
const verificarOrganizador = (req, res, next) => {
  if (req.usuario?.rol !== 'organizador') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Solo organizadores pueden realizar esta acción.' 
    });
  }
  next();
};

export {
  verificarToken,
  verificarOrganizador
};