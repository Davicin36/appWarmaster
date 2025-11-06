import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import torneosSagaApi from '../../servicios/apiSaga';

function VistaEmparejamientos({ 
    torneo, 
    jugadores, 
    emparejamientos, 
    handleGenerarEmparejamientos
}) {
    const navigate = useNavigate();
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [partidasGuardadas, setPartidasGuardadas] = useState([]);
    const [cargandoPartidas, setCargandoPartidas] = useState(false);

    // Cargar partidas de la ronda actual
    useEffect(() => {
        if (torneo?.id && torneo?.ronda_actual) {
            cargarPartidasRonda();
        }
    }, [torneo?.id, torneo?.ronda_actual]);

    const cargarPartidasRonda = async () => {
        try {
            setCargandoPartidas(true);
            const response = await torneosSagaApi.obtenerPartidasTorneo()
            
            const partidas = response.data?.partidas || response.partidas || [];
            setPartidasGuardadas(partidas);
            console.log('📊 Partidas cargadas:', partidas);
        } catch (err) {
            console.error('Error al cargar partidas:', err);
        } finally {
            setCargandoPartidas(false);
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

            const confirmar = window.confirm(
                `¿Guardar ${emparejamientos.length} emparejamientos para la Ronda ${torneo.ronda_actual}?\n\n` +
                `Esto guardará las partidas en la base de datos.`
            );
            
            if (!confirmar) return;

            // Formatear emparejamientos para el backend
            const emparejamientosFormateados = emparejamientos.map((emp, index) => ({
                mesa: emp.mesa || index + 1,
                jugador1_id: emp.jugador1?.id,
                jugador2_id: emp.jugador2?.id || null,
            }));

            // Guardar en la base de datos
            await torneosSagaApi.registrarPartida()

            alert(`✅ ${emparejamientos.length} partidas creadas para la Ronda ${torneo.ronda_actual}`);
            
            // Recargar partidas
            await cargarPartidasRonda();
            
        } catch (err) {
            console.error('❌ Error al guardar:', err);
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

            // Actualizar ronda del torneo
            await torneosSagaApi.request(`/torneosSaga/${torneo.id}`, {
                method: 'PUT',
                body: {
                    ronda_actual: torneo.ronda_actual + 1
                }
            });

            // Generar nuevos emparejamientos
            await handleGenerarEmparejamientos();

            alert(`✅ Emparejamientos para Ronda ${torneo.ronda_actual + 1} generados`);

        } catch (err) {
            console.error('Error:', err);
            alert(`❌ Error al generar siguiente ronda: ${err.message}`);
        }
    };

    // Verificar si todas las partidas tienen resultados
    const todasLasPartidasCompletas = () => {
        if (partidasGuardadas.length === 0) return false;
        
        return partidasGuardadas.every(partida => 
            partida.resultado_cr && 
            partida.resultado_cr !== 'pendiente' &&
            partida.resultado_cr !== null
        );
    };

    const irAGestionPartida = () => {
        navigate(`/torneos/${torneo.id}/gestion-partida`);
    };

    return (
        <div className="vista-emparejamientos">
            <div className="section-header">
                <h2>🎲 Emparejamientos Ronda {torneo.ronda_actual} / {torneo.rondas_max}</h2>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {/* BOTÓN 1: GENERAR EMPAREJAMIENTOS */}
                    <button 
                        onClick={handleGenerarEmparejamientos}
                        className="btn-primary"
                        disabled={jugadores.length < 2 || guardando || partidasGuardadas.length > 0}
                        style={{
                            background: partidasGuardadas.length > 0 ? '#ccc' : '#2196f3',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: partidasGuardadas.length > 0 ? 'not-allowed' : 'pointer',
                            fontSize: '1em'
                        }}
                    >
                        🎲 Generar Emparejamientos
                    </button>

                    {/* BOTÓN 2: GUARDAR EN BD */}
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

                    {/* BOTÓN 3: GESTIÓN DE PARTIDAS */}
                    {partidasGuardadas.length > 0 && (
                        <button 
                            onClick={irAGestionPartida}
                            style={{
                                background: '#9c27b0',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '1em',
                                fontWeight: 'bold'
                            }}
                        >
                            ⚔️ Gestión de Partidas
                        </button>
                    )}

                    {/* BOTÓN 4: GENERAR SIGUIENTE RONDA */}
                    {partidasGuardadas.length > 0 && (
                        <button 
                            onClick={generarSiguienteRonda}
                            disabled={!todasLasPartidasCompletas() || torneo.ronda_actual >= torneo.rondas_max}
                            style={{
                                background: todasLasPartidasCompletas() && torneo.ronda_actual < torneo.rondas_max 
                                    ? '#ff9800' 
                                    : '#ccc',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: todasLasPartidasCompletas() && torneo.ronda_actual < torneo.rondas_max
                                    ? 'pointer' 
                                    : 'not-allowed',
                                fontSize: '1em',
                                fontWeight: 'bold'
                            }}
                        >
                            ⏭️ Generar Ronda {torneo.ronda_actual + 1}
                        </button>
                    )}
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
                            <>✅ Todas las partidas completadas ({partidasGuardadas.length}/{partidasGuardadas.length})</>
                        ) : (
                            <>⏳ Partidas completadas: {partidasGuardadas.filter(p => p.resultado_cr && p.resultado_cr !== 'pendiente').length}/{partidasGuardadas.length}</>
                        )}
                    </p>
                    {!todasLasPartidasCompletas() && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                            Ve a "Gestión de Partidas" para registrar los resultados
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
                        {/* Mostrar partidas guardadas */}
                        {partidasGuardadas.length > 0 ? (
                            partidasGuardadas.map((partida, index) => (
                                <div key={partida.id} className="emparejamiento-card" style={{
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    padding: '15px',
                                    background: partida.resultado_cr === 'pendiente' ? '#fff' : '#f0f8f0'
                                }}>
                                    <div className="mesa-numero" style={{
                                        background: partida.resultado_cr === 'pendiente' ? '#ff9800' : '#4caf50',
                                        color: 'white',
                                        padding: '5px 10px',
                                        borderRadius: '5px',
                                        fontWeight: 'bold',
                                        marginBottom: '10px',
                                        textAlign: 'center'
                                    }}>
                                        Mesa {index + 1} - {partida.resultado_cr === 'pendiente' ? '⏳ Pendiente' : '✅ Completada'}
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
                                                <div style={{ fontSize: '0.9em' }}>Victoria automática</div>
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
                                        📋 {torneo[`partida_ronda_${torneo.ronda_actual}`] || 'Escenario por definir'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Mostrar emparejamientos generados pero no guardados
                            Array.isArray(emparejamientos) && emparejamientos.map((emparejamiento) => (
                                <div key={emparejamiento.mesa} className="emparejamiento-card" style={{
                                    border: '2px dashed #2196f3',
                                    borderRadius: '10px',
                                    padding: '15px',
                                    background: '#f9f9f9'
                                }}>
                                    <div className="mesa-numero" style={{
                                        background: '#2196f3',
                                        color: 'white',
                                        padding: '5px 10px',
                                        borderRadius: '5px',
                                        fontWeight: 'bold',
                                        marginBottom: '10px',
                                        textAlign: 'center'
                                    }}>
                                        Mesa {emparejamiento.mesa}
                                    </div>
                                    <div className="enfrentamiento" style={{ marginBottom: '15px' }}>
                                        <div className="jugador" style={{ marginBottom: '10px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                                                {emparejamiento.jugador1.nombre}
                                            </div>
                                            <div style={{ color: '#666', fontSize: '0.9em' }}>
                                                {emparejamiento.jugador1.ejercito || 'Sin facción'}
                                            </div>
                                            <div style={{ color: '#888', fontSize: '0.85em' }}>
                                                PT: {emparejamiento.jugador1.puntosTorneo || 0}
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
                                        {emparejamiento.jugador2 ? (
                                            <div className="jugador">
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                                                    {emparejamiento.jugador2.nombre}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '0.9em' }}>
                                                    {emparejamiento.jugador2.ejercito || 'Sin facción'}
                                                </div>
                                                <div style={{ color: '#888', fontSize: '0.85em' }}>
                                                    PT: {emparejamiento.jugador2.puntosTorneo || 0}
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
                                                <div style={{ fontSize: '0.9em' }}>Victoria automática</div>
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
                                        📋 {torneo[`partida_ronda_${torneo.ronda_actual}`] || 'Por definir'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default VistaEmparejamientos;