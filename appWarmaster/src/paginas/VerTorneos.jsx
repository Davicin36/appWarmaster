import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import torneosSagaApi from "../servicios/apiSaga";

import VistaClasificacion from "../componente/vistas/VistaClasificacion";
import VerEmparejamientos from "../componente/VerEmparejamientos";

import "../estilos/verTorneo.css";

function VerTorneo() {
    const { torneoId } = useParams();
    const navigate = useNavigate();

    const [torneo, setTorneo] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [vistaActual, setVistaActual] = useState('informacion'); // 'informacion', 'inscritos', 'emparejamientos', 'clasificacion'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            const responseTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);

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
            console.error("Error al cargar datos:", error);
            setError("No se pudieron cargar los datos del torneo");
        } finally {
            setLoading(false);
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
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '1.5em',
                color: '#4a7c2e'
            }}>
                ⏳ Cargando datos del torneo...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                maxWidth: '600px', 
                margin: '100px auto', 
                padding: '40px', 
                textAlign: 'center',
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ color: '#d32f2f', marginBottom: '20px' }}>⚠️ Error</h2>
                <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>{error}</p>
                <button onClick={() => navigate(-1)} className="btn-secondary">
                    ⬅️ Volver
                </button>
            </div>
        );
    }

    return (
        <div className="ver-torneo-container">
            {/* HEADER */}
            <header className="torneo-header">
                <h1>🏆 {torneo?.nombre_torneo}</h1>
                <div className="torneo-info">
                    <span className={`estado-badge ${torneo?.estado || 'pendiente'}`}>
                        {torneo?.estado?.toUpperCase() || 'PENDIENTE'}
                    </span>
                    <span>📅 {torneo?.fecha_inicio ? new Date(torneo.fecha_inicio).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                    <span>👥 {inscritos.length} / {torneo?.participantes_max || 0} inscritos</span>
                    <span>⚔️ Época: {torneo.epoca_torneo}</span>
                     {torneo.ubicacion && (
                        <span>📍 Ubicación: {torneo.ubicacion}</span>          
                    )}
                     <span>⚔️ Puntos de Banda: {torneo.puntos_banda} pts</span>
                     <span>🎲 Rondas: {torneo.rondas_max}</span>
                     <div className="torneo-bases">
                        <h2>📄 Bases del Torneo</h2>
                                    <p> <strong>{torneo.bases_nombre}</strong></p>
                                    <button onClick={descargarBases} className="btn-primary">
                                        ⬇️ Descargar Bases
                                    </button>
                     </div>                      
                </div>
            </header>

            {/* NAVEGACIÓN POR TABS */}
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

            {/* CONTENIDO SEGÚN LA VISTA */}
            <div className="contenido-principal">
                {vistaActual === 'informacion' && (
                    <>
                        <div className="vista-inscritos">
                            <h2>👥 Jugadores Inscritos ({inscritos.length})</h2>
                            {inscritos.length === 0 ? (
                                <div className="empty-message">
                                    <p>📭 Aún no hay jugadores inscritos en este torneo.</p>
                                </div>
                            ) : (
                                <div className="grid-inscritos">
                                    {inscritos.map((inscrito) => {
                                        const comp = inscrito.composicion_ejercito || {};
                                        const totalPuntos = 
                                            (comp.guardias || 0) +
                                            (comp.guerreros || 0) +
                                            (comp.levas || 0) +
                                            (comp.mercenarios || 0);

                                        return (
                                            <div key={inscrito.id} className="card-inscrito">
                                                <div className="jugador-info">
                                                    <h3>👤 {inscrito.jugador_nombre} {inscrito.jugador_apellidos}</h3>
                                                    {inscrito.club && <p className="club">🏛️ {inscrito.club}</p>}
                                                    {inscrito.ciudad && <p className="ubicacion">📍 {inscrito.ciudad}</p>}
                                                </div>

                                                <div className="banda-info">
                                                    <p><strong>Facción:</strong> {inscrito.faccion || "Sin definir"}</p>
                                                    <p><strong>Puntos:</strong> {totalPuntos} pts</p>
                                                </div>

                                                {Object.keys(comp).length > 0 && (
                                                    <div className="composicion-banda">
                                                        <h5>📜 Composición:</h5>
                                                        <ul>
                                                            <li>Guardias: {comp.guardias || 0}</li>
                                                            <li>Guerreros: {comp.guerreros || 0}</li>
                                                            <li>Levas: {comp.levas || 0}</li>
                                                            <li>Mercenarios: {comp.mercenarios || 0}</li>
                                                            {comp.detalleMercenarios && (
                                                                <li>🧾 Detalle: {comp.detalleMercenarios}</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}

                                                {inscrito.lista_url && (
                                                    <div className="lista-ejercito">
                                                        <a 
                                                            href={inscrito.lista_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="btn-ver-lista"
                                                        >
                                                            📄 Ver Lista Completa (PDF)
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* VISTA EMPAREJAMIENTOS */}
                            {/* VISTA EMPAREJAMIENTOS */}
                            {vistaActual === 'emparejamientos' && (
                                <VerEmparejamientos torneoId={torneoId} />
                            )}
            
                            {/* VISTA CLASIFICACIÓN */}
                            {vistaActual === 'clasificacion' && (
                                <VistaClasificacion torneoId={torneoId} />
                            )}
                        </div>
            
            {/* FOOTER CON BOTÓN VOLVER */}
            <footer className="footer-controles">
                <button type="button" onClick={() => navigate(-1)} className="btn-atras">
                    ⬅️ Volver al Inicio
                </button>
            </footer>
        </div>
    );
}

export default VerTorneo;
            
           
    

