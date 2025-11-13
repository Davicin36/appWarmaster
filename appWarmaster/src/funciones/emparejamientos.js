import torneosSagaApi from '../servicios/apiSaga';

// ==========================================
// EMPAREJAMIENTOS ALEATORIOS
// ==========================================

/**
 * Genera emparejamientos aleatorios para la primera ronda
 * @param {number} torneoId - ID del torneo
 * @returns {Promise<Array>} - Array de emparejamientos
 */
    
const generarEmparejamientosIniciales = async (torneoId) => {
    try {
        const dataJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
        const jugadores = Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || [];
    
        if (jugadores.length < 2) {
            throw new Error('Se necesitan al menos 2 jugadores para poder generar los emparejamientos');
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
        
        // Si el número de jugadores es IMPAR entonces el último tiene BYE
        if (jugadoresAleatorios.length % 2 !== 0) {
            emparejamientosRonda1.push({
                mesa: emparejamientosRonda1.length + 1,
                jugador1: jugadoresAleatorios[jugadoresAleatorios.length - 1],
                jugador2: null
            });
        }

        return emparejamientosRonda1;

    } catch (error) {
        console.error('Error al generar los emparejamientos:', error);
        throw error;
    }
};

//===================================
//EMPAREJAMIENTOS POR SISTEMA SUIZO
//===================================
/**
 * Emparejamientos para siguientes rondas
 * @param {number} torneoId - ID del torneo
 * @param {number} ronda - Número de ronda actual
 * @returns {Promise<Array>} - Array de emparejamientos
 */
export const generarEmparejamientosSuizo = async (torneoId, ronda) => {
    try {
        if (!ronda || ronda < 1) {
            throw new Error("Número de ronda no válido.");
        }

        if (ronda === 1) {
            return await generarEmparejamientosIniciales(torneoId);
        }

        // Obtener clasificación actual
        const responseClasificacion = await torneosSagaApi.obtenerClasificacion(torneoId);
        const clasificacionData = responseClasificacion?.data || responseClasificacion || [];

        if (!Array.isArray(clasificacionData) || clasificacionData.length < 2) {
            throw new Error("Se necesitan al menos 2 jugadores para poder realizar los emparejamientos");
        }

        // ✅ NORMALIZAR CAMPOS
        const clasificacion = clasificacionData.map(j => ({
            ...j,
            puntos_victoria: j.puntos_victoria || j.puntos_victoria_totales || 0,
            puntos_torneo: j.puntos_torneo || j.puntos_torneo_totales || 0,
            puntos_masacre: j.puntos_masacre || j.puntos_masacre_totales || 0
        }));

        console.log('📊 Clasificación obtenida:', clasificacion.length, 'jugadores');

        // ✅ Obtener historial de enfrentamientos y BYE anteriores
        let historialSet = new Set();
        let jugadoresConBye = new Set();
        let historialArray = [];

        try {
            const historial = await torneosSagaApi.obtenerPartidasTorneo(torneoId);
            historialArray = Array.isArray(historial) ? historial : [];

            // Construir set de enfrentamientos
            historialSet = new Set(
                historialArray.flatMap(e => [
                    `${e.jugador1_id}-${e.jugador2_id}`,
                    `${e.jugador2_id}-${e.jugador1_id}`
                ])
            );
            
            // Identificar jugadores que ya tuvieron BYE
            historialArray.forEach(p => {
                if (p.jugador2_id === null || p.es_bye === 1) {
                    jugadoresConBye.add(p.jugador1_id);
                }
            });

            console.log('📜 Historial de partidas:', historialArray.length);
            console.log('⭐ Jugadores que ya tuvieron BYE:', Array.from(jugadoresConBye));
        } catch (error) {
            console.warn('⚠️ No se pudo obtener historial:', error.message);
        }

        // Ordenar por puntos (de mayor a menor)
        const jugadoresOrdenados = [...clasificacion].sort((a, b) => {
            if (b.puntos_victoria !== a.puntos_victoria) {
                return b.puntos_victoria - a.puntos_victoria;
            }
            if (b.puntos_torneo !== a.puntos_torneo) {
                return b.puntos_torneo - a.puntos_torneo;
            }
            return b.puntos_masacre - a.puntos_masacre;
        });

        console.log('🔄 Iniciando emparejamientos...');

        const emparejamientos = [];
        const emparejados = new Set();

        // 🎯 PASO 1: Si hay número impar, asignar BYE PRIMERO
        if (jugadoresOrdenados.length % 2 !== 0) {
            console.log('📊 Número impar de jugadores, asignando BYE...');
            
            // Filtrar jugadores sin BYE previo
            const jugadoresSinBye = jugadoresOrdenados.filter(j => 
                !jugadoresConBye.has(j.jugador_id)
            );

            if (jugadoresSinBye.length > 0) {
                // Ordenar por MENOS puntos (invertir orden)
                const jugadoresPorMenosPuntos = [...jugadoresSinBye].sort((a, b) => {
                    if (a.puntos_victoria !== b.puntos_victoria) {
                        return a.puntos_victoria - b.puntos_victoria; // Menor primero
                    }
                    if (a.puntos_torneo !== b.puntos_torneo) {
                        return a.puntos_torneo - b.puntos_torneo;
                    }
                    return a.puntos_masacre - b.puntos_masacre;
                });

                // Asignar BYE al jugador con menos puntos
                const jugadorBye = jugadoresPorMenosPuntos[0];
                
                console.log(`🎯 BYE asignado a ${jugadorBye.jugador_nombre || jugadorBye.nombre} (ID: ${jugadorBye.jugador_id}) - Menor puntuación sin BYE previo`);
                
                emparejamientos.push({
                    jugador1_id: jugadorBye.jugador_id,
                    jugador2_id: null,
                    es_bye: 1
                });
                
                emparejados.add(jugadorBye.jugador_id);
                jugadoresConBye.add(jugadorBye.jugador_id);
            } else {
                // 🚨 CASO EXTREMO: Todos ya tuvieron BYE
                console.warn('⚠️ TODOS los jugadores ya tuvieron BYE. Asignando segundo BYE al de menor puntuación.');
                
                // Ordenar TODOS por menor puntuación
                const todosOrdenadosPorMenos = [...jugadoresOrdenados].sort((a, b) => {
                    if (a.puntos_victoria !== b.puntos_victoria) {
                        return a.puntos_victoria - b.puntos_victoria;
                    }
                    if (a.puntos_torneo !== b.puntos_torneo) {
                        return a.puntos_torneo - b.puntos_torneo;
                    }
                    return a.puntos_masacre - b.puntos_masacre;
                });

                const jugadorBye = todosOrdenadosPorMenos[0];
                
                console.warn(`⚠️ Segundo BYE asignado a ${jugadorBye.jugador_nombre || jugadorBye.nombre}`);
                
                emparejamientos.push({
                    jugador1_id: jugadorBye.jugador_id,
                    jugador2_id: null,
                    es_bye: 1
                });
                
                emparejados.add(jugadorBye.jugador_id);
            }
        }

        // 🎯 PASO 2: Emparejar al resto de jugadores (ahora son número PAR)
        const puedenEnfrentarse = (j1, j2) => {
            const enf1 = `${j1.jugador_id}-${j2.jugador_id}`;
            const enf2 = `${j2.jugador_id}-${j1.jugador_id}`;
            return !historialSet.has(enf1) && !historialSet.has(enf2);
        };

        for (let i = 0; i < jugadoresOrdenados.length; i++) {
            const jugador1 = jugadoresOrdenados[i];
            
            if (emparejados.has(jugador1.jugador_id)) {
                continue;
            }

            console.log(`🔍 Buscando rival para ${jugador1.jugador_nombre || jugador1.nombre} (ID: ${jugador1.jugador_id})`);
            
            let jugador2 = null;
            let mejorCandidato = null;

            // Buscar rival sin rematch
            for (let j = i + 1; j < jugadoresOrdenados.length; j++) {
                const candidato = jugadoresOrdenados[j];
                
                if (emparejados.has(candidato.jugador_id)) {
                    continue;
                }

                const puedenJugar = puedenEnfrentarse(jugador1, candidato);

                if (puedenJugar) {
                    jugador2 = candidato;
                    console.log(`  ✅ Rival encontrado: ${jugador2.jugador_nombre || jugador2.nombre}`);
                    break;
                } else if (!mejorCandidato) {
                    mejorCandidato = candidato;
                }
            }

            // Si no hay rival sin rematch, aceptar rematch si hay más de 2 jugadores
            if (!jugador2 && mejorCandidato) {
                const jugadoresSinEmparejar = jugadoresOrdenados.filter(j => 
                    !emparejados.has(j.jugador_id)
                );
                
                if (jugadoresSinEmparejar.length > 2) {
                    jugador2 = mejorCandidato;
                    console.warn(`  ⚠️ REMATCH FORZADO con ${jugador2.jugador_nombre || jugador2.nombre}`);
                }
            }

            // Emparejar
            if (jugador2) {
                console.log(`  ⚔️ Emparejamiento: ${jugador1.jugador_nombre || jugador1.nombre} vs ${jugador2.jugador_nombre || jugador2.nombre}`);
                
                emparejamientos.push({
                    jugador1_id: jugador1.jugador_id,
                    jugador2_id: jugador2.jugador_id,
                    es_bye: 0
                });
                
                emparejados.add(jugador1.jugador_id);
                emparejados.add(jugador2.jugador_id);
            } else {
                // 🚨 Esto NO debería pasar si la lógica de BYE funcionó correctamente
                console.error(`  🚨 ERROR: ${jugador1.jugador_nombre || jugador1.nombre} quedó sin rival y sin BYE`);
            }
        }

        console.log(`✅ Emparejamientos creados: ${emparejamientos.length}`);
        console.log('📊 Jugadores con BYE (actualizado):', Array.from(jugadoresConBye));

        // 🎯 PASO 3: ENRIQUECER con datos completos para el frontend
        const emparejamientosCompletos = emparejamientos.map((emp, index) => {
            const jugador1Data = jugadoresOrdenados.find(j => j.jugador_id === emp.jugador1_id);
            const jugador2Data = emp.jugador2_id 
                ? jugadoresOrdenados.find(j => j.jugador_id === emp.jugador2_id)
                : null;

            return {
                mesa: index + 1,
                jugador1_id: emp.jugador1_id,
                jugador2_id: emp.jugador2_id,
                es_bye: emp.es_bye,
                ronda: ronda,
                jugador1: jugador1Data ? {
                    id: jugador1Data.jugador_id,
                    jugador_id: jugador1Data.jugador_id,
                    nombre: jugador1Data.jugador_nombre || jugador1Data.nombre,
                    jugador_nombre: jugador1Data.jugador_nombre || jugador1Data.nombre,
                    apellidos: jugador1Data.jugador_apellidos || jugador1Data.apellidos || '',
                    club: jugador1Data.club || '-',
                    ejercito: jugador1Data.faccion || jugador1Data.ejercito || '-',
                    puntos_victoria: jugador1Data.puntos_victoria || 0,
                    puntos_torneo: jugador1Data.puntos_torneo || 0,
                    puntos_masacre: jugador1Data.puntos_masacre || 0
                } : null,
                jugador2: jugador2Data ? {
                    id: jugador2Data.jugador_id,
                    jugador_id: jugador2Data.jugador_id,
                    nombre: jugador2Data.jugador_nombre || jugador2Data.nombre,
                    jugador_nombre: jugador2Data.jugador_nombre || jugador2Data.nombre,
                    apellidos: jugador2Data.jugador_apellidos || jugador2Data.apellidos || '',
                    club: jugador2Data.club || '-',
                    ejercito: jugador2Data.faccion || jugador2Data.ejercito || '-',
                    puntos_victoria: jugador2Data.puntos_victoria || 0,
                    puntos_torneo: jugador2Data.puntos_torneo || 0,
                    puntos_masacre: jugador2Data.puntos_masacre || 0
                } : null
            };
        });

        console.log('✅ Emparejamientos enriquecidos:', emparejamientosCompletos);
        console.log(`✅ ${emparejamientosCompletos.length} emparejamientos generados para ronda ${ronda}`);
        
        return emparejamientosCompletos;
        
    } catch (error) {
        console.error("❌ Error al generar emparejamientos suizos:", error.message || error);
        return [];
    }
};