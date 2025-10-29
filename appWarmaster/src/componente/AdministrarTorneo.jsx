import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import torneosSagaApi from '../servicios/apiSaga.js';

import '../estilos/administrarTorneo.css';

function AdministrarTorneo() {
    const navigate = useNavigate();
    const { torneoId } = useParams();
    
    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [partidas, setPartidas] = useState([]);
    const [clasificacion, setClasificacion] = useState([]);
    const [rondaActual, setRondaActual] = useState(1);
    
    const [nuevaPartida, setNuevaPartida] = useState({
        jugador1_id: '',
        jugador2_id: '',
        puntos_masacre_j1: 0,
        puntos_masacre_j2: 0,
        warlord_muerto_j1: false,
        warlord_muerto_j2: false,
        ronda: 1
    });

    const [vistaActual, setVistaActual] = useState('general');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!torneoId) {
            setError('No se especificó un ID de torneo');
            setLoading(false);
            return;
        }
        cargarDatosTorneo();
    }, [torneoId]);

    const cargarDatosTorneo = async () => {
    try {
        setLoading(true);
        setError('');
        
        // Cargar información del torneo
        const response = await torneosSagaApi.getTorneo(torneoId);
        // ✅ Acceder a data.torneo en lugar de directamente a la respuesta
        const dataTorneo = response.data?.torneo || response.torneo || response;
        setTorneo(dataTorneo);
        
        // Cargar jugadores del torneo
        try {
            const dataJugadores = await torneosSagaApi.getJugadoresTorneo(torneoId);
            // ✅ Los jugadores vienen directamente como array
            setJugadores(Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []);
        } catch (err) {
            console.log('No hay jugadores todavía', err);
            setJugadores([]);
        }
        
        // Cargar partidas
        try {
            const dataPartidas = await torneosSagaApi.getPartidasTorneo(torneoId);
            setPartidas(Array.isArray(dataPartidas) ? dataPartidas : dataPartidas.data || []);
        } catch (err) {
            console.log('No hay partidas todavía', err);
            setPartidas([]);
        }
        
        // Cargar clasificación
        try {
            const dataClasificacion = await torneosSagaApi.getClasificacionTorneo(torneoId);
            setClasificacion(Array.isArray(dataClasificacion) ? dataClasificacion : dataClasificacion.data || []);
        } catch (err) {
            console.log('No hay clasificación todavía', err);
            setClasificacion([]);
        }
        
        setLoading(false);
    } catch (error) {
        console.error('Error al cargar datos:', error);
        setError(`Error al cargar los datos del torneo: ${error.message}`);
        setLoading(false);
    }
};

    const handleInputPartida = (e) => {
        const { name, value, type, checked } = e.target;
        setNuevaPartida(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const registrarPartida = async (e) => {
        e.preventDefault();
        
        if (nuevaPartida.jugador1_id === nuevaPartida.jugador2_id) {
            alert('Debes seleccionar dos jugadores diferentes');
            return;
        }

        try {
            await torneosSagaApi.createPartida({
                torneo_id: torneoId,
                ...nuevaPartida
            });

            alert('Partida registrada exitosamente');
            setNuevaPartida({
                jugador1_id: '',
                jugador2_id: '',
                puntos_masacre_j1: 0,
                puntos_masacre_j2: 0,
                warlord_muerto_j1: false,
                warlord_muerto_j2: false,
                ronda: rondaActual
            });
            await cargarDatosTorneo();
            setVistaActual('clasificacion');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al registrar la partida');
        }
    };

    const cambiarEstadoTorneo = async (nuevoEstado) => {
        if (!window.confirm(`¿Estás seguro de ${nuevoEstado === 'finalizado' ? 'finalizar' : 'cambiar el estado del'} torneo?`)) {
            return;
        }

        try {
            await torneosSagaApi.cambiarEstadoTorneo(torneoId, nuevoEstado);
            alert('Estado actualizado correctamente');
            await cargarDatosTorneo();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al actualizar el estado');
        }
    };

    const volverInicio = () => {
        navigate('/');
    };

    // PANTALLA DE CARGA
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

    // PANTALLA DE ERROR
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
                <button 
                    onClick={volverInicio}
                    style={{
                        padding: '12px 30px',
                        background: '#795548',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.1em',
                        cursor: 'pointer'
                    }}
                >
                    ⬅️ Volver al Inicio
                </button>
            </div>
        );
    }

    // PANTALLA PRINCIPAL
    return (
        <div className="administrar-torneo-container">
            <header className="torneo-header">
                <h1>⚔️ {torneo?.nombre_torneo || 'Torneo'}</h1>
                <div className="torneo-info">
                    <span className={`estado-badge ${torneo?.estado || 'pendiente'}`}>
                        {torneo?.estado?.toUpperCase() || 'PENDIENTE'}
                    </span>
                    <span>📅 {torneo?.fecha_inicio ? new Date(torneo.fecha_inicio).toLocaleDateString() : 'Sin fecha'}</span>
                    <span>👥 {jugadores.length} jugadores</span>
                </div>
            </header>

            <nav className="vista-nav">
                <button 
                    className={vistaActual === 'general' ? 'active' : ''}
                    onClick={() => setVistaActual('general')}
                >
                    📊 General
                </button>
                <button 
                    className={vistaActual === 'registrar' ? 'active' : ''}
                    onClick={() => setVistaActual('registrar')}
                    disabled={torneo?.estado === 'finalizado'}
                >
                    ⚔️ Registrar Partida
                </button>
                <button 
                    className={vistaActual === 'clasificacion' ? 'active' : ''}
                    onClick={() => setVistaActual('clasificacion')}
                >
                    🏆 Clasificación
                </button>
            </nav>

            <div className="contenido-principal">
                {/* VISTA GENERAL */}
                {vistaActual === 'general' && (
                    <div className="vista-general">
                        <section className="seccion-gestion">
                            <h2>⚙️ Gestión del Torneo</h2>
                            <div className="controles-torneo">
                                <div className="control-ronda">
                                    <label>Ronda Actual:</label>
                                    <select 
                                        value={rondaActual} 
                                        onChange={(e) => setRondaActual(parseInt(e.target.value))}
                                        disabled={torneo?.estado === 'finalizado'}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <option key={num} value={num}>Ronda {num}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {torneo?.estado === 'activo' && (
                                    <button 
                                        className="btn-finalizar"
                                        onClick={() => cambiarEstadoTorneo('finalizado')}
                                    >
                                        🏁 Finalizar Torneo
                                    </button>
                                )}
                            </div>
                        </section>

                        <section className="seccion-jugadores">
                            <h2>👥 Jugadores Inscritos ({jugadores.length})</h2>
                            {jugadores.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                    No hay jugadores inscritos todavía
                                </p>
                            ) : (
                                <div className="lista-jugadores">
                                    {jugadores.map((jugador, index) => (
                                        <div key={jugador.id} className="jugador-card">
                                            <span className="jugador-numero">{index + 1}</span>
                                            <span className="jugador-nombre">{jugador.nombre}</span>
                                            <span className="jugador-ejercito">{jugador.ejercito || 'Sin ejército'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="seccion-partidas-recientes">
                            <h2>📋 Últimas Partidas ({partidas.length})</h2>
                            {partidas.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                    No hay partidas registradas todavía
                                </p>
                            ) : (
                                <div className="lista-partidas-recientes">
                                    {partidas.slice(-5).reverse().map((partida) => (
                                        <div key={partida.id} className="partida-reciente">
                                            <span className="ronda-badge">R{partida.ronda}</span>
                                            <div className="enfrentamiento">
                                                <span className={partida.resultado === 'victoria_j1' ? 'ganador' : ''}>
                                                    {partida.jugador1_nombre}
                                                </span>
                                                <span className="vs">VS</span>
                                                <span className={partida.resultado === 'victoria_j2' ? 'ganador' : ''}>
                                                    {partida.jugador2_nombre}
                                                </span>
                                            </div>
                                            <span className="puntos">
                                                {partida.puntos_masacre_j1} - {partida.puntos_masacre_j2}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* VISTA REGISTRAR PARTIDA */}
                {vistaActual === 'registrar' && (
                    <div className="vista-registrar">
                        <h2>⚔️ Registrar Nueva Partida - Ronda {rondaActual}</h2>
                        {jugadores.length < 2 ? (
                            <p style={{ textAlign: 'center', color: '#d32f2f', padding: '40px', fontSize: '1.2em' }}>
                                ⚠️ Necesitas al menos 2 jugadores inscritos para registrar partidas
                            </p>
                        ) : (
                            <form onSubmit={registrarPartida} className="formulario-partida">
                                <div className="jugadores-seleccion">
                                    <div className="jugador-grupo">
                                        <label>Jugador 1:</label>
                                        <select
                                            name="jugador1_id"
                                            value={nuevaPartida.jugador1_id}
                                            onChange={handleInputPartida}
                                            required
                                        >
                                            <option value="">Selecciona jugador</option>
                                            {jugadores.map(j => (
                                                <option key={j.id} value={j.id}>
                                                    {j.nombre} {j.ejercito ? `- ${j.ejercito}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        <div className="puntos-grupo">
                                            <label>Puntos de Masacre:</label>
                                            <input
                                                type="number"
                                                name="puntos_masacre_j1"
                                                value={nuevaPartida.puntos_masacre_j1}
                                                onChange={handleInputPartida}
                                                min="0"
                                                max="2000"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="checkbox-grupo">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    name="warlord_muerto_j1"
                                                    checked={nuevaPartida.warlord_muerto_j1}
                                                    onChange={handleInputPartida}
                                                />
                                                Warlord muerto
                                            </label>
                                        </div>
                                    </div>

                                    <div className="vs-separator">VS</div>

                                    <div className="jugador-grupo">
                                        <label>Jugador 2:</label>
                                        <select
                                            name="jugador2_id"
                                            value={nuevaPartida.jugador2_id}
                                            onChange={handleInputPartida}
                                            required
                                        >
                                            <option value="">Selecciona jugador</option>
                                            {jugadores.map(j => (
                                                <option key={j.id} value={j.id}>
                                                    {j.nombre} {j.ejercito ? `- ${j.ejercito}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        <div className="puntos-grupo">
                                            <label>Puntos de Masacre:</label>
                                            <input
                                                type="number"
                                                name="puntos_masacre_j2"
                                                value={nuevaPartida.puntos_masacre_j2}
                                                onChange={handleInputPartida}
                                                min="0"
                                                max="2000"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="checkbox-grupo">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    name="warlord_muerto_j2"
                                                    checked={nuevaPartida.warlord_muerto_j2}
                                                    onChange={handleInputPartida}
                                                />
                                                Warlord muerto
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="botones-formulario">
                                    <button type="submit" className="btn-registrar">
                                        ✅ Registrar Partida
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-cancelar"
                                        onClick={() => setNuevaPartida({
                                            jugador1_id: '',
                                            jugador2_id: '',
                                            puntos_masacre_j1: 0,
                                            puntos_masacre_j2: 0,
                                            warlord_muerto_j1: false,
                                            warlord_muerto_j2: false,
                                            ronda: rondaActual
                                        })}
                                    >
                                        🔄 Limpiar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* VISTA CLASIFICACIÓN */}
                {vistaActual === 'clasificacion' && (
                    <div className="vista-clasificacion">
                        <h2>🏆 Clasificación del Torneo</h2>
                        {clasificacion.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '40px', fontSize: '1.2em' }}>
                                📊 No hay clasificación disponible todavía
                            </p>
                        ) : (
                            <table className="tabla-clasificacion">
                                <thead>
                                    <tr>
                                        <th>Pos</th>
                                        <th>Jugador</th>
                                        <th>Pts Torneo</th>
                                        <th>Pts Victoria</th>
                                        <th>Partidas</th>
                                        <th>V-E-D</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clasificacion.map((jugador, index) => (
                                        <tr key={jugador.jugador_id} className={index < 3 ? `top-${index + 1}` : ''}>
                                            <td className="posicion">
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && index + 1}
                                            </td>
                                            <td className="nombre-jugador">{jugador.nombre_jugador}</td>
                                            <td className="puntos-destacado">{jugador.total_puntos_torneo || 0}</td>
                                            <td>{jugador.total_puntos_victoria || 0}</td>
                                            <td>{jugador.partidas_jugadas || 0}</td>
                                            <td className="record">
                                                {jugador.victorias || 0}-{jugador.empates || 0}-{jugador.derrotas || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            <footer className="footer-controles">
                <button type="button" onClick={volverInicio} className="btn-atras">
                    ⬅️ Volver al Inicio
                </button>
            </footer>
        </div>
    );
}

export default AdministrarTorneo;