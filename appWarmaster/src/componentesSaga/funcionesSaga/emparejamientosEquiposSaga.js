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
        
        const equipo1Id = equipo1.id || equipo1.equipo_id;
        const equipo2Id = equipo2 ? (equipo2.id || equipo2.equipo_id) : null;
        
        const jugadores1 = await obtenerJugadoresEquipo(torneoId, equipo1Id);
        const jugadores2 = equipo2 && !esBye ? await obtenerJugadoresEquipo(torneoId, equipo2Id) : [];
        
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
        
        const todasLasEpocas = new Set([
            ...Object.keys(epocasEquipo1),
            ...Object.keys(epocasEquipo2)
        ]);
        
        const partidasPorEpoca = [];
        
        todasLasEpocas.forEach(epoca => {
            const jug1Epoca = epocasEquipo1[epoca] || [];
            const jug2Epoca = epocasEquipo2[epoca] || [];
            
            const maxPartidas = Math.max(jug1Epoca.length, jug2Epoca.length);
            
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
            partidas: partidasPorEpoca
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
        const response = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
        const equipos = Array.isArray(response) ? response : response.data || [];

        if (equipos.length < 2) {
            throw new Error('Se necesitan al menos 2 equipos para generar emparejamientos');
        }

        const equiposAleatorios = [...equipos].sort(() => Math.random() - 0.5);
        const emparejamientos = [];
        let equipoBye = null;

        if (equiposAleatorios.length % 2 !== 0) {
            equipoBye = equiposAleatorios.pop();
        }

        for (let i = 0; i < equiposAleatorios.length; i += 2) {
            const eq1 = equiposAleatorios[i];
            const eq2 = equiposAleatorios[i + 1];
            
            const enfrentamiento = await crearEnfrentamientoCompleto(torneoId, eq1, eq2, false);
            emparejamientos.push(enfrentamiento);
        }

        if (equipoBye) {
            const enfrentamientoBye = await crearEnfrentamientoCompleto(torneoId, equipoBye, null, true);
            emparejamientos.push(enfrentamientoBye);
        }
 
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

        const responseClasificacion = await torneosSagaApi.obtenerClasificacionEquipos(torneoId);
        const clasificacion = responseClasificacion?.data || responseClasificacion || [];

        if (!Array.isArray(clasificacion) || clasificacion.length < 2) {
            throw new Error("Se necesitan al menos 2 equipos en la clasificación");
        }

        console.log(`📊 ${clasificacion.length} equipos en clasificación`);

        const { historialEnfrentamientos, equiposConBye } = await obtenerHistorialEquipos(torneoId);
        console.log(`📜 ${historialEnfrentamientos.size} enfrentamientos previos registrados`);
        console.log(`⭐ ${equiposConBye.size} equipos con BYE previo`);

        const equiposOrdenados = ordenarEquipos(clasificacion);
        console.log('📋 Clasificación ordenada:', equiposOrdenados.map((e, i) => `${i+1}º ${e.nombre_equipo} (ID: ${e.equipo_id})`));

        const emparejamientos = [];
        let equiposDisponibles = [...equiposOrdenados];

        // 🎯 PASO 1: BYE PRIMERO si hay número impar
        if (equiposDisponibles.length % 2 !== 0) {
            const equipoBye = seleccionarEquipoParaBye(equiposDisponibles, equiposConBye);
            
            const enfrentamientoBye = await crearEnfrentamientoCompleto(
                torneoId,
                equipoBye,
                null,
                true
            );
            
            emparejamientos.push(enfrentamientoBye);
            equiposDisponibles = equiposDisponibles.filter(eq => eq.equipo_id !== equipoBye.equipo_id);
            
            console.log(`✅ BYE asignado a: ${equipoBye.nombre_equipo}`);
            console.log(`📋 Equipos restantes: ${equiposDisponibles.map(e => `${e.nombre_equipo} (ID: ${e.equipo_id})`).join(', ')}`);
        }

        // 🎯 PASO 2: Emparejar de arriba hacia abajo, resolviendo rematches
        const emparejamientosFinales = await emparejarSuizoConReajuste(
            torneoId,
            equiposDisponibles,
            historialEnfrentamientos
        );

        emparejamientos.push(...emparejamientosFinales);

        console.log(`✅ ${emparejamientos.length} emparejamientos suizos de equipos generados`);
        return emparejamientos;

    } catch (error) {
        console.error('❌ Error en sistema suizo de equipos:', error);
        throw error;
    }
};

// ==========================================
// EMPAREJAMIENTO SUIZO CON REAJUSTE DE REMATCHES
// ==========================================

const emparejarSuizoConReajuste = async (torneoId, equiposDisponibles, historialEnfrentamientos) => {
    const n = equiposDisponibles.length;
    
    if (n % 2 !== 0) {
        throw new Error('Error: número impar de equipos después de asignar BYE');
    }

    console.log('\n🔄 Iniciando emparejamiento suizo con reajuste...');
    
    const yaEnfrentados = (eq1, eq2) => {
        const key = `${eq1.equipo_id}-${eq2.equipo_id}`;
        return historialEnfrentamientos.has(key);
    };

    // Intentar emparejamiento directo (1º vs 2º, 3º vs 4º, etc.)
    let hayRematches = false;
    
    for (let i = 0; i < n; i += 2) {
        const eq1 = equiposDisponibles[i];
        const eq2 = equiposDisponibles[i + 1];
        
        if (yaEnfrentados(eq1, eq2)) {
            console.warn(`⚠️ REMATCH detectado en emparejamiento base: ${eq1.nombre_equipo} vs ${eq2.nombre_equipo}`);
            hayRematches = true;
            break;
        }
    }

    // Si no hay rematches en emparejamiento directo, usar ese
    if (!hayRematches) {
        console.log('✅ No hay rematches, usando emparejamiento directo');
        const emparejamientosBase = [];
        
        for (let i = 0; i < n; i += 2) {
            emparejamientosBase.push({ 
                eq1: equiposDisponibles[i], 
                eq2: equiposDisponibles[i + 1] 
            });
        }
        
        return await crearEnfrentamientosDesdeArray(torneoId, emparejamientosBase);
    }

    // Si hay rematches, intentar reajustar
    console.log('🔧 Reajustando emparejamientos para evitar rematches...');
    
    const emparejamientosReajustados = reajustarEmparejamientos(
        equiposDisponibles,
        historialEnfrentamientos
    );

    if (emparejamientosReajustados) {
        console.log('✅ Reajuste exitoso, sin rematches');
        return await crearEnfrentamientosDesdeArray(torneoId, emparejamientosReajustados);
    } else {
        // Si no se puede evitar, forzar rematches
        console.warn('⚠️ IMPOSIBLE evitar rematches, generando con rematches forzados');
        const emparejamientosBase = [];
        
        for (let i = 0; i < n; i += 2) {
            emparejamientosBase.push({ 
                eq1: equiposDisponibles[i], 
                eq2: equiposDisponibles[i + 1] 
            });
        }
        
        return await crearEnfrentamientosDesdeArray(torneoId, emparejamientosBase);
    }
};

// ==========================================
// REAJUSTAR EMPAREJAMIENTOS PARA EVITAR REMATCHES
// ==========================================

const reajustarEmparejamientos = (equipos, historialEnfrentamientos) => {
    const n = equipos.length;
   
    const yaEnfrentados = (eq1, eq2) => {
        const key = `${eq1.equipo_id}-${eq2.equipo_id}`;
        return historialEnfrentamientos.has(key);
    };

    // Función recursiva con backtracking
    const intentarEmparejamiento = (indice, usado, emparejamientos) => {
        // Caso base: todos emparejados
        if (indice >= n) {
            return emparejamientos.length === n / 2 ? emparejamientos : null;
        }

        // Si este índice ya fue usado, saltar
        if (usado.has(indice)) {
            return intentarEmparejamiento(indice + 1, usado, emparejamientos);
        }

        const eq1 = equipos[indice];
        // Probar con cada posible rival
        for (let j = indice + 1; j < n; j++) {
            if (usado.has(j)) continue;

            const eq2 = equipos[j];
   
            // Si pueden enfrentarse (no han jugado antes)
            if (!yaEnfrentados(eq1, eq2)) {
   
                // Marcar como usados
                const nuevoUsado = new Set(usado);
                nuevoUsado.add(indice);
                nuevoUsado.add(j);

                // Añadir emparejamiento
                const nuevosEmparejamientos = [...emparejamientos, { eq1, eq2 }];

                // Intentar completar el resto recursivamente
                const resultado = intentarEmparejamiento(indice + 1, nuevoUsado, nuevosEmparejamientos);

                if (resultado !== null) {
                 return resultado;
                }

            } else {
                console.log(`      ⏭️ Ya jugaron antes, saltando`);
            }
        }
        // Si llegamos aquí, no se encontró combinación válida desde este punto
        return null;
    };

    // Iniciar backtracking
    const resultado = intentarEmparejamiento(0, new Set(), []);

    if (resultado) {
        resultado.forEach((par, idx) => {
            console.log(`   ${idx + 1}. ${par.eq1.nombre_equipo} vs ${par.eq2.nombre_equipo}`);
        });
        return resultado;
    } else {
        console.log('\n❌ NO SE ENCONTRÓ SOLUCIÓN SIN REMATCHES');
        return null;
    }
};

// ==========================================
// CREAR ENFRENTAMIENTOS DESDE ARRAY DE PARES
// ==========================================

const crearEnfrentamientosDesdeArray = async (torneoId, emparejamientos) => {
    const enfrentamientos = [];
    
    for (const par of emparejamientos) {
        const enfrentamiento = await crearEnfrentamientoCompleto(
            torneoId,
            par.eq1,
            par.eq2,
            false
        );
        enfrentamientos.push(enfrentamiento);
        console.log(`⚔️ Creado: ${par.eq1.nombre_equipo} vs ${par.eq2.nombre_equipo}`);
    }
    
    return enfrentamientos;
};

// ==========================================
// OBTENER HISTORIAL DE ENFRENTAMIENTOS Y BYES
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

// ==========================================
// ORDENAR EQUIPOS POR PUNTUACIÓN
// ==========================================

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

// ==========================================
// SELECCIONAR EQUIPO PARA BYE
// ==========================================

const seleccionarEquipoParaBye = (equiposOrdenados, equiposConBye) => {
    const equiposSinBye = equiposOrdenados.filter(eq => 
        !equiposConBye.has(eq.equipo_id)
    );

    if (equiposSinBye.length > 0) {
        const equipoSeleccionado = equiposSinBye[equiposSinBye.length - 1];
        console.log(`✅ BYE asignado al último sin BYE previo: ${equipoSeleccionado.nombre_equipo}`);
        return equipoSeleccionado;
    } else {
        console.warn('⚠️ TODOS los equipos ya tuvieron BYE. Asignando segundo BYE al último clasificado.');
        const equipoSeleccionado = equiposOrdenados[equiposOrdenados.length - 1];
        console.log(`✅ Segundo BYE asignado a: ${equipoSeleccionado.nombre_equipo}`);
        return equipoSeleccionado;
    }
};