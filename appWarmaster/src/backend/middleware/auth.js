// middleware/auth.js
import jwt from 'jsonwebtoken';
import { pool } from '../config/bd.js';

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
const verificarOrganizadorTorneo = async (req, res, next) => {
  try {
    const { torneoId } = req.params;
    const userId = req.usuario?.userId || req.userId;

    if (!userId) {
      console.log('❌ No hay userId en la request');
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    if (!torneoId) {
      console.log('❌ No hay torneoId en los params');
      return res.status(400).json({
        success: false,
        error: 'ID de torneo no proporcionado'
      });
    }

    // Verificar si el usuario es organizador del torneo
    const [organizador] = await pool.execute(
      `SELECT 
        ot.id as organizador_id,
        ot.usuario_id,
        ot.torneo_id,
        ts.created_by,
        ts.created_by = ? as es_creador,
        u.estado_cuenta
       FROM organizadores_torneos ot
       INNER JOIN torneos_sistemas ts ON ot.torneo_id = ts.id
       INNER JOIN usuarios u ON ot.usuario_id = u.id
       WHERE ot.torneo_id = ? AND ot.usuario_id = ?`,
      [userId, torneoId, userId]
    );

    if (organizador.length === 0) {
      console.log('❌ Usuario NO es organizador de este torneo');
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para gestionar este torneo. Solo los organizadores del torneo pueden acceder.'
      });
    }

    const org = organizador[0];

    // Verificar que la cuenta esté activa
    if (org.estado_cuenta !== 'activo') {
      console.log('⏳ Usuario es organizador pero cuenta no está activa:', org.estado_cuenta);
      return res.status(403).json({
        success: false,
        error: 'Tu cuenta está pendiente de activación. Por favor, completa tu registro.'
      });
    }

    // Agregar información adicional a la request
    req.esCreador = Boolean(org.es_creador);
    req.organizadorId = org.organizador_id;
    req.torneoId = parseInt(torneoId);

    next();

  } catch (error) {
    console.error('❌ Error verificando organizador del torneo:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
};

// Middleware para verificar que el usuario sea superadmin
const verificarSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.usuario?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    // Verificar rol en la base de datos
    const [usuarios] = await pool.execute(
      'SELECT rol FROM usuarios WHERE id = ?',
      [userId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const rol = usuarios[0].rol;

    if (rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Se requieren privilegios de administrador.'
      });
    }

    next();

  } catch (error) {
    console.error('❌ Error verificando superadmin:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
};

export {
  verificarToken,
  verificarOrganizadorTorneo,
  verificarSuperAdmin
};