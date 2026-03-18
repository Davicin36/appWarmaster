import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useAuth } from '../servicios/AuthContext';
import usuarioApi from "../servicios/apiUsuarios";

// Importar todas las APIs
import torneosSagaApi from "@/servicios/apiSaga";
import torneosWarmasterApi from "@/servicios/apiWarmaster";
import torneosFowApi from "@/servicios/apiFow";
import torneosEpicApi from "@/servicios/apiEpic";

import Footer from '@/paginas/Footer.jsx'

// Portales de vistas públicas
import VistaInformacionPublica from "@/componente/vistasVerTorneo/VistaInformacionPublica";
import VistaEmparejamientosPublica from "@/componente/vistasVerTorneo/VistaEmparejamientosPublica";
import VistaClasificacionPublica from "@/componente/vistasVerTorneo/VistaClasificacionPublica";

import "@/estilos/verTorneo.css";

function VerTorneo( {onOpenLogin}) {
    const { torneoId } = useParams();
    const navigate = useNavigate();

    const { isAuthenticated } = useAuth();

    const [torneo, setTorneo] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [vistaActual, setVistaActual] = useState('informacion');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mapeo de APIs por sistema
    const APIS_POR_SISTEMA = {
        'SAGA': torneosSagaApi,
        'WARMASTER': torneosWarmasterApi,
        'FOW':torneosFowApi,
        'EPIC': torneosEpicApi,
        // Agregar más sistemas aquí en el futuro
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Sin fecha';
        try {
            const date = new Date(fecha);
            if (isNaN(date.getTime())) return 'Fecha inválida';
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Error al formatear fecha:', e);
            return 'Fecha inválida';
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            // 1️⃣ Primero obtener el sistema del torneo
            const { sistema } = await usuarioApi.obtenerSistema(torneoId)

            // 2️⃣ Seleccionar la API correcta
            const api = APIS_POR_SISTEMA[sistema];
            
            if (!api) {
                throw new Error(`Sistema ${sistema} no soportado`);
            }

            // 3️⃣ Cargar datos del torneo con la API correcta
            const responseTorneo = await api.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;

            if (!dataTorneo) {
                throw new Error('No se pudo cargar el torneo');
            }

            setTorneo(dataTorneo);

            // Cargar datos específicos según el tipo
            if (dataTorneo.tipo_torneo === 'Individual') {
                await cargarJugadoresIndividuales(sistema);
            } else if (dataTorneo.tipo_torneo === 'Por equipos') {
                await cargarEquipos(sistema);
            }

        } catch (error) {
            console.error("Error al cargar datos:", error);
            setError("No se pudieron cargar los datos del torneo");
        } finally {
            setLoading(false);
        }
    };

       const apuntarseATorneo = (torneoId) => {
        if (!isAuthenticated) {
            alert('Debes iniciar sesión para apuntarte a un torneo');
            onOpenLogin()
            return;
        }
        navigate(`/inscripcion/${torneoId}`);
    };

    const cargarJugadoresIndividuales = async (sistema) => {
        try {
            const api = APIS_POR_SISTEMA[sistema];
            
            const responseInscritos = await api.obtenerJugadoresTorneo(torneoId);
                        
            const dataInscritos = responseInscritos.data || responseInscritos || [];

            // Procesar datos específicos del sistema
            const inscritosParseados = dataInscritos.map((inscrito) => {
                if (sistema === 'SAGA' && inscrito.composicion_ejercito) {
                    try {
                        return {
                            ...inscrito,
                            composicion_ejercito: JSON.parse(inscrito.composicion_ejercito)
                        };
                    } catch {
                        return inscrito;
                    }
                }
                return inscrito;
            });

            setInscritos(inscritosParseados);
        } catch (error) {
            console.error("❌ Error al cargar jugadores:", error);
        }
    };

    const cargarEquipos = async (sistema) => {
        try {
            const api = APIS_POR_SISTEMA[sistema];
            const responseEquipos = await api.obtenerEquiposTorneo(torneoId);
            const dataEquipos = responseEquipos.data || responseEquipos || [];
            setEquipos(dataEquipos);
        } catch (error) {
            console.error("Error al cargar equipos:", error);
        }
    };

    const descargarBases = async () => {
        try {
            const api = APIS_POR_SISTEMA[torneo.sistema];
            await api.descargarBasesPDF(torneoId);
        } catch (error) {
            console.error('Error al descargar bases:', error);
            alert('❌ Error al descargar las bases del torneo');
        }
    };

    const toggleListas = async () => {
        try {
            
            const nuevoEstado = !torneo.listas_ocultas_saga;
        
            await torneosSagaApi.toggleListas(torneoId, nuevoEstado);
        
            setTorneo(prev => ({ ...prev, listas_ocultas_saga: nuevoEstado }));
        } catch (error) {
            console.error('❌ Error completo:', error);
            console.error('❌ Status:', error.response?.status);
            console.error('❌ Mensaje servidor:', error.response?.data);
            alert('❌ Error al cambiar visibilidad de listas');
        }
    };

    const rutaEdicionPorSistema = {
        'SAGA': 'torneosSaga',
        'WARMASTER': 'torneosWarmaster',
        'FOW': 'torneosFow',
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-message">
                    ⏳ Cargando datos del torneo...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message-box">
                    <h2>⚠️ Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} className="btn-secondary">
                        ⬅️ Volver
                    </button>
                </div>
            </div>
        );
    }

    if (!torneo || !torneo.sistema) {
        return (
            <div className="error-container">
                <div className="error-message-box">
                    <h2>⚠️ Error de Configuración</h2>
                    <p>El torneo no tiene un sistema de juego definido</p>
                </div>
            </div>
        );
    }

    const totalInscritos = torneo.tipo_torneo === 'Por equipos' 
        ? equipos.length 
        : inscritos.length;

    const maxInscritos = torneo.tipo_torneo === 'Por equipos'
        ? torneo.equipos_max || 0
        : torneo.participantes_max || 0;

    // Configuración específica por sistema para el header
    const getConfiguracionSistema = () => {
        switch (torneo.sistema) {
            case 'SAGA':
                return {
                    iconoPuntos: '⚔️',
                    labelPuntos: torneo.puntos_banda || 0,
                    camposExtra: torneo.epocas_disponibles && (
                        <span className="info-item">
                            🎭 {torneo.epocas_disponibles}
                        </span>
                    )
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
                    camposExtra: torneo.epocas_disponibles && (
                        <span className="info-item">
                            🎭 {torneo.epocas_disponibles}
                        </span>
                    )
                };
                case 'EPIC':
                return {
                    iconoPuntos: '⚡',
                    labelPuntos: torneo.puntos_ejercito || 0,
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
            <h1>🏆 {torneo.nombre_torneo || 'Torneo sin nombre'}</h1>
                <div className="torneo-content">
                    <div className="torneo-info">
                        <span className={`estado-badge estado-${torneo.estado || 'pendiente'}`}>
                            {(torneo.estado || 'pendiente').toUpperCase()}
                        </span>
                        <span className="info-item">🎮 {torneo.sistema}</span>
                        <span className="info-item">📅 {formatearFecha(torneo.fecha_inicio)}</span>
                        <span className="info-item">{torneo.tipo_torneo || 'Tipo no especificado'}</span>
                        <span className="info-item">
                            {torneo.tipo_torneo === 'Por equipos' ? '👥' : '👤'} {totalInscritos} / {maxInscritos}
                        </span>
                        {config.camposExtra}
                        {torneo.ubicacion && <span className="info-item">📍 {torneo.ubicacion}</span>}
                        <span className="info-item">{config.iconoPuntos} {config.labelPuntos} pts</span>
                        <span className="info-item">🎲 {torneo.rondas_max || 0} rondas</span>
                    </div>

                    <div className="torneo-footer-row">
                        <div className="torneo-acciones">
                            {torneo.estado === 'pendiente' && (
                                <button
                                    className={torneo.usuario_inscrito ? "vt-btn-inscrito" : "vt-btn-unirse"}
                                    onClick={() => {
                                        if (torneo.usuario_inscrito) {
                                            const ruta = rutaEdicionPorSistema[torneo.sistema] || 'torneos';
                                            navigate(`/${ruta}/${torneo.id}/editar-inscripcion`);
                                        } else {
                                            apuntarseATorneo(torneo.id);
                                        }
                                    }}
                                >
                                    {torneo.usuario_inscrito
                                        ? <><span className="vt-btn-icon">✏️</span> Mi Inscripción</>
                                        : <><span className="vt-btn-icon">⚔️</span> Unirse al Torneo</>
                                    }
                                </button>
                            )}

                            {torneo.soy_organizador === 1 && torneo.sistema ==='SAGA' && (
                                <button
                                    className={torneo.listas_ocultas_saga ? "vt-btn-listas-ocultas" : "vt-btn-listas-visibles"}
                                    onClick={toggleListas}
                                >
                                    {torneo.listas_ocultas_saga
                                        ? <><span className="vt-btn-icon">🔒</span> Listas Ocultas</>
                                        : <><span className="vt-btn-icon">👁️</span> Listas Visibles</>
                                    }
                                </button>
                            )}
                        </div>

                        {torneo.bases_nombre && (
                            <div className="torneo-bases">
                                <h3>📄 Bases del Torneo</h3>
                                <p className="bases-nombre">{torneo.bases_nombre}</p>
                                <button onClick={descargarBases} className="btn-primary">
                                    ⬇️ Descargar Bases
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <nav className="vista-nav">
                <button 
                    className={vistaActual === 'informacion' ? 'active' : ''} 
                    onClick={() => setVistaActual('informacion')}
                >
                    📋 Información
                </button>
                <button 
                    className={vistaActual === 'emparejamientos' ? 'active' : ''} 
                    onClick={() => setVistaActual('emparejamientos')}
                >
                    🎲 Emparejamientos
                </button>
                <button 
                    className={vistaActual === 'clasificacion' ? 'active' : ''} 
                    onClick={() => setVistaActual('clasificacion')}
                >
                    🏆 Clasificación
                </button>
            </nav>

            <div className="contenido-principal">
                {vistaActual === 'informacion' && (
                    <VistaInformacionPublica
                        tipoJuego={torneo.sistema}
                        inscritos={inscritos}
                        equipos={equipos}
                        tipoTorneo={torneo.tipo_torneo}
                        estadoTorneo={torneo.estado}
                        torneoId={torneoId}
                        listasOcultas={torneo.estado === 'pendiente' && !torneo.soy_organizador ? (torneo.listas_ocultas_saga ?? true) : false}
                    />
                )}

                {vistaActual === 'emparejamientos' && (
                    <VistaEmparejamientosPublica
                        tipoJuego={torneo.sistema}
                        torneoId={torneoId}
                    />
                )}

                {vistaActual === 'clasificacion' && (
                    <VistaClasificacionPublica
                        tipoJuego={torneo.sistema}
                        torneoId={torneoId}
                    />
                )}
            </div>

            <footer className="footer-controles">
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                    ⬅️ Volver
                </button>
            </footer>
            <Footer />
        </div>
    );
}

export default VerTorneo;