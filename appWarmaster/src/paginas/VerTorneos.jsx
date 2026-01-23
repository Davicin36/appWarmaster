import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Importar todas las APIs
import torneosSagaApi from "@/servicios/apiSaga";
import torneosWarmasterApi from "@/servicios/apiWarmaster";

import Footer from '@/paginas/Footer.jsx'

// Portales de vistas públicas
import VistaInformacionPublica from "@/componente/vistasVerTorneo/VistaInformacionPublica";
import VistaEmparejamientosPublica from "@/componente/vistasVerTorneo/VistaEmparejamientosPublica";
import VistaClasificacionPublica from "@/componente/vistasVerTorneo/VistaClasificacionPublica";

import "@/estilos/verTorneo.css";

function VerTorneo() {
    const { torneoId } = useParams();
    const navigate = useNavigate();

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
            
            // Intentar detectar el sistema del torneo
            let dataTorneo = null;
            let sistemaDetectado = null;

            // Probar cada API hasta encontrar el torneo
            for (const [sistema, api] of Object.entries(APIS_POR_SISTEMA)) {
                try {
                    const responseTorneo = await api.obtenerTorneo(torneoId);
                    dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
                    
                    if (dataTorneo && dataTorneo.sistema === sistema) {
                        sistemaDetectado = sistema;
                        break;
                    }
                } catch (error) {
                    console.log(`No encontrado en ${sistema}, continuando...`, error);
                }
            }

            if (!dataTorneo || !sistemaDetectado) {
                throw new Error('No se pudo cargar el torneo o identificar su sistema');
            }

            setTorneo(dataTorneo);

            // Cargar datos específicos según el tipo
            if (dataTorneo.tipo_torneo === 'Individual') {
                await cargarJugadoresIndividuales(sistemaDetectado);
            } else if (dataTorneo.tipo_torneo === 'Por equipos') {
                await cargarEquipos(sistemaDetectado);
            }

        } catch (error) {
            console.error("Error al cargar datos:", error);
            setError("No se pudieron cargar los datos del torneo");
        } finally {
            setLoading(false);
        }
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
            console.error("Error al cargar jugadores:", error);
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
                        <span className="info-item">
                            🎮 {torneo.sistema}
                        </span>
                        <span className="info-item">
                            📅 {formatearFecha(torneo.fecha_inicio)}
                        </span>
                        <span className="info-item">
                            {torneo.tipo_torneo || 'Tipo no especificado'}
                        </span>
                        <span className="info-item">
                            {torneo.tipo_torneo === 'Por equipos' ? '👥' : '👤'} {totalInscritos} / {maxInscritos}
                        </span>
                        {config.camposExtra}
                        {torneo.ubicacion && (
                            <span className="info-item">
                                📍 {torneo.ubicacion}
                            </span>
                        )}
                        <span className="info-item">
                            {config.iconoPuntos} {config.labelPuntos} pts
                        </span>
                        <span className="info-item">
                            🎲 {torneo.rondas_max || 0} rondas
                        </span>
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