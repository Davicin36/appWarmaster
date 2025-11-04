import React from 'react';

function VistaJugadores({ torneo, jugadores, eliminarJugador }) {
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
                                <th>Organización Banda</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jugadores.map((jugador, index) => (
                                <tr key={jugador.id}>
                                    <td>{index + 1}</td>
                                    <td className="nombre-jugador-completo">
                                        <strong>{jugador.nombre}</strong>
                                    </td>
                                    <td>{jugador.club}</td>
                                    <td>{jugador.ejercito}</td>
                                    <td>{jugador.banda}</td>
                                    <td>
                                        <button
                                            onClick={() => eliminarJugador(jugador.id, jugador.nombre)}
                                            className="btn-danger-small"
                                            style={{
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.9em'
                                            }}
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default VistaJugadores;