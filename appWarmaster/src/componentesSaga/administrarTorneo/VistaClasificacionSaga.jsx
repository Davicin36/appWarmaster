import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import  {useTranslation} from 'react-i18next';
import { useSagaI18n } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import torneosSagaApi from '@/servicios/apiSaga';

import '@/estilos/vistasTorneos/vistaClasificacion.css';

function VistaClasificacionSaga({ torneoId: propTorneoId }) {

    const { t } = useTranslation();
    const { getEpoca, getBanda } = useSagaI18n();

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
        let texto = `🏆 ${t('vista_clasificacion.clasificacion_torneo').toUpperCase()} - ${torneo.nombre_torneo}\n`;
        texto += `📅 ${new Date().toLocaleDateString()}\n`;
        texto += `\n`;

        if (vistaActual === 'individual') {
            // 📊 CLASIFICACIÓN INDIVIDUAL
            if (clasificacionIndividual.length === 0) {
                alert(`⚠️ ${t('vista_clasificacion.no_hay_jugadores')}`);
                return;
            }

            texto += `👤 ${t('vista_clasificacion.clasificacion_individual')}\n`;
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
                    texto += `   🏆 ${t('vista_clasificacion.equipo')}: ${jugador.nombre_equipo}\n`;
                }
                if (jugador.club) {
                    texto += `   🏅 ${t('vista_clasificacion.club')}: ${jugador.club}\n`;
                }
                if (jugador.faccion) {
                    texto += `   ⚔️ ${jugador.faccion? getBanda(jugador.faccion) : '-'}`;
                    if (jugador.epoca) {
                        texto += ` (${getEpoca(jugador.epoca)})`;
                    }
                    texto += `\n`;
                }
                
                texto += `   📊 ${t('vista_clasificacion.pj')}: ${jugador.partidas_jugadas || 0} | `;
                texto += `${t('vista_clasificacion.pg')}: ${jugador.partidas_ganadas || 0} | `;
                texto += `${t('vista_clasificacion.pe')}: ${jugador.partidas_empatadas || 0} | `;
                texto += `${t('vista_clasificacion.pp')}: ${jugador.partidas_perdidas || 0}\n`;
                texto += `   🎯 ${t('vista_clasificacion.pts_victoria')}: ${jugador.puntos_victoria_totales || 0}\n`;
                texto += `   💪 ${t('vista_clasificacion.pts_torneo')}: ${jugador.puntos_torneo_totales || 0}\n`;
                texto += `   ⚔️ ${t('vista_clasificacion.pts_masacre')}: ${jugador.puntos_masacre_totales || 0}\n`;
                if (esTorneoMisiones()) {
                    texto += `   📋 ${t('vista_clasificacion.misiones_secundarias')}: ${jugador.misiones_secundarias_totales || 0}\n`;
                }
                texto += `   💀 ${t('vista_clasificacion.warlords')}: ${jugador.warlord_muerto_totales || 0}\n`;
                texto += `\n`;
            });

        } else {
            // 🏆 CLASIFICACIÓN POR EQUIPOS
            if (clasificacionEquipos.length === 0) {
                alert(`⚠️ ${t('vista_clasificacion.no_hay_equipos')}`);
                return;
            }

            texto += `🏆 ${t('vista_clasificacion.clasificacion_equipos')}\n`;
            texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            clasificacionEquipos.forEach((equipo, index) => {
                let medalla = '';
                if (index === 0) medalla = '🥇';
                else if (index === 1) medalla = '🥈';
                else if (index === 2) medalla = '🥉';
                else medalla = `${index + 1}º`;

                texto += `${medalla} ${equipo.nombre_equipo}\n`;
                
                if (equipo.capitan) {
                    texto += `   👤 ${t('vista_clasificacion.capitan')}: ${equipo.capitan.nombre} ${equipo.capitan.apellidos || ''}\n`;
                }
                
                texto += `   📊 ${t('vista_clasificacion.pj')}: ${equipo.partidas_jugadas || 0} | `;
                texto += ` ${t('vista_clasificacion.pg')}: ${equipo.partidas_ganadas || 0} | `;
                texto += ` ${t('vista_clasificacion.pe')}: ${equipo.partidas_empatadas || 0} | `;
                texto += ` ${t('vista_clasificacion.pp')}: ${equipo.partidas_perdidas || 0}\n`;
                texto += `   🎯 ${t('vista_clasificacion.pts_victoria')}: ${equipo.puntos_victoria_totales || 0}\n`;
                texto += `   💪 ${t('vista_clasificacion.pts_torneo')}: ${equipo.puntos_torneo_totales || 0}\n`;
                texto += `   ⚔️ ${t('vista_clasificacion.pts_masacre')}: ${equipo.puntos_masacre_totales || 0}\n`;
                if (esTorneoMisiones()) {
                    texto += `   📋 ${t('vista_clasificacion.misiones_secundarias')}: ${equipo.misiones_secundarias_totales || 0}\n`;
                }
                texto += `   💀 ${t('vista_clasificacion.warlords')}: ${equipo.warlord_muerto || 0}\n`;
                texto += `\n`;
            });
        }

        // 🔥 API Web Share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${t('vista_clasificacion.clasificacion')} - ${torneo.nombre}`,
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
                alert(`✅ ${t('vista_clasificacion.copiados_portapapeles')}\n\n${t('vista_clasificacion.wasap_telegram')}`);
            } catch (err) {
                alert(`❌ ${t('vista_clasificacion.error_copiar')}`, err);
            }
        }
    };

   const renderClasificacionIndividual = () => {

        if (clasificacionIndividual.length === 0) {
            return (
                <div className="empty-message">
                    <p>📊 {t('vista_clasificacion.no_hay_jugadores')}</p>
                </div>
            );
        }

        return (
            <table className="tabla-clasificacion">
                <thead>
                    <tr>
                        <th>{t('vista_clasificacion.pos')}</th>
                        <th>{t('vista_clasificacion.jugador')}</th>
                        {esTorneoEquipos() && <th>{t('vista_clasificacion.equipo')}</th>}
                        <th>{t('vista_clasificacion.alias')}</th>
                        <th>{t('vista_clasificacion.club')}</th>
                        <th>{t('vista_clasificacion.faccion')}</th>
                        <th>{t('vista_clasificacion.epocas')}</th>
                        <th>{t('vista_clasificacion.pj')}</th>
                        <th>{t('vista_clasificacion.pg')}</th>
                        <th>{t('vista_clasificacion.pe')}</th>
                        <th>{t('vista_clasificacion.pp')}</th>
                        <th>{t('vista_clasificacion.pts_torneo')}</th>
                        <th>{t('vista_clasificacion.pts_masacre')}</th>
                        {esTorneoMisiones() && <th>{t('vista_clasificacion.misiones_secundarias')}</th>}
                        <th>{t('vista_clasificacion.warlords')}</th>
                        <th>{t('vista_clasificacion.pts_victoria')}</th>
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
                            <td>{jugador.faccion ? getBanda(jugador.faccion) : '-'}</td>
                            <td>{jugador.epoca ? getEpoca(jugador.epoca) : '-'}</td>
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
                    <p>📊 {t('vista_clasificacion.no_hay_equipos')}</p>
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
                                    <span className="stat-label">{t('vista_clasificacion.pts_victoria')}</span>
                                    <span className="stat-valor destacado">{equipo.puntos_victoria_totales || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">{t('vista_clasificacion.pts_torneo')}</span>
                                    <span className="stat-valor">{equipo.puntos_torneo_totales || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">{t('vista_clasificacion.pts_masacre')}</span>
                                    <span className="stat-valor">{equipo.puntos_masacre_totales || 0}</span>
                                </div>
                                {esTorneoMisiones() && (
                                    <div className="stat-item">
                                        <span className="stat-label">{t('vista_clasificacion.misiones_secundarias')}</span>
                                        <span className="stat-valor">{equipo.misiones_secundarias_totales || 0}</span>
                                    </div>
                                )}
                                <div className="stat-item">
                                    <span className="stat-label">{t('vista_clasificacion.warlords')}</span>
                                    <span className="stat-valor">{equipo.warlord_muerto || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">{t('vista_clasificacion.partidas_jugadas')}</span>
                                    <span className="stat-valor">{equipo.partidas_jugadas || 0}</span>
                                </div>
                                 <div className="stat-item">
                                    <span className="stat-label">{t('vista_clasificacion.partidas_ganadas')}</span>
                                    <span className="stat-valor">{equipo.partidas_ganadas || 0}</span>
                                </div>
                                 <div className="stat-item">
                                    <span className="stat-label">{t('vista_clasificacion.partidas_empatadas')}</span>
                                    <span className="stat-valor">{equipo.partidas_empatadas || 0}</span>
                                </div>
                                 <div className="stat-item">
                                    <span className="stat-label">{t('vista_clasificacion.partidas_perdidas')}</span>
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
                    ⏳ {t('vista_clasificacion.cargando')}
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
                        🔄 {t('botones.reintentar')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="vista-clasificacion">
            <div className="clasificacion-header">
                <h2>🏆 {t('vista_clasificacion.clasificacion_torneo')}</h2>
                <button 
                    onClick={cargarDatos}
                    className="btn-actualizar-clasificacion"
                    disabled={loading}
                >
                   {loading ? '⏳ ' + t('vista_clasificacion.cargando') : '🔄 ' + t('botones.actualizar')}
                </button>
                {/* 🆕 BOTÓN COMPARTIR - PARA TODOS */}
                {(clasificacionIndividual.length > 0 || clasificacionEquipos.length > 0) && (
                    <button
                        onClick={compartirClasificacion}
                        className="btn-compartir-clasificacion"
                        disabled={loading}
                        title="Compartir clasificación"
                    >
                        📤 {t('botones.compartir')}
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
                        👤 {t('vista_clasificacion.clasificacion_individual')}
                    </button>
                    <button
                        className={`btn-selector ${vistaActual === 'equipos' ? 'activo' : ''}`}
                        onClick={() => setVistaActual('equipos')}
                    >
                        🏆{t('vista_clasificacion.clasificacion_equipos')}
                    </button>
                </div>
            )}

            {/* RENDERIZAR LA VISTA SELECCIONADA */}
            {vistaActual === 'individual' ? renderClasificacionIndividual() : renderClasificacionEquipos()}
        </div>
    );
}

export default VistaClasificacionSaga;