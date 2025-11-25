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
// OBTENER JUGADORES DE UN EQUIPO CON ÉPOCA
// ==========================================

const obtenerJugadoresEquipo = async (torneoId, equipoId) => {
    try {
        const response = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
        const todosJugadores = Array.isArray(response) ? response : response.data || [];
        
        // Filtrar solo los jugadores de este equipo
        const jugadoresEquipo = todosJugadores.filter(j => 
            j.equipo_id === equipoId || 
            (j.equipo && (j.equipo.id === equipoId || j.equipo.equipo_id === equipoId))
        );
        
        return jugadoresEquipo;
    } catch (error) {
        console.warn(`⚠️ No se pudieron obtener jugadores del equipo ${equipoId}:`, error);
        return [];
    }
};

// ==========================================
// CREAR ESTRUCTURA COMPLETA DE ENFRENTAMIENTO CON JUGADORES
// ==========================================

const crearEnfrentamientoCompleto = async (torneoId, equipo1, equipo2 = null, esBye = false) => {
    try {
        console.log(`🔨 Creando enfrentamiento: ${equipo1.nombre_equipo} vs ${equipo2?.nombre_equipo || 'BYE'}`);
        
        // Obtener jugadores de ambos equipos
        const equipo1Id = equipo1.id || equipo1.equipo_id;
        const equipo2Id = equipo2 ? (equipo2.id || equipo2.equipo_id) : null;
        
        const jugadores1 = await obtenerJugadoresEquipo(torneoId, equipo1Id);
        const jugadores2 = equipo2 && !esBye ? await obtenerJugadoresEquipo(torneoId, equipo2Id) : [];
        
        console.log(`   📋 Jugadores Equipo 1:`, jugadores1);
        console.log(`   📋 Jugadores Equipo 2:`, jugadores2);
        
        // Agrupar jugadores por época
        const epocasEquipo1 = {};
        const epocasEquipo2 = {};
        
        jugadores1.forEach(j => {
            const epoca = j.epoca || 'Sin época';
            if (!epocasEquipo1[epoca]) {
                epocasEquipo1[epoca] = [];
            }
            epocasEquipo1[epoca].push(j);
        });
        
        jugadores2.forEach(j => {
            const epoca = j.epoca || 'Sin época';
            if (!epocasEquipo2[epoca]) {
                epocasEquipo2[epoca] = [];
            }
            epocasEquipo2[epoca].push(j);
        });
        
        console.log(`   📅 Épocas Equipo 1:`, Object.keys(epocasEquipo1));
        console.log(`   📅 Épocas Equipo 2:`, Object.keys(epocasEquipo2));
        
        // Crear partidas individuales por época
        const todasLasEpocas = new Set([
            ...Object.keys(epocasEquipo1),
            ...Object.keys(epocasEquipo2)
        ]);
        
        const partidasPorEpoca = [];
        
        todasLasEpocas.forEach(epoca => {
            const jug1Epoca = epocasEquipo1[epoca] || [];
            const jug2Epoca = epocasEquipo2[epoca] || [];
            
            const maxPartidas = Math.max(jug1Epoca.length, jug2Epoca.length);
            
            console.log(`   🎯 Época "${epoca}": ${jug1Epoca.length} vs ${jug2Epoca.length} jugadores`);
            
            for (let i = 0; i < maxPartidas; i++) {
                const j1 = jug1Epoca[i];
                const j2 = jug2Epoca[i];
                
                if (j1 || j2) {
                    partidasPorEpoca.push({
                        epoca: epoca === 'Sin época' ? null : epoca,
                        jugador1_id: j1 ? (j1.jugador_id || j1.id) : null,
                        jugador2_id: j2 ? (j2.jugador_id || j2.id) : null,
                        jugador1_nombre: j1 ? (j1.nombre || j1.jugador_nombre) : null,
                        jugador2_nombre: j2 ? (j2.nombre || j2.jugador_nombre) : null,
                        jugador1: j1,
                        jugador2: j2,
                        es_bye: !j2
                    });
                }
            }
        });
        
        console.log(`   ✅ ${partidasPorEpoca.length} partidas individuales generadas`);
        
        return {
            equipo1_id: equipo1Id,
            equipo2_id: equipo2Id,
            equipo1_nombre: equipo1.nombre_equipo || equipo1.nombre,
            equipo2_nombre: equipo2 ? (equipo2.nombre_equipo || equipo2.nombre) : null,
            equipo1: equipo1,
            equipo2: equipo2,
            es_bye: esBye,
            jugadores_equipo1: jugadores1,
            jugadores_equipo2: jugadores2,
            epocas_equipo1: epocasEquipo1,
            epocas_equipo2: epocasEquipo2,
            partidas: partidasPorEpoca // Array de partidas individuales por época
        };
        
    } catch (error) {
        console.error('❌ Error al crear enfrentamiento completo:', error);
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

        if (equipos.length < 2) {
            throw new Error('Se necesitan al menos 2 equipos para generar emparejamientos');
        }

        // 🎲 Aleatorizar equipos
        const equiposAleatorios = [...equipos].sort(() => Math.random() - 0.5);
        console.log('🔀 Equipos aleatorizados:', equiposAleatorios.map(e => e.nombre_equipo || e.equipo_id));
        
        const emparejamientos = [];
        let equipoBye = null;

        // 🎯 Detectar BYE si hay número impar
        if (equiposAleatorios.length % 2 !== 0) {
            equipoBye = equiposAleatorios.pop();
            console.log(`⭐ BYE detectado para: ${equipoBye.nombre_equipo} (ID: ${equipoBye.id || equipoBye.equipo_id})`);
        }

        console.log(`⚔️ Equipos a emparejar: ${equiposAleatorios.length}`);

        // ⚔️ Emparejar equipos normales CON JUGADORES
        for (let i = 0; i < equiposAleatorios.length; i += 2) {
            const eq1 = equiposAleatorios[i];
            const eq2 = equiposAleatorios[i + 1];
            
            console.log(`   Emparejando: ${eq1?.nombre_equipo} vs ${eq2?.nombre_equipo}`);
            
            const enfrentamiento = await crearEnfrentamientoCompleto(torneoId, eq1, eq2, false);
            emparejamientos.push(enfrentamiento);
        }

        // ✅ Añadir BYE al final CON JUGADORES
        if (equipoBye) {
            const enfrentamientoBye = await crearEnfrentamientoCompleto(torneoId, equipoBye, null, true);
            emparejamientos.push(enfrentamientoBye);
            console.log(`✅ BYE asignado al final a: ${equipoBye.nombre_equipo}`);
        }

        console.log('🏁 Emparejamientos finales con jugadores:', emparejamientos);
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
            
            const enfrentamientoBye = await crearEnfrentamientoCompleto(
                torneoId,
                equipoBye,
                null,
                true
            );
            
            emparejamientos.push(enfrentamientoBye);
            emparejados.add(equipoBye.equipo_id);
            console.log(`✅ BYE asignado a: ${equipoBye.nombre_equipo}`);
        }

        // 🎯 PASO 2: Emparejar el resto de equipos CON JUGADORES
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
                const enfrentamiento = await crearEnfrentamientoCompleto(
                    torneoId,
                    equipo1,
                    equipo2,
                    false
                );
                
                emparejamientos.push(enfrentamiento);
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
// FUNCIONES AUXILIARES (sin cambios)
// ==========================================

const obtenerHistorialEquipos = async (torneoId) => {
    const historialEnfrentamientos = new Set();
    const equiposConBye = new Set();

    try {
        const historial = await torneosSagaApi.obtenerPartidasTorneo(torneoId);
        const partidas = Array.isArray(historial) ? historial : [];

        for (const partida of partidas) {
            const eq1 = partida.equipo1_id;
            const eq2 = partida.equipo2_id;
            
            if (eq1 && eq2) {
                historialEnfrentamientos.add(`${eq1}-${eq2}`);
                historialEnfrentamientos.add(`${eq2}-${eq1}`);
            }
            
            if (!eq2 || partida.es_bye === 1) {
                equiposConBye.add(eq1);
            }
        }
    } catch (error) {
        console.warn('⚠️ No se pudo obtener historial de equipos:', error.message);
    }

    return { historialEnfrentamientos, equiposConBye };
};

const ordenarEquipos = (clasificacion) => {
    return [...clasificacion].sort((a, b) => {
        const puntosVictoriaA = a.puntos_victoria_eq_totales || a.puntos_victoria_totales || 0;
        const puntosVictoriaB = b.puntos_victoria_eq_totales || b.puntos_victoria_totales || 0;
        
        if (puntosVictoriaB !== puntosVictoriaA) {
            return puntosVictoriaB - puntosVictoriaA;
        }

        const puntosTorneoA = a.puntos_torneo_eq_totales || a.puntos_partida_totales || 0;
        const puntosTorneoB = b.puntos_torneo_eq_totales || b.puntos_partida_totales || 0;
        
        if (puntosTorneoB !== puntosTorneoA) {
            return puntosTorneoB - puntosTorneoA;
        }

        const puntosMasacreA = a.puntos_masacre_eq_totales || a.puntos_masacre_totales || 0;
        const puntosMasacreB = b.puntos_masacre_eq_totales || b.puntos_masacre_totales || 0;
        
        return puntosMasacreB - puntosMasacreA;
    });
};

const seleccionarEquipoParaBye = (equiposOrdenados, equiposConBye) => {
    const equiposSinBye = equiposOrdenados.filter(eq => 
        !equiposConBye.has(eq.equipo_id)
    );

    if (equiposSinBye.length > 0) {
        const porMenosPuntos = [...equiposSinBye].sort((a, b) => {
            const puntosA = (a.puntos_victoria_eq_totales || 0) + (a.puntos_torneo_eq_totales || 0);
            const puntosB = (b.puntos_victoria_eq_totales || 0) + (b.puntos_torneo_eq_totales || 0);
            return puntosA - puntosB;
        });
        return porMenosPuntos[0];
    } else {
        console.warn('⚠️ TODOS los equipos ya tuvieron BYE. Asignando segundo BYE.');
        const porMenosPuntos = [...equiposOrdenados].sort((a, b) => {
            const puntosA = (a.puntos_victoria_eq_totales || 0) + (a.puntos_torneo_eq_totales || 0);
            const puntosB = (b.puntos_victoria_eq_totales || 0) + (b.puntos_torneo_eq_totales || 0);
            return puntosA - puntosB;
        });
        return porMenosPuntos[0];
    }
};

const buscarRivalOptimoEquipo = (equipo1, equiposOrdenados, emparejados, historialEnfrentamientos, indiceActual) => {
    const puedenEnfrentarse = (eq1, eq2) => {
        const key = `${eq1.equipo_id}-${eq2.equipo_id}`;
        return !historialEnfrentamientos.has(key);
    };

    let mejorRival = null;
    const equiposSinEmparejar = equiposOrdenados.filter(eq => 
        !emparejados.has(eq.equipo_id)
    );

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