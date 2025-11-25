import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '@/servicios/apiSaga';

import '@/estilos/vistasTorneos/VistaJugadores.css';

function VistaJugadoresSaga({ torneoId: propTorneoId, tipoTorneo, jugadores: propJugadores, equipos: propEquipos, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    
    const [jugadores, setJugadores] = useState(propJugadores || []);
    const [equipos, setEquipos] = useState(propEquipos || []);
    const [loading, setLoading] = useState(false);
    const [loadingPago, setLoadingPago] = useState({});

    useEffect(() => {
        if (!propJugadores && !propEquipos) {
            cargarDatos();
        }
    }, [torneoId, tipoTorneo]);

    useEffect(() => {
        if (propJugadores) setJugadores(propJugadores);
        if (propEquipos) setEquipos(propEquipos);
    }, [propJugadores, propEquipos]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            if (tipoTorneo === 'Individual') {
                const data = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                setJugadores(Array.isArray(data) ? data : data.data || []);
            } else if (tipoTorneo === 'Por equipos') {
                const data = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                setEquipos(Array.isArray(data) ? data : data.data || []);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstadoPagoJugador = async (jugadorId, estadoActual) => {
        const nuevoEstado = estadoActual === 'pagado' ? 'pendiente' : 'pagado';

        const confirmar = window.confirm(
            `¿Cambiar estado de pago a "${nuevoEstado.toUpperCase()}"?`
        );
        
        if (!confirmar) return;
            
        try {
            setLoadingPago(prev => ({ ...prev, [`jugador-${jugadorId}`]: true }));
            
            await torneosSagaApi.actualizarPagoJugador(torneoId, jugadorId, nuevoEstado);
            
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

    const cambiarEstadoPagoEquipo = async (equipoId, estadoActual) => {
    const nuevoEstado = estadoActual === 'pagado' ? 'pendiente' : 'pagado';
    
    const confirmar = window.confirm(
        `¿Cambiar estado de pago del equipo a "${nuevoEstado.toUpperCase()}"?`
    );
    
    if (!confirmar) return;
    
    try {
        setLoadingPago(prev => ({ ...prev, [`equipo-${equipoId}`]: true }));
    
        const response = await torneosSagaApi.actualizarPagoEquipo(torneoId, equipoId, nuevoEstado);
        
        console.log('✅ Respuesta del servidor:', response);
        
        // Actualizar el estado local
        setEquipos(prev => {
                  
            const nuevosEquipos = prev.map(e => {
                             
                if (e.id === equipoId) {
                    return { ...e, pagado: nuevoEstado };
                }
                // Probar también con conversión a número
                if (String(e.id) === String(equipoId)) {
                    return { ...e, pagado: nuevoEstado };
                }
                return e;
            });
            
            return nuevosEquipos;
        });
        
        alert(`✅ Estado de pago actualizado a: ${nuevoEstado.toUpperCase()}`);
        
        if (onUpdate) onUpdate();
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
        setLoadingPago(prev => ({ ...prev, [`equipo-${equipoId}`]: false }));
    }
};

    const eliminarJugador = async (jugadorId) => {
        if (!window.confirm('¿Eliminar este jugador del torneo?')) return;
        
        try {
            await torneosSagaApi.eliminarJugadorTorneo(torneoId, jugadorId);
            alert('✅ Jugador eliminado');
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const eliminarEquipo = async (equipoId) => {
        if (!window.confirm('¿Eliminar este equipo del torneo?')) return;
        
        try {
            await torneosSagaApi.eliminarEquipoTorneo(torneoId, equipoId);
            alert('✅ Equipo eliminado');
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
                                    <th>Época</th>
                                    <th>Facción</th>
                                    <th>Puntos</th>
                                    <th>Pago</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jugadores.map((jugador, index) => {
                                    let composicion = {};
                                    if (jugador.composicion_ejercito) {
                                        try {
                                            composicion = JSON.parse(jugador.composicion_ejercito);
                                        } catch (e) {
                                            console.error('Error al parsear composición del jugador:', e);
                                            composicion = {};
                                        }
                                    }
                                    const totalPuntos = 
                                        (parseFloat(composicion.guardias) || 0) +
                                        (parseFloat(composicion.guerreros) || 0) +
                                        (parseFloat(composicion.levas) || 0) +
                                        (parseFloat(composicion.mercenarios) || 0);

                                    const isPagado = jugador.pagado === 'pagado';
                                    const isLoadingPago = loadingPago[`jugador-${jugador.id}`];

                                    return (
                                        <tr key={jugador.id}>
                                            <td>{index + 1}</td>
                                            <td className="nombre-jugador-completo">
                                                {jugador.jugador_nombre} {jugador.jugador_apellidos}
                                            </td>
                                            <td>{jugador.club || '-'}</td>
                                            <td>{jugador.epoca || '-'}</td>
                                            <td>{jugador.faccion || '-'}</td>
                                            <td>{totalPuntos.toFixed(1)}</td>
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
                                                    onClick={() => eliminarJugador(jugador.id)}
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

    // VISTA DE EQUIPOS
    return (
        <div className="vista-jugadores">
            <h2>👥 Equipos Inscritos ({equipos.length})</h2>
            
            {equipos.length === 0 ? (
                <div className="empty-message">
                    <p>📭 No hay equipos inscritos todavía</p>
                </div>
            ) : (
                <div className="grid-equipos-admin">
                    {equipos.map((equipo) => {
                        const isPagado = equipo.pagado === 'pagado';
                        const isLoadingPago = loadingPago[`equipo-${equipo.id}`];

                        return (
                            <div key={equipo.id} className="card-equipo-admin">
                                <div className="equipo-header-admin">
                                    <h3>🏆 {equipo.nombre_equipo}</h3>
                                    <span className="badge-capitan-admin">
                                        👑 {equipo.capitan_nombre} {equipo.capitan_apellidos}
                                    </span>
                                </div>

                                <div className="equipo-miembros-admin">
                                    <h4>Miembros ({(equipo.miembros || []).length}):</h4>
                                    {(equipo.miembros || []).length > 0 ? (
                                        <ul className="lista-miembros-admin">
                                            {equipo.miembros.map((miembro, idx) => {
                                                const comp = miembro.composicion || {};
                                                const totalPuntos = 
                                                    (parseFloat(comp.guardias) || 0) +
                                                    (parseFloat(comp.guerreros) || 0) +
                                                    (parseFloat(comp.levas) || 0) +
                                                    (parseFloat(comp.mercenarios) || 0);

                                                return (
                                                    <li key={idx} className="miembro-item-admin">
                                                        <div className="miembro-header-admin">
                                                            <span className="miembro-nombre-admin">
                                                                {miembro.es_capitan && '👑 '}
                                                                {miembro.nombre}
                                                            </span>
                                                            <span className="miembro-epoca-banda-admin">
                                                                {miembro.epoca} - {miembro.banda}
                                                            </span>
                                                        </div>
                                                        
                                                        {Object.keys(comp).length > 0 && (
                                                            <div className="miembro-composicion-admin">
                                                                <div className="puntos-total-admin">
                                                                    <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
                                                                </div>
                                                                <div className="puntos-detalle-admin">
                                                                    <span>Guardias: {parseFloat(comp.guardias) || 0}</span>
                                                                    <span>Guerreros: {parseFloat(comp.guerreros) || 0}</span>
                                                                    <span>Levas: {parseFloat(comp.levas) || 0}</span>
                                                                    <span>Mercenarios: {parseFloat(comp.mercenarios) || 0}</span>
                                                                </div>
                                                                {comp.detalleMercenarios && (
                                                                    <div className="detalle-mercenarios-mini-admin">
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
                                        <p className="sin-miembros-admin">Sin miembros</p>
                                    )}
                                </div>

                                <div className="equipo-acciones-admin">
                                    <button
                                        onClick={() => cambiarEstadoPagoEquipo(equipo.id, equipo.pagado)}
                                        className={`btn-pago ${isPagado ? 'pagado' : 'pendiente'}`}
                                        disabled={isLoadingPago}
                                        title={isPagado ? 'Marcar como pendiente' : 'Marcar como pagado'}
                                    >
                                        {isLoadingPago ? '⏳' : (isPagado ? '✅ Pagado' : '⏰ Pendiente')}
                                    </button>
                                    
                                    <button
                                        onClick={() => eliminarEquipo(equipo.id)}
                                        className="btn-danger-small"
                                    >
                                        🗑️ Eliminar Equipo
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default VistaJugadoresSaga;