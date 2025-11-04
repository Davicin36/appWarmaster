import React, { useState } from 'react';

function VistaEmparejamientos({ 
    torneo, 
    jugadores, 
    emparejamientos, 
    handleGenerarEmparejamientos,
    apiService
}) {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);

    const generarYGuardarEmparejamientos = async () => {
        try {
            setGuardando(true);
            setError(null);

            // 1. Generar emparejamientos localmente
            const nuevosEmparejamientos = handleGenerarEmparejamientos();
            
            // 2. Guardar en la base de datos usando la ronda actual del torneo
            const response = await apiService.saveEmparejamientosRondas(
                torneo.id,
                nuevosEmparejamientos,
                torneo.ronda // ← Tomar la ronda del torneo
            );

            if (response.exito) {
                console.log('✅ Emparejamientos guardados:', response.data);
                alert(`✅ ${response.data.totalPartidas} partidas generadas para la ronda ${torneo.ronda}`);
            } else {
                throw new Error(response.mensaje || 'Error al guardar');
            }
            
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'No se pudieron guardar los emparejamientos');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="vista-emparejamientos">
            <div className="section-header">
                <h2>🎲 Emparejamientos Ronda {torneo.ronda_actual}</h2>
                <button 
                    onClick={generarYGuardarEmparejamientos}
                    className="btn-primary"
                    disabled={jugadores.length < 2 || guardando}
                >
                    {guardando ? '⏳ Guardando...' : '🔄 Generar Emparejamientos'}
                </button>
            </div>

            {error && (
                <div className="error-message" style={{
                    background: '#fee',
                    border: '1px solid #fcc',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px'
                }}>
                    <p>❌ {error}</p>
                </div>
            )}

            {jugadores.length < 2 ? (
                <div className="empty-message">
                    <p>⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos</p>
                </div>
            ) : emparejamientos.length === 0 ? (
                <div className="empty-message">
                    <p>Haz clic en "Generar Emparejamientos" para crear los enfrentamientos de la ronda {torneo.ronda_actual}</p>
                </div>
            ) : (
                <div className="emparejamientos-grid">
                    {Array.isArray(emparejamientos) && emparejamientos.map((emparejamiento) => (
                        <div key={emparejamiento.mesa} className="emparejamiento-card">
                            <div className="mesa-numero">
                                Mesa {emparejamiento.mesa}
                            </div>
                            <div className="enfrentamiento">
                                <div className="jugador">
                                    <span className="jugador-nombre">{emparejamiento.jugador1.nombre}</span>
                                    <span className="jugador-faccion">{emparejamiento.jugador1.ejercito || 'Sin facción'}</span>
                                    <span className="puntos-victoria">{emparejamiento.jugador1.puntosVictoria || 0 }</span>
                                    <span className="puntos-torneo">{emparejamiento.jugador1.puntosTorneo || 0 }</span>
                                    <span className="puntos-masacre">{emparejamiento.jugador1.puntosMasacre || 0 }</span>
                                    <span className="warlord-alive">{emparejamiento.warlord || 0 }</span>
                                </div>
                                <div className="vs">VS</div>
                                {emparejamiento.jugador2 ? (
                                    <div className="jugador">
                                        <span className="jugador-nombre">{emparejamiento.jugador2.nombre}</span>
                                        <span className="jugador-faccion">{emparejamiento.jugador2.ejercito || 'Sin facción'}</span>
                                    </div>
                                ) : (
                                    <div className="jugador bye">
                                        <span className="jugador-nombre">⭐ BYE</span>
                                        <span className="jugador-faccion">Victoria automática</span>
                                    </div>
                                )}
                            </div>
                            <div className="escenario">
                                📋 Escenario: {torneo[`partida_ronda_${torneo.ronda}`] || 'Por definir'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default VistaEmparejamientos;