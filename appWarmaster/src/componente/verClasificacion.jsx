import React, { useState, useEffect } from 'react';
import {  useParams } from 'react-router-dom';

import torneosSagaApi from '../../servicios/apiSaga';

function VerClasificacion({ torneoId: propTorneoId }) {
    // Obtener torneoId de props o de URL
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
            
            const response = await torneosSagaApi.obtenerClasificacionTorneo(torneoId);
            
            let dataClasificacion = [];
            if (Array.isArray(response)) {
                dataClasificacion = response;
            } else if (response.data && Array.isArray(response.data)) {
                dataClasificacion = response.data;
            } else if (response.clasificacion && Array.isArray(response.clasificacion)) {
                dataClasificacion = response.clasificacion;
            }
            
            setClasificacion(dataClasificacion);
            
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
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    ⏳ Cargando clasificación...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vista-clasificacion">
                <div className="error-message" style={{ margin: '20px' }}>
                    ⚠️ {error}
                    <button 
                        onClick={cargarClasificacion}
                        className="btn-secondary"
                        style={{ marginTop: '15px' }}
                    >
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="vista-clasificacion">
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2>🏆 Clasificación del Torneo</h2>
                <button 
                    onClick={cargarClasificacion}
                    className="btn-primary"
                    disabled={loading}
                >
                    🔄 Actualizar
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

export default VerClasificacion;