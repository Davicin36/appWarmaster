const express = require('express');
const router = express.Router();
const { pool } = require('../config/bd');
const { successResponse, errorResponse } = require('../utils/helpers');

// ==========================================
// LISTAR TODOS LOS USUARIOS
// ==========================================
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


module.exports = router;