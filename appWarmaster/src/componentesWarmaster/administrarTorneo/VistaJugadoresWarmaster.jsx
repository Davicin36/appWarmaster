import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosWarmasterApi from '@/servicios/apiWarmaster';

import '@/estilos/vistasTorneos/vistaJugadores.css';

function VistaJugadoresWarmaster({ torneoId: propTorneoId, tipoTorneo, jugadores: propJugadores, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    
    const [jugadores, setJugadores] = useState(propJugadores || []);
    const [loading, setLoading] = useState(false);
    const [loadingPago, setLoadingPago] = useState({});

    useEffect(() => {
        if (!propJugadores){
            cargarDatos();  
        }
    }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
                const { data } = await torneosWarmasterApi.obtenerJugadoresTorneo(torneoId);
                setJugadores(data)      
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstadoPagoJugador = async (jugadorId, estadoActual) => {

        const estadoNormalizado = (estadoActual === 1 || estadoActual === true || estadoActual === 'pagado') 
        ? 'pagado' 
        : 'pendiente';

        const nuevoEstado = estadoNormalizado === 'pagado' ? 'pendiente' : 'pagado';

        const confirmar = window.confirm(
            `¿Cambiar estado de pago a "${nuevoEstado.toUpperCase()}"?`
        );
        
        if (!confirmar) return;
            
        try {
            setLoadingPago(prev => ({ ...prev, [`jugador-${jugadorId}`]: true }));
            
            await torneosWarmasterApi.actualizarPagoJugador(torneoId, jugadorId, nuevoEstado);
            
            setJugadores(prev => prev.map(j => 
                j.id === jugadorId 
                    ? { ...j, pagado: nuevoEstado }
                    : j
            ));

            alert(`✅ Estado actualizado a: ${nuevoEstado.toUpperCase()}`);
            
            if (onUpdate) onUpdate();
            
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setLoadingPago(prev => ({ ...prev, [`jugador-${jugadorId}`]: false }));
        }
    };

    const eliminarJugador = async (jugadorId) => {
        if (!window.confirm('¿Eliminar este jugador del torneo?')) return;
        
        try {
            const resultado = await torneosWarmasterApi.eliminarJugadorTorneo(torneoId, jugadorId);

            console.log ('eliminar', resultado)
            alert('✅ Jugador eliminado');
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="vista-jugadores">
                <div className="empty-message">
                    ⏳ Cargando...
                </div>
            </div>
        );
    }

    if (tipoTorneo === 'Individual') {
        return (
            <div className="vista-jugadores">
                <h2>👥 Jugadores Inscritos ({jugadores.length})</h2>
                
                {jugadores.length === 0 ? (
                    <div className="empty-message">
                        <p>📭 No hay jugadores inscritos todavía</p>
                    </div>
                ) : (
                    <div className="tabla-jugadores-container">
                        <table className="tabla-jugadores-detalle">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Jugador</th>
                                    <th>Club</th>
                                    <th>Ejercito</th>
                                    <th>Pago</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jugadores.map((jugador, index) => {
                        
                                    const isPagado = jugador.pagado === 'pagado' || jugador.pagado === 1 || jugador.pagado === true;
                                    const isLoadingPago = loadingPago[`jugador-${jugador.id}`];

                                    return (
                                        <tr key={jugador.id}>
                                            <td>{index + 1}</td>
                                            <td className="nombre-jugador-completo">
                                                {jugador.jugador_nombre} {jugador.jugador_apellidos}
                                            </td>
                                            <td>{jugador.club || '-'}</td>
                                            <td>{jugador.ejercito || '-'}</td>
                                            <td>
                                                <button
                                                    onClick={() => cambiarEstadoPagoJugador(jugador.id, jugador.pagado)}
                                                    className={`btn-pago ${isPagado ? 'pagado' : 'pendiente'}`}
                                                    disabled={isLoadingPago}
                                                    title={isPagado ? 'Marcar como pendiente' : 'Marcar como pagado'}
                                                >
                                                    {isLoadingPago ? '⏳' : (isPagado ? '✅ Pagado' : '⏰ Pendiente')}
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => eliminarJugador(jugador.jugador_id)}
                                                    className="btn-danger-small"
                                                >
                                                    🗑️ Eliminar
                                                </button>
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
}

export default VistaJugadoresWarmaster;