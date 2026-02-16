import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosFowApi from '@/servicios/apiFow.js';

import '@/estilos/vistasTorneos/vistaClasificacion.css';

function VistaClasificacionFow({ torneoId: propTorneoId }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [clasificacionGeneral, setClasificacionGeneral] = useState([]);
    const [clasificacionEje, setClasificacionEje] = useState([]);
    const [clasificacionAliados, setClasificacionAliados] = useState([]);
    const [estadisticas, setEstadisticas] = useState({});
    const [vistaActual, setVistaActual] = useState('general'); // 'general', 'eje', 'aliados'
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
            
            // Cargar datos del torneo
            const responseTorneo = await torneosFowApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);
            
            // Cargar clasificación (ahora incluye general, eje, aliados)
            await cargarClasificacion();
            
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const cargarClasificacion = async () => {
        try {
            const response = await torneosFowApi.obtenerClasificacionIndividual(torneoId);
            
            // Extraer datos del response
            const data = response?.data || response;
            
            // Guardar las 3 clasificaciones
            setClasificacionGeneral(data.general || []);
            setClasificacionEje(data.eje || []);
            setClasificacionAliados(data.aliados || []);
            setEstadisticas(data.estadisticas || {});
            
        } catch (err) {
            console.error('Error al cargar clasificación:', err);
            setClasificacionGeneral([]);
            setClasificacionEje([]);
            setClasificacionAliados([]);
        }
    };

    const obtenerClasificacionActual = () => {
        switch (vistaActual) {
            case 'eje':
                return clasificacionEje;
            case 'aliados':
                return clasificacionAliados;
            default:
                return clasificacionGeneral;
        }
    };

    const compartirClasificacion = async () => {
        const clasificacion = obtenerClasificacionActual();
        
        if (clasificacion.length === 0) {
            alert('⚠️ No hay clasificación para compartir');
            return;
        }

        let texto = `🏆 CLASIFICACIÓN - ${torneo.nombre_torneo}\n`;
        texto += `🎮 Flames of War\n`;
        texto += `📅 ${new Date().toLocaleDateString()}\n`;
        texto += `\n`;

        // Título según la vista
        if (vistaActual === 'eje') {
            texto += `🔴 CLASIFICACIÓN EJE (${estadisticas.total_eje} jugadores)\n`;
        } else if (vistaActual === 'aliados') {
            texto += `🔵 CLASIFICACIÓN ALIADOS (${estadisticas.total_aliados} jugadores)\n`;
        } else {
            texto += `🏆 CLASIFICACIÓN GENERAL (${estadisticas.total_jugadores} jugadores)\n`;
        }
        texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        clasificacion.forEach((jugador) => {
            let medalla = '';
            const posicion = vistaActual === 'general' 
                ? jugador.posicion_general 
                : jugador.posicion_bando;

            if (posicion === 1) medalla = '🥇';
            else if (posicion === 2) medalla = '🥈';
            else if (posicion === 3) medalla = '🥉';
            else medalla = `${posicion}º`;

            texto += `${medalla} ${jugador.jugador_nombre}`;
            if (jugador.jugador_apellidos) {
                texto += ` ${jugador.jugador_apellidos}`;
            }
            texto += `\n`;

            if (jugador.club) {
                texto += `   🏅 Club: ${jugador.club}\n`;
            }
            
            if (vistaActual === 'general' && jugador.bando) {
                const bandoIcon = jugador.bando === 'Eje' ? '🔴' : '🔵';
                texto += `   ${bandoIcon} Bando: ${jugador.bando}\n`;
            }
            
            if (jugador.ejercito) {
                texto += `   ⚔️ ${jugador.ejercito}`;
                if (jugador.nombre_ejercito) {
                    texto += ` "${jugador.nombre_ejercito}"`;
                }
                texto += `\n`;
            }
            
            texto += `   📊 PJ: ${jugador.partidas_jugadas || 0} | `;
            texto += `PG: ${jugador.partidas_ganadas || 0} | `;
            texto += `PE: ${jugador.partidas_empatadas || 0} | `;
            texto += `PP: ${jugador.partidas_perdidas || 0}\n`;
            texto += `   💪 Pts Torneo: ${jugador.puntos_torneo_totales || 0}\n`;
            texto += `   🎯 Pts Victoria: ${jugador.puntos_victoria_totales || 0}\n`;
            texto += `\n`;
        });

        // 🔥 API Web Share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Clasificación FOW - ${torneo.nombre_torneo}`,
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
                alert('❌ No se pudo copiar. Por favor, selecciona y copia manualmente.');
                console.error(err);
            }
        }
    };

    const renderClasificacion = () => {
        const clasificacion = obtenerClasificacionActual();
        
        if (clasificacion.length === 0) {
            return (
                <div className="empty-message">
                    <p>📊 No hay clasificación disponible todavía</p>
                </div>
            );
        }

        const campoPos = vistaActual === 'general' ? 'posicion_general' : 'posicion_bando';
        const mostrarBando = vistaActual === 'general';

        return (
            <table className="tabla-clasificacion">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Jugador</th>
                        <th>Club</th>
                        {mostrarBando && <th>Bando</th>}
                        <th>Ejército</th>
                        <th>Nombre Ejército</th>
                        <th>PJ</th>
                        <th>PG</th>
                        <th>PE</th>
                        <th>PP</th>
                        <th>Pts Torneo</th>
                        <th>Pts Victoria</th>
                    </tr>
                </thead>
                <tbody>
                    {clasificacion.map((jugador, index) => {
                        const posicion = jugador[campoPos];
                        return (
                            <tr 
                                key={`jugador-${jugador.jugador_id}-${index}`} 
                                className={posicion <= 3 ? `top-${posicion}` : ''}
                            >
                                <td className="posicion">
                                    {posicion === 1 && '🥇'}
                                    {posicion === 2 && '🥈'}
                                    {posicion === 3 && '🥉'}
                                    {posicion > 3 && posicion}
                                </td>
                                <td className="nombre-jugador">
                                    {jugador.jugador_nombre}
                                    {jugador.jugador_apellidos && ` ${jugador.jugador_apellidos}`}
                                </td>
                                <td>{jugador.club || '-'}</td>
                                {mostrarBando && (
                                    <td>
                                        <span className={`badge-bando ${jugador.bando?.toLowerCase()}`}>
                                            {jugador.bando === 'Eje' ? '🔴' : '🔵'} {jugador.bando}
                                        </span>
                                    </td>
                                )}
                                <td>{jugador.ejercito || '-'}</td>
                                <td className="nombre-ejercito">{jugador.nombre_ejercito || '-'}</td>
                                <td>{jugador.partidas_jugadas || 0}</td>
                                <td>{jugador.partidas_ganadas || 0}</td>
                                <td>{jugador.partidas_empatadas || 0}</td>
                                <td>{jugador.partidas_perdidas || 0}</td>
                                <td className="puntos-secundario">
                                    {jugador.puntos_torneo_totales || 0}
                                </td>
                                <td className="puntos-destacado">
                                    <strong>{jugador.puntos_victoria_totales || 0}</strong>
                                </td>
                            </tr>
                        );
                    })}
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
                <div className="header-actions">
                    <button 
                        onClick={cargarDatos}
                        className="btn-actualizar-clasificacion"
                        disabled={loading}
                    >
                        {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
                    </button>
                    
                    {/* BOTÓN COMPARTIR */}
                    {(clasificacionGeneral.length > 0 || 
                      clasificacionEje.length > 0 || 
                      clasificacionAliados.length > 0) && (
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
            </div>

            {/* SELECTOR DE VISTA */}
            <div className="selector-vista-clasificacion">
                <button
                    className={`btn-selector ${vistaActual === 'general' ? 'activo' : ''}`}
                    onClick={() => setVistaActual('general')}
                >
                    🏆 General
                </button>
                <button
                    className={`btn-selector btn-eje ${vistaActual === 'eje' ? 'activo' : ''}`}
                    onClick={() => setVistaActual('eje')}
                >
                    🔴 Eje 
                </button>
                <button
                    className={`btn-selector btn-aliados ${vistaActual === 'aliados' ? 'activo' : ''}`}
                    onClick={() => setVistaActual('aliados')}
                >
                    🔵 Aliados 
                </button>
            </div>

            {/* RENDERIZAR CLASIFICACIÓN */}
            {renderClasificacion()}
        </div>
    );
}

export default VistaClasificacionFow;