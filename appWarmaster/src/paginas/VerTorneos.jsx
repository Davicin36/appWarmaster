// paginas/VerTorneo.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import torneosSagaApi from "../servicios/apiSaga";

import VistaClasificacion from "../componente/vistasAdministrarTorneos/VistaClasificacion";
import VerEmparejamientos from "../componente/VerEmparejamientos";

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
                <div className="error-message">
                    <h2>⚠️ Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} className="btn-secondary">
                        ⬅️ Volver
                    </button>
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
                        📅 {formatearFecha(torneo?.fecha_inicio)}
                    </span>
                     <span className="info-item">
                        {torneo?.tipo_torneo || 'Tipo de juego no especificado'}
                    </span>
                    <span className="info-item">
                        {torneo?.tipo_torneo === 'Por equipos' ? '👥' : '👤'} {totalInscritos} / {maxInscritos} {torneo?.tipo_torneo === 'Por equipos' ? 'equipos' : 'participantes'}
                    </span>
                    <span className="info-item">
                        ⚔️ Época: {torneo?.epocas_disponibles || 'No especificada'}
                    </span>
                    {torneo?.ubicacion && (
                        <span className="info-item">
                            📍 {torneo.ubicacion}
                        </span>
                    )}
                    <span className="info-item">
                        ⚔️ Puntos: {torneo?.puntos_banda || 0} pts
                    </span>
                    <span className="info-item">
                        🎲 Rondas: {torneo?.rondas_max || 0}
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
                    <div className="vista-inscritos">
                        {torneo?.tipo_torneo === 'Individual' ? (
                            <>
                                <h2>👤 Jugadores Inscritos ({inscritos.length})</h2>
                                {inscritos.length === 0 ? (
                                    <div className="empty-message">
                                        <p>📭 Aún no hay jugadores inscritos en este torneo.</p>
                                    </div>
                                ) : (
                                    <div className="grid-inscritos">
                                        {inscritos.map((inscrito) => {
                                            const comp = inscrito.composicion_ejercito || {};
                                            const totalPuntos = 
                                                (parseFloat(comp.guardias) || 0) +
                                                (parseFloat(comp.guerreros) || 0) +
                                                (parseFloat(comp.levas) || 0) +
                                                (parseFloat(comp.mercenarios) || 0);

                                            return (
                                                <div key={inscrito.id} className="card-inscrito">
                                                    <div className="jugador-info">
                                                        <h3>
                                                            👤 {inscrito.jugador_nombre || 'Sin nombre'} {inscrito.jugador_apellidos || ''}
                                                        </h3>
                                                        {inscrito.club && <p className="club">🏛️ {inscrito.club}</p>}
                                                        {inscrito.ciudad && <p className="ubicacion">📍 {inscrito.ciudad}</p>}
                                                    </div>

                                                    <div className="banda-info">
                                                        <p><strong>Facción:</strong> {inscrito.faccion || "Sin definir"}</p>
                                                        <p><strong>Época:</strong> {inscrito.epoca || "Sin definir"}</p>
                                                        <p><strong>Puntos:</strong> {totalPuntos.toFixed(1)} pts</p>
                                                    </div>

                                                    {Object.keys(comp).length > 0 && (
                                                        <div className="composicion-banda">
                                                            <h5>📜 Composición:</h5>
                                                            <ul>
                                                                <li>Guardias: {parseFloat(comp.guardias) || 0}</li>
                                                                <li>Guerreros: {parseFloat(comp.guerreros) || 0}</li>
                                                                <li>Levas: {parseFloat(comp.levas) || 0}</li>
                                                                <li>Mercenarios: {parseFloat(comp.mercenarios) || 0}</li>
                                                                {comp.detalleMercenarios && (
                                                                    <li className="detalle-mercenarios">
                                                                        🧾 {comp.detalleMercenarios}
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h2>👥 Equipos Inscritos ({equipos.length})</h2>
                                {equipos.length === 0 ? (
                                    <div className="empty-message">
                                        <p>📭 Aún no hay equipos inscritos en este torneo.</p>
                                    </div>
                                ) : (
                                    <div className="grid-equipos">
                                        {equipos.map((equipo) => (
                                            <div key={equipo.id} className="card-equipo">
                                                <div className="equipo-header">
                                                    <h3>🏆 {equipo.nombre_equipo || 'Sin nombre'}</h3>
                                                    <span className="badge-capitan">
                                                        👑 Capitán: {equipo.capitan_nombre || 'Sin capitán'} {equipo.capitan_apellidos || ''}
                                                    </span>
                                                </div>

                                                <div className="equipo-miembros">
                                                    <h4>Miembros ({(equipo.miembros || []).length}):</h4>
                                                    {(equipo.miembros || []).length > 0 ? (
                                                        <ul className="lista-miembros">
                                                            {equipo.miembros.map((miembro, idx) => {
                                                                const comp = miembro.composicion || {};
                                                                const totalPuntos = 
                                                                    (parseFloat(comp.guardias) || 0) +
                                                                    (parseFloat(comp.guerreros) || 0) +
                                                                    (parseFloat(comp.levas) || 0) +
                                                                    (parseFloat(comp.mercenarios) || 0);

                                                                return (
                                                                    <li key={idx} className="miembro-item">
                                                                        <div className="miembro-header">
                                                                            <span className="miembro-nombre">
                                                                                {miembro.es_capitan && '👑 '}
                                                                                {miembro.nombre || 'Sin nombre'}
                                                                            </span>
                                                                            <span className="miembro-epoca-banda">
                                                                                {miembro.epoca || 'Sin época'} - {miembro.banda || 'Sin banda'}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {Object.keys(comp).length > 0 && (
                                                                            <div className="miembro-composicion">
                                                                                <div className="puntos-total">
                                                                                    <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
                                                                                </div>
                                                                                <div className="puntos-detalle">
                                                                                    <span>Guardias: {parseFloat(comp.guardias) || 0}</span>
                                                                                    <span>Guerreros: {parseFloat(comp.guerreros) || 0}</span>
                                                                                    <span>Levas: {parseFloat(comp.levas) || 0}</span>
                                                                                    <span>Mercenarios: {parseFloat(comp.mercenarios) || 0}</span>
                                                                                </div>
                                                                                {comp.detalleMercenarios && (
                                                                                    <div className="detalle-mercenarios-mini">
                                                                                        🧾 {comp.detalleMercenarios}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <p className="sin-miembros">Sin miembros</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {vistaActual === 'emparejamientos' && (
                    <VerEmparejamientos torneoId={torneoId} />
                )}

                {vistaActual === 'clasificacion' && (
                    <VistaClasificacion torneoId={torneoId} />
                )}
            </div>

            <footer className="footer-controles">
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                    ⬅️ Volver al Inicio
                </button>
            </footer>
        </div>
    );
}

export default VerTorneo;