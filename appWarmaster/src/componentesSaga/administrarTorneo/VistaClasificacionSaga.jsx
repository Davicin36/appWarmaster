import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import torneosSagaApi from '@/servicios/apiSaga';

import '@/estilos/vistasTorneos/vistaClasificacion.css';

function VistaClasificacionSaga({ torneoId: propTorneoId }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [clasificacion, setClasificacion] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (torneoId) {
            cargarClasificacion();
        }
    }, [torneoId]);

    const cargarClasificacion = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await torneosSagaApi.obtenerClasificacion(torneoId);
            
            let dataClasificacion = [];
            if (Array.isArray(response)) {
                dataClasificacion = response;
            } else if (response.data && Array.isArray(response.data)) {
                dataClasificacion = response.data;
            }
            
            const clasificacionOrdenada = dataClasificacion.sort((a, b) => {
                if (b.puntos_victoria_totales !== a.puntos_victoria_totales) {
                    return b.puntos_victoria_totales - a.puntos_victoria_totales;
                }
                if (b.puntos_torneo_totales !== a.puntos_torneo_totales) {
                    return b.puntos_torneo_totales - a.puntos_torneo_totales;
                }
                if (b.puntos_masacre_totales !== a.puntos_masacre_totales) {
                    return b.puntos_masacre_totales - a.puntos_masacre_totales;
                }
                return b.warlord_muerto_totales - a.warlord_muerto_totales;
            });
            
            setClasificacion(clasificacionOrdenada);
            
        } catch (err) {
            console.error('Error al cargar clasificación:', err);
            setError('No se pudo cargar la clasificación');
            setClasificacion([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="vista-clasificacion">
                <div className="loading-message">
                    ⏳ Cargando clasificación...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vista-clasificacion">
                <div className="error-message">
                    ⚠️ {error}
                    <button onClick={cargarClasificacion} className="btn-secondary">
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="vista-clasificacion">
            <div className="clasificacion-header">
                <h2>🏆 Clasificación del Torneo</h2>
                <button 
                    onClick={cargarClasificacion}
                    className="btn-actualizar-clasificacion"
                    disabled={loading}
                >
                   {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
                </button>
            </div>

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
                            <th>Partidas Jugadas</th>
                            <th>Pts Torneo</th>
                            <th>Pts Masacre</th>
                            <th>Warlords Asesinados</th>
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
                                <td className="nombre-jugador">{jugador.jugador_nombre || jugador.nombre}</td>
                                <td>{jugador.club || '-'}</td>
                                <td>{jugador.faccion || '-'}</td>
                                <td>{jugador.partidas_jugadas || 0}</td>
                                <td>{jugador.puntos_torneo_totales || 0}</td>
                                <td>{jugador.puntos_masacre_totales || 0}</td>
                                <td>{jugador.warlord_muerto_totales}</td>
                                <td className="puntos-destacado">{jugador.puntos_victoria_totales || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default VistaClasificacionSaga;