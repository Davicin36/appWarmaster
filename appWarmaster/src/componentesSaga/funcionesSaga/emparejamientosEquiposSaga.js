import torneosSagaApi from '@/servicios/apiSaga';

export const generarEmparejamientosEquipos = async (torneoId, ronda) => {
    try {
        console.log(`🏆 Iniciando generación de emparejamientos de equipos - Ronda ${ronda}`);

        let emparejamientos;

        if (ronda === 1) {
            emparejamientos = await generarEmparejamientosAleatoriosEquipos(torneoId);
        } else {
            emparejamientos = await generarEmparejamientosSuizoEquipos(torneoId);
        }

        console.log(`✅ ${emparejamientos.length} emparejamientos de equipos generados`);
        return emparejamientos;

    } catch (error) {
        console.error('❌ Error en generarEmparejamientosEquipos:', error);
        throw error;
    }
};

// ==========================================
// EMPAREJAMIENTOS ALEATORIOS DE EQUIPOS (RONDA 1)
// ==========================================

const generarEmparejamientosAleatoriosEquipos = async (torneoId) => {
    try {
        console.log('🎲 Generando emparejamientos aleatorios de equipos - Ronda 1...');

        const response = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
        const equipos = Array.isArray(response) ? response : response.data || [];

        console.log('📦 Response completa:', response);
        console.log('📋 Equipos extraídos:', equipos);
        console.log('📊 Cantidad de equipos:', equipos.length);
        
        // Debug: ver estructura de cada equipo
        equipos.forEach((eq, i) => {
            console.log(`   Equipo ${i}:`, eq);
        });

        if (equipos.length < 2) {
            throw new Error('Se necesitan al menos 2 equipos para generar emparejamientos');
        }

        // 🎲 Aleatorizar equipos
        const equiposAleatorios = [...equipos].sort(() => Math.random() - 0.5);
        console.log('🔀 Equipos aleatorizados:', equiposAleatorios.map(e => e.nombre_equipo || e.equipo_id));
        
        const emparejamientos = [];
        let equipoBye = null;

        // 🎯 Detectar BYE si hay número impar (pero procesarlo al final)
        if (equiposAleatorios.length % 2 !== 0) {
            equipoBye = equiposAleatorios.pop();
            console.log(`⭐ BYE detectado para: ${equipoBye.nombre_equipo} (ID: ${equipoBye.equipo_id})`);
        }

        console.log(`⚔️ Equipos a emparejar: ${equiposAleatorios.length}`);

        // ⚔️ Emparejar primero todos los equipos normales
        for (let i = 0; i < equiposAleatorios.length; i += 2) {
            const eq1 = equiposAleatorios[i];
            const eq2 = equiposAleatorios[i + 1];
            
            console.log(`   Emparejando: ${eq1?.nombre_equipo} vs ${eq2?.nombre_equipo}`);
            
            emparejamientos.push({
                equipo1_id: eq1.id,
                equipo2_id: eq2.id,
                equipo1: eq1,
                equipo2: eq2,
                es_bye: false
            });
        }

        // ✅ Añadir BYE AL FINAL (último recurso)
        if (equipoBye) {
            emparejamientos.push({
                equipo1_id: equipoBye.id,
                equipo2_id: null,
                equipo1: equipoBye,
                equipo2: null,
                es_bye: true
            });
            console.log(`✅ BYE asignado al final a: ${equipoBye.nombre_equipo}`);
        }

        console.log('🏁 Emparejamientos finales:', emparejamientos);
        console.log(`✅ ${emparejamientos.length} emparejamientos aleatorios de equipos generados`);
        
        return emparejamientos;

    } catch (error) {
        console.error('❌ Error en emparejamientos aleatorios de equipos:', error);
        throw error;
    }
};

// ==========================================
// EMPAREJAMIENTOS SISTEMA SUIZO DE EQUIPOS (RONDA 2+)
// ==========================================

const generarEmparejamientosSuizoEquipos = async (torneoId) => {
    try {
        console.log('🏆 Generando emparejamientos sistema suizo de equipos...');

        // 1️⃣ Obtener clasificación de equipos
        const responseClasificacion = await torneosSagaApi.obtenerClasificacionEquipos(torneoId);
        const clasificacion = responseClasificacion?.data || responseClasificacion || [];

        if (!Array.isArray(clasificacion) || clasificacion.length < 2) {
            throw new Error("Se necesitan al menos 2 equipos en la clasificación");
        }

        console.log(`📊 ${clasificacion.length} equipos en clasificación`);

        // 2️⃣ Obtener historial de enfrentamientos y BYEs
        const { historialEnfrentamientos, equiposConBye } = await obtenerHistorialEquipos(torneoId);
        console.log(`📜 ${historialEnfrentamientos.size} enfrentamientos previos registrados`);
        console.log(`⭐ ${equiposConBye.size} equipos con BYE previo`);

        // 3️⃣ Ordenar equipos por puntuación
        const equiposOrdenados = ordenarEquipos(clasificacion);

        // 4️⃣ Generar emparejamientos
        const emparejamientos = [];
        const emparejados = new Set();

        // 🎯 PASO 1: BYE PRIMERO si hay número impar
        if (equiposOrdenados.length % 2 !== 0) {
            const equipoBye = seleccionarEquipoParaBye(equiposOrdenados, equiposConBye);
            
            emparejamientos.push({
                equipo1_id: equipoBye.equipo_id,
                equipo2_id: null,
                equipo1: equipoBye,
                equipo2: null,
                es_bye: true
            });
            
            emparejados.add(equipoBye.equipo_id);
            console.log(`✅ BYE asignado a: ${equipoBye.nombre_equipo}`);
        }

        // 🎯 PASO 2: Emparejar el resto de equipos
        for (let i = 0; i < equiposOrdenados.length; i++) {
            const equipo1 = equiposOrdenados[i];
            
            if (emparejados.has(equipo1.equipo_id)) continue;

            const equipo2 = buscarRivalOptimoEquipo(
                equipo1,
                equiposOrdenados,
                emparejados,
                historialEnfrentamientos,
                i
            );

            if (equipo2) {
                emparejamientos.push({
                    equipo1_id: equipo1.equipo_id,
                    equipo2_id: equipo2.equipo_id,
                    equipo1: equipo1,
                    equipo2: equipo2,
                    es_bye: false
                });
                
                emparejados.add(equipo1.equipo_id);
                emparejados.add(equipo2.equipo_id);
                
                console.log(`⚔️ Emparejado: ${equipo1.nombre_equipo} vs ${equipo2.nombre_equipo}`);
            } else {
                console.error(`🚨 ERROR: ${equipo1.nombre_equipo} quedó sin rival`);
                throw new Error(`No se pudo encontrar rival para ${equipo1.nombre_equipo}`);
            }
        }

        console.log(`✅ ${emparejamientos.length} emparejamientos suizos de equipos`);
        return emparejamientos;

    } catch (error) {
        console.error('❌ Error en sistema suizo de equipos:', error);
        throw error;
    }
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Obtiene el historial de enfrentamientos entre equipos
 */
const obtenerHistorialEquipos = async (torneoId) => {
    const historialEnfrentamientos = new Set();
    const equiposConBye = new Set();

    try {
        const historial = await torneosSagaApi.obtenerPartidasTorneo(torneoId);
        const partidas = Array.isArray(historial) ? historial : [];

        for (const partida of partidas) {
            const eq1 = partida.equipo1_id;
            const eq2 = partida.equipo2_id;
            
            // Registrar enfrentamientos entre equipos
            if (eq1 && eq2) {
                historialEnfrentamientos.add(`${eq1}-${eq2}`);
                historialEnfrentamientos.add(`${eq2}-${eq1}`);
            }
            
            // Registrar equipos que tuvieron BYE
            if (!eq2 || partida.es_bye === 1) {
                equiposConBye.add(eq1);
            }
        }
    } catch (error) {
        console.warn('⚠️ No se pudo obtener historial de equipos:', error.message);
    }

    return { historialEnfrentamientos, equiposConBye };
};

/**
 * Ordena equipos por puntuación (mayor a menor)
 */
const ordenarEquipos = (clasificacion) => {
    return [...clasificacion].sort((a, b) => {
        // Prioridad 1: Puntos de victoria
        const puntosVictoriaA = a.puntos_victoria_eq_totales || a.puntos_victoria_totales || 0;
        const puntosVictoriaB = b.puntos_victoria_eq_totales || b.puntos_victoria_totales || 0;
        
        if (puntosVictoriaB !== puntosVictoriaA) {
            return puntosVictoriaB - puntosVictoriaA;
        }

        // Prioridad 2: Puntos de torneo
        const puntosTorneoA = a.puntos_torneo_eq_totales || a.puntos_partida_totales || 0;
        const puntosTorneoB = b.puntos_torneo_eq_totales || b.puntos_partida_totales || 0;
        
        if (puntosTorneoB !== puntosTorneoA) {
            return puntosTorneoB - puntosTorneoA;
        }

        // Prioridad 3: Puntos de masacre
        const puntosMasacreA = a.puntos_masacre_eq_totales || a.puntos_masacre_totales || 0;
        const puntosMasacreB = b.puntos_masacre_eq_totales || b.puntos_masacre_totales || 0;
        
        return puntosMasacreB - puntosMasacreA;
    });
};

/**
 * Selecciona qué equipo debe recibir el BYE
 * Prioridad: Menor puntuación SIN BYE previo
 */
const seleccionarEquipoParaBye = (equiposOrdenados, equiposConBye) => {
    // Filtrar equipos que NO han tenido BYE
    const equiposSinBye = equiposOrdenados.filter(eq => 
        !equiposConBye.has(eq.equipo_id)
    );

    if (equiposSinBye.length > 0) {
        // Ordenar por MENOR puntuación
        const porMenosPuntos = [...equiposSinBye].sort((a, b) => {
            const puntosA = (a.puntos_victoria_eq_totales || 0) + (a.puntos_torneo_eq_totales || 0);
            const puntosB = (b.puntos_victoria_eq_totales || 0) + (b.puntos_torneo_eq_totales || 0);
            return puntosA - puntosB;
        });
        return porMenosPuntos[0];
    } else {
        // TODOS tuvieron BYE, dar al de menor puntuación
        console.warn('⚠️ TODOS los equipos ya tuvieron BYE. Asignando segundo BYE.');
        const porMenosPuntos = [...equiposOrdenados].sort((a, b) => {
            const puntosA = (a.puntos_victoria_eq_totales || 0) + (a.puntos_torneo_eq_totales || 0);
            const puntosB = (b.puntos_victoria_eq_totales || 0) + (b.puntos_torneo_eq_totales || 0);
            return puntosA - puntosB;
        });
        return porMenosPuntos[0];
    }
};

/**
 * Busca el rival óptimo para un equipo según sistema suizo
 */
const buscarRivalOptimoEquipo = (equipo1, equiposOrdenados, emparejados, historialEnfrentamientos, indiceActual) => {
    
    const puedenEnfrentarse = (eq1, eq2) => {
        const key = `${eq1.equipo_id}-${eq2.equipo_id}`;
        return !historialEnfrentamientos.has(key);
    };

    let mejorRival = null;
    const equiposSinEmparejar = equiposOrdenados.filter(eq => 
        !emparejados.has(eq.equipo_id)
    );

    // 🔥 Si quedan 4 o menos, buscar por cercanía de puntos
    if (equiposSinEmparejar.length <= 4 && equiposSinEmparejar.length >= 2) {
        let distanciaMinima = Infinity;
        
        for (let j = indiceActual + 1; j < equiposOrdenados.length; j++) {
            const candidato = equiposOrdenados[j];
            
            if (emparejados.has(candidato.equipo_id)) continue;
            
            if (puedenEnfrentarse(equipo1, candidato)) {
                const puntosEq1 = (equipo1.puntos_victoria_eq_totales || 0) + (equipo1.puntos_torneo_eq_totales || 0);
                const puntosCandidato = (candidato.puntos_victoria_eq_totales || 0) + (candidato.puntos_torneo_eq_totales || 0);
                const distancia = Math.abs(puntosEq1 - puntosCandidato);
                
                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    mejorRival = candidato;
                }
            }
        }
        
        // Si no hay rival sin rematch, forzar rematch
        if (!mejorRival) {
            for (let j = indiceActual + 1; j < equiposOrdenados.length; j++) {
                const candidato = equiposOrdenados[j];
                if (!emparejados.has(candidato.equipo_id)) {
                    mejorRival = candidato;
                    console.warn(`⚠️ REMATCH FORZADO: ${equipo1.nombre_equipo} vs ${candidato.nombre_equipo}`);
                    break;
                }
            }
        }
    } else {
        // Lógica normal para más de 4 equipos
        for (let j = indiceActual + 1; j < equiposOrdenados.length; j++) {
            const candidato = equiposOrdenados[j];
            
            if (emparejados.has(candidato.equipo_id)) continue;

            if (puedenEnfrentarse(equipo1, candidato)) {
                mejorRival = candidato;
                break;
            } else if (!mejorRival) {
                mejorRival = candidato;
            }
        }
        
        if (mejorRival && !puedenEnfrentarse(equipo1, mejorRival)) {
            console.warn(`⚠️ REMATCH FORZADO: ${equipo1.nombre_equipo} vs ${mejorRival.nombre_equipo}`);
        }
    }

    return mejorRival;
};