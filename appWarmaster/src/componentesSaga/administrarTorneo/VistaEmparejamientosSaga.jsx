import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '@/servicios/apiSaga';
import { generarEmparejamientos } from '../funcionesSaga/seleccionEmparejamientos';

import ModalRegistroPartida from '../ModalRegistroPartidaSaga';

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

    const esTorneoEquipos = () => torneo?.tipo_torneo === 'Por equipos';

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

    useEffect(() => {
        if (torneo?.created_by && usuarioActual?.id) {
            setEsOrganizador(torneo.created_by === usuarioActual.id);
        }
    }, [torneo, usuarioActual]);

    useEffect(() => {
        if (torneoId) {
            cargarDatos();
        }
    }, [torneoId]);

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
                    console.log('No hay equipos todavía', err);
                    setEquipos([]);
                }
            } else {
                try {
                    const responseJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                    const dataJugadores = responseJugadores.data || responseJugadores || [];
                    setJugadores(Array.isArray(dataJugadores) ? dataJugadores : []);
                } catch (err) {
                    console.log('No hay jugadores todavía', err);
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

    const cargarTodasLasPartidas = async (tId = torneoId) => {
        try {
            const partidas = await torneosSagaApi.obtenerPartidasTorneo(tId);
            setTodasLasPartidas(partidas);
        } catch (err) {
            console.error('Error al cargar todas las partidas:', err);
        }
    };

    const cargarPartidasRonda = async (tId = torneoId, ronda = torneo?.ronda_actual) => {
        try {
            setCargandoPartidas(true);
            const partidas = await torneosSagaApi.obtenerPartidasTorneo(tId, ronda);
            setPartidasGuardadas(partidas);
        } catch (err) {
            console.error('Error al cargar partidas:', err);
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

        console.log(`🎲 Tipo de torneo: ${esEquipos ? 'EQUIPOS' : 'INDIVIDUALES'}`);

        // Preparar participantes SOLO para torneos individuales
        let participantes = [];
        
        if (!esEquipos) {
            const responseClasificacion = await torneosSagaApi.obtenerClasificacion(torneoId);
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

    const guardarResultados = async () => {
        try {
            setGuardando(true);
            setError(null);

            if (!emparejamientos || emparejamientos.length === 0) {
                alert('⚠️ Primero debes generar los emparejamientos');
                return;
            }

            const nombreEscenario = torneo[`partida_ronda_${torneo.ronda_actual}`];
            
            if (!nombreEscenario) {
                alert('⚠️ No se encontró el escenario configurado para esta ronda');
                return;
            }

            const confirmar = window.confirm(
                `¿Guardar ${emparejamientos.length} emparejamientos para la Ronda ${torneo.ronda_actual}?\n\n` +
                `Escenario: ${nombreEscenario}`
            );
            
            if (!confirmar) return;

            const emparejamientosFormateados = emparejamientos.map((emp, index) => {
                const j1_id = emp.jugador1_id || emp.jugador1?.jugador_id || emp.jugador1?.id;
                const j2_id = emp.jugador2_id || (emp.jugador2 ? (emp.jugador2?.jugador_id || emp.jugador2?.id) : null);

                return {
                    mesa: emp.mesa || index + 1,
                    jugador1_id: j1_id,
                    jugador2_id: j2_id,
                    es_bye: emp.es_bye || 0,
                    nombre_partida: nombreEscenario,
                    ronda: torneo.ronda_actual,
                    epoca: emp.epoca || null, // Guardar la época si es torneo de equipos
                };
            });

            const errores = [];
            emparejamientosFormateados.forEach((emp) => {
                if (!emp.jugador1_id) {
                    errores.push(`Mesa ${emp.mesa}: jugador1 sin ID`);
                }
            });

            if (errores.length > 0) {
                console.error('❌ Errores de validación:', errores);
                alert('❌ Error: Faltan IDs:\n' + errores.join('\n'));
                return;
            }

            await torneosSagaApi.guardarEmparejamientosRondas(
                torneo.id,
                emparejamientosFormateados,
                torneo.ronda_actual
            );

            alert(`✅ ${emparejamientos.length} partidas creadas para la Ronda ${torneo.ronda_actual}\nEscenario: ${nombreEscenario}`);
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

    const puedeEditarPartidas = () => {
        return torneo?.estado === 'en_curso';
    };

    const esBye = (partida) => {
        return !partida.jugador2_nombre || !partida.jugador2_id || partida.es_bye;
    };

    const abrirModalPartida = (partida) => {
        if (!puedeEditarPartidas()) {
            alert('⚠️ El torneo debe estar "En Curso" para poder introducir resultados.\n\nCambia el estado del torneo primero.');
            return;
        }

        setPartidaSeleccionada(partida);
        setModalAbierto(true);
    };

    const confirmarPartida = async (partidaId, confirmar) => {
        try {
            await torneosSagaApi.confirmarResultado(torneo.id, partidaId, confirmar);
            
            alert(confirmar 
                ? '✅ Resultado confirmado. Los puntos se han sumado a la clasificación.' 
                : '⚠️ Resultado desconfirmado. Los puntos se han restado de la clasificación.'
            );
            
            await cargarPartidasRonda();
            await cargarTodasLasPartidas();
            
        } catch (error) {
            console.error('Error al confirmar resultado:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const confirmarTodasLasPartidas = async () => {
        const partidasPendientes = partidasGuardadas.filter(
            p => !p.resultado_confirmado && !esBye(p) && 
                (p.puntos_victoria_j1 > 0 || p.puntos_victoria_j2 > 0)
        );
        
        if (partidasPendientes.length === 0) {
            alert('⚠️ No hay partidas pendientes de confirmar');
            return;
        }
        
        const confirmar = window.confirm(
            `¿Confirmar ${partidasPendientes.length} partidas?\n\n` +
            `Los puntos se sumarán a la clasificación definitivamente.`
        );
        
        if (!confirmar) return;
        
        try {
            let confirmadas = 0;
            for (const partida of partidasPendientes) {
                await torneosSagaApi.confirmarResultado(torneo.id, partida.id, true);
                confirmadas++;
            }
            
            alert(`✅ ${confirmadas} partidas confirmadas correctamente`);
            await cargarPartidasRonda();
            await cargarTodasLasPartidas();
            
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error al confirmar partidas: ${error.message}`);
        }
    };

    // Agrupar partidas por enfrentamiento de equipos (para torneos de equipos)
    // Función para agrupar partidas por equipos y luego por época
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
        const partidaEsBye = esBye(partida);
        const estaConfirmado = partida.resultado_confirmado;
        const puedeEditar = esRondaActual && puedeEditarPartidas() && !partidaEsBye && !estaConfirmado;

        return (
            <div 
                key={partida.id} 
                className={`emparejamiento-card ${puedeEditar ? 'editable' : ''}`}
                onClick={() => puedeEditar && abrirModalPartida(partida)}
                style={{
                    border: `2px solid ${estaConfirmado ? '#4caf50' : '#ff9800'}`,
                    background: estaConfirmado ? '#e8f5e9' : '#fff'
                }}
            >
                {puedeEditar && (
                    <div className="etiqueta-editar">
                        👆 Click para editar
                    </div>
                )}

                {!esVistaPublica && esOrganizador && esRondaActual && (
                    <button
                        className={`boton-confirmar ${estaConfirmado ? 'confirmado' : 'pendiente'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(
                                estaConfirmado 
                                    ? '¿Desconfirmar este resultado?\n\nLos puntos se restarán de la clasificación.'
                                    : (partidaEsBye 
                                        ? '⭐ ¿Confirmar este BYE?\n\nSe sumarán 10 Puntos de Torneo a la clasificación.'
                                        : '¿Confirmar este resultado?\n\nLos puntos se sumarán a la clasificación.')
                            )) {
                                confirmarPartida(partida.id, !estaConfirmado);
                            }
                        }}
                    >
                        {estaConfirmado ? '✅ CONFIRMADO' : '⏳ PENDIENTE'}
                    </button>
                )}

                <div className={`mesa-numero ${estaConfirmado ? 'confirmado' : 'pendiente'} ${esOrganizador && esRondaActual ? 'con-margen' : ''}`}>
                    Mesa {partida.mesa || index + 1}
                    {partidaEsBye ? ' ⭐ BYE' : ''} 
                    {partida.epoca && ` - 📅 ${partida.epoca}`}
                    {' - '}
                    {estaConfirmado ? '✅ CONFIRMADA' : '⏳ PENDIENTE'}
                </div>

                <div className="enfrentamiento">
                    <div className="jugador">
                        <div className="nombre">{partida.jugador1_nombre}</div>
                        {partida.jugador1?.equipo_nombre && (
                            <div className="equipo">🏆 {partida.jugador1.equipo_nombre}</div>
                        )}
                        {partida.jugador1?.faccion && (
                            <div className="faccion">⚔️ {partida.jugador1.faccion}</div>
                        )}
                        <div className="stats">
                            PV: {partida.puntos_victoria_j1 || 0} | 
                            PT: {partida.puntos_torneo_j1 || 0} | 
                            PM: {partida.puntos_masacre_j1 || 0}
                        </div>
                    </div>

                    <div className="vs">VS</div>

                    {partida.jugador2_nombre ? (
                        <div className="jugador">
                            <div className="nombre">{partida.jugador2_nombre}</div>
                            {partida.jugador2?.equipo_nombre && (
                                <div className="equipo">🏆 {partida.jugador2.equipo_nombre}</div>
                            )}
                            {partida.jugador2?.faccion && (
                                <div className="faccion">⚔️ {partida.jugador2.faccion}</div>
                            )}
                            <div className="stats">
                                PV: {partida.puntos_victoria_j2 || 0} | 
                                PT: {partida.puntos_torneo_j2 || 0} | 
                                PM: {partida.puntos_masacre_j2 || 0}
                            </div>
                        </div>
                    ) : (
                        <div className="jugador bye">
                            <div>⭐ BYE</div>
                            <div>Victoria automática - 10 PT</div>
                        </div>
                    )}
                </div>

                <div className="escenario">
                    📋 {partida.nombre_partida || 'Escenario por definir'}
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

    // Para torneos de equipos, agrupar por enfrentamiento y época
    const grupos = agruparPartidasPorEquipos(partidas);
    
    return Object.entries(grupos).map(([claveGrupo, grupo]) => (
        <div key={claveGrupo} className="enfrentamiento-equipos">
            {/* HEADER DEL ENFRENTAMIENTO */}
            <div className="header-equipos">
                <h4>s
                    ⚔️ {grupo.equipo1_nombre} 
                    {grupo.equipo2_nombre ? ` vs ${grupo.equipo2_nombre}` : ' (BYE)'}
                </h4>
                <span className="total-partidas">
                    {grupo.todasLasPartidas.length} {grupo.todasLasPartidas.length === 1 ? 'partida' : 'partidas'}
                </span>
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
            <div className="section-header">
                <div>
                    <div>
                        <h2>🎲 Emparejamientos {esTorneoEquipos() ? '(Por Equipos)' : '(Individuales)'}</h2>
                        <p>Ronda {torneo.ronda_actual} de {torneo.rondas_max}</p>
                        {torneo[`partida_ronda_${torneo.ronda_actual}`] && (
                            <p>📋 {torneo[`partida_ronda_${torneo.ronda_actual}`]}</p>
                        )}
                    </div>
                    
                    {!esVistaPublica && (
                        <div className="botones-grupo">
                            <button 
                                onClick={handleGenerarEmparejamientos}
                                className="btn-primary"
                                disabled={minParticipantes < 2 || guardando || partidasGuardadas.length > 0}
                            >
                                🎲 Generar Emparejamientos
                            </button>

                            {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                                <button 
                                    onClick={guardarResultados}
                                    className="btn-success"
                                    disabled={guardando}
                                >
                                    {guardando ? '⏳ Guardando...' : '💾 Guardar en BD'}
                                </button>
                            )}

                            {esOrganizador && partidasGuardadas.length > 0 && 
                                partidasGuardadas.some(p => 
                                    !p.resultado_confirmado && 
                                    !esBye(p) && 
                                    (p.puntos_victoria_j1 > 0 || p.puntos_victoria_j2 > 0)
                                ) && (
                                    <button 
                                        onClick={confirmarTodasLasPartidas}
                                        className="btn-success"
                                    >
                                        ✅ Confirmar Todas
                                    </button>
                                )
                            }

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
                </div>
            </div>

            {partidasGuardadas.length > 0 && !puedeEditarPartidas() && (
                <div className="alerta-estado">
                    <p>⚠️ El torneo debe estar en estado "En Curso" para introducir resultados</p>
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
                    {!todasLasPartidasCompletas() && puedeEditarPartidas() && (
                        <p>Haz clic en cualquier partida para registrar sus resultados</p>
                    )}
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
                    {partidasGuardadas.length === 0 && emparejamientos.length === 0 ? (
                        <div className="empty-message">
                            <p>Haz clic en "Generar Emparejamientos" para crear los enfrentamientos de la ronda {torneo.ronda_actual}</p>
                        </div>
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

                                <div className="emparejamientos-grid">
                                    {partidasGuardadas.length > 0 ? (
                                        renderPartidas(partidasGuardadas, true)
                                    ) : (
                                        emparejamientos.map((emp, index) => {
                                            const esEquipos = esTorneoEquipos();
                                            
                                            // 🎯 PARA TORNEOS DE EQUIPOS
                                            if (esEquipos && emp.jugadores_equipo1) {
                                                return (
                                                    <div key={index} className="enfrentamiento-equipos-preview">
                                                        <div className="header-equipos-preview">
                                                            <h4>⚔️ {emp.equipo1_nombre} {emp.equipo2_nombre ? `vs ${emp.equipo2_nombre}` : '(BYE)'}</h4>
                                                        </div>
                                                        
                                                        {/* PARTIDAS de los equipos */}
                                                        {emp.partidas && emp.partidas.length > 0 && (
                                                            <div className="partidas-preview">
                                                                <h6>Partidas de los Equipos ({emp.partidas.length}):</h6>
                                                                <div className="lista-partidas-preview">
                                                                    {emp.partidas.map((partida, pIndex) => (
                                                                        <div key={pIndex} className="partida-individual-preview">
                                                                            <span className="epoca-badge">{partida.epoca || 'Sin época'}</span>
                                                                            <div>
                                                                                <span className="jugadores-partida">
                                                                                    {partida.jugador1_nombre} 
                                                                                    <strong> vs </strong> 
                                                                                    {partida.jugador2_nombre || '⭐ BYE'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                        
                                            // 🎯 PARA TORNEOS INDIVIDUALES (mantener código original)
                                            const jugador1Nombre = emp.jugador1?.nombre || emp.jugador1?.jugador_nombre;
                                            const jugador2Nombre = emp.jugador2 ? (emp.jugador2?.nombre || emp.jugador2?.jugador_nombre) : null;
                                            
                                            return (
                                                <div key={index} className="emparejamiento-card">
                                                    <div className="mesa-numero preview">
                                                        Mesa {emp.mesa || index + 1}
                                                        {emp.es_bye && ' ⭐ BYE'}
                                                    </div>
                                                    <div className="enfrentamiento">
                                                        <div className="jugador">
                                                            <div className="nombre">{jugador1Nombre}</div>
                                                        </div>
                                                        <div className="vs">VS</div>
                                                        <div className="jugador">
                                                            <div className="nombre">
                                                                {emp.es_bye ? '⭐ BYE' : jugador2Nombre}
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
                                                <div className="emparejamientos-grid">
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
        </div>
    );
}

export default VistaEmparejamientosSaga;