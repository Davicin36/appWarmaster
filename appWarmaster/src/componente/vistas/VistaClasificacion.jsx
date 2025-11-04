import React from 'react';

function VistaClasificacion({ clasificacion }) {
    return (
        <div className="vista-clasificacion">
            <h2>🏆 Clasificación del Torneo</h2>
            {clasificacion.length === 0 ? (
                <div className="empty-message">
                    <p>📊 No hay clasificación disponible todavía</p>
                </div>
            ) : (
                <table className="tabla-clasificacion">
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Jugador</th>
                            <th>Club</th>
                            <th>Facción</th>
                            <th>Pts Masacre</th>
                            <th>Pts Torneo</th>
                            <th>Pts Victoria</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clasificacion.map((jugador, index) => (
                            <tr key={jugador.jugador_id} className={index < 3 ? `top-${index + 1}` : ''}>
                                <td className="posicion">
                                    {index === 0 && '🥇'}
                                    {index === 1 && '🥈'}
                                    {index === 2 && '🥉'}
                                    {index > 2 && index + 1}
                                </td>
                                <td className="nombre-jugador">{jugador.nombre_completo || jugador.nombre}</td>
                                <td>{jugador.club || '-'}</td>
                                <td>{jugador.faccion || '-'}</td>
                                <td>{jugador.puntos_masacre || 0}</td>
                                <td>{jugador.puntos_torneo || 0}</td>
                                <td className="puntos-destacado">{jugador.puntos_victoria || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default VistaClasificacion;