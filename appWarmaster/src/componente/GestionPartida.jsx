import torneosSagaApi from "../servicios/apiSaga";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "../estilos/gestionPartida.css";

function GestionPartida() {
    const { torneoId } = useParams();
    const navigate = useNavigate();

    // Estados principales
    const [torneo, setTorneo] = useState(null);
    const [partidas, setPartidas] = useState([]);
    const [partidaSeleccionada, setPartidaSeleccionada] = useState(null);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [esAdmin, setEsAdmin] = useState(false);
    
    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        puntosPartidaJ1: 0,
        puntosPartidaJ2: 0,
        puntosMasacreJ1: 0,
        puntosMasacreJ2: 0,
        matoWarlordJ1: false,
        matoWarlordJ2: false
    });

    // Cargar usuario actual
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUsuarioActual({
                id: payload.userId,
                nombre: payload.nombre
            });
        } catch (error) {
            console.error('Error al decodificar token:', error);
            navigate('/login');
        }
    }, [navigate]);

    // Cargar datos del torneo y partidas
    useEffect(() => {
        if (torneoId && usuarioActual) {
            cargarDatos();
        }
    }, [torneoId, usuarioActual]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar torneo
            const response = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);

            // Verificar si es admin
            const esCreador = dataTorneo.created_by === usuarioActual.id;
            setEsAdmin(esCreador);

            // Cargar partidas del torneo
            const dataPartidas = await torneosSagaApi.obtenerPartidasTorneo(torneoId);
            const partidasArray = Array.isArray(dataPartidas) ? dataPartidas : dataPartidas.data || [];
            setPartidas(partidasArray);

            // Si no es admin, encontrar su partida actual
            if (!esCreador) {
                const miPartida = partidasArray.find(p => 
                    p.jugador1_id === usuarioActual.id || 
                    p.jugador2_id === usuarioActual.id
                );
                
                if (miPartida) {
                    setPartidaSeleccionada(miPartida);
                }
            }

        } catch (error) {
            console.error("Error al cargar datos:", error);
            setError("No se pudieron cargar los datos del torneo");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            // Asegurar que siempre sea un número válido
            const numValue = value === '' ? 0 : Number(value);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(numValue) ? 0 : numValue
            }));
        }
    };

   const handleSeleccionarPrimerJugador = async (jugadorId) => {
        if (!partidaSeleccionada) return;

        // Verificar que el jugador pertenece a la partida
        if (jugadorId !== partidaSeleccionada.jugador1_id && 
            jugadorId !== partidaSeleccionada.jugador2_id) {
            alert('Error: Jugador inválido');
            return;
        }

        try {
            setEnviando(true);
            
            await torneosSagaApi.actualizarPrimerJugador(
                torneoId,                 // ID del torneo
                jugadorId,                // ID del jugador que fue primero
                partidaSeleccionada.id    // ID de la partida
            );

            alert('✅ Primer jugador registrado correctamente');
            await cargarDatos(); // Recargar para actualizar el estado

        } catch (error) {
            console.error('Error:', error);
            alert('Error al registrar el primer jugador');
        } finally {
            setEnviando(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!partidaSeleccionada) {
            alert('No hay partida seleccionada');
            return;
        }

        // Validar que se haya asignado el primer jugador
        if (!partidaSeleccionada.primer_jugador) {
            alert('⚠️ Debes asignar el primer jugador antes de registrar los resultados');
            return;
        }

        // Validaciones
        if (formData.puntosPartidaJ1 === 0 && formData.puntosPartidaJ2 === 0) {
            alert('⚠️ Debes introducir al menos algunos puntos de partida');
            return;
        }

        if (!window.confirm('¿Confirmas que los datos son correctos?')) {
            return;
        }

        try {
            setEnviando(true);
            setError(null);

            const response = await fetch(
                `${torneosSagaApi.baseURL}/torneosSaga/${torneoId}/calcular-resultado`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        puntosPartidaJ1: formData.puntosPartidaJ1,
                        puntosPartidaJ2: formData.puntosPartidaJ2,
                        puntosMasacreJ1: formData.puntosMasacreJ1,
                        puntosMasacreJ2: formData.puntosMasacreJ2,
                        matoWarlordJ1: formData.matoWarlordJ1,
                        matoWarlordJ2: formData.matoWarlordJ2
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al registrar resultado');
            }

            const data = await response.json();
            
            alert(`✅ Resultado registrado correctamente\n\n${data.data?.resultado || ''}`);
            
            // Limpiar formulario
            setFormData({
                puntosPartidaJ1: 0,
                puntosPartidaJ2: 0,
                puntosMasacreJ1: 0,
                puntosMasacreJ2: 0,
                matoWarlordJ1: false,
                matoWarlordJ2: false
            });

            // Recargar datos
            await cargarDatos();
            
            // Si no es admin, limpiar partida seleccionada
            if (!esAdmin) {
                setPartidaSeleccionada(null);
            }

        } catch (error) {
            console.error("Error al registrar resultado:", error);
            setError(error.message || "No se pudo registrar el resultado");
        } finally {
            setEnviando(false);
        }
    };

    const seleccionarPartida = (partida) => {
        setPartidaSeleccionada(partida);
        setFormData({
            puntosPartidaJ1: 0,
            puntosPartidaJ2: 0,
            puntosMasacreJ1: 0,
            puntosMasacreJ2: 0,
            matoWarlordJ1: false,
            matoWarlordJ2: false
        });
    };

    // ==========================================
    // PANTALLAS DE CARGA Y ERROR
    // ==========================================

    if (loading) {
        return (
            <div className="loading-container">
                ⏳ Cargando datos...
            </div>
        );
    }

    if (error && !partidaSeleccionada) {
        return (
            <div className="error-container">
                <h2>⚠️ Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate(-1)} className="btn-secondary">
                    ⬅️ Volver
                </button>
            </div>
        );
    }

    // ==========================================
    // RENDER PRINCIPAL
    // ==========================================

    return (
        <div className="gestion-partida-container">
            <header className="partida-header">
                <h1>⚔️ Gestión de Partidas</h1>
                <p className="torneo-nombre">{torneo?.nombre_torneo}</p>
                {usuarioActual && (
                    <p className="usuario-info">
                        👤 {esAdmin ? 'Admin' : 'Jugador'}: {usuarioActual.nombre}
                    </p>
                )}
            </header>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            <div className="contenido-partidas">
                {/* ========== VISTA ADMIN: LISTA DE PARTIDAS ========== */}
                {esAdmin && (
                    <div className="seccion-admin">
                        <h2>📋 Todas las Partidas del Torneo</h2>
                        
                        {partidas.length === 0 ? (
                            <div className="empty-message">
                                <p>No hay partidas registradas todavía.</p>
                                <p>Ve a "Emparejamientos" para generar las partidas.</p>
                            </div>
                        ) : (
                            <div className="lista-partidas">
                                {partidas.map((partida) => (
                                    <div 
                                        key={partida.id} 
                                        className={`partida-card ${partidaSeleccionada?.id === partida.id ? 'seleccionada' : ''}`}
                                        onClick={() => seleccionarPartida(partida)}
                                    >
                                        <div className="partida-header">
                                            <span className="ronda-badge">Ronda {partida.ronda}</span>
                                            {partida.resultado && (
                                                <span className="estado-badge completada">
                                                    ✅ Completada
                                                </span>
                                            )}
                                        </div>
                                        <div className="partida-enfrentamiento">
                                            <div className="jugador">
                                                <span className="nombre">{partida.jugador1_nombre}</span>
                                                {partida.puntos_victoria_j1 !== null && (
                                                    <span className="puntos">{partida.puntos_victoria_j1} pts</span>
                                                )}
                                            </div>
                                            <span className="vs">VS</span>
                                            <div className="jugador">
                                                <span className="nombre">{partida.jugador2_nombre}</span>
                                                {partida.puntos_victoria_j2 !== null && (
                                                    <span className="puntos">{partida.puntos_victoria_j2} pts</span>
                                                )}
                                            </div>
                                        </div>
                                        {partidaSeleccionada?.id === partida.id && (
                                            <p className="click-hint">👆 Partida seleccionada - Edita abajo</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ========== VISTA JUGADOR: SU PARTIDA ========== */}
                {!esAdmin && !partidaSeleccionada && (
                    <div className="sin-partida">
                        <h2>📭 Sin Partida Asignada</h2>
                        <p>No tienes partidas pendientes en este momento.</p>
                        <p>Espera a que el organizador realice los emparejamientos.</p>
                        <button onClick={() => navigate(-1)} className="btn-secondary">
                            ⬅️ Volver
                        </button>
                    </div>
                )}

                {/* ========== FORMULARIO DE GESTIÓN ========== */}
                {partidaSeleccionada && (
                    <div className="seccion-formulario">
                        <div className="info-partida-actual">
                            <h2>📝 Gestionar Partida - Ronda {partidaSeleccionada.ronda}</h2>
                            
                            <div className="enfrentamiento-info">
                                <div className="jugador-info">
                                    <h3>Jugador 1</h3>
                                    <p className="nombre">{partidaSeleccionada.jugador1_nombre}</p>
                                    {partidaSeleccionada.puntos_victoria_j1 !== null && (
                                        <p className="puntos-actuales">
                                            Pts Victoria: {partidaSeleccionada.puntos_victoria_j1}
                                        </p>
                                    )}
                                </div>

                                <div className="vs-separator">VS</div>

                                <div className="jugador-info">
                                    <h3>Jugador 2</h3>
                                    <p className="nombre">{partidaSeleccionada.jugador2_nombre}</p>
                                    {partidaSeleccionada.puntos_victoria_j2 !== null && (
                                        <p className="puntos-actuales">
                                            Pts Victoria: {partidaSeleccionada.puntos_victoria_j2}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ========== ASIGNAR PRIMER JUGADOR ========== */}
                            <div className="primer-jugador-section">
                                <h3>🎲 Primer Jugador</h3>
                                {partidaSeleccionada.primer_jugador ? (
                                    <div className="primer-jugador-asignado">
                                        <p>✅ Primer jugador: <strong>
                                            {partidaSeleccionada.primer_jugador === partidaSeleccionada.jugador1_id 
                                                ? partidaSeleccionada.jugador1_nombre 
                                                : partidaSeleccionada.jugador2_nombre}
                                        </strong></p>
                                    </div>
                                ) : (
                                    <div className="asignar-primer-jugador">
                                        <p>⚠️ Debes asignar quién fue el primer jugador:</p>
                                        <div className="botones-primer-jugador">
                                            <button
                                                onClick={() => handleSeleccionarPrimerJugador(partidaSeleccionada.jugador1_id)}
                                                disabled={enviando}
                                                className="btn-jugador"
                                            >
                                                {partidaSeleccionada.jugador1_nombre}
                                            </button>
                                            <button
                                                onClick={() => handleSeleccionarPrimerJugador(partidaSeleccionada.jugador2_id)}
                                                disabled={enviando}
                                                className="btn-jugador"
                                            >
                                                {partidaSeleccionada.jugador2_nombre}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ========== FORMULARIO DE RESULTADOS ========== */}
                        {partidaSeleccionada.primer_jugador && (
                            <form onSubmit={handleSubmit} className="formulario-resultados">
                                <h3>📊 Introducir Resultados</h3>

                                <div className="formulario-grid">
                                    {/* COLUMNA JUGADOR 1 */}
                                    <div className="columna-jugador">
                                        <h4>🎯 {partidaSeleccionada.jugador1_nombre}</h4>
                                        
                                        <div className="form-group">
                                            <label>Puntos de Partida:*</label>
                                            <input
                                                type="number"
                                                name="puntosPartidaJ1"
                                                min="0"
                                                value={formData.puntosPartidaJ1}
                                                onChange={handleInputChange}
                                                required
                                                disabled={enviando}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Puntos de Masacre:</label>
                                            <input
                                                type="number"
                                                name="puntosMasacreJ1"
                                                min="0"
                                                value={formData.puntosMasacreJ1}
                                                onChange={handleInputChange}
                                                disabled={enviando}
                                            />
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    name="matoWarlordJ1"
                                                    checked={formData.matoWarlordJ1}
                                                    onChange={handleInputChange}
                                                    disabled={enviando}
                                                />
                                                Eliminó al Warlord enemigo
                                            </label>
                                        </div>
                                    </div>

                                    {/* COLUMNA JUGADOR 2 */}
                                    <div className="columna-jugador">
                                        <h4>🎯 {partidaSeleccionada.jugador2_nombre}</h4>
                                        
                                        <div className="form-group">
                                            <label>Puntos de Partida:*</label>
                                            <input
                                                type="number"
                                                name="puntosPartidaJ2"
                                                min="0"
                                                value={formData.puntosPartidaJ2}
                                                onChange={handleInputChange}
                                                required
                                                disabled={enviando}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Puntos de Masacre:</label>
                                            <input
                                                type="number"
                                                name="puntosMasacreJ2"
                                                min="0"
                                                value={formData.puntosMasacreJ2}
                                                onChange={handleInputChange}
                                                disabled={enviando}
                                            />
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    name="matoWarlordJ2"
                                                    checked={formData.matoWarlordJ2}
                                                    onChange={handleInputChange}
                                                    disabled={enviando}
                                                />
                                                Eliminó al Warlord enemigo
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="botones-formulario">
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={enviando}
                                    >
                                        {enviando ? '⏳ Enviando...' : '✅ Registrar Resultado'}
                                    </button>
                                    
                                    {esAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setPartidaSeleccionada(null)}
                                            className="btn-secondary"
                                            disabled={enviando}
                                        >
                                            ❌ Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            <footer className="footer-controles">
                <button 
                    onClick={() => navigate(-1)} 
                    className="btn-atras"
                >
                    ⬅️ Volver
                </button>
            </footer>
        </div>
    );
}

export default GestionPartida;