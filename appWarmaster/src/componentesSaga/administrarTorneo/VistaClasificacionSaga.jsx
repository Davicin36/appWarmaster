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
    const esTorneoMisiones = () => torneo?.misiones_secundarias == 1;

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

            console.log('Respuesta clasificación individual:', response);
            
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

    const compartirClasificacion = async () => {
        let texto = `🏆 CLASIFICACIÓN - ${torneo.nombre_torneo}\n`;
        texto += `📅 ${new Date().toLocaleDateString()}\n`;
        texto += `\n`;

        if (vistaActual === 'individual') {
            // 📊 CLASIFICACIÓN INDIVIDUAL
            if (clasificacionIndividual.length === 0) {
                alert('⚠️ No hay clasificación individual para compartir');
                return;
            }

            texto += `👤 CLASIFICACIÓN INDIVIDUAL\n`;
            texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            clasificacionIndividual.forEach((jugador, index) => {
                let medalla = '';
                if (index === 0) medalla = '🥇';
                else if (index === 1) medalla = '🥈';
                else if (index === 2) medalla = '🥉';
                else medalla = `${index + 1}º`;

                texto += `${medalla} ${jugador.jugador_nombre || jugador.nombre}`;
                if (jugador.nombre_alias) {
                    texto += ` "${jugador.nombre_alias}"`;
                }
                texto += `\n`;

                if (esTorneoEquipos() && jugador.nombre_equipo) {
                    texto += `   🏆 Equipo: ${jugador.nombre_equipo}\n`;
                }
                if (jugador.club) {
                    texto += `   🏅 Club: ${jugador.club}\n`;
                }
                if (jugador.faccion) {
                    texto += `   ⚔️ ${jugador.faccion}`;
                    if (jugador.epoca) {
                        texto += ` (${jugador.epoca})`;
                    }
                    texto += `\n`;
                }
                
                texto += `   📊 PJ: ${jugador.partidas_jugadas || 0} | `;
                texto += `PG: ${jugador.partidas_ganadas || 0} | `;
                texto += `PE: ${jugador.partidas_empatadas || 0} | `;
                texto += `PP: ${jugador.partidas_perdidas || 0}\n`;
                texto += `   🎯 Pts Victoria: ${jugador.puntos_victoria_totales || 0}\n`;
                texto += `   💪 Pts Torneo: ${jugador.puntos_torneo_totales || 0}\n`;
                texto += `   ⚔️ Pts Masacre: ${jugador.puntos_masacre_totales || 0}\n`;
                texto += `   💀 Warlords: ${jugador.warlord_muerto_totales || 0}\n`;
                texto += `\n`;
            });

        } else {
            // 🏆 CLASIFICACIÓN POR EQUIPOS
            if (clasificacionEquipos.length === 0) {
                alert('⚠️ No hay clasificación de equipos para compartir');
                return;
            }

            texto += `🏆 CLASIFICACIÓN POR EQUIPOS\n`;
            texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            clasificacionEquipos.forEach((equipo, index) => {
                let medalla = '';
                if (index === 0) medalla = '🥇';
                else if (index === 1) medalla = '🥈';
                else if (index === 2) medalla = '🥉';
                else medalla = `${index + 1}º`;

                texto += `${medalla} ${equipo.nombre_equipo}\n`;
                
                if (equipo.capitan) {
                    texto += `   👤 Capitán: ${equipo.capitan.nombre} ${equipo.capitan.apellidos || ''}\n`;
                }
                
                texto += `   📊 Partidas: ${equipo.partidas_jugadas || 0} | `;
                texto += `G: ${equipo.partidas_ganadas || 0} | `;
                texto += `E: ${equipo.partidas_empatadas || 0} | `;
                texto += `P: ${equipo.partidas_perdidas || 0}\n`;
                texto += `   🎯 Pts Victoria: ${equipo.puntos_victoria_totales || 0}\n`;
                texto += `   💪 Pts Torneo: ${equipo.puntos_torneo_totales || 0}\n`;
                texto += `   ⚔️ Pts Masacre: ${equipo.puntos_masacre_totales || 0}\n`;
                texto += `   💀 Warlords: ${equipo.warlord_muerto || 0}\n`;
                texto += `\n`;
            });
        }

        // 🔥 API Web Share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Clasificación - ${torneo.nombre}`,
                    text: texto
                });
                console.log('✅ Clasificación compartida exitosamente');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.log('Usuario canceló compartir');
                }
            }
        } else {
            // ❌ Fallback para ordenadores
            try {
                await navigator.clipboard.writeText(texto);
                alert('✅ ¡Clasificación copiada al portapapeles!\n\nPega el texto en WhatsApp, Telegram, etc.');
            } catch (err) {
                alert('❌ No se pudo copiar. Por favor, selecciona y copia manualmente.', err);
            }
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
                        {esTorneoMisiones() && <th>Misiones Secundarias</th>}
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
                            {esTorneoMisiones() && <td>{jugador.misiones_secundarias_totales || 0}</td>}
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
                                {esTorneoMisiones() && (
                                    <div className="stat-item">
                                        <span className="stat-label">Misiones Secundarias</span>
                                        <span className="stat-valor">{equipo.misiones_secundarias_totales || 0}</span>
                                    </div>
                                )}
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
                {/* 🆕 BOTÓN COMPARTIR - PARA TODOS */}
                {(clasificacionIndividual.length > 0 || clasificacionEquipos.length > 0) && (
                    <button
                        onClick={compartirClasificacion}
                        className="btn-compartir-clasificacion"
                        disabled={loading}
                        title="Compartir clasificación"
                    >
                        📤 Compartir
                    </button>
                )}
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