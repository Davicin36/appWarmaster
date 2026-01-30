// config/database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración base compartida
const baseConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 20000,
  acquireTimeout: 20000,
  timeout: 20000,
  idleTimeout: 20000,
  charset: 'utf8mb4',
  maxIdle: 5
};

// Pool para la base de datos principal 'torneos'
const poolTorneos = mysql.createPool({
  ...baseConfig,
  database: process.env.DB_NAME || 'torneos'
});

// Pool para la base de datos 'rankingTorneos'
const poolRanking = mysql.createPool({
  ...baseConfig,
  database: process.env.DB_RANKING_NAME || 'rankingTorneos'
});

// Pool general sin base de datos específica (para queries cross-database)
const poolGeneral = mysql.createPool({
  ...baseConfig
  // Sin especificar database
});

// Pool principal (mantiene compatibilidad con código existente)
const pool = poolTorneos;

// ============================================
// FUNCIONES DE TESTING
// ============================================

const testConnection = async () => {
  try {
    // Test base de datos torneos
    const connTorneos = await poolTorneos.getConnection();
    console.log('✅  Conexión a MySQL establecida correctamente');
    console.log(`📊  Base de datos principal: ${process.env.DB_NAME || 'torneos'}`);
    
    const [rows1] = await connTorneos.execute('SELECT 1 as test');
    console.log('✅  Query de prueba exitosa en BD torneos');
    connTorneos.release();
    
    // Test base de datos ranking
    try {
      const connRanking = await poolRanking.getConnection();
      console.log(`📊  Base de datos ranking: ${process.env.DB_RANKING_NAME || 'rankingTorneos'}`);
      
      const [rows2] = await connRanking.execute('SELECT 1 as test');
      console.log('✅  Query de prueba exitosa en BD rankingTorneos');
      connRanking.release();
    } catch (rankingError) {
      console.warn('⚠️  BD rankingTorneos no disponible (se creará después)');
      console.warn('   Esto es normal si aún no has ejecutado el script de creación');
    }
    
    console.log(`👤  Usuario: ${process.env.DB_USER}`);
    console.log(`🌐  Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.log(`🛠️   Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('💡 Verifica tu archivo .env y que MySQL esté ejecutándose');
    console.error('🔧 Credenciales intentadas:');
    console.error(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.error(`   Usuario: ${process.env.DB_USER}`);
    console.error(`   Base de datos: ${process.env.DB_NAME || 'torneos'}`);
    console.error('\n🔍 Detalles del error:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Errno: ${error.errno}`);
    return false;
  }
};

// ============================================
// FUNCIONES DE TRANSACCIONES
// ============================================

// Función helper para transacciones en la BD de torneos (mantiene compatibilidad)
const executeTransaction = async (callback) => {
  let connection;
  try {
    connection = await poolTorneos.getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
    
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('⚠️ Error en rollback (conexión cerrada):', rollbackError.message);
      }
    }
    throw error;
    
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('⚠️ Error al liberar conexión:', releaseError.message);
      }
    }
  }
};

// Función para transacciones en la BD de ranking
const executeRankingTransaction = async (callback) => {
  let connection;
  try {
    connection = await poolRanking.getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
    
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('⚠️ Error en rollback (conexión cerrada):', rollbackError.message);
      }
    }
    throw error;
    
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('⚠️ Error al liberar conexión:', releaseError.message);
      }
    }
  }
};

// Función para transacciones que afectan AMBAS bases de datos
const executeCrossTransaction = async (callback) => {
  let connTorneos, connRanking;
  try {
    connTorneos = await poolTorneos.getConnection();
    connRanking = await poolRanking.getConnection();
    
    await connTorneos.beginTransaction();
    await connRanking.beginTransaction();
    
    const result = await callback(connTorneos, connRanking);
    
    await connTorneos.commit();
    await connRanking.commit();
    
    return result;
    
  } catch (error) {
    // Rollback en ambas bases de datos
    if (connTorneos) {
      try {
        await connTorneos.rollback();
      } catch (rollbackError) {
        console.error('⚠️ Error en rollback torneos:', rollbackError.message);
      }
    }
    if (connRanking) {
      try {
        await connRanking.rollback();
      } catch (rollbackError) {
        console.error('⚠️ Error en rollback ranking:', rollbackError.message);
      }
    }
    throw error;
    
  } finally {
    if (connTorneos) {
      try {
        connTorneos.release();
      } catch (releaseError) {
        console.error('⚠️ Error al liberar conexión torneos:', releaseError.message);
      }
    }
    if (connRanking) {
      try {
        connRanking.release();
      } catch (releaseError) {
        console.error('⚠️ Error al liberar conexión ranking:', releaseError.message);
      }
    }
  }
};

// ============================================
// FUNCIONES DE ESTADO
// ============================================

const getPoolStatus = () => {
  return {
    torneos: {
      totalConnections: poolTorneos.pool._allConnections.length,
      freeConnections: poolTorneos.pool._freeConnections.length,
      queuedRequests: poolTorneos.pool._connectionQueue.length
    },
    ranking: {
      totalConnections: poolRanking.pool._allConnections.length,
      freeConnections: poolRanking.pool._freeConnections.length,
      queuedRequests: poolRanking.pool._connectionQueue.length
    }
  };
};

const closePool = async () => {
  try {
    await poolTorneos.end();
    console.log('✅ Pool de torneos cerrado correctamente');
    
    await poolRanking.end();
    console.log('✅ Pool de ranking cerrado correctamente');
    
    await poolGeneral.end();
    console.log('✅ Pool general cerrado correctamente');
    
  } catch (error) {
    console.error('❌ Error al cerrar los pools:', error.message);
  }
};

// ============================================
// EXPORTS
// ============================================

export {
  // Pools individuales
  poolTorneos,
  poolRanking,
  poolGeneral,
  
  // Pool principal (compatibilidad con código existente)
  pool,
  
  // Funciones de testing
  testConnection,
  
  // Funciones de transacciones
  executeTransaction,           // Solo para torneos (mantiene compatibilidad)
  executeRankingTransaction,    // Solo para ranking
  executeCrossTransaction,      // Para operaciones en ambas BDs
  
  // Funciones de utilidad
  getPoolStatus,
  closePool
};