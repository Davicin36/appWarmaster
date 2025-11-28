import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import torneosSagaApi from "../servicios/apiSaga";

import VistaInformacionPublica from "@/componente/vistasVerTorneo/VistaInformacionPublica";
import VistaEmparejamientosPublica from "@/componente/vistasVerTorneo/VistaEmparejamientosPublica";
import VistaClasificacionPublica from "@/componente/vistasVerTorneo/VistaClasificacionPublica";

import "../estilos/verTorneo.css";

function VerTorneo() {
    const { torneoId } = useParams();
    const navigate = useNavigate();

    const [torneo, setTorneo] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [vistaActual, setVistaActual] = useState('informacion');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            
            const responseTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);

            console.log (dataTorneo)

            if (dataTorneo.tipo_torneo === 'Individual') {
                await cargarJugadoresIndividuales();
            } else if (dataTorneo.tipo_torneo === 'Por equipos') {
                await cargarEquipos();
            }

        } catch (error) {
            console.error("Error al cargar datos:", error);
            setError("No se pudieron cargar los datos del torneo");
        } finally {
            setLoading(false);
        }
    };

    const cargarJugadoresIndividuales = async () => {
        try {
            const responseInscritos = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
            const dataInscritos = responseInscritos.data || responseInscritos || [];

            const inscritosParseados = dataInscritos.map((inscrito) => {
                let composicion = {};
                if (inscrito.composicion_ejercito) {
                    try {
                        composicion = JSON.parse(inscrito.composicion_ejercito);
                    } catch {
                        composicion = {};
                    }
                }
                return { ...inscrito, composicion_ejercito: composicion };
            });

            setInscritos(inscritosParseados);
        } catch (error) {
            console.error("Error al cargar jugadores:", error);
        }
    };

    const cargarEquipos = async () => {
        try {
            const responseEquipos = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
            const dataEquipos = responseEquipos.data || responseEquipos || [];
            setEquipos(dataEquipos);
        } catch (error) {
            console.error("Error al cargar equipos:", error);
        }
    };

    const descargarBases = async () => {
        try {
            await torneosSagaApi.descargarBasesPDF(torneoId);
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

    // ⬅️ Determinar tipo de juego
    const tipoJuego = torneo?.sistema;

    if (!tipoJuego) {
        return (
            <div className="error-container">
                <div className="error-message-box">
                    <h2>⚠️ Error de Configuración</h2>
                    <p>El torneo no tiene un sistema de juego definido</p>
                </div>
            </div>
        );
    }

    const totalInscritos = torneo?.tipo_torneo === 'Por equipos' 
        ? equipos.length 
        : inscritos.length;

    const maxInscritos = torneo?.tipo_torneo === 'Por equipos'
        ? torneo?.equipos_max || 0
        : torneo?.participantes_max || 0;

    return (
        <div className="ver-torneo-container">
            <header className="torneo-header">
                <h1>🏆 {torneo?.nombre_torneo || 'Torneo sin nombre'}</h1>
                <div className="torneo-info">
                    <span className={`estado-badge estado-${torneo?.estado || 'pendiente'}`}>
                        {(torneo?.estado || 'pendiente').toUpperCase()}
                    </span>
                    <span className="info-item">
                        🎮 {tipoJuego}
                    </span>
                    <span className="info-item">
                        📅 {formatearFecha(torneo?.fecha_inicio)}
                    </span>
                    <span className="info-item">
                        {torneo?.tipo_torneo || 'Tipo no especificado'}
                    </span>
                    <span className="info-item">
                        {torneo?.tipo_torneo === 'Por equipos' ? '👥' : '👤'} {totalInscritos} / {maxInscritos}
                    </span>
                    <span className="info-item">
                        🎭 {torneo?.epocas_disponibles || 'No especificada'}
                    </span>
                    {torneo?.ubicacion && (
                        <span className="info-item">
                            📍 {torneo.ubicacion}
                        </span>
                    )}
                    <span className="info-item">
                        ⚔️ {torneo?.puntos_banda || 0} pts
                    </span>
                    <span className="info-item">
                        🎲 {torneo?.rondas_max || 0} rondas
                    </span>
                </div>

                {torneo?.bases_nombre && (
                    <div className="torneo-bases">
                        <h3>📄 Bases del Torneo</h3>
                        <p className="bases-nombre">{torneo.bases_nombre}</p>
                        <button onClick={descargarBases} className="btn-primary">
                            ⬇️ Descargar Bases
                        </button>
                    </div>
                )}
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
                        tipoJuego={tipoJuego}
                        inscritos={inscritos}
                        equipos={equipos}
                        tipoTorneo={torneo?.tipo_torneo}
                    />
                )}

                {vistaActual === 'emparejamientos' && (
                    <VistaEmparejamientosPublica
                        tipoJuego={tipoJuego}
                        torneoId={torneoId}
                    />
                )}

                {vistaActual === 'clasificacion' && (
                    <VistaClasificacionPublica
                        tipoJuego={tipoJuego}
                        torneoId={torneoId}
                    />
                )}
            </div>

            <footer className="footer-controles">
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                    ⬅️ Volver
                </button>
            </footer>
        </div>
    );
}

export default VerTorneo;