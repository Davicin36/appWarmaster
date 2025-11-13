import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '../servicios/apiSaga';

function VerEmparejamientos({ torneoId: propTorneoId }) {
    
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [todasLasPartidas, setTodasLasPartidas] = useState([]); // ⬅️ TODAS las partidas
    const [rondasExpandidas, setRondasExpandidas] = useState({}); // ⬅️ Control de acordeones
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
            
            // Cargar TODAS las partidas del torneo
            await cargarTodasLasPartidas(dataTorneo.id);
            
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('No se pudieron cargar los datos del torneo');
        } finally {
            setLoading(false);
        }
    };

    const cargarTodasLasPartidas = async (tId) => {
        try {
            const partidas = await torneosSagaApi.obtenerPartidasTorneo(tId); // Sin filtro de ronda
            setTodasLasPartidas(Array.isArray(partidas) ? partidas : []);
            console.log('📊 Todas las partidas cargadas:', partidas);
        } catch (err) {
            console.error('Error al cargar partidas:', err);
            setTodasLasPartidas([]);
        }
    };

    // Agrupar partidas por ronda
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

    // Toggle acordeón
    const toggleRonda = (ronda) => {
        setRondasExpandidas(prev => ({
            ...prev,
            [ronda]: !prev[ronda]
        }));
    };

    const esBye = (partida) => {
        return !partida.jugador2_nombre || !partida.jugador2_id || partida.es_bye;
    };

    // Renderizar partidas
    const renderPartidas = (partidas) => {
        return partidas.map((partida, index) => {
            const partidaEsBye = esBye(partida);
            const estaConfirmado = partida.resultado_confirmado;

            return (
                <div 
                    key={partida.id} 
                    className="emparejamiento-card" 
                    style={{
                        border: `2px solid ${estaConfirmado ? '#4caf50' : '#ff9800'}`,
                        borderRadius: '10px',
                        padding: '15px',
                        background: estaConfirmado ? '#e8f5e9' : '#fff',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {/* HEADER DE MESA */}
                    <div className="mesa-numero" style={{
                        background: estaConfirmado ? '#4caf50' : '#ff9800',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        marginBottom: '15px',
                        textAlign: 'center',
                        fontSize: '1em'
                    }}>
                        Mesa {partida.mesa || index + 1}{partidaEsBye ? ' ⭐ BYE' : ''} - {
                            estaConfirmado ? '✅ CONFIRMADA' : '⏳ PENDIENTE'
                        }
                    </div>

                    {/* ENFRENTAMIENTO */}
                    <div className="enfrentamiento" style={{ marginBottom: '15px' }}>
                        {/* JUGADOR 1 */}
                        <div className="jugador" style={{ 
                            marginBottom: '15px',
                            padding: '10px',
                            background: estaConfirmado && partida.resultado_ps === 'victoria_j1' 
                                ? '#e8f5e9' 
                                : 'transparent',
                            borderRadius: '5px',
                            border: estaConfirmado && partida.resultado_ps === 'victoria_j1' 
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
                                {estaConfirmado && partida.resultado_ps === 'victoria_j1' && (
                                    <span style={{ fontSize: '1.2em' }}>👑</span>
                                )}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.9em' }}>
                                PV: {partida.puntos_victoria_j1 || 0} | 
                                PT: {partida.puntos_torneo_j1 || 0} | 
                                PM: {partida.puntos_masacre_j1 || 0}
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
                                background: estaConfirmado && partida.resultado_ps === 'victoria_j2' 
                                    ? '#e8f5e9' 
                                    : 'transparent',
                                borderRadius: '5px',
                                border: estaConfirmado && partida.resultado_ps === 'victoria_j2' 
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
                                    {estaConfirmado && partida.resultado_ps === 'victoria_j2' && (
                                        <span style={{ fontSize: '1.2em' }}>👑</span>
                                    )}
                                </div>
                                <div style={{ color: '#666', fontSize: '0.9em' }}>
                                    PV: {partida.puntos_victoria_j2 || 0} | 
                                    PT: {partida.puntos_torneo_j2 || 0} | 
                                    PM: {partida.puntos_masacre_j2 || 0}
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
                                    Victoria automática - 10 PT
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RESULTADO (si es empate) */}
                    {estaConfirmado && partida.resultado_ps === 'empate' && (
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
        });
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

    const grupos = partidasPorRonda();
    const rondas = Object.keys(grupos).sort((a, b) => b - a); // Orden descendente (más reciente primero)

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
                            {torneo.nombre}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', opacity: 0.9 }}>
                            Ronda actual: {torneo.ronda_actual || 1} de {torneo.rondas_max}
                        </p>
                    </div>
                    
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

            {/* CONTENIDO */}
            {todasLasPartidas.length === 0 ? (
                <div className="empty-message" style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f5f5f5',
                    borderRadius: '10px',
                    color: '#666'
                }}>
                    <h3 style={{ fontSize: '2em', marginBottom: '15px' }}>🎲</h3>
                    <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>
                        Todavía no hay partidas en este torneo
                    </p>
                    <p style={{ fontSize: '0.95em' }}>
                        Las partidas aparecerán aquí cuando el organizador genere los emparejamientos
                    </p>
                </div>
            ) : (
                <div>
                    <h3 style={{ 
                        fontSize: '1.5em', 
                        marginBottom: '20px',
                        color: '#667eea'
                    }}>
                        📜 Todas las Rondas
                    </h3>
                    
                    {rondas.map(ronda => {
                        const partidasRonda = grupos[ronda] || [];
                        const expandida = rondasExpandidas[ronda];
                        const esRondaActual = parseInt(ronda) === torneo.ronda_actual && torneo.estado === 'en_curso';
                        
                        return (
                            <div key={ronda} style={{ marginBottom: '15px' }}>
                                <div 
                                    onClick={() => toggleRonda(ronda)}
                                    style={{
                                        background: esRondaActual 
                                            ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        padding: '15px 20px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: '1.2em' }}>
                                            Ronda {ronda} {esRondaActual && '🔴 EN CURSO'}
                                        </strong>
                                        <span style={{ marginLeft: '15px', opacity: 0.9 }}>
                                            {partidasRonda.length} partidas
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '1.5em' }}>
                                        {expandida ? '▼' : '▶'}
                                    </div>
                                </div>
                                
                                {expandida && (
                                    <div className="emparejamientos-grid" style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                        gap: '20px',
                                        marginTop: '15px',
                                        padding: '15px',
                                        background: '#f5f5f5',
                                        borderRadius: '0 0 10px 10px'
                                    }}>
                                        {renderPartidas(partidasRonda)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default VerEmparejamientos;