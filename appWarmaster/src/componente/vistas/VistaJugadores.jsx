import React from 'react';

function VistaJugadores({ 
    torneo, 
    jugadores, 
    eliminarJugador, 
    marcarComoPagado,      // 👈 Recibir como prop
    marcarComoPendiente    // 👈 Recibir como prop
}) 

{
    return (
        <div className="vista-jugadores">
            <h2>👥 Jugadores Inscritos ({jugadores.length} / {torneo?.participantes_max || 0})</h2>
            {jugadores.length === 0 ? (
                <div className="empty-message">
                    <p>No hay jugadores inscritos todavía</p>
                </div>
            ) : (
                <div className="tabla-jugadores-container">
                    <table className="tabla-jugadores-detalle">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nombre</th>
                                <th>Club</th>
                                <th>Facción</th>
                                <th>Composición</th>
                                <th>Estado Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jugadores.map((jugador, index) => {
                                const nombreCompleto = `${jugador.jugador_nombre} ${jugador.jugador_apellidos}`;
                                
                                return (
                                    <tr key={jugador.id}>
                                        <td>{index + 1}</td>
                                        <td className="nombre-jugador-completo">
                                            <strong>{nombreCompleto}</strong>
                                        </td>
                                        <td>{jugador.club || '-'}</td>
                                        <td>{jugador.faccion}</td>
                                        <td>{jugador.composicion_ejercito}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.85em',
                                                fontWeight: 'bold',
                                                background: jugador.pagado === 'pagado' ? '#4caf50' : '#ff9800',
                                                color: 'white',
                                                display: 'inline-block'
                                            }}>
                                                {jugador.pagado === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {/* Botón dinámico según estado */}
                                                {jugador.pagado === 'pendiente' ? (
                                                    <button
                                                        onClick={() => marcarComoPagado(
                                                            jugador.jugador_id, 
                                                            nombreCompleto
                                                        )}
                                                        style={{
                                                            background: '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85em'
                                                        }}
                                                    >
                                                        💰 Marcar pagado
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => marcarComoPendiente(
                                                            jugador.jugador_id, 
                                                            nombreCompleto
                                                        )}
                                                        style={{
                                                            background: '#ff9800',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85em'
                                                        }}
                                                    >
                                                        ⏳ Marcar pendiente
                                                    </button>
                                                )}
                                                
                                                {/* Botón eliminar */}
                                                <button
                                                    onClick={() => eliminarJugador(
                                                        jugador.id, 
                                                        nombreCompleto
                                                    )}
                                                    style={{
                                                        background: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85em'
                                                    }}
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default VistaJugadores;