import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '../../servicios/apiSaga';

function VistaJugadores({ torneoId: propTorneoId }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
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
            
            // Cargar torneo
            const responseTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);
            
            // Cargar jugadores
            const responseJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
            const dataJugadores = responseJugadores.data || responseJugadores || [];
            setJugadores(Array.isArray(dataJugadores) ? dataJugadores : []);
            
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const marcarComoPagado = async (jugadorId, nombreJugador) => {
        try {
            const confirmar = window.confirm(
                `¿Confirmar que ${nombreJugador} ha pagado la inscripción?`
            );
            
            if (!confirmar) return;

            await torneosSagaApi.actualizarPago(torneoId, jugadorId, { 
                pagado: 'pagado' 
            });

            await cargarDatos();
            alert('✅ Pago registrado exitosamente');

        } catch (error) {
            console.error('Error al marcar como pagado:', error);
            alert('❌ Error al registrar el pago: ' + error.message);
        }
    };

    const marcarComoPendiente = async (jugadorId, nombreJugador) => {
        try {
            const confirmar = window.confirm(
                `¿Marcar el pago de ${nombreJugador} como pendiente?`
            );
            
            if (!confirmar) return;

            await torneosSagaApi.actualizarPago(torneoId, jugadorId, { 
                pagado: 'pendiente' 
            });

            await cargarDatos();
            alert('⏳ Estado actualizado a pendiente');

        } catch (error) {
            console.error('Error al marcar como pendiente:', error);
            alert('❌ Error al actualizar estado: ' + error.message);
        }
    };

    const eliminarJugador = async (jugadorId, nombreJugador) => {
        if (!window.confirm(`¿Estás seguro de eliminar a ${nombreJugador} del torneo?`)) {
            return;
        }

        try {
            await torneosSagaApi.eliminarJugadorTorneo(torneoId, jugadorId);
            alert(`✅ ${nombreJugador} eliminado correctamente del torneo`);
            await cargarDatos();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar el jugador');
        }
    };

    if (loading) {
        return (
            <div className="vista-jugadores">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    ⏳ Cargando jugadores...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vista-jugadores">
                <div className="error-message">
                    ⚠️ {error}
                    <button onClick={cargarDatos} className="btn-secondary" style={{ marginTop: '15px' }}>
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="vista-jugadores">
            <h2>👥 Jugadores Inscritos ({jugadores.length} / {torneo?.participantes_max || 0})</h2>
            {jugadores.length === 0 ? (
                <div className="empty-message">
                    <p>No hay jugadores inscritos todavía</p>
                </div>
            ) : (
                <div className="tabla-jugadores-container">
                    <table className="tabla-jugadores-detalle">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nombre</th>
                                <th>Club</th>
                                <th>Facción</th>
                                <th>Composición</th>
                                <th>Estado Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jugadores.map((jugador, index) => {
                                const nombreCompleto = `${jugador.jugador_nombre} ${jugador.jugador_apellidos}`;
                                
                                return (
                                    <tr key={jugador.id}>
                                        <td>{index + 1}</td>
                                        <td className="nombre-jugador-completo">
                                            <strong>{nombreCompleto}</strong>
                                        </td>
                                        <td>{jugador.club || '-'}</td>
                                        <td>{jugador.faccion}</td>
                                        <td>{jugador.composicion_ejercito}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.85em',
                                                fontWeight: 'bold',
                                                background: jugador.pagado === 'pagado' ? '#4caf50' : '#ff9800',
                                                color: 'white',
                                                display: 'inline-block'
                                            }}>
                                                {jugador.pagado === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {jugador.pagado === 'pendiente' ? (
                                                    <button
                                                        onClick={() => marcarComoPagado(
                                                            jugador.jugador_id, 
                                                            nombreCompleto
                                                        )}
                                                        style={{
                                                            background: '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85em'
                                                        }}
                                                    >
                                                        💰 Marcar pagado
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => marcarComoPendiente(
                                                            jugador.jugador_id, 
                                                            nombreCompleto
                                                        )}
                                                        style={{
                                                            background: '#ff9800',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85em'
                                                        }}
                                                    >
                                                        ⏳ Marcar pendiente
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={() => eliminarJugador(
                                                        jugador.jugador_id, 
                                                        nombreCompleto
                                                    )}
                                                    style={{
                                                        background: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85em'
                                                    }}
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default VistaJugadores;