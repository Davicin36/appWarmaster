// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Importar configuración
import { testConnection } from './config/bd.js';

// Importar rutas
import torneosSagaRoutes from './routes/torneosSaga.js';
import torneosWarmasterRoutes from './routes/torneosWarmaster.js';
import torneosFowRoutes from './routes/torneosFow.js';
/*
import torneosBoltRoutes from './routes/torneosBolt.js';
*/
import usuariosRutas from './routes/usuariosRutas.js';

const app = express();

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================

const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'produccion';

const origenesWeb = isProduction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
 ? [
      'https://www.gestionatustorneos.es',
      'https://gestionatustorneos.es'
    ] 
  : [
      'http://localhost:5000', 
      'http://localhost:3001', 
      'http://localhost:5173'
    ];

// Log importante para debuggear
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 Is Production:', isProduction);
console.log('🔒 Orígenes CORS permitidos:', origenesWeb);

const opcionesCors = {
  origin: function(origin, callback) {
    if(!origin) return callback(null, true);
    
    if (origenesWeb.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
}

//APLICAR CORS
app.use(cors(opcionesCors))

//MANEJO EXPLICITO DE LAS PETICIONES OPTIONS
app.options('*', cors(opcionesCors))

app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==========================================
// RUTAS
// ==========================================

//RUTA RAIZ PARA LOS CHECKS DE RENDER
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'API de Gestión de Torneos',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      test: '/api/test',
      torneos: '/api/torneosSaga',
      usuarios: '/api/usuarios'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente',
    env: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint para verificar que Express funciona
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    origenesWeb: origenesWeb
  });
});

// Rutas principales                 
app.use('/api/torneosSaga', torneosSagaRoutes)
app.use('/api/torneosWarmaster', torneosWarmasterRoutes)
app.use('/api/torneosFow', torneosFowRoutes)
/*
app.use('/api/torneosBolt', torneosBoltRoutes)
*/
app.use('/api/usuarios', usuariosRutas)      

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
  console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
  console.log(`🏆 Torneos: http://localhost:${PORT}/api/torneosSaga/obtenerTorneos`);
  console.log(`👤 Usuarios: http://localhost:${PORT}/api/usuarios`);
  console.log(`🔒 CORS habilitado para:`, origenesWeb.join(', '));
  console.log('='.repeat(50) + '\n');
  
  // Test de conexión a BD
  await testConnection();
});