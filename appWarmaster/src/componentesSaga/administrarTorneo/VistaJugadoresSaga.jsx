import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '@/servicios/apiSaga';
import AnadirParticipantesTorneos from '@/componente/vistasAdministrarTorneos/AnadirParticipantesTorneos';

import '@/estilos/vistasTorneos/vistaJugadores.css';

function VistaJugadoresSaga({ torneoId: propTorneoId, torneo, tipoTorneo, jugadores: propJugadores, equipos: propEquipos, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    
    const [jugadores, setJugadores] = useState(propJugadores || []);
    const [equipos, setEquipos] = useState(propEquipos || []);
    const [loading, setLoading] = useState(false);
    const [loadingPago, setLoadingPago] = useState({});
    const [loadingReenvio, setLoadingReenvio] = useState(false)
    const [mostrarModalAnadir, setMostrarModalAnadir] = useState(false);

    useEffect(() => {
        if (!propJugadores && !propEquipos) {
            cargarDatos();
        }
    }, [torneoId, tipoTorneo]);

    useEffect(() => {
       if (propJugadores) {
            const jugadoresNormalizados = propJugadores.map(j => ({
                ...j,
                pagado: j.pagado === 1 || j.pagado === '1' ? 'pagado' : 'pendiente'
            }));
            setJugadores(jugadoresNormalizados);
        }
        if (propEquipos) setEquipos(propEquipos);
    }, [propJugadores, propEquipos]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            if (tipoTorneo === 'Individual') {
                const data = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                 const jugadoresArray = Array.isArray(data) ? data : data.data || [];

                const jugadoresNormalizados = jugadoresArray.map(jugador => ({
                    ...jugador,
                    pagado: jugador.pagado === 1 || jugador.pagado === '1' ? 'pagado' : 'pendiente'
                }));
                
                setJugadores(jugadoresNormalizados);
            } else if (tipoTorneo === 'Por equipos') {
                const response = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                const equiposData = response.data || response || [];
                setEquipos(Array.isArray(equiposData) ? equiposData : []);
                
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
            const resultado = await torneosSagaApi.eliminarJugadorTorneo(torneoId, jugadorId);

            console.warn ('eliminar', resultado)
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

    const reenviarTodasLasInvitaciones = async () => {
        const totalEquipos = equipos.length;
        
        const confirmar = window.confirm(
            `⚠️ REENVÍO MASIVO DE INVITACIONES ⚠️\n\n` +
            `Se reenviarán las invitaciones a TODOS los equipos del torneo (${totalEquipos} equipos).\n\n` +
            `Esto enviará emails a:\n` +
            `• Usuarios registrados (notificación)\n` +
            `• Usuarios pendientes de registro (invitación)\n\n` +
            `¿Estás seguro de continuar?`
        );
        
        if (!confirmar) return;

        try {
            setLoadingReenvio(true);
            
            const response = await torneosSagaApi.reenviarInscripcionTodosEquipos(torneoId);
            
            if (response.success) {
                const { totales, resultadosPorEquipo } = response.data;
                
                let mensaje = `✅ ${response.message}\n\n`;
                mensaje += `═══════════════════════════════\n`;
                mensaje += `📊 RESUMEN GENERAL\n`;
                mensaje += `═══════════════════════════════\n`;
                mensaje += `🏆 Equipos procesados: ${totales.emailsEnviados > 0 ? totalEquipos : 0}\n`;
                mensaje += `📧 Total emails enviados: ${totales.emailsEnviados}\n`;
                mensaje += `❌ Total emails fallidos: ${totales.emailsFallidos}\n`;
                mensaje += `🆕 Pendientes de registro: ${totales.pendientesRegistro}\n`;
                mensaje += `✔️ Ya registrados: ${totales.registrados}\n\n`;
                
                mensaje += `═══════════════════════════════\n`;
                mensaje += `📋 DETALLE POR EQUIPO\n`;
                mensaje += `═══════════════════════════════\n`;
                
                resultadosPorEquipo.forEach(resultado => {
                    mensaje += `\n🏆 ${resultado.equipo}:\n`;
                    mensaje += `  ✅ Enviados: ${resultado.emailsEnviados}\n`;
                    mensaje += `  ❌ Fallidos: ${resultado.emailsFallidos}\n`;
                    mensaje += `  🆕 Pendientes: ${resultado.pendientesRegistro}\n`;
                    mensaje += `  ✔️ Registrados: ${resultado.registrados}\n`;
                    
                    if (resultado.emailsFallidos > 0 && resultado.detalles?.errores?.length > 0) {
                        mensaje += `  ⚠️ Errores:\n`;
                        resultado.detalles.errores.forEach(email => {
                            mensaje += `    - ${email}\n`;
                        });
                    }
                });
                
                alert(mensaje);
            }
        } catch (error) {
            console.error('Error al reenviar todas las invitaciones:', error);
            alert(`❌ Error al reenviar invitaciones:\n${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionEquipo = async (equipo) => {

        if (!equipo || !equipo.id) {
            alert('❌ Error: datos del equipo no disponibles');
            return;
        }
        
        const confirmar = window.confirm(
            `¿Reenviar invitaciones a todos los miembros del equipo "${equipo.nombre_equipo}"?\n\n` +
            `Se enviará un email a cada miembro (tanto a usuarios registrados como pendientes de registro).`
        );
        
        if (!confirmar) return;

        try {
            setLoadingReenvio(true);
            
            const response = await torneosSagaApi.reenviarInscripcionEquipo(torneoId, equipo.id);
            
            if (response.success) {
                const { emails, detalles } = response.data;
                
                let mensaje = `✅ ${response.message}\n\n`;
                mensaje += `📧 Emails enviados: ${emails.enviados}\n`;
                mensaje += `❌ Emails fallidos: ${emails.fallidos}\n`;
                mensaje += `🆕 Pendientes de registro: ${emails.pendientesRegistro}\n`;
                mensaje += `✔️ Ya registrados: ${emails.registrados}\n`;
                
                if (emails.fallidos > 0) {
                    mensaje += `\n⚠️ Emails con error:\n`;
                    detalles.errores.forEach(error => {
                        mensaje += `  - ${error.nombre} (${error.email})\n`;
                    });
                }
                
                alert(mensaje);
            }
        } catch (error) {
            console.error('Error al reenviar invitaciones:', error);
            alert(`❌ Error al reenviar invitaciones:\n${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionTodosJugadores = async () => {
        if (jugadores.length === 0) {
            alert('❌ No hay jugadores para reenviar invitaciones');
            return;
        }

        const confirmar = window.confirm(
            `⚠️ REENVÍO MASIVO DE INVITACIONES ⚠️\n\n` +
            `Se reenviarán las invitaciones a TODOS los jugadores del torneo (${jugadores.length} jugadores).\n\n` +
            `Usuarios registrados recibirán notificación.\n` +
            `Usuarios pendientes de registro recibirán invitación.\n\n` +
            `¿Estás seguro de continuar?`
        );

        if (!confirmar) return;

        try {
            setLoadingReenvio(true);

            const response = await torneosSagaApi.reenviarInscripcionTodosJugadores(torneoId);

            if (response.success) {
                const { totales, resultadosPorJugador } = response.data;

                let mensaje = `✅ ${response.message}\n\n`;
                mensaje += `📊 RESUMEN GENERAL\n`;
                mensaje += `• Total emails enviados: ${totales.enviados}\n`;
                mensaje += `• Fallidos: ${totales.fallidos}\n`;
                mensaje += `• Pendientes de registro: ${totales.pendientesRegistro}\n`;
                mensaje += `• Registrados: ${totales.registrados}\n\n`;

                mensaje += `📋 DETALLE POR JUGADOR\n`;
                resultadosPorJugador.forEach(j => {
                    mensaje += `\n👤 ${j.nombre}:\n`;
                    mensaje += `  ✅ Enviado: ${j.enviado ? 'Sí' : 'No'}\n`;
                    mensaje += `  ⚠️ Error: ${j.error || '-' }\n`;
                });

                alert(mensaje);
            }
        } catch (error) {
            console.error('Error al reenviar invitaciones a todos los jugadores:', error);
            alert(`❌ Error al reenviar invitaciones:\n${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionIndividual = async (jugador) => {
        if (!jugador || !jugador.id) {
            alert('❌ Error: datos del jugador no disponibles');
            return;
        }

        const confirmar = window.confirm(
            `¿Reenviar invitación al jugador "${jugador.jugador_nombre} ${jugador.jugador_apellidos}"?\n\n` +
            `Se enviará un email a su dirección: ${jugador.email || 'No disponible'}`
        );

        if (!confirmar) return;

        try {
            setLoadingReenvio(true);

            const response = await torneosSagaApi.reenviarInscripcionJugador(torneoId, jugador.id);

            if (response.success) {
                alert(`✅ Invitación reenviada correctamente a ${jugador.jugador_nombre} ${jugador.jugador_apellidos}`);
            } else {
                alert(`❌ No se pudo reenviar la invitación:\n${response.message}`);
            }
        } catch (error) {
            console.error('Error al reenviar invitación individual:', error);
            alert(`❌ Error al reenviar invitación:\n${error.message}`);
        } finally {
            setLoadingReenvio(false);
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
                <div className="header-jugadores-con-boton">
                    <h2>👥 Jugadores Inscritos ({jugadores.length})</h2>
                    {torneoId.estado === 'pendiente' && (
                        <>
                            <button 
                                className="btn-primary"
                                onClick={() => setMostrarModalAnadir(true)}
                            >
                                Invitar Jugador
                            </button>
                            <button 
                                className="btn-secondary-small"
                                onClick={reenviarInvitacionTodosJugadores}
                            >
                               {loadingReenvio ? '⏳ Enviando...' : '📧 Reenviar Invitaciones'}
                            </button>
                        </>
                    )}
                </div>
               
                {jugadores.length === 0 ? (
                    <div className="empty-message">
                        <p>📭 No hay jugadores inscritos todavía</p>
                        <button 
                            className="btn-primary"
                            onClick={() => setMostrarModalAnadir(true)}
                        >
                            ➕ Invitar Primer Jugador
                        </button>
                    </div>
                ) : (
                    <div className="tabla-jugadores-container">
                        <table className="tabla-jugadores-detalle">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Jugador</th>
                                    <th>Alias</th>
                                    <th>Club</th>
                                    <th>Época</th>
                                    <th>Facción</th>
                                    <th>Puntos</th>
                                     <th>Pago</th>
                                    {torneo?.estado === 'pendiente'&& <th>Acciones</th>}
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
                                            <td>{jugador.nombre_alias || '-'}</td>
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
                                                {torneo?.estado === 'pendiente' && (
                                                    <>
                                                        <button 
                                                            className="btn-secondary-small"
                                                            onClick={() => reenviarInvitacionIndividual(jugador)}
                                                            disabled={loadingReenvio}
                                                            title="Reenviar invitación al jugador"
                                                            style={{ marginRight: '5px' }}
                                                        >
                                                            {loadingReenvio ? '⏳' : '📧'}
                                                        </button>
                                                        <button
                                                            onClick={() => eliminarJugador(jugador.jugador_id)}
                                                            className="btn-danger-small"
                                                        >
                                                            🗑️ Eliminar
                                                        </button>
                                                    </>
                                                )}
                                               
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* MODAL AÑADIR JUGADOR */}
                {mostrarModalAnadir && (
                    <div className="modal-overlay" onClick={() => setMostrarModalAnadir(false)}>
                        <div className="modal-content-anadir" onClick={(e) => e.stopPropagation()}>
                            <AnadirParticipantesTorneos
                                torneoId={torneoId}
                                onClose={() => setMostrarModalAnadir(false)}
                                onSuccess={async () => {
                                    setMostrarModalAnadir(false);
                                    await cargarDatos();
                                    if (onUpdate) onUpdate();
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // VISTA DE EQUIPOS
    return (
        <div className="vista-jugadores">
            <div className="header-jugadores-con-boton">
                <h2>👥 Equipos Inscritos ({equipos.length})</h2>
                {torneo?.estado === 'pendiente' && (
                        <>
                            <button 
                                className="btn-primary"
                                onClick={() => setMostrarModalAnadir(true)}
                                disabled={loadingReenvio}
                            >
                                Invitar Equipo
                            </button>
                            <button 
                                className="btn-secondary-small"
                                onClick={reenviarTodasLasInvitaciones}
                                disabled={loadingReenvio}
                                title="Reenviar invitaciones a todos los equipos"
                            >
                                {loadingReenvio ? ' Enviando...' : 'Reenviar Invitaciones'}
                            </button>
                        </>
                        )}
                </div>
            {equipos.length === 0 ? (
                <div className="empty-message">
                    <p>📭 No hay equipos inscritos todavía</p>
                    <button 
                        className="btn-primary"
                        onClick={() => setMostrarModalAnadir(true)}
                    >
                        ➕ Invitar Primer Equipo
                    </button>
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
                                    {torneo?.estado === 'pendiente' && (
                                        <>
                                            <button 
                                                className="btn-primary"
                                                onClick={() => reenviarInvitacionEquipo(equipo)}
                                                disabled={loadingReenvio}
                                                title="Reenviar invitaciones al equipo"
                                            >
                                                {loadingReenvio ? ' Enviando...' : 'Reenviar Invitaciones'}
                                            </button>
                                            <button
                                                onClick={() => eliminarEquipo(equipo.id)}
                                                className="btn-danger-small"
                                            >
                                                🗑️ Eliminar Equipo
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL AÑADIR EQUIPO */}
            {mostrarModalAnadir && (
                <div className="modal-overlay" onClick={() => setMostrarModalAnadir(false)}>
                    <div className="modal-content-anadir" onClick={(e) => e.stopPropagation()}>
                        <AnadirParticipantesTorneos
                            torneoId={torneoId}
                            onClose={() => setMostrarModalAnadir(false)}
                            onSuccess={async () => {
                                setMostrarModalAnadir(false);
                                await cargarDatos();
                                if (onUpdate) onUpdate();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default VistaJugadoresSaga;