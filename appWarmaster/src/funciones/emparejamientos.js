import torneosSagaApi from '../servicios/apiSaga' 

// ==========================================
// EMPAREJAMIENTOS ALEATORIOS
// ==========================================

/**
 * Genera emparejamientos aleatorios para la primera ronda
 * @param {number} - ID del torneo
 * @returns {Promise<Array>} - Array de emparejamientos
 */
    
const generarEmparejamientosIniciales = async (torneoId) => {
    
    try{

        const dataJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId)
        const jugadores = Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []
    
        if (jugadores.length < 2) {
            throw new Error ('Se necesitan al menos 2 jugadores para poder generar los emparejamientos')
        }

        const jugadoresAleatorios = [...jugadores].sort(() => Math.random() - 0.5);
        const emparejamientosRonda1 = [];

        for (let i = 0; i < jugadoresAleatorios.length - 1; i += 2) {
            emparejamientosRonda1.push({
                mesa: Math.floor(i / 2) + 1,
                jugador1: jugadoresAleatorios[i],
                jugador2: jugadoresAleatorios[i + 1]
            });
        }
        //si el numero de jugadores es IMPAR entonces el ultimo tiene BYE.
    if (jugadoresAleatorios.length % 2 !== 0) {
        emparejamientosRonda1.push({
            mesa: emparejamientosRonda1.length + 1,
            jugador1: jugadoresAleatorios[jugadoresAleatorios.length - 1],
            jugador2: null
        });
    }

    return emparejamientosRonda1;

    }catch (error) {
        console.error('Error al generar los emparejamientos:' , error)
        throw error;
}
}

//===================================
//EMPAREJAMIENTOS POR SISTEMA SUIZO
//===================================

/**
 * emparejamientos para siguientes rondas
 * @param {*} torneoId - id del torneo
 * @param {*} rondas - numero de ronda actual
 * @returns {Promise<Array>} - array de emparejamientos
 */
export const generarEmparejamientosSuizo = async (torneoId, ronda) => {
    try {
        if (!ronda || ronda < 1) {
            throw new Error("Número de ronda no válido.");
        }

        // Si es la primera ronda, delegar a la función de emparejamientos iniciales
        if (ronda === 1) {
            return await generarEmparejamientosIniciales(torneoId);
        }

        // Obtener clasificación actual
        const clasificacion = await torneosSagaApi.obtenerClasificacionTorneo(torneoId);
        if (!Array.isArray(clasificacion) || clasificacion.length < 2) {
            throw new Error("Se necesitan al menos 2 jugadores para poder realizar los emparejamientos");
        }

        // Validar estructura mínima (si falla, lanzar error descriptivo)
        const camposRequeridos = [
            "jugador_id", 
            "nombre_completo", 
            "club", "faccion",
            "puntos_torneo", 
            "puntos_victoria", 
            "puntos_masacre", 
            "primer_jugador", 
            "ha_tenido_bye"
        ];
        const faltantes = camposRequeridos.filter(campo => !(campo in clasificacion[0]));
        if (faltantes.length > 0) {
            throw new Error(`Faltan campos en la clasificación: ${faltantes.join(", ")}`);
        }

        // Obtener historial de enfrentamientos anteriores
        const historial = (await torneosSagaApi.obtenerHistorialPartidas(torneoId)) || [];
        const historialSet = new Set(
            historial.flatMap(e => [
                `${e.jugador1_id}-${e.jugador2_id}`,
                `${e.jugador2_id}-${e.jugador1_id}`
            ])
        );

        // Ordenar por puntos de torneo y luego por puntos de victoria (descendente)
        const jugadoresOrdenados = [...clasificacion].sort((a, b) => {
            // Vemos si los puntos de victoria son diferentes, si lo son ordenamos.
            if (b.puntos_victoria !== a.puntos_victoria) {
                return b.puntos_victoria - a.puntos_victoria;
            // aqui si son iguales los puntos de victoria, comparamos por puntos de torneo
            }else if (b.puntos_torneo !== a.puntos_torneo){
                return b.puntos_torneo - a.puntos_torneo;
            }
            //sino pues ya desempatamos por puntos de masacre
            return b.puntos_masacre - a.puntos_masacre
        });

        // Asignar bye al jugador con menos puntos que no haya tenido uno
        let jugadorBye = null;
        if (jugadoresOrdenados.length % 2 !== 0) {
            const candidatos = jugadoresOrdenados
                .filter(j => !j.ha_tenido_bye)
                .sort((a, b) => a.puntos_torneo - b.puntos_torneo);

            if (candidatos.length > 0) {
                jugadorBye = candidatos[0];
            } else {
                jugadorBye = jugadoresOrdenados[jugadoresOrdenados.length - 1];
            }

            // Solo marcar en memoria, no se guarda en BD aquí
            jugadorBye.ha_tenido_bye = true;
        }

        // Emparejar evitando rematches
        const emparejamientos = [];
        const emparejados = new Set();

        for (let i = 0; i < jugadoresOrdenados.length; i++) {
            const jugador1 = jugadoresOrdenados[i];
            if (emparejados.has(jugador1.jugador_id) || jugador1 === jugadorBye) continue;

            let jugador2 = null;

            for (let j = i + 1; j < jugadoresOrdenados.length; j++) {
                const candidato = jugadoresOrdenados[j];
                const enf1 = `${jugador1.jugador_id}-${candidato.jugador_id}`;
                const enf2 = `${candidato.jugador_id}-${jugador1.jugador_id}`;

                if (
                    !emparejados.has(candidato.jugador_id) &&
                    candidato !== jugadorBye &&
                    !historialSet.has(enf1) &&
                    !historialSet.has(enf2)
                ) {
                    jugador2 = candidato;
                    break;
                }
            }

            // Si no hay rival ideal, emparejar con el siguiente disponible
            if (!jugador2) {
                jugador2 = jugadoresOrdenados.find(
                    j => !emparejados.has(j.jugador_id) && j !== jugador1 && j !== jugadorBye
                );
            }

            // Registrar emparejamiento
            if (jugador2) {
                emparejamientos.push({
                    mesa: emparejamientos.length + 1,
                    jugador1: {
                        id: jugador1.jugador_id,
                        nombre: jugador1.nombre_completo,
                        club: jugador1.club,
                        ejercito: jugador1.faccion,
                        puntos_torneo: jugador1.puntos_torneo
                    },
                    jugador2: {
                        id: jugador2.jugador_id,
                        nombre: jugador2.nombre_completo,
                        club: jugador2.club,
                        ejercito: jugador2.faccion,
                        puntos_torneo: jugador2.puntos_torneo
                    },
                    ronda,
                    mesa_db: emparejamientos.length + 1
                });

                emparejados.add(jugador1.jugador_id);
                emparejados.add(jugador2.jugador_id);
            }
        }

        // Añadir el bye si lo hay (solo visual, no persistente)
        if (jugadorBye) {
            emparejamientos.push({
                mesa: emparejamientos.length + 1,
                jugador1: {
                    id: jugadorBye.jugador_id,
                    nombre: jugadorBye.nombre_completo,
                    club: jugadorBye.club,
                    ejercito: jugadorBye.faccion,
                    puntos_torneo: jugadorBye.puntos_torneo
                },
                jugador2: null,
                ronda,
                bye: true
            });
        }

        return emparejamientos;
    } catch (error) {
        console.error("❌ Error al generar emparejamientos suizos:", error.message || error);
        return [];
    }
};
