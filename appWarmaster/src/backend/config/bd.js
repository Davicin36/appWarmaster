const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`👤 Usuario: ${process.env.DB_USER}`);
    console.log(`🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('💡 Verifica tu archivo .env y que MySQL esté ejecutándose');
    console.error('🔧 Credenciales intentadas:');
    console.error(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.error(`   Usuario: ${process.env.DB_USER}`);
    console.error(`   Base de datos: ${process.env.DB_NAME}`);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};