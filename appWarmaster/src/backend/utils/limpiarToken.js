import cron from 'node-cron';
import { pool } from '../config/db.js';

/**
 * Limpia los tokens de recuperación de contraseña expirados o usados
 * Se ejecuta automáticamente cada día a las 3:00 AM
 */
const limpiarTokensExpirados = async () => {
    try {
        const [resultado] = await pool.query(`
            DELETE FROM password_reset_tokens 
            WHERE expiracion < NOW() OR usado = TRUE
        `);

        if (resultado.affectedRows > 0) {
            console.log(`✅ Limpieza completada: ${resultado.affectedRows} tokens eliminados`);
        } else {
            console.log('ℹ️ No hay tokens para limpiar');
        }
    } catch (error) {
        console.error('❌ Error al limpiar tokens expirados:', error);
    }
};

/**
 * Programa la limpieza automática
 * Cron pattern: '0 3 * * *' = Todos los días a las 3:00 AM
 */
const iniciarLimpieza = () => {
    // Ejecutar inmediatamente al iniciar
    limpiarTokensExpirados();

    // Programar ejecución diaria a las 3:00 AM
    cron.schedule('0 3 * * *', () => {
        console.log('🔄 Iniciando limpieza programada de tokens...');
        limpiarTokensExpirados();
    });

    console.log('✅ Limpieza automática de tokens programada (3:00 AM diario)');
};

/**
 * Limpieza manual (para usar desde la terminal)
 */
const limpiezaManual = async () => {
    console.log('🔄 Ejecutando limpieza manual...');
    await limpiarTokensExpirados();
    process.exit(0);
};

// Si se ejecuta directamente desde la terminal
if (require.main === module) {
    limpiezaManual();
}

export {
    iniciarLimpieza,
    limpiarTokensExpirados
};