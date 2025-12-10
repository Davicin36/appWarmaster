import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosWarmasterApi from '@/servicios/apiWarmaster';
import { generarEmparejamientosIndividuales } from '../funcionesWarmaster/emparejamientosIndividualesWarmaster';

import ModalRegistroPartida from '../ModalRegistroPartidaWarmaster';

import '@/estilos/vistasTorneos/vistaEmparejamientos.css';

function VistaEmparejamientosWarmaster({ torneoId: propTorneoId, esVistaPublica = false }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
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
            
            const responseTorneo = await torneosWarmasterApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);
    
            const responseJugadores = await torneosWarmasterApi.obtenerJugadoresTorneo(torneoId);
            const dataJugadores = responseJugadores.data || responseJugadores || [];
            setJugadores(Array.isArray(dataJugadores) ? dataJugadores : []);

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
            const response = await torneosWarmasterApi.obtenerPartidasTorneo(tId);
            const partidas = response?.data || response || [];
            const partidasArray = Array.isArray(partidas) ? partidas : [];

            setTodasLasPartidas(partidasArray);
        } catch (err) {
            console.error('Error al cargar todas las partidas:', err);
            setTodasLasPartidas([]);
        }
    };

    const cargarPartidasRonda = async (tId = torneoId, ronda = torneo?.ronda_actual) => {
        try {
            setCargandoPartidas(true);
            
            const response = await torneosWarmasterApi.obtenerEmparejamientosIndividuales(tId, ronda);

            const partidas = response?.data || response || [];
            const partidasArray = Array.isArray(partidas) ? partidas : [];

            setPartidasGuardadas(partidasArray);
             
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

            // Validar participantes mínimos
            const minParticipantes = jugadores.length;
            if (minParticipantes < 2) {
                alert(`⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos`);
                return;
            }

            // Preparar participantes para torneos individuales
            const responseClasificacion = await torneosWarmasterApi.obtenerClasificacionIndividual(torneoId);
            const clasificacion = responseClasificacion.data || responseClasificacion || [];

            const participantes = jugadores.map(j => {
                const stats = clasificacion.find(c => c.jugador_id === j.jugador_id || c.jugador_id === j.id);
                return {
                    ...j,
                    puntos_victoria: stats?.puntos_victoria_totales || 0,
                    puntos_masacre: stats?.puntos_masacre_totales || 0,                
                };
            });

            // 🎯 LLAMADA UNIFICADA
            const nuevosEmparejamientos = await generarEmparejamientosIndividuales(
                torneoId,
                torneo.ronda_actual || 1,
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
      
            // Para torneos individuales, usar el escenario de la ronda actual
            const nombreEscenario = torneo[`partida_ronda_${torneo.ronda_actual}`];
            
            if (!nombreEscenario) {
                alert(`⚠️ No se encontró el escenario configurado para la Ronda ${torneo.ronda_actual}`);
                return;
            }

            const confirmar = window.confirm(
                `¿Guardar ${emparejamientos.length} emparejamientos para la Ronda ${torneo.ronda_actual}?\n\n` +
                `Escenario: ${nombreEscenario}`
            );
            
            if (!confirmar) return;

            const todasLasPartidas = [];
            let mesaCounter = 1;

            emparejamientos.forEach((emp) => {
                if (emp.partidas && Array.isArray(emp.partidas)) {
                    emp.partidas.forEach((partida) => {
                        todasLasPartidas.push({
                            mesa: mesaCounter++,
                            jugador1_id: partida.jugador1_id,
                            jugador2_id: partida.jugador2_id,
                            es_bye: partida.es_bye || 0,
                            nombre_partida: nombreEscenario,
                            ronda: torneo.ronda_actual,
                        });
                    });
                } else {
                    todasLasPartidas.push({
                        mesa: mesaCounter++,
                        jugador1_id: emp.jugador1_id,
                        jugador2_id: emp.jugador2_id,
                        es_bye: emp.es_bye || 0,
                        nombre_partida: nombreEscenario,
                        ronda: torneo.ronda_actual,
                    });
                }
            });

            const errores = [];
            todasLasPartidas.forEach((partida, index) => {
                if (!partida.jugador1_id) {
                    errores.push(`Mesa ${partida.mesa}: jugador 1 sin ID (partida ${index + 1})`);
                }
            });

            if (errores.length > 0) {
                console.error('Errores de validación:', errores);
                console.error('Partidas con error:', todasLasPartidas);
                alert('Error: Faltan IDs:\n' + errores.join('\n'));
                return;
            }

            await torneosWarmasterApi.guardarEmparejamientosIndividuales(
                torneo.id,
                todasLasPartidas,
                torneo.ronda_actual
            );

            alert(`✅ ${emparejamientos.length} partidas creadas para la Ronda ${torneo.ronda_actual}\nEscenario: ${nombreEscenario}`);

            setEmparejamientos([]);

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

            await torneosWarmasterApi.actualizarTorneo(torneo.id, {
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
            partida.resultado_pw && 
            partida.resultado_pw !== 'pendiente' &&
            partida.resultado_pw !== null
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
            await torneosWarmasterApi.confirmarResultado(torneo.id, partidaId, confirmar);
        
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
                    {' - '}
                    {estaConfirmado ? '✅ CONFIRMADA' : '⏳ PENDIENTE'}
                </div>

                <div className="enfrentamiento">
                    <div className="jugador">
                        <div className="nombre">{partida.jugador1_nombre}</div>
                        {partida.jugador1?.ejercito && (
                            <div className="ejercito">⚔️ {partida.jugador1.ejercito}</div>
                        )}
                        <div className="stats">
                            PV: {parseFloat(partida.puntos_victoria_j1 || 0).toFixed(1)} | 
                            PM: {parseFloat(partida.puntos_masacre_j1 || 0).toFixed(1)}
                        </div>
                    </div>

                    <div className="vs">VS</div>

                    {partida.jugador2_nombre ? (
                        <div className="jugador">
                            <div className="nombre">{partida.jugador2_nombre}</div>
                            {partida.jugador2?.ejercito && (
                                <div className="ejercito">⚔️ {partida.jugador2.ejercito}</div>
                            )}
                            <div className="stats">
                                PV: {parseFloat(partida.puntos_victoria_j2 || 0).toFixed(1)} | 
                                PM: {parseFloat(partida.puntos_masacre_j2 || 0).toFixed(1)}
                            </div>
                        </div>
                    ) : (
                        <div className="jugador bye">
                            <div>⭐ BYE</div>
                            <div>Victoria automática</div>
                            <div>150 PM clasificación Individual</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPartidas = (partidas, esRondaActual = false) => {
        return partidas.map((partida, index) => 
            renderPartidaIndividual(partida, index, esRondaActual)
        );
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
    const minParticipantes = jugadores.length;

    return (
        <div className="vista-emparejamientos">
            <div className="section-header">
                <div>
                    <div>
                        <h2>🎲 Emparejamientos</h2>
                        <p>Ronda {torneo.ronda_actual} de {torneo.rondas_max}</p>
                        
                        {(torneo.estado === 'en_curso' || torneo.estado === 'finalizado') && (
                            <>
                                {torneo[`partida_ronda_${torneo.ronda_actual}`] && (
                                    <p>📋 {torneo[`partida_ronda_${torneo.ronda_actual}`]}</p>
                                )}
                            </>
                        )}

                        {torneo.estado === 'pendiente' && (
                            <p>⏳ Los escenarios se mostrarán cuando el torneo esté en curso</p>
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
                            <>⏳ Partidas completadas: {partidasGuardadas.filter(p => p.resultado_pw && p.resultado_pw !== 'pendiente').length}/{partidasGuardadas.length}</>
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
                    <p>⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos</p>
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

export default VistaEmparejamientosWarmaster;