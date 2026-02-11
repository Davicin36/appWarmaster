// config/database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración base para torneos
const baseConfigTorneos = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // ✅ SOLO OPCIONES VÁLIDAS PARA MYSQL2
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,        // ✅ Esta SÍ existe
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',

  idleTimeout: 60000
};

// ✅ Configuración base para ranking
const baseConfigRanking = {
  host: process.env.DB_RANKING_HOST || process.env.DB_HOST,
  port: process.env.DB_RANKING_PORT || process.env.DB_PORT || 3306,
  user: process.env.DB_RANKING_USER || process.env.DB_USER,
  password: process.env.DB_RANKING_PASSWORD || process.env.DB_PASSWORD,
  
  // ✅ SOLO OPCIONES VÁLIDAS PARA MYSQL2
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
};

// Pool para la base de datos principal 'torneos'
const poolTorneos = mysql.createPool({
  ...baseConfigTorneos,
  database: process.env.DB_NAME || 'railway'
});

// Pool para la base de datos 'rankingTorneos'
const poolRanking = mysql.createPool({
  ...baseConfigRanking,
  database: process.env.DB_RANKING_NAME || 'railway'
});

// Pool general sin base de datos específica
const poolGeneral = mysql.createPool({
  ...baseConfigTorneos
});

// Pool principal (mantiene compatibilidad)
const pool = poolTorneos;

// ============================================
// MANEJO AUTOMÁTICO DE RECONEXIÓN
// ============================================

const recreatePool = (name) => {
  console.log(`🔄 Recreando pool ${name}...`);
  if (name === 'torneos') poolTorneos = mysql.createPool(baseConfigTorneos);
  if (name === 'ranking') poolRanking = mysql.createPool(baseConfigRanking);
  if (name === 'general') poolGeneral = mysql.createPool(baseConfigGeneral);
};

export const safeQuery = async (poolInstance, sql, params = [], retries = 2) => {
  try {
    const [rows] = await poolInstance.query(sql, params);
    return rows;
  } catch (error) {
    if (
      retries > 0 &&
      (error.code === 'PROTOCOL_CONNECTION_LOST' ||
       error.code === 'ECONNRESET' ||
       error.code === 'ECONNREFUSED')
    ) {
      console.warn('⚠️ Conexión perdida a MySQL, reintentando...');
      // Identifica qué pool usar para recrear
      if (poolInstance === poolTorneos) recreatePool('torneos');
      else if (poolInstance === poolRanking) recreatePool('ranking');
      else if (poolInstance === poolGeneral) recreatePool('general');

      return safeQuery(poolInstance, sql, params, retries - 1);
    }
    throw error;
  }
};

// ============================================
// FUNCIONES DE TESTING
// ============================================

const testConnection = async () => {
  try {
    // Test base de datos torneos
    const connTorneos = await poolTorneos.getConnection();
    console.log('✅  Conexión a MySQL establecida correctamente');
    console.log(`📊  Base de datos principal: ${process.env.DB_NAME || 'railway'}`);
    
    await connTorneos.execute('SELECT 1 as test');
    console.log('✅  Query de prueba exitosa en BD torneos');
    connTorneos.release();
    
    // Test base de datos ranking
    try {
      const connRanking = await poolRanking.getConnection();
      console.log(`📊  Base de datos ranking: ${process.env.DB_RANKING_NAME || 'railway'}`);
      
      await connRanking.execute('SELECT 1 as test');
      console.log('✅  Query de prueba exitosa en BD rankingTorneos');
      connRanking.release();
    } catch (rankingError) {
      console.warn('⚠️  BD rankingTorneos no disponible');
      console.warn('   Error:', rankingError.message);
    }
    
    console.log(`👤  Usuario: ${process.env.DB_USER}`);
    console.log(`🌐  Host Torneos: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.log(`🌐  Host Ranking: ${process.env.DB_RANKING_HOST || process.env.DB_HOST}:${process.env.DB_RANKING_PORT || process.env.DB_PORT || 3306}`);
    console.log(`🛠️   Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('💡 Verifica tu archivo .env y que MySQL esté ejecutándose');
    console.error('🔧 Credenciales intentadas:');
    console.error(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.error(`   Usuario: ${process.env.DB_USER}`);
    console.error(`   Base de datos: ${process.env.DB_NAME || 'railway'}`);
    console.error('\n🔍 Detalles del error:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Errno: ${error.errno}`);
    return false;
  }
};

// ============================================
// FUNCIONES DE TRANSACCIONES
// ============================================

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
  poolTorneos,
  poolRanking,
  poolGeneral,
  pool,
  testConnection,
  executeTransaction,
  executeRankingTransaction,
  executeCrossTransaction,
  getPoolStatus,
  closePool
};