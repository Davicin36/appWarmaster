// server.js - Archivo principal del servidor
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./config/bd');

// Importar rutas
const authRoutes = require('./routes/authRutas');
const torneosRoutes = require('./routes/torneos');
const participantesRoutes = require('./routes/participantes');
const choqueBandasRoutes = require('./routes/choqueBandas');
// const capturaRoutes = require('./routes/captura');
// const conquistaRoutes = require('./routes/conquista');
// const desacralizacionRoutes = require('./routes/desacralizacion');
// const avanceRoutes = require('./routes/avance');

// Crear aplicación Express
const app = express();

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://tu-dominio.com' 
    : ['http://localhost:5000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==========================================
// RUTAS DE LA API
// ==========================================

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor de Torneos SAGA funcionando correctamente'
  });
});

// Rutas de autenticación
app.use('/api/authRutas', authRoutes);

// Rutas de torneos
app.use('/api/torneos', torneosRoutes);

// Rutas de participantes
app.use('/api/participantes', participantesRoutes);

// Rutas de misiones
app.use('/api/choque-bandas', choqueBandasRoutes);
// app.use('/api/captura', capturaRoutes);
// app.use('/api/conquista', conquistaRoutes);
// app.use('/api/desacralizacion', desacralizacionRoutes);
// app.use('/api/avance', avanceRoutes);

// ==========================================
// RUTA PARA OBTENER CLASIFICACIÓN GENERAL
// ==========================================
app.get('/api/torneos/:id/clasificacion-general', async (req, res) => {
  try {
    const { pool } = require('./config/bd');
    const { torneoId } = req.params;
    
    // Clasificación combinando todas las misiones
    const [clasificacion] = await pool.execute(`
      SELECT 
        u.id,
        u.nombre,
        u.apellidos,
        u.nombre_alias,
        u.club,
        p.faccion,
        p.composicion_ejercito,
        
        -- Puntos de torneo por misión
        COALESCE(SUM(cb.puntos_torneo_cr_j1 + cb.puntos_torneo_cr_j2), 0) as puntos_choque_bandas,
        COALESCE(SUM(cap.puntos_torneo_captura_j1 + cap.puntos_torneo_captura_j2), 0) as puntos_captura,
        COALESCE(SUM(con.puntos_torneo_conquista_j1 + con.puntos_torneo_conquista_j2), 0) as puntos_conquista,
        COALESCE(SUM(des.puntos_torneo_desacralizacion_j1 + des.puntos_torneo_desacralizacion_j2), 0) as puntos_desacralizacion,
        COALESCE(SUM(av.puntos_torneo_avance_j1 + av.puntos_torneo_avance_j2), 0) as puntos_avance,
        
        -- Total puntos de torneo
        COALESCE(SUM(
          cb.puntos_torneo_cr_j1 + cb.puntos_torneo_cr_j2 +
          cap.puntos_torneo_captura_j1 + cap.puntos_torneo_captura_j2 +
          con.puntos_torneo_conquista_j1 + con.puntos_torneo_conquista_j2 +
          des.puntos_torneo_desacralizacion_j1 + des.puntos_torneo_desacralizacion_j2 +
          av.puntos_torneo_avance_j1 + av.puntos_torneo_avance_j2
        ), 0) as puntos_torneo_total,
        
        -- Puntos de masacre totales
        COALESCE(SUM(
          cb.puntos_masacre_cr_j1 + cb.puntos_masacre_cr_j2 +
          cap.puntos_masacre_captura_j1 + cap.puntos_masacre_captura_j2 +
          con.puntos_masacre_conquista_j1 + con.puntos_masacre_conquista_j2 +
          des.puntos_masacre_desacralizacion_j1 + des.puntos_masacre_desacralizacion_j2 +
          av.puntos_masacre_avance_j1 + av.puntos_masacre_avance_j2
        ), 0) as puntos_masacre_total,
        
        -- Estadísticas
        COUNT(DISTINCT CASE WHEN cb.resultado_cr != 'pendiente' THEN cb.id END) +
        COUNT(DISTINCT CASE WHEN cap.resultado_captura != 'pendiente' THEN cap.id END) +
        COUNT(DISTINCT CASE WHEN con.resultado_conquista != 'pendiente' THEN con.id END) +
        COUNT(DISTINCT CASE WHEN des.resultado_desacralizacion != 'pendiente' THEN des.id END) +
        COUNT(DISTINCT CASE WHEN av.resultado_avance != 'pendiente' THEN av.id END) as partidas_jugadas,
        
        -- Victorias totales
        SUM(CASE WHEN 
          (cb.jugador1_id = u.id AND cb.resultado_cr = 'victoria_j1') OR
          (cb.jugador2_id = u.id AND cb.resultado_cr = 'victoria_j2') OR
          (cap.jugador1_id = u.id AND cap.resultado_captura = 'victoria_j1') OR
          (cap.jugador2_id = u.id AND cap.resultado_captura = 'victoria_j2') OR
          (con.jugador1_id = u.id AND con.resultado_conquista = 'victoria_j1') OR
          (con.jugador2_id = u.id AND con.resultado_conquista = 'victoria_j2') OR
          (des.jugador1_id = u.id AND des.resultado_desacralizacion = 'victoria_j1') OR
          (des.jugador2_id = u.id AND des.resultado_desacralizacion = 'victoria_j2') OR
          (av.jugador1_id = u.id AND av.resultado_avance = 'victoria_j1') OR
          (av.jugador2_id = u.id AND av.resultado_avance = 'victoria_j2')
        THEN 1 ELSE 0 END) as victorias_totales
        
      FROM participantes p
      JOIN usuarios u ON p.jugador_id = u.id
      
      -- LEFT JOIN con todas las misiones
      LEFT JOIN choque_bandas cb ON (p.torneo_id = cb.torneo_id AND (cb.jugador1_id = u.id OR cb.jugador2_id = u.id))
      LEFT JOIN captura cap ON (p.torneo_id = cap.torneo_id AND (cap.jugador1_id = u.id OR cap.jugador2_id = u.id))
      LEFT JOIN conquista con ON (p.torneo_id = con.torneo_id AND (con.jugador1_id = u.id OR con.jugador2_id = u.id))
      LEFT JOIN desacralizacion des ON (p.torneo_id = des.torneo_id AND (des.jugador1_id = u.id OR des.jugador2_id = u.id))
      LEFT JOIN avance av ON (p.torneo_id = av.torneo_id AND (av.jugador1_id = u.id OR av.jugador2_id = u.id))
      
      WHERE p.torneo_id = ?
      GROUP BY u.id, p.id
      ORDER BY 
        puntos_torneo_total DESC, 
        puntos_masacre_total DESC, 
        victorias_totales DESC,
        u.nombre ASC
    `, [torneoId]);
    
    res.json({
      mensaje: 'Clasificación general obtenida exitosamente',
      data: {
        clasificacion,
        totalParticipantes: clasificacion.length
      }
    });
    
  } catch (error) {
    console.error('Error al obtener clasificación general:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 5000;

const iniciarServidor = async () => {
  try {
    // Probar conexión a la base de datos
    console.log('🔄 Probando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Verifique la configuración.');
      process.exit(1);
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n🚀 ======================================');
      console.log(`🏟️  SERVIDOR TORNEOS SAGA INICIADO`);
      console.log(`🌐 Puerto: ${PORT}`);
      console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📖 API Base: http://localhost:${PORT}/api`);
      console.log('🚀 ======================================\n');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
  console.log('\n🔄 SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🔄 SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
iniciarServidor();