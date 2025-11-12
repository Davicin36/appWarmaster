import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '../servicios/apiSaga';

function VerEmparejamientos({ torneoId: propTorneoId }) {
    
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [partidasGuardadas, setPartidasGuardadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


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

    const cargarPartidasRonda = async (tId, ronda) => {
        try {
            const partidas = await torneosSagaApi.obtenerPartidasTorneo(tId, ronda);
            setPartidasGuardadas(Array.isArray(partidas) ? partidas : []);
            console.log('📊 Partidas cargadas:', partidas);
        } catch (err) {
            console.error('Error al cargar partidas:', err);
            setPartidasGuardadas([]);
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

    const esBye = (partida) => {
        return !partida.jugador2_nombre || !partida.jugador2_id || partida.resultado_ps === 'victoria_j1';
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

    if (error) {
        return (
            <div className="vista-emparejamientos">
                <div className="error-message" style={{ margin: '20px' }}>
                    ⚠️ {error}
                    <button onClick={cargarDatos} className="btn-secondary" style={{ marginTop: '15px' }}>
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!torneo) {
        return (
            <div className="vista-emparejamientos">
                <div className="error-message">
                    ⚠️ No se pudo cargar la información del torneo
                </div>
            </div>
        );
    }

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
                        <h2 style={{ margin: '0 0 5px 0' }}>🎲 Emparejamientos y Resultados</h2>
                        <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}>
                            Ronda {torneo.ronda_actual || 1} de {torneo.rondas_max}
                        </p>
                        {torneo[`partida_ronda_${torneo.ronda_actual || 1}`] && (
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', opacity: 0.9 }}>
                                📋 Escenario: {torneo[`partida_ronda_${torneo.ronda_actual || 1}`]}
                            </p>
                        )}
                    </div>
                    
                    {/* Botón actualizar */}
                    <button 
                        onClick={cargarDatos}
                        style={{
                            background: 'white',
                            color: '#667eea',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '1em',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Actualizar
                    </button>
                </div>
            </div>

            {/* INDICADOR DE PROGRESO */}
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
                            <>✅ Ronda completada - Todas las partidas finalizadas ({partidasGuardadas.length}/{partidasGuardadas.length})</>
                        ) : (
                            <>⏳ Ronda en curso - Partidas completadas: {partidasGuardadas.filter(p => p.resultado_ps && p.resultado_ps !== 'pendiente').length}/{partidasGuardadas.length}</>
                        )}
                    </p>
                </div>
            )}

            {/* CONTENIDO */}
            {partidasGuardadas.length === 0 ? (
                <div className="empty-message" style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f5f5f5',
                    borderRadius: '10px',
                    color: '#666'
                }}>
                    <h3 style={{ fontSize: '2em', marginBottom: '15px' }}>🎲</h3>
                    <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>
                        Todavía no hay emparejamientos para esta ronda
                    </p>
                    <p style={{ fontSize: '0.95em' }}>
                        Los emparejamientos aparecerán aquí cuando el organizador los genere
                    </p>
                </div>
            ) : (
                <div className="emparejamientos-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px'
                }}>
                    {partidasGuardadas.map((partida, index) => {
                        const partidaEsBye = esBye(partida);
                        const esPendiente = partida.resultado_ps === 'pendiente';
                        const estaCompletada = !esPendiente && !partidaEsBye;

                        return (
                            <div 
                                key={partida.id} 
                                className="emparejamiento-card" 
                                style={{
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    padding: '15px',
                                    background: partidaEsBye 
                                        ? '#fff3cd' 
                                        : esPendiente 
                                            ? '#fff' 
                                            : '#f0f8f0',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* MESA Y ESTADO */}
                                <div className="mesa-numero" style={{
                                    background: partidaEsBye 
                                        ? '#ffc107' 
                                        : esPendiente 
                                            ? '#ff9800' 
                                            : '#4caf50',
                                    color: partidaEsBye ? '#000' : 'white',
                                    padding: '8px 12px',
                                    borderRadius: '5px',
                                    fontWeight: 'bold',
                                    marginBottom: '15px',
                                    textAlign: 'center',
                                    fontSize: '1em'
                                }}>
                                    Mesa {partida.mesa || index + 1} - {
                                        partidaEsBye 
                                            ? '⭐ BYE' 
                                            : esPendiente 
                                                ? '⏳ Pendiente' 
                                                : '✅ Completada'
                                    }
                                </div>

                                {/* ENFRENTAMIENTO */}
                                <div className="enfrentamiento" style={{ marginBottom: '15px' }}>
                                    {/* JUGADOR 1 */}
                                    <div className="jugador" style={{ 
                                        marginBottom: '15px',
                                        padding: '10px',
                                        background: estaCompletada && partida.resultado_ps === 'victoria_j1' 
                                            ? '#e8f5e9' 
                                            : 'transparent',
                                        borderRadius: '5px',
                                        border: estaCompletada && partida.resultado_ps === 'victoria_j1' 
                                            ? '2px solid #4caf50' 
                                            : '1px solid #e0e0e0'
                                    }}>
                                        <div style={{ 
                                            fontWeight: 'bold', 
                                            fontSize: '1.1em',
                                            marginBottom: '5px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>{partida.jugador1_nombre}</span>
                                            {estaCompletada && partida.resultado_ps === 'victoria_j1' && (
                                                <span style={{ fontSize: '1.2em' }}>👑</span>
                                            )}
                                        </div>
                                        <div style={{ color: '#666', fontSize: '0.9em' }}>
                                            PT: {partida.puntos_torneo_j1 || 0} | PM: {partida.puntos_masacre_j1 || 0}
                                        </div>
                                    </div>

                                    {/* VS */}
                                    <div className="vs" style={{ 
                                        fontSize: '1.2em', 
                                        fontWeight: 'bold', 
                                        margin: '10px 0',
                                        textAlign: 'center',
                                        color: '#999'
                                    }}>
                                        VS
                                    </div>

                                    {/* JUGADOR 2 O BYE */}
                                    {partida.jugador2_nombre ? (
                                        <div className="jugador" style={{ 
                                            padding: '10px',
                                            background: estaCompletada && partida.resultado_ps === 'victoria_j2' 
                                                ? '#e8f5e9' 
                                                : 'transparent',
                                            borderRadius: '5px',
                                            border: estaCompletada && partida.resultado_ps === 'victoria_j2' 
                                                ? '2px solid #4caf50' 
                                                : '1px solid #e0e0e0'
                                        }}>
                                            <div style={{ 
                                                fontWeight: 'bold', 
                                                fontSize: '1.1em',
                                                marginBottom: '5px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span>{partida.jugador2_nombre}</span>
                                                {estaCompletada && partida.resultado_ps === 'victoria_j2' && (
                                                    <span style={{ fontSize: '1.2em' }}>👑</span>
                                                )}
                                            </div>
                                            <div style={{ color: '#666', fontSize: '0.9em' }}>
                                                PT: {partida.puntos_torneo_j2 || 0} | PM: {partida.puntos_masacre_j2 || 0}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="jugador bye" style={{ 
                                            background: '#fff3cd', 
                                            padding: '15px', 
                                            borderRadius: '5px',
                                            textAlign: 'center',
                                            border: '2px dashed #ffc107'
                                        }}>
                                            <div style={{ fontSize: '1.5em', marginBottom: '5px' }}>⭐</div>
                                            <div style={{ fontWeight: 'bold' }}>BYE</div>
                                            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>
                                                Victoria automática - 15 PT
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RESULTADO (si es empate) */}
                                {estaCompletada && partida.resultado_ps === 'empate' && (
                                    <div style={{
                                        background: '#e3f2fd',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        textAlign: 'center',
                                        marginBottom: '10px',
                                        border: '2px solid #2196f3',
                                        fontWeight: 'bold',
                                        color: '#1976d2'
                                    }}>
                                        🤝 EMPATE
                                    </div>
                                )}

                                {/* ESCENARIO */}
                                <div className="escenario" style={{
                                    padding: '10px',
                                    background: '#f5f5f5',
                                    borderRadius: '5px',
                                    fontSize: '0.9em',
                                    textAlign: 'center',
                                    color: '#666'
                                }}>
                                    📋 {partida.nombre_partida || 'Escenario por definir'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default VerEmparejamientos;