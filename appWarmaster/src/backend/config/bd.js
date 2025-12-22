import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ⭐ PARÁMETROS CRÍTICOS PARA EVITAR ECONNRESET
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 20000, // 60 segundos para establecer conexión
    acquireTimeout: 20000, // 60 segundos para obtener una conexión del pool
    timeout: 20000, // 60 segundos timeout general de query
    idleTimeout: 20000, // 60 segundos antes de cerrar conexión inactiva
    // ⭐ PREVENIR PROBLEMAS DE CHARSET
    charset: 'utf8mb4',
    // ⭐ MANEJO DE ERRORES DE CONEXIÓN
    maxIdle: 5, // Máximo de conexiones inactivas
    idleTimeout: 60000
})

/** SOLO PARA CUANDO NECESITEMOS DEBUG DE LA BASE DE DATOS
// Manejo de errores del pool
pool.on('connection', (connection) => {
  console.log('🔌 Nueva conexión establecida al pool');
});

pool.on('acquire', (connection) => {
  console.log('📤 Conexión adquirida del pool');
});

pool.on('release', (connection) => {
  console.log('📥 Conexión liberada al pool');
});

pool.on('enqueue', () => {
  console.log('⏳ Esperando por conexión disponible...');
});
*/

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅  Conexión a MySQL establecida correctamente');
    console.log(`📊  Base de datos: ${process.env.DB_NAME}`);
    console.log(`👤  Usuario: ${process.env.DB_USER}`);
    console.log(`🌐  Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.log(`🛠️   Entorno: ${process.env.NODE_ENV || 'development'}`)
    
    // Test adicional: ejecutar una query simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅  Query de prueba exitosa');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('💡 Verifica tu archivo .env y que MySQL esté ejecutándose');
    console.error('🔧 Credenciales intentadas:');
    console.error(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.error(`   Usuario: ${process.env.DB_USER}`);
    console.error(`   Base de datos: ${process.env.DB_NAME}`);
    console.error('\n🔍 Detalles del error:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Errno: ${error.errno}`);
    return false;
  }
};

// Función helper para ejecutar transacciones de forma segura
const executeTransaction = async (callback) => {
  let connection;
  try {
    connection = await pool.getConnection();
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

// Función para verificar el estado del pool
const getPoolStatus = () => {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length
  };
};

const closePool =  async () => {
  try {
    await pool.end()
    console.log(' Pool de conexiones cerrado correctamente')
  }catch (error){
    console.log('Error al cerrar el poll: ', error,message)
  }
}

export {
  pool,
  testConnection,
  executeTransaction,
  getPoolStatus,
  closePool
};