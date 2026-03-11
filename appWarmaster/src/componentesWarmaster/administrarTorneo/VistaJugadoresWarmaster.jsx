import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosWarmasterApi from '@/servicios/apiWarmaster';
import AnadirParticipantesTorneos from '@/componente/vistasAdministrarTorneos/AnadirParticipantesTorneos';

import '@/estilos/vistasTorneos/vistaJugadores.css';

function VistaJugadoresWarmaster({ torneoId: propTorneoId, torneo, jugadores: propJugadores, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    
    const [jugadores, setJugadores] = useState(propJugadores || []);
    const [loading, setLoading] = useState(false);
    const [loadingPago, setLoadingPago] = useState({});
    const [loadingReenvio, setLoadingReenvio] = useState(false);
    const [loadingLista, setLoadingLista] = useState({});
    const [mostrarModalAnadir, setMostrarModalAnadir] = useState(false);

    useEffect(() => {
        if (!propJugadores) {
            cargarDatos();
        }
    }, [torneoId]);

    useEffect(() => {
        if (propJugadores) {
            const jugadoresNormalizados = propJugadores.map(j => ({
                ...j,
                pagado: j.pagado === 1 || j.pagado === '1' ? 'pagado' : 'pendiente'
            }));
            setJugadores(jugadoresNormalizados);
        }
    }, [propJugadores]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const { data } = await torneosWarmasterApi.obtenerJugadoresTorneo(torneoId);
            
            const jugadoresNormalizados = data.map(jugador => ({
                ...jugador,
                pagado: jugador.pagado === 1 || jugador.pagado === '1' ? 'pagado' : 'pendiente'
            }));
            
            setJugadores(jugadoresNormalizados);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const verListaPDF = async (jugadorId, nombreJugador) => {
        try {
            setLoadingLista(prev => ({ ...prev, [jugadorId]: true }));
            
            await torneosWarmasterApi.verListaPDFJugador(torneoId, jugadorId);
            
        } catch (error) {
            console.error('Error al visualizar lista:', error);
            alert(`❌ Error al abrir la lista de ${nombreJugador}`);
        } finally {
            setLoadingLista(prev => ({ ...prev, [jugadorId]: false }));
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
            await torneosWarmasterApi.eliminarJugadorTorneo(torneoId, jugadorId);
            alert('✅ Jugador eliminado');
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
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

            const response = await torneosWarmasterApi.reenviarInscripcionTodosJugadores(torneoId);

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
                    mensaje += `  ⚠️ Error: ${j.error || '-'}\n`;
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

            const response = await torneosWarmasterApi.reenviarInscripcionJugador(torneoId, jugador.id);

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

    const confirmarTodosLosPagos = async () => {
        const jugadoresPendientes = jugadores.filter(j => j.pagado !== 'pagado');
                
        if (jugadoresPendientes.length === 0) {
            alert('✅ Todos los jugadores ya tienen el pago confirmado');
            return;
        }
        
        const confirmar = window.confirm(
            `¿Marcar como PAGADO a los ${jugadoresPendientes.length} jugadores pendientes?`
        );
        if (!confirmar) return;
        
            try {
                setLoading(true);
                await Promise.all(
                    jugadoresPendientes.map(j =>                            
                        torneosWarmasterApi.actualizarPagoJugador(torneoId, j.id, 'pagado')
                    )
                );
                setJugadores(prev => prev.map(j => ({ ...j, pagado: 'pagado' })));
                if (onUpdate) onUpdate();
                alert(`✅ ${jugadoresPendientes.length} pagos confirmados`);
            } catch (error) {
                console.error('Error:', error);
                alert(`❌ Error: ${error.message}`);
            } finally {
                setLoading(false);
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

    return (
        <div className="vista-jugadores">
            <div className="header-jugadores-con-boton">
                <h2>👥 Jugadores Inscritos ({jugadores.length})</h2>
                {torneo?.estado === 'pendiente' && (
                    <>
                        <button 
                            className="btn-primary"
                            onClick={() => setMostrarModalAnadir(true)}
                        >
                            ➕ Invitar Jugador
                        </button>
                        <button 
                            className="btn-secondary-small"
                            onClick={reenviarInvitacionTodosJugadores}
                            disabled={loadingReenvio}
                        >
                            {loadingReenvio ? '⏳ Enviando...' : '📧 Reenviar Invitaciones'}
                        </button>
                        <button 
                            className="btn-secondary-small"
                            onClick={confirmarTodosLosPagos}
                            disabled={loading}
                        >
                            {loading ? '⏳ Procesando...' : '💰 Confirmar Todos los Pagos'}
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
                                <th>Nombre Ejercito</th>
                                <th>Facción</th>
                                <th>Lista</th>
                                <th>Pago</th>
                                {torneo?.estado === 'pendiente' && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {jugadores.map((jugador, index) => {
                                const isPagado = jugador.pagado === 'pagado';
                                const isLoadingPago = loadingPago[`jugador-${jugador.id}`];
                                const tieneLista = jugador.lista_ejercito && jugador.lista_nombre; 
                                const isLoadingListaPDF = loadingLista[jugador.jugador_id]

                                return (
                                    <tr key={jugador.id}>
                                        <td>{index + 1}</td>
                                        <td className="nombre-jugador-completo">
                                            {jugador.jugador_nombre} {jugador.jugador_apellidos}
                                        </td>
                                        <td>{jugador.nombre_alias || '-'}</td>
                                        <td>{jugador.club || '-'}</td>
                                        <td>{jugador.nombre_ejercito || '-'}</td>
                                        <td>{jugador.ejercito || '-'}</td>
                                        <td>
                                            {tieneLista ? (
                                                <div className="lista-actions">
                                                    <span 
                                                        className="badge-tiene-lista" 
                                                        title={jugador.lista_nombre || 'PDF cargado'}
                                                    >
                                                        ✅ PDF {jugador.lista_tamaño ? `(${(jugador.lista_tamaño / 1024).toFixed(0)} KB)` : ''}
                                                    </span>
                                                    {/* ✅ BOTÓN NUEVO PARA VER PDF */}
                                                    <button
                                                        className="btn-ver-lista"
                                                        onClick={() => verListaPDF(
                                                            jugador.jugador_id, 
                                                            `${jugador.jugador_nombre} ${jugador.jugador_apellidos}`
                                                        )}
                                                        disabled={isLoadingListaPDF}
                                                        title="Ver lista en el navegador"
                                                    >
                                                        {isLoadingListaPDF ? '⏳' : '👁️'}
                                                    </button>
                                                </div>
                                            ) : (
                                                    <span className="badge-sin-lista">❌ Sin lista</span>
                                                )}
                                        </td>
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
                                        {torneo?.estado === 'pendiente' && (
                                            <td>
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
                                                    🗑️
                                                </button>
                                            </td>
                                        )}
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
                            sistema="WARMASTER"
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

export default VistaJugadoresWarmaster;