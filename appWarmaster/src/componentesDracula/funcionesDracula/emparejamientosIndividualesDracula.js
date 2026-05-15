import torneosEpicApi from '@/servicios/apiEpic';

//===================================
//EMPAREJAMIENTOS POR SISTEMA SUIZO
//===================================
/**
 * Emparejamientos para siguientes rondas
 * @param {number} torneoId - ID del torneo
 * @param {number} ronda - Número de ronda actual
 * @returns {Promise<Array>} - Array de emparejamientos
 */
const generarEmparejamientosIniciales = async (torneoId) => {
    try {
        const dataJugadores = await torneosEpicApi.obtenerJugadoresTorneo(torneoId);
        const jugadores = Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || [];
    
        if (jugadores.length < 2) {
            throw new Error('Se necesitan al menos 2 jugadores para poder generar los emparejamientos');
        }

        const jugadoresAleatorios = [...jugadores].sort(() => Math.random() - 0.5);
        const emparejamientosRonda1 = [];

        for (let i = 0; i < jugadoresAleatorios.length - 1; i += 2) {
            const jug1 = jugadoresAleatorios[i];
            const jug2 = jugadoresAleatorios[i + 1];

            emparejamientosRonda1.push({
                mesa: Math.floor(i / 2) + 1,
                jugador1_id: jug1.jugador_id,
                jugador2_id: jug2.jugador_id,
                es_bye: 0,
                ronda: 1,
                jugador1: {
                    id: jug1.id,
                    jugador_id: jug1.jugador_id,
                    nombre: jug1.jugador_nombre,
                    jugador_nombre: jug1.jugador_nombre,
                    apellidos: jug1.jugador_apellidos || '',
                    club: jug1.club || '-',
                    ejercito: jug1.ejercito || '-',
                    puntos_victoria: 0,
                    puntos_masacre: 0
                },
                jugador2: {
                    id: jug2.id,
                    jugador_id: jug2.jugador_id,
                    nombre: jug2.jugador_nombre,
                    jugador_nombre: jug2.jugador_nombre,
                    apellidos: jug2.jugador_apellidos || '',
                    club: jug2.club || '-',
                    ejercito: jug2.ejercito || '-',
                    puntos_victoria: 0,
                    puntos_masacre: 0
                }
            });
        }
        
        if (jugadoresAleatorios.length % 2 !== 0) {
            const jugBye = jugadoresAleatorios[jugadoresAleatorios.length - 1];
            emparejamientosRonda1.push({
                mesa: emparejamientosRonda1.length + 1,
                jugador1_id: jugBye.jugador_id,
                jugador2_id: null,
                es_bye: 1,
                ronda: 1,
                jugador1: {
                    id: jugBye.id,
                    jugador_id: jugBye.jugador_id,
                    nombre: jugBye.jugador_nombre,
                    jugador_nombre: jugBye.jugador_nombre,
                    apellidos: jugBye.jugador_apellidos || '',
                    club: jugBye.club || '-',
                    ejercito: jugBye.ejercito || '-',
                    puntos_victoria: 0,
                    puntos_masacre: 0
                },
                jugador2: null
            });
        }

        return emparejamientosRonda1;

    } catch (error) {
        console.error('Error al generar los emparejamientos:', error);
        throw error;
    }
};

// ==========================================
// EMPAREJAMIENTOS POR SISTEMA SUIZO
// ==========================================

export const generarEmparejamientosIndividuales = async (torneoId, ronda, participantes = []) => {
    try {
        if (!ronda || ronda < 1) {
            throw new Error("Número de ronda no válido.");
        }

        if (ronda === 1) {
            return await generarEmparejamientosIniciales(torneoId);
        }

        // Obtener clasificación actual
        const responseClasificacion = await torneosEpicApi.obtenerClasificacionIndividual(torneoId);
        const clasificacionData = responseClasificacion?.data || responseClasificacion || [];

        if (!Array.isArray(clasificacionData) || clasificacionData.length < 2) {
            throw new Error("Se necesitan al menos 2 jugadores para poder realizar los emparejamientos");
        }

        // Normalizar campos
        const clasificacion = clasificacionData.map(j => ({
            ...j,
            puntos_victoria: j.puntos_victoria_totales || j.puntos_victoria || 0,
            puntos_masacre: j.puntos_masacre_totales || j.puntos_masacre || 0
        }));

        let historialSet = new Set();
        let jugadoresConBye = new Set();

        try {
            const historial = await torneosEpicApi.obtenerPartidasTorneo(torneoId);
            const historialArray = Array.isArray(historial) ? historial : [];

            // ✅ Mapa: jugador_torneo_epic.id (participacion) → usuarios.id (jugador_id)
            const mapaIds = {};
            participantes.forEach(j => {
                if (j.id && j.jugador_id) {
                    mapaIds[j.id] = j.jugador_id;
                }
            });

            console.log('🗺️ Mapa de IDs:', mapaIds);

            // ✅ Construir historial con IDs normalizados (usuarios.id)
            historialSet = new Set(
                historialArray.flatMap(e => {
                    const j1 = mapaIds[e.jugador1_id] || e.jugador1_id;
                    const j2 = e.jugador2_id
                        ? (mapaIds[e.jugador2_id] || e.jugador2_id)
                        : null;
                    if (!j2) return [];
                    return [
                        `${j1}-${j2}`,
                        `${j2}-${j1}`
                    ];
                })
            );

            // ✅ BYEs también normalizados
            historialArray.forEach(p => {
                if (p.jugador2_id === null || p.es_bye === 1) {
                    const j1 = mapaIds[p.jugador1_id] || p.jugador1_id;
                    jugadoresConBye.add(j1);
                }
            });

            console.log('📜 Historial enfrentamientos:', [...historialSet]);
            console.log('🚫 Jugadores con BYE previo:', [...jugadoresConBye]);

        } catch (error) {
            console.warn('⚠️ No se pudo obtener historial:', error.message);
        }

        // Ordenar por puntos (de mayor a menor)
        const jugadoresOrdenados = [...clasificacion].sort((a, b) => {
            if (b.puntos_victoria !== a.puntos_victoria) {
                return b.puntos_victoria - a.puntos_victoria;
            }
            return b.puntos_masacre - a.puntos_masacre;
        });

        const emparejamientos = [];
        const emparejados = new Set();

        // 🎯 PASO 1: Asignar BYE si número impar
        if (jugadoresOrdenados.length % 2 !== 0) {
            const jugadoresSinBye = jugadoresOrdenados.filter(j =>
                !jugadoresConBye.has(j.jugador_id)
            );

            const pool = jugadoresSinBye.length > 0 ? jugadoresSinBye : jugadoresOrdenados;

            const jugadoresPorMenosPuntos = [...pool].sort((a, b) => {
                if (a.puntos_victoria !== b.puntos_victoria) return a.puntos_victoria - b.puntos_victoria;
                return a.puntos_masacre - b.puntos_masacre;
            });

            const jugadorBye = jugadoresPorMenosPuntos[0];

            if (jugadoresSinBye.length === 0) {
                console.warn(`⚠️ Todos ya tuvieron BYE. Segundo BYE a ${jugadorBye.jugador_nombre || jugadorBye.nombre}`);
            }

            emparejamientos.push({
                jugador1_id: jugadorBye.jugador_id,
                jugador2_id: null,
                es_bye: 1
            });

            emparejados.add(jugadorBye.jugador_id);
            jugadoresConBye.add(jugadorBye.jugador_id);
        }

        // 🎯 PASO 2: Emparejar resto por sistema suizo
        const puedenEnfrentarse = (j1, j2) => {
            const enf1 = `${j1.jugador_id}-${j2.jugador_id}`;
            const enf2 = `${j2.jugador_id}-${j1.jugador_id}`;
            return !historialSet.has(enf1) && !historialSet.has(enf2);
        };

        // 🎯 PASO 2: Emparejar por sistema suizo puro
        for (let i = 0; i < jugadoresOrdenados.length; i++) {
            const jugador1 = jugadoresOrdenados[i];

            if (emparejados.has(jugador1.jugador_id)) continue;

            let jugador2 = null;
            let candidatoRematch = null;

            // Recorrer la clasificación de arriba a abajo buscando el siguiente disponible
            for (let j = i + 1; j < jugadoresOrdenados.length; j++) {
                const candidato = jugadoresOrdenados[j];

                if (emparejados.has(candidato.jugador_id)) continue;

                if (puedenEnfrentarse(jugador1, candidato)) {
                    // ✅ Primer candidato sin rematch → emparejar directamente
                    jugador2 = candidato;
                    break;
                } else if (!candidatoRematch) {
                    // Guardar el primero disponible por si no hay otra opción
                    candidatoRematch = candidato;
                }
            }

            // Si no hay nadie sin rematch, forzar con el primero disponible
            if (!jugador2 && candidatoRematch) {
                jugador2 = candidatoRematch;
                console.warn(`⚠️ REMATCH FORZADO: ${jugador1.jugador_nombre || jugador1.nombre} vs ${jugador2.jugador_nombre || jugador2.nombre}`);
            }

            if (jugador2) {
                emparejamientos.push({
                    jugador1_id: jugador1.jugador_id,
                    jugador2_id: jugador2.jugador_id,
                    es_bye: 0
                });
                emparejados.add(jugador1.jugador_id);
                emparejados.add(jugador2.jugador_id);
            } else {
                console.error(`🚨 ERROR: ${jugador1.jugador_nombre || jugador1.nombre} quedó sin rival`);
            }
        }

        // 🎯 PASO 3: Enriquecer con datos completos para el frontend
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
                    ejercito: jugador1Data.ejercito || '-',
                    puntos_victoria: jugador1Data.puntos_victoria || 0,
                    puntos_masacre: jugador1Data.puntos_masacre || 0
                } : null,
                jugador2: jugador2Data ? {
                    id: jugador2Data.jugador_id,
                    jugador_id: jugador2Data.jugador_id,
                    nombre: jugador2Data.jugador_nombre || jugador2Data.nombre,
                    jugador_nombre: jugador2Data.jugador_nombre || jugador2Data.nombre,
                    apellidos: jugador2Data.jugador_apellidos || jugador2Data.apellidos || '',
                    club: jugador2Data.club || '-',
                    ejercito: jugador2Data.ejercito || '-',
                    puntos_victoria: jugador2Data.puntos_victoria || 0,
                    puntos_masacre: jugador2Data.puntos_masacre || 0
                } : null
            };
        });

        return emparejamientosCompletos;

    } catch (error) {
        console.error("❌ Error al generar emparejamientos suizos:", error.message || error);
        return [];
    }
};