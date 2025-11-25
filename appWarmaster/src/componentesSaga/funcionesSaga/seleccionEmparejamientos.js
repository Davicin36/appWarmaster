
import { generarEmparejamientosEquipos } from './emparejamientosEquiposSaga';
import { generarEmparejamientosIndividuales } from './emparejamientosIndividualesSaga';


export const generarEmparejamientos = async (torneoId, ronda, tipo = 'individual', participantes = []) => {
    try {
        console.log(`🎯 Generando emparejamientos tipo: ${tipo.toUpperCase()} - Ronda ${ronda}`);

        if (!torneoId || !ronda || ronda < 1) {
            throw new Error('Parámetros inválidos: torneoId y ronda son requeridos');
        }

        let emparejamientos;

        if (tipo === 'Por equipos') {
            // 🏆 EMPAREJAMIENTOS POR EQUIPOS
            emparejamientos = await generarEmparejamientosEquipos(torneoId, ronda);
        } else {
            // 👤 EMPAREJAMIENTOS INDIVIDUALES
            emparejamientos = await generarEmparejamientosIndividuales(torneoId, ronda, participantes);
        }

        console.log(`✅ ${emparejamientos.length} emparejamientos generados correctamente`);
        return emparejamientos;

    } catch (error) {
        console.error('❌ Error en generarEmparejamientos:', error);
        throw error;
    }
};

// Exportar también las funciones individuales por si se necesitan directamente
export { generarEmparejamientosIndividuales } from './emparejamientosIndividualesSaga';
export { generarEmparejamientosEquipos } from './emparejamientosEquiposSaga';