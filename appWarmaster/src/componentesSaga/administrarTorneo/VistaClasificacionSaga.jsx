import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '@/servicios/apiSaga';

import '@/estilos/vistasTorneos/vistaClasificacion.css';

function VistaClasificacionSaga({ torneoId: propTorneoId }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [clasificacionIndividual, setClasificacionIndividual] = useState([]);
    const [clasificacionEquipos, setClasificacionEquipos] = useState([]);
    const [vistaActual, setVistaActual] = useState('individual'); // 'individual' o 'equipos'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const esTorneoEquipos = () => torneo?.tipo_torneo === 'Por equipos';

    useEffect(() => {
        if (torneo && torneo.tipo_torneo === 'Por equipos') {
            setVistaActual('equipos');
        }
    }, [torneo]);

    useEffect(() => {
        if (torneoId) {
            cargarDatos();
        }
    }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Cargar datos del torneo
            const responseTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);
            
            // Cargar clasificación individual
            await cargarClasificacionIndividual();
            
            // Si es torneo por equipos, cargar también clasificación de equipos
            if (dataTorneo.tipo_torneo === 'Por equipos') {
                await cargarClasificacionEquipos();
            }
            
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const cargarClasificacionIndividual = async () => {
        try {
            const response = await torneosSagaApi.obtenerClasificacionIndividual(torneoId);
            
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
            
            setClasificacionIndividual(clasificacionOrdenada);
            
        } catch (err) {
            console.error('Error al cargar clasificación individual:', err);
            setClasificacionIndividual([]);
        }
    };

    const cargarClasificacionEquipos = async () => {
        try {
            const response = await torneosSagaApi.obtenerClasificacionEquipos(torneoId);
           
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
                return b.warlord_muerto - a.warlord_muerto;
            });
            
            setClasificacionEquipos(clasificacionOrdenada);
            
        } catch (err) {
            console.error('Error al cargar clasificación de equipos:', err);
            setClasificacionEquipos([]);
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
                    {esTorneoEquipos() && <th>Equipo</th>}
                    <th>Alias</th>
                    <th>Club</th>
                    <th>Facción</th>
                    <th>Epocas</th>
                    <th>PJ</th>
                    <th>PG</th>
                    <th>PE</th>
                     <th>PP</th>
                    <th>Pts Torneo</th>
                    <th>Pts Masacre</th>
                    <th>Warlords</th>
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
                        {esTorneoEquipos() && (
                            <td>{jugador.nombre_equipo || '-'}</td>
                        )}
                        <td>{jugador.nombre_alias || '-'}</td>
                        <td>{jugador.club || '-'}</td>
                        <td>{jugador.faccion || '-'}</td>
                        <td>{jugador.epoca}</td>
                        <td>{jugador.partidas_jugadas || 0}</td>
                         <td>{jugador.partidas_ganadas || 0}</td>
                        <td>{jugador.partidas_empatadas || 0}</td>
                        <td>{jugador.partidas_perdidas || 0}</td>
                        <td>{jugador.puntos_torneo_totales || 0}</td>
                        <td>{jugador.puntos_masacre_totales || 0}</td>
                        <td>{jugador.warlord_muerto_totales || 0}</td>
                        <td className="puntos-destacado">{jugador.puntos_victoria_totales || 0}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

    const renderClasificacionEquipos = () => {
        if (clasificacionEquipos.length === 0) {
            return (
                <div className="empty-message">
                    <p>📊 No hay clasificación de equipos disponible todavía</p>
                </div>
            );
        }

        return (
            <div className="clasificacion-equipos-container">
                {clasificacionEquipos.map((equipo, index) => (
                    <div 
                        key={equipo.equipo_id} 
                        className={`equipo-card ${index < 3 ? `top-${index + 1}` : ''}`}
                    >
                        {/* HEADER DEL EQUIPO */}
                        <div className="equipo-header">
                            <div className="equipo-posicion">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && `#${index + 1}`}
                            </div>
                            <div className="equipo-info">
                                <h3>🏆 {equipo.nombre_equipo}</h3>
                                <p className="capitan-info">
                                    👤 Capitán: {equipo.capitan?.nombre} {equipo.capitan?.apellidos}
                                </p>
                            </div>
                            <div className="equipo-stats-principales">
                                <div className="stat-item">
                                    <span className="stat-label">Pts Victoria</span>
                                    <span className="stat-valor destacado">{equipo.puntos_victoria_totales || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Pts Torneo</span>
                                    <span className="stat-valor">{equipo.puntos_torneo_totales || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Pts Masacre</span>
                                    <span className="stat-valor">{equipo.puntos_masacre_totales || 0}</span>
                                </div>
                                 <div className="stat-item">
                                    <span className="stat-label">Warlords Muertos</span>
                                    <span className="stat-valor">{equipo.warlord_muerto || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Partidas</span>
                                    <span className="stat-valor">{equipo.partidas_jugadas || 0}</span>
                                </div>
                                 <div className="stat-item">
                                    <span className="stat-label">Partidas Ganadas</span>
                                    <span className="stat-valor">{equipo.partidas_ganadas || 0}</span>
                                </div>
                                 <div className="stat-item">
                                    <span className="stat-label">Partidas Empatadas</span>
                                    <span className="stat-valor">{equipo.partidas_empatadas || 0}</span>
                                </div>
                                 <div className="stat-item">
                                    <span className="stat-label">Partidas Perdidas</span>
                                    <span className="stat-valor">{equipo.partidas_perdidas || 0}</span>
                                </div>

                            </div>
                        </div>
                    </div>
                ))}
            </div>
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

            {/* SELECTOR DE VISTA (solo para torneos por equipos) */}
            {esTorneoEquipos() && (
                <div className="selector-vista-clasificacion">
                    <button
                        className={`btn-selector ${vistaActual === 'individual' ? 'activo' : ''}`}
                        onClick={() => setVistaActual('individual')}
                    >
                        👤 Clasificación Individual
                    </button>
                    <button
                        className={`btn-selector ${vistaActual === 'equipos' ? 'activo' : ''}`}
                        onClick={() => setVistaActual('equipos')}
                    >
                        🏆 Clasificación por Equipos
                    </button>
                </div>
            )}

            {/* RENDERIZAR LA VISTA SELECCIONADA */}
            {vistaActual === 'individual' ? renderClasificacionIndividual() : renderClasificacionEquipos()}
        </div>
    );
}

export default VistaClasificacionSaga;