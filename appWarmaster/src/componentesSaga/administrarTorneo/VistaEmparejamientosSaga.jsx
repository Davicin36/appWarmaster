import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '@/servicios/apiSaga';
import usuarioApi from '@/servicios/apiUsuarios';
import { generarEmparejamientos } from '../funcionesSaga/seleccionEmparejamientos';

import ModalRegistroPartida from '../ModalRegistroPartidaSaga';
import ModalEdicionEmparejamientos from '@/componente/ModalEdicionEmparejamientos';

import '@/estilos/vistasTorneos/vistaEmparejamientos.css';

function VistaEmparejamientosSaga({ torneoId: propTorneoId, esVistaPublica = false }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [emparejamientos, setEmparejamientos] = useState([]);
    const [partidasGuardadas, setPartidasGuardadas] = useState([]);
    const [todasLasPartidas, setTodasLasPartidas] = useState([]);
    const [rondasExpandidas, setRondasExpandidas] = useState({});
    
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [cargandoPartidas, setCargandoPartidas] = useState(false);
    const [error, setError] = useState(null);
    
    const [modalAbierto, setModalAbierto] = useState(false);
    const [partidaSeleccionada, setPartidaSeleccionada] = useState(null);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [esOrganizador, setEsOrganizador] = useState(false);
    const [esParticipante, setEsParticipante] = useState(false);
    const [mostrarSelectorEscenarios, setMostrarSelectorEscenarios] = useState(false);
    const [asignacionesEscenarios, setAsignacionesEscenarios] = useState({});

    const [modoEdicion, setModoEdicion] = useState(false);
    const [emparejamientoEditando, setEmparejamientoEditando] = useState(null);
    const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);

    const esTorneoEquipos = () => torneo?.tipo_torneo === 'Por equipos';

    //VERIFICAMOS EL TOKEN DEL JUGADOR
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUsuarioActual({
                    id: payload.userId,
                    nombre: payload.nombre
                });
            } catch (error) {
                console.error('Error al decodificar token:', error);
            }
        }
    }, []);

    //CARGAR SI ES EL ORGANIZADOR
useEffect(() => {
    const verificarOrganizador = async () => {

        if (torneoId && usuarioActual?.id) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setEsOrganizador(false);
                    return;
                }

                const response = await usuarioApi.verificarOrganizador(torneoId);           
                const esOrg = response.data?.esOrganizador || response.esOrganizador || false;
                
                setEsOrganizador(esOrg);
           
            } catch (error) {
                console.error('❌ Error al verificar organizador:', error);
                console.error('Error completo:', error.response?.data || error.message);
                setEsOrganizador(false);
            }
        } 
    };
    try {
        verificarOrganizador();
    } catch (error) {
        console.error('💥 Error fatal en useEffect verificarOrganizador:', error);
    }
}, [torneoId, usuarioActual]);


    //CARGAR LOS DATOS DEL TORNEO
    useEffect(() => {
        if (torneoId) {
            cargarDatos();
        }
    }, [torneoId]);

    //VER SI ES PARTICIPANTE O NO DEL TORNEO
    useEffect(() => {
        if(usuarioActual && (jugadores.length > 0 || equipos.length > 0)) {
            setEsParticipante(verificarEsParticipante());
        }
    }, [usuarioActual, jugadores, equipos, torneo]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const responseTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);
            
            // Cargar jugadores o equipos según el tipo de torneo
            if (dataTorneo.tipo_torneo === 'Por equipos') {
                try {
                    const responseEquipos = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                    const dataEquipos = responseEquipos.data || responseEquipos || [];
                    setEquipos(Array.isArray(dataEquipos) ? dataEquipos : []);
                } catch (err) {
                    console.error('No hay equipos todavía', err);
                    setEquipos([]);
                }
            } else {
                try {
                    const responseJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                    const dataJugadores = responseJugadores.data || responseJugadores || [];
                    setJugadores(Array.isArray(dataJugadores) ? dataJugadores : []);
                } catch (err) {
                    console.error('No hay jugadores todavía', err);
                    setJugadores([]);
                }
            }
            
            await cargarTodasLasPartidas(dataTorneo.id);
            
            if (dataTorneo.ronda_actual) {
                await cargarPartidasRonda(dataTorneo.id, dataTorneo.ronda_actual);
            }
            
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('No se pudieron cargar los datos del torneo');
        } finally {
            setLoading(false);
        }
    };

    const verificarEsParticipante = () => {
    
    if (!usuarioActual?.id) {
        return false;
    }

    if (esTorneoEquipos()) {
        const resultado = equipos.some(equipo => {

            const encontrado = equipo.jugadores?.some(j => {
                return j.jugador_id === usuarioActual.id;
            });
            return encontrado;
        });
        return resultado;
    } else {
        const resultado = jugadores.some(j => {
            return j.jugador_id === usuarioActual.id || j.id === usuarioActual.id;
        });
        return resultado;
    }
};

    const puedeVerPartidas = () => {
        // El organizador siempre puede ver
        if (esOrganizador) return true;
        
        // Si el torneo está finalizado, TODOS pueden ver
        if (torneo?.estado === 'finalizado') return true;
        
        // Si el torneo está en curso, TODOS pueden ver
        if (torneo?.estado === 'en_curso') return true;
        
        // Si está pendiente, solo el organizador puede ver
        return false;
    };

   const cargarTodasLasPartidas = async (tId = torneoId) => { 
    try {
        let allPartidas = [];
        
        // 🎯 Obtener el número máximo de rondas
        const rondasMax = torneo?.rondas_max || 5;
        
        // 🔄 Cargar RONDA POR RONDA (igual que la ronda actual)
        for (let r = 1; r <= rondasMax; r++) {
            try {
                let roundResponse;
                
                // 🎯 Usar EXACTAMENTE los mismos endpoints que cargarPartidasRonda()
                if (esOrganizador) {
                    if (esTorneoEquipos()) {
                        roundResponse = await torneosSagaApi.obtenerEmparejamientosEquipos(tId, r);
                    } else {
                        roundResponse = await torneosSagaApi.obtenerEmparejamientosIndividuales(tId, r);
                    }
                } else {
                    // 👁️ PARA VISITANTES: usar endpoints públicos
                    if (esTorneoEquipos()) {
                        roundResponse = await torneosSagaApi.obtenerEmparejamientosEquiposPublico(tId, r);
                    } else {
                        roundResponse = await torneosSagaApi.obtenerEmparejamientosIndividualesPublico(tId, r);
                    }
                }
                
                const roundPartidas = roundResponse?.data || roundResponse || [];
                if (Array.isArray(roundPartidas) && roundPartidas.length > 0) {
                    allPartidas.push(...roundPartidas);
                }
            } catch (err) {
                console.error(`⚠️ Ronda ${r}: error al cargar -`, err.message);
            }
        }
    
        setTodasLasPartidas(allPartidas);
        
    } catch (err) {
        console.error('❌ Error al cargar todas las partidas:', err);
        setTodasLasPartidas([]);
    }
};

    const cargarPartidasRonda = async (tId = torneoId, ronda = torneo?.ronda_actual) => {
        try {
            setCargandoPartidas(true);
            
            try {
                let response;
                
                // 🎯 SI ES ORGANIZADOR: usar endpoints protegidos
                if (esOrganizador) {
                    if (esTorneoEquipos()) {
                        response = await torneosSagaApi.obtenerEmparejamientosEquipos(tId, ronda);
                    } else {
                        response = await torneosSagaApi.obtenerEmparejamientosIndividuales(tId, ronda);
                    }
                } else {
                    // 👁️ PARA VISITANTES Y PARTICIPANTES: usar endpoints públicos
                    if (esTorneoEquipos()) {
                        response = await torneosSagaApi.obtenerEmparejamientosEquiposPublico(tId, ronda);
                    } else {
                        response = await torneosSagaApi.obtenerEmparejamientosIndividualesPublico(tId, ronda);
                    }
                }

                const partidas = response?.data || response || [];
                const partidasArray = Array.isArray(partidas) ? partidas : [];
                setPartidasGuardadas(partidasArray);
                
            } catch (err) {
                console.warn('No se pudieron cargar emparejamientos:', err.message);
                setPartidasGuardadas([]);
            }
            
        } catch (err) {
            console.error('Error al cargar partidas:', err);
            setPartidasGuardadas([]);
        } finally {
            setCargandoPartidas(false);
        }
    };

    const partidasPorRonda = () => {
        const grupos = {};
        todasLasPartidas.forEach(partida => {
            if (!grupos[partida.ronda]) {
                grupos[partida.ronda] = [];
            }
            grupos[partida.ronda].push(partida);
        });
        return grupos;
    };

    const toggleRonda = (ronda) => {
        setRondasExpandidas(prev => ({
            ...prev,
            [ronda]: !prev[ronda]
        }));
    };

    const handleGenerarEmparejamientos = async () => {
        try {
            if (!torneoId) {
                alert('⚠️ Error: No se encontró el ID del torneo');
                return;
            }

            const esEquipos = esTorneoEquipos();
            const minParticipantes = esEquipos ? equipos.length : jugadores.length;

            // Validar participantes mínimos
            if (minParticipantes < 2) {
                alert(`⚠️ Se necesitan al menos 2 ${esEquipos ? 'equipos' : 'jugadores'} para generar emparejamientos`);
                return;
            }

            // Preparar participantes SOLO para torneos individuales
            let participantes = [];
            
            if (!esEquipos) {
                const responseClasificacion = await torneosSagaApi.obtenerClasificacionIndividual(torneoId);
                const clasificacion = responseClasificacion.data || responseClasificacion || [];
        
                participantes = jugadores.map(j => {
                    const stats = clasificacion.find(c => c.jugador_id === j.jugador_id || c.jugador_id === j.id);

    
                    return {
                        ...j,
                        puntos_torneo: stats?.puntos_torneo || 0,
                        puntos_victoria: stats?.puntos_victoria || 0,
                        puntos_masacre: stats?.puntos_masacre || 0,
                        partidas_jugadas: stats?.partidas_jugadas || 0
                    };
                });

            }

            // 🎯 LLAMADA UNIFICADA
            const nuevosEmparejamientos = await generarEmparejamientos(
                torneoId,
                torneo.ronda_actual || 1,
                esEquipos ? 'Por equipos' : 'individual',
                participantes
            );

            setEmparejamientos(Array.isArray(nuevosEmparejamientos) ? nuevosEmparejamientos : []);
            alert(`✅ ${nuevosEmparejamientos.length} emparejamientos generados correctamente`);
            
        } catch (error) {
            console.error('❌ Error al generar emparejamientos:', error);
            alert(`Error al generar emparejamientos: ${error.message}`);
            setEmparejamientos([]);
        }
    };

    const obtenerEpocasDisponibles = () => {
    const epocas = new Set();
    
    if (esTorneoEquipos()) {
        equipos.forEach(equipo => {
            equipo.jugadores?.forEach(jugador => {
                if (jugador.epoca) {
                    epocas.add(jugador.epoca);
                }
            });
        });
    }
    
    return Array.from(epocas).sort();
};

   const guardarResultados = async () => {
        try {
            setGuardando(true);
            setError(null);

            if (!emparejamientos || emparejamientos.length === 0) {
                alert('⚠️ Primero debes generar los emparejamientos');
                return;
            }

            if (esTorneoEquipos()) {
                const epocas = obtenerEpocasDisponibles();
                
                if (epocas.length > 0 && Object.keys(asignacionesEscenarios).length === 0) {
                    setMostrarSelectorEscenarios(true);
                    setGuardando(false);
                    return; // Esperar a que asigne los escenarios
                }
            }

            let nombreEscenario;
            
            if (torneo.tipo_torneo === 'Por equipos') {
                const rondas = [
                    torneo.partida_ronda_1,
                    torneo.partida_ronda_2,
                    torneo.partida_ronda_3,
                    torneo.partida_ronda_4,
                    torneo.partida_ronda_5
                ].filter(Boolean);
                
                nombreEscenario = rondas.length > 0 
                    ? rondas.join(' / ') 
                    : 'Escenarios por definir';
           } else {
            nombreEscenario = torneo[`partida_ronda_${torneo.ronda_actual}`];
            
                if (!nombreEscenario) {
                    alert(`⚠️ No se encontró el escenario configurado para la Ronda ${torneo.ronda_actual}`);
                    return;
                }
            }

            const confirmar = window.confirm(
                `¿Guardar ${emparejamientos.length} emparejamientos para la Ronda ${torneo.ronda_actual}?`
            );
            
            if (!confirmar) {
                setGuardando(false);
                return;
            }

            const todasLasPartidas = [];
            let mesaCounter = 1;
            const esEquipos = esTorneoEquipos();
            
            emparejamientos.forEach((emp) => {
                if (emp.partidas && Array.isArray(emp.partidas)) {
                    emp.partidas.forEach((partida) => {
                        const escenarioAsignado = esEquipos && partida.epoca 
                        ? asignacionesEscenarios[partida.epoca] 
                        : nombreEscenario;

                        todasLasPartidas.push({
                            mesa: mesaCounter++,
                            jugador1_id: partida.jugador1_id,
                            jugador2_id: partida.jugador2_id,
                            equipo1_id: emp.equipo1_id,
                            equipo2_id: emp.equipo2_id,
                            epoca: partida.epoca || null,
                            es_bye: partida.es_bye || 0,
                            nombre_partida: escenarioAsignado,
                            ronda: torneo.ronda_actual,
                        });
                    });
                } else {
                    todasLasPartidas.push({
                        mesa: mesaCounter++,
                        jugador1_id: emp.jugador1_id,
                        jugador2_id: emp.jugador2_id,
                        equipo1_id: null,
                        equipo2_id: null,
                        epoca: emp.epoca || null,
                        es_bye: emp.es_bye || 0,
                        nombre_partida: nombreEscenario,
                        ronda: torneo.ronda_actual,
                    });
                }
            })

            const errores = [];
            todasLasPartidas.forEach((partida, index) => {
                if(!partida.jugador1_id) {
                    errores.push(`Mesa ${partida.mesa}: jugador 1 sin ID (partida ${index+1})`);
                }
            });

            if (errores.length > 0){
                console.error('Errores de validación: ', errores);
                console.error('Partidas con error: ', todasLasPartidas);
                alert('Error: Faltan IDs: \n' + errores.join('\n'));
                return;
            }

            // 🎯 Usar el endpoint correcto según el tipo de torneo
            if (esEquipos) {
                await torneosSagaApi.guardarEmparejamientosEquipos(
                    torneo.id,
                    todasLasPartidas,
                    torneo.ronda_actual
                );
            } else {
                await torneosSagaApi.guardarEmparejamientosIndividuales(
                    torneo.id,
                    todasLasPartidas,
                    torneo.ronda_actual
                );
            }

            alert(`✅ ${emparejamientos.length} partidas creadas para la Ronda ${torneo.ronda_actual}\nEscenario: ${nombreEscenario}`);

            setEmparejamientos([]);
            setAsignacionesEscenarios({}); // Limpiar asignaciones
            setMostrarSelectorEscenarios(false);

            await cargarPartidasRonda();
            await cargarTodasLasPartidas();
        
        } catch (err) {
            console.error('❌ Error completo al guardar:', err);
            setError(err.message || 'No se pudieron guardar los emparejamientos');
            alert(`❌ Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    }; 

    const generarSiguienteRonda = async () => {
        try {
            if (!todasLasPartidasCompletas()) {
                alert('⚠️ Debes completar todas las partidas de la ronda actual antes de generar la siguiente ronda');
                return;
            }

            if (torneo.ronda_actual >= torneo.rondas_max) {
                alert('⚠️ Ya se han jugado todas las rondas del torneo');
                return;
            }

            const confirmar = window.confirm(
                `¿Generar emparejamientos para la Ronda ${torneo.ronda_actual + 1}?\n\n` +
                `Se calcularán los emparejamientos basados en los resultados actuales.`
            );

            if (!confirmar) return;

            await torneosSagaApi.actualizarTorneo(torneo.id, {
                ronda_actual: torneo.ronda_actual + 1
            });

            await cargarDatos();

        } catch (err) {
            console.error('Error:', err);
            alert(`❌ Error al generar siguiente ronda: ${err.message}`);
        }
    };

    const todasLasPartidasCompletas = () => {
        if (partidasGuardadas.length === 0) return false;
        
        return partidasGuardadas.every(partida => 
            partida.resultado_ps && 
            partida.resultado_ps !== 'pendiente' &&
            partida.resultado_ps !== null
        );
    };

    const puedeEditarEstaPartida = (partida) => {
        // Si no está en curso, nadie puede editar
        if (torneo?.estado !== 'en_curso') return false;
        
        // Si la partida está confirmada, solo el organizador puede desconfirmarla
        if (partida.resultado_confirmado && !esOrganizador) return false;
        
        // El organizador puede editar cualquier partida
        if (esOrganizador) return true;
        
        // Los participantes solo pueden editar sus propias partidas
        if (!esParticipante || !usuarioActual) return false;
        
        // 🎯 CORRECCIÓN: Verificar según tipo de torneo
        if (esTorneoEquipos()) {
            // Buscar equipo1
            const equipo1 = equipos.find(eq => 
                eq.id === partida.equipo1_id || eq.equipo_id === partida.equipo1_id
            ); 
            // Buscar equipo2
            const equipo2 = equipos.find(eq => 
                eq.id === partida.equipo2_id || eq.equipo_id === partida.equipo2_id
            );
            // Verificar si pertenece
            const perteneceEquipo1 = equipo1 && equipo1.jugadores?.some(j => {
                return j.jugador_id === usuarioActual.id;
            });
            
            const perteneceEquipo2 = equipo2 && equipo2.jugadores?.some(j => {
                return j.jugador_id === usuarioActual.id;
            });
            
            return perteneceEquipo1 || perteneceEquipo2;
        } else {
            // Para torneos individuales
            const jugador1 = jugadores.find(j => j.id === partida.jugador1_id);
            const jugador2 = jugadores.find(j => j.id === partida.jugador2_id);
            
            const esJugadorDeEstaPartida = 
                (jugador1 && jugador1.jugador_id === usuarioActual.id) ||
                (jugador2 && jugador2.jugador_id === usuarioActual.id);
            
            return esJugadorDeEstaPartida;
        }
    };

    const handleAsignarEscenario = (epoca, escenario) => {
        setAsignacionesEscenarios(prev => ({
            ...prev,
            [epoca]: escenario
        }));
    };

    const todasLasEpocasAsignadas = () => {
        const epocas = obtenerEpocasDisponibles();
        return epocas.every(epoca => asignacionesEscenarios[epoca]);
    };

    const confirmarAsignaciones = () => {
        if (!todasLasEpocasAsignadas()) {
            alert('⚠️ Debes asignar un escenario a todas las épocas');
            return;
        }
        setMostrarSelectorEscenarios(false);
        guardarResultados(); // Continuar con el guardado
    };

    /* 
    FUNCIONES PARA EL EDICION EMPAREJAMIENTOS
     Función para eliminar un emparejamiento
     */
    const eliminarEmparejamiento = (index) => {
        if (window.confirm('¿Eliminar este emparejamiento?')) {
            const nuevosEmp = [...emparejamientos];
            nuevosEmp.splice(index, 1);
            setEmparejamientos(nuevosEmp);
            alert('✅ Emparejamiento eliminado');
        }
    };

    // Abrir modal de edición
    const abrirEdicion = (emparejamiento, index) => {
        setEmparejamientoEditando({ ...emparejamiento, index });
        setModalEdicionAbierto(true);
    };

    // Guardar cambios de edición
    const guardarEdicion = (nuevosDatos) => {
        const nuevosEmp = [...emparejamientos];
        nuevosEmp[emparejamientoEditando.index] = {
            ...nuevosEmp[emparejamientoEditando.index],
            ...nuevosDatos
        };
        setEmparejamientos(nuevosEmp);
        setModalEdicionAbierto(false);
        setEmparejamientoEditando(null);
        alert('✅ Emparejamiento actualizado');
    };

   const compartirEmparejamientos = async () => {
        // 🎯 Determinar qué emparejamientos compartir
        const emparejamientosParaCompartir = partidasGuardadas.length > 0 
            ? partidasGuardadas 
            : emparejamientos;
        
        if (emparejamientosParaCompartir.length === 0) {
            alert('⚠️ No hay emparejamientos para compartir');
            return;
        }

        let texto = `🎮 EMPAREJAMIENTOS - RONDA ${torneo.ronda_actual}\n`;
        texto += `📅 Torneo: ${torneo.nombre_torneo}\n`;
        texto += `📍 Fecha: ${new Date().toLocaleDateString()}\n`;
        texto += `\n`;

        // 🎯 Si son partidas guardadas (con toda la info)
        if (partidasGuardadas.length > 0) {
            partidasGuardadas.forEach((partida, index) => {
                texto += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                texto += `🎲 MESA ${partida.mesa || index + 1}\n`;
                
                if (esTorneoEquipos()) {
                    texto += `🔵 ${partida.equipo1_nombre || 'Equipo 1'}\n`;
                    texto += `   👤 ${partida.jugador1_nombre || 'Jugador 1'}\n`;
                    if (partida.jugador1_faccion) {
                        texto += `   ⚔️ ${partida.jugador1_faccion}\n`;
                    }
                    texto += `\n         VS\n\n`;
                    
                    if (partida.es_bye || !partida.jugador2_nombre) {
                        texto += `🔴 BYE (Victoria automática)\n`;
                    } else {
                        texto += `🔴 ${partida.equipo2_nombre || 'Equipo 2'}\n`;
                        texto += `   👤 ${partida.jugador2_nombre || 'Jugador 2'}\n`;
                        if (partida.jugador2_faccion) {
                            texto += `   ⚔️ ${partida.jugador2_faccion}\n`;
                        }
                    }
                } else {
                    texto += `🔵 ${partida.jugador1_nombre || 'Jugador 1'}\n`;
                    if (partida.jugador1_faccion) {
                        texto += `   ⚔️ ${partida.jugador1_faccion}\n`;
                    }
                    texto += `\n         VS\n\n`;
                    
                    if (partida.es_bye || !partida.jugador2_nombre) {
                        texto += `🔴 BYE (Victoria automática)\n`;
                    } else {
                        texto += `🔴 ${partida.jugador2_nombre || 'Jugador 2'}\n`;
                        if (partida.jugador2_faccion) {
                            texto += `   ⚔️ ${partida.jugador2_faccion}\n`;
                        }
                    }
                }
                
                if (partida.nombre_partida) {
                    texto += `\n📋 Escenario: ${partida.nombre_partida}\n`;
                }
                if (partida.epoca) {
                    texto += `📅 Época: ${partida.epoca}\n`;
                }
                texto += `\n`;
            });
        } 
        // 🎯 Si son emparejamientos preview (antes de guardar)
        else {
            emparejamientos.forEach((emp, index) => {
                texto += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                texto += `🎲 MESA ${emp.mesa || index + 1}\n`;
                
                if (esTorneoEquipos()) {
                    texto += `🔵 ${emp.equipo1_nombre || 'Equipo 1'}\n`;
                    if (emp.partidas && emp.partidas.length > 0) {
                        emp.partidas.forEach(partida => {
                            texto += `   👤 ${partida.jugador1_nombre}\n`;
                            if (partida.epoca) texto += `   📅 ${partida.epoca}\n`;
                        });
                    }
                    texto += `\n         VS\n\n`;
                    
                    if (emp.es_bye) {
                        texto += `🔴 BYE (Victoria automática)\n`;
                    } else {
                        texto += `🔴 ${emp.equipo2_nombre || 'Equipo 2'}\n`;
                        if (emp.partidas && emp.partidas.length > 0) {
                            emp.partidas.forEach(partida => {
                                if (partida.jugador2_nombre) {
                                    texto += `   👤 ${partida.jugador2_nombre}\n`;
                                }
                            });
                        }
                    }
                } else {
                    const jugador1Nombre = emp.jugador1?.nombre || emp.jugador1?.jugador_nombre;
                    const jugador2Nombre = emp.jugador2 ? (emp.jugador2?.nombre || emp.jugador2?.jugador_nombre) : null;
                    
                    texto += `🔵 ${jugador1Nombre || 'Jugador 1'}\n`;
                    texto += `\n         VS\n\n`;
                    
                    if (emp.es_bye) {
                        texto += `🔴 BYE (Victoria automática)\n`;
                    } else {
                        texto += `🔴 ${jugador2Nombre || 'Jugador 2'}\n`;
                    }
                }
                texto += `\n`;
            });
        }

        // 🔥 API Web Share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Emparejamientos - Ronda ${torneo.ronda_actual}`,
                    text: texto
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Usuario canceló compartir');
                }
            }
        } else {
            // ❌ Fallback para ordenadores
            try {
                await navigator.clipboard.writeText(texto);
                alert('✅ ¡Emparejamientos copiados al portapapeles!\n\nPega el texto en WhatsApp, Telegram, etc.');
            } catch (err) {
                alert('❌ No se pudo copiar. Por favor, selecciona y copia manualmente.', err);
            }
        }
    };
// Función para verificar si la partida tiene datos introducidos
    const tieneDatos = (partida) => {
        // Verificar si hay un resultado registrado (no pendiente)
        if (partida.resultado_ps && partida.resultado_ps !== 'pendiente') {
            return true;
        }
        
        // Verificar si hay puntos mayores a 0
        const tienePuntos = 
            (partida.puntos_torneo_j1 && partida.puntos_torneo_j1 > 0) || 
            (partida.puntos_torneo_j2 && partida.puntos_torneo_j2 > 0) ||
            (partida.puntos_masacre_j1 && partida.puntos_masacre_j1 > 0) ||
            (partida.puntos_masacre_j2 && partida.puntos_masacre_j2 > 0) ||
            (partida.puntos_victoria_j1 && partida.puntos_victoria_j1 > 0) ||
            (partida.puntos_victoria_j2 && partida.puntos_victoria_j2 > 0);
        
        return tienePuntos;
    };

    const esBye = (partida) => {
        // ✅ Si la partida tiene datos introducidos, NO es BYE
        if (tieneDatos(partida)) {
            return false;
        }
        // Solo es BYE si no tiene jugador 2 Y tampoco tiene datos
        return !partida.jugador2_nombre || !partida.jugador2_id || partida.es_bye;
    };

    const abrirModalPartida = (partida) => {
        if (!puedeEditarEstaPartida(partida)) {
            alert('⚠️ El torneo debe estar "En Curso" para poder introducir resultados.\n\nCambia el estado del torneo primero.');
            return;
        }

        setPartidaSeleccionada(partida);
        setModalAbierto(true);
    };

    const confirmarPartida = async (partidaId, confirmar) => {
        try {
            // 🎯 Usar el endpoint correcto según tipo de torneo
            if (esTorneoEquipos()) {
                await torneosSagaApi.confirmarResultadoEquipo(torneo.id, partidaId, confirmar);
            } else {
                await torneosSagaApi.confirmarResultado(torneo.id, partidaId, confirmar);
            }
            
            alert(confirmar 
                ? '✅ Resultado confirmado. Los puntos se han sumado a las clasificaciones.' 
                : '⚠️ Resultado desconfirmado. Los puntos se han restado de las clasificaciones.'
            );
            
            await cargarPartidasRonda();
            await cargarTodasLasPartidas();
            
        } catch (error) {
            console.error('Error al confirmar resultado:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const agruparPartidasPorEquipos = (partidas) => {
        if (!esTorneoEquipos()) return partidas;

        const grupos = {};
        
        partidas.forEach(partida => {
            // Obtener IDs de equipos
            const eq1_id = partida.equipo1_id;
            const eq2_id = partida.equipo2_id;
            
            // Crear clave única para el enfrentamiento de equipos
            const equipoKey = eq2_id 
                ? `equipo_${eq1_id}_vs_${eq2_id}`
                : `equipo_${eq1_id}_bye`;
            
            if (!grupos[equipoKey]) {
                // Buscar nombres de equipos
                const equipo1Data = equipos.find(eq => eq.id === eq1_id || eq.equipo_id === eq1_id);
                const equipo2Data = eq2_id ? equipos.find(eq => eq.id === eq2_id || eq.equipo_id === eq2_id) : null;
                
                grupos[equipoKey] = {
                    equipo1_id: eq1_id,
                    equipo2_id: eq2_id,
                    equipo1_nombre: equipo1Data?.nombre_equipo || `Equipo ${eq1_id}`,
                    equipo2_nombre: equipo2Data?.nombre_equipo || null,
                    partidasPorEpoca: {}, // Agrupar partidas por época
                    todasLasPartidas: [] // Array completo
                };
            }
            
            // Agregar a todas las partidas
            grupos[equipoKey].todasLasPartidas.push(partida);
            
            // Agrupar por época
            const epoca = partida.epoca || 'Sin época';
            if (!grupos[equipoKey].partidasPorEpoca[epoca]) {
                grupos[equipoKey].partidasPorEpoca[epoca] = [];
            }
            grupos[equipoKey].partidasPorEpoca[epoca].push(partida);
        });
        
        return grupos;
    };

    const renderPartidaIndividual = (partida, index, esRondaActual) => {

        const estaConfirmado = partida.resultado_confirmado;
        // Verificar permisos de edición
        const puedeEditar = esRondaActual && 
                            puedeEditarEstaPartida(partida) && 
                            !esBye(partida);
    
        return (
            <div 
                key={partida.id} 
                className={`emparejamiento-card ${puedeEditar ? 'editable' : ''}`}
                onClick={() => puedeEditar && abrirModalPartida(partida)}
                style={{
                    border: `2px solid ${estaConfirmado ? '#4caf50' : '#ff9800'}`,
                    background: estaConfirmado ? '#e8f5e9' : '#fff',
                    cursor: puedeEditar ? 'pointer' : 'default'
                }}
            >
                {puedeEditar && (
                    <div className="etiqueta-editar">
                        👆 Click para editar
                    </div>
                )}

                {!esVistaPublica && esOrganizador && esRondaActual && (
                    <button
                        className={`boton-confirmar ${estaConfirmado ? 'confirmado' :  (tieneDatos(partida) ? 'por-confirmar' : 'pendiente' )}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(
                                estaConfirmado 
                                    ? '¿Desconfirmar este resultado?\n\nLos puntos se restarán de la clasificación.'
                                    : (esBye(partida) 
                                        ? '⭐ ¿Confirmar este BYE?\n\nSe sumarán 10 Puntos de Torneo a la clasificación.'
                                        : '¿Confirmar este resultado?\n\nLos puntos se sumarán a la clasificación.')
                            )) {
                                confirmarPartida(partida.id, !estaConfirmado);
                            }
                        }}
                    >
                        {estaConfirmado ? '✅ CONFIRMADO' : (tieneDatos(partida) ? 'POR CONFIRMAR' : 'PENDIENTE' ) }
                    </button>
                )}

                <div className={`mesa-numero ${estaConfirmado ? 'confirmado' : 'pendiente'} ${esOrganizador && esRondaActual ? 'con-margen' : ''}`}>
                    Mesa {partida.mesa || index + 1}
                    {esBye(partida) ? ' ⭐ BYE' : ''}
                    {partida.epoca && ` - 📅 ${partida.epoca}`}
                    {partida.nombre_partida && (
                        <div className="escenario-partida">
                            📋 {partida.nombre_partida}
                        </div>
                    )}
                </div>

                <div className="enfrentamiento">
                    <div className="jugador">
                        <div className="nombre">
                            {partida.jugador1_nombre}
                            {partida.jugador1?.nombre_alias && ` "${partida.jugador1?.nombre_alias}"`}
                        </div>
                        {partida.jugador1?.equipo_nombre && (
                            <div className="equipo">🏆 {partida.jugador1.equipo_nombre}</div>
                        )}
                        {partida.jugador1?.faccion && (
                            <div className="faccion">⚔️ {partida.jugador1.faccion}</div>
                        )}
                        <div className="stats">
                            PV: {parseFloat(partida.puntos_victoria_j1 || 0).toFixed(1)} |
                            PT: {parseFloat(partida.puntos_torneo_j1 || 0).toFixed(1)} | 
                            PM: {parseFloat(partida.puntos_masacre_j1 || 0).toFixed(1)}
                        </div>
                    </div>

                    <div className="vs">VS</div>

                    {partida.jugador2_nombre ? (
                        <div className="jugador">
                            <div className="nombre">
                                {partida.jugador2_nombre}
                                {partida.jugador2?.nombre_alias && ` "${partida.jugador2?.nombre_alias}"`}
                            </div>
                            {partida.jugador2?.equipo_nombre && (
                                <div className="equipo">🏆 {partida.jugador2.equipo_nombre}</div>
                            )}
                            {partida.jugador2?.faccion && (
                                <div className="faccion">⚔️ {partida.jugador2.faccion}</div>
                            )}
                            <div className="stats">
                                PV: {parseFloat(partida.puntos_victoria_j2 || 0).toFixed(1)} | 
                                PT: {parseFloat(partida.puntos_torneo_j2 || 0).toFixed(1)} | 
                                PM: {parseFloat(partida.puntos_masacre_j2 || 0).toFixed(1)}
                            </div>
                        </div>
                    ) : (
                        <div className="jugador bye">
                            <div>⭐ BYE</div>
                            <div>Victoria automática</div>
                            <div>10 PT clasificacion Individual</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPartidas = (partidas, esRondaActual = false) => {
        if (!esTorneoEquipos()) {
            return partidas.map((partida, index) => 
                renderPartidaIndividual(partida, index, esRondaActual)
            );
        }

        const grupos = agruparPartidasPorEquipos(partidas);
        
        return Object.entries(grupos).map(([claveGrupo, grupo]) => (
            <div key={claveGrupo} className="enfrentamiento-equipos">
                {/* HEADER DEL ENFRENTAMIENTO */}
                <div className="header-equipos">
                    <h4>
                        ⚔️ {grupo.equipo1_nombre} 
                        {grupo.equipo2_nombre ? ` vs ${grupo.equipo2_nombre}` : ' (BYE)'}
                    </h4>
                    <span className="total-partidas">
                        {grupo.todasLasPartidas.length} {grupo.todasLasPartidas.length === 1 ? 'partida' : 'partidas'}
                    </span>
                    {/* 🎯 MOSTRAR ESCENARIO SOLO SI EL TORNEO ESTÁ EN CURSO */}
                </div>

                {/* PARTIDAS AGRUPADAS POR ÉPOCA */}
                <div className="contenedor-epocas">
                    {Object.entries(grupo.partidasPorEpoca).map(([epoca, partidasEpoca]) => (
                        <div key={epoca} className="grupo-epoca">
                            {/* HEADER DE LA ÉPOCA */}
                            <div className="epoca-header">
                                <span className="epoca-badge-grande">📅 {epoca}</span>
                                <span className="cantidad-partidas">
                                    ({partidasEpoca.length} {partidasEpoca.length === 1 ? 'partida' : 'partidas'})
                                </span>
                            </div>

                            {/* PARTIDAS DE ESTA ÉPOCA */}
                            <div className="partidas-epoca">
                                {partidasEpoca.map((partida, index) => 
                                    renderPartidaIndividual(partida, index, esRondaActual)
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ));
    };

    if (loading) {
        return (
            <div className="vista-emparejamientos">
                <div className="loading-message">
                    ⏳ Cargando emparejamientos...
                </div>
            </div>
        );
    }

    if (error && !torneo) {
        return (
            <div className="vista-emparejamientos">
                <div className="error-message">
                    ⚠️ {error}
                    <button onClick={cargarDatos} className="btn-secondary">
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const grupos = partidasPorRonda();
    const rondasAnteriores = Object.keys(grupos).filter(r => parseInt(r) < torneo.ronda_actual).sort((a, b) => b - a);
    const minParticipantes = esTorneoEquipos() ? equipos.length : jugadores.length;

    return (
        <div className="vista-emparejamientos">
            {/* 🎯 SELECTOR DE ESCENARIOS - DEBE IR AQUÍ AL PRINCIPIO */}
            {mostrarSelectorEscenarios && esTorneoEquipos() && (
                <div className="modal-overlay" onClick={() => {
                    setMostrarSelectorEscenarios(false);
                    setGuardando(false);
                }}>
                    <div className="selector-escenarios-epoca" onClick={(e) => e.stopPropagation()}>
                        <div className="selector-header">
                            <h3>📋 Asignar Escenarios por Época</h3>
                            <p>Ronda {torneo.ronda_actual} - Selecciona el escenario para cada época</p>
                        </div>

                        <div className="escenarios-disponibles">
                            <strong>Escenarios de esta ronda:</strong>
                            <div className="badges-escenarios">
                                {(() => {
                                    const rondas = [
                                        torneo.partida_ronda_1,
                                        torneo.partida_ronda_2,
                                        torneo.partida_ronda_3,
                                        torneo.partida_ronda_4,
                                        torneo.partida_ronda_5
                                    ].filter(Boolean);
                                    
                                    const escenarios = rondas.flatMap(r => r.split('/')).map(e => e.trim());
                                    
                                    return escenarios.map((esc, idx) => (
                                        <span key={idx} className="badge-escenario">{esc}</span>
                                    ));
                                })()}
                            </div>
                        </div>

                        <div className="asignaciones-lista">
                            {obtenerEpocasDisponibles().map(epoca => {
                                const escenarios = (() => {
                                    const rondas = [
                                        torneo.partida_ronda_1,
                                        torneo.partida_ronda_2,
                                        torneo.partida_ronda_3,
                                        torneo.partida_ronda_4,
                                        torneo.partida_ronda_5
                                    ].filter(Boolean);
                                    
                                    return rondas.flatMap(r => r.split('/')).map(e => e.trim());
                                })();

                                return (
                                    <div key={epoca} className="asignacion-row">
                                        <span className="epoca-nombre">📅 {epoca}:</span>
                                        <select
                                            value={asignacionesEscenarios[epoca] || ''}
                                            onChange={(e) => handleAsignarEscenario(epoca, e.target.value)}
                                            className={asignacionesEscenarios[epoca] ? 'seleccionado' : ''}
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {escenarios.map((esc, idx) => (
                                                <option key={idx} value={esc}>{esc}</option>
                                            ))}
                                        </select>
                                        {asignacionesEscenarios[epoca] && (
                                            <span className="check-ok">✅</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="selector-footer">
                            <button 
                                onClick={() => {
                                    setMostrarSelectorEscenarios(false);
                                    setGuardando(false);
                                    setAsignacionesEscenarios({});
                                }}
                                className="btn-cancelar"
                            >
                                ❌ Cancelar
                            </button>
                            <button 
                                onClick={confirmarAsignaciones}
                                className="btn-confirmar-asignacion"
                                disabled={!todasLasEpocasAsignadas()}
                            >
                                ✅ Confirmar y Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="section-header">
                <div>
                    <div>
                        <h2>🎲 Emparejamientos {esTorneoEquipos() ? '(Por Equipos)' : '(Individuales)'}</h2>
                        <p>Ronda {torneo.ronda_actual} de {torneo.rondas_max}</p>
                        
                        {(torneo.estado === 'en_curso' || torneo.estado === 'finalizado') && (
                            <>
                                {esTorneoEquipos() ? (
                                    // Para equipos: mostrar TODOS los escenarios
                                    (() => {
                                        const rondas = [
                                            torneo.partida_ronda_1,
                                            torneo.partida_ronda_2,
                                            torneo.partida_ronda_3,
                                            torneo.partida_ronda_4,
                                            torneo.partida_ronda_5
                                        ].filter(Boolean);
                                        
                                        return rondas.length > 0 ? (
                                            <p>📋 Escenarios: {rondas.join(' / ')}</p>
                                        ) : (
                                            <p>⚠️ No hay escenarios configurados</p>
                                        );
                                    })()
                                ) : (
                                    // Para individuales: mostrar solo el escenario de la ronda actual
                                    torneo[`partida_ronda_${torneo.ronda_actual}`] && (
                                        <p>📋 {torneo[`partida_ronda_${torneo.ronda_actual}`]}</p>
                                    )
                                )}
                            </>
                        )}
                        {/* CUANDO TORNEO NO INICIADO */}
                        {torneo.estado === 'pendiente' && (
                            <p>⏳ Los escenarios se mostrarán cuando el torneo esté en curso</p>
                        )}
                    </div>
                    
                    {!esVistaPublica && esOrganizador && (
                    <div className="botones-grupo">
                        <button 
                            onClick={handleGenerarEmparejamientos}
                            className="btn-primary"
                            disabled={minParticipantes < 2 || guardando || partidasGuardadas.length > 0 || modoEdicion}
                        >
                            🎲 Generar Ronda
                        </button>

                        {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                            <>
                                {!modoEdicion ? (
                                    <>
                                        <button 
                                            onClick={() => setModoEdicion(true)}
                                            className="btn-warning"
                                        >
                                            ✏️ Editar Emparejamientos
                                        </button>
                                        
                                        <button 
                                            onClick={guardarResultados}
                                            className="btn-success"
                                            disabled={guardando}
                                        >
                                            {guardando ? '⏳ Guardando...' : '💾 Guardar en BD'}
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setModoEdicion(false);
                                            alert('✅ Modo edición desactivado. Ahora puedes guardar los emparejamientos.');
                                        }}
                                        className="btn-success"
                                    >
                                        ✅ Finalizar Edición
                                    </button>
                                )}
                            </>
                        )}

                        {partidasGuardadas.length > 0 && todasLasPartidasCompletas() && (
                            <button 
                                onClick={generarSiguienteRonda}
                                disabled={torneo.ronda_actual >= torneo.rondas_max}
                                className="btn-warning"
                            >
                                ⏭️ Generar Ronda {torneo.ronda_actual + 1}
                            </button>
                        )}
                    </div>
                )}
                {/* 🆕 BOTÓN COMPARTIR - PARA TODOS */}
                {(emparejamientos.length > 0 || partidasGuardadas.length > 0) && (
                    <div className="botones-grupo" style={{ marginTop: esOrganizador ? '0' : '20px' }}>
                        <button
                            onClick={compartirEmparejamientos}
                            className="btn-success"
                            title="Compartir emparejamientos en WhatsApp, Telegram, etc."
                            disabled={guardando}
                        >
                            📤 Compartir Emparejamientos
                        </button>
                    </div>
                )}
                </div>
            </div>

          {partidasGuardadas.length > 0 && torneo?.estado === 'en_curso' && !esOrganizador && !esParticipante && (
                <div className="alerta-estado">
                    <p>⚠️ Solo los participantes pueden editar sus partidas cuando el torneo está en curso</p>
                </div>
            )}

            {partidasGuardadas.length > 0 && (
                <div className={`info-partidas ${todasLasPartidasCompletas() ? 'completadas' : 'pendientes'}`}>
                    <p>
                        {todasLasPartidasCompletas() ? (
                            <>✅ Todas las partidas completadas ({partidasGuardadas.length}/{partidasGuardadas.length})</>
                        ) : (
                            <>⏳ Partidas completadas: {partidasGuardadas.filter(p => p.resultado_ps && p.resultado_ps !== 'pendiente').length}/{partidasGuardadas.length}</>
                        )}
                    </p>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <p>❌ {error}</p>
                </div>
            )}

            {cargandoPartidas && (
                <div className="loading-message">
                    ⏳ Cargando partidas...
                </div>
            )}

            {minParticipantes < 2 ? (
                <div className="empty-message">
                    <p>⚠️ Se necesitan al menos 2 {esTorneoEquipos() ? 'equipos' : 'jugadores'} para generar emparejamientos</p>
                </div>
            ) : (
                <>
                    {!puedeVerPartidas() ? (
                        <div className="empty-message">
                            <p>🔒 El torneo aún no ha comenzado</p>
                            <p style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                                Los emparejamientos se mostrarán cuando el torneo esté en curso
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mostrar mensaje informativo si no hay partidas cargadas pero sí permisos para ver */}
                            {partidasGuardadas.length === 0 && todasLasPartidas.length === 0 && !cargandoPartidas && (
                                <div className="info-message">
                                    {torneo?.ronda_actual && torneo.ronda_actual > 0 ? (
                                        <p>ℹ️ Aún no se han generado emparejamientos para esta ronda</p>
                                    ) : (
                                        <p>ℹ️ El torneo está en preparación. Los emparejamientos aparecerán pronto.</p>
                                    )}
                                </div>
                            )}

                            {/* Mensaje específico para participantes */}
                           {partidasGuardadas.length > 0 && !todasLasPartidasCompletas() && (esOrganizador || esParticipante) && (
                                <div className="info-box">
                                    {esOrganizador ? (
                                        <p>📝 Como organizador, puedes editar cualquier partida haciendo clic en ella</p>
                                    ) : (
                                        <p>📝 Puedes editar tus propias partidas haciendo clic en ellas</p>
                                    )}
                                </div>
                            )}

                            {/* Mensaje para visitantes */}
                            {partidasGuardadas.length > 0 && !usuarioActual && (
                                <div className="info-box" style={{background: '#e3f2fd', borderColor: '#2196f3'}}>
                                    <p>👁️ Estás viendo los emparejamientos como visitante. Inicia sesión si eres participante para registrar resultados.</p>
                                </div>
                            )}

                            {partidasGuardadas.length === 0 && emparejamientos.length === 0 ? (
                                esOrganizador && (
                                    <div className="empty-message">
                                        <p>Haz clic en "Generar Emparejamientos" para crear los enfrentamientos de la ronda {torneo.ronda_actual}</p>
                                    </div>
                                )
                            ) : (
                                <>
                                    {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                                        <div className="info-box">
                                            <p>
                                                ℹ️ <strong>{emparejamientos.length} emparejamientos generados.</strong> 
                                                {' '}Haz clic en "Guardar en BD" para crear las partidas en la base de datos.
                                            </p>
                                        </div>
                                    )}

                                   <div className={`emparejamientos-grid ${esTorneoEquipos ? 'equipos-layout' : ''}`}>
                                        {partidasGuardadas.length > 0 ? (
                                            renderPartidas(partidasGuardadas, true)
                                        ) : (
                                            emparejamientos.map((emp, index) => {
                                                const esEquipos = esTorneoEquipos();
                                                
                                                // 🎯 PARA TORNEOS DE EQUIPOS
                                                if (esEquipos && emp.jugadores_equipo1) {
                                                    return (
                                                        <div key={index} className="enfrentamiento-equipos-preview">
                                                            {/* 🆕 BOTONES DE EDICIÓN PARA EQUIPOS */}
                                                            {modoEdicion && (
                                                                <div className="botones-edicion">
                                                                    <button
                                                                        onClick={() => abrirEdicion(emp, index)}
                                                                        className="btn-editar-small"
                                                                        title="Editar emparejamiento"
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                    <button
                                                                        onClick={() => eliminarEmparejamiento(index)}
                                                                        className="btn-eliminar-small"
                                                                        title="Eliminar emparejamiento"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="header-equipos-preview">
                                                                <h4>⚔️ {emp.equipo1_nombre} {emp.equipo2_nombre ? `vs ${emp.equipo2_nombre}` : '(BYE)'}</h4>
                                                            </div>
                                                            
                                                            {/* PARTIDAS de los equipos */}
                                                            {emp.partidas && emp.partidas.length > 0 && (
                                                                <div className="partidas-preview">
                                                                    <h6>Partidas de los Equipos ({emp.partidas.length}):</h6>
                                                                    <div className="lista-partidas-preview">
                                                                        {emp.partidas.map((partida, pIndex) => {
                                                                            const jugador1Alias = partida.jugador1_alias;
                                                                            const jugador2Alias = partida.jugador2_alias;
                                                                            
                                                                            return (
                                                                                <div key={pIndex} className="partida-individual-preview">
                                                                                    <span className="epoca-badge">{partida.epoca || 'Sin época'}</span>
                                                                                    <div>
                                                                                        <span className="jugadores-partida">
                                                                                            {partida.jugador1_nombre}
                                                                                            {jugador1Alias && ` "${jugador1Alias}"`}
                                                                                            <strong> vs </strong> 
                                                                                            {partida.jugador2_nombre || '⭐ BYE'}
                                                                                            {jugador2Alias && ` "${jugador2Alias}"`}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                            
                                                // 🎯 PARA TORNEOS INDIVIDUALES
                                                const jugador1Nombre = emp.jugador1?.nombre || emp.jugador1?.jugador_nombre;
                                                const jugador1Alias = emp.jugador1?.nombre_alias;
                                                const jugador2Nombre = emp.jugador2 ? (emp.jugador2?.nombre || emp.jugador2?.jugador_nombre) : null;
                                                const jugador2Alias = emp.jugador2?.nombre_alias;

                                                return (
                                                    <div key={index} className="emparejamiento-card">
                                                        {/* 🆕 BOTONES DE EDICIÓN PARA INDIVIDUALES */}
                                                        {modoEdicion && (
                                                            <div className="botones-edicion">
                                                                <button
                                                                    onClick={() => abrirEdicion(emp, index)}
                                                                    className="btn-editar-small"
                                                                    title="Editar emparejamiento"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => eliminarEmparejamiento(index)}
                                                                    className="btn-eliminar-small"
                                                                    title="Eliminar emparejamiento"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="mesa-numero preview">
                                                            Mesa {emp.mesa || index + 1} 
                                                            {emp.es_bye === 1 && ' ⭐ BYE'}
                                                        </div>
                                                        <div className="enfrentamiento">
                                                            <div className="jugador">
                                                                <div className="nombre">
                                                                    {jugador1Nombre}
                                                                    {jugador1Alias && ` "${jugador1Alias}"`}
                                                                </div>
                                                            </div>
                                                            <div className="vs">VS</div>
                                                            <div className="jugador">
                                                                <div className="nombre">
                                                                    {emp.es_bye ? '⭐ BYE' : (
                                                                        <>
                                                                            {jugador2Nombre}
                                                                            {jugador2Alias && ` "${jugador2Alias}"`}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Rondas anteriores también protegidas */}
                            {rondasAnteriores.length > 0 && (
                                <div className="rondas-anteriores">
                                    <h3>📜 Rondas Anteriores</h3>
                                    
                                    {rondasAnteriores.map(ronda => {
                                        const partidasRonda = grupos[ronda] || [];
                                        const expandida = rondasExpandidas[ronda];
                                        
                                        return (
                                            <div key={ronda} className="acordeon-ronda">
                                                <div 
                                                    className="acordeon-header"
                                                    onClick={() => toggleRonda(ronda)}
                                                >
                                                    <div className="titulo">
                                                        <strong>Ronda {ronda}</strong>
                                                        <span>{partidasRonda.length} partidas</span>
                                                    </div>
                                                    <div className="icono">
                                                        {expandida ? '▼' : '▶'}
                                                    </div>
                                                </div>
                                                
                                                {expandida && (
                                                    <div className="acordeon-body">
                                                         <div className={`emparejamientos-grid ${esTorneoEquipos ? 'equipos-layout' : ''}`}>
                                                            {renderPartidas(partidasRonda, false)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {modalAbierto && partidaSeleccionada && (
                <ModalRegistroPartida
                    partida={partidaSeleccionada}
                    esOrganizador={esOrganizador}
                    onClose={() => {
                        setModalAbierto(false);
                        setPartidaSeleccionada(null);
                    }}
                    onGuardar={() => {
                        cargarPartidasRonda();
                        cargarTodasLasPartidas();
                        setModalAbierto(false);
                        setPartidaSeleccionada(null);
                    }}
                />
            )}

            {modalEdicionAbierto && emparejamientoEditando && (
                <ModalEdicionEmparejamientos
                    emparejamiento={emparejamientoEditando}
                    jugadores={jugadores}
                    equipos={equipos}
                    esTorneoEquipos={esTorneoEquipos()}
                    onClose={() => {
                        setModalEdicionAbierto(false);
                        setEmparejamientoEditando(null);
                    }}
                    onGuardar={guardarEdicion}
                />
            )}
        </div>
    );
}

export default VistaEmparejamientosSaga;