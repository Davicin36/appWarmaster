const express = require('express');
const jwt = require('jsonwebtoken'); 
const multer = require('multer');
const { pool } = require('../config/bd');
const { verificarToken, verificarOrganizador } = require('../middleware/auth');
const { 
  calcularPuntosTorneo,
  validarFecha,
  validarCamposRequeridos,
  errorResponse,
  successResponse,
  manejarErrorDB,
  paginar
} = require('../utils/helpers');

const router = express.Router(); 


// =====CONFIGURACIÓN DE MULTER PARA SUBIDA DE PDF=====

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});


//=====OBTENER TORNEOS CON PAGINACIÓN=====

router.get('/obtenerTorneos', async (req, res) => {
  try {
    console.log('📥 GET /api/torneosFow');
    
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
    
    let whereClause = '';
    let params = [];
    
    if (buscar.trim()) {
      whereClause = 'WHERE ts.nombre_torneo LIKE ? OR ts.ubicacion LIKE ?';
      const searchTerm = `%${buscar}%`;
      params = [searchTerm, searchTerm];
    }
    
    const [torneos] = await pool.execute(`
      SELECT 
        ts.id,
        ts.nombre_torneo,
        ts.sistema,
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
        u.nombre as creador_nombre,
        u.apellidos as creador_apellidos,
        u.club as creador_club,
        COUNT(DISTINCT CASE WHEN ts.tipo_torneo = 'Individual' THEN jtf.id ELSE NULL END) as total_participantes,
        MAX(CASE WHEN jtf.jugador_id = ? THEN 1 ELSE 0 END) as usuario_inscrito
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_fow jtf ON ts.id = jtf.torneo_id
      ${whereClause}
      GROUP BY ts.id
      ORDER BY ts.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, ...params, limitNum, offset]);
    
    console.log(`✅ ${torneos.length} torneos obtenidos`);
    
    const [totalRows] = await pool.execute(`
      SELECT COUNT(DISTINCT ts.id) as total
      FROM torneos_sistemas ts 
      LEFT JOIN usuarios u ON ts.created_by = u.id 
      LEFT JOIN jugador_torneo_fow jtf ON ts.id = jtf.torneo_id
      LEFT JOIN torneo_saga_epocas tse ON ts.id = tse.torneo_id
      ${whereClause}
    `, params);
    
    const total = totalRows[0].total;
    const totalPages = Math.ceil(total / limitNum);
    
    res.json(
      successResponse('Torneos obtenidos exitosamente', {
        torneosSaga: torneos,
        paginacion: {
          paginaActual: parseInt(page),
          totalPaginas: totalPages,
          totalRegistros: total,
          registrosPorPagina: limitNum
        }
      })
    );
    
  } catch (error) {
    console.error('❌ Error al obtener torneos:', error);
    res.status(500).json(errorResponse('Error interno del servidor'));
  }
});




module.exports = router 