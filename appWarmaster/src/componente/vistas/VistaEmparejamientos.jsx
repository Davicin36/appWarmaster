import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '../../servicios/apiSaga';

import { generarEmparejamientosSuizo } from '../../funciones/emparejamientos';

import ModalRegistroPartida from '../ModalRegistroPartida';

function VistaEmparejamientos({ torneoId: propTorneoId }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [emparejamientos, setEmparejamientos] = useState([]);
    const [partidasGuardadas, setPartidasGuardadas] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [cargandoPartidas, setCargandoPartidas] = useState(false);
    const [error, setError] = useState(null);
    
    const [modalAbierto, setModalAbierto] = useState(false);
    const [partidaSeleccionada, setPartidaSeleccionada] = useState(null);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [esOrganizador, setEsOrganizador] = useState(false);

    // Cargar usuario actual
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

    // Verificar si es organizador
    useEffect(() => {
        if (torneo?.created_by && usuarioActual?.id) {
            setEsOrganizador(torneo.created_by === usuarioActual.id);
        }
    }, [torneo, usuarioActual]);

    // Cargar datos iniciales
    useEffect(() => {
        if (torneoId) {
            cargarDatos();
        }
    }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Cargar torneo
            const responseTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);
            
            // Cargar jugadores
            try {
                const responseJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                const dataJugadores = responseJugadores.data || responseJugadores || [];
                setJugadores(Array.isArray(dataJugadores) ? dataJugadores : []);
            } catch (err) {
                console.log('No hay jugadores todavía', err);
                setJugadores([]);
            }
            
            // Cargar partidas si el torneo tiene ronda actual
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

    const cargarPartidasRonda = async (tId = torneoId, ronda = torneo?.ronda_actual) => {
        try {
            setCargandoPartidas(true);
            const partidas = await torneosSagaApi.obtenerPartidasTorneo(tId, ronda);
            setPartidasGuardadas(partidas);
            console.log('📊 Partidas cargadas:', partidas);
        } catch (err) {
            console.error('Error al cargar partidas:', err);
        } finally {
            setCargandoPartidas(false);
        }
    };

    const handleGenerarEmparejamientos = async () => {
        try {
            if (!torneoId) {
                alert('⚠️ Error: No se encontró el ID del torneo');
                return;
            }

            if (jugadores.length < 2) {
                alert('⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos');
                return;
            }

            const nuevosEmparejamientos = await generarEmparejamientosSuizo(
                torneoId, 
                torneo.ronda_actual || 1,
                jugadores
            );
            
            console.log('🔍 DEBUG - Emparejamientos generados:', nuevosEmparejamientos);
            setEmparejamientos(Array.isArray(nuevosEmparejamientos) ? nuevosEmparejamientos : []);
            
            alert('✅ Emparejamientos generados correctamente');
            
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
                const j1_id = emp.jugador1?.jugador_id || emp.jugador1?.id;
                const j2_id = emp.jugador2 ? (emp.jugador2?.jugador_id || emp.jugador2?.id) : null;
                
                return {
                    mesa: emp.mesa || index + 1,
                    jugador1_id: j1_id,
                    jugador2_id: j2_id,
                    nombre_partida: nombreEscenario,
                    ronda: torneo.ronda_actual
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

            await torneosSagaApi.saveEmparejamientosRondas(
                torneo.id,
                emparejamientosFormateados,
                torneo.ronda_actual
            );

            alert(`✅ ${emparejamientos.length} partidas creadas para la Ronda ${torneo.ronda_actual}\nEscenario: ${nombreEscenario}`);
            await cargarPartidasRonda();
            
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
        return !partida.jugador2_nombre || !partida.jugador2_id || partida.resultado_ps === 'victoria_j1';
    };

    const abrirModalPartida = (partida) => {
        if (!puedeEditarPartidas()) {
            alert('⚠️ El torneo debe estar "En Curso" para poder introducir resultados.\n\nCambia el estado del torneo primero.');
            return;
        }

        if (esBye(partida)) {
            alert('⚠️ Las partidas BYE no se pueden editar.\n\nLa victoria automática de 15 puntos ya está registrada.');
            return;
        }

        setPartidaSeleccionada(partida);
        setModalAbierto(true);
    };

    if (loading) {
        return (
            <div className="vista-emparejamientos">
                <div style={{ textAlign: 'center', padding: '40px' }}>
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
                    <button onClick={cargarDatos} className="btn-secondary" style={{ marginTop: '15px' }}>
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    // ... (continúa desde la parte 1)

    return (
        <div className="vista-emparejamientos">
            {/* HEADER */}
            <div className="section-header" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h2 style={{ margin: '0 0 5px 0' }}>🎲 Emparejamientos</h2>
                        <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}>
                            Ronda {torneo.ronda_actual} de {torneo.rondas_max}
                        </p>
                        {torneo[`partida_ronda_${torneo.ronda_actual}`] && (
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', opacity: 0.9 }}>
                                📋 {torneo[`partida_ronda_${torneo.ronda_actual}`]}
                            </p>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button 
                            onClick={handleGenerarEmparejamientos}
                            className="btn-primary"
                            disabled={jugadores.length < 2 || guardando || partidasGuardadas.length > 0}
                            style={{
                                background: partidasGuardadas.length > 0 ? '#ccc' : 'white',
                                color: partidasGuardadas.length > 0 ? '#666' : '#667eea',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: partidasGuardadas.length > 0 ? 'not-allowed' : 'pointer',
                                fontSize: '1em',
                                fontWeight: 'bold'
                            }}
                        >
                            🎲 Generar Emparejamientos
                        </button>

                        {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                            <button 
                                onClick={guardarResultados}
                                className="btn-success"
                                disabled={guardando}
                                style={{
                                    background: guardando ? '#ccc' : '#4caf50',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: guardando ? 'not-allowed' : 'pointer',
                                    fontSize: '1em',
                                    fontWeight: 'bold'
                                }}
                            >
                                {guardando ? '⏳ Guardando...' : '💾 Guardar en BD'}
                            </button>
                        )}

                        {partidasGuardadas.length > 0 && todasLasPartidasCompletas() && (
                            <button 
                                onClick={generarSiguienteRonda}
                                disabled={torneo.ronda_actual >= torneo.rondas_max}
                                style={{
                                    background: torneo.ronda_actual < torneo.rondas_max ? '#ff9800' : '#ccc',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: torneo.ronda_actual < torneo.rondas_max ? 'pointer' : 'not-allowed',
                                    fontSize: '1em',
                                    fontWeight: 'bold'
                                }}
                            >
                                ⏭️ Generar Ronda {torneo.ronda_actual + 1}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {partidasGuardadas.length > 0 && !puedeEditarPartidas() && (
                <div style={{
                    background: '#fff3e0',
                    border: '2px solid #ff9800',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <p style={{ margin: 0, fontSize: '1em', fontWeight: 'bold', color: '#f57c00' }}>
                        ⚠️ El torneo debe estar en estado "En Curso" para introducir resultados
                    </p>
                </div>
            )}

            {partidasGuardadas.length > 0 && (
                <div style={{
                    background: todasLasPartidasCompletas() ? '#e8f5e9' : '#fff3e0',
                    border: `2px solid ${todasLasPartidasCompletas() ? '#4caf50' : '#ff9800'}`,
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <p style={{ margin: 0, fontSize: '1em', fontWeight: 'bold' }}>
                        {todasLasPartidasCompletas() ? (
                            <>✅ Todas las partidas completadas ({partidasGuardadas.length}/{partidasGuardadas.length})</>
                        ) : (
                            <>⏳ Partidas completadas: {partidasGuardadas.filter(p => p.resultado_ps && p.resultado_ps !== 'pendiente').length}/{partidasGuardadas.length}</>
                        )}
                    </p>
                    {!todasLasPartidasCompletas() && puedeEditarPartidas() && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                            Haz clic en cualquier partida para registrar sus resultados
                        </p>
                    )}
                </div>
            )}

            {error && (
                <div className="error-message" style={{
                    background: '#fee',
                    border: '1px solid #fcc',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    color: '#c33'
                }}>
                    <p>❌ {error}</p>
                </div>
            )}

            {cargandoPartidas && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    ⏳ Cargando partidas...
                </div>
            )}

            {jugadores.length < 2 ? (
                <div className="empty-message">
                    <p>⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos</p>
                </div>
            ) : partidasGuardadas.length === 0 && emparejamientos.length === 0 ? (
                <div className="empty-message">
                    <p>Haz clic en "Generar Emparejamientos" para crear los enfrentamientos de la ronda {torneo.ronda_actual}</p>
                </div>
            ) : (
                <>
                    {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                        <div className="info-box" style={{
                            background: '#e3f2fd',
                            border: '1px solid #2196f3',
                            padding: '10px',
                            borderRadius: '5px',
                            marginBottom: '15px'
                        }}>
                            <p>
                                ℹ️ <strong>{emparejamientos.length} emparejamientos generados.</strong> 
                                {' '}Haz clic en "Guardar en BD" para crear las partidas en la base de datos.
                            </p>
                        </div>
                    )}

                    <div className="emparejamientos-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '20px'
                    }}>
                        {partidasGuardadas.length > 0 ? (
                            partidasGuardadas.map((partida, index) => {
                                const partidaEsBye = esBye(partida);
                                const esPendiente = partida.resultado_ps === 'pendiente';
                                const puedeEditar = puedeEditarPartidas() && !partidaEsBye;

                                return (
                                    <div 
                                        key={partida.id} 
                                        className="emparejamiento-card" 
                                        onClick={() => puedeEditar && abrirModalPartida(partida)}
                                        style={{
                                            border: '2px solid #e0e0e0',
                                            borderRadius: '10px',
                                            padding: '15px',
                                            background: partidaEsBye 
                                                ? '#fff3cd' 
                                                : esPendiente 
                                                    ? '#fff' 
                                                    : '#f0f8f0',
                                            cursor: puedeEditar ? 'pointer' : 'default',
                                            position: 'relative',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (puedeEditar) {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (puedeEditar) {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        {puedeEditar && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                background: '#9c27b0',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75em',
                                                fontWeight: 'bold'
                                            }}>
                                                👆 Click para editar
                                            </div>
                                        )}

                                        <div className="mesa-numero" style={{
                                            background: partidaEsBye 
                                                ? '#ffc107' 
                                                : esPendiente 
                                                    ? '#ff9800' 
                                                    : '#4caf50',
                                            color: partidaEsBye ? '#000' : 'white',
                                            padding: '5px 10px',
                                            borderRadius: '5px',
                                            fontWeight: 'bold',
                                            marginBottom: '10px',
                                            textAlign: 'center'
                                        }}>
                                            Mesa {partida.mesa || index + 1} - {
                                                partidaEsBye 
                                                    ? '⭐ BYE' 
                                                    : esPendiente 
                                                        ? '⏳ Pendiente' 
                                                        : '✅ Completada'
                                            }
                                        </div>

                                        <div className="enfrentamiento" style={{ marginBottom: '15px' }}>
                                            <div className="jugador" style={{ marginBottom: '10px' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                                                    {partida.jugador1_nombre}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '0.9em' }}>
                                                    PT: {partida.puntos_torneo_j1 || 0} | PM: {partida.puntos_masacre_j1 || 0}
                                                </div>
                                            </div>

                                            <div className="vs" style={{ 
                                                fontSize: '1.2em', 
                                                fontWeight: 'bold', 
                                                margin: '10px 0',
                                                textAlign: 'center',
                                                color: '#666'
                                            }}>
                                                VS
                                            </div>

                                            {partida.jugador2_nombre ? (
                                                <div className="jugador">
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                                                        {partida.jugador2_nombre}
                                                    </div>
                                                    <div style={{ color: '#666', fontSize: '0.9em' }}>
                                                        PT: {partida.puntos_torneo_j2 || 0} | PM: {partida.puntos_masacre_j2 || 0}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="jugador bye" style={{ 
                                                    background: '#fff3cd', 
                                                    padding: '10px', 
                                                    borderRadius: '5px',
                                                    textAlign: 'center'
                                                }}>
                                                    <div>⭐ BYE</div>
                                                    <div style={{ fontSize: '0.9em' }}>Victoria automática - 15 PT</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="escenario" style={{
                                            padding: '8px',
                                            background: '#f5f5f5',
                                            borderRadius: '5px',
                                            fontSize: '0.9em',
                                            textAlign: 'center'
                                        }}>
                                            📋 {partida.nombre_partida || 'Escenario por definir'}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            emparejamientos.map((emp, index) => (
                                <div key={index} className="emparejamiento-card" style={{
                                    border: '2px solid #2196f3',
                                    borderRadius: '10px',
                                    padding: '15px',
                                    background: '#f5f5f5'
                                }}>
                                    <div style={{
                                        background: '#2196f3',
                                        color: 'white',
                                        padding: '5px 10px',
                                        borderRadius: '5px',
                                        fontWeight: 'bold',
                                        marginBottom: '10px',
                                        textAlign: 'center'
                                    }}>
                                        Mesa {emp.mesa || index + 1}
                                    </div>
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong>{emp.jugador1?.nombre || emp.jugador1?.jugador_nombre}</strong>
                                    </div>
                                    <div style={{ textAlign: 'center', margin: '10px 0', fontWeight: 'bold' }}>VS</div>
                                    <div>
                                        <strong>{emp.jugador2 ? (emp.jugador2?.nombre || emp.jugador2?.jugador_nombre) : '⭐ BYE'}</strong>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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
                        setModalAbierto(false);
                        setPartidaSeleccionada(null);
                    }}
                />
            )}
        </div>
    );
}

export default VistaEmparejamientos;