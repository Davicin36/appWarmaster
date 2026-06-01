import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useSagaI18n } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import { useAuth } from '../servicios/AuthContext';
import usuarioApi from "../servicios/apiUsuarios";

import torneosSagaApi from "@/servicios/apiSaga";
import torneosWarmasterApi from "@/servicios/apiWarmaster";
import torneosFowApi from "@/servicios/apiFow";
import torneosEpicApi from "@/servicios/apiEpic";
import torneosDraculaApi from "@/servicios/apiDracula";

import Footer from '@/paginas/Footer.jsx';
import VistaInformacionPublica from "@/componente/vistasVerTorneo/VistaInformacionPublica";
import VistaEmparejamientosPublica from "@/componente/vistasVerTorneo/VistaEmparejamientosPublica";
import VistaClasificacionPublica from "@/componente/vistasVerTorneo/VistaClasificacionPublica";

import "@/estilos/verTorneo.css";

function VerTorneo({ onOpenLogin }) {
    const { torneoId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { t, i18n } = useTranslation();
    const { formatEpocas } = useSagaI18n();

    const [torneo, setTorneo] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [vistaActual, setVistaActual] = useState('informacion');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const APIS_POR_SISTEMA = {
        'SAGA':     torneosSagaApi,
        'WARMASTER':torneosWarmasterApi,
        'FOW':      torneosFowApi,
        'EPIC':     torneosEpicApi,
        'DRACULA':  torneosDraculaApi,
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return t('ver_torneo.sin_fecha');
        try {
            const date = new Date(fecha);
            if (isNaN(date.getTime())) return t('ver_torneo.fecha_invalida');
            const locale = i18n.language === 'es' ? 'es-ES' : 'en-GB';
            return date.toLocaleDateString(locale, {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch {
            return t('ver_torneo.fecha_invalida');
        }
    };

    useEffect(() => { cargarDatos(); }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const { sistema } = await usuarioApi.obtenerSistema(torneoId);
            const api = APIS_POR_SISTEMA[sistema];
            if (!api) throw new Error(`Sistema ${sistema} no soportado`);

            const responseTorneo = await api.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            if (!dataTorneo) throw new Error('No se pudo cargar el torneo');

            setTorneo(dataTorneo);

            if (dataTorneo.tipo_torneo === 'Individual') {
                await cargarJugadoresIndividuales(sistema);
            } else if (dataTorneo.tipo_torneo === 'Por equipos') {
                await cargarEquipos(sistema);
            }
        } catch (error) {
            console.error("Error al cargar datos:", error);
            setError(t('ver_torneo.error_carga'));
        } finally {
            setLoading(false);
        }
    };

    const apuntarseATorneo = (torneoId) => {
        if (!isAuthenticated) {
            alert(t('ver_torneo.login_requerido'));
            onOpenLogin();
            return;
        }
        navigate(`/inscripcion/${torneoId}`);
    };

    const cargarJugadoresIndividuales = async (sistema) => {
        try {
            const api = APIS_POR_SISTEMA[sistema];
            const responseInscritos = await api.obtenerJugadoresTorneo(torneoId);
            const dataInscritos = responseInscritos.data || responseInscritos || [];
            const inscritosParseados = dataInscritos.map((inscrito) => {
                if (sistema === 'SAGA' && inscrito.composicion_ejercito) {
                    try { return { ...inscrito, composicion_ejercito: JSON.parse(inscrito.composicion_ejercito) }; }
                    catch { return inscrito; }
                }
                return inscrito;
            });
            setInscritos(inscritosParseados);
        } catch (error) {
            console.error("Error al cargar jugadores:", error);
        }
    };

    const cargarEquipos = async (sistema) => {
        try {
            const api = APIS_POR_SISTEMA[sistema];
            const responseEquipos = await api.obtenerEquiposTorneo(torneoId);
            setEquipos(responseEquipos.data || responseEquipos || []);
        } catch (error) {
            console.error("Error al cargar equipos:", error);
        }
    };

    const descargarBases = async () => {
        try {
            await APIS_POR_SISTEMA[torneo.sistema].descargarBasesPDF(torneoId);
        } catch (error) {
            console.error('Error al descargar bases:', error);
            alert(t('ver_torneo.error_bases'));
        }
    };

    const toggleListas = async () => {
        try {
            const nuevoEstado = !torneo.listas_ocultas_saga;
            await torneosSagaApi.toggleListas(torneoId, nuevoEstado);
            setTorneo(prev => ({ ...prev, listas_ocultas_saga: nuevoEstado }));
        } catch (error) {
            console.error('Error:', error);
            alert(t('ver_torneo.error_listas'));
        }
    };

    const rutaEdicionPorSistema = {
        'SAGA':     'torneosSaga',
        'WARMASTER':'torneosWarmaster',
        'FOW':      'torneosFow',
        'EPIC':     'torneosEpic',
        'DRACULA':  'torneosDracula'
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-message">⏳ {t('ver_torneo.cargando')}</div>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-message-box">
                <h2>⚠️ {t('ver_torneo.error_titulo')}</h2>
                <p>{error}</p>
                <button onClick={() => navigate(-1)} className="btn-secondary">
                    ⬅️ {t('ver_torneo.volver')}
                </button>
            </div>
        </div>
    );

    if (!torneo?.sistema) return (
        <div className="error-container">
            <div className="error-message-box">
                <h2>⚠️ {t('ver_torneo.error_config')}</h2>
                <p>{t('ver_torneo.error_sistema')}</p>
            </div>
        </div>
    );

    const totalInscritos = torneo.tipo_torneo === 'Por equipos' ? equipos.length : inscritos.length;
    const maxInscritos   = torneo.tipo_torneo === 'Por equipos' ? torneo.equipos_max || 0 : torneo.participantes_max || 0;

    const getConfiguracionSistema = () => {
        switch (torneo.sistema) {
            case 'SAGA':     
                return { 
                    iconoPuntos: '⚔️', 
                    labelPuntos: torneo.puntos_banda || 0,    
                    camposExtra: torneo.epocas_disponibles && <span className="info-item">🎭 {formatEpocas(torneo.epocas_disponibles)}</span>
                };
            case 'WARMASTER':
                return {
                     iconoPuntos: '🎖️', 
                     labelPuntos: torneo.puntos_ejercito || 0, 
                     camposExtra: null 
                };
            case 'FOW':     
                 return { 
                    iconoPuntos: '🏹', 
                    labelPuntos: torneo.puntos_ejercito || 0, 
                    camposExtra: torneo.epocas_disponibles && <span className="info-item">🎭 {formatEpocas(torneo.epocas_disponibles)}</span> };
            case 'EPIC':     
                return { 
                    iconoPuntos: '⚡', 
                    labelPuntos: torneo.puntos_ejercito || 0, 
                    camposExtra: null 
                };
            case 'DRACULA':  
                return { 
                    iconoPuntos: '🧛', 
                    labelPuntos: torneo.puntos_banda || 0,    
                    camposExtra: null 
                };
            default:         
            return { 
                iconoPuntos: '⚔️', 
                labelPuntos: 0,                           
                camposExtra: null 
            };
        }
    };

    const config = getConfiguracionSistema();

    return (
        <div className="ver-torneo-container">
            <header className="torneo-header">
                <h1>🏆 {torneo.nombre_torneo || t('ver_torneo.sin_nombre')}</h1>
                <div className="torneo-content">
                    <div className="torneo-info">
                        <span className={`estado-badge estado-${torneo.estado || 'pendiente'}`}>
                            {t(`estado.${torneo.estado || 'pendiente'}`).toUpperCase()}
                        </span>
                        <span className="info-item">🎮 {torneo.sistema}</span>
                        <span className="info-item">📅 {formatearFecha(torneo.fecha_inicio)}</span>
                        <span className="info-item">
                            {torneo.tipo_torneo 
                                ? t(torneo.tipo_torneo === 'Por equipos' ? 'tabla.por_equipos' : 'tabla.individual')
                                : t('ver_torneo.tipo_no_especificado')}
                        </span>
                        <span className="info-item">
                            {torneo.tipo_torneo === 'Por equipos' ? '👥' : '👤'} {totalInscritos} / {maxInscritos}
                        </span>
                        {config.camposExtra}
                        {torneo.ubicacion && <span className="info-item">📍 {torneo.ubicacion}</span>}
                        <span className="info-item">{config.iconoPuntos} {config.labelPuntos} {t('ver_torneo.pts')}</span>
                        <span className="info-item">🎲 {torneo.rondas_max || 0} {t('ver_torneo.rondas')}</span>
                    </div>

                    <div className="torneo-footer-row">
                        <div className="torneo-acciones">
                            {torneo.estado === 'pendiente' && (
                                <button
                                    className={torneo.usuario_inscrito ? "vt-btn-inscrito" : "vt-btn-unirse"}
                                    onClick={() => {
                                        if (torneo.usuario_inscrito) {
                                            navigate(`/${rutaEdicionPorSistema[torneo.sistema] || 'torneos'}/${torneo.id}/editar-inscripcion`);
                                        } else {
                                            apuntarseATorneo(torneo.id);
                                        }
                                    }}
                                >
                                    {torneo.usuario_inscrito
                                        ? <><span className="vt-btn-icon">✏️</span> {t('ver_torneo.mi_inscripcion')}</>
                                        : <><span className="vt-btn-icon">⚔️</span> {t('ver_torneo.unirse')}</>
                                    }
                                </button>
                            )}

                            {torneo.soy_organizador === 1 && torneo.sistema === 'SAGA' && (
                                <button
                                    className={torneo.listas_ocultas_saga ? "vt-btn-listas-ocultas" : "vt-btn-listas-visibles"}
                                    onClick={toggleListas}
                                >
                                    {torneo.listas_ocultas_saga
                                        ? <><span className="vt-btn-icon">🔒</span> {t('ver_torneo.listas_ocultas')}</>
                                        : <><span className="vt-btn-icon">👁️</span> {t('ver_torneo.listas_visibles')}</>
                                    }
                                </button>
                            )}
                        </div>

                        {torneo.bases_nombre && (
                            <div className="torneo-bases">
                                <h3>📄 {t('ver_torneo.bases_titulo')}</h3>
                                <p className="bases-nombre">{torneo.bases_nombre}</p>
                                <button onClick={descargarBases} className="btn-primary">
                                    ⬇️ {t('ver_torneo.descargar_bases')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <nav className="vista-nav">
                <button className={vistaActual === 'informacion'    ? 'active' : ''} onClick={() => setVistaActual('informacion')}>
                    📋 {t('ver_torneo.nav_informacion')}
                </button>
                <button className={vistaActual === 'emparejamientos' ? 'active' : ''} onClick={() => setVistaActual('emparejamientos')}>
                    🎲 {t('ver_torneo.nav_emparejamientos')}
                </button>
                <button className={vistaActual === 'clasificacion'  ? 'active' : ''} onClick={() => setVistaActual('clasificacion')}>
                    🏆 {t('ver_torneo.nav_clasificacion')}
                </button>
            </nav>

            <div className="contenido-principal">
                {vistaActual === 'informacion' && (
                    <VistaInformacionPublica
                        tipoJuego={torneo.sistema} inscritos={inscritos} equipos={equipos}
                        tipoTorneo={torneo.tipo_torneo} estadoTorneo={torneo.estado}
                        torneoId={torneoId}
                        listasOcultas={torneo.estado === 'pendiente' && !torneo.soy_organizador ? (torneo.listas_ocultas_saga ?? true) : false}
                    />
                )}
                {vistaActual === 'emparejamientos' && (
                    <VistaEmparejamientosPublica tipoJuego={torneo.sistema} torneoId={torneoId} />
                )}
                {vistaActual === 'clasificacion' && (
                    <VistaClasificacionPublica tipoJuego={torneo.sistema} torneoId={torneoId} />
                )}
            </div>

            <footer className="footer-controles">
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                    ⬅️ {t('ver_torneo.volver')}
                </button>
            </footer>
            <Footer />
        </div>
    );
}

export default VerTorneo;