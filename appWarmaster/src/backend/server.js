// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuración
const { testConnection } = require('./config/bd');

// Importar rutas
const authRoutes = require('./routes/authRutas');
const torneosSagaRoutes = require('./routes/torneosSaga'); 
const usuariosRutas = require('./routes/usuariosRutas');

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

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==========================================
// RUTAS
// ==========================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente'
  });
});

// Test endpoint para verificar que Express funciona
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas principales
app.use('/api', authRoutes);                    
app.use('/api', torneosSagaRoutes); 
app.use('/api/usuarios', usuariosRutas);         

// ==========================================
// MANEJADOR DE RUTAS NO ENCONTRADAS
// ==========================================
app.use((req, res) => {
  console.log('❌ Ruta no encontrada:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.path} no encontrada`
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/authRutas`);
  console.log(`🏆 Torneos: http://localhost:${PORT}/api/torneosSaga`);
  console.log(`👤 Usuarios: http://localhost:${PORT}/api/usuarios`);
  console.log('='.repeat(50) + '\n');
  
  // Test de conexión a BD
  await testConnection();
});