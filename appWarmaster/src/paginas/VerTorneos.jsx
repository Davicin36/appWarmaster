import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import torneosSagaApi from "../servicios/apiSaga";
import "../estilos/verTorneo.css";

function DetallesTorneo() {
    const { torneoId } = useParams();
    const navigate = useNavigate();

    const [torneo, setTorneo] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            // Cargar información del torneo
            const responseTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);

            // ✅ Usar el endpoint existente
            const responseInscritos = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
            setInscritos(responseInscritos.data || responseInscritos || []);

        } catch (error) {
            console.error("Error al cargar datos:", error);
            setError("No se pudieron cargar los datos del torneo");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-container">⏳ Cargando...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={() => navigate(-1)}>⬅️ Volver</button>
            </div>
        );
    }

    return (
        <div className="detalles-torneo-container">
            {/* HEADER DEL TORNEO */}
            <header className="torneo-header">
                <h1>🏆 {torneo?.nombre_torneo}</h1>
                <div className="torneo-info-general">
                    <p><strong>📅 Fecha:</strong> {new Date(torneo?.fecha_inicio).toLocaleDateString()} - {new Date(torneo?.fecha_fin).toLocaleDateString()}</p>
                    <p><strong>📍 Ubicación:</strong> {torneo?.ubicacion}</p>
                    <p><strong>⚔️ Época:</strong> {torneo?.epoca_torneo}</p>
                    <p><strong>🎲 Rondas:</strong> {torneo?.rondas_max}</p>
                    <p><strong>👥 Inscritos:</strong> {inscritos.length} / {torneo?.participantes_max}</p>
                    <p><strong>📊 Estado:</strong> <span className={`badge-${torneo?.estado}`}>{torneo?.estado}</span></p>
                </div>
            </header>

            {/* LISTA DE INSCRITOS */}
            <section className="seccion-inscritos">
                <h2>👥 Jugadores Inscritos ({inscritos.length})</h2>

                {inscritos.length === 0 ? (
                    <div className="empty-message">
                        <p>📭 Aún no hay jugadores inscritos en este torneo.</p>
                    </div>
                ) : (
                    <div className="grid-inscritos">
                        {inscritos.map((inscrito) => (
                            <div key={inscrito.id} className="card-inscrito">
                                {/* INFORMACIÓN DEL JUGADOR */}
                                <div className="jugador-info">
                                    <h3>👤 {inscrito.jugador_nombre} {inscrito.jugador_apellidos}</h3>
                                    {inscrito.club && (
                                        <p className="club">🏛️ {inscrito.club}</p>
                                    )}
                                    {inscrito.ciudad && (
                                        <p className="ubicacion">📍 {inscrito.ciudad}</p>
                                    )}
                                </div>

                                {/* INFORMACIÓN DE LA BANDA */}
                                <div className="banda-info">
                                    <h4>⚔️ Banda: {inscrito.nombre_banda}</h4>
                                    <p><strong>Facción:</strong> {inscrito.faccion}</p>
                                    <p><strong>Puntos:</strong> {inscrito.puntos_banda} pts</p>
                                    
                                    {inscrito.warlord && (
                                        <p><strong>🎖️ Warlord:</strong> {inscrito.warlord}</p>
                                    )}
                                </div>

                                {/* COMPOSICIÓN DE LA BANDA */}
                                {inscrito.composicion && (
                                    <div className="composicion-banda">
                                        <h5>📜 Composición:</h5>
                                        <div className="composicion-texto">
                                            {inscrito.composicion.split('\n').map((linea, idx) => (
                                                <p key={idx}>{linea}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* LISTA DEL EJÉRCITO (PDF) */}
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
                        ))}
                    </div>
                )}
            </section>

            {/* BOTONES DE NAVEGACIÓN */}
            <footer className="footer-acciones">
                <button onClick={() => navigate(-1)} className="btn-secondary">
                    ⬅️ Volver
                </button>
                <button onClick={() => navigate(`/torneo/${torneoId}`)} className="btn-primary">
                    📊 Ver Clasificación
                </button>
            </footer>
        </div>
    );
}

export default DetallesTorneo;