import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosWarmasterApi from '@/servicios/apiWarmaster';

import '@/estilos/vistasTorneos/vistaClasificacion.css';

function VistaClasificacionSaga({ torneoId: propTorneoId }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [clasificacionIndividual, setClasificacionIndividual] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (torneoId) {
            cargarDatos();
        }
    }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Cargar clasificación individual
            await cargarClasificacionIndividual();
            
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const cargarClasificacionIndividual = async () => {
        try {
            const response = await torneosWarmasterApi.obtenerClasificacionIndividual(torneoId);
            
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
                if (b.puntos_masacre_totales !== a.puntos_masacre_totales) {
                    return b.puntos_masacre_totales - a.puntos_masacre_totales;
                }
            });
            
            setClasificacionIndividual(clasificacionOrdenada);
            
        } catch (err) {
            console.error('Error al cargar clasificación individual:', err);
            setClasificacionIndividual([]);
        }
    };

   const renderClasificacionIndividual = () => {
    if (clasificacionIndividual.length === 0) {
        return (
            <div className="empty-message">
                <p>📊 No hay clasificación individual disponible todavía</p>
            </div>
        );
    }

    return (
        <table className="tabla-clasificacion">
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Jugador</th>
                    <th>Club</th>
                    <th>Ejercito</th>
                    <th>PJ</th>
                    <th>PG</th>
                    <th>PE</th>
                     <th>PP</th>
                    <th>Pts Masacre</th>
                    <th>Pts Victoria</th>
                </tr>
            </thead>
            <tbody>
                {clasificacionIndividual.map((jugador, index) => (
                    <tr key={`jugador-${jugador.jugador_id || index}-${jugador.torneo_id || torneoId}`} className={index < 3 ? `top-${index + 1}` : ''}>
                        <td className="posicion">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && index + 1}
                        </td>
                        <td className="nombre-jugador">
                            {jugador.jugador_nombre || jugador.nombre}
                            {jugador.jugador_apellidos && ` ${jugador.jugador_apellidos}`}
                        </td>
                        <td>{jugador.club || '-'}</td>
                        <td>{jugador.ejercito}</td>
                        <td>{jugador.partidas_jugadas || 0}</td>
                         <td>{jugador.partidas_ganadas || 0}</td>
                        <td>{jugador.partidas_empatadas || 0}</td>
                        <td>{jugador.partidas_perdidas || 0}</td>
                        <td>{jugador.puntos_masacre_totales || 0}</td>
                        <td className="puntos-destacado">{jugador.puntos_victoria_totales || 0}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
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
                    <button onClick={cargarDatos} className="btn-secondary">
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
                    onClick={cargarDatos}
                    className="btn-actualizar-clasificacion"
                    disabled={loading}
                >
                   {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
                </button>
            </div>
            <div className="clasificacion-contenido">
                {renderClasificacionIndividual()}
            </div>
        </div>
    );
}

export default VistaClasificacionSaga;